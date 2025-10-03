"use client";

import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IOrder } from "@/lib/db/models/order.model";
import { AddressDisplay } from "@/components/shared/address/address-display";

// Extended order type with ABA PayWay fields and internal notes
interface OrderWithABAPayWay extends Omit<IOrder, 'abaLastStatusCheck' | 'abaPaymentStatus' | 'abaStatusHistory'> {
  abaPaymentStatus?: string;
  abaStatusCode?: number;
  abaLastStatusCheck?: string;
  abaStatusHistory?: Array<{
    status: string;
    statusCode: number;
    timestamp: string;
    source: "callback" | "api_check" | "manual";
    details?: string;
  }>;
  internalNotes?: Array<{
    note: string;
    createdBy: {
      _id?: string;
      name: string;
    };
    createdAt: Date | string;
  }>;
}
import { formatDateTime } from "@/lib/utils";
import ProductPrice from "../product/product-price";
import { PaymentStatusHistory } from "@/components/aba-payway/payment-status-history";
import { MarkDeliveredDialog } from "./mark-delivered-dialog";
import { MarkPaidDialog } from "./mark-paid-dialog";
import { generateOrderNumber } from "@/lib/utils/order-utils";
import OrderActivityTimeline from "./order-activity-timeline";
import OrderCustomerSummary from "./order-customer-summary";
import OrderInternalNotes from "./order-internal-notes";
import { AlertCircleIcon, PackageIcon, PrinterIcon } from "lucide-react";

export default function OrderDetailsForm({
  order,
  isAdmin,
}: {
  order: OrderWithABAPayWay;
  isAdmin: boolean;
}) {
  const {
    shippingAddress,
    items,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    isPaid,
    paidAt,
    isDelivered,
    deliveredAt,
    expectedDeliveryDate,
  } = order;

  return (
    <div className="space-y-6">
      {/* Action Required Banner */}
      {isAdmin && !isPaid && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Payment Confirmation Required
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  This order is awaiting payment confirmation. Please verify payment and mark as paid.
                </p>
              </div>
              <MarkPaidDialog
                orderId={order._id}
                orderNumber={generateOrderNumber(order._id, order.createdAt!)}
                customerName={order.user?.name}
                totalPrice={totalPrice}
                variant="default"
                size="sm"
                showLabel={true}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {isAdmin && isPaid && !isDelivered && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <PackageIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Ready to Ship
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Payment received. Mark as delivered when the order has been shipped.
                </p>
              </div>
              <MarkDeliveredDialog
                orderId={order._id}
                orderNumber={generateOrderNumber(order._id, order.createdAt!)}
                customerName={order.user?.name}
                totalPrice={totalPrice}
                variant="default"
                size="sm"
                showLabel={true}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer, Shipping & Payment */}
        <div className="space-y-6">
          {/* Customer Summary */}
          <OrderCustomerSummary
            customer={order.user as { name: string; email?: string } | null}
            phone={shippingAddress.phone}
            isAdmin={isAdmin}
          />

          {/* Shipping Address */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
              <AddressDisplay address={shippingAddress} />

              <div className="mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {isDelivered ? (
                      <Badge className="bg-green-600 hover:bg-green-700">
                        Delivered
                      </Badge>
                    ) : (
                      <Badge variant="outline">In Transit</Badge>
                    )}
                  </div>
                  {isDelivered ? (
                    <div className="text-sm text-muted-foreground">
                      Delivered: {formatDateTime(deliveredAt!).dateTime}
                    </div>
                  ) : (
                    expectedDeliveryDate && (
                      <div className="text-sm text-muted-foreground">
                        Expected: {formatDateTime(expectedDeliveryDate).dateTime}
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Method</span>
                  <span className="font-medium">{paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {isPaid ? (
                    <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>
                  ) : (
                    <Badge variant="destructive">Unpaid</Badge>
                  )}
                </div>
                {isPaid && paidAt && (
                  <div className="text-sm text-muted-foreground pt-2 border-t">
                    Paid on {formatDateTime(paidAt).dateTime}
                  </div>
                )}
              </div>

              {/* Print Invoice */}
              {isPaid && (
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/admin/orders/${order._id}/invoice`} target="_blank">
                      <PrinterIcon className="h-4 w-4 mr-2" />
                      View Invoice
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <OrderActivityTimeline
            createdAt={order.createdAt!}
            paidAt={paidAt}
            deliveredAt={deliveredAt}
            expectedDeliveryDate={expectedDeliveryDate}
            isPaid={isPaid}
            isDelivered={isDelivered}
          />

          {/* Internal Notes & History */}
          {isAdmin && (
            <OrderInternalNotes
              orderId={order._id}
              notes={order.internalNotes || []}
              orderCreatedAt={order.createdAt!}
              paidAt={paidAt}
              deliveredAt={deliveredAt}
              isPaid={isPaid}
              isDelivered={isDelivered}
            />
          )}

          {/* ABA PayWay Payment Status History - Collapsed by default */}
          {paymentMethod === "ABA PayWay" && order.abaStatusHistory && order.abaStatusHistory.length > 0 && (
            <PaymentStatusHistory
              history={(order.abaStatusHistory || [])
                .filter((entry): entry is { status: string; statusCode: number; timestamp: string; source: "callback" | "manual"; details?: string } =>
                  entry.source === "callback" || entry.source === "manual"
                )}
            />
          )}
        </div>

        {/* Right Column - Order Items & Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Order Items</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item: any, index: number) => (
                      <TableRow key={`${item.slug}-${index}`} className="hover:bg-muted/50">
                        <TableCell>
                          <Link
                            href={`/product/${item.slug}`}
                            className="flex items-center gap-3 hover:text-primary"
                          >
                            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                {item.color && (
                                  <div>Color: {item.color}</div>
                                )}
                                {item.size && (
                                  <div>Size: {item.size}</div>
                                )}
                                {item.sku && (
                                  <div>SKU: {item.sku}</div>
                                )}
                                {!item.sku && (
                                  <div>SKU: {item.slug}</div>
                                )}
                              </div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{item.quantity}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <ProductPrice price={item.price} plain />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <ProductPrice price={item.price * item.quantity} plain />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items Subtotal</span>
                  <ProductPrice price={itemsPrice} plain />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <ProductPrice price={taxPrice} plain />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <ProductPrice price={shippingPrice} plain />
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <ProductPrice price={totalPrice} plain />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
