// ABA PayWay Integration Types

export interface ABAPayWayConfig {
  merchantId: string;
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
}

export interface CustomerInfo {
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
}

export interface PaymentItem {
  name: string;
  quantity: number;
  price: number;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  customerInfo: CustomerInfo;
  items: PaymentItem[];
  returnUrl: string;
  cancelUrl: string;
  continueSuccessUrl: string;
  merchantRefNo?: string; // Optional: if provided, use this instead of generating new one
}

export interface PaymentParams {
  req_time: string;
  merchant_id: string;
  tran_id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  type: string;
  payment_option: string;
  items: string;
  shipping: string;
  amount: string;
  currency: string;
  return_url: string;
  cancel_url: string;
  skip_success_page: string;
  continue_success_url: string;
  return_deeplink: string;
  custom_fields: string;
  return_params: string;
  view_type: string;
  payment_gate: string;
  payout: string;
  lifetime: string;
  additional_params: string;
  google_pay_token: string;
  hash: string;
}

// Updated callback parameters interface based on official ABA PayWay documentation
export interface ABAPayWayCallbackParams {
  tran_id: string; // ABA PayWay transaction ID
  status: number; // Status code as integer (0 = success)
  apv: string; // Approved amount as string
  [key: string]: string | number | undefined;
}

export interface ABAPayWayResponse {
  success: boolean;
  paymentUrl?: string;
  paymentParams?: PaymentParams;
  error?: string;
}

// ABA PayWay status codes from official documentation
export const ABA_PAYWAY_STATUS_CODES = {
  SUCCESS: 0, // Payment successful/approved (integer)
  CANCELLED: 1, // Payment cancelled
  DECLINED: 2, // Payment declined
  ERROR: 3, // Payment error
  // Add more status codes as documented
} as const;

export type ABAPayWayStatusCode =
  (typeof ABA_PAYWAY_STATUS_CODES)[keyof typeof ABA_PAYWAY_STATUS_CODES];

// Payment status constants (for backward compatibility)
export const ABA_PAYWAY_STATUS = {
  SUCCESS: "success",
  FAILED: "failed",
  PENDING: "pending",
  CANCELLED: "cancelled",
} as const;

export type ABAPayWayStatus =
  (typeof ABA_PAYWAY_STATUS)[keyof typeof ABA_PAYWAY_STATUS];

// Payment options available in ABA PayWay
export const ABA_PAYWAY_PAYMENT_OPTIONS = {
  ALL: "", // Show all available payment methods
  CARDS: "cards",
  ABA_PAY_KHQR: "abapay_khqr",
  ABA_PAY_KHQR_DEEPLINK: "abapay_khqr_deeplink",
  ALIPAY: "alipay",
  WECHAT: "wechat",
  GOOGLE_PAY: "google_pay",
} as const;

export type ABAPayWayPaymentOption =
  (typeof ABA_PAYWAY_PAYMENT_OPTIONS)[keyof typeof ABA_PAYWAY_PAYMENT_OPTIONS];

// Supported currencies
export const ABA_PAYWAY_CURRENCIES = {
  USD: "USD",
  KHR: "KHR",
} as const;

export type ABAPayWayCurrency =
  (typeof ABA_PAYWAY_CURRENCIES)[keyof typeof ABA_PAYWAY_CURRENCIES];

// Transaction types
export const ABA_PAYWAY_TRANSACTION_TYPES = {
  PURCHASE: "purchase",
  PRE_AUTH: "pre-auth",
} as const;

export type ABAPayWayTransactionType =
  (typeof ABA_PAYWAY_TRANSACTION_TYPES)[keyof typeof ABA_PAYWAY_TRANSACTION_TYPES];

// Enhanced payment status tracking interfaces
export interface PaymentStatusHistoryEntry {
  status: string;
  statusCode: number;
  timestamp: Date;
  source: "callback" | "api_check" | "manual";
  details?: string;
}

export interface ABAPayWayStatusCheckRequest {
  tran_id: string;
  merchant_id: string;
  hash: string;
}

export interface ABAPayWayStatusCheckResponse {
  tran_id: string;
  status: number;
  amount: string;
  currency: string;
  payment_date?: string;
  description?: string;
}

export interface PayWayCheckTransactionResponse {
  status: number;
  description: string;
  amount?: number;
  totalAmount?: number;
  apv?: string;
  datetime?: string;
  original_currency?: string;
  payout?: { acc: string; amt: string }[];
  tran_id?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  bank_ref?: string;
  payer_account?: string;
  phone?: string;
  payment_type?: string;
  [key: string]: any; // catch-all for other fields
}
