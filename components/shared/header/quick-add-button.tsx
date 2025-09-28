'use client';

import { Plus, ShoppingCart, Package, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

export default function QuickAddButton() {
  const router = useRouter();

  const quickActions = [
    {
      id: 'order',
      label: 'New Order',
      description: 'Create a new customer order',
      icon: <ShoppingCart className="h-4 w-4" />,
      url: '/admin/orders/create',
    },
    {
      id: 'product',
      label: 'New Product',
      description: 'Add a new product to inventory',
      icon: <Package className="h-4 w-4" />,
      url: '/admin/products/create',
    },
    {
      id: 'user',
      label: 'New User',
      description: 'Create a new system user',
      icon: <Users className="h-4 w-4" />,
      url: '/admin/users/create',
    },
  ];

  const handleAction = (url: string) => {
    router.push(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Plus className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {quickActions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            className="flex items-start gap-3 cursor-pointer p-3"
            onClick={() => handleAction(action.url)}
          >
            <div className="mt-0.5">{action.icon}</div>
            <div className="flex flex-col">
              <span className="font-medium">{action.label}</span>
              <span className="text-sm text-muted-foreground">
                {action.description}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}