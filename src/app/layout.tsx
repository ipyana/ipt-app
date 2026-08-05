import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
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
        url: "/must_Logo.png",
        width: 880,
        height: 890,
        alt: "MUST Logo",
      },
    ],
    locale: "en_TZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "MUST — IPT 2025/2026",
    description: "Industrial Practical Training Portal - Mbeya University of Science and Technology",
    images: ["/must_Logo.png"],
  },
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
      </body>
    </html>
  );
}
