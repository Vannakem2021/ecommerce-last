// Utility class for ABA PayWay status code handling

export class ABAPayWayStatusService {
  /**
   * Utility class for ABA PayWay status code handling
   * Note: API status checking functionality has been removed in favor of callback-only approach
   */



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


}

// Export singleton instance
export const abaPayWayStatusService = new ABAPayWayStatusService();
