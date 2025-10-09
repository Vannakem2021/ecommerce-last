import crypto from "crypto";
import {
  ABAPayWayConfig,
  PaymentRequest,
  PaymentParams,
  PaymentItem,
  ABAPayWayCallbackParams,
  ABA_PAYWAY_TRANSACTION_TYPES,
} from "@/types/aba-payway";
import { getSetting } from "@/lib/actions/setting.actions";
import { getSecureEnvVar, validatePaymentProviderConfig, isProduction } from "@/lib/utils/environment";

class ABAPayWayService {
  private config: ABAPayWayConfig;

  constructor() {
    // Validate payment provider configuration
    const paymentConfig = validatePaymentProviderConfig()

    if (paymentConfig.warning) {
      console.warn(`⚠️  [ABA PayWay] ${paymentConfig.warning}`)
    }

    this.config = {
      merchantId: getSecureEnvVar("PAYWAY_MERCHANT_ID", false),
      apiKey: getSecureEnvVar("PAYWAY_SECRET_KEY", false),
      baseUrl: getSecureEnvVar(
        "PAYWAY_BASE_URL",
        false,
        "https://checkout-sandbox.payway.com.kh"
      ),
      enabled: getSecureEnvVar("PAYWAY_ENABLED", false) === "true",
    };

    // Additional security validation for production
    if (isProduction() && this.config.enabled) {
      if (!this.config.merchantId || !this.config.apiKey) {
        throw new Error(
          "❌ SECURITY ERROR: ABA PayWay is enabled in production but required credentials are missing"
        );
      }

      if (this.config.baseUrl.includes("sandbox")) {
        console.warn(
          "⚠️  WARNING: ABA PayWay is using sandbox URL in production environment"
        );
      }
    }
  }

  /**
   * Load configuration from database settings
   */
  async loadSettingsConfig(): Promise<void> {
    try {
      const settings = await getSetting();
      if (settings.abaPayWay) {
        this.config = {
          merchantId:
            settings.abaPayWay.merchantId ||
            getSecureEnvVar("PAYWAY_MERCHANT_ID", false),
          apiKey: getSecureEnvVar("PAYWAY_SECRET_KEY", false),
          baseUrl: settings.abaPayWay.sandboxMode
            ? "https://checkout-sandbox.payway.com.kh"
            : "https://checkout.payway.com.kh",
          enabled:
            settings.abaPayWay.enabled && !!getSecureEnvVar("PAYWAY_SECRET_KEY", false),
        };
      }
    } catch (error) {
      console.error("[ABA PayWay] Failed to load settings:", error);
    }
  }

  /**
   * Check if ABA PayWay is enabled and properly configured
   */
  isEnabled(): boolean {
    return (
      this.config.enabled &&
      !!this.config.merchantId &&
      !!this.config.apiKey &&
      !!this.config.baseUrl
    );
  }

  /**
   * Generate HMAC SHA-512 hash for ABA PayWay API
   */
  generateHash(params: Partial<PaymentParams>): string {
    const {
      req_time = "",
      merchant_id = "",
      tran_id = "",
      amount = "",
      items = "",
      shipping = "",
      firstname = "",
      lastname = "",
      email = "",
      phone = "",
      type = "",
      payment_option = "",
      return_url = "",
      cancel_url = "",
      continue_success_url = "",
      return_deeplink = "",
      currency = "",
      custom_fields = "",
      return_params = "",
      payout = "",
      lifetime = "",
      additional_params = "",
      google_pay_token = "",
      skip_success_page = "",
    } = params;

    // Concatenate all parameters in the exact order required by ABA PayWay
    const dataToHash =
      req_time +
      merchant_id +
      tran_id +
      amount +
      items +
      shipping +
      firstname +
      lastname +
      email +
      phone +
      type +
      payment_option +
      return_url +
      cancel_url +
      continue_success_url +
      return_deeplink +
      currency +
      custom_fields +
      return_params +
      payout +
      lifetime +
      additional_params +
      google_pay_token +
      skip_success_page;

    // Generate HMAC SHA-512 hash and encode in Base64
    return Buffer.from(
      crypto
        .createHmac("sha512", this.config.apiKey)
        .update(dataToHash)
        .digest()
    ).toString("base64");
  }

  /**
   * Generate a merchant reference number for ABA PayWay (max 20 characters)
   * This will be sent as merchant_ref_no to identify our order
   */
  private generateMerchantRefNo(orderId: string): string {
    // Format: ORD-{last8chars}-{timestamp}
    // This keeps it under 20 characters and human-readable
    const orderSuffix = orderId.slice(-8); // Last 8 chars of MongoDB ObjectId
    const timestamp = Date.now().toString(36).slice(-6); // Last 6 chars of base36 timestamp
    const merchantRefNo = `ORD-${orderSuffix}-${timestamp}`;

    return merchantRefNo.substring(0, 20); // Ensure max 20 chars
  }

