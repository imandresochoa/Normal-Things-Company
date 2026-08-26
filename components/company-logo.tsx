"use client";

import { useLayoutEffect, useRef } from "react";
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

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const timings = pathTimings();

export function CompanyLogo() {
  const svgRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const fills = [...svg.querySelectorAll<SVGPathElement>("[data-logo-fill]")];
    const showStatic = () => {
      fills.forEach((path) => path.removeAttribute("mask"));
      svg.dataset.state = "static";
    };

    try {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const strokes = [
        ...svg.querySelectorAll<SVGPathElement>("[data-logo-stroke]"),
      ];

      if (reduce) {
        showStatic();
        return;
      }

      const flatTimings = timings.flat();
      strokes.forEach((path) => {
        path.setAttribute("pathLength", "1");
        path.setAttribute("stroke-dasharray", "1");
        path.setAttribute("stroke-dashoffset", "1");
      });

      svg.dataset.state = "animate";

      const start = performance.now();
      let frame = 0;

      const tick = (now: number) => {
        const elapsed = (now - start) / 1000;
        let allDone = true;

        strokes.forEach((path, index) => {
          const timing = flatTimings[index];
          const local = Math.min(
            1,
            Math.max(0, (elapsed - timing.delay) / timing.duration),
          );
          path.setAttribute("stroke-dashoffset", `${1 - easeInOut(local)}`);
          if (local < 1) {
            allDone = false;
          }
        });

        if (allDone) {
          showStatic();
          return;
        }

        frame = window.requestAnimationFrame(tick);
      };

      frame = window.requestAnimationFrame(tick);

      return () => window.cancelAnimationFrame(frame);
    } catch {
      showStatic();
    }
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
                    pathLength={1}
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
              data-logo-fill=""
              fill="black"
              mask={`url(#logo-reveal-${letter.id}-${pathIndex})`}
            />
          )),
        )}
      </svg>
    </div>
  );
}
