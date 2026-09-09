import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootNavPath = path.join(root, "lib", "root-nav.ts");
const sidebarPath = path.join(root, "components", "root", "sidebar.tsx");
const underlinePathPath = path.join(root, "lib", "underline-path.ts");
const squiggleLinkPath = path.join(root, "components", "squiggle-link.tsx");
const globalsCssPath = path.join(root, "app", "globals.css");
const colorsPagePath = path.join(root, "components", "root", "colors-page.tsx");
const rootIndexPath = path.join(root, "app", "root", "page.tsx");
const pulsePagePath = path.join(root, "app", "pulse", "page.tsx");
const rootMarkPath = path.join(root, "components", "root", "root-mark.tsx");

const READY_SLUGS = ["colors", "typography", "pulse"];

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function parseRootNavSlugs(source) {
  const slugs = [];
  for (const match of source.matchAll(/slug:\s*"([^"]+)"/g)) {
    slugs.push(match[1]);
  }
  return slugs;
}

function parseRootNavLabels(source) {
  const labels = [];
  for (const match of source.matchAll(/label:\s*"([^"]+)"/g)) {
    labels.push(match[1]);
  }
  return labels;
}

function parseSectionSlugs(source, sectionTitle) {
  const escaped = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sectionMatch = source.match(
    new RegExp(
      `title:\\s*"${escaped}"[\\s\\S]*?items:\\s*\\[([\\s\\S]*?)\\],\\s*\\n\\s*\\}`,
    ),
  );

  if (!sectionMatch) {
    return [];
  }

  const slugs = [];
  for (const match of sectionMatch[1].matchAll(/slug:\s*"([^"]+)"/g)) {
    slugs.push(match[1]);
  }
  return slugs;
}

function parseIntroductionSlugs(source) {
  return parseSectionSlugs(source, "Introduction");
}

function parseFoundationsSlugs(source) {
  return parseSectionSlugs(source, "Foundations");
}

function callIsRootNavItemReady(slug) {
  const moduleUrl = pathToFileURL(rootNavPath).href;
  const script = `
    import { isRootNavItemReady } from ${JSON.stringify(moduleUrl)};
    console.log(JSON.stringify(isRootNavItemReady(${JSON.stringify(slug)})));
  `;

  const result = spawnSync(
    "node",
    ["--experimental-strip-types", "--input-type=module", "-e", script],
    { encoding: "utf8", cwd: root },
  );

  if (result.status !== 0) {
    return { ok: false, error: result.stderr || result.stdout };
  }

  return { ok: true, value: JSON.parse(result.stdout.trim()) };
}

test("ROOT_NAV must not include styling slug", () => {
  const source = readSource(rootNavPath);
  const navSlugs = parseRootNavSlugs(source);

  assert.ok(
    !navSlugs.includes("styling"),
    'lib/root-nav.ts must not include a nav item with slug "styling"',
  );
});

test("ROOT_NAV must not include Styling label", () => {
  const source = readSource(rootNavPath);
  const navLabels = parseRootNavLabels(source);

  assert.ok(
    !navLabels.includes("Styling"),
    'lib/root-nav.ts must not include a nav item with label "Styling"',
  );
});

test("Introduction section keeps only purpose and principles", () => {
  const source = readSource(rootNavPath);
  const introSlugs = parseIntroductionSlugs(source);

  assert.deepEqual(
    introSlugs,
    ["purpose", "principles"],
    'Introduction section must include only Purpose and Principles in that order (slugs "purpose", "principles")',
  );
});

test("Foundations section orders colors, pulse, typography, and iconography", () => {
  const source = readSource(rootNavPath);
  const foundationsSlugs = parseFoundationsSlugs(source);

  assert.deepEqual(
    foundationsSlugs,
    ["colors", "pulse", "typography", "iconography"],
    'Foundations section must include Colors, Pulse, Typography, and Iconography in that order (slugs "colors", "pulse", "typography", "iconography")',
  );
});

test("root-nav exports isRootNavItemReady", () => {
  const source = readSource(rootNavPath);

  assert.match(
    source,
    /export function isRootNavItemReady\s*\(/,
    "lib/root-nav.ts must export isRootNavItemReady(slug)",
  );
});

test("isRootNavItemReady returns true for colors, typography, and pulse", () => {
  for (const slug of READY_SLUGS) {
    const result = callIsRootNavItemReady(slug);

    assert.ok(
      result.ok,
      `isRootNavItemReady must be callable (slug "${slug}"): ${result.error ?? ""}`,
    );
    assert.equal(
      result.value,
      true,
      `isRootNavItemReady("${slug}") must return true`,
    );
  }
});

test("isRootNavItemReady returns false for every other ROOT_NAV slug", () => {
  const source = readSource(rootNavPath);
  const navSlugs = parseRootNavSlugs(source);
  const notReadySlugs = navSlugs.filter((slug) => !READY_SLUGS.includes(slug));

  assert.ok(
    notReadySlugs.length > 0,
    "ROOT_NAV must include slugs other than colors, typography, and pulse",
  );

  for (const slug of notReadySlugs) {
    const result = callIsRootNavItemReady(slug);

    assert.ok(
      result.ok,
      `isRootNavItemReady must be callable (slug "${slug}"): ${result.error ?? ""}`,
    );
    assert.equal(
      result.value,
      false,
      `isRootNavItemReady("${slug}") must return false`,
    );
  }
});

test("isRootNavItemReady returns false for unknown slugs", () => {
  for (const slug of ["", "unknown-page", "not-a-root-slug"]) {
    const result = callIsRootNavItemReady(slug);

    assert.ok(
      result.ok,
      `isRootNavItemReady must be callable (slug "${slug}"): ${result.error ?? ""}`,
    );
    assert.equal(
      result.value,
      false,
      `isRootNavItemReady("${slug}") must return false for unknown slugs`,
    );
  }
});

test("sidebar branches on isRootNavItemReady", () => {
  const source = readSource(sidebarPath);

  assert.match(
    source,
    /import\s*\{[^}]*\bisRootNavItemReady\b[^}]*\}\s*from\s*["']@\/lib\/root-nav["']/,
    "sidebar must import isRootNavItemReady from lib/root-nav",
  );
  assert.match(
    source,
    /isRootNavItemReady\s*\(\s*item\.slug\s*\)/,
    "sidebar must call isRootNavItemReady(item.slug)",
  );
});

test("sidebar keeps Link for ready nav items", () => {
  const source = readSource(sidebarPath);

  assert.match(
    source,
    /isRootNavItemReady\s*\(\s*item\.slug\s*\)[\s\S]*?<Link[\s\S]*href=\{rootPath\(item\.slug\)\}/,
    "ready items must still use Next Link with rootPath(item.slug) inside the ready branch",
  );
});

test("empty sidebar items are not Link and use aria-disabled", () => {
  const source = readSource(sidebarPath);

  assert.doesNotMatch(
    source,
    /<Link[\s\S]*href=\{rootPath\(item\.slug\)\}[\s\S]*>\s*\{item\.label\}\s*<\/Link>/,
    "empty items must not render every nav row as a plain Link",
  );
  assert.match(
    source,
    /aria-disabled/,
    "empty nav items must expose aria-disabled",
  );
  assert.match(
    source,
    /<span[\s\S]*aria-disabled/,
    "empty nav items must render a non-anchor span (or similar) with aria-disabled",
  );
});

test("sidebar imports shared UNDERLINE_PATH for empty items", () => {
  const source = readSource(sidebarPath);

  assert.match(
    source,
    /import\s*\{[^}]*\bUNDERLINE_PATH\b[^}]*\}\s*from\s*["']@\/lib\/underline-path["']/,
    "sidebar must import UNDERLINE_PATH from lib/underline-path",
  );
  assert.match(
    source,
    /d=\{UNDERLINE_PATH\}/,
    "empty nav strike must use UNDERLINE_PATH, not a duplicated path string",
  );
  assert.doesNotMatch(
    source,
    /d="M0\.5 0\.5C31\.4949/,
    "sidebar must not inline the squiggle path string",
  );
});

test("underline-path exports UNDERLINE_PATH", () => {
  assert.ok(
    fs.existsSync(underlinePathPath),
    "lib/underline-path.ts must exist",
  );

  const source = readSource(underlinePathPath);

  assert.match(
    source,
    /export const UNDERLINE_PATH\s*=/,
    "lib/underline-path.ts must export UNDERLINE_PATH",
  );
});

