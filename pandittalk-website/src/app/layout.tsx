import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import { supportEmail } from "@/content/siteIdentity";
import { PLAY_STORE_URL, SITE_URL } from "@/lib/articles/site";
import "./globals.css";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pandit Talk — You Talk. We Stay.",
    template: "%s · Pandit Talk",
  },
  description:
    "Traditional wisdom, real Pandits and modern technology for thoughtful timed conversations. Explore profiles, scheduled sessions and Chat Now.",
  openGraph: {
    type: 'website',
    siteName: 'Pandit Talk',
    title: 'Pandit Talk — You Talk. We Stay.',
    description: 'Traditional wisdom, real Pandits and modern technology. Explore profiles, scheduled sessions and Chat Now.',
    url: SITE_URL,
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Pandit Talk' }],
  },
  twitter: { card: 'summary', title: 'Pandit Talk — You Talk. We Stay.', description: 'Thoughtful timed conversations with real Pandits.' },
  appleWebApp: { capable: true, title: 'Pandit Talk', statusBarStyle: 'default' },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [{ url: "/logo.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffaf1" },
    { media: "(prefers-color-scheme: dark)", color: "#fffaf1" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={body.variable}>
      <body className="antialiased"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: 'Pandit Talk', legalName: 'Personal Astrology Numerology Directional Info Talk Tech Private Limited', url: SITE_URL, logo: `${SITE_URL}/logo.png`, email: supportEmail, contactPoint: [{ '@type': 'ContactPoint', email: supportEmail, contactType: 'customer support', areaServed: 'IN', availableLanguage: ['en', 'hi'] }], sameAs: [PLAY_STORE_URL] }) }} /><SiteHeader /><div id="site-content" tabIndex={-1}>{children}</div><SiteFooter /></body>
    </html>
  );
}
