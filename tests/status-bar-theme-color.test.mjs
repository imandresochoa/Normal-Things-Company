import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const browserThemeColorPath = path.join(root, "lib", "browser-theme-color.ts");
const themeColorComponentPath = path.join(root, "components", "theme-color.tsx");
const layoutPath = path.join(root, "app", "layout.tsx");
const globalsCssPath = path.join(root, "app", "globals.css");
const tokensPath = path.join(root, "foundations", "tokens.json");

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function normalizeHex(value) {
  const match = String(value).match(/#([0-9a-fA-F]{6})\b/);
  return match ? `#${match[1].toUpperCase()}` : null;
}

function semanticBgCanvasHex(tokens, mode) {
  const resolved =
    tokens?.color?.semantic?.[mode]?.["bg-canvas"]?.$extensions?.["ntc.resolved"];
  return normalizeHex(resolved);
}

function callBrowserThemeColor(script) {
  const moduleUrl = pathToFileURL(browserThemeColorPath).href;
  const fullScript = `
    import * as theme from ${JSON.stringify(moduleUrl)};
    ${script}
  `;

  const result = spawnSync(
    "node",
    ["--experimental-strip-types", "--input-type=module", "-e", fullScript],
    { encoding: "utf8", cwd: root },
  );

  if (result.status !== 0) {
    return { ok: false, error: result.stderr || result.stdout };
  }

  return { ok: true, value: JSON.parse(result.stdout.trim()) };
}

function findRootMobileHeaderRule(css) {
  const match = css.match(/\.root-mobile-header\s*\{([^}]+)\}/);
  return match ? match[1] : null;
}

test("lib/browser-theme-color.ts exists", () => {
  assert.ok(
    fs.existsSync(browserThemeColorPath),
    "lib/browser-theme-color.ts must exist",
  );
});

test("BROWSER_THEME_COLOR matches foundations/tokens.json semantic bg-canvas", () => {
  const tokens = JSON.parse(readSource(tokensPath));
  const expectedLight = semanticBgCanvasHex(tokens, "light");
  const expectedDark = semanticBgCanvasHex(tokens, "dark");

  assert.equal(expectedLight, "#FBFAF9", "tokens.json light bg-canvas resolved is #FBFAF9");
  assert.equal(expectedDark, "#090807", "tokens.json dark bg-canvas resolved is #090807");

  const result = callBrowserThemeColor(`
    console.log(JSON.stringify({
      light: theme.BROWSER_THEME_COLOR.light,
      dark: theme.BROWSER_THEME_COLOR.dark,
    }));
  `);

  assert.ok(
    result.ok,
    `BROWSER_THEME_COLOR must be importable: ${result.error ?? ""}`,
  );

  assert.equal(
    normalizeHex(result.value.light),
    expectedLight,
    "BROWSER_THEME_COLOR.light must match semantic light bg-canvas",
  );
  assert.equal(
    normalizeHex(result.value.dark),
    expectedDark,
    "BROWSER_THEME_COLOR.dark must match semantic dark bg-canvas",
  );
});

test("pageThemeColorFromStyle returns trimmed --bg-canvas value", () => {
  const result = callBrowserThemeColor(`
    const style = {
      getPropertyValue(name) {
        if (name === "--bg-canvas") return "  #fbfaf9  ";
        return "";
      },
    };
    console.log(JSON.stringify(theme.pageThemeColorFromStyle(style)));
  `);

  assert.ok(
    result.ok,
    `pageThemeColorFromStyle must be callable: ${result.error ?? ""}`,
  );
  assert.equal(
    result.value,
    "#fbfaf9",
    "pageThemeColorFromStyle must return the trimmed --bg-canvas value",
  );
});

test("applyThemeColorMeta keeps exactly one theme-color meta without media", () => {
  const result = callBrowserThemeColor(`
    function makeMeta(attrs) {
      const el = {
        tagName: "META",
        attrs: { ...attrs },
        parent: null,
        getAttribute(name) {
          return this.attrs[name] ?? null;
        },
        setAttribute(name, value) {
          this.attrs[name] = value;
        },
        removeAttribute(name) {
          delete this.attrs[name];
        },
        hasAttribute(name) {
          return Object.hasOwn(this.attrs, name);
        },
        remove() {
          const idx = head.children.indexOf(this);
          if (idx !== -1) head.children.splice(idx, 1);
          this.parent = null;
        },
      };
      return el;
    }

    const head = {
      children: [
        makeMeta({ name: "theme-color", media: "(prefers-color-scheme: light)", content: "#fbfaf9" }),
        makeMeta({ name: "theme-color", media: "(prefers-color-scheme: dark)", content: "#11100f" }),
      ],
    };
    head.appendChild = function appendChild(el) {
      el.parent = head;
      head.children.push(el);
    };
    for (const el of head.children) {
      el.parent = head;
    }

    const document = {
      head,
      createElement(tag) {
        return makeMeta({});
      },
      querySelectorAll(selector) {
        if (selector === 'meta[name="theme-color"]') {
          return head.children.filter(
            (el) => el.tagName === "META" && el.getAttribute("name") === "theme-color",
          );
        }
        return [];
      },
    };

    theme.applyThemeColorMeta(document, "#222221");

    const metas = document.querySelectorAll('meta[name="theme-color"]');
    console.log(JSON.stringify({
      count: metas.length,
      content: metas[0]?.getAttribute("content") ?? null,
      hasMedia: metas.some((meta) => meta.hasAttribute("media")),
    }));
  `);

  assert.ok(
    result.ok,
    `applyThemeColorMeta must be callable: ${result.error ?? ""}`,
  );
  assert.equal(result.value.count, 1, "applyThemeColorMeta must leave exactly one theme-color meta");
  assert.equal(
    normalizeHex(result.value.content),
    "#222221",
    "applyThemeColorMeta must set content to the passed color",
  );
  assert.equal(
    result.value.hasMedia,
    false,
    "applyThemeColorMeta must remove media attributes from theme-color metas",
  );
});

