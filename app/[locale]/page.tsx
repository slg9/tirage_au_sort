import { notFound } from "next/navigation";
import { WheelDrawApp } from "@/components/WheelDrawApp";
import { isLocale, locales } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <WheelDrawApp locale={locale} />;
}
