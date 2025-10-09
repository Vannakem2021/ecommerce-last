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
    site: { name, description, url, logo },
  } = await getSetting();
  
  return {
    title: {
      template: `%s | ${name}`,
      default: `${name}. ${description}`,
    },
    description: description,
    metadataBase: new URL(url),
    
    // Application info
    applicationName: name,
    authors: [{ name: name }],
    generator: 'Next.js',
    keywords: ['electronics', 'e-commerce', 'online shopping', 'smartphones', 'laptops', 'tablets'],
    
    // Open Graph (Facebook, LinkedIn, WhatsApp)
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: url,
      title: name,
      description: description,
      siteName: name,
      images: [
        {
          url: `${url}${logo}`,
          width: 1200,
          height: 630,
          alt: `${name} - ${description}`,
        },
      ],
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: name,
      description: description,
      images: [`${url}${logo}`],
      creator: '@bcs',
    },
    
    // Robots
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Verification (add your verification codes after deployment)
    // verification: {
    //   google: 'your-google-verification-code',
    //   yandex: 'your-yandex-verification-code',
    // },
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
