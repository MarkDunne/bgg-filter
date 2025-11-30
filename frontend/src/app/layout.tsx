import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://findmeaboardgame.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Find Me a Boardgame - Board Game Finder",
    template: "%s | Find Me a Boardgame",
  },
  description: "Find the perfect board game for your group! Use our Goldilocks score to discover the best-rated board games at your preferred complexity level. Filter by player count, categories, mechanics, and more.",
  keywords: [
    "find board game",
    "board game finder",
    "best board games by complexity",
    "pareto optimal board games",
    "goldilocks board game score",
    "board game complexity rating",
    "find board games by player count",
    "best rated board games",
    "board games by complexity",
    "board game recommendations",
  ],
  authors: [{ name: "Find Me a Boardgame" }],
  creator: "Find Me a Boardgame",
  publisher: "Find Me a Boardgame",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Find Me a Boardgame",
    title: "Find Me a Boardgame - Board Game Finder",
    description: "Find the perfect board game for your group! Use our Goldilocks score to discover the best-rated board games at your preferred complexity level.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Find Me a Boardgame - Board Game Finder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Me a Boardgame - Board Game Finder",
    description: "Find the perfect board game for your group! Use our Goldilocks score to discover the best-rated board games at your preferred complexity level.",
    images: ["/og-image.png"],
    creator: "@findmeaboardgame",
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
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    // Add Google Search Console verification when available
    // google: "your-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Find Me a Boardgame",
    description: "Find the perfect board game for your group using our Goldilocks score that balances rating and complexity",
    url: siteUrl,
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Find Me a Boardgame",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webAppSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
