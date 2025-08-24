"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
} from "lucide-react";
import { usePaymentStatus } from "@/hooks/use-payment-status";
import { PaymentStatus } from "./payment-status";
import { PaymentStatusHistory } from "./payment-status-history";

interface OrderWithABAPayWay {
  _id: string;
  paymentMethod: string;
  abaMerchantRefNo?: string;
  abaPaymentStatus?: string;
  abaTransactionId?: string;
  abaStatusCode?: number;
  abaLastStatusCheck?: string;
  abaCallbackReceived?: boolean;
  abaStatusHistory?: Array<{
    status: string;
    statusCode: number;
    timestamp: string;
    source: "callback" | "api_check" | "manual";
    details?: string;
  }>;
  isPaid: boolean;
}

interface AdminPaymentStatusProps {
  orderId: string;
  order: OrderWithABAPayWay;
  className?: string;
}

export function AdminPaymentStatus({
  orderId,
  order,
  className = "",
}: AdminPaymentStatusProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { isChecking, error, checkStatus } = usePaymentStatus();

  const handleForceRefresh = async () => {
    const result = await checkStatus(orderId, false);
    if (result) {
      // Force re-render of child components
      setRefreshKey((prev) => prev + 1);
    }
  };

  const getOrderStatusSummary = () => {
    const summary = {
      hasABAPayWay: order.paymentMethod === "ABA PayWay",
      hasMerchantRef: !!order.abaMerchantRefNo,
      hasStatusHistory: (order.abaStatusHistory?.length ?? 0) > 0,
      callbackReceived: order.abaCallbackReceived,
      currentStatus: order.abaPaymentStatus || "unknown",
      isPaid: order.isPaid,
      lastChecked: order.abaLastStatusCheck,
    };

    return summary;
  };

  const summary = getOrderStatusSummary();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
      case "cancelled":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (!summary.hasABAPayWay) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This order does not use ABA PayWay payment method.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Admin Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Payment Status Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Payment Method</div>
              <div className="font-medium">ABA PayWay</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Current Status</div>
              <div className="flex items-center justify-center gap-1">
                {getStatusIcon(summary.currentStatus)}
                <span className="font-medium capitalize">
                  {summary.currentStatus}
                </span>
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Callback</div>
              <Badge
                variant={summary.callbackReceived ? "default" : "destructive"}
              >
                {summary.callbackReceived ? "Received" : "Missing"}
              </Badge>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Order Status</div>
              <Badge variant={summary.isPaid ? "default" : "destructive"}>
                {summary.isPaid ? "Paid" : "Unpaid"}
              </Badge>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleForceRefresh}
              disabled={isChecking}
              variant="outline"
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Force Status Check
            </Button>

            <Button
              variant="outline"
              onClick={() => window.open(`/admin/orders/${orderId}`, "_blank")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Order Settings
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Diagnostic Information */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>Transaction ID: {order.abaMerchantRefNo || "Not set"}</div>
            <div>ABA Transaction ID: {order.abaTransactionId || "Not set"}</div>
            <div>Status Code: {order.abaStatusCode ?? "Not set"}</div>
            <div>
              Last Checked:{" "}
              {summary.lastChecked
                ? new Date(summary.lastChecked).toLocaleString()
                : "Never"}
            </div>
            <div>
              Status History Events: {order.abaStatusHistory?.length || 0}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Component */}
      <PaymentStatus
        key={`status-${refreshKey}`}
        orderId={orderId}
        initialStatus={order.abaPaymentStatus}
        initialStatusCode={order.abaStatusCode}
        initialLastChecked={order.abaLastStatusCheck}
        showRefresh={true} // Keep manual refresh for admin
        autoPolling={true} // Enable auto-polling for admin too
      />

      {/* Payment Status History */}
      <PaymentStatusHistory
        key={`history-${refreshKey}`}
        orderId={orderId}
        history={order.abaStatusHistory || []}
      />

      {/* Troubleshooting Guide */}
      {(!summary.callbackReceived || summary.currentStatus === "pending") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Troubleshooting Guide</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {!summary.hasMerchantRef && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No merchant reference number found. This order may not have
                  been properly submitted to ABA PayWay.
                </AlertDescription>
              </Alert>
            )}

            {!summary.callbackReceived && summary.hasMerchantRef && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No callback received from ABA PayWay. Use &quot;Force Status
                  Check&quot; to verify payment status manually.
                </AlertDescription>
              </Alert>
            )}

            {summary.currentStatus === "pending" && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Payment is still pending. Customer may not have completed the
                  payment process.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
