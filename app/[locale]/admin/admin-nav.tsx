"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Info,
  SettingsIcon,
  ImageIcon,
  Languages,
  Currency,
  CreditCard,
  Package as PackageIcon,
  Tag,
  Layers,
  Warehouse,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
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
];

const settingsLinks = [
  { name: "Site Info", hash: "setting-site-info", icon: Info },
  { name: "Common Settings", hash: "setting-common", icon: SettingsIcon },
  { name: "Carousels", hash: "setting-carousels", icon: ImageIcon },
  { name: "Languages", hash: "setting-languages", icon: Languages },
  { name: "Currencies", hash: "setting-currencies", icon: Currency },
  {
    name: "Payment Methods",
    hash: "setting-payment-methods",
    icon: CreditCard,
  },
  { name: "ABA PayWay", hash: "setting-aba-payway", icon: CreditCard },
  { name: "Delivery Dates", hash: "setting-delivery-dates", icon: PackageIcon },
];

interface AdminNavProps extends React.HTMLAttributes<HTMLElement> {
  userRole: string;
}

export function AdminNav({ className, userRole, ...props }: AdminNavProps) {
  const pathname = usePathname();
  const t = useTranslations("Admin");
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.includes("/admin/settings")
  );

  const isSettingsActive = pathname.includes("/admin/settings");

  // Filter navigation links based on user permissions
  const visibleMainLinks = mainLinks.filter((link) =>
    hasPermission(userRole, link.permission)
  );

  // Check if user can access settings
  const canAccessSettings = hasPermission(userRole, "settings.read");

  return (
    <nav
      className={cn(
        "flex flex-col w-64 h-full bg-black text-white border-r border-border",
        className
      )}
      {...props}
    >
      <div className="flex flex-col space-y-1 p-4">
        {/* Main Navigation Links */}
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

        {/* Settings Collapsible Section */}
        {canAccessSettings && (
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "admin-sidebar-link justify-between w-full",
                  isSettingsActive
                    ? "admin-sidebar-link-active"
                    : "admin-sidebar-link-inactive"
                )}
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4" />
                  {t("Settings")}
                </div>
                {settingsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {settingsLinks.map((item) => {
                const Icon = item.icon;

                const handleSettingsClick = (e: React.MouseEvent) => {
                  e.preventDefault();
                  // Navigate to settings page first if not already there
                  if (!pathname.includes("/admin/settings")) {
                    window.location.href = `/admin/settings#${item.hash}`;
                  } else {
                    // If already on settings page, just scroll to section
                    const section = document.getElementById(item.hash);
                    if (section) {
                      const top = section.offsetTop - 16;
                      window.scrollTo({ top, behavior: "smooth" });
                    }
                  }
                };

                return (
                  <a
                    key={item.hash}
                    href={`/admin/settings#${item.hash}`}
                    onClick={handleSettingsClick}
                    className={cn(
                      "flex items-center gap-3 px-6 py-2 rounded-md text-sm transition-colors cursor-pointer",
                      "hover:bg-muted/10 hover:text-white text-muted-foreground"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {item.name}
                  </a>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </nav>
  );
}
