"use client";

import { useEffect } from "react";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";

export function MetadataProvider() {
  const { settings, loading } = useSiteSettings();

  useEffect(() => {
    if (!loading && settings) {
      // Update document title
      document.title = settings.siteName;
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', settings.siteDescription);
      
      // Update meta keywords
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', settings.metaKeywords);
      
      // Update Open Graph tags
      const updateMetaTag = (property: string, content: string) => {
        if (!content) return;
        
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };
      
      updateMetaTag('og:title', settings.ogTitle);
      updateMetaTag('og:description', settings.ogDescription);
      updateMetaTag('og:site_name', settings.siteName);
      if (settings.ogImage) {
        updateMetaTag('og:image', settings.ogImage);
      }
      if (settings.canonicalUrl) {
        updateMetaTag('og:url', settings.canonicalUrl);
      }
      
      // Update Twitter Card tags
      const updateTwitterTag = (name: string, content: string) => {
        if (!content) return;
        
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };
      
      updateTwitterTag('twitter:card', settings.twitterCard);
      updateTwitterTag('twitter:site', settings.twitterSite);
      updateTwitterTag('twitter:title', settings.ogTitle);
      updateTwitterTag('twitter:description', settings.ogDescription);
      if (settings.ogImage) {
        updateTwitterTag('twitter:image', settings.ogImage);
      }
      
      // Update theme-color meta tag
      let themeColor = document.querySelector('meta[name="theme-color"]');
      if (!themeColor) {
        themeColor = document.createElement('meta');
        themeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(themeColor);
      }
      themeColor.setAttribute('content', settings.primaryColor);
    }
  }, [settings, loading]);

  return null;
}
