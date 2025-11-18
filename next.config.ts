import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,
  // Configure Turbopack instead of webpack
  turbopack: {
    // Turbopack configuration
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  // Fallback webpack configuration for compatibility
  webpack: (config, { dev, isServer }) => {
    // Suppress source map warnings in development
    if (dev) {
      config.devtool = "eval-source-map";
    }
    return config;
  },
  // Configure environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
