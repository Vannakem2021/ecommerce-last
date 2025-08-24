import { NextResponse } from "next/server";

export interface ABAPayWayError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  httpStatus: number;
}

export class ABAPayWayErrorHandler {
  private static readonly ERROR_CODES = {
    // Network and connectivity errors
    NETWORK_ERROR: {
      code: "NETWORK_ERROR",
      message: "Network connection failed",
      retryable: true,
      httpStatus: 503,
    },
    TIMEOUT_ERROR: {
      code: "TIMEOUT_ERROR", 
      message: "Request timed out",
      retryable: true,
      httpStatus: 504,
    },
    
    // Authentication and authorization errors
    INVALID_SIGNATURE: {
      code: "INVALID_SIGNATURE",
      message: "Invalid callback signature",
      retryable: false,
      httpStatus: 400,
    },
    UNAUTHORIZED: {
      code: "UNAUTHORIZED",
      message: "Unauthorized access",
      retryable: false,
      httpStatus: 401,
    },
    
    // Data validation errors
    ORDER_NOT_FOUND: {
      code: "ORDER_NOT_FOUND",
      message: "Order not found",
      retryable: false,
      httpStatus: 404,
    },
    AMOUNT_MISMATCH: {
      code: "AMOUNT_MISMATCH",
      message: "Payment amount does not match order amount",
      retryable: false,
      httpStatus: 400,
    },
    INVALID_PAYMENT_METHOD: {
      code: "INVALID_PAYMENT_METHOD",
      message: "Invalid payment method for this order",
      retryable: false,
      httpStatus: 400,
    },
    ORDER_ALREADY_PAID: {
      code: "ORDER_ALREADY_PAID",
      message: "Order is already paid",
      retryable: false,
      httpStatus: 400,
    },
    
    // Service configuration errors
    SERVICE_DISABLED: {
      code: "SERVICE_DISABLED",
      message: "ABA PayWay service is not available",
      retryable: false,
      httpStatus: 503,
    },
    CONFIGURATION_ERROR: {
      code: "CONFIGURATION_ERROR",
      message: "ABA PayWay service configuration error",
      retryable: false,
      httpStatus: 503,
    },
    
    // Database errors
    DATABASE_ERROR: {
      code: "DATABASE_ERROR",
      message: "Database operation failed",
      retryable: true,
      httpStatus: 500,
    },
    
    // ABA PayWay API errors
    API_ERROR: {
      code: "API_ERROR",
      message: "ABA PayWay API error",
      retryable: true,
      httpStatus: 502,
    },
    RATE_LIMIT_EXCEEDED: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "API rate limit exceeded",
      retryable: true,
      httpStatus: 429,
    },
    
