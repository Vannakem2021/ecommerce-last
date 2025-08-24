import { abaPayWayStatusService } from "./aba-payway-status";
import { connectToDatabase } from "./db";
import Order from "./db/models/order.model";
import { updateOrderToPaid } from "./actions/order.actions";
import { ABA_PAYWAY_STATUS_CODES } from "@/types/aba-payway";

interface PollingJob {
  orderId: string;
  transactionId: string;
  startTime: Date;
  attempts: number;
  nextPollTime: Date;
  maxAttempts: number;
}

class ABAPayWayAutoStatusService {
  private pollingJobs = new Map<string, PollingJob>();
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;

  /**
   * Start automatic status polling for a new order
   */
  async startPollingForOrder(orderId: string, transactionId: string): Promise<void> {
    console.log(`[ABA Auto Status] Starting polling for order ${orderId}`);

    const pollingJob: PollingJob = {
      orderId,
      transactionId,
      startTime: new Date(),
      attempts: 0,
      nextPollTime: new Date(Date.now() + 30000), // First poll in 30 seconds
      maxAttempts: 22, // 10 attempts (30s intervals) + 12 attempts (2min intervals) = 30 minutes total
    };

    this.pollingJobs.set(orderId, pollingJob);
    this.ensurePollingActive();
  }

  /**
   * Stop polling for a specific order
   */
  stopPollingForOrder(orderId: string): void {
    console.log(`[ABA Auto Status] Stopping polling for order ${orderId}`);
    this.pollingJobs.delete(orderId);
    
    if (this.pollingJobs.size === 0) {
      this.stopPolling();
    }
  }

  /**
   * Ensure the polling mechanism is active
   */
  private ensurePollingActive(): void {
    if (!this.isPolling && this.pollingJobs.size > 0) {
      this.startPolling();
    }
  }

