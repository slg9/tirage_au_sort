import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { AuroraBackground } from "@/components/shared/AuroraBackground";
import { WebApplicationJsonLd } from "@/components/seo/JsonLd";
import { defaultLocale, getSiteUrl, isLocale, Locale, locales, t } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

type LocaleParams = {
  params: Promise<{ locale: string }>;
};

const keywords: Record<Locale, string[]> = {
  fr: [
    "tirage au sort",
    "roue de la fortune",
    "tombola",
    "tirage aléatoire",
    "animation",
    "événement",
    "tirage en ligne",
    "gratuit",
  ],
  en: [
    "random draw",
    "fortune wheel",
    "raffle",
    "prize draw",
    "random picker",
    "online lottery",
    "free",
    "event",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a1a" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a1a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const isEn = locale === "en";
  const baseUrl = getSiteUrl();
  const title = t("brand.title", locale);
  const description = t("brand.description", locale);

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: title,
      template: "%s | WheelDraw",
    },
    description,
    applicationName: "WheelDraw",
    keywords: keywords[locale],
    authors: [{ name: "WheelDraw" }],
    creator: "WheelDraw",
    publisher: "WheelDraw",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        fr: "/fr",
        en: "/en",
        "x-default": "/fr",
      },
    },
    openGraph: {
      type: "website",
      locale: isEn ? "en_US" : "fr_FR",
      alternateLocale: isEn ? ["fr_FR"] : ["en_US"],
      url: `/${locale}`,
      siteName: "WheelDraw",
      title,
      description,
      images: [
        {
          url: `/${locale}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "WheelDraw",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/${locale}/twitter-image`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-icon.png",
      shortcut: "/icon.svg",
    },
    category: "productivity",
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  return (
    <html lang={rawLocale} className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} font-sans bg-slate-950 text-white min-h-screen antialiased`}
      >
        <WebApplicationJsonLd locale={rawLocale} />
        <AuroraBackground />
        {children}
      </body>
    </html>
  );
}
