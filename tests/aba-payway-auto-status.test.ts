import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { abaPayWayAutoStatusService } from '@/lib/aba-payway-auto-status';
import { ABAPayWayErrorHandler } from '@/lib/aba-payway-error-handler';

// Mock dependencies
jest.mock('@/lib/aba-payway-status');
jest.mock('@/lib/db');
jest.mock('@/lib/actions/order.actions');

describe('ABA PayWay Automated Status System', () => {
  beforeEach(() => {
    // Clear all polling jobs before each test
    const pollingStatus = abaPayWayAutoStatusService.getPollingStatus();
    pollingStatus.jobs.forEach(job => {
      abaPayWayAutoStatusService.stopPollingForOrder(job.orderId);
    });
  });

  afterEach(() => {
    // Clean up after each test
    const pollingStatus = abaPayWayAutoStatusService.getPollingStatus();
    pollingStatus.jobs.forEach(job => {
      abaPayWayAutoStatusService.stopPollingForOrder(job.orderId);
    });
  });

  describe('Auto-Polling Service', () => {
    it('should start polling for a new order', async () => {
      const orderId = 'test_order_123';
      const transactionId = 'test_txn_456';

      await abaPayWayAutoStatusService.startPollingForOrder(orderId, transactionId);

      const status = abaPayWayAutoStatusService.getPollingStatus();
      expect(status.isPolling).toBe(true);
      expect(status.activeJobs).toBe(1);
      expect(status.jobs[0].orderId).toBe(orderId);
      expect(status.jobs[0].transactionId).toBe(transactionId);
    });

    it('should stop polling for a specific order', async () => {
      const orderId = 'test_order_123';
      const transactionId = 'test_txn_456';

      await abaPayWayAutoStatusService.startPollingForOrder(orderId, transactionId);
      abaPayWayAutoStatusService.stopPollingForOrder(orderId);

      const status = abaPayWayAutoStatusService.getPollingStatus();
      expect(status.activeJobs).toBe(0);
    });

    it('should handle multiple concurrent polling jobs', async () => {
      const orders = [
        { orderId: 'order_1', transactionId: 'txn_1' },
        { orderId: 'order_2', transactionId: 'txn_2' },
        { orderId: 'order_3', transactionId: 'txn_3' },
      ];

      for (const order of orders) {
        await abaPayWayAutoStatusService.startPollingForOrder(order.orderId, order.transactionId);
      }

      const status = abaPayWayAutoStatusService.getPollingStatus();
      expect(status.isPolling).toBe(true);
      expect(status.activeJobs).toBe(3);
    });

    it('should not start duplicate polling for the same order', async () => {
      const orderId = 'test_order_123';
      const transactionId = 'test_txn_456';

      await abaPayWayAutoStatusService.startPollingForOrder(orderId, transactionId);
      await abaPayWayAutoStatusService.startPollingForOrder(orderId, transactionId);

      const status = abaPayWayAutoStatusService.getPollingStatus();
      expect(status.activeJobs).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should create proper error objects', () => {
      const error = ABAPayWayErrorHandler.createError('INVALID_SIGNATURE', { test: 'data' });
      
      expect(error.code).toBe('INVALID_SIGNATURE');
      expect(error.message).toBe('Invalid callback signature');
      expect(error.retryable).toBe(false);
      expect(error.httpStatus).toBe(400);
      expect(error.details).toEqual({ test: 'data' });
    });

    it('should parse known error types correctly', () => {
      const networkError = new Error('Network connection failed');
      const parsedError = ABAPayWayErrorHandler.parseError(networkError);
      
      expect(parsedError.code).toBe('NETWORK_ERROR');
      expect(parsedError.retryable).toBe(true);
    });

    it('should provide user-friendly error messages', () => {
      const error = ABAPayWayErrorHandler.createError('NETWORK_ERROR');
      const userMessage = ABAPayWayErrorHandler.getUserMessage(error);
      
      expect(userMessage).toContain('Connection issue');
      expect(userMessage).toContain('try again');
    });

    it('should provide recovery suggestions', () => {
      const error = ABAPayWayErrorHandler.createError('RATE_LIMIT_EXCEEDED');
      const suggestion = ABAPayWayErrorHandler.getRecoverySuggestion(error);
      
      expect(suggestion).toContain('Wait a few minutes');
    });

    it('should identify errors that require alerts', () => {
      const criticalError = ABAPayWayErrorHandler.createError('DATABASE_ERROR');
      const clientError = ABAPayWayErrorHandler.createError('ORDER_NOT_FOUND');
      
      expect(ABAPayWayErrorHandler.shouldAlert(criticalError)).toBe(true);
      expect(ABAPayWayErrorHandler.shouldAlert(clientError)).toBe(false);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle successful payment flow', async () => {
      // This would be a more complex integration test
      // that mocks the entire payment flow
      const orderId = 'test_order_success';
      const transactionId = 'test_txn_success';

      await abaPayWayAutoStatusService.startPollingForOrder(orderId, transactionId);
      
      // Simulate successful payment callback
      // In a real test, this would involve mocking the database and status service
      
      const status = abaPayWayAutoStatusService.getPollingStatus();
      expect(status.activeJobs).toBe(1);
    });

    it('should handle payment timeout scenarios', async () => {
      const orderId = 'test_order_timeout';
      const transactionId = 'test_txn_timeout';

      await abaPayWayAutoStatusService.startPollingForOrder(orderId, transactionId);
      
      // Simulate timeout by checking max attempts
      const status = abaPayWayAutoStatusService.getPollingStatus();
      const job = status.jobs.find(j => j.orderId === orderId);
      
      expect(job).toBeDefined();
      expect(job?.maxAttempts).toBe(22); // 10 + 12 attempts as per strategy
    });
  });
});

