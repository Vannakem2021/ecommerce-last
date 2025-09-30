"use client";

import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

// Extended order type with ABA PayWay fields
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
}
import { cn, formatDateTime } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import ProductPrice from "../product/product-price";
import ActionButton from "../action-button";
import { deliverOrder, updateOrderToPaid } from "@/lib/actions/order.actions";
import { PaymentStatusHistory } from "@/components/aba-payway/payment-status-history";
import InvoiceActions from "@/components/shared/invoice/invoice-actions";
import { generateInvoiceNumber } from "@/lib/utils/invoice-utils";

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
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Shipping & Payment */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold">Shipping Address</h2>
              </div>
              <AddressDisplay address={shippingAddress} />

              <div className="mt-4">
                {isDelivered ? (
                  <Badge className="bg-green-600 hover:bg-green-700">
                    Delivered at {formatDateTime(deliveredAt!).dateTime}
                  </Badge>
                ) : (
                  <div className="space-y-2">
                    <Badge variant="outline">Not delivered</Badge>
                    <div className="text-sm text-muted-foreground">
                      Expected delivery: {formatDateTime(expectedDeliveryDate!).dateTime}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{paymentMethod}</span>
                  {isPaid ? (
                    <Badge className="bg-green-600 hover:bg-green-700">
                      Paid
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Unpaid</Badge>
                  )}
                </div>

                {isPaid && paidAt && (
                  <div className="text-sm text-muted-foreground">
                    Paid on {formatDateTime(paidAt).dateTime}
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  {!isPaid && paymentMethod === "Cash On Delivery" && (
                    <ActionButton
                      caption="Mark as paid"
                      action={() => updateOrderToPaid(order._id)}
                    />
                  )}
                  {isPaid && !isDelivered && (
                    <ActionButton
                      caption="Mark as delivered"
                      action={() => deliverOrder(order._id)}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ABA PayWay Payment Status History */}
          {paymentMethod === "ABA PayWay" && (
            <PaymentStatusHistory
              history={(order.abaStatusHistory || [])
                .filter((entry): entry is { status: string; statusCode: number; timestamp: string; source: "callback" | "manual"; details?: string } =>
                  entry.source === "callback" || entry.source === "manual"
                )}
            />
          )}
        </div>

        {/* Center Column - Order Items */}
        <div className="lg:col-span-2">
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
                    {items.map((item) => (
                      <TableRow key={item.slug} className="hover:bg-muted/50">
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
                              <div className="text-sm text-muted-foreground">
                                SKU: {item.slug}
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
        </div>
      </div>

      {/* Bottom Section - Summary & Invoice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Summary */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <ProductPrice price={itemsPrice} plain />
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <ProductPrice price={taxPrice} plain />
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <ProductPrice price={shippingPrice} plain />
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <ProductPrice price={totalPrice} plain />
                </div>
              </div>
            </div>

            {/* Payment Action for ABA PayWay */}
            {!isPaid && paymentMethod === "ABA PayWay" && (
              <div className="mt-4 pt-4 border-t">
                <Link
                  className={cn(buttonVariants(), "w-full")}
                  href={`/checkout/${order._id}`}
                >
                  Complete Payment
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Actions - Consolidated */}
        {isPaid && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Invoice</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Download or print your invoice for this order.
              </p>
              <InvoiceActions
                orderId={order._id}
                variant="outline"
                size="default"
                showLabels={true}
                className="justify-start"
                isAdmin={isAdmin}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
