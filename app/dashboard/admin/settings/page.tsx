"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ref, get, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Palette, Search, Globe, Image as ImageIcon } from "lucide-react";

interface SiteSettings {
  // Basic Info
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  logoText: string;
  
  // SEO Settings
  metaKeywords: string;
  metaAuthor: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  twitterSite: string;
  
  // Hero Section
  heroTitle: string;
  heroSubtitle: string;
  
  // Color Theme
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
}

const defaultSettings: SiteSettings = {
  // Basic Info
  siteName: "PesantrenConnect",
  siteTagline: "Platform Komunikasi Pesantren Modern",
  siteDescription: "Kemudahan komunikasi antara Ustadz dan Orang Tua untuk memantau perkembangan pembelajaran santri dengan sistem yang aman dan terpercaya.",
  logoText: "P",
  
  // SEO Settings
  metaKeywords: "pesantren, santri, hafalan quran, akademik, komunikasi pesantren, aplikasi pesantren",
  metaAuthor: "PesantrenConnect",
  canonicalUrl: "",
  ogTitle: "PesantrenConnect - Platform Komunikasi Pesantren Modern",
  ogDescription: "Kemudahan komunikasi antara Ustadz dan Orang Tua untuk memantau perkembangan pembelajaran santri",
  ogImage: "",
  twitterCard: "summary_large_image",
  twitterSite: "@pesantrenconnect",
  
  // Hero Section
  heroTitle: "Pantau Hafalan & Akademik Santri",
  heroSubtitle: "Secara Real-time",
  
  // Color Theme
  primaryColor: "#059669",
  secondaryColor: "#3b82f6",
  accentColor: "#f59e0b",
  backgroundColor: "#ffffff",
};

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "admin") {
      toast.error("Halaman ini hanya untuk Administrator");
      router.push("/dashboard");
      return;
    }

    fetchSettings();
  }, [session, status, router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const settingsRef = ref(database, "settings/site");
      const snapshot = await get(settingsRef);

      if (snapshot.exists()) {
        setSettings({ ...defaultSettings, ...snapshot.val() });
      } else {
        // Save default settings if not exists
        await set(settingsRef, defaultSettings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSubmitting(true);
      const settingsRef = ref(database, "settings/site");
      await set(settingsRef, {
        ...settings,
        updatedAt: new Date().toISOString(),
      });

      toast.success("Pengaturan berhasil disimpan");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm("Apakah Anda yakin ingin mengembalikan ke pengaturan default?")) {
      setSettings(defaultSettings);
      toast.info("Pengaturan direset. Klik Simpan untuk menerapkan.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Pengaturan Website
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola SEO, tampilan, dan tema warna website Anda
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetDefaults}>
            Reset ke Default
          </Button>
          <Button onClick={handleSaveSettings} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="seo" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="seo" className="gap-2">
            <Search className="h-4 w-4" />
            SEO & Info
          </TabsTrigger>
          <TabsTrigger value="colors" className="gap-2">
            <Palette className="h-4 w-4" />
            Warna Tema
          </TabsTrigger>
        </TabsList>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6 mt-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Informasi Dasar
              </CardTitle>
              <CardDescription>
                Pengaturan umum nama dan identitas website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nama Website *</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) =>
                      setSettings({ ...settings, siteName: e.target.value })
                    }
                    placeholder="PesantrenConnect"
                  />
                  <p className="text-xs text-muted-foreground">
                    Muncul di header, browser tab, dan hasil pencarian
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoText">Huruf Logo</Label>
                  <Input
                    id="logoText"
                    value={settings.logoText}
                    onChange={(e) =>
                      setSettings({ ...settings, logoText: e.target.value })
                    }
                    placeholder="P"
                    maxLength={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    1-2 huruf untuk logo (maks 2 karakter)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteTagline">Tagline *</Label>
                <Input
                  id="siteTagline"
                  value={settings.siteTagline}
                  onChange={(e) =>
                    setSettings({ ...settings, siteTagline: e.target.value })
                  }
                  placeholder="Platform Komunikasi Pesantren Modern"
                />
                <p className="text-xs text-muted-foreground">
                  Kalimat pendek yang menggambarkan website
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaAuthor">Author Website</Label>
                <Input
                  id="metaAuthor"
                  value={settings.metaAuthor}
                  onChange={(e) =>
                    setSettings({ ...settings, metaAuthor: e.target.value })
                  }
                  placeholder="PesantrenConnect"
                />
                <p className="text-xs text-muted-foreground">
                  Nama pembuat atau pengelola website
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Deskripsi Website (Meta Description) *</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) =>
                    setSettings({ ...settings, siteDescription: e.target.value })
                  }
                  placeholder="Deskripsi singkat untuk SEO"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Muncul di hasil pencarian Google (optimal: 150-160 karakter) • 
                  Saat ini: {settings.siteDescription.length} karakter
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO Advanced
              </CardTitle>
              <CardDescription>
                Pengaturan lanjutan untuk optimasi mesin pencari
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input
                  id="metaKeywords"
                  value={settings.metaKeywords}
                  onChange={(e) =>
                    setSettings({ ...settings, metaKeywords: e.target.value })
                  }
                  placeholder="pesantren, santri, hafalan quran, akademik"
                />
                <p className="text-xs text-muted-foreground">
                  Kata kunci dipisahkan dengan koma (,)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  value={settings.canonicalUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, canonicalUrl: e.target.value })
                  }
                  placeholder="https://pesantrenconnect.com"
                />
                <p className="text-xs text-muted-foreground">
                  URL utama website (untuk mencegah duplikasi konten)
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="ogTitle">Open Graph Title</Label>
                <Input
                  id="ogTitle"
                  value={settings.ogTitle}
                  onChange={(e) =>
                    setSettings({ ...settings, ogTitle: e.target.value })
                  }
                  placeholder="PesantrenConnect - Platform Komunikasi Pesantren"
                />
                <p className="text-xs text-muted-foreground">
                  Judul saat dibagikan di social media (Facebook, WhatsApp, dll)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ogDescription">Open Graph Description</Label>
                <Textarea
                  id="ogDescription"
                  value={settings.ogDescription}
                  onChange={(e) =>
                    setSettings({ ...settings, ogDescription: e.target.value })
                  }
                  placeholder="Deskripsi singkat untuk social media"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Deskripsi saat dibagikan di social media
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ogImage">Open Graph Image URL</Label>
                <Input
                  id="ogImage"
                  value={settings.ogImage}
                  onChange={(e) =>
                    setSettings({ ...settings, ogImage: e.target.value })
                  }
                  placeholder="https://example.com/og-image.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  Gambar preview saat link dibagikan (optimal: 1200x630px)
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitterCard">Twitter Card Type</Label>
                  <Input
                    id="twitterCard"
                    value={settings.twitterCard}
                    onChange={(e) =>
                      setSettings({ ...settings, twitterCard: e.target.value })
                    }
                    placeholder="summary_large_image"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tipe card Twitter (summary atau summary_large_image)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitterSite">Twitter Site Handle</Label>
                  <Input
                    id="twitterSite"
                    value={settings.twitterSite}
                    onChange={(e) =>
                      setSettings({ ...settings, twitterSite: e.target.value })
                    }
                    placeholder="@pesantrenconnect"
                  />
                  <p className="text-xs text-muted-foreground">
                    Handle Twitter/X website Anda
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hero Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Hero Section
              </CardTitle>
              <CardDescription>
                Konten utama di halaman landing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heroTitle">Judul Hero</Label>
                <Input
                  id="heroTitle"
                  value={settings.heroTitle}
                  onChange={(e) =>
                    setSettings({ ...settings, heroTitle: e.target.value })
                  }
                  placeholder="Pantau Hafalan & Akademik Santri"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heroSubtitle">Sub-judul Hero</Label>
                <Input
                  id="heroSubtitle"
                  value={settings.heroSubtitle}
                  onChange={(e) =>
                    setSettings({ ...settings, heroSubtitle: e.target.value })
                  }
                  placeholder="Secara Real-time"
                />
              </div>

              <Separator />

              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-3">Preview:</p>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{settings.heroTitle}</h2>
                <p className="text-xl md:text-2xl font-semibold" style={{ color: settings.primaryColor }}>
                  {settings.heroSubtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Warna Tema Website
              </CardTitle>
              <CardDescription>
                Sesuaikan palet warna untuk branding website Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary Color */}
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Warna Utama (Primary)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) =>
                        setSettings({ ...settings, primaryColor: e.target.value })
                      }
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) =>
                        setSettings({ ...settings, primaryColor: e.target.value })
                      }
                      placeholder="#059669"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tombol utama, link, dan aksen penting
                  </p>
                </div>

                {/* Secondary Color */}
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Warna Sekunder</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) =>
                        setSettings({ ...settings, secondaryColor: e.target.value })
                      }
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      value={settings.secondaryColor}
                      onChange={(e) =>
                        setSettings({ ...settings, secondaryColor: e.target.value })
                      }
                      placeholder="#3b82f6"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Elemen sekunder dan variasi
                  </p>
                </div>

                {/* Accent Color */}
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Warna Aksen</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) =>
                        setSettings({ ...settings, accentColor: e.target.value })
                      }
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      value={settings.accentColor}
                      onChange={(e) =>
                        setSettings({ ...settings, accentColor: e.target.value })
                      }
                      placeholder="#f59e0b"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Highlight, notifikasi, badge
                  </p>
                </div>

                {/* Background Color */}
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Warna Background</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) =>
                        setSettings({ ...settings, backgroundColor: e.target.value })
                      }
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      value={settings.backgroundColor}
                      onChange={(e) =>
                        setSettings({ ...settings, backgroundColor: e.target.value })
                      }
                      placeholder="#ffffff"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Background utama website
                  </p>
                </div>
              </div>

              <Separator />

              {/* Color Preview */}
              <div className="space-y-4">
                <p className="text-sm font-medium">Preview Palet Warna:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div
                      className="w-full h-24 rounded-lg shadow-md border-2"
                      style={{ backgroundColor: settings.primaryColor }}
                    />
                    <p className="text-xs text-center font-medium">Primary</p>
                    <p className="text-xs text-center text-muted-foreground">{settings.primaryColor}</p>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="w-full h-24 rounded-lg shadow-md border-2"
                      style={{ backgroundColor: settings.secondaryColor }}
                    />
                    <p className="text-xs text-center font-medium">Secondary</p>
                    <p className="text-xs text-center text-muted-foreground">{settings.secondaryColor}</p>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="w-full h-24 rounded-lg shadow-md border-2"
                      style={{ backgroundColor: settings.accentColor }}
                    />
                    <p className="text-xs text-center font-medium">Accent</p>
                    <p className="text-xs text-center text-muted-foreground">{settings.accentColor}</p>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="w-full h-24 rounded-lg shadow-md border-2"
                      style={{ backgroundColor: settings.backgroundColor }}
                    />
                    <p className="text-xs text-center font-medium">Background</p>
                    <p className="text-xs text-center text-muted-foreground">{settings.backgroundColor}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-medium">Preview Komponen:</p>
                  <div className="flex gap-3 flex-wrap items-center p-4 rounded-lg border bg-muted/30">
                    <button
                      className="px-6 py-2.5 rounded-md font-medium text-white shadow hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      Primary Button
                    </button>
                    <button
                      className="px-6 py-2.5 rounded-md font-medium text-white shadow hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: settings.secondaryColor }}
                    >
                      Secondary Button
                    </button>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: settings.accentColor }}
                    >
                      Badge Accent
                    </span>
                    <a href="#" className="font-medium hover:underline" style={{ color: settings.primaryColor }}>
                      Link Text
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={handleResetDefaults}>
          Reset ke Default
        </Button>
        <Button onClick={handleSaveSettings} disabled={submitting} size="lg">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Semua Perubahan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
