Thanks for sharing your callback. I read it end‑to‑end and there are a few blockers that explain why it “doesn’t work” even with an ngrok URL.

What’s wrong (and how to fix it)

You’re parsing the body as formData() but PayWay posts JSON.
Your handler does:

const formData = await req.formData();

and then converts it to an object. That will fail (or be empty) when Content‑Type is application/json (which PayWay uses for pushback). Use await req.json() for JSON, and only fall back to form parsing if needed.

PayWay’s docs explicitly say the return_url must accept POST with application/json (example is shown on their Payment Link pushback page), and their eCommerce PDF shows a JSON pushback sample.
PayWay Developer Suite
checkout-sandbox.payway.com.kh

You reject the callback as “Invalid signature”, but PayWay’s pushback has no hash.
Your code calls abaPayWayService.verifyCallback(...) and returns 400 if it fails. The pushback JSON contains only tran_id, apv, and status—no hash to verify—so your verification will always fail and you’ll 400 every real callback. Remove that check (or verify your own signed return_params if you embed one).

checkout-sandbox.payway.com.kh

You’re treating apv as the paid amount, which is incorrect.
In the pushback, apv is an approval code (a string), not the amount. Your code parses apv as a number and compares it to the order total, which will always “mismatch” and cause a failure. If you aren’t calling Check transaction, don’t try to confirm amount from the pushback—carry the expected amount in return_params or trust your own order record.

checkout-sandbox.payway.com.kh

Template‑literal strings are missing quotes/backticks (syntax error).
These lines won’t compile:

details: Callback received with status ${statusCode}: ${statusDescription},
...
details: Amount mismatch: expected ${orderAmount}, received ${paidAmount},

Wrap them with backticks:

details: `Callback received with status ${statusCode}: ${statusDescription}`,
...
details: `Amount mismatch: expected ${orderAmount}, received ${paidAmount}`,

Be careful with status codes.
For eCommerce pushback status is 0 for success. For Payment Link pushback, success is "00". Your parseInt happens to map both to 0, which is fine—but it’s clearer to normalize strings explicitly.
checkout-sandbox.payway.com.kh
PayWay Developer Suite

Fixed callback (drop‑in)

Below is a corrected route.ts that:

Parses JSON (and gracefully handles other content‑types).

Does not expect a hash in the pushback.

Treats apv as approval code (not amount).

Normalizes status and updates the order.

Returns HTTP 200 quickly so PayWay considers delivery successful.

Keep your own DB code, models, and updateOrderToPaid—I’ve left them intact but commented where I changed logic.

// app/api/payway/return/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Order from "@/lib/db/models/order.model";
import { updateOrderToPaid } from "@/lib/actions/order.actions";
import { ABA_PAYWAY_STATUS_CODES } from "@/types/aba-payway";

export const runtime = "nodejs";

type Pushback = {
tran_id?: string;
apv?: string; // approval code (string), NOT amount
status?: string | number; // "0" or 0 (eCommerce), "00" (Payment Link)
return_params?: string; // optional: your own data if you used it
[k: string]: unknown;
};

function toParamsObject(body: any): Record<string, any> {
if (!body) return {};
return typeof body === "object" ? body : {};
}

function normalizeSuccess(status: string | number | undefined) {
if (status === undefined || status === null) return false;
const s = String(status);
return s === "0" || s === "00";
}

