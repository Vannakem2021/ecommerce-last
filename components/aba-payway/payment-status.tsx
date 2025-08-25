"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  History,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentStatusProps {
  orderId: string;
  initialStatus?: string;
  initialStatusCode?: number;
  initialLastChecked?: string;
  showRefresh?: boolean;
  className?: string;
}

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

export function PaymentStatus({
  orderId,
  initialStatus = "pending",
  initialStatusCode,
  initialLastChecked,
  showRefresh = true,
  className = "",
}: PaymentStatusProps) {
  const [status, setStatus] = useState(initialStatus);
  const [statusCode, setStatusCode] = useState(initialStatusCode);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(
    initialLastChecked || null
  );
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const { toast } = useToast();

  const checkStatus = useCallback(
    async (silent = false) => {
      if (!silent) setIsChecking(true);
      setError(null);

      try {
        const response = await fetch("/api/aba-payway/check-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        const data: StatusCheckResponse = await response.json();

        if (response.ok && data.success) {
          setStatus(data.paymentStatus);
          setStatusCode(data.status);
          setLastChecked(data.lastChecked);
          setIsPaid(data.isPaid);

          if (!silent) {
            toast({
              title: "Status Updated",
              description: `Payment status: ${data.paymentStatus}`,
            });
          }

          // Show success toast if payment completed
          if (data.isPaid && status !== "completed") {
            toast({
              title: "Payment Completed! 🎉",
              description: `Payment of ${data.amount} ${data.currency} was successful`,
            });
          }
        } else {
          const errorMessage = data.error || "Failed to check payment status";
          setError(errorMessage);

          if (!silent) {
            toast({
              title: "Status Check Failed",
              description: errorMessage,
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        const errorMessage = "Network error while checking status";
        setError(errorMessage);

        if (!silent) {
          toast({
            title: "Connection Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } finally {
        if (!silent) setIsChecking(false);
      }
    },
    [orderId, toast]
  );

  // Simple auto-refresh for pending payments (basic polling every 30 seconds)
  useEffect(() => {
    if (status === "pending" || status === "processing") {
      const interval = setInterval(() => {
        checkStatus(true); // Silent check
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [status, checkStatus]);

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case "completed":
        return "Payment has been successfully processed";
      case "failed":
        return "Payment processing failed";
      case "cancelled":
        return "Payment was cancelled";
      case "processing":
        return "Payment is being processed";
      case "pending":
        return "Waiting for payment confirmation";
      default:
        return "Unknown payment status";
    }
  };

  const shouldShowAlert = () => {
    return status === "failed" || status === "cancelled" || error;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          ABA PayWay Payment Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge and Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className={`${getStatusColor()} font-medium`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {statusCode !== undefined && ` (${statusCode})`}
            </Badge>

            {showRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => checkStatus()}
                disabled={isChecking}
              >
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isChecking ? "Checking..." : "Refresh"}
              </Button>
            )}
          </div>

          <p className="text-sm text-gray-600">{getStatusDescription()}</p>
        </div>

        {/* Error Alert */}
        {shouldShowAlert() && (
          <Alert variant={error ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || getStatusDescription()}
            </AlertDescription>
          </Alert>
        )}

        {/* Last Checked Info */}
        {lastChecked && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <History className="h-3 w-3" />
            Last checked: {new Date(lastChecked).toLocaleString()}
          </div>
        )}

        {/* Auto-refresh indicator for pending payments */}
        {(status === "pending" || status === "processing") && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            🔄 Auto-checking status every 30 seconds...
          </div>
        )}

        {/* Success indicator */}
        {isPaid && status === "completed" && (
          <div className="text-xs text-green-600 bg-green-50 p-2 rounded flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Payment confirmed and order updated
          </div>
        )}
      </CardContent>
    </Card>
  );
}
