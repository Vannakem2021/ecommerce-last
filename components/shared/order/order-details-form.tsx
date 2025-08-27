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
interface OrderWithABAPayWay extends IOrder {
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
    <div className="grid md:grid-cols-3 md:gap-5">
      <div className="overflow-x-auto md:col-span-2 space-y-4">
        <Card>
          <CardContent className="p-4 gap-4">
            <h2 className="text-xl pb-4">Shipping Address</h2>
            <AddressDisplay address={shippingAddress} />

            {isDelivered ? (
              <Badge>
                Delivered at {formatDateTime(deliveredAt!).dateTime}
              </Badge>
            ) : (
              <div>
                {" "}
                <Badge variant="destructive">Not delivered</Badge>
                <div>
                  Expected delivery at{" "}
                  {formatDateTime(expectedDeliveryDate!).dateTime}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 gap-4">
            <h2 className="text-xl pb-4">Payment Method</h2>
            <p>{paymentMethod}</p>
            {isPaid ? (
              <Badge>Paid at {formatDateTime(paidAt!).dateTime}</Badge>
            ) : (
              <Badge variant="destructive">Not paid</Badge>
            )}
          </CardContent>
        </Card>

        {/* ABA PayWay Payment Status History */}
        {paymentMethod === "ABA PayWay" && (
          <PaymentStatusHistory
            history={(order.abaStatusHistory || []).filter(entry => entry.source !== "api_check")}
            className="mb-4"
          />
        )}
        <Card>
          <CardContent className="p-4   gap-4">
            <h2 className="text-xl pb-4">Order Items</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.slug}>
                    <TableCell>
                      <Link
                        href={`/product/${item.slug}`}
                        className="flex items-center"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={50}
                          height={50}
                        ></Image>
                        <span className="px-2">{item.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="px-2">{item.quantity}</span>
                    </TableCell>
                    <TableCell className="text-right">${item.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardContent className="p-4  space-y-4 gap-4">
            <h2 className="text-xl pb-4">Order Summary</h2>
            <div className="flex justify-between">
              <div>Items</div>
              <div>
                {" "}
                <ProductPrice price={itemsPrice} plain />
              </div>
            </div>
            <div className="flex justify-between">
              <div>Tax</div>
              <div>
                {" "}
                <ProductPrice price={taxPrice} plain />
              </div>
            </div>
            <div className="flex justify-between">
              <div>Shipping</div>
              <div>
                {" "}
                <ProductPrice price={shippingPrice} plain />
              </div>
            </div>
            <div className="flex justify-between">
              <div>Total</div>
              <div>
                {" "}
                <ProductPrice price={totalPrice} plain />
              </div>
            </div>

            {!isPaid && paymentMethod === "ABA PayWay" && (
              <Link
                className={cn(buttonVariants(), "w-full")}
                href={`/checkout/${order._id}`}
              >
                Pay Order
              </Link>
            )}

            {isAdmin && !isPaid && paymentMethod === "Cash On Delivery" && (
              <ActionButton
                caption="Mark as paid"
                action={() => updateOrderToPaid(order._id)}
              />
            )}
            {isAdmin && isPaid && !isDelivered && (
              <ActionButton
                caption="Mark as delivered"
                action={() => deliverOrder(order._id)}
              />
            )}

            {/* Invoice Section - Show for paid orders */}
            {isPaid && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Invoice</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Download or print your invoice for this order.
                </p>
                <InvoiceActions
                  invoiceNumber={generateInvoiceNumber(order)}
                  orderId={order._id}
                  variant="outline"
                  size="sm"
                  showLabels={true}
                  className="justify-start"
                  isAdmin={isAdmin}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
