import type { Metadata } from "next";
import { PixelDisplay } from "@/components/pixel-display";
import { SquiggleLink } from "@/components/squiggle-link";

export const metadata: Metadata = {
  title: "Roots",
  description: "Design foundations for Normal Things Company.",
};

export default function RootsPage() {
  return (
    <main
      className="flex min-h-dvh flex-col bg-background"
      aria-label="Roots"
    >
      <header className="px-4 py-10 md:px-8">
        <SquiggleLink href="/">Normal Things Company</SquiggleLink>
      </header>
      <div className="min-h-16 flex-1" aria-hidden="true" />
      <PixelDisplay />
    </main>
  );
}
