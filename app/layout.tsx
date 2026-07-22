import type { Metadata } from "next";
import { Inter, Hind_Siliguri, Noto_Serif_Bengali, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "UnReal BS — Business System",
  description: "বাংলাদেশের ব্যবসার জন্য সর্বোচ্চ ব্যবসায়িক সিস্টেম",
  keywords: ["CRM", "business", "Bangladesh", "ব্যবসা", "automation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className={`${inter.variable} ${hindSiliguri.variable} ${notoSerifBengali.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="h-full antialiased">
        {children}
        <Script src="https://js.puter.com/v2/" strategy="lazyOnload" />
      </body>
    </html>
  );
}
