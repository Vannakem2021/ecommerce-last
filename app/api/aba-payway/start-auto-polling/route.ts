import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import Order from "@/lib/db/models/order.model";
import { abaPayWayAutoStatusService } from "@/lib/aba-payway-auto-status";

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
    const order = await Order.findById(orderId);

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

    // Check if order is already paid
    if (order.isPaid) {
      return NextResponse.json(
        { error: "Order is already paid" },
        { status: 400 }
      );
    }

    // Check if we have a transaction ID
    if (!order.abaMerchantRefNo) {
      return NextResponse.json(
        { error: "No ABA PayWay transaction found for this order" },
        { status: 400 }
      );
    }

    console.log(`[ABA Auto Polling] Starting auto-polling for order ${orderId}`, {
      abaMerchantRefNo: order.abaMerchantRefNo,
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    });

    // Start automatic polling for this order
    await abaPayWayAutoStatusService.startPollingForOrder(
      orderId,
      order.abaMerchantRefNo
    );

    return NextResponse.json({
      success: true,
      message: "Automatic status polling started",
      orderId: orderId,
      transactionId: order.abaMerchantRefNo,
      pollingStatus: abaPayWayAutoStatusService.getPollingStatus(),
    });
  } catch (error) {
    console.error("[ABA Auto Polling] Error starting auto-polling:", error);

    // Return appropriate error response
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to start automatic polling" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
