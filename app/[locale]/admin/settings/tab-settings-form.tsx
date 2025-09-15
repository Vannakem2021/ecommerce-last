"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { SettingInputSchema } from "@/lib/validator";
import { ClientSetting, ISettingInput } from "@/types";
import { updateSetting } from "@/lib/actions/setting.actions";
import useSetting from "@/hooks/use-setting-store";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LanguageForm from "./language-form";
import CurrencyForm from "./currency-form";
import PaymentMethodForm from "./payment-method-form";
import TelegramForm from "./telegram-form";
import DeliveryDateForm from "./delivery-date-form";
import SiteInfoForm from "./site-info-form";
import CommonForm from "./common-form";
import CarouselForm from "./carousel-form";

// Mapping from hash to tab
const HASH_TO_TAB: Record<string, string> = {
  "setting-site-info": "general",
  "setting-common": "general",
  "setting-currencies": "commerce",
  "setting-payment-methods": "commerce",
  "setting-delivery-dates": "commerce",
  "setting-carousels": "content",
  "setting-languages": "content",
  "setting-telegram": "integrations",
};

const TabSettingsForm = ({ setting }: { setting: ISettingInput }) => {
  const { setSetting } = useSetting();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Compute initial tab from query params to avoid flicker
  const initialTab = (() => {
    const tab = searchParams.get("tab");
    return tab && ["general", "commerce", "content", "integrations"].includes(tab)
      ? tab
      : "general";
  })();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<ISettingInput>({
    resolver: zodResolver(SettingInputSchema),
    defaultValues: setting,
    shouldUnregister: false,
  });
  const {
    formState: { isSubmitting },
  } = form;

  const { toast } = useToast();

  // Auto-save function with debouncing
  const autoSave = useCallback(async (values: ISettingInput) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const res = await updateSetting({ ...values });
        if (res.success) {
          setSaveStatus('saved');
          setSetting(values as ClientSetting);
          // Reset to idle after showing saved status
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('error');
          toast({
            variant: "destructive",
            description: res.message,
          });
        }
      } catch (error) {
        setSaveStatus('error');
        toast({
          variant: "destructive",
          description: "Failed to auto-save settings",
        });
      }
    }, 2000);
  }, [toast, setSetting]);

  // Watch form values for auto-save
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values && saveStatus !== 'saving') {
        autoSave(values as ISettingInput);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, autoSave, saveStatus]);

  const handleTabChange = (value: string, preserveHash?: boolean) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    const hash = preserveHash ? window.location.hash : "";
    router.push(`?${params.toString()}${hash}`, { scroll: false });
  };

  // Handle hash-based navigation on mount and hashchange events
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const hashId = hash.substring(1);
        const targetTab = HASH_TO_TAB[hashId];
        if (targetTab) {
          handleTabChange(targetTab, true);
          // Scroll to target element after tab content mounts
          setTimeout(() => {
            const element = document.getElementById(hashId);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 100);
        }
      }
    };

    // Handle initial hash on mount
    handleHashChange();

    // Listen for hashchange events
    window.addEventListener("hashchange", handleHashChange);

    // Cleanup
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Handle URL-based tab routing
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["general", "commerce", "content", "integrations"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  async function onSubmit(values: ISettingInput) {
    // Cancel any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setSaveStatus('saving');
    const res = await updateSetting({ ...values });
    if (!res.success) {
      setSaveStatus('error');
      toast({
        variant: "destructive",
        description: res.message,
      });
    } else {
      setSaveStatus('saved');
      toast({
        description: res.message,
      });
      setSetting(values as ClientSetting);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }

  return (
    <Form {...form}>
      <form
        className="space-y-6 max-w-none"
        method="post"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted p-1 rounded-lg">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="commerce">Commerce</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            {/* Save Status Indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {saveStatus === 'saving' && (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Auto-saving...
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    All changes saved
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Save failed
                  </>
                )}
              </div>
            </div>
          </div>

          <TabsContent value="general" className="space-y-6 mt-6">
            <SiteInfoForm id="setting-site-info" form={form} />
            <CommonForm id="setting-common" form={form} />
          </TabsContent>

          <TabsContent value="commerce" className="space-y-6 mt-6">
            <CurrencyForm id="setting-currencies" form={form} />
            <PaymentMethodForm id="setting-payment-methods" form={form} />
            <DeliveryDateForm id="setting-delivery-dates" form={form} />
          </TabsContent>

          <TabsContent value="content" className="space-y-6 mt-6">
            <CarouselForm id="setting-carousels" form={form} />
            <LanguageForm id="setting-languages" form={form} />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6 mt-6">
            <TelegramForm id="setting-telegram" form={form} />
          </TabsContent>
        </Tabs>

        <div className="mt-8 mb-6">
          <Button
            type="submit"
            size="default"
            disabled={isSubmitting || saveStatus === 'saving'}
            className="w-full"
          >
            {isSubmitting || saveStatus === 'saving' ? "Saving..." : "Save Now"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TabSettingsForm;