"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Smartphone,
  Globe,
  User,
} from "lucide-react";

interface PaymentStatusHistoryEntry {
  status: string;
  statusCode: number;
  timestamp: string;
  source: "callback" | "api_check" | "manual";
  details?: string;
}

interface PaymentStatusHistoryProps {
  history?: PaymentStatusHistoryEntry[];
  className?: string;
}

export function PaymentStatusHistory({
  history = [],
  className = "",
}: PaymentStatusHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "callback":
        return <Smartphone className="h-4 w-4 text-blue-500" />;
      case "api_check":
        return <Globe className="h-4 w-4 text-green-500" />;
      case "manual":
        return <User className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "callback":
        return "ABA PayWay Callback";
      case "api_check":
        return "Status Check API";
      case "manual":
        return "Manual Update";
      default:
        return "Unknown Source";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date),
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Sort history by timestamp (newest first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Payment Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No status history available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Payment Status History ({history.length})
              </CardTitle>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {sortedHistory.map((entry, index) => {
                const timestamp = formatTimestamp(entry.timestamp);

                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50/50"
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(entry.status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          className={`${getStatusColor(entry.status)} text-xs`}
                        >
                          {entry.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Code: {entry.statusCode}
                        </span>
                      </div>

                      {entry.details && (
                        <p className="text-sm text-gray-700 mb-2">
                          {entry.details}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {getSourceIcon(entry.source)}
                        <span>{getSourceLabel(entry.source)}</span>
                        <span>•</span>
                        <span title={`${timestamp.date} ${timestamp.time}`}>
                          {timestamp.relative}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-3 border-t text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>
                  Latest:{" "}
                  {sortedHistory[0] &&
                    formatTimestamp(sortedHistory[0].timestamp).relative}
                </span>
                <span>Total events: {history.length}</span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
