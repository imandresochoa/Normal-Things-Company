import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Foundations",
  description: "Design foundations for Normal Things Company.",
};

export default function FoundationsPage() {
  return (
    <main className="min-h-dvh bg-background" aria-label="Foundations" />
  );
}
