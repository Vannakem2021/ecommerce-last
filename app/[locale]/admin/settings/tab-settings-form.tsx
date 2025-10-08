"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SettingInputSchema } from "@/lib/validator";
import { ClientSetting, ISettingInput } from "@/types";
import { updateSetting } from "@/lib/actions/setting.actions";
import useSetting from "@/hooks/use-setting-store";
import { useEffect, useState, useCallback, useRef } from "react";
import { Globe, Home, ShoppingCart, FileText, Zap, Loader2, ChevronUp } from "lucide-react";
import TelegramForm from "./telegram-form";
import SiteInfoForm from "./site-info-form";
import HomePageForm from "./home-page-form";
import CommerceForm from "./commerce-form";
import ContentForm from "./content-form";

const TabSettingsForm = ({ setting }: { setting: ISettingInput }) => {
  const { setSetting } = useSetting();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("site-info");

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
    <>
      <Form {...form}>
        <form
          className="space-y-6"
          method="post"
          onSubmit={form.handleSubmit(onSubmit)}
        >
            <div className="space-y-6">
              {/* Header with Save Status */}
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

              {/* Tabs Settings */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="inline-flex h-auto w-full justify-start gap-1 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 p-1.5 shadow-sm border border-border/50">
                  <TabsTrigger 
                    value="site-info" 
                    className="group relative gap-2 rounded-md px-4 py-2.5 transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border hover:bg-background/50"
                  >
                    <Globe className="h-4 w-4 transition-colors group-data-[state=active]:text-green-600" />
                    <span className="hidden sm:inline font-medium">Site Information</span>
                    <span className="sm:hidden font-medium">Site</span>
                    <div className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-green-600 transition-all duration-200 group-data-[state=active]:w-3/4" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="homepage" 
                    className="group relative gap-2 rounded-md px-4 py-2.5 transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border hover:bg-background/50"
                  >
                    <Home className="h-4 w-4 transition-colors group-data-[state=active]:text-green-600" />
                    <span className="hidden sm:inline font-medium">Home Page</span>
                    <span className="sm:hidden font-medium">Home</span>
                    <div className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-green-600 transition-all duration-200 group-data-[state=active]:w-3/4" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="commerce" 
                    className="group relative gap-2 rounded-md px-4 py-2.5 transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border hover:bg-background/50"
                  >
                    <ShoppingCart className="h-4 w-4 transition-colors group-data-[state=active]:text-green-600" />
                    <span className="hidden sm:inline font-medium">Commerce</span>
                    <span className="sm:hidden font-medium">Commerce</span>
                    <div className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-green-600 transition-all duration-200 group-data-[state=active]:w-3/4" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="content" 
                    className="group relative gap-2 rounded-md px-4 py-2.5 transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border hover:bg-background/50"
                  >
                    <FileText className="h-4 w-4 transition-colors group-data-[state=active]:text-green-600" />
                    <span className="hidden sm:inline font-medium">Content</span>
                    <span className="sm:hidden font-medium">Content</span>
                    <div className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-green-600 transition-all duration-200 group-data-[state=active]:w-3/4" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="integrations" 
                    className="group relative gap-2 rounded-md px-4 py-2.5 transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border hover:bg-background/50"
                  >
                    <Zap className="h-4 w-4 transition-colors group-data-[state=active]:text-green-600" />
                    <span className="hidden sm:inline font-medium">Integrations</span>
                    <span className="sm:hidden font-medium">Integrations</span>
                    <div className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-green-600 transition-all duration-200 group-data-[state=active]:w-3/4" />
                  </TabsTrigger>
                </TabsList>

                {/* Site Information */}
                <TabsContent value="site-info" className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Configure your site name, logo, and URL
                  </div>
                  <SiteInfoForm id="setting-site-info" form={form} />
                </TabsContent>

                {/* Home Page */}
                <TabsContent value="homepage" className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Customize homepage sections and layout
                  </div>
                  <HomePageForm form={form} />
                </TabsContent>

                {/* Commerce */}
                <TabsContent value="commerce" className="space-y-6">
                  <div className="text-sm text-muted-foreground">
                    Currencies, payment methods, and delivery options
                  </div>
                  <CommerceForm id="setting-commerce" form={form} />
                </TabsContent>

                {/* Content */}
                <TabsContent value="content" className="space-y-6">
                  <div className="text-sm text-muted-foreground">
                    Manage carousels and languages
                  </div>
                  <ContentForm id="setting-content" form={form} />
                </TabsContent>

                {/* Integrations */}
                <TabsContent value="integrations" className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Connect external services like Telegram
                  </div>
                  <TelegramForm id="setting-telegram" form={form} />
                </TabsContent>
              </Tabs>
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
    </>
  );
};

export default TabSettingsForm;