import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DocsShell } from "@/components/root/docs-shell";

export const metadata: Metadata = {
  title: {
    default: "Root",
    template: "%s · Root",
  },
  description: "Design foundations for Normal Things Company.",
};

export default function RootDocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="root-docs">
      <DocsShell>{children}</DocsShell>
    </div>
  );
}
