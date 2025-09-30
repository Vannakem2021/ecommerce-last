"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  Tag,
  Layers,
  Warehouse,
  Percent,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { hasPermission } from "@/lib/rbac-utils";
import { Permission } from "@/lib/constants";

const mainLinks = [
  {
    title: "Overview",
    href: "/admin/overview",
    icon: BarChart3,
    permission: "reports.read" as Permission,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
    permission: "orders.read" as Permission,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
    permission: "products.read" as Permission,
  },
  {
    title: "Inventory",
    href: "/admin/inventory",
    icon: Warehouse,
    permission: "inventory.read" as Permission,
  },
  {
    title: "Categories",
    href: "/admin/categories",
    icon: Layers,
    permission: "categories.read" as Permission,
  },
  {
    title: "Brands",
    href: "/admin/brands",
    icon: Tag,
    permission: "brands.read" as Permission,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    permission: "users.read" as Permission,
  },
  {
    title: "Pages",
    href: "/admin/web-pages",
    icon: FileText,
    permission: "pages.read" as Permission,
  },
  {
    title: "Promotions",
    href: "/admin/promotions",
    icon: Percent,
    permission: "promotions.read" as Permission,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    permission: "settings.read" as Permission,
  },
];

interface AdminNavProps extends React.HTMLAttributes<HTMLElement> {
  userRole: string;
}

export function AdminNav({ className, userRole, ...props }: AdminNavProps) {
  const pathname = usePathname();
  const t = useTranslations("Admin");

  // Filter navigation links based on user permissions
  const visibleMainLinks = mainLinks.filter((link) =>
    hasPermission(userRole, link.permission)
  );

  return (
    <nav
      className={cn(
        "flex flex-col w-64 h-full bg-background text-foreground border-r border-border",
        className
      )}
      {...props}
    >
      <div className="flex flex-col h-full">
        {/* Main Navigation Links */}
        <div className="flex-1 space-y-1 p-4 overflow-y-auto">
          {visibleMainLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.includes(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "admin-sidebar-link",
                  isActive
                    ? "admin-sidebar-link-active"
                    : "admin-sidebar-link-inactive"
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.title)}
              </Link>
            );
          })}
        </div>

      </div>
    </nav>
  );
}
