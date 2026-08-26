import type { Metadata } from "next";
import { CopyToast } from "@/components/copy-toast";
import "./globals.css";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
        <CopyToast />
      </body>
    </html>
  );
}
