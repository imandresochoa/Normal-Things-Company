import type { Metadata } from "next";
import { PulseMark } from "@/components/pulse-mark";
import { SquiggleLink } from "@/components/squiggle-link";

export const metadata: Metadata = {
  title: "Pulse",
  description: "Design foundations for Normal Things Company.",
};

export default function PulsePage() {
  return (
    <main
      className="flex min-h-dvh flex-col bg-background"
      aria-label="Pulse"
    >
      <header className="px-4 py-10 md:px-8">
        <SquiggleLink href="/">Normal Things Company</SquiggleLink>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <PulseMark />
      </div>
    </main>
  );
}
