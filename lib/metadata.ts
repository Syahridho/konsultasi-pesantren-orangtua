import { Metadata } from "next";

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  metaKeywords: string;
  metaAuthor: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  twitterSite: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  logoText: string;
}

const defaultSettings: SiteSettings = {
  siteName: "PesantrenConnect",
  siteTagline: "Platform Komunikasi Pesantren Modern",
  siteDescription: "Kemudahan komunikasi antara Ustadz dan Orang Tua untuk memantau perkembangan pembelajaran santri dengan sistem yang aman dan terpercaya.",
  metaKeywords: "pesantren, santri, hafalan quran, akademik, komunikasi pesantren, aplikasi pesantren",
  metaAuthor: "PesantrenConnect",
  canonicalUrl: "",
  ogTitle: "PesantrenConnect - Platform Komunikasi Pesantren Modern",
  ogDescription: "Kemudahan komunikasi antara Ustadz dan Orang Tua untuk memantau perkembangan pembelajaran santri",
  ogImage: "",
  twitterCard: "summary_large_image",
  twitterSite: "@pesantrenconnect",
  heroTitle: "Pantau Hafalan & Akademik Santri",
  heroSubtitle: "Secara Real-time",
  primaryColor: "#059669",
  secondaryColor: "#3b82f6",
  accentColor: "#f59e0b",
  backgroundColor: "#ffffff",
  logoText: "P",
};

export function generateMetadata(settings?: Partial<SiteSettings>): Metadata {
  const mergedSettings = { ...defaultSettings, ...settings };

  return {
    title: {
      default: mergedSettings.siteName,
      template: `%s | ${mergedSettings.siteName}`,
    },
    description: mergedSettings.siteDescription,
    keywords: mergedSettings.metaKeywords.split(",").map((k) => k.trim()),
    authors: [{ name: mergedSettings.metaAuthor }],
    creator: mergedSettings.metaAuthor,
    publisher: mergedSettings.metaAuthor,
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: mergedSettings.canonicalUrl || undefined,
      title: mergedSettings.ogTitle,
      description: mergedSettings.ogDescription,
      siteName: mergedSettings.siteName,
      images: mergedSettings.ogImage
        ? [
            {
              url: mergedSettings.ogImage,
              width: 1200,
              height: 630,
              alt: mergedSettings.ogTitle,
            },
          ]
        : undefined,
    },
    twitter: {
      card: mergedSettings.twitterCard as any,
      title: mergedSettings.ogTitle,
      description: mergedSettings.ogDescription,
      site: mergedSettings.twitterSite,
      images: mergedSettings.ogImage ? [mergedSettings.ogImage] : undefined,
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
    icons: {
      icon: "/favicon.ico",
    },
  };
}
