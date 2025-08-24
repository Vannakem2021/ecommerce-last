'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface StatusCheckResponse {
  success: boolean;
  status: number;
  statusString: string;
  paymentStatus: string;
  amount?: string;
  currency?: string;
  isPaid: boolean;
  lastChecked: string;
  description?: string;
  error?: string;
}

interface UsePaymentStatusReturn {
  isChecking: boolean;
  error: string | null;
  checkStatus: (orderId: string, silent?: boolean) => Promise<StatusCheckResponse | null>;
  clearError: () => void;
}

export function usePaymentStatus(): UsePaymentStatusReturn {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const checkStatus = useCallback(async (
    orderId: string, 
    silent = false
  ): Promise<StatusCheckResponse | null> => {
    if (!silent) setIsChecking(true);
    setError(null);

    try {
      const response = await fetch('/api/aba-payway/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      const data: StatusCheckResponse = await response.json();

      if (response.ok && data.success) {
        if (!silent) {
          toast({
            title: "Status Updated",
            description: `Payment status: ${data.paymentStatus}`,
          });
        }

        // Show success toast if payment completed
        if (data.isPaid && data.paymentStatus === 'completed') {
          toast({
            title: "Payment Completed! 🎉",
            description: `Payment of ${data.amount} ${data.currency} was successful`,
          });
        }

        return data;
      } else {
        const errorMessage = data.error || 'Failed to check payment status';
        setError(errorMessage);
        
        if (!silent) {
          toast({
            title: "Status Check Failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
        
        return null;
      }
    } catch (error) {
      const errorMessage = 'Network error while checking status';
      setError(errorMessage);
      
      if (!silent) {
        toast({
          title: "Connection Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      return null;
    } finally {
      if (!silent) setIsChecking(false);
    }
  }, [toast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isChecking,
    error,
    checkStatus,
    clearError
  };
}
