import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1A3A6B",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "BharatAI Mitra — Your AI Companion for Government Services",
    template: "%s | BharatAI Mitra",
  },
  description:
    "BharatAI Mitra (भारत AI मित्र) — GenAI-powered civic platform helping Indian citizens access government services, report public issues, and receive personalized assistance in 22 languages. Powered by Gemini 2.0, Azure o4-mini, and Sarvam AI.",
  keywords: [
    "BharatAI Mitra", "भारत AI मित्र", "government services India", "AI civic companion",
    "Gemini AI", "civic complaints", "government schemes", "Sarvam AI", "multilingual AI",
  ],
  authors: [{ name: "BharatAI Mitra Team" }],
  openGraph: {
    title: "BharatAI Mitra — Your AI Companion for Government Services",
    description: "Your intelligent AI friend (मित्र) for government services, issue reporting, and civic support in 22 Indian languages.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "BharatAI Mitra",
    description: "AI-powered civic companion for every Indian citizen 🇮🇳",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body className={jakarta.className}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
