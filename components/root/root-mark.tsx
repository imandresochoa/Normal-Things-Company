import Link from "next/link";
import { ROOT_MARK_VIEWBOX, rootStrokes } from "@/lib/root-strokes";

export function RootMark() {
  return (
    <Link href="/root/colors" className="root-mark" aria-label="Root">
      <svg
        className="root-mark-svg"
        viewBox={ROOT_MARK_VIEWBOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {rootStrokes.map((stroke) => (
          <path
            key={stroke.id}
            d={stroke.d}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </Link>
  );
}
