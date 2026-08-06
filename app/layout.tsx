import type { Metadata, Viewport } from "next";
import { Inter, Hind_Siliguri, Noto_Serif_Bengali, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";
import { MarketingConsent } from "@/components/privacy/MarketingConsent";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const notoSerifBengali = Noto_Serif_Bengali({
  variable: "--font-noto-serif-bengali",
  subsets: ["bengali"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UnReal BS - Business Systems",
  description: "English-first AI business operating system for CRM, automations, conversations, sites, and agents.",
  keywords: ["CRM", "business", "Bangladesh", "automation", "AI agents"],
  applicationName: "UnReal BS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UnReal BS",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#070712",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html
      lang="en"
      className={`${inter.variable} ${hindSiliguri.variable} ${notoSerifBengali.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="h-full antialiased">
        {children}
        <MarketingConsent />
        <ServiceWorkerRegistration />
        <Script src="https://js.puter.com/v2/" strategy="lazyOnload" nonce={nonce} />
      </body>
    </html>
  );
}
