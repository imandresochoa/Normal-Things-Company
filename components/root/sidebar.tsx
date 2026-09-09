import Link from "next/link";
import { isRootNavItemReady, ROOT_NAV, rootPath } from "@/lib/root-nav";
import { UNDERLINE_PATH } from "@/lib/underline-path";
import { RootMark } from "./root-mark";

type RootSidebarProps = {
  currentSlug: string;
  open: boolean;
  id?: string;
};

export function RootSidebar({ currentSlug, open, id }: RootSidebarProps) {
  return (
    <aside
      id={id}
      className="root-sidebar"
      data-open={open ? "true" : "false"}
      aria-label="Root"
    >
      <div className="root-sidebar-head">
        <RootMark />
      </div>
      <nav className="root-nav" aria-label="Root">
        {ROOT_NAV.map((section) => (
          <div key={section.title}>
            <p className="root-nav-title">{section.title}</p>
            <ul className="root-nav-list">
              {section.items.map((item) => {
                const active = item.slug === currentSlug;

                if (isRootNavItemReady(item.slug)) {
                  return (
                    <li key={item.slug}>
                      <Link
                        href={rootPath(item.slug)}
                        className="root-nav-link"
                        data-active={active ? "true" : undefined}
                        aria-current={active ? "page" : undefined}
                      >
                        <span>{item.label}</span>
                        {active ? (
                          <svg
                            className="underline-mark pointer-events-none absolute inset-x-0 bottom-[-0.15em] h-[0.45em] w-full overflow-visible"
                            viewBox="0 0 179 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                          >
                            <path
                              d={UNDERLINE_PATH}
                              data-underline-stroke=""
                              pathLength={1}
                              fill="none"
                              stroke="var(--bg-accent)"
                              strokeLinecap="round"
                              strokeLinejoin="bevel"
                            />
                          </svg>
                        ) : null}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={item.slug}>
                    <span
                      className="root-nav-link root-nav-disabled"
                      aria-disabled="true"
                    >
                      <span>{item.label}</span>
                      <svg
                        className="root-nav-strike pointer-events-none absolute inset-x-0 top-1/2 z-[1] h-[0.45em] w-full -translate-y-1/2 overflow-visible"
                        viewBox="0 0 179 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <path
                          d={UNDERLINE_PATH}
                          data-underline-stroke=""
                          pathLength={1}
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="bevel"
                        />
                      </svg>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