test("squiggle-link imports UNDERLINE_PATH from shared module", () => {
  const source = readSource(squiggleLinkPath);

  assert.match(
    source,
    /import\s*\{[^}]*\bUNDERLINE_PATH\b[^}]*\}\s*from\s*["']@\/lib\/underline-path["']/,
    "squiggle-link must import UNDERLINE_PATH from lib/underline-path",
  );
  assert.doesNotMatch(
    source,
    /const UNDERLINE_PATH\s*=/,
    "squiggle-link must not keep a local UNDERLINE_PATH constant",
  );
});

test("globals.css defines text-disabled and root-disabled tokens", () => {
  const css = readSource(globalsCssPath);

  assert.match(
    css,
    /--text-disabled:\s*#736[fF]6[cC]\b/,
    "globals.css must define --text-disabled as Root light text-disabled (#736f6c)",
  );
  assert.match(
    css,
    /--root-title:\s*#928[eE]8[bB]\b/,
    "globals.css must define --root-title as Neutral 500 (#928e8b)",
  );
  assert.match(
    css,
    /--root-disabled:\s*#dad7d4\b/i,
    "globals.css must define --root-disabled as Neutral 400 (#dad7d4)",
  );
});

test("disabled nav text and strike use disabled color tokens", () => {
  const css = readSource(globalsCssPath);

  assert.match(
    css,
    /root-nav[\w-]*[\s\S]*color:\s*var\(--(?:root-disabled|text-disabled)\)/,
    "disabled nav text must use var(--root-disabled) or var(--text-disabled)",
  );
  assert.match(
    css,
    /root-nav[\w-]*[\s\S]*stroke:\s*var\(--(?:root-disabled|text-disabled)\)/,
    "disabled nav strike must use var(--root-disabled) or var(--text-disabled)",
  );
});

function findDisabledNavStrikeRule(css) {
  const rulePattern =
    /(\.root-nav[\w-]*)\s*\[data-underline-stroke\]\s*\{([^}]+)\}/g;

  for (const match of css.matchAll(rulePattern)) {
    const selector = match[1];
    const body = match[2];

    if (/disabled|strike/i.test(selector)) {
      return { selector, body };
    }
  }

  return null;
}

function findRootBlock(css) {
  const match = css.match(/:root\s*\{([^}]+)\}/);
  return match ? match[1] : null;
}

function findDarkModeBlock(css) {
  const start = css.search(
    /@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)\s*\{/,
  );
  if (start === -1) {
    return null;
  }

  const openBrace = css.indexOf("{", start);
  let depth = 0;

  for (let i = openBrace; i < css.length; i += 1) {
    if (css[i] === "{") {
      depth += 1;
    } else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        return css.slice(openBrace + 1, i);
      }
    }
  }

  return null;
}

function findRootChipAlphaRule(css) {
  const match = css.match(/\.root-chip-alpha\s*\{([^}]+)\}/);
  return match ? match[1] : null;
}

const DARK_ROOT_TOKENS = [
  { name: "--bg-canvas", hex: "#11100f" },
  { name: "--text-primary", hex: "#fbfaf9" },
  { name: "--text-secondary", hex: "#a9a7a5" },
  { name: "--text-tertiary", hex: "#94928f" },
  { name: "--text-disabled", hex: "#858380" },
  { name: "--border-hairline", hex: "#32302e" },
  { name: "--page-selection", hex: "#18264c" },
  { name: "--root-title", hex: "#656360" },
  { name: "--root-disabled", hex: "#32302e" },
];

const LIGHT_ROOT_TOKENS = [
  { name: "--bg-canvas", hex: "#fbfaf9" },
  { name: "--text-primary", hex: "#262524" },
  { name: "--page-selection", hex: "#d8e5ff" },
];

test("disabled nav strike is fully drawn and not animated", () => {
  const css = readSource(globalsCssPath);
  const disabledStrikeRule = findDisabledNavStrikeRule(css);

  assert.ok(
    disabledStrikeRule,
    "globals.css must include a disabled root-nav strike rule for [data-underline-stroke]",
  );

  assert.match(
    disabledStrikeRule.body,
    /stroke-dashoffset:\s*0\b/,
    "disabled nav strike must set stroke-dashoffset: 0 so the line is fully drawn",
  );
  assert.match(
    disabledStrikeRule.body,
    /transition:\s*none\b/,
    "disabled nav strike must not animate (transition: none)",
  );
});

