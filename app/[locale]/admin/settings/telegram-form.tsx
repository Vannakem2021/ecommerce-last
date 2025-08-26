"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ISettingInput } from "@/types";
import { UseFormReturn } from "react-hook-form";
import { testTelegramBot } from "@/lib/actions/telegram.actions";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, TestTube, ExternalLink, HelpCircle } from "lucide-react";

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

  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);

  const telegramEnabled = watch("telegram.enabled");
  const botToken = watch("telegram.botToken");
  const chatId = watch("telegram.chatId");

  const handleTestBot = async () => {
    if (!botToken || !chatId) {
      toast({
        variant: "destructive",
        description: "Please enter both bot token and chat ID before testing.",
      });
      return;
    }

    setIsTesting(true);
    try {
      const result = await testTelegramBot(botToken, chatId);

      toast({
        variant: result.success ? "default" : "destructive",
        description: result.message,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to test Telegram configuration.",
      });
    } finally {
      setIsTesting(false);
    }
  };



  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
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



            {/* Test Button */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestBot}
                disabled={isTesting || !botToken || !chatId}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {isTesting ? "Testing..." : "Test Configuration"}
              </Button>
            </div>

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

            {/* Setup Instructions */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Setup Instructions
              </h4>
              <div className="text-sm space-y-2">
                <div>
                  <p className="font-medium">Step 1: Create a Telegram bot</p>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                    <li>Message @BotFather on Telegram</li>
                    <li>Send /newbot and follow the instructions</li>
                    <li>Copy the bot token provided</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium">Step 2: Get your chat ID</p>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                    <li>Add your bot to a group or start a chat</li>
                    <li>Send a message to the bot</li>
                    <li>Visit: https://api.telegram.org/bot[BOT_TOKEN]/getUpdates</li>
                    <li>Find the "chat" → "id" value in the response</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium">Step 3: Test the configuration</p>
                  <p className="ml-4 text-muted-foreground">Use the test button above to verify your setup</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
