"use client";

import { useEffect, useRef } from "react";
import { logoLetters } from "@/lib/logo-letters";

type PathTiming = {
  delay: number;
  duration: number;
};

function pathTimings(): PathTiming[][] {
  let elapsed = 0.12;
  return logoLetters.map((letter) =>
    letter.paths.map((path) => {
      const duration = 0.22 + Math.min(0.45, path.length / 3800);
      const timing = { delay: elapsed, duration };
      elapsed += duration * 0.7;
      return timing;
    }),
  );
}

const timings = pathTimings();

export function CompanyLogo() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const strokes = [
      ...svg.querySelectorAll<SVGPathElement>("[data-logo-stroke]"),
    ];

    if (reduce) {
      strokes.forEach((path) => {
        path.style.strokeDasharray = "none";
        path.style.strokeDashoffset = "0";
      });
      svg.dataset.state = "static";
      return;
    }

    svg.dataset.state = "animate";

    strokes.forEach((path, index) => {
      const length = path.getTotalLength();
      const timing = timings.flat()[index];
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.style.transition = "none";
      path.getBoundingClientRect();
      path.style.transition = `stroke-dashoffset ${timing.duration}s cubic-bezier(0.37, 0, 0.63, 1) ${timing.delay}s`;
      path.style.strokeDashoffset = "0";
    });

    const last = timings.flat().reduce(
      (max, timing) => Math.max(max, timing.delay + timing.duration),
      0,
    );
    const timer = window.setTimeout(() => {
      svg.dataset.state = "static";
    }, (last + 0.15) * 1000);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-[94.596px] w-[200px] shrink-0 overflow-hidden">
      <svg
        ref={svgRef}
        className="logo-mark size-full"
        viewBox="0 0 200 95"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Normal Things Company"
      >
        <defs>
          {logoLetters.flatMap((letter) =>
            letter.paths.map((d, pathIndex) => {
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
                    data-logo-stroke=""
                    fill="none"
                    stroke="white"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </mask>
              );
            }),
          )}
        </defs>
        {logoLetters.flatMap((letter) =>
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
