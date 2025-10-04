import { Ubuntu, Kantumruy_Pro } from "next/font/google";
import "../globals.css";
import ClientProviders from "@/components/shared/client-providers";
import { getDirection } from "@/i18n-config";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getSetting } from "@/lib/actions/setting.actions";
import { cookies } from "next/headers";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { Toaster } from "sonner";

// Google Fonts setup
const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const hanuman = Kantumruy_Pro({
  variable: "--font-hanuman",
  subsets: ["khmer"],
  weight: ["100", "300", "400", "700"],
  display: "swap",
});


export async function generateMetadata() {
  const {
    site: { slogan, name, description, url },
  } = await getSetting();
  return {
    title: {
      template: `%s | ${name}`,
      default: `${name}. ${slogan}`,
    },
    description: description,
    metadataBase: new URL(url),
  };
}

export default async function AppLayout({
  params,
  children,
}: {
  params: { locale: string };
  children: React.ReactNode;
}) {
  const setting = await getSetting();
  const currencyCookie = (await cookies()).get("currency");
  const currency = currencyCookie ? currencyCookie.value : "USD";

  // Get server-side session for SessionProvider
  const session = await auth();

  const { locale } = await params;
  // Ensure that the incoming `locale` is valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  const messages = await getMessages();

  // Determine font based on locale
  const fontClass = locale === 'kh' ? 'font-hanuman' : 'font-ubuntu';

  return (
    <html
      lang={locale}
      dir={getDirection(locale) === "rtl" ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <body
        className={`min-h-screen ${ubuntu.variable} ${hanuman.variable} antialiased ${fontClass}`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionProvider session={session}>
            <ClientProviders setting={{ ...setting, currency }}>
              {children}
            </ClientProviders>
          </SessionProvider>
        </NextIntlClientProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
