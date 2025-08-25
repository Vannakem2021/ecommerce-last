import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Order from "@/lib/db/models/order.model";

/**
 * Test endpoint to simulate ABA PayWay callback for debugging
 * This helps test the callback processing without needing actual ABA PayWay integration
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, status = "0", amount } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // Connect to database and get order
    await connectToDatabase();
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Create test callback data
    const testCallbackData = {
      tran_id: order.abaMerchantRefNo || orderId,
      status: status,
      apv: amount || order.totalPrice.toString(),
      merchant_id: "test_merchant",
      req_time: Date.now().toString(),
      hash: "test_hash_signature",
    };

    console.log("[ABA PayWay Test] Simulating callback with data:", testCallbackData);

    // Create FormData to simulate ABA PayWay callback
    const formData = new FormData();
    Object.entries(testCallbackData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Call the actual callback endpoint
    const callbackUrl = `${req.nextUrl.origin}/api/aba-payway/callback`;
    console.log("[ABA PayWay Test] Calling callback URL:", callbackUrl);

    const callbackResponse = await fetch(callbackUrl, {
      method: "POST",
      body: formData,
    });

    const callbackResult = await callbackResponse.text();
    
    console.log("[ABA PayWay Test] Callback response:", {
      status: callbackResponse.status,
      statusText: callbackResponse.statusText,
      body: callbackResult,
    });

    return NextResponse.json({
      success: true,
      message: "Test callback sent",
      testData: testCallbackData,
      callbackResponse: {
        status: callbackResponse.status,
        body: callbackResult,
      },
    });
  } catch (error) {
    console.error("[ABA PayWay Test] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check order status and provide debugging info
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId parameter is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        _id: order._id,
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
        abaMerchantRefNo: order.abaMerchantRefNo,
        abaPaymentStatus: order.abaPaymentStatus,
        abaStatusCode: order.abaStatusCode,
        abaCallbackReceived: order.abaCallbackReceived,
        abaTransactionId: order.abaTransactionId,
        abaLastStatusCheck: order.abaLastStatusCheck,
        abaStatusHistory: order.abaStatusHistory,
        paymentResult: order.paymentResult,
      },
      debugInfo: {
        canReceiveCallbacks: process.env.NEXT_PUBLIC_SERVER_URL?.includes("localhost") 
          ? "❌ Using localhost - ABA PayWay cannot send callbacks" 
          : "✅ Using public URL - callbacks should work",
        serverUrl: process.env.NEXT_PUBLIC_SERVER_URL,
        callbackUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/aba-payway/callback`,
      },
    });
  } catch (error) {
    console.error("[ABA PayWay Test] Error getting order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
