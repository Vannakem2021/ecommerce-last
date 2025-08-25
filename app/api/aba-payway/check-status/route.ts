import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { abaPayWayStatusService } from "@/lib/aba-payway-status";
import { getOrderById } from "@/lib/actions/order.actions";
import { connectToDatabase } from "@/lib/db";
import Order from "@/lib/db/models/order.model";
import { ABA_PAYWAY_STATUS_CODES } from "@/types/aba-payway";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Connect to database and get order
    await connectToDatabase();
    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify order ownership (allow admin access)
    const isAdmin = session.user.role === "Admin";
    if (!isAdmin && order.user.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to order" },
        { status: 403 }
      );
    }

    // Check if this is an ABA PayWay order
    if (order.paymentMethod !== "ABA PayWay") {
      return NextResponse.json(
        { error: "Order is not an ABA PayWay payment" },
        { status: 400 }
      );
    }

    // Check if we have a transaction ID to check
    if (!order.abaMerchantRefNo) {
      return NextResponse.json(
        { error: "No ABA PayWay transaction found for this order" },
        { status: 400 }
      );
    }

    console.log(`[ABA PayWay Status] Checking status for order ${orderId}`, {
      abaMerchantRefNo: order.abaMerchantRefNo,
      currentStatus: order.abaPaymentStatus,
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    });

    // Check if service is enabled
    if (!abaPayWayStatusService.isEnabled()) {
      return NextResponse.json(
        { error: "ABA PayWay status service is not available" },
        { status: 503 }
      );
    }

    // Call ABA PayWay status check API
    const statusResult = await abaPayWayStatusService.checkTransactionStatus(
      order.abaMerchantRefNo
    );

    // Convert status code to string
    const statusString = abaPayWayStatusService.getStatusString(
      statusResult.status
    );
    const statusDescription = abaPayWayStatusService.getStatusDescription(
      statusResult.status
    );

    // Create status history entry
    const statusEntry = {
      status: statusString,
      statusCode: statusResult.status,
      timestamp: new Date(),
      source: "api_check" as const,
      details: statusResult.description || statusDescription,
    };

    // Update order with latest status
    const updateData: any = {
      abaStatusCode: statusResult.status,
      abaLastStatusCheck: new Date(),
      abaPaymentStatus: statusString,
      abaTransactionId: statusResult.tran_id,
    };

    // If payment is successful and order isn't already paid
    if (statusResult.status === ABA_PAYWAY_STATUS_CODES.SUCCESS && !order.isPaid) {
      // Verify amount matches
      const orderAmount = parseFloat(order.totalPrice.toFixed(2));
      const paidAmount = parseFloat(statusResult.amount);

      if (Math.abs(orderAmount - paidAmount) <= 0.01) {
        updateData.isPaid = true;
        updateData.paidAt = new Date();
        updateData.paymentResult = {
          id: statusResult.tran_id,
          status: "COMPLETED",
          email_address: session.user.email || "",
          pricePaid: paidAmount.toFixed(2),
        };

        console.log(`[ABA PayWay Status] Marking order ${orderId} as paid`, {
          orderAmount,
          paidAmount,
          transactionId: statusResult.tran_id,
        });
      } else {
        console.error(`[ABA PayWay Status] Amount mismatch for order ${orderId}`, {
          expected: orderAmount,
          received: paidAmount,
          transactionId: statusResult.tran_id,
        });
        
        statusEntry.details = `Amount mismatch: expected ${orderAmount}, received ${paidAmount}`;
      }
    }

    // Update order in database
    await Order.findByIdAndUpdate(orderId, {
      $set: updateData,
      $push: {
        abaStatusHistory: statusEntry,
      },
    });

    console.log(`[ABA PayWay Status] Status updated for order ${orderId}`, {
      newStatus: statusString,
      statusCode: statusResult.status,
      isPaid: updateData.isPaid || order.isPaid,
    });

    // Return response
    return NextResponse.json({
      success: true,
      orderId: orderId,
      transactionId: statusResult.tran_id,
      status: statusResult.status,
      statusString: statusString,
      paymentStatus: statusString,
      amount: statusResult.amount,
      currency: statusResult.currency,
      isPaid: updateData.isPaid || order.isPaid,
      lastChecked: new Date().toISOString(),
      description: statusDescription,
    });
  } catch (error) {
    console.error("[ABA PayWay Status] Status check error:", error);

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes("not properly configured")) {
        return NextResponse.json(
          { error: "Payment service configuration error" },
          { status: 503 }
        );
      }
      if (error.message.includes("Status check failed")) {
        return NextResponse.json(
          { error: "Unable to check payment status at this time" },
          { status: 502 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