test("applyThemeColorMeta creates a theme-color meta when none exist", () => {
  const result = callBrowserThemeColor(`
    function makeMeta(attrs = {}) {
      const el = {
        tagName: "META",
        attrs: { ...attrs },
        parent: null,
        getAttribute(name) {
          return this.attrs[name] ?? null;
        },
        setAttribute(name, value) {
          this.attrs[name] = value;
        },
        removeAttribute(name) {
          delete this.attrs[name];
        },
        hasAttribute(name) {
          return Object.hasOwn(this.attrs, name);
        },
        remove() {
          const idx = head.children.indexOf(this);
          if (idx !== -1) head.children.splice(idx, 1);
          this.parent = null;
        },
      };
      return el;
    }

    const head = { children: [] };
    head.appendChild = function appendChild(el) {
      el.parent = head;
      head.children.push(el);
    };

    const document = {
      head,
      createElement(tag) {
        return makeMeta({});
      },
      querySelectorAll(selector) {
        if (selector === 'meta[name="theme-color"]') {
          return head.children.filter(
            (el) => el.tagName === "META" && el.getAttribute("name") === "theme-color",
          );
        }
        return [];
      },
    };

    theme.applyThemeColorMeta(document, "#FBFAF9");

    const metas = document.querySelectorAll('meta[name="theme-color"]');
    console.log(JSON.stringify({
      count: metas.length,
      content: metas[0]?.getAttribute("content") ?? null,
      hasMedia: metas.some((meta) => meta.hasAttribute("media")),
    }));
  `);

  assert.ok(
    result.ok,
    `applyThemeColorMeta must be callable on an empty head: ${result.error ?? ""}`,
  );
  assert.equal(result.value.count, 1, "applyThemeColorMeta must create a theme-color meta");
  assert.equal(
    normalizeHex(result.value.content),
    "#FBFAF9",
    "created theme-color meta must use the passed color",
  );
  assert.equal(
    result.value.hasMedia,
    false,
    "created theme-color meta must not include a media attribute",
  );
});

test("app/layout.tsx imports BROWSER_THEME_COLOR for viewport.themeColor", () => {
  const source = readSource(layoutPath);

  assert.match(
    source,
    /import\s*\{[^}]*\bBROWSER_THEME_COLOR\b[^}]*\}\s*from\s*["']@\/lib\/browser-theme-color["']/,
    "app/layout.tsx must import BROWSER_THEME_COLOR from @/lib/browser-theme-color",
  );
  assert.match(
    source,
    /themeColor:\s*\[[\s\S]*?BROWSER_THEME_COLOR\.light[\s\S]*?BROWSER_THEME_COLOR\.dark[\s\S]*?\]/,
    "viewport.themeColor must use BROWSER_THEME_COLOR.light and BROWSER_THEME_COLOR.dark",
  );
});

test("app/layout.tsx renders ThemeColor client component", () => {
  const source = readSource(layoutPath);

  assert.match(
    source,
    /import\s+ThemeColor\s+from\s*["']@\/components\/theme-color["']/,
    "app/layout.tsx must import ThemeColor from @/components/theme-color",
  );
  assert.match(
    source,
    /<ThemeColor\s*\/>/,
    "app/layout.tsx must render <ThemeColor />",
  );
});

test("components/theme-color.tsx syncs meta theme-color from --bg-canvas", () => {
  assert.ok(
    fs.existsSync(themeColorComponentPath),
    "components/theme-color.tsx must exist",
  );

  const source = readSource(themeColorComponentPath);

  assert.match(
    source,
    /["']use client["']/,
    "components/theme-color.tsx must be a client component",
  );
  assert.match(
    source,
    /import\s*\{[^}]*\bapplyThemeColorMeta\b[^}]*\}\s*from\s*["']@\/lib\/browser-theme-color["']/,
    "theme-color must import applyThemeColorMeta from lib/browser-theme-color",
  );
  assert.match(
    source,
    /import\s*\{[^}]*\bpageThemeColorFromStyle\b[^}]*\}\s*from\s*["']@\/lib\/browser-theme-color["']/,
    "theme-color must import pageThemeColorFromStyle from lib/browser-theme-color",
  );
  assert.match(
    source,
    /prefers-color-scheme/,
    "theme-color must react to prefers-color-scheme changes",
  );
  assert.match(
    source,
    /matchMedia|addEventListener|addListener/,
    "theme-color must listen for color scheme changes",
  );
});

test(".root-mobile-header paints the page canvas behind sticky content", () => {
  const css = readSource(globalsCssPath);
  const rule = findRootMobileHeaderRule(css);

  assert.ok(rule, "globals.css must define .root-mobile-header");

  assert.match(
    rule,
    /background:\s*var\(--(?:root-bg|page-bg|bg-canvas)\)/,
    ".root-mobile-header must set background to var(--root-bg), var(--page-bg), or var(--bg-canvas)",
  );
});
