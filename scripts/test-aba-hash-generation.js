#!/usr/bin/env node

/**
 * Test script to verify ABA PayWay hash generation
 */

const crypto = require("crypto");
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

function generateStatusCheckHash(tran_id, merchant_id, secretKey) {
  const dataToHash = tran_id + merchant_id;
  console.log("Status Check Hash Generation:");
  console.log("  tran_id:", tran_id);
  console.log("  merchant_id:", merchant_id);
  console.log("  dataToHash:", dataToHash);
  console.log(
    "  secretKey length:",
    secretKey ? secretKey.length : "undefined"
  );

  const hash = Buffer.from(
    crypto.createHmac("sha512", secretKey).update(dataToHash).digest()
  ).toString("base64");

  console.log("  generated hash:", hash);
  return hash;
}

function generateCallbackHash(tran_id, status, apv, merchant_id, secretKey) {
  const dataToHash = tran_id + status + apv + merchant_id;
  console.log("Callback Hash Generation:");
  console.log("  tran_id:", tran_id);
  console.log("  status:", status);
  console.log("  apv:", apv);
  console.log("  merchant_id:", merchant_id);
  console.log("  dataToHash:", dataToHash);
  console.log(
    "  secretKey length:",
    secretKey ? secretKey.length : "undefined"
  );

  const hash = Buffer.from(
    crypto.createHmac("sha512", secretKey).update(dataToHash).digest()
  ).toString("base64");

  console.log("  generated hash:", hash);
  return hash;
}

async function testHashGeneration() {
  console.log("🧪 Testing ABA PayWay Hash Generation\n");

  // Get configuration from environment
  const merchantId = process.env.PAYWAY_MERCHANT_ID;
  const secretKey = process.env.PAYWAY_SECRET_KEY;

  console.log("Configuration:");
  console.log("  PAYWAY_MERCHANT_ID:", merchantId);
  console.log(
    "  PAYWAY_SECRET_KEY:",
    secretKey ? `${secretKey.substring(0, 8)}...` : "undefined"
  );
  console.log("");

  if (!merchantId || !secretKey) {
    console.error("❌ Missing required environment variables:");
    console.error("  PAYWAY_MERCHANT_ID:", merchantId ? "✅" : "❌");
    console.error("  PAYWAY_SECRET_KEY:", secretKey ? "✅" : "❌");
    return;
  }

  // Test with the actual order data from the error
  const testData = {
    tran_id: "ORD-dd8e264e-pss0c2",
    merchant_id: merchantId,
    status: "0", // Success
    apv: "10.00", // Example amount
  };

  console.log("📋 Test 1: Status Check Hash Generation");
  console.log("=====================================");
  const statusHash = generateStatusCheckHash(
    testData.tran_id,
    testData.merchant_id,
    secretKey
  );

  console.log("\n📋 Test 2: Callback Hash Generation");
  console.log("===================================");
  const callbackHash = generateCallbackHash(
    testData.tran_id,
    testData.status,
    testData.apv,
    testData.merchant_id,
    secretKey
  );

  console.log("\n📋 Test 3: Alternative Hash Formats");
  console.log("===================================");

  // Test different possible formats that ABA PayWay might expect
  const alternatives = [
    {
      name: "Status Check (current)",
      data: testData.tran_id + testData.merchant_id,
    },
    {
      name: "Status Check (with req_time)",
      data: Date.now() + testData.tran_id + testData.merchant_id,
    },
    {
      name: "Status Check (merchant_id first)",
      data: testData.merchant_id + testData.tran_id,
    },
    {
      name: "Callback (current)",
      data:
        testData.tran_id +
        testData.status +
        testData.apv +
        testData.merchant_id,
    },
    {
      name: "Callback (different order)",
      data:
        testData.merchant_id +
        testData.tran_id +
        testData.status +
        testData.apv,
    },
  ];

  alternatives.forEach((alt, index) => {
    console.log(`\nAlternative ${index + 1}: ${alt.name}`);
    console.log("  dataToHash:", alt.data);
    const hash = Buffer.from(
      crypto.createHmac("sha512", secretKey).update(alt.data).digest()
    ).toString("base64");
    console.log("  hash:", hash);
  });

  console.log("\n🔧 Debugging Information:");
  console.log("=========================");
  console.log('If the status check is still failing with "wrong hash":');
  console.log("1. Verify the secret key is correct");
  console.log("2. Check if ABA PayWay expects a different parameter order");
  console.log("3. Verify the merchant ID matches exactly");
  console.log("4. Check if additional parameters are required");
  console.log("5. Ensure the transaction ID format is correct");

  console.log("\n📞 Next Steps:");
  console.log("==============");
  console.log("1. Test the callback hash with a real ABA PayWay callback");
  console.log("2. Contact ABA PayWay support if hash generation still fails");
  console.log("3. Verify the API endpoint URL is correct");
  console.log("4. Check if the sandbox environment has different requirements");
}

// Test specific hash generation
function testSpecificHash() {
  const tran_id = process.argv[3];
  const merchant_id = process.argv[4] || process.env.PAYWAY_MERCHANT_ID;
  const secretKey = process.env.PAYWAY_SECRET_KEY;

  if (!tran_id || !merchant_id || !secretKey) {
    console.log(
      "Usage: node scripts/test-aba-hash-generation.js test <tran_id> [merchant_id]"
    );
    console.log(
      "Example: node scripts/test-aba-hash-generation.js test ORD-dd8e264e-pss0c2"
    );
    return;
  }

  console.log(`🧪 Testing hash for specific transaction: ${tran_id}\n`);
  generateStatusCheckHash(tran_id, merchant_id, secretKey);
}

// Main execution
const command = process.argv[2];

if (command === "test") {
  testSpecificHash();
} else {
  testHashGeneration().catch(console.error);
}
