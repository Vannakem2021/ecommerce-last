#!/usr/bin/env node

/**
 * Debug script to check ABA PayWay settings in the database
 */

const { MongoClient } = require("mongodb");

// Load environment variables from .env.local manually
const fs = require("fs");
const path = require("path");

try {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (error) {
  console.log("Note: Could not load .env.local file");
}

async function debugSettings() {
  console.log("🔍 ABA PayWay Settings Debug Tool\n");

  // Check environment variables
  console.log("📋 Environment Variables:");
  console.log(
    `MONGODB_URI: ${process.env.MONGODB_URI ? "✅ Set" : "❌ Missing"}`
  );
  console.log(
    `PAYWAY_MERCHANT_ID: ${process.env.PAYWAY_MERCHANT_ID || "❌ Missing"}`
  );
  console.log(
    `PAYWAY_SECRET_KEY: ${process.env.PAYWAY_SECRET_KEY ? "✅ Set (hidden)" : "❌ Missing"}`
  );
  console.log(
    `PAYWAY_BASE_URL: ${process.env.PAYWAY_BASE_URL || "❌ Missing"}`
  );
  console.log(`PAYWAY_ENABLED: ${process.env.PAYWAY_ENABLED || "❌ Missing"}`);
  console.log("");

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is required to check database settings");
    return;
  }

  let client;
  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    // Get database
    const db = client.db();
    const settingsCollection = db.collection("settings");

    // Find settings document
    console.log("📄 Fetching settings from database...");
    const settings = await settingsCollection.findOne({});

    if (!settings) {
      console.log("❌ No settings document found in database");
      console.log("💡 Try running: npm run seed");
      return;
    }

    console.log("✅ Settings document found\n");

    // Check available payment methods
    console.log("💳 Available Payment Methods:");
    if (settings.availablePaymentMethods) {
      settings.availablePaymentMethods.forEach((pm, index) => {
        const isABA = pm.name === "ABA PayWay";
        console.log(`  ${index + 1}. ${pm.name} ${isABA ? "🎯" : ""}`);
      });

      const hasABAPayWay = settings.availablePaymentMethods.some(
        (pm) => pm.name === "ABA PayWay"
      );
      console.log(
        `\n🎯 ABA PayWay in payment methods: ${hasABAPayWay ? "✅ Yes" : "❌ No"}`
      );
    } else {
      console.log("❌ No availablePaymentMethods found");
    }

    console.log("");

    // Check ABA PayWay configuration
    console.log("⚙️ ABA PayWay Configuration:");
    if (settings.abaPayWay) {
      console.log(
        `  Enabled: ${settings.abaPayWay.enabled ? "✅ true" : "❌ false"}`
      );
      console.log(
        `  Merchant ID: ${settings.abaPayWay.merchantId || "❌ Not set"}`
      );
      console.log(
        `  Sandbox Mode: ${settings.abaPayWay.sandboxMode ? "✅ true" : "❌ false"}`
      );
    } else {
      console.log("❌ No abaPayWay configuration found");
    }

    console.log("");

    // Check default payment method
    console.log("🔧 Default Payment Method:");
    console.log(`  Default: ${settings.defaultPaymentMethod || "❌ Not set"}`);

    console.log("");

    // Provide recommendations
    console.log("💡 Recommendations:");

    if (
      !settings.availablePaymentMethods?.some((pm) => pm.name === "ABA PayWay")
    ) {
      console.log(
        '❌ Add "ABA PayWay" to available payment methods in admin settings'
      );
    }

    if (!settings.abaPayWay?.enabled) {
      console.log("❌ Enable ABA PayWay in admin settings");
    }

    if (!settings.abaPayWay?.merchantId) {
      console.log("❌ Set Merchant ID in ABA PayWay admin settings");
    }

    if (!process.env.PAYWAY_SECRET_KEY) {
      console.log("❌ Set PAYWAY_SECRET_KEY in .env.local file");
    }

    // Show what should be visible
    console.log("\n🎯 Expected Checkout Behavior:");
    const shouldShowABA =
      settings.availablePaymentMethods?.some(
        (pm) => pm.name === "ABA PayWay"
      ) &&
      settings.abaPayWay?.enabled &&
      settings.abaPayWay?.merchantId;

    console.log(
      `ABA PayWay should ${shouldShowABA ? "✅ APPEAR" : "❌ NOT APPEAR"} in checkout`
    );

    if (shouldShowABA) {
      console.log(
        "\n🎉 Configuration looks correct! If ABA PayWay still doesn't appear:"
      );
      console.log("1. Clear browser cache and refresh");
      console.log("2. Restart your development server");
      console.log("3. Check browser console for errors");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (client) {
      await client.close();
      console.log("\n🔌 Disconnected from MongoDB");
    }
  }
}

// Run if executed directly
if (require.main === module) {
  debugSettings().catch(console.error);
}

module.exports = { debugSettings };
