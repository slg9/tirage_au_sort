import { ImageResponse } from "next/og";
import { defaultLocale, isLocale, Locale } from "@/lib/i18n";
import { OgArtwork } from "@/lib/seo/og";

export const runtime = "edge";
export const alt = "WheelDraw — Multi-cycle random draws";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OGImage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return new ImageResponse(<OgArtwork locale={locale} />, { ...size });
}
