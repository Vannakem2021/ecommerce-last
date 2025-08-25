import crypto from "crypto";
import {
  ABAPayWayStatusCheckRequest,
  ABAPayWayStatusCheckResponse,
  ABAPayWayConfig,
} from "@/types/aba-payway";
import { getSetting } from "@/lib/actions/setting.actions";

export class ABAPayWayStatusService {
  private config: ABAPayWayConfig;

  constructor() {
    this.config = {
      merchantId: process.env.PAYWAY_MERCHANT_ID || "",
      apiKey: process.env.PAYWAY_SECRET_KEY || "",
      baseUrl:
        process.env.PAYWAY_BASE_URL || "https://checkout-sandbox.payway.com.kh",
      enabled: process.env.PAYWAY_ENABLED === "true",
    };
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
            process.env.PAYWAY_MERCHANT_ID ||
            "",
          apiKey: process.env.PAYWAY_SECRET_KEY || "",
          baseUrl: settings.abaPayWay.sandboxMode
            ? "https://checkout-sandbox.payway.com.kh"
            : "https://checkout.payway.com.kh",
          enabled:
            settings.abaPayWay.enabled && !!process.env.PAYWAY_SECRET_KEY,
        };
      }
    } catch (error) {
      console.error("[ABA PayWay Status] Failed to load settings:", error);
    }
  }

  /**
   * Check if ABA PayWay status service is enabled and properly configured
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
   * Check the status of a transaction using ABA PayWay Check Transaction API
   */
  async checkTransactionStatus(
    transactionId: string
  ): Promise<ABAPayWayStatusCheckResponse> {
    if (!this.isEnabled()) {
      throw new Error("ABA PayWay status service is not properly configured");
    }

    // Load latest settings
    await this.loadSettingsConfig();

    const requestData: Omit<ABAPayWayStatusCheckRequest, "hash"> = {
      tran_id: transactionId,
      merchant_id: this.config.merchantId,
    };

    // Generate hash for status check
    const hash = this.generateStatusCheckHash(requestData);

    const requestPayload: ABAPayWayStatusCheckRequest = {
      ...requestData,
      hash,
    };

    console.log("[ABA PayWay Status] Checking transaction status:", {
      tran_id: transactionId,
      merchant_id: this.config.merchantId,
      baseUrl: this.config.baseUrl,
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/payment-gateway/v1/payments/check-transaction-2`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ABA PayWay Status] API error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `Status check failed: ${response.status} ${response.statusText}`
        );
      }

      const result: ABAPayWayStatusCheckResponse = await response.json();

      console.log("[ABA PayWay Status] Status check result:", {
        tran_id: result.tran_id,
        status: result.status,
        amount: result.amount,
        currency: result.currency,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      console.error("[ABA PayWay Status] Status check error:", error);
      throw error;
    }
  }

  /**
   * Generate HMAC SHA-512 hash for status check request
   */
  private generateStatusCheckHash(
    data: Omit<ABAPayWayStatusCheckRequest, "hash">
  ): string {
    console.log("[ABA PayWay Status] Generating hash for:", {
      tran_id: data.tran_id,
      merchant_id: data.merchant_id,
    });

    // Try the alternative format: merchant_id + tran_id
    // This is a common variation that some payment gateways use
    const dataToHash = data.merchant_id + data.tran_id;

    console.log("[ABA PayWay Status] Hash generation details:", {
      format: "merchant_id + tran_id (trying alternative)",
      dataToHash: dataToHash,
      secretKeyLength: this.config.apiKey ? this.config.apiKey.length : 0,
    });

    const hash = Buffer.from(
      crypto
        .createHmac("sha512", this.config.apiKey)
        .update(dataToHash)
        .digest()
    ).toString("base64");

    console.log("[ABA PayWay Status] Generated hash:", hash);

    return hash;
  }

  /**
   * Convert ABA PayWay status code to human-readable status
   */
  getStatusString(statusCode: number): string {
    switch (statusCode) {
      case 0:
        return "completed";
      case 1:
        return "cancelled";
      case 2:
        return "failed";
      case 3:
        return "failed";
      case 4:
        return "processing";
      default:
        return "unknown";
    }
  }

  /**
   * Get status description for logging and display
   */
  getStatusDescription(statusCode: number): string {
    switch (statusCode) {
      case 0:
        return "Payment completed successfully";
      case 1:
        return "Payment cancelled by user";
      case 2:
        return "Payment declined by bank";
      case 3:
        return "Payment processing error";
      case 4:
        return "Payment is still processing";
      default:
        return `Unknown status code: ${statusCode}`;
    }
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
export const abaPayWayStatusService = new ABAPayWayStatusService();