  /**
   * Get the merchant reference number for an order
   */
  getMerchantRefNo(orderId: string): string {
    return this.generateMerchantRefNo(orderId);
  }

  /**
   * Create payment parameters for ABA PayWay API
   */
  createPaymentParams(request: PaymentRequest): PaymentParams {
    if (!this.isEnabled()) {
      throw new Error("ABA PayWay is not properly configured");
    }

    // Generate request time in YYYYMMDDHHmmss format
    const reqTime = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);

    // Use provided merchant reference number or generate new one
    const merchantRefNo =
      request.merchantRefNo || this.generateMerchantRefNo(request.orderId);

    console.log("[ABA PayWay] Using merchant reference number:", {
      orderId: request.orderId,
      merchantRefNo: merchantRefNo,
      wasProvided: !!request.merchantRefNo,
    });

    // Encode items as base64 JSON according to ABA PayWay documentation
    // Format: [{"name": "product 1", "quantity": 1, "price": 1.00}, ...]
    const formattedItems = request.items.map((item: PaymentItem) => ({
      name: item.name,
      quantity: item.quantity,
      price: parseFloat(item.price.toFixed(2)),
    }));
    const itemsBase64 = Buffer.from(JSON.stringify(formattedItems)).toString(
      "base64"
    );

    // Put merchant reference number in custom_fields as base64 encoded JSON
    const customFields = Buffer.from(
      JSON.stringify({
        merchant_ref_no: merchantRefNo,
        order_id: request.orderId,
      })
    ).toString("base64");

    const params: Partial<PaymentParams> = {
      req_time: reqTime,
      merchant_id: this.config.merchantId,
      tran_id: merchantRefNo, // Use merchant ref no as tran_id for now
      firstname: request.customerInfo.firstname || "",
      lastname: request.customerInfo.lastname || "",
      email: request.customerInfo.email || "",
      phone: request.customerInfo.phone || "",
      type: ABA_PAYWAY_TRANSACTION_TYPES.PURCHASE,
      payment_option: "", // Empty means show all available payment methods
      items: itemsBase64,
      shipping: "0.00",
      amount: request.amount.toFixed(2),
      currency: request.currency,
      return_url: request.returnUrl,
      cancel_url: request.cancelUrl,
      skip_success_page: "1", // Skip ABA PayWay success page
      continue_success_url: request.continueSuccessUrl,
      return_deeplink: "",
      custom_fields: customFields,
      return_params: merchantRefNo, // Also include in return_params
      view_type: "hosted_view", // Full page view for new tab (as per ABA PayWay docs)
      payment_gate: "0", // Use checkout service
      payout: "",
      lifetime: "", // Use default lifetime
      additional_params: "",
      google_pay_token: "",
    };

    // Generate hash for all parameters
    const hash = this.generateHash(params);

    return {
      ...params,
      hash,
    } as PaymentParams;
  }

  /**
   * Verify callback signature from ABA PayWay
   */
  verifyCallback(params: ABAPayWayCallbackParams): boolean {
    if (!this.isEnabled()) {
      return false;
    }

    const { hash, ...otherParams } = params;

    // According to ABA PayWay documentation, callback hash format is:
    // tran_id + status + apv + merchant_id
    const dataToHash =
      String(otherParams.tran_id || "") +
      String(otherParams.status || "") +
      String(otherParams.apv || "") +
      String(otherParams.merchant_id || this.config.merchantId);

    console.log("[ABA PayWay] Callback verification data:", {
      tran_id: otherParams.tran_id,
      status: otherParams.status,
      apv: otherParams.apv,
      merchant_id: otherParams.merchant_id || this.config.merchantId,
      dataToHash: dataToHash,
      receivedHash: hash,
    });

    const expectedHash = Buffer.from(
      crypto
        .createHmac("sha512", this.config.apiKey)
        .update(dataToHash)
        .digest()
    ).toString("base64");

    console.log("[ABA PayWay] Hash verification:", {
      expectedHash: expectedHash,
      receivedHash: hash,
      matches: hash === expectedHash,
    });

    return hash === expectedHash;
  }

  /**
   * Get ABA PayWay payment URL
   */
  getPaymentUrl(): string {
    return `${this.config.baseUrl}/api/payment-gateway/v1/payments/purchase`;
  }

  /**
   * Get configuration for debugging (without sensitive data)
   */
  getConfig(): Omit<ABAPayWayConfig, "apiKey"> {
    return {
      merchantId: this.config.merchantId,
      baseUrl: this.config.baseUrl,
      enabled: this.config.enabled,
    };
  }
}

// Export singleton instance
export const abaPayWayService = new ABAPayWayService();

// Export class for testing
export { ABAPayWayService };