test("root index redirects to colors, not purpose", () => {
  const source = readSource(rootIndexPath);

  assert.match(
    source,
    /redirect\s*\(\s*["']\/root\/colors["']\s*\)/,
    "app/root/page.tsx must redirect to /root/colors",
  );
  assert.doesNotMatch(
    source,
    /redirect\s*\(\s*["']\/root\/purpose["']\s*\)/,
    "app/root/page.tsx must not redirect to /root/purpose",
  );
});

test("pulse page redirects to colors, not purpose", () => {
  const source = readSource(pulsePagePath);

  assert.match(
    source,
    /redirect\s*\(\s*["']\/root\/colors["']\s*\)/,
    "app/pulse/page.tsx must redirect to /root/colors",
  );
  assert.doesNotMatch(
    source,
    /redirect\s*\(\s*["']\/root\/purpose["']\s*\)/,
    "app/pulse/page.tsx must not redirect to /root/purpose",
  );
});

test("root mark links to root or colors, not purpose", () => {
  const source = readSource(rootMarkPath);

  assert.doesNotMatch(
    source,
    /href=["']\/root\/purpose["']/,
    "root-mark must not link to /root/purpose",
  );
  assert.ok(
    /href=["']\/root["']/.test(source) || /href=["']\/root\/colors["']/.test(source),
    "root-mark href must be /root or /root/colors",
  );
});

test("globals.css defines dark mode tokens inside prefers-color-scheme media query", () => {
  const css = readSource(globalsCssPath);
  const darkBlock = findDarkModeBlock(css);

  assert.ok(
    darkBlock,
    "globals.css must include @media (prefers-color-scheme: dark)",
  );

  for (const token of DARK_ROOT_TOKENS) {
    const pattern = new RegExp(`${token.name}:\\s*${token.hex}\\b`, "i");
    assert.match(
      darkBlock,
      pattern,
      `dark mode block must remap ${token.name} to ${token.hex}`,
    );
  }
});

test("globals.css keeps light :root tokens outside dark media query", () => {
  const css = readSource(globalsCssPath);
  const rootBlock = findRootBlock(css);
  const darkBlock = findDarkModeBlock(css);

  assert.ok(rootBlock, "globals.css must define a :root token block");

  for (const token of LIGHT_ROOT_TOKENS) {
    const pattern = new RegExp(`${token.name}:\\s*${token.hex}\\b`, "i");
    assert.match(
      rootBlock,
      pattern,
      `:root must keep light value for ${token.name} (${token.hex})`,
    );
  }

  assert.ok(
    darkBlock,
    "globals.css must include @media (prefers-color-scheme: dark) for dark remaps",
  );

  for (const token of DARK_ROOT_TOKENS) {
    const pattern = new RegExp(`${token.name}:\\s*${token.hex}\\b`, "i");
    assert.doesNotMatch(
      rootBlock,
      pattern,
      `:root must not use dark value ${token.hex} for ${token.name}; remap it in the dark media query`,
    );
  }
});

test("globals.css sets color-scheme light dark on html", () => {
  const css = readSource(globalsCssPath);

  assert.match(
    css,
    /(?:html|html,\s*body)\s*\{[\s\S]*?color-scheme:\s*light\s+dark\b/,
    "globals.css must set color-scheme: light dark on html (or html, body)",
  );
});

test("root-chip-alpha checkerboard uses token vars, not hardcoded light hex", () => {
  const css = readSource(globalsCssPath);
  const rule = findRootChipAlphaRule(css);

  assert.ok(rule, "globals.css must define .root-chip-alpha");

  assert.doesNotMatch(
    rule,
    /#eae7e5\b/i,
    ".root-chip-alpha must not hardcode light checkerboard hex #eae7e5",
  );
  assert.doesNotMatch(
    rule,
    /#fbfaf9\b/i,
    ".root-chip-alpha must not hardcode light checkerboard hex #fbfaf9",
  );
  assert.match(
    rule,
    /var\(--[\w-]+\)/,
    ".root-chip-alpha checkerboard must use CSS variables so it follows the mode",
  );
});

test("colors page says the site follows system mode, not light-only chrome", () => {
  const source = readSource(colorsPagePath);

  assert.doesNotMatch(
    source,
    /Dark is for native apps/i,
    "colors-page must not say dark is only for native apps",
  );
  assert.doesNotMatch(
    source,
    /not for this chrome/i,
    "colors-page must not say this chrome is light-only",
  );
  assert.match(
    source,
    /follows the system|system (?:color )?mode|prefers-color-scheme|matching aliases for the current system mode/i,
    "colors-page must explain that the site follows the system (or uses matching aliases for the current system mode)",
  );
});
