import type { CSSProperties } from "react";
import { ROOTS_MARK_VIEWBOX, rootsStrokes } from "@/lib/roots-strokes";

type StrokeStyle = CSSProperties & {
  "--i": number;
};

function strokeStyle(index: number): StrokeStyle {
  return { "--i": index };
}

export function RootsMark() {
  return (
    <div
      className="relative h-[72px] w-[min(92vw,540px)] shrink-0 text-[#f7452a]"
      role="img"
      aria-label="We are still on it"
    >
      <svg
        className="logo-mark pointer-events-none absolute inset-0 size-full overflow-visible"
        viewBox={ROOTS_MARK_VIEWBOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        data-state="animate"
      >
        {rootsStrokes.map((stroke, index) => (
          <path
            key={stroke.id}
            d={stroke.d}
            data-logo-stroke=""
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={strokeStyle(index)}
          />
        ))}
      </svg>
    </div>
  );
}
