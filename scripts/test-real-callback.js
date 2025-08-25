#!/usr/bin/env node

/**
 * Test script to simulate a real ABA PayWay callback with proper signature
 */

const crypto = require("crypto");
const https = require("https");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const envContent = fs.readFileSync(envPath, "utf8");
    const lines = envContent.split("\n");

    lines.forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.log("Could not load .env.local file:", error.message);
  }
}

loadEnvFile();

function generateCallbackHash(tran_id, status, apv, merchant_id, secretKey) {
  // According to ABA PayWay documentation: tran_id + status + apv + merchant_id
  const dataToHash = tran_id + status + apv + merchant_id;

  const hash = Buffer.from(
    crypto.createHmac("sha512", secretKey).update(dataToHash).digest()
  ).toString("base64");

  return hash;
}

async function makeRequest(url, formData) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(formData),
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "ABA-PayWay-Test/1.0",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("error", reject);
    req.write(formData);
    req.end();
  });
}

async function testRealCallback() {
  console.log("🧪 Testing Real ABA PayWay Callback Simulation\n");

  const merchantId = process.env.PAYWAY_MERCHANT_ID;
  const secretKey = process.env.PAYWAY_SECRET_KEY;
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

  if (!merchantId || !secretKey || !serverUrl) {
    console.error("❌ Missing required environment variables:");
    console.error("  PAYWAY_MERCHANT_ID:", merchantId ? "✅" : "❌");
    console.error("  PAYWAY_SECRET_KEY:", secretKey ? "✅" : "❌");
    console.error("  NEXT_PUBLIC_SERVER_URL:", serverUrl ? "✅" : "❌");
    return;
  }

  // Test data for the order
  const testData = {
    tran_id: process.env.TEST_TRAN_ID || "ORD-dd8e264e-pss0c2",
    status: process.env.TEST_STATUS || "0", // Success
    apv: process.env.TEST_AMOUNT || "10.00", // Amount
    merchant_id: merchantId,
    req_time: Date.now().toString(),
  };

  console.log("📋 Test Data:");
  console.log("  Transaction ID:", testData.tran_id);
  console.log("  Status:", testData.status, "(0 = Success)");
  console.log("  Amount:", testData.apv);
  console.log("  Merchant ID:", testData.merchant_id);
  console.log("  Request Time:", testData.req_time);

  // Generate proper signature
  const hash = generateCallbackHash(
    testData.tran_id,
    testData.status,
    testData.apv,
    testData.merchant_id,
    secretKey
  );

  console.log("\n📋 Signature Generation:");
  console.log(
    "  Data to hash:",
    testData.tran_id + testData.status + testData.apv + testData.merchant_id
  );
  console.log("  Generated hash:", hash);

  // Create form data as ABA PayWay would send it
  const formParams = new URLSearchParams();
  formParams.append("tran_id", testData.tran_id);
  formParams.append("status", testData.status);
  formParams.append("apv", testData.apv);
  formParams.append("merchant_id", testData.merchant_id);
  formParams.append("req_time", testData.req_time);
  formParams.append("hash", hash);

  const formData = formParams.toString();

  console.log("\n📋 Form Data:");
  console.log(formData);

  // Send callback to the server
  const callbackUrl = `${serverUrl}/api/aba-payway/callback`;
  console.log("\n📋 Sending callback to:", callbackUrl);

  try {
    const response = await makeRequest(callbackUrl, formData);

    console.log("\n📊 Callback Response:");
    console.log("  Status:", response.status);
    console.log("  Body:", response.body);

    if (response.status === 200) {
      console.log("\n✅ Callback processed successfully!");

      // Parse response to check if payment was processed
      try {
        const responseData = JSON.parse(response.body);
        if (responseData.status === "success") {
          console.log("✅ Payment marked as successful");
          console.log("✅ Order ID:", responseData.orderId);
        } else {
          console.log("⚠️ Payment processed but status:", responseData.status);
        }
      } catch (e) {
        console.log("⚠️ Could not parse response as JSON");
      }
    } else if (
      response.status === 400 &&
      response.body.includes("Invalid signature")
    ) {
      console.log("\n❌ Signature verification failed");
      console.log("This means the callback hash generation is still incorrect");
      console.log("Try different hash formats or check the secret key");
    } else if (
      response.status === 404 &&
      response.body.includes("Order not found")
    ) {
      console.log("\n❌ Order not found");
      console.log(
        "The order with transaction ID",
        testData.tran_id,
        "does not exist"
      );
      console.log("Make sure the order exists in the database");
    } else {
      console.log("\n❌ Callback failed with status:", response.status);
      console.log("Response:", response.body);
    }
  } catch (error) {
    console.error("\n❌ Error sending callback:", error.message);
    console.log("\nPossible issues:");
    console.log("1. Server is not running");
    console.log("2. ngrok tunnel is not active");
    console.log("3. Network connectivity issues");
    console.log("4. SSL/TLS certificate issues");
  }
}

// Test with custom parameters
async function testCustomCallback() {
  const tran_id = process.argv[3];
  const status = process.argv[4] || "0";
  const amount = process.argv[5] || "10.00";

  if (!tran_id) {
    console.log(
      "Usage: node scripts/test-real-callback.js custom <tran_id> [status] [amount]"
    );
    console.log(
      "Example: node scripts/test-real-callback.js custom ORD-dd8e264e-pss0c2 0 10.00"
    );
    return;
  }

  console.log(`🧪 Testing custom callback for transaction: ${tran_id}\n`);

  // Override test data
  process.env.TEST_TRAN_ID = tran_id;
  process.env.TEST_STATUS = status;
  process.env.TEST_AMOUNT = amount;

  await testRealCallback();
}

// Main execution
const command = process.argv[2];

if (command === "custom") {
  testCustomCallback();
} else {
  testRealCallback();
}
