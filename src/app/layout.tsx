import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image Background Remover - Remove Background from Image Free Online",
  description:
    "Remove image background instantly with AI. Free online background remover tool. No signup required. Perfect for product photos, portraits, and more.",
  keywords: [
    "image background remover",
    "remove background from image",
    "background remover free",
    "remove bg",
    "transparent background maker",
    "product photo background remover",
    "ai background remover",
    "remove background online",
    "photo background eraser",
    "background removal tool",
  ],
  openGraph: {
    title: "Image Background Remover - Free AI Background Removal Tool",
    description:
      "Remove image background instantly with AI. Free, fast, and accurate. No signup required.",
    type: "website",
    locale: "en_US",
    siteName: "BG Remover",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Background Remover - Free AI Background Removal Tool",
    description:
      "Remove image background instantly with AI. Free, fast, and accurate.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://bgremover.app" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "BGRemover - Image Background Remover",
              description:
                "Free AI-powered image background remover. Remove backgrounds from photos instantly.",
              url: "https://bgremover.app",
              applicationCategory: "DesignApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "AI Background Removal",
                "Background Replacement",
                "Transparent PNG Export",
                "No Signup Required",
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
