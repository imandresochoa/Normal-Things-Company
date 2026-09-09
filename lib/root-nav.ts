export type RootNavItem = {
  label: string;
  slug: string;
};

export type RootNavSection = {
  title: string;
  items: RootNavItem[];
};

export const ROOT_NAV: RootNavSection[] = [
  {
    title: "Introduction",
    items: [
      { label: "Purpose", slug: "purpose" },
      { label: "Principles", slug: "principles" },
    ],
  },
  {
    title: "Foundations",
    items: [
      { label: "Colors", slug: "colors" },
      { label: "Typography", slug: "typography" },
      { label: "Iconography", slug: "iconography" },
    ],
  },
  {
    title: "Controls",
    items: [
      { label: "Button", slug: "button" },
      { label: "Input", slug: "input" },
      { label: "Select", slug: "select" },
      { label: "Textarea", slug: "textarea" },
      { label: "Checkbox", slug: "checkbox" },
      { label: "Radio", slug: "radio" },
      { label: "Switch", slug: "switch" },
      { label: "Slider", slug: "slider" },
    ],
  },
  {
    title: "Components",
    items: [
      { label: "Command Menu", slug: "command-menu" },
      { label: "Dialog", slug: "dialog" },
      { label: "Combobox", slug: "combobox" },
      { label: "Tooltip", slug: "tooltip" },
      { label: "Sidebar", slug: "sidebar" },
    ],
  },
];

export const ROOT_NAV_ITEMS: RootNavItem[] = ROOT_NAV.flatMap(
  (section) => section.items,
);

export function getRootNavItem(slug: string): RootNavItem | undefined {
  return ROOT_NAV_ITEMS.find((item) => item.slug === slug);
}

export function rootPath(slug: string): string {
  return `/root/${slug}`;
}

const READY_SLUGS = new Set(["colors", "typography"]);

export function isRootNavItemReady(slug: string): boolean {
  return READY_SLUGS.has(slug);
}
