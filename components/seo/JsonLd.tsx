import { Locale } from "@/lib/i18n";

export function WebApplicationJsonLd({ locale }: { locale: Locale }) {
  const isEn = locale === "en";
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "WheelDraw",
    description: isEn
      ? "Run spectacular multi-round random draws with drag & drop, premium animations and a fullscreen presentation mode."
      : "Organisez des tirages au sort spectaculaires en plusieurs cycles, avec drag & drop, animations premium et mode présentation plein écran.",
    url: "https://wheeldraw.site",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Modern browser.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    inLanguage: ["fr", "en"],
    isAccessibleForFree: true,
    featureList: isEn
      ? [
          "Multi-cycle draws",
          "Animated fortune wheel",
          "Drag & drop group composition",
          "CSV import",
          "Fullscreen presentation mode",
          "Procedural avatars",
          "No signup required",
        ]
      : [
          "Tirages multi-cycles",
          "Roue de la fortune animée",
          "Composition de groupes par drag & drop",
          "Import CSV",
          "Mode présentation plein écran",
          "Avatars procéduraux",
          "Sans inscription",
        ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