export async function POST(req: NextRequest) {
// Log inbound attempt
console.log("[ABA PayWay] Callback attempt:", {
ts: new Date().toISOString(),
method: req.method,
url: req.url,
ua: req.headers.get("user-agent"),
ct: req.headers.get("content-type"),
ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
});

try {
// ---- Parse body (PayWay posts application/json) ----
const ct = req.headers.get("content-type") || "";
let callbackParams: Record<string, any> = {};
if (ct.includes("application/json")) {
callbackParams = toParamsObject(await req.json());
} else if (ct.includes("application/x-www-form-urlencoded")) {
const text = await req.text();
callbackParams = Object.fromEntries(new URLSearchParams(text));
} else if (ct.includes("multipart/form-data")) {
const fd = await req.formData();
callbackParams = Object.fromEntries(
Array.from(fd.entries()).map(([k, v]) => [k, String(v)])
);
} else {
// best-effort JSON parse
try { callbackParams = toParamsObject(await req.json()); } catch { /_ ignore _/ }
}

    console.log("[ABA PayWay] Parsed pushback:", callbackParams);

    // ---- DO NOT expect a 'hash' in PayWay pushback; remove signature check ----

    // Extract pushback fields
    const { tran_id, status, apv } = callbackParams as Pushback;
    if (!tran_id) {
      // Return 200 to avoid repeated retries, but log the issue
      console.error("[ABA PayWay] Missing tran_id in pushback");
      return NextResponse.json({ received: true, error: "missing tran_id" });
    }

    // Normalize status
    const isPaid = normalizeSuccess(status);
    const statusCode = isPaid ? 0 : Number.isFinite(Number(status)) ? Number(status) : -1;

    // Connect DB & find order
    await connectToDatabase();
    let order = await Order.findOne({ abaMerchantRefNo: tran_id });
    if (!order && /^[0-9a-fA-F]{24}$/.test(tran_id)) {
      order = await Order.findById(tran_id);
    }
    if (!order) {
      console.error("[ABA PayWay] Order not found for tran_id:", tran_id);
      return NextResponse.json({ received: true, error: "order not found", tran_id });
    }

    console.log("[ABA PayWay] Order found:", {
      orderId: order._id,
      isPaid: order.isPaid,
      totalPrice: order.totalPrice,
    });

    // If already processed, return 200 (idempotent)
    if (order.isPaid && isPaid) {
      return NextResponse.json({ received: true, message: "already paid", tran_id });
    }

    // Build status entry (fix missing backticks)
    const statusEntry = {
      status: isPaid ? "SUCCESS" : "FAILED",
      statusCode,
      timestamp: new Date(),
      source: "callback" as const,
      details: `Callback received with status ${statusCode}`,
    };

    if (isPaid) {
      // NOTE: 'apv' is approval code, not amount. Do not use it for amount verification.
      order.paymentResult = {
        id: tran_id,
        status: "COMPLETED",
        email_address: (order.user as any)?.email || "",
        pricePaid: order.totalPrice.toFixed(2),
        approvalCode: apv || null,
      };
      await order.save();

      const updateResult = await updateOrderToPaid(order._id);
      if (!updateResult?.success) {
        console.error("[ABA PayWay] updateOrderToPaid failed:", updateResult?.message);
        // Still return 200 so PayWay doesn't retry forever
        return NextResponse.json({ received: true, error: "failed to mark paid", tran_id });
      }
    } else {
      order.paymentResult = {
        id: tran_id,
        status: "FAILED",
        email_address: (order.user as any)?.email || "",
        pricePaid: "0.00",
      };
      await order.save();
    }

    // Track status history
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        abaPaymentStatus: isPaid ? "SUCCESS" : "FAILED",
        abaStatusCode: statusCode,
        abaCallbackReceived: true,
        abaTransactionId: tran_id,
      },
      $push: { abaStatusHistory: statusEntry },
    });

    // Always 200
    return NextResponse.json({
      received: true,
      tran_id,
      approval_code: apv || null,
      normalized_status: isPaid ? "PAID" : "FAILED",
    });

} catch (err) {
console.error("[ABA PayWay] Callback error:", err);
// Return 200 to avoid infinite retries; log the error internally
return NextResponse.json({ received: true, error: "internal error" });
}
}

export async function GET() {
return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

Quick checklist for ngrok/staging testing

Public URL: Point your return_url to your public endpoint (ngrok/Cloudflare). PayWay can’t call localhost. (You already did this part.)

Accept JSON: Your handler must accept POST + application/json (above code does).
PayWay Developer Suite

No pushback hash: Don’t expect/require a hash in the pushback; the official sample shows only tran_id, apv, status.
checkout-sandbox.payway.com.kh

Status meaning: eCommerce pushback uses status: 0 for success; Payment Link uses "00". The code treats both as success.
checkout-sandbox.payway.com.kh
PayWay Developer Suite

Amount: The pushback does not include the amount; apv is an approval code, not the amount. Don’t compare it to your order total. If you need amount integrity without Check transaction, include the expected amount in your own signed return_params.
checkout-sandbox.payway.com.kh

If you want, I can also help wire in a tiny HMAC for return_params so you can trust the order ID/amount you receive back—still without calling Check transaction.