  /**
   * Start the polling mechanism
   */
  private startPolling(): void {
    if (this.isPolling) return;

    console.log("[ABA Auto Status] Starting polling mechanism");
    this.isPolling = true;

    this.pollingInterval = setInterval(async () => {
      await this.processPollingJobs();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Stop the polling mechanism
   */
  private stopPolling(): void {
    if (!this.isPolling) return;

    console.log("[ABA Auto Status] Stopping polling mechanism");
    this.isPolling = false;

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Process all active polling jobs
   */
  private async processPollingJobs(): Promise<void> {
    const now = new Date();
    const jobsToProcess = Array.from(this.pollingJobs.values()).filter(
      job => job.nextPollTime <= now
    );

    for (const job of jobsToProcess) {
      try {
        await this.processPollingJob(job);
      } catch (error) {
        console.error(`[ABA Auto Status] Error processing job for order ${job.orderId}:`, error);
      }
    }
  }

  /**
   * Process a single polling job
   */
  private async processPollingJob(job: PollingJob): Promise<void> {
    const { orderId, transactionId, attempts, maxAttempts } = job;

    console.log(`[ABA Auto Status] Polling order ${orderId}, attempt ${attempts + 1}/${maxAttempts}`);

    try {
      // Check if service is enabled
      if (!abaPayWayStatusService.isEnabled()) {
        console.warn(`[ABA Auto Status] Service disabled, stopping polling for order ${orderId}`);
        this.stopPollingForOrder(orderId);
        return;
      }

      // Check transaction status
      const statusResult = await abaPayWayStatusService.checkTransactionStatus(transactionId);
      
      // Update job attempt count
      job.attempts++;

      // Process the status result
      const shouldContinuePolling = await this.processStatusResult(orderId, statusResult);

      if (!shouldContinuePolling || job.attempts >= maxAttempts) {
        // Stop polling for this order
        this.stopPollingForOrder(orderId);
      } else {
        // Schedule next poll
        this.scheduleNextPoll(job);
      }
    } catch (error) {
      console.error(`[ABA Auto Status] Error checking status for order ${orderId}:`, error);
      
      job.attempts++;
      
      if (job.attempts >= maxAttempts) {
        console.warn(`[ABA Auto Status] Max attempts reached for order ${orderId}, stopping polling`);
        this.stopPollingForOrder(orderId);
      } else {
        // Schedule retry with exponential backoff
        this.scheduleNextPoll(job, true);
      }
    }
  }

  /**
   * Process the status result and update the order
   */
  private async processStatusResult(orderId: string, statusResult: any): Promise<boolean> {
    try {
      await connectToDatabase();
      
      const order = await Order.findById(orderId);
      if (!order) {
        console.error(`[ABA Auto Status] Order ${orderId} not found`);
        return false; // Stop polling
      }

      // If order is already paid, stop polling
      if (order.isPaid) {
        console.log(`[ABA Auto Status] Order ${orderId} already paid, stopping polling`);
        return false;
      }

      const statusString = abaPayWayStatusService.getStatusString(statusResult.status);
      const statusDescription = abaPayWayStatusService.getStatusDescription(statusResult.status);

      // Create status history entry
      const statusEntry = {
        status: statusString,
        statusCode: statusResult.status,
        timestamp: new Date(),
        source: "auto_poll" as const,
        details: statusResult.description || statusDescription,
      };

      // Update order with latest status
      const updateData: any = {
        abaStatusCode: statusResult.status,
        abaLastStatusCheck: new Date(),
        abaPaymentStatus: statusString,
        abaTransactionId: statusResult.tran_id,
      };

      // If payment is successful
      if (statusResult.status === ABA_PAYWAY_STATUS_CODES.SUCCESS) {
        // Verify amount matches
        const orderAmount = parseFloat(order.totalPrice.toFixed(2));
        const paidAmount = parseFloat(statusResult.amount);

        if (Math.abs(orderAmount - paidAmount) <= 0.01) {
          // Mark order as paid
          updateData.isPaid = true;
          updateData.paidAt = new Date();
          updateData.paymentResult = {
            id: statusResult.tran_id,
            status: "COMPLETED",
            email_address: order.user?.email || "",
            pricePaid: paidAmount.toFixed(2),
          };

          console.log(`[ABA Auto Status] Marking order ${orderId} as paid via auto-polling`);
          
          // Use the existing updateOrderToPaid function for consistency
          await updateOrderToPaid(orderId);
        } else {
          console.error(`[ABA Auto Status] Amount mismatch for order ${orderId}`, {
            expected: orderAmount,
            received: paidAmount,
          });
          statusEntry.details = `Amount mismatch: expected ${orderAmount}, received ${paidAmount}`;
        }

        return false; // Stop polling - payment processed
      }

      // If payment failed or cancelled
      if (statusResult.status === ABA_PAYWAY_STATUS_CODES.CANCELLED || 
          statusResult.status === ABA_PAYWAY_STATUS_CODES.DECLINED ||
          statusResult.status === ABA_PAYWAY_STATUS_CODES.ERROR) {
        console.log(`[ABA Auto Status] Payment failed/cancelled for order ${orderId}, status: ${statusResult.status}`);
        return false; // Stop polling - payment failed
      }

      // Update order in database
      await Order.findByIdAndUpdate(orderId, {
        $set: updateData,
        $push: {
          abaStatusHistory: statusEntry,
        },
      });

      // Continue polling if status is still pending
      return statusResult.status === 4; // PENDING status
    } catch (error) {
      console.error(`[ABA Auto Status] Error processing status result for order ${orderId}:`, error);
      return true; // Continue polling on error
    }
  }

  /**
   * Schedule the next poll for a job
   */
  private scheduleNextPoll(job: PollingJob, isRetry = false): void {
    const now = Date.now();
    let nextPollDelay: number;

    if (isRetry) {
      // Exponential backoff for retries: 30s, 60s, 120s
      nextPollDelay = Math.min(30000 * Math.pow(2, job.attempts - 1), 120000);
    } else {
      // Follow ABA PayWay recommended polling strategy
      if (job.attempts < 10) {
        // First 5 minutes: poll every 30 seconds
        nextPollDelay = 30000;
      } else {
        // Next 25 minutes: poll every 2 minutes
        nextPollDelay = 120000;
      }
    }

    job.nextPollTime = new Date(now + nextPollDelay);
    
    console.log(`[ABA Auto Status] Next poll for order ${job.orderId} scheduled in ${nextPollDelay / 1000}s`);
  }

  /**
   * Get current polling status for debugging
   */
  getPollingStatus(): { isPolling: boolean; activeJobs: number; jobs: PollingJob[] } {
    return {
      isPolling: this.isPolling,
      activeJobs: this.pollingJobs.size,
      jobs: Array.from(this.pollingJobs.values()),
    };
  }

  /**
   * Force check status for a specific order (for manual triggers)
   */
  async forceCheckOrder(orderId: string): Promise<boolean> {
    const job = this.pollingJobs.get(orderId);
    if (!job) {
      console.warn(`[ABA Auto Status] No active polling job for order ${orderId}`);
      return false;
    }

    try {
      await this.processPollingJob(job);
      return true;
    } catch (error) {
      console.error(`[ABA Auto Status] Error force checking order ${orderId}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const abaPayWayAutoStatusService = new ABAPayWayAutoStatusService();
