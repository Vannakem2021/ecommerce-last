import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOrderById } from "@/lib/actions/order.actions";
import { abaPayWayService } from "@/lib/aba-payway";
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

    // Generate merchant reference number ONCE and use it consistently
    const abaMerchantRefNo = abaPayWayService.getMerchantRefNo(order._id);

    // Store the merchant reference number in the order for callback matching
    await Order.findByIdAndUpdate(orderId, {
      abaMerchantRefNo: abaMerchantRefNo,
    });

    // Generate payment parameters using the same merchant reference number
    const paymentParams = abaPayWayService.createPaymentParams({
      ...paymentRequest,
      merchantRefNo: abaMerchantRefNo, // Pass the merchant ref explicitly
    });
    const paymentUrl = abaPayWayService.getPaymentUrl();

    // Enhanced logging for debugging
    console.log(`[ABA PayWay] Payment initiated for order ${orderId}`, {
      amount: order.totalPrice,
      customer: firstname + " " + lastname,
      abaMerchantRefNo: abaMerchantRefNo,
      returnUrl: paymentRequest.returnUrl,
      cancelUrl: paymentRequest.cancelUrl,
      continueSuccessUrl: paymentRequest.continueSuccessUrl,
      baseUrl: baseUrl,
      timestamp: new Date().toISOString(),
    });

    // Log the exact payment parameters being sent to ABA PayWay
    console.log(`[ABA PayWay] Payment parameters for order ${orderId}:`, {
      merchant_id: paymentParams.merchant_id,
      req_time: paymentParams.req_time,
      tran_id: paymentParams.tran_id,
      amount: paymentParams.amount,
      return_url: paymentParams.return_url,
      cancel_url: paymentParams.cancel_url,
      continue_success_url: paymentParams.continue_success_url,
      hash: paymentParams.hash
        ? paymentParams.hash.substring(0, 20) + "..."
        : "undefined",
    });

    return NextResponse.json({
      success: true,
      paymentUrl,
      paymentParams,
      orderId: order._id,
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
