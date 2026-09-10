"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";
import { RootMark } from "./root-mark";
import { RootSidebar } from "./sidebar";

type DocsShellProps = {
  children: ReactNode;
};

export function DocsShell({ children }: DocsShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sidebarId = useId();
  const currentSlug = pathname.split("/").filter(Boolean)[1] ?? "purpose";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="root-shell">
      <header className="root-mobile-header md:hidden">
        <RootMark />
        <button
          type="button"
          className="root-menu-button"
          aria-expanded={open}
          aria-controls={sidebarId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <MenuIcon open={open} />
        </button>
      </header>
      {open ? (
        <button
          type="button"
          className="root-overlay md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <RootSidebar currentSlug={currentSlug} open={open} id={sidebarId} />
      <main className="root-main">{children}</main>
    </div>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      {open ? (
        <path
          d="M4 4L14 14M14 4L4 14"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path
            d="M3 6H15"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M3 12H15"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
