import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Order from "@/lib/db/models/order.model";
import { abaPayWayStatusService } from "@/lib/aba-payway-status";
import { updateOrderToPaid } from "@/lib/actions/order.actions";
import { ABA_PAYWAY_STATUS_CODES } from "@/types/aba-payway";

export async function POST(req: NextRequest) {
  // Log ALL callback attempts (even before parsing)
  console.log("[ABA PayWay] Callback attempt received:", {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.headers.get("user-agent"),
    contentType: req.headers.get("content-type"),
    ip:
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown",
    origin: req.headers.get("origin"),
    referer: req.headers.get("referer"),
  });

  try {
    // Parse the callback data from ABA PayWay (they send JSON, not form data)
    const contentType = req.headers.get("content-type") || "";
    let callbackParams: Record<string, any> = {};

    if (contentType.includes("application/json")) {
      callbackParams = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      callbackParams = Object.fromEntries(new URLSearchParams(text));
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      callbackParams = Object.fromEntries(
        Array.from(formData.entries()).map(([k, v]) => [k, String(v)])
      );
    } else {
      // Best-effort JSON parse
      try {
        callbackParams = await req.json();
      } catch {
        // Ignore parsing errors
      }
    }

    // Enhanced logging for debugging
    console.log("[ABA PayWay] Callback data parsed successfully:", {
      timestamp: new Date().toISOString(),
      contentType: contentType,
      allParams: callbackParams, // Log all parameters for debugging
      tran_id: callbackParams.tran_id,
      status: callbackParams.status,
      apv: callbackParams.apv, // This is approval code, not amount
      paramCount: Object.keys(callbackParams).length,
    });

    // NOTE: ABA PayWay pushback does NOT include a hash for verification
    // The pushback only contains tran_id, apv (approval code), and status
    // Do not attempt signature verification on pushback data
    console.log(
      "[ABA PayWay] Processing pushback (no signature verification needed)"
    );

    // Extract key parameters
    const { tran_id, status, apv } = callbackParams;

    // Validate required parameters
    if (!tran_id) {
      console.error("[ABA PayWay] Missing tran_id in pushback");
      return NextResponse.json({ received: true, error: "missing tran_id" });
    }

    // Normalize status (0 or "0" for success, "00" for Payment Link success)
    const normalizeSuccess = (status: string | number | undefined) => {
      if (status === undefined || status === null) return false;
      const s = String(status);
      return s === "0" || s === "00";
    };

    const isPaid = normalizeSuccess(status);
    const statusCode = isPaid
      ? 0
      : Number.isFinite(Number(status))
        ? Number(status)
        : -1;

    // Connect to database
    await connectToDatabase();

    // Find the order by merchant reference number
    console.log("[ABA PayWay] Looking up order with tran_id:", tran_id);

    // First try to find by merchant reference number
    let order = await Order.findOne({ abaMerchantRefNo: tran_id });

    // If not found and tran_id looks like a MongoDB ObjectId, try as order ID
    if (!order && /^[0-9a-fA-F]{24}$/.test(tran_id)) {
      console.log(
        "[ABA PayWay] tran_id looks like ObjectId, trying as order ID"
      );
      order = await Order.findById(tran_id);
    }

    if (!order) {
      console.error("[ABA PayWay] Order not found for transaction:", {
        tran_id,
        searchCriteria: [{ abaMerchantRefNo: tran_id }, { _id: tran_id }],
      });
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log("[ABA PayWay] Order found:", {
      orderId: order._id,
      abaMerchantRefNo: order.abaMerchantRefNo,
      currentStatus: order.isPaid ? "paid" : "unpaid",
      totalPrice: order.totalPrice,
    });

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
    if (isPaid) {
      // NOTE: apv is approval code (string), NOT the payment amount
      // Do not verify amount from pushback - trust the order record
      console.log("[ABA PayWay] Payment successful:", {
        orderId: order._id,
        tran_id: tran_id,
        approvalCode: apv,
        orderAmount: order.totalPrice,
      });

      // Mark order as paid and persist payment result atomically
      console.log(
        "[ABA PayWay] Calling updateOrderToPaid for order:",
        order._id
      );
      try {
        const updateResult = await updateOrderToPaid(order._id, {
          id: tran_id as string,
          status: "COMPLETED",
          // email_address omitted to avoid persisting empty string without populated user
          pricePaid: order.totalPrice.toFixed(2),
        } as any);
        console.log("[ABA PayWay] updateOrderToPaid result:", updateResult);

        if (updateResult.success) {
          console.log("[ABA PayWay] Payment successful for order:", order._id);
        } else {
          console.error(
            "[ABA PayWay] updateOrderToPaid failed:",
            updateResult.message
          );
          return NextResponse.json(
            { error: `Failed to update order: ${updateResult.message}` },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error("[ABA PayWay] Error calling updateOrderToPaid:", error);
        return NextResponse.json(
          { error: "Failed to update order" },
          { status: 500 }
        );
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

    // Update order with status tracking (after payment handling)
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

    // Return success response to ABA PayWay
    return NextResponse.json({
      message: "Callback processed successfully",
      orderId: order._id,
      status:
        statusCode === ABA_PAYWAY_STATUS_CODES.SUCCESS ? "success" : "failed",
    });
  } catch (error) {
    console.error("[ABA PayWay] Callback processing error:", error);

    // Return error response
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to process callback" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
