import Link from "next/link";

export function RootMark() {
  return (
    <Link href="/root/colors" className="root-mark" aria-label="Root">
      <span className="root-mark-dot" aria-hidden="true" />
      <span className="root-mark-pill">Root</span>
    </Link>
  );
}
