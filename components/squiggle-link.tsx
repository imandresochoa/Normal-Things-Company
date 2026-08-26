import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const UNDERLINE_PATH =
  "M0.5 0.5C31.4949 2.7718 178.5 10.4995 178.5 12.4995C178.5 13.9995 34.3121 6.49995 5.5 6.50001";

type SquiggleLinkProps = {
  href: ComponentProps<typeof Link>["href"];
  children: ReactNode;
  className?: string;
};

export function SquiggleLink({ href, children, className }: SquiggleLinkProps) {
  return (
    <Link
      href={href}
      className={[
        "squiggle-link relative inline-block text-[#2A56F7] no-underline outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2A56F7]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="relative z-10">{children}</span>
      <svg
        className="underline-mark pointer-events-none absolute inset-x-0 bottom-[-0.15em] h-[0.45em] w-full overflow-visible"
        viewBox="0 0 179 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={UNDERLINE_PATH}
          data-underline-stroke=""
          pathLength={1}
          fill="none"
          stroke="#2A56F7"
          strokeLinecap="round"
          strokeLinejoin="bevel"
        />
      </svg>
    </Link>
  );
}
