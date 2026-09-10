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

  const primary = metas[0];
  primary.setAttribute("name", "theme-color");
  primary.setAttribute("content", color);
  primary.removeAttribute("media");

  for (let i = 1; i < metas.length; i++) {
    metas[i].remove();
  }
}
