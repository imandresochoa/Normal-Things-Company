import type { CSSProperties } from "react";
import { logoStrokes } from "@/lib/logo-strokes";

type StrokeStyle = CSSProperties & {
  "--i": number;
};

function strokeStyle(index: number): StrokeStyle {
  const style: StrokeStyle = { "--i": index };
  return style;
}

export function CompanyLogo() {
  return (
    <div className="relative h-[94.596px] w-[200px] shrink-0 overflow-hidden">
      <svg
        className="logo-mark size-full"
        viewBox="0 0 200 95"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Normal Things Company"
        data-state="animate"
      >
        {logoStrokes.map((stroke, index) => (
          <path
            key={stroke.id}
            d={stroke.d}
            data-logo-stroke=""
            pathLength={1}
            fill="none"
            stroke="black"
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
