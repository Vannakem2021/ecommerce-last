"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  BarChart3,
  Package,
  User,
  Settings,
  Warehouse,
  Percent,
} from "lucide-react";
import { FiShoppingCart } from "react-icons/fi";
import { TbBrandDatabricks } from "react-icons/tb";
import { PiNoteDuotone } from "react-icons/pi";
import { BiCategory } from "react-icons/bi";

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
    icon: FiShoppingCart,
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
    icon: BiCategory,
    permission: "categories.read" as Permission,
  },
  {
    title: "Brands",
    href: "/admin/brands",
    icon: TbBrandDatabricks,
    permission: "brands.read" as Permission,
  },
  {
    title: "User",
    href: "/admin/users",
    icon: User,
    permission: "users.read" as Permission,
  },
  {
    title: "Pages",
    href: "/admin/web-pages",
    icon: PiNoteDuotone,
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
        "flex flex-col flex-1 overflow-y-auto",
        className
      )}
      {...props}
    >
      {/* Main Navigation Links */}
      <div className="flex-1 space-y-1 p-4">
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
              <Icon className="h-6 w-6" />
              {t(item.title)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
