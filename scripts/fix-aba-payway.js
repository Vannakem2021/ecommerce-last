#!/usr/bin/env node

/**
 * Script to add ABA PayWay to available payment methods
 */

const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env.local manually
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

async function fixABAPayWay() {
  console.log("🔧 Fixing ABA PayWay Integration\n");

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is required");
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

    // Find current settings
    console.log("📄 Fetching current settings...");
    const currentSettings = await settingsCollection.findOne({});

    if (!currentSettings) {
      console.log("❌ No settings document found. Please run: npm run seed");
      return;
    }

    console.log("✅ Current settings found\n");

    // Check if ABA PayWay already exists
    const hasABAPayWay = currentSettings.availablePaymentMethods?.some(
      (pm) => pm.name === "ABA PayWay"
    );

    if (hasABAPayWay) {
      console.log("✅ ABA PayWay already exists in payment methods");
    } else {
      console.log("➕ Adding ABA PayWay to available payment methods...");
      
      // Add ABA PayWay to available payment methods
      const updatedPaymentMethods = [
        ...(currentSettings.availablePaymentMethods || []),
        { name: "ABA PayWay", commission: 0 }
      ];

      await settingsCollection.updateOne(
        {},
        {
          $set: {
            availablePaymentMethods: updatedPaymentMethods
          }
        }
      );

      console.log("✅ ABA PayWay added to payment methods");
    }

    // Ensure ABA PayWay configuration exists
    if (!currentSettings.abaPayWay) {
      console.log("➕ Adding ABA PayWay configuration...");
      
      await settingsCollection.updateOne(
        {},
        {
          $set: {
            abaPayWay: {
              enabled: false,
              merchantId: "",
              sandboxMode: true
            }
          }
        }
      );

      console.log("✅ ABA PayWay configuration added");
    } else {
      console.log("✅ ABA PayWay configuration already exists");
    }

    // Verify the fix
    console.log("\n🔍 Verifying the fix...");
    const updatedSettings = await settingsCollection.findOne({});
    
    const hasABAPayWayNow = updatedSettings.availablePaymentMethods?.some(
      (pm) => pm.name === "ABA PayWay"
    );

    console.log("\n📊 Final Status:");
    console.log(`ABA PayWay in payment methods: ${hasABAPayWayNow ? "✅ Yes" : "❌ No"}`);
    console.log(`ABA PayWay enabled: ${updatedSettings.abaPayWay?.enabled ? "✅ Yes" : "❌ No"}`);
    console.log(`ABA PayWay merchant ID: ${updatedSettings.abaPayWay?.merchantId || "❌ Not set"}`);

    console.log("\n💡 Next Steps:");
    console.log("1. Go to /admin/settings");
    console.log("2. Navigate to 'ABA PayWay' section");
    console.log("3. Enable ABA PayWay toggle");
    console.log("4. Enter your Merchant ID");
    console.log("5. Save settings");
    console.log("6. Test checkout - ABA PayWay should now appear!");

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
  fixABAPayWay().catch(console.error);
}

module.exports = { fixABAPayWay };
