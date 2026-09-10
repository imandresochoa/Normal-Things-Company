export const BROWSER_THEME_COLOR = {
  light: "#fbfaf9",
  dark: "#090807",
} as const;

export function pageThemeColorFromStyle(style: CSSStyleDeclaration): string {
  return style.getPropertyValue("--bg-canvas").trim();
}

type ThemeColorDocument = Pick<
  Document,
  "querySelectorAll" | "createElement" | "head"
>;

export function applyThemeColorMeta(
  document: ThemeColorDocument,
  color: string,
): void {
  const metas = document.querySelectorAll('meta[name="theme-color"]');

  if (metas.length === 0) {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", color);
    document.head.appendChild(meta);
    return;
  }

  // Keep Next.js-owned meta nodes in the tree. Removing them makes the next
  // client navigation throw in React's commit (removeChild on a null parent),
  // so the first sidebar click only changes the URL.
  for (let i = 0; i < metas.length; i++) {
    metas[i].setAttribute("name", "theme-color");
    metas[i].setAttribute("content", color);
  }
}
