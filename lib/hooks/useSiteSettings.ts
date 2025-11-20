import { useState, useEffect } from "react";
import { ref, get, onValue } from "firebase/database";
import { database } from "@/lib/firebase";

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  logoText: string;
  heroTitle: string;
  heroSubtitle: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  canonicalUrl?: string;
  twitterCard: string;
  twitterSite: string;
}

const defaultSettings: SiteSettings = {
  siteName: "PesantrenConnect",
  siteTagline: "Platform Komunikasi Pesantren Modern",
  siteDescription:
    "Kemudahan komunikasi antara Ustadz dan Orang Tua untuk memantau perkembangan pembelajaran santri dengan sistem yang aman dan terpercaya.",
  primaryColor: "#059669",
  secondaryColor: "#3b82f6",
  accentColor: "#8b5cf6",
  backgroundColor: "#ffffff",
  logoText: "P",
  heroTitle: "Pantau Hafalan & Akademik Santri",
  heroSubtitle: "Secara Real-time",
  metaKeywords: "pesantren, santri, hafalan, quran, ustadz, monitoring, akademik, komunikasi",
  ogTitle: "PesantrenConnect - Platform Komunikasi Pesantren Modern",
  ogDescription: "Kemudahan komunikasi antara Ustadz dan Orang Tua untuk memantau perkembangan pembelajaran santri dengan sistem yang aman dan terpercaya.",
  ogImage: undefined,
  canonicalUrl: undefined,
  twitterCard: "summary_large_image",
  twitterSite: "@pesantrenconnect",
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsRef = ref(database, "settings/site");

    // Get initial data
    get(settingsRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          setSettings({ ...defaultSettings, ...snapshot.val() });
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching site settings:", error);
        setLoading(false);
      });

    // Listen for real-time updates
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ ...defaultSettings, ...snapshot.val() });
      }
    });

    return () => unsubscribe();
  }, []);

  return { settings, loading };
}
