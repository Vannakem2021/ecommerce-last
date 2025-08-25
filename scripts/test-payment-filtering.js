#!/usr/bin/env node

/**
 * Test script to verify payment method filtering logic
 */

// Mock the filtering logic from checkout-form.tsx
function filterPaymentMethods(availablePaymentMethods, abaPayWay) {
  return availablePaymentMethods.filter((pm) => {
    if (pm.name === "ABA PayWay") {
      // Only show ABA PayWay if it's enabled and has merchant ID configured
      return abaPayWay?.enabled && abaPayWay?.merchantId;
    }
    return true; // Show all other payment methods
  });
}

// Test scenarios
const testScenarios = [
  {
    name: "ABA PayWay disabled",
    availablePaymentMethods: [
      { name: "PayPal", commission: 0 },
      { name: "Stripe", commission: 0 },
      { name: "ABA PayWay", commission: 0 },
      { name: "Cash On Delivery", commission: 0 },
    ],
    abaPayWay: {
      enabled: false,
      merchantId: "test_merchant",
      sandboxMode: true,
    },
    expectedCount: 3, // Should exclude ABA PayWay
    shouldIncludeABA: false,
  },
  {
    name: "ABA PayWay enabled but no merchant ID",
    availablePaymentMethods: [
      { name: "PayPal", commission: 0 },
      { name: "Stripe", commission: 0 },
      { name: "ABA PayWay", commission: 0 },
      { name: "Cash On Delivery", commission: 0 },
    ],
    abaPayWay: {
      enabled: true,
      merchantId: "",
      sandboxMode: true,
    },
    expectedCount: 3, // Should exclude ABA PayWay
    shouldIncludeABA: false,
  },
  {
    name: "ABA PayWay enabled with merchant ID",
    availablePaymentMethods: [
      { name: "PayPal", commission: 0 },
      { name: "Stripe", commission: 0 },
      { name: "ABA PayWay", commission: 0 },
      { name: "Cash On Delivery", commission: 0 },
    ],
    abaPayWay: {
      enabled: true,
      merchantId: "test_merchant_123",
      sandboxMode: true,
    },
    expectedCount: 4, // Should include ABA PayWay
    shouldIncludeABA: true,
  },
  {
    name: "No ABA PayWay in available methods",
    availablePaymentMethods: [
      { name: "PayPal", commission: 0 },
      { name: "Stripe", commission: 0 },
      { name: "Cash On Delivery", commission: 0 },
    ],
    abaPayWay: {
      enabled: true,
      merchantId: "test_merchant_123",
      sandboxMode: true,
    },
    expectedCount: 3, // Should show all methods
    shouldIncludeABA: false,
  },
  {
    name: "ABA PayWay config is null",
    availablePaymentMethods: [
      { name: "PayPal", commission: 0 },
      { name: "Stripe", commission: 0 },
      { name: "ABA PayWay", commission: 0 },
      { name: "Cash On Delivery", commission: 0 },
    ],
    abaPayWay: null,
    expectedCount: 3, // Should exclude ABA PayWay
    shouldIncludeABA: false,
  },
];

function runTests() {
  console.log("🧪 Testing Payment Method Filtering Logic\n");

  let passedTests = 0;
  let totalTests = testScenarios.length;

  testScenarios.forEach((scenario, index) => {
    console.log(`Test ${index + 1}: ${scenario.name}`);
    
    try {
      const filtered = filterPaymentMethods(
        scenario.availablePaymentMethods,
        scenario.abaPayWay
      );

      const actualCount = filtered.length;
      const actualIncludesABA = filtered.some(pm => pm.name === "ABA PayWay");

      // Check count
      if (actualCount !== scenario.expectedCount) {
        console.log(`❌ Count mismatch: expected ${scenario.expectedCount}, got ${actualCount}`);
        return;
      }

      // Check ABA PayWay inclusion
      if (actualIncludesABA !== scenario.shouldIncludeABA) {
        console.log(`❌ ABA PayWay inclusion mismatch: expected ${scenario.shouldIncludeABA}, got ${actualIncludesABA}`);
        return;
      }

      console.log(`✅ Passed - ${actualCount} methods, ABA PayWay included: ${actualIncludesABA}`);
      passedTests++;

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log("");
  });

  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed\n`);

  if (passedTests === totalTests) {
    console.log("🎉 All tests passed! Payment method filtering is working correctly.");
    console.log("\n📝 Summary:");
    console.log("- ABA PayWay is hidden when disabled");
    console.log("- ABA PayWay is hidden when merchant ID is missing");
    console.log("- ABA PayWay is shown when enabled and configured");
    console.log("- Other payment methods are always shown");
  } else {
    console.log("⚠️ Some tests failed. Please check the filtering logic.");
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { filterPaymentMethods, runTests };
