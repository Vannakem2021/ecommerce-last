"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SettingInputSchema } from "@/lib/validator";
import { ClientSetting, ISettingInput } from "@/types";
import { updateSetting } from "@/lib/actions/setting.actions";
import useSetting from "@/hooks/use-setting-store";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Settings2, ShoppingCart, FileText, Zap, Loader2 } from "lucide-react";
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
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form
            className="space-y-6 max-w-none"
            method="post"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="space-y-6">
                {/* Enhanced Tab List with Icons */}
                <div className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="general" className="flex items-center gap-2 h-10">
                      <Settings2 className="h-4 w-4" />
                      <span className="hidden sm:inline">General</span>
                    </TabsTrigger>
                    <TabsTrigger value="commerce" className="flex items-center gap-2 h-10">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="hidden sm:inline">Commerce</span>
                    </TabsTrigger>
                    <TabsTrigger value="content" className="flex items-center gap-2 h-10">
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Content</span>
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="flex items-center gap-2 h-10">
                      <Zap className="h-4 w-4" />
                      <span className="hidden sm:inline">Integrations</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Save Status Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {saveStatus === 'saving' && (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          <span>Auto-saving changes...</span>
                        </>
                      )}
                      {saveStatus === 'saved' && (
                        <>
                          <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                          </div>
                          <span className="text-green-700 dark:text-green-400">All changes saved automatically</span>
                        </>
                      )}
                      {saveStatus === 'error' && (
                        <>
                          <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                            <div className="h-1 w-1 bg-white rounded-full"></div>
                          </div>
                          <span className="text-red-700 dark:text-red-400">Failed to save changes</span>
                        </>
                      )}
                      {saveStatus === 'idle' && (
                        <span>Changes are automatically saved as you type</span>
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
              </div>
            </Tabs>

            {/* Professional Action Buttons */}
            <Card className="mt-8">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {isSubmitting || saveStatus === 'saving' ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving all settings...
                      </span>
                    ) : (
                      'Manual save will override auto-save and sync all settings'
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting || saveStatus === 'saving'}
                    className="min-w-[140px]"
                  >
                    {isSubmitting || saveStatus === 'saving' ? 'Saving...' : 'Save All Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TabSettingsForm;