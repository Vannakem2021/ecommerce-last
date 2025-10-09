"use client";

import { Card, CardContent } from "@/components/ui/card";
import { IOrder } from "@/lib/db/models/order.model";
import { formatDateTime } from "@/lib/utils";
import { generateOrderNumber } from "@/lib/utils/order-utils";
import { redirect, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ProductPrice from "@/components/shared/product/product-price";
import ABAPayWayForm from "./aba-payway-form";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Check, Mail, Package, Truck, ShoppingBag, CreditCard, AlertCircle } from "lucide-react";
import Link from "next/link";
export default function OrderDetailsForm({
  order,
}: {
  order: IOrder;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const {
    shippingAddress,
    items,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    expectedDeliveryDate,
    isPaid,
  } = order;

  // Determine if this is an unpaid ABA PayWay order
  const isUnpaidABAPayWay = !isPaid && paymentMethod === "ABA PayWay";

  // Trigger confetti animation ONLY for paid orders or Cash on Delivery
  useEffect(() => {
    // Skip confetti for unpaid ABA PayWay orders
    if (isUnpaidABAPayWay) {
      return;
    }

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, [isUnpaidABAPayWay]);

  if (isPaid) {
    redirect(`/account/orders/${order._id}`);
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Render Payment Page for unpaid ABA PayWay orders
  if (isUnpaidABAPayWay) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-12">
        <div className="space-y-6 md:space-y-8">
          {/* Payment Hero Section */}
          <div className="text-center space-y-4">
            {/* Payment Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-12 h-12 md:w-14 md:h-14 text-primary" />
              </div>
            </div>

            {/* Payment Message */}
            <div className="space-y-2">
              <h1 className="text-2xl md:text-4xl font-bold text-foreground">
                Complete Your Payment
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                Your order has been created. Complete payment to confirm your order.
              </p>
            </div>

            {/* Order Number */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm font-mono">
              <span className="text-muted-foreground">Order #</span>
              <span className="font-semibold">{generateOrderNumber(order._id.toString(), order.createdAt, (order as any).orderId)}</span>
            </div>
          </div>

          {/* Payment Card */}
          <Card className="rounded-lg border-2 border-primary">
            <CardContent className="p-6 md:p-8">
              <div className="space-y-6">
                {/* Order Total */}
                <div className="text-center pb-6 border-b">
                  <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
                  <p className="text-4xl font-bold">
                    <ProductPrice price={totalPrice} plain />
                  </p>
                </div>

                {/* Payment Button */}
                <ABAPayWayForm orderId={order._id} amount={order.totalPrice} />

                {/* Payment Details */}
                <div className="pt-6 border-t space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items ({totalItems})</span>
                    <span className="font-medium">
                      <ProductPrice price={itemsPrice} plain />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {shippingPrice === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        <ProductPrice price={shippingPrice} plain />
                      )}
                    </span>
                  </div>

                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary (Collapsible) */}
          <Card className="rounded-lg border border-border">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number</span>
                  <span className="font-medium font-mono">{generateOrderNumber(order._id.toString(), order.createdAt, (order as any).orderId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Delivery</span>
                  <span className="font-medium text-green-700">
                    {formatDateTime(expectedDeliveryDate).dateOnly}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping to</span>
                  <span className="font-medium text-right">
                    {shippingAddress.fullName}, {'communeName' in shippingAddress ? shippingAddress.communeName : ('city' in shippingAddress ? shippingAddress.city : '')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help? Contact our{" "}
              <Link href="/contact" className="text-primary hover:underline">
                customer support
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Render Success Page for Cash on Delivery and other payment methods
  return (
    <main className="max-w-4xl mx-auto px-4 py-6 md:py-12">
      <div className="space-y-6 md:space-y-8">
        {/* Success Hero Section */}
        <div className="text-center space-y-4">
          {/* Large Checkmark */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-green-600 flex items-center justify-center animate-scale-in">
                <Check className="w-12 h-12 md:w-14 md:h-14 text-white stroke-[3]" />
              </div>
              {/* Animated Ring */}
              <div className="absolute inset-0 rounded-full bg-green-600/20 animate-ping"></div>
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">
              Order Placed Successfully!
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Thank you for your order. We're getting it ready for you.
            </p>
          </div>

          {/* Order Number */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm font-mono">
            <span className="text-muted-foreground">Order #</span>
            <span className="font-semibold">{generateOrderNumber(order._id.toString(), order.createdAt, (order as any).orderId)}</span>
          </div>
        </div>

        {/* What's Next Section */}
        <Card className="rounded-lg border border-border">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-lg md:text-xl font-bold mb-6">What's Next?</h2>
            <div className="space-y-4">
              {/* Email Confirmation */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Check your email</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a confirmation email with your order details
                  </p>
                </div>
              </div>

              {/* Track Order */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Track your order</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor your order status in your account dashboard
                  </p>
                </div>
              </div>

              {/* Expected Delivery */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Expected delivery</h3>
                  <p className="text-sm text-green-700 font-semibold">
                    {formatDateTime(expectedDeliveryDate).dateOnly}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="flex-1"
            onClick={() => router.push(`/account/orders/${order._id}`)}
          >
            <Package className="w-5 h-5 mr-2" />
            View Order Details
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1"
            asChild
          >
            <Link href="/">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        {/* Quick Order Summary */}
        <Card className="rounded-lg border border-border">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-lg font-bold mb-4">Quick Order Summary</h2>
            <div className="space-y-3">
              {/* Items Count & Price */}
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-muted-foreground">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </span>
                <span className="font-semibold">
                  <ProductPrice price={itemsPrice} plain />
                </span>
              </div>

              {/* Shipping */}
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-semibold">
                  {shippingPrice === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    <ProductPrice price={shippingPrice} plain />
                  )}
                </span>
              </div>



              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-base md:text-lg font-bold">Total</span>
                <span className="text-xl md:text-2xl font-bold">
                  <ProductPrice price={totalPrice} plain />
                </span>
              </div>

              {/* Payment & Shipping Info */}
              <div className="pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping to</span>
                  <span className="font-medium text-right">
                    {shippingAddress.fullName}, {'communeName' in shippingAddress ? shippingAddress.communeName : ('city' in shippingAddress ? shippingAddress.city : '')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Need help? Contact our{" "}
            <Link href="/contact" className="text-primary hover:underline">
              customer support
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}
