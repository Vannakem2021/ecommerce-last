import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Order from "@/lib/db/models/order.model";
import { abaPayWayService } from "@/lib/aba-payway";
import { abaPayWayStatusService } from "@/lib/aba-payway-status";
import { abaPayWayAutoStatusService } from "@/lib/aba-payway-auto-status";
import { updateOrderToPaid } from "@/lib/actions/order.actions";
import { ABA_PAYWAY_STATUS_CODES } from "@/types/aba-payway";
import {
  ABAPayWayErrorHandler,
  createABAError,
  parseABAError,
  withABARetry,
  logABAError,
} from "@/lib/aba-payway-error-handler";

// Enhanced callback processing with retry mechanism
async function processCallbackWithRetry(
  callbackParams: Record<string, string | number>,
  maxRetries = 3
): Promise<NextResponse> {
  return await withABARetry(
    () => processCallback(callbackParams),
    maxRetries,
    1000 // 1 second base delay
  );
}

// Main callback processing logic
async function processCallback(
  callbackParams: Record<string, string | number>
): Promise<NextResponse> {
  console.log("[ABA PayWay] Processing callback:", {
    tran_id: callbackParams.tran_id,
    status: callbackParams.status,
    amount: callbackParams.apv,
    timestamp: new Date().toISOString(),
  });

  // Verify the callback signature
  if (!abaPayWayService.verifyCallback(callbackParams as any)) {
    const error = createABAError("INVALID_SIGNATURE", { callbackParams });
    logABAError(error, "Callback signature verification", {
      tran_id: callbackParams.tran_id,
    });
    throw error;
  }

  // Extract key parameters
  const { tran_id, status, apv: approvedAmount } = callbackParams;
  const statusCode = parseInt(status as string);

  // Connect to database
  await connectToDatabase();

  // Find the order by merchant reference number or transaction ID
  const order = await Order.findOne({
    $or: [
      { abaMerchantRefNo: tran_id },
      { _id: tran_id }, // Fallback if tran_id is the order ID
    ],
  });

  if (!order) {
    const error = createABAError("ORDER_NOT_FOUND", { tran_id });
    logABAError(error, "Order lookup", { tran_id });
    throw error;
  }

  // Check if order is already paid
  if (order.isPaid) {
    console.log("[ABA PayWay] Order already paid:", order._id);
    return NextResponse.json({ message: "Order already processed" });
  }

  // Get status string and description
  const statusString = abaPayWayStatusService.getStatusString(statusCode);
  const statusDescription =
    abaPayWayStatusService.getStatusDescription(statusCode);

  // Create status history entry
  const statusEntry = {
    status: statusString,
    statusCode: statusCode,
    timestamp: new Date(),
    source: "callback" as const,
    details: `Callback received with status ${statusCode}: ${statusDescription}`,
  };

  // Process payment based on status
  if (statusCode === ABA_PAYWAY_STATUS_CODES.SUCCESS) {
    // Verify the amount matches
    const orderAmount = parseFloat(order.totalPrice.toFixed(2));
    const paidAmount = parseFloat(approvedAmount as string);

    if (Math.abs(orderAmount - paidAmount) > 0.01) {
      console.error("[ABA PayWay] Amount mismatch:", {
        expected: orderAmount,
        received: paidAmount,
        orderId: order._id,
      });

      // Add error to status entry
      statusEntry.details = `Amount mismatch: expected ${orderAmount}, received ${paidAmount}`;

      // Update order with error status
      await Order.findByIdAndUpdate(order._id, {
        $set: {
          abaPaymentStatus: "failed",
          abaStatusCode: statusCode,
          abaCallbackReceived: true,
          abaTransactionId: tran_id as string,
        },
        $push: {
          abaStatusHistory: statusEntry,
        },
      });

      const error = createABAError("AMOUNT_MISMATCH", {
        expected: orderAmount,
        received: paidAmount,
        orderId: order._id,
      });
      logABAError(error, "Amount verification", {
        orderId: order._id,
        tran_id,
      });
      throw error;
    }

    // Update payment result
    order.paymentResult = {
      id: tran_id as string,
      status: "COMPLETED",
      email_address: (order.user as any)?.email || "",
      pricePaid: paidAmount.toFixed(2),
    };
    await order.save();

    // Mark order as paid using the existing function with retry
    try {
      await updateOrderToPaid(order._id);
      console.log("[ABA PayWay] Payment successful for order:", order._id);
    } catch (error) {
      console.error("[ABA PayWay] Error updating order:", error);
      throw new Error("Failed to update order to paid status");
    }
  } else {
    // Payment failed or cancelled
    console.log("[ABA PayWay] Payment failed/cancelled:", {
      orderId: order._id,
      status: statusCode,
      tran_id,
    });

    // Update payment result with failure
    order.paymentResult = {
      id: tran_id as string,
      status:
        statusCode === ABA_PAYWAY_STATUS_CODES.CANCELLED
          ? "CANCELLED"
          : "FAILED",
      email_address: (order.user as any)?.email || "",
      pricePaid: "0.00",
    };
    await order.save();
  }

  // Update order with enhanced status tracking
  await Order.findByIdAndUpdate(order._id, {
    $set: {
      abaPaymentStatus: statusString,
      abaStatusCode: statusCode,
      abaCallbackReceived: true,
      abaTransactionId: tran_id as string,
    },
    $push: {
      abaStatusHistory: statusEntry,
    },
  });

  // Stop automatic polling since we received a callback
  try {
    abaPayWayAutoStatusService.stopPollingForOrder(order._id.toString());
    console.log(
      `[ABA PayWay] Stopped auto-polling for order ${order._id} after callback`
    );
  } catch (error) {
    console.error(
      `[ABA PayWay] Error stopping auto-polling for order ${order._id}:`,
      error
    );
    // Don't fail callback processing if stopping polling fails
  }

  // Return success response to ABA PayWay
  return NextResponse.json({
    message: "Callback processed successfully",
    orderId: order._id,
    status:
      statusCode === ABA_PAYWAY_STATUS_CODES.SUCCESS ? "success" : "failed",
  });
}

export async function POST(req: NextRequest) {
  let callbackParams: Record<string, string | number> = {};

  try {
    // Parse the callback data from ABA PayWay
    const formData = await req.formData();

    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      callbackParams[key] = value.toString();
    }

    // Process callback with retry mechanism
    return await processCallbackWithRetry(callbackParams);
  } catch (error) {
    const abaError = parseABAError(error);
    logABAError(abaError, "Callback processing", {
      callbackKeys: Object.keys(callbackParams),
      tran_id: callbackParams.tran_id,
    });

    return ABAPayWayErrorHandler.createResponse(abaError);
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
