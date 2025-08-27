"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { SettingInputSchema } from "@/lib/validator";
import { ClientSetting, ISettingInput } from "@/types";
import { updateSetting } from "@/lib/actions/setting.actions";
import useSetting from "@/hooks/use-setting-store";
import { useEffect } from "react";
import LanguageForm from "./language-form";
import CurrencyForm from "./currency-form";
import PaymentMethodForm from "./payment-method-form";

import TelegramForm from "./telegram-form";
import DeliveryDateForm from "./delivery-date-form";
import SiteInfoForm from "./site-info-form";
import CommonForm from "./common-form";
import CarouselForm from "./carousel-form";

const SettingForm = ({ setting }: { setting: ISettingInput }) => {
  const { setSetting } = useSetting();

  const form = useForm<ISettingInput>({
    resolver: zodResolver(SettingInputSchema),
    defaultValues: setting,
  });
  const {
    formState: { isSubmitting },
  } = form;

  const { toast } = useToast();

  // Handle initial hash navigation on page load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const section = document.getElementById(hash.substring(1));
        const mainContent = document.querySelector('[data-main-content]') as HTMLElement;

        if (section && mainContent) {
          // Get the section's position relative to the main content container
          const mainContentRect = mainContent.getBoundingClientRect();
          const sectionRect = section.getBoundingClientRect();
          const relativeTop = sectionRect.top - mainContentRect.top + mainContent.scrollTop;

          // Calculate the desired scroll position with offset
          let scrollTop = relativeTop - 16; // 16px offset for spacing

          // Ensure we don't scroll past the bottom of the content
          const maxScrollTop = mainContent.scrollHeight - mainContent.clientHeight;
          scrollTop = Math.min(scrollTop, maxScrollTop);

          mainContent.scrollTo({
            top: scrollTop,
            behavior: "smooth"
          });
        }
      }, 100);
    }
  }, []);

  async function onSubmit(values: ISettingInput) {
    const res = await updateSetting({ ...values });
    if (!res.success) {
      toast({
        variant: "destructive",
        description: res.message,
      });
    } else {
      toast({
        description: res.message,
      });
      setSetting(values as ClientSetting);
    }
  }

  return (
    <Form {...form}>
      <form
        className="space-y-6"
        method="post"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <SiteInfoForm id="setting-site-info" form={form} />
        <CommonForm id="setting-common" form={form} />
        <CarouselForm id="setting-carousels" form={form} />

        <LanguageForm id="setting-languages" form={form} />

        <CurrencyForm id="setting-currencies" form={form} />

        <PaymentMethodForm id="setting-payment-methods" form={form} />

        <TelegramForm id="setting-telegram" form={form} />

        <DeliveryDateForm id="setting-delivery-dates" form={form} />

        <div className="pb-[50vh]">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full mb-24"
          >
            {isSubmitting ? "Submitting..." : `Save Setting`}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SettingForm;
