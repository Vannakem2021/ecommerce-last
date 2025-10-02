import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

import Pagination from "@/components/shared/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMyOrders } from "@/lib/actions/order.actions";
import { IOrder } from "@/lib/db/models/order.model";

// Extended order type with ABA PayWay fields
interface OrderWithABAPayWay extends Omit<IOrder, 'abaLastStatusCheck' | 'abaPaymentStatus'> {
  abaPaymentStatus?: string;
  abaLastStatusCheck?: string;
}
import { formatDateTime, formatId } from "@/lib/utils";
import BrowsingHistoryList from "@/components/shared/browsing-history-list";
import ProductPrice from "@/components/shared/product/product-price";
import { Badge } from "@/components/ui/badge";
import { ViewInvoiceButton } from "@/components/shared/invoice/invoice-actions";

const PAGE_TITLE = "Your Orders";
export const metadata: Metadata = {
  title: PAGE_TITLE,
};
export default async function OrdersPage(props: {
  searchParams: Promise<{ page: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const orders = await getMyOrders({
    page,
  });
  return (
    <div>
      <div className="flex gap-2">
        <Link href="/account">Your Account</Link>
        <span>›</span>
        <span>{PAGE_TITLE}</span>
      </div>
      <h1 className="h1-bold pt-4">{PAGE_TITLE}</h1>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="">
                  You have no orders.
                </TableCell>
              </TableRow>
            )}
            {orders.data.map((order: OrderWithABAPayWay) => (
              <TableRow key={order._id}>
                <TableCell>
                  <Link href={`/account/orders/${order._id}`}>
                    {formatId(order._id)}
                  </Link>
                </TableCell>
                <TableCell>
                  {formatDateTime(order.createdAt!).dateTime}
                </TableCell>
                <TableCell>
                  <ProductPrice price={order.totalPrice} plain />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {order.isPaid && order.paidAt ? (
                      <Badge className="bg-green-100 text-green-800">
                        Paid {formatDateTime(order.paidAt).dateTime}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Not Paid</Badge>
                    )}
                    {order.paymentMethod === "ABA PayWay" &&
                      order.abaPaymentStatus && (
                        <div className="text-xs text-gray-500">
                          ABA: {order.abaPaymentStatus}
                        </div>
                      )}
                  </div>
                </TableCell>
                <TableCell>
                  {order.isDelivered && order.deliveredAt
                    ? formatDateTime(order.deliveredAt).dateTime
                    : "No"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/account/orders/${order._id}`}>
                      <span className="px-2 text-blue-600 hover:text-blue-800 underline">Details</span>
                    </Link>
                    {order.isPaid && (
                      <ViewInvoiceButton
                        orderId={order._id}
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {orders.totalPages > 1 && (
          <Pagination page={page} totalPages={orders.totalPages} />
        )}
      </div>
      <BrowsingHistoryList className="mt-16" />
    </div>
  );
}
