import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Normal Things Company",
  description:
    "Normal Things Company takes care of the software we use every day, with humility and a deep love for the craft.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#fbfbfb] text-black antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "setTimeout(function(){var e=document.querySelector('.logo-mark');if(e&&!e.getAttribute('data-state'))e.setAttribute('data-state','static');},1500);",
          }}
        />
      </body>
    </html>
  );
}
