import Link from "next/link";
import { BrandMarkStripes } from "@/lib/brand-mark-stripes";

export function RootMark() {
  return (
    <Link href="/root/purpose" className="root-mark" aria-label="Root">
      <div className="root-mark-seed" aria-hidden="true">
        <BrandMarkStripes />
      </div>
      <span className="root-mark-pill">Root</span>
    </Link>
  );
}