    // Generic errors
    UNKNOWN_ERROR: {
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
      retryable: false,
      httpStatus: 500,
    },
  } as const;

  /**
   * Create a standardized error from a known error type
   */
  static createError(
    errorType: keyof typeof ABAPayWayErrorHandler.ERROR_CODES,
    details?: any
  ): ABAPayWayError {
    const errorTemplate = this.ERROR_CODES[errorType];
    return {
      ...errorTemplate,
      details,
    };
  }

  /**
   * Parse and categorize an error from various sources
   */
  static parseError(error: any): ABAPayWayError {
    // Handle known error types
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes("invalid signature")) {
        return this.createError("INVALID_SIGNATURE", error);
      }
      if (message.includes("order not found")) {
        return this.createError("ORDER_NOT_FOUND", error);
      }
      if (message.includes("amount mismatch")) {
        return this.createError("AMOUNT_MISMATCH", error);
      }
      if (message.includes("already paid")) {
        return this.createError("ORDER_ALREADY_PAID", error);
      }
      if (message.includes("unauthorized")) {
        return this.createError("UNAUTHORIZED", error);
      }
      if (message.includes("not properly configured")) {
        return this.createError("CONFIGURATION_ERROR", error);
      }
      if (message.includes("service disabled") || message.includes("not available")) {
        return this.createError("SERVICE_DISABLED", error);
      }
      if (message.includes("network") || message.includes("connection")) {
        return this.createError("NETWORK_ERROR", error);
      }
      if (message.includes("timeout")) {
        return this.createError("TIMEOUT_ERROR", error);
      }
      if (message.includes("database") || message.includes("mongodb")) {
        return this.createError("DATABASE_ERROR", error);
      }
      if (message.includes("rate limit")) {
        return this.createError("RATE_LIMIT_EXCEEDED", error);
      }
    }

    // Handle HTTP response errors
    if (error.status) {
      if (error.status === 401) {
        return this.createError("UNAUTHORIZED", error);
      }
      if (error.status === 404) {
        return this.createError("ORDER_NOT_FOUND", error);
      }
      if (error.status === 429) {
        return this.createError("RATE_LIMIT_EXCEEDED", error);
      }
      if (error.status >= 500) {
        return this.createError("API_ERROR", error);
      }
    }

    // Default to unknown error
    return this.createError("UNKNOWN_ERROR", error);
  }

  /**
   * Create a NextResponse from an ABAPayWayError
   */
  static createResponse(error: ABAPayWayError): NextResponse {
    const responseBody = {
      success: false,
      error: error.message,
      code: error.code,
      retryable: error.retryable,
      ...(error.details && { details: error.details }),
    };

    return NextResponse.json(responseBody, { status: error.httpStatus });
  }

  /**
   * Handle errors with automatic retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: ABAPayWayError | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.parseError(error);
        
        console.error(`[ABA PayWay] Attempt ${attempt} failed:`, {
          code: lastError.code,
          message: lastError.message,
          retryable: lastError.retryable,
        });

        // Don't retry non-retryable errors
        if (!lastError.retryable) {
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Log errors with appropriate level and context
   */
  static logError(
    error: ABAPayWayError,
    context: string,
    additionalData?: any
  ): void {
    const logData = {
      context,
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      httpStatus: error.httpStatus,
      timestamp: new Date().toISOString(),
      ...(additionalData && { additionalData }),
      ...(error.details && { details: error.details }),
    };

    if (error.httpStatus >= 500) {
      console.error("[ABA PayWay] Critical Error:", logData);
    } else if (error.httpStatus >= 400) {
      console.warn("[ABA PayWay] Client Error:", logData);
    } else {
      console.info("[ABA PayWay] Info:", logData);
    }
  }

  /**
   * Check if an error should trigger an alert/notification
   */
  static shouldAlert(error: ABAPayWayError): boolean {
    const alertCodes = [
      "CONFIGURATION_ERROR",
      "SERVICE_DISABLED", 
      "DATABASE_ERROR",
      "RATE_LIMIT_EXCEEDED",
    ];
    
    return alertCodes.includes(error.code) || error.httpStatus >= 500;
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: ABAPayWayError): string {
    const userMessages: Record<string, string> = {
      NETWORK_ERROR: "Connection issue. Please check your internet and try again.",
      TIMEOUT_ERROR: "Request timed out. Please try again.",
      INVALID_SIGNATURE: "Payment verification failed. Please contact support.",
      ORDER_NOT_FOUND: "Order not found. Please check your order details.",
      AMOUNT_MISMATCH: "Payment amount verification failed. Please contact support.",
      ORDER_ALREADY_PAID: "This order has already been paid.",
      SERVICE_DISABLED: "Payment service is temporarily unavailable. Please try again later.",
      CONFIGURATION_ERROR: "Payment service configuration issue. Please contact support.",
      DATABASE_ERROR: "Temporary system issue. Please try again.",
      API_ERROR: "Payment service error. Please try again.",
      RATE_LIMIT_EXCEEDED: "Too many requests. Please wait a moment and try again.",
      UNAUTHORIZED: "Access denied. Please log in and try again.",
      INVALID_PAYMENT_METHOD: "Invalid payment method for this order.",
    };

    return userMessages[error.code] || "An unexpected error occurred. Please try again or contact support.";
  }

  /**
   * Create a recovery suggestion for an error
   */
  static getRecoverySuggestion(error: ABAPayWayError): string {
    const suggestions: Record<string, string> = {
      NETWORK_ERROR: "Check your internet connection and refresh the page.",
      TIMEOUT_ERROR: "Refresh the page and try again.",
      RATE_LIMIT_EXCEEDED: "Wait a few minutes before trying again.",
      SERVICE_DISABLED: "Try again later or contact support if the issue persists.",
      DATABASE_ERROR: "Refresh the page. If the problem continues, contact support.",
      API_ERROR: "Refresh the page. If the problem continues, contact support.",
      CONFIGURATION_ERROR: "Contact support for assistance.",
      INVALID_SIGNATURE: "Contact support for assistance.",
      AMOUNT_MISMATCH: "Contact support for assistance.",
    };

    return suggestions[error.code] || "Contact support if the problem persists.";
  }
}

// Export convenience functions
export const createABAError = ABAPayWayErrorHandler.createError;
export const parseABAError = ABAPayWayErrorHandler.parseError;
export const withABARetry = ABAPayWayErrorHandler.withRetry;
export const logABAError = ABAPayWayErrorHandler.logError;
