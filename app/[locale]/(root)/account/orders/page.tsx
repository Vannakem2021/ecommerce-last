import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

import Pagination from "@/components/shared/pagination";
import { getMyOrders } from "@/lib/actions/order.actions";
import { IOrder } from "@/lib/db/models/order.model";

// Extended order type with ABA PayWay fields
interface OrderWithABAPayWay extends Omit<IOrder, 'abaLastStatusCheck' | 'abaPaymentStatus'> {
  abaPaymentStatus?: string;
  abaLastStatusCheck?: string;
}
import { formatId, cn } from "@/lib/utils";
import ProductPrice from "@/components/shared/product/product-price";
import { Package, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{PAGE_TITLE}</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all your orders
        </p>
      </div>

      {orders.data.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Package className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-base font-medium mb-1">No orders yet</p>
              <p className="text-sm mb-4">Start shopping to see your orders here</p>
              <Link 
                href="/search" 
                className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:text-primary/80 transition-colors"
              >
                Browse products <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="bg-card rounded-lg border">
            <div className="grid grid-cols-[1.2fr_1.5fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b bg-muted/30">
              <div className="font-semibold text-sm">Order #</div>
              <div className="font-semibold text-sm">Date</div>
              <div className="font-semibold text-sm">Total</div>
              <div className="font-semibold text-sm">Status</div>
              <div className="font-semibold text-sm text-right">Actions</div>
            </div>

            <div className="divide-y">
              {orders.data.map((order: OrderWithABAPayWay) => {
                let status = 'Processing'
                let statusColor = 'bg-blue-100 text-blue-700'
                
                if (order.isDelivered) {
                  status = 'Delivered'
                  statusColor = 'bg-green-100 text-green-700'
                } else if (order.isPaid) {
                  status = 'Shipped'
                  statusColor = 'bg-blue-100 text-blue-700'
                } else {
                  status = 'Pending'
                  statusColor = 'bg-amber-100 text-amber-700'
                }

                return (
                  <div 
                    key={order._id} 
                    className="grid grid-cols-[1.2fr_1.5fr_1fr_1fr_1fr] gap-4 px-6 py-4 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="font-semibold text-green-600">
                        #{order.orderNumber || formatId(order._id)}
                      </span>
                    </div>

                    <div className="flex items-center text-muted-foreground">
                      {new Date(order.createdAt!).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>

                    <div className="flex items-center font-medium">
                      <ProductPrice price={order.totalPrice} plain />
                    </div>

                    <div className="flex items-center">
                      <span className={cn('px-3 py-1 rounded-full text-xs font-medium', statusColor)}>
                        {status}
                      </span>
                    </div>

                    <div className="flex items-center justify-end">
                      <Link 
                        href={`/account/orders/${order._id}`}
                        className="text-green-600 hover:text-green-700 font-medium text-sm transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {orders.totalPages > 1 && (
            <Pagination page={page} totalPages={orders.totalPages} />
          )}
        </>
      )}
    </div>
  );
}
