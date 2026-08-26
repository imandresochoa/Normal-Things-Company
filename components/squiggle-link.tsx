"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { LOGO_MIDPOINT_MS } from "@/lib/logo-timing";

const UNDERLINE_PATH =
  "M0.5 0.5C31.4949 2.7718 178.5 10.4995 178.5 12.4995C178.5 13.9995 34.3121 6.49995 5.5 6.50001";

type SquiggleLinkProps = {
  href: ComponentProps<typeof Link>["href"];
  children: ReactNode;
  className?: string;
};

export function SquiggleLink({ href, children, className }: SquiggleLinkProps) {
  const rootRef = useRef<HTMLAnchorElement>(null);
  const [inView, setInView] = useState(false);
  const [logoPastMid, setLogoPastMid] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReduce = () => {
      setReduceMotion(media.matches);
    };
    syncReduce();
    media.addEventListener("change", syncReduce);
    return () => {
      media.removeEventListener("change", syncReduce);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setLogoPastMid(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setLogoPastMid(true);
    }, LOGO_MIDPOINT_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [reduceMotion]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) {
      return;
    }

    if (reduceMotion) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [reduceMotion]);

  const shouldAnimate = reduceMotion || (inView && logoPastMid);

  return (
    <Link
      ref={rootRef}
      href={href}
      className={[
        "relative inline-block text-[#2A56F7] no-underline outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2A56F7]",
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
        data-state={shouldAnimate ? "animate" : "idle"}
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
