import { CompanyLogo } from "@/components/company-logo";
import { SquiggleLink } from "@/components/squiggle-link";

const letterClassName =
  "w-full max-w-[620px] break-words whitespace-pre-wrap font-[family-name:var(--font-letter)] text-[18px] font-normal leading-normal text-foreground";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-start gap-8 bg-background px-4 py-10 md:justify-center">
      <p className={letterClassName}>
        {`Dear visitor,

We were born in an era where execution is no longer a barrier. Anyone, anywhere, will be able to build whatever they want. New product categories will emerge just because someone got inspired on a Friday afternoon. Just doing things as a life motto and deciding what to put effort onto have become the most valuable skills.

Yet for the first time, humans will also be able to delegate thinking itself. Fast production and the ability to outsource thought is a double-edged sword. On one hand, it empowers individuals and small teams to create and explore freely. On the other, it reveals how readily we hand over any work we can.

There is a bright future ahead, waiting to be built. Normal Things Company was born to take care of the software we use every day, with humility and a deep love for the craft.

We are currently creating `}
        <SquiggleLink href="/pulse">Pulse</SquiggleLink>
        {`. The pillars that nurture our products.`}
      </p>
      <CompanyLogo />
    </main>
  );
}
