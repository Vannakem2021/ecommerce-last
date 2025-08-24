import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOrderById } from "@/lib/actions/order.actions";
import { abaPayWayService } from "@/lib/aba-payway";
import { abaPayWayAutoStatusService } from "@/lib/aba-payway-auto-status";
import { connectToDatabase } from "@/lib/db";
import Order from "@/lib/db/models/order.model";

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

    // Verify order ownership
    if (order.user.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to order" },
        { status: 403 }
      );
    }

    // Check if order is already paid
    if (order.isPaid) {
      return NextResponse.json(
        { error: "Order is already paid" },
        { status: 400 }
      );
    }

    // Verify payment method
    if (order.paymentMethod !== "ABA PayWay") {
      return NextResponse.json(
        { error: "Invalid payment method for this order" },
        { status: 400 }
      );
    }

    // Check if ABA PayWay is enabled
    if (!abaPayWayService.isEnabled()) {
      return NextResponse.json(
        { error: "ABA PayWay is not available" },
        { status: 503 }
      );
    }

    // Get base URL for callbacks
    const baseUrl =
      process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

    // Prepare customer information
    const customerName = order.shippingAddress.fullName || "";
    const nameParts = customerName.split(" ");
    const firstname = nameParts[0] || "";
    const lastname = nameParts.slice(1).join(" ") || "";

    // Create payment request
    const paymentRequest = {
      orderId: order._id,
      amount: order.totalPrice,
      currency: "USD", // Default currency, can be made configurable
      customerInfo: {
        firstname,
        lastname,
        email: session.user.email || "",
        phone: order.shippingAddress.phone || "",
      },
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity, // Use 'quantity' to match PaymentItem interface
        price: item.price,
      })),
      returnUrl: `${baseUrl}/api/aba-payway/callback`,
      cancelUrl: `${baseUrl}/checkout/${order._id}?cancelled=true`,
      continueSuccessUrl: `${baseUrl}/account/orders/${order._id}`,
    };

    // Generate payment parameters
    const paymentParams = abaPayWayService.createPaymentParams(paymentRequest);
    const paymentUrl = abaPayWayService.getPaymentUrl();

    // Store the merchant reference number in the order for callback matching
    const abaMerchantRefNo = abaPayWayService.getMerchantRefNo(order._id);
    await Order.findByIdAndUpdate(orderId, {
      abaMerchantRefNo: abaMerchantRefNo,
    });

    // Log payment initiation for debugging
    console.log(`[ABA PayWay] Payment initiated for order ${orderId}`, {
      amount: order.totalPrice,
      customer: firstname + " " + lastname,
      abaMerchantRefNo: abaMerchantRefNo,
      timestamp: new Date().toISOString(),
    });

    // Start automatic status polling for this payment
    try {
      await abaPayWayAutoStatusService.startPollingForOrder(
        orderId,
        abaMerchantRefNo
      );
      console.log(`[ABA PayWay] Auto-polling started for order ${orderId}`);
    } catch (error) {
      console.error(
        `[ABA PayWay] Failed to start auto-polling for order ${orderId}:`,
        error
      );
      // Don't fail the payment creation if polling fails to start
    }

    return NextResponse.json({
      success: true,
      paymentUrl,
      paymentParams,
      orderId: order._id,
      autoPollingStarted: true,
    });
  } catch (error) {
    console.error("ABA PayWay payment creation error:", error);

    // Return appropriate error response
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
