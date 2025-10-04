'use client';

import { BadgeDollarSign, Barcode, CreditCard, Users, BarChart3, TrendingUp, BarChart2, Clock, ChevronLeft, LayoutDashboard } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { calculatePastDate, formatDateTime, formatNumber } from '@/lib/utils';

import SalesCategoryBarChart from './sales-category-bar-chart';

import React, { useEffect, useState, useTransition } from 'react';
import { DateRange } from 'react-day-picker';
import { getOrderSummary } from '@/lib/actions/order.actions';
import SalesAreaChart from './sales-area-chart';
import { CalendarDateRangePicker } from './date-range-picker';
import { IOrderList } from '@/types';
import ProductPrice from '@/components/shared/product/product-price';
import { Skeleton } from '@/components/ui/skeleton';
import TableChart from './table-chart';

export default function OverviewReport() {
  const t = useTranslations('Admin');
  const [date, setDate] = useState<DateRange | undefined>({
    from: calculatePastDate(30),
    to: new Date(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<{ [key: string]: any }>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (date) {
      startTransition(async () => {
        setData(await getOrderSummary(date));
      });
    }
  }, [date]);

  if (!data) {
    return (
      <div className="space-y-6">
        {/* Professional Header - Loading State */}
        <div className="space-y-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button asChild variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
              <Link href="/admin/overview" className="flex items-center gap-1 hover:text-foreground">
                <ChevronLeft className="h-4 w-4" />
                Admin
              </Link>
            </Button>
            <span>/</span>
            <span className="text-foreground">Dashboard</span>
          </div>

          {/* Page Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <LayoutDashboard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Monitor your store performance and key metrics
                </p>
              </div>
            </div>
            
            {/* Date Range Filter Skeleton */}
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
        {/* First Row */}
        <div className="flex gap-4">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>

        {/* Third Row - Charts */}
        <div>
          <Skeleton className="h-[30rem] w-full" />
        </div>

        {/* Fourth Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, index) => (
            <Skeleton key={index} className="h-80 w-full" />
          ))}
        </div>

        {/* Fifth Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, index) => (
            <Skeleton key={index} className="h-96 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="space-y-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
            <Link href="/admin/overview" className="flex items-center gap-1 hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              Admin
            </Link>
          </Button>
          <span>/</span>
          <span className="text-foreground">Dashboard</span>
        </div>

        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              <LayoutDashboard className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t('Dashboard')}</h1>
              <p className="text-muted-foreground mt-1">
                Monitor your store performance and key metrics
              </p>
            </div>
          </div>
          
          {/* Date Range Filter */}
          <div>
            <CalendarDateRangePicker defaultDate={date} setDate={setDate} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('Total Revenue')}
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                <BadgeDollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">
                <ProductPrice price={data.totalSales} plain />
              </div>
              <div>
                <Link className="text-xs" href="/admin/orders">
                  {t('View revenue')}
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('Sales')}
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">
                {formatNumber(data.ordersCount)}
              </div>
              <div>
                <Link className="text-xs" href="/admin/orders">
                  {t('View orders')}
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('Customers')}
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">{data.usersCount}</div>
              <div>
                <Link className="text-xs" href="/admin/users">
                  {t('View customers')}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                </div>
                {t('Sales Overview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SalesAreaChart data={data.salesChartData} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
                    Revenue by Month
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    {t('Last 6 months')} · Monthly performance
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TableChart data={data.monthlySales} labelType="month" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950">
                      <Barcode className="h-4 w-4 text-blue-600" />
                    </div>
                    Top Selling Products
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    {formatDateTime(date!.from!).dateOnly} to{' '}
                    {formatDateTime(date!.to!).dateOnly}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TableChart data={data.topSalesProducts} labelType="product" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950">
                  <BarChart2 className="h-4 w-4 text-rose-600" />
                </div>
                {t('Best-Selling Categories')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SalesCategoryBarChart data={data.topSalesCategories} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950">
                      <Clock className="h-4 w-4 text-indigo-600" />
                    </div>
                    Recent Orders
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    Latest {data.latestOrders.length} customer transactions
                  </CardDescription>
                </div>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.latestOrders.map((order: IOrderList, index: number) => (
                  <Link 
                    key={order._id} 
                    href={`/admin/orders/${order._id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Order Number Badge */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">#{index + 1}</span>
                        </div>
                        
                        {/* Customer Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {order.user ? order.user.name : t('Deleted User')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(order.createdAt).dateTime}
                          </p>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ProductPrice 
                          price={order.totalPrice} 
                          plain 
                          className="text-sm font-semibold"
                        />
                        <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
                
                {data.latestOrders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent orders</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}