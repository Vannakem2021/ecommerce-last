'use client';

import { BadgeDollarSign, Barcode, CreditCard, Users, BarChart3, TrendingUp, PieChart, Clock, ChevronLeft, LayoutDashboard } from 'lucide-react';
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

import SalesCategoryPieChart from './sales-category-pie-chart';

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
          <div className="flex items-center justify-between">
            <div>
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
            </div>
            <Skeleton className="h-10 w-64" />
          </div>
        </div>
        {/* First Row */}
        <div className="flex gap-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>

        {/* Second Row */}
        <div>
          <Skeleton className="h-[30rem] w-full" />
        </div>

        {/* Third Row */}
        <div className="flex gap-4">
          {[...Array(2)].map((_, index) => (
            <Skeleton key={index} className="h-60 w-full" />
          ))}
        </div>

        {/* Fourth Row */}
        <div className="flex gap-4">
          {[...Array(2)].map((_, index) => (
            <Skeleton key={index} className="h-60 w-full" />
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
        <div className="flex items-center justify-between">
          <div>
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
          </div>
          <CalendarDateRangePicker defaultDate={date} setDate={setDate} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('Products')}
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950">
                <Barcode className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">{data.productsCount}</div>
              <div>
                <Link className="text-xs" href="/admin/products">
                  {t('View products')}
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
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                </div>
How much you're earning
              </CardTitle>
              <CardDescription>
                {t('Estimated')} · {t('Last 6 months')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TableChart data={data.monthlySales} labelType="month" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-violet-50 dark:bg-violet-950">
                  <Barcode className="h-4 w-4 text-violet-600" />
                </div>
                {t('Product Performance')}
              </CardTitle>
              <CardDescription>
                {formatDateTime(date!.from!).dateOnly} to{' '}
                {formatDateTime(date!.to!).dateOnly}
              </CardDescription>
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
                  <PieChart className="h-4 w-4 text-rose-600" />
                </div>
                {t('Best-Selling Categories')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SalesCategoryPieChart data={data.topSalesCategories} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-cyan-50 dark:bg-cyan-950">
                  <Clock className="h-4 w-4 text-cyan-600" />
                </div>
                {t('Recent Sales')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Buyer')}</TableHead>
                    <TableHead>{t('Date')}</TableHead>
                    <TableHead>{t('Total')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.latestOrders.map((order: IOrderList) => (
                    <TableRow key={order._id}>
                      <TableCell>
                        {order.user ? order.user.name : t('Deleted User')}
                      </TableCell>

                      <TableCell>
                        {formatDateTime(order.createdAt).dateOnly}
                      </TableCell>
                      <TableCell>
                        <ProductPrice price={order.totalPrice} plain />
                      </TableCell>

                      <TableCell>
                        <Link href={`/admin/orders/${order._id}`}>
                          <span className="px-2">{t('Details')}</span>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}