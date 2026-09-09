import Link from "next/link";
import { logoStrokes } from "@/lib/logo-strokes";

export function CompanyWordmark() {
  return (
    <Link
      href="/"
      className="root-wordmark"
      aria-label="Normal Things Company"
    >
      <svg
        className="root-wordmark-mark"
        viewBox="0 0 200 95"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {logoStrokes.map((stroke) => (
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
