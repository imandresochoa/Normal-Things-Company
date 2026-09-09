import { notFound } from "next/navigation";
import { ColorsPage } from "@/components/root/colors-page";
import { PulsePage } from "@/components/root/pulse-page";
import { TypographyPage } from "@/components/root/typography-page";
import { getRootNavItem, ROOT_NAV_ITEMS } from "@/lib/root-nav";

type RootSlugPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return ROOT_NAV_ITEMS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: RootSlugPageProps) {
  const { slug } = await params;
  const item = getRootNavItem(slug);

  if (!item) {
    return { title: "Root" };
  }

  return {
    title: item.label,
    description: "Design foundations for Normal Things Company.",
  };
}

export default async function RootSlugPage({ params }: RootSlugPageProps) {
  const { slug } = await params;
  const item = getRootNavItem(slug);

  if (!item) {
    notFound();
  }

  if (slug === "colors") {
    return <ColorsPage />;
  }

  if (slug === "typography") {
    return <TypographyPage />;
  }

  if (slug === "pulse") {
    return <PulsePage />;
  }

  return (
    <article>
      <h1 className="root-page-title">{item.label}</h1>
    </article>
  );
}
