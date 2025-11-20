"use client";

import { useEffect } from "react";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useSiteSettings();

  useEffect(() => {
    if (!loading && settings) {
      // Apply CSS custom properties to document root
      const root = document.documentElement;
      
      // Convert hex to OKLCH for Tailwind CSS v4 compatibility
      const hexToOKLCH = (hex: string) => {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Convert hex to RGB (0-1 range)
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;

        // Convert RGB to linear RGB
        const toLinear = (c: number) => {
          return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        };
        const rLinear = toLinear(r);
        const gLinear = toLinear(g);
        const bLinear = toLinear(b);

        // Convert to OKLAB (approximation)
        const l = 0.4122214708 * rLinear + 0.5363325363 * gLinear + 0.0514459929 * bLinear;
        const m = 0.2119034982 * rLinear + 0.6806995451 * gLinear + 0.1073969566 * bLinear;
        const s = 0.0883024619 * rLinear + 0.2817188376 * gLinear + 0.6299787005 * bLinear;

        const lCube = Math.cbrt(l);
        const mCube = Math.cbrt(m);
        const sCube = Math.cbrt(s);

        const L = 0.2104542553 * lCube + 0.7936177850 * mCube - 0.0040720468 * sCube;
        const a = 1.9779984951 * lCube - 2.4285922050 * mCube + 0.4505937099 * sCube;
        const bVal = 0.0259040371 * lCube + 0.7827717662 * mCube - 0.8086757660 * sCube;

        // Convert to OKLCH
        const C = Math.sqrt(a * a + bVal * bVal);
        let H = Math.atan2(bVal, a) * 180 / Math.PI;
        if (H < 0) H += 360;

        return `${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(2)}`;
      };

      // Set OKLCH CSS variables for Tailwind
      root.style.setProperty('--primary', `oklch(${hexToOKLCH(settings.primaryColor)})`);
      root.style.setProperty('--secondary', `oklch(${hexToOKLCH(settings.secondaryColor)})`);
      root.style.setProperty('--accent', `oklch(${hexToOKLCH(settings.accentColor)})`);
      root.style.setProperty('--sidebar-primary', `oklch(${hexToOKLCH(settings.primaryColor)})`);
      root.style.setProperty('--sidebar-ring', `oklch(${hexToOKLCH(settings.primaryColor)})`);
      root.style.setProperty('--ring', `oklch(${hexToOKLCH(settings.primaryColor)})`);
      
      // Also set direct hex color variables for inline styles
      root.style.setProperty('--color-primary-hex', settings.primaryColor);
      root.style.setProperty('--color-secondary-hex', settings.secondaryColor);
      root.style.setProperty('--color-accent-hex', settings.accentColor);
    }
  }, [settings, loading]);

  return <>{children}</>;
}
