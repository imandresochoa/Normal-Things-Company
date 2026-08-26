import { CompanyLogo } from "@/components/company-logo";

const letter = `Dear visitor,

We were born in an era where execution is no longer a barrier. Anyone, anywhere, will be able to build whatever they want. New product categories will emerge just because someone got inspired on a Friday afternoon. Just doing things as a life motto and deciding what to put effort onto have become the most valuable skills.

Yet for the first time, humans will also be able to delegate thinking itself. Fast production and the ability to outsource thought is a double-edged sword. On one hand, it empowers individuals and small teams to create and explore freely. On the other, it reveals how readily we hand over any work we can.

There is a bright future ahead, waiting to be built. Normal Design Company was born to take care of the software we use every day, with humility and a deep love for the craft.

We are currently working to help you keep your plants alive. We like small starts.`;

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-start gap-8 bg-[#fbfbfb] px-4 py-10 md:justify-center">
      <p className="w-full max-w-[620px] break-words whitespace-pre-wrap text-[16px] leading-normal text-black">
        {letter}
      </p>
      <CompanyLogo />
    </main>
  );
}
