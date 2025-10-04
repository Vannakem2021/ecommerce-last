"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SettingInputSchema } from "@/lib/validator";
import { ClientSetting, ISettingInput } from "@/types";
import { updateSetting } from "@/lib/actions/setting.actions";
import useSetting from "@/hooks/use-setting-store";
import { useEffect, useState, useCallback, useRef } from "react";
import { Globe, Settings2, Home, ShoppingCart, FileText, Zap, Loader2, ChevronUp } from "lucide-react";
import LanguageForm from "./language-form";
import CurrencyForm from "./currency-form";
import PaymentMethodForm from "./payment-method-form";
import TelegramForm from "./telegram-form";
import DeliveryDateForm from "./delivery-date-form";
import SiteInfoForm from "./site-info-form";
import CommonForm from "./common-form";
import CarouselForm from "./carousel-form";
import HomePageForm from "./home-page-form";

const TabSettingsForm = ({ setting }: { setting: ISettingInput }) => {
  const { setSetting } = useSetting();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Default open sections
  const [openSections, setOpenSections] = useState<string[]>([
    "site-info",
    "general"
  ]);

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
      } catch {
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

  // Show scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleExpandAll = () => {
    if (openSections.length > 0) {
      setOpenSections([]);
    } else {
      setOpenSections([
        "site-info",
        "general",
        "homepage",
        "commerce",
        "content",
        "integrations"
      ]);
    }
  };

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
            <div className="space-y-6">
              {/* Header with Save Status and Controls */}
              <div className="space-y-4">
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
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleExpandAll}
                  >
                    {openSections.length > 0 ? 'Collapse All' : 'Expand All'}
                  </Button>
                </div>
              </div>

              {/* Accordion Settings */}
              <Accordion 
                type="multiple" 
                value={openSections}
                onValueChange={setOpenSections}
                className="space-y-4"
              >
                {/* Site Information */}
                <AccordionItem value="site-info" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950">
                        <Globe className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Site Information</div>
                        <div className="text-sm text-muted-foreground font-normal">
                          Configure your site name, logo, and URL
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <SiteInfoForm id="setting-site-info" form={form} />
                  </AccordionContent>
                </AccordionItem>

                {/* General Settings */}
                <AccordionItem value="general" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950">
                        <Settings2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">General Settings</div>
                        <div className="text-sm text-muted-foreground font-normal">
                          Page size, theme, colors, and defaults
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <CommonForm id="setting-common" form={form} />
                  </AccordionContent>
                </AccordionItem>

                {/* Home Page */}
                <AccordionItem value="homepage" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-950">
                        <Home className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Home Page</div>
                        <div className="text-sm text-muted-foreground font-normal">
                          Customize homepage sections and layout
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <HomePageForm form={form} />
                  </AccordionContent>
                </AccordionItem>

                {/* Commerce */}
                <AccordionItem value="commerce" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-orange-50 dark:bg-orange-950">
                        <ShoppingCart className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Commerce Settings</div>
                        <div className="text-sm text-muted-foreground font-normal">
                          Currencies, payment methods, and delivery options
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 space-y-6">
                    <CurrencyForm id="setting-currencies" form={form} />
                    <PaymentMethodForm id="setting-payment-methods" form={form} />
                    <DeliveryDateForm id="setting-delivery-dates" form={form} />
                  </AccordionContent>
                </AccordionItem>

                {/* Content */}
                <AccordionItem value="content" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-cyan-50 dark:bg-cyan-950">
                        <FileText className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Content Management</div>
                        <div className="text-sm text-muted-foreground font-normal">
                          Manage carousels and languages
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 space-y-6">
                    <CarouselForm id="setting-carousels" form={form} />
                    <LanguageForm id="setting-languages" form={form} />
                  </AccordionContent>
                </AccordionItem>

                {/* Integrations */}
                <AccordionItem value="integrations" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950">
                        <Zap className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Integrations</div>
                        <div className="text-sm text-muted-foreground font-normal">
                          Connect external services like Telegram
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <TelegramForm id="setting-telegram" form={form} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

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

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full w-12 h-12 shadow-lg z-50"
          size="icon"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}
    </Card>
  );
};

export default TabSettingsForm;