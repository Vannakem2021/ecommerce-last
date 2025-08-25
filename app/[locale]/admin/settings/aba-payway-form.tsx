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
import { ISettingInput } from "@/types";
import { UseFormReturn } from "react-hook-form";

export default function ABAPayWayForm({
  form,
  id,
}: {
  form: UseFormReturn<ISettingInput>;
  id: string;
}) {
  const {
    control,
    formState: { errors },
  } = form;

  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>ABA PayWay Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="abaPayWay.enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable ABA PayWay</FormLabel>
                <FormDescription>
                  Allow customers to pay using ABA PayWay (ABA PAY, KHQR, Cards,
                  etc.)
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

        <FormField
          control={control}
          name="abaPayWay.merchantId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Merchant ID</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter your ABA PayWay Merchant ID"
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Your unique merchant identifier provided by ABA Bank
              </FormDescription>
              <FormMessage>{errors.abaPayWay?.merchantId?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="abaPayWay.sandboxMode"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Sandbox Mode</FormLabel>
                <FormDescription>
                  Use sandbox environment for testing. Disable for production.
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

        <div className="rounded-lg border p-4 bg-yellow-50 border-yellow-200">
          <h4 className="font-semibold text-yellow-800 mb-2">
            Environment Variables Required
          </h4>
          <p className="text-sm text-yellow-700 mb-2">
            The following environment variables must be set for ABA PayWay to
            work:
          </p>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>
              • <code>PAYWAY_SECRET_KEY</code> - Your API secret key from ABA
              Bank
            </li>
            <li>
              • <code>PAYWAY_ENABLED=true</code> - Enable ABA PayWay service
            </li>
          </ul>
          <p className="text-xs text-yellow-600 mt-2">
            Contact ABA Bank merchant support to obtain your credentials.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
