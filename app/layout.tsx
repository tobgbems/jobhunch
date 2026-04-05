import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const siteTitle = "JobHunch – Honest Company Reviews Across Africa";
const siteDescription =
  "Read anonymous reviews of Nigerian and African companies. Find jobs, track applications, and make informed career decisions.";

export const metadata: Metadata = {
  metadataBase: new URL("https://thejobhunch.com"),
  title: siteTitle,
  description: siteDescription,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    url: "https://thejobhunch.com",
    title: siteTitle,
    description: siteDescription,
    images: [{ url: "/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans">
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
