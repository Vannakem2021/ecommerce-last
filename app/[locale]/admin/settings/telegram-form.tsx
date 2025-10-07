"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ISettingInput } from "@/types";
import { UseFormReturn } from "react-hook-form";
import { MessageSquare } from "lucide-react";

export default function TelegramForm({
  form,
  id,
}: {
  form: UseFormReturn<ISettingInput>;
  id: string;
}) {
  const {
    control,
    formState: { errors },
    watch,
  } = form;

  const telegramEnabled = watch("telegram.enabled");



  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-cyan-50 dark:bg-cyan-950">
            <MessageSquare className="h-4 w-4 text-cyan-600" />
          </div>
          Telegram Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Telegram */}
        <FormField
          control={control}
          name="telegram.enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Telegram Notifications</FormLabel>
                <FormDescription>
                  Send order notifications to your Telegram chat
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {telegramEnabled && (
          <>
            {/* Bot Token */}
            <FormField
              control={control}
              name="telegram.botToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot Token</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Enter your Telegram bot token"
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Your Telegram bot token from @BotFather
                  </FormDescription>
                  <FormMessage>{errors.telegram?.botToken?.message}</FormMessage>
                </FormItem>
              )}
            />

            {/* Chat ID */}
            <FormField
              control={control}
              name="telegram.chatId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chat ID</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your chat ID (e.g., -1001234567890)"
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    The chat ID where notifications will be sent
                  </FormDescription>
                  <FormMessage>{errors.telegram?.chatId?.message}</FormMessage>
                </FormItem>
              )}
            />

            {/* Notification Types */}
            <div className="space-y-4">
              <FormLabel className="text-base">Notification Types</FormLabel>
              <div className="space-y-3">
                <FormField
                  control={control}
                  name="telegram.notificationTypes.orderPaid"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Order Payment Confirmed</FormLabel>
                        <FormDescription>
                          Notify when payment is confirmed
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="telegram.notificationTypes.orderDelivered"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Order Delivered</FormLabel>
                        <FormDescription>
                          Notify when order is marked as delivered
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
