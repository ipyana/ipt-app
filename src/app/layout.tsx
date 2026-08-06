import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PWA } from "@/components/PWA";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ipt.herpydevs.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "MUST — IPT 2025/2026",
    template: "%s | MUST IPT",
  },
  description: "Industrial Practical Training Portal - Mbeya University of Science and Technology",
  applicationName: "MUST IPT Portal",
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "MUST IPT Portal",
    title: "MUST — IPT 2025/2026",
    description: "Industrial Practical Training Portal - Mbeya University of Science and Technology",
    images: [
      {
        url: "/og-card.png",
        width: 1200,
        height: 630,
        alt: "MUST Logo",
      },
    ],
    locale: "en_TZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "MUST — IPT 2025/2026",
    description: "Industrial Practical Training Portal - Mbeya University of Science and Technology",
    images: ["/og-card.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#14763b" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-surface text-foreground" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
        <PWA />
      </body>
    </html>
  );
}
