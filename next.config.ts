import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://api.sarvam.ai https://*.openai.azure.com https://generativelanguage.googleapis.com",
              "media-src 'self' blob: data:",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Server-only packages (never bundled to client)
  serverExternalPackages: ["mongoose", "@google/generative-ai", "@azure/openai"],

  // Experimental features
  experimental: {
    // Optimize for server components
  },
};

export default nextConfig;
