"use client";

import { useEffect, useState, type CSSProperties } from "react";
import logoLetters from "@/lib/logo-letters.json";

type LogoLetter = {
  id: string;
  order: number;
  paths: string[];
};

const letters = logoLetters as LogoLetter[];

type PathTiming = {
  delay: number;
  duration: number;
};

function pathTimings(): PathTiming[][] {
  let elapsed = 0.12;
  return letters.map((letter) =>
    letter.paths.map((path) => {
      const duration = 0.2 + Math.min(0.42, path.length / 4200);
      const timing = { delay: elapsed, duration };
      elapsed += duration * 0.68;
      return timing;
    }),
  );
}

const timings = pathTimings();

export function CompanyLogo() {
  const [motion, setMotion] = useState<"pending" | "animate" | "static">(
    "pending",
  );

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setMotion("static");
      return;
    }

    setMotion("animate");
    const last = timings.flat().reduce(
      (max, timing) => Math.max(max, timing.delay + timing.duration),
      0,
    );
    const timer = window.setTimeout(() => {
      setMotion("static");
    }, (last + 0.2) * 1000);

    return () => window.clearTimeout(timer);
  }, []);

  const readyClass =
    motion === "animate"
      ? "logo-is-ready"
      : motion === "static"
        ? "logo-is-static"
        : "";

  return (
    <div className="relative h-[94.596px] w-[200px] shrink-0 overflow-hidden">
      <svg
        className={`size-full ${readyClass}`}
        viewBox="0 0 200 95"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Normal Things Company"
        style={{ opacity: motion === "pending" ? 0 : 1 }}
      >
        <defs>
          {letters.flatMap((letter, letterIndex) =>
            letter.paths.map((d, pathIndex) => {
              const timing = timings[letterIndex][pathIndex];
              const maskId = `logo-reveal-${letter.id}-${pathIndex}`;
              return (
                <mask
                  id={maskId}
                  key={maskId}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="200"
                  height="95"
                >
                  <path
                    d={d}
                    fill="none"
                    stroke="white"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    className="logo-path-reveal"
                    style={
                      {
                        "--reveal-delay": `${timing.delay}s`,
                        "--reveal-duration": `${timing.duration}s`,
                      } as CSSProperties
                    }
                  />
                </mask>
              );
            }),
          )}
        </defs>
        {letters.flatMap((letter, letterIndex) =>
          letter.paths.map((d, pathIndex) => (
            <path
              key={`${letter.id}-${pathIndex}`}
              d={d}
              fill="black"
              mask={`url(#logo-reveal-${letter.id}-${pathIndex})`}
            />
          )),
        )}
      </svg>
    </div>
  );
}