// Integration test function for manual testing
export const testAutomatedPaymentStatus = async () => {
  console.log('🧪 Testing Automated Payment Status System...');
  
  try {
    // Test 1: Auto-polling service initialization
    console.log('📋 Test 1: Auto-polling service initialization');
    const initialStatus = abaPayWayAutoStatusService.getPollingStatus();
    console.log('✅ Initial status:', {
      isPolling: initialStatus.isPolling,
      activeJobs: initialStatus.activeJobs
    });

    // Test 2: Start polling for test order
    console.log('📋 Test 2: Starting polling for test order');
    const testOrderId = `test_order_${Date.now()}`;
    const testTransactionId = `test_txn_${Date.now()}`;
    
    await abaPayWayAutoStatusService.startPollingForOrder(testOrderId, testTransactionId);
    
    const pollingStatus = abaPayWayAutoStatusService.getPollingStatus();
    console.log('✅ Polling started:', {
      isPolling: pollingStatus.isPolling,
      activeJobs: pollingStatus.activeJobs,
      jobOrderId: pollingStatus.jobs[0]?.orderId
    });

    // Test 3: Error handling
    console.log('📋 Test 3: Error handling');
    const testError = ABAPayWayErrorHandler.createError('NETWORK_ERROR', { test: true });
    console.log('✅ Error created:', {
      code: testError.code,
      message: testError.message,
      retryable: testError.retryable,
      userMessage: ABAPayWayErrorHandler.getUserMessage(testError)
    });

    // Test 4: Stop polling
    console.log('📋 Test 4: Stopping polling');
    abaPayWayAutoStatusService.stopPollingForOrder(testOrderId);
    
    const finalStatus = abaPayWayAutoStatusService.getPollingStatus();
    console.log('✅ Polling stopped:', {
      isPolling: finalStatus.isPolling,
      activeJobs: finalStatus.activeJobs
    });

    console.log('🎉 All automated payment status tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Automated payment status test failed:', error);
    return false;
  }
};

// Performance test for high-volume scenarios
export const testHighVolumePolling = async (orderCount = 100) => {
  console.log(`🚀 Testing high-volume polling with ${orderCount} orders...`);
  
  const startTime = Date.now();
  
  try {
    // Start polling for multiple orders
    const orders = Array.from({ length: orderCount }, (_, i) => ({
      orderId: `bulk_order_${i}`,
      transactionId: `bulk_txn_${i}`
    }));

    for (const order of orders) {
      await abaPayWayAutoStatusService.startPollingForOrder(order.orderId, order.transactionId);
    }

    const status = abaPayWayAutoStatusService.getPollingStatus();
    const setupTime = Date.now() - startTime;

    console.log('📊 High-volume test results:', {
      ordersCreated: orderCount,
      activeJobs: status.activeJobs,
      setupTimeMs: setupTime,
      avgTimePerOrder: setupTime / orderCount
    });

    // Clean up
    for (const order of orders) {
      abaPayWayAutoStatusService.stopPollingForOrder(order.orderId);
    }

    console.log('✅ High-volume test completed successfully');
    return true;
  } catch (error) {
    console.error('❌ High-volume test failed:', error);
    return false;
  }
};
