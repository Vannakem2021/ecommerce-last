'use client';

import { Bell } from 'lucide-react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  _id: string;
  title: string;
  message: string;
  type: 'order' | 'stock' | 'user' | 'system' | 'payment';
  read: boolean;
  createdAt: string;
  link?: string;
  data?: any;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NotificationBell() {
  // Fetch notifications with SWR - polls every 30 seconds
  const { data, mutate, isLoading } = useSWR<{ success: boolean; notifications: Notification[] }>(
    '/api/notifications',
    fetcher,
    {
      refreshInterval: 30000, // Poll every 30 seconds
      revalidateOnFocus: true, // Revalidate when user returns to tab
      revalidateOnReconnect: true, // Revalidate on reconnect
    }
  );

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      // Refresh notifications
      mutate();
    } catch (error) {
      // Silently handle error
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      // Refresh notifications
      mutate();
    } catch (error) {
      // Silently handle error
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return '🛒';
      case 'stock':
        return '📦';
      case 'user':
        return '👤';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem className="text-center text-muted-foreground">
            Loading...
          </DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem className="text-center text-muted-foreground">
            No notifications
          </DropdownMenuItem>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start p-3 cursor-pointer relative ${
                !notification.read ? 'bg-muted/50' : ''
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full absolute left-1 top-1/2 transform -translate-y-1/2" />
              )}
              <div className="flex items-center gap-2 w-full pl-2">
                <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {notification.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {notification.message}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        {notifications.length > 5 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-sm text-muted-foreground">
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}