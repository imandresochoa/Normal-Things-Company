import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { CopyToast } from "@/components/copy-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const title = "Normal Things Company";
const description =
  "Normal Things Company takes care of the software we use every day, with humility and a deep love for the craft.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#11100f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className={`${inter.className} min-h-full bg-background antialiased`}>
        {children}
        <CopyToast />
      </body>
    </html>
  );
}
