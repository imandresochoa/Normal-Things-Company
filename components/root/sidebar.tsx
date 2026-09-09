import Link from "next/link";
import { ROOT_NAV, rootPath } from "@/lib/root-nav";
import { CompanyWordmark } from "./company-wordmark";
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
        <CompanyWordmark />
        <RootMark />
      </div>
      <nav className="root-nav" aria-label="Root">
        {ROOT_NAV.map((section) => (
          <div key={section.title}>
            <p className="root-nav-title">{section.title}</p>
            <ul className="root-nav-list">
              {section.items.map((item) => {
                const active = item.slug === currentSlug;

                return (
                  <li key={item.slug}>
                    <Link
                      href={rootPath(item.slug)}
                      className="root-nav-link"
                      data-active={active ? "true" : undefined}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
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
