import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDocHeaderPath = path.join(
  root,
  "components",
  "root",
  "root-doc-header.tsx",
);
const colorsPagePath = path.join(root, "components", "root", "colors-page.tsx");
const pulsePagePath = path.join(root, "components", "root", "pulse-page.tsx");
const pulsePlatesPath = path.join(root, "components", "root", "pulse-plates.tsx");
const pulseWashPath = path.join(root, "lib", "scenes", "pulse-wash.ts");
const typographyPagePath = path.join(
  root,
  "components",
  "root",
  "typography-page.tsx",
);
const spacingPagePath = path.join(root, "components", "root", "spacing-page.tsx");
const globalsCssPath = path.join(root, "app", "globals.css");

const READY_PAGES = [
  { label: "colors", path: colorsPagePath, title: "Colors", hasPlate: true },
  {
    label: "typography",
    path: typographyPagePath,
    title: "Typography",
    hasPlate: false,
  },
  { label: "spacing", path: spacingPagePath, title: "Spacing", hasPlate: false },
];

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function extractLegacyHeaderBlock(source) {
  const match = source.match(
    /<header className="root-doc-header">([\s\S]*?)<\/header>/,
  );
  return match ? match[1] : null;
}

function extractRootDocHeaderUsage(source) {
  const match = source.match(/<RootDocHeader[\s\S]*?(?:\/>|<\/RootDocHeader>)/);
  return match ? match[0] : null;
}

function findRootDocPlateRule(css) {
  const match = css.match(/\.root-doc-plate\s*\{([^}]+)\}/);
  return match ? match[1] : null;
}

function findRootDocPlatePulseFieldRule(css) {
  const match = css.match(
    /\.root-doc-plate\s+\.root-pulse-field\s*\{([^}]+)\}/,
  );
  return match ? match[1] : null;
}

test("RootDocHeader source exists and renders h1 then optional root-doc-plate then children inside root-doc-header", () => {
  assert.ok(
    fs.existsSync(rootDocHeaderPath),
    "components/root/root-doc-header.tsx must exist",
  );

  const source = readSource(rootDocHeaderPath);

  assert.match(
    source,
    /export\s+(?:function\s+RootDocHeader|const\s+RootDocHeader)/,
    "root-doc-header.tsx must export RootDocHeader",
  );
  assert.match(
    source,
    /className=["']root-doc-header["']/,
    "RootDocHeader must render a header with class root-doc-header",
  );
  assert.match(
    source,
    /<h1>\s*\{title\}\s*<\/h1>/,
    "RootDocHeader must render the title in an h1",
  );
  assert.match(
    source,
    /root-doc-plate/,
    "RootDocHeader must wrap an optional plate in root-doc-plate",
  );
  assert.match(
    source,
    /\{children\}/,
    "RootDocHeader must render lede children after the optional plate",
  );

  const h1Index = source.indexOf("<h1>");
  const plateIndex = source.indexOf("root-doc-plate");
  const childrenIndex = source.indexOf("{children}");

  assert.ok(h1Index !== -1, "RootDocHeader must include an h1");
  assert.ok(plateIndex !== -1, "RootDocHeader must reference root-doc-plate");
  assert.ok(childrenIndex !== -1, "RootDocHeader must render children");
  assert.ok(
    h1Index < plateIndex && plateIndex < childrenIndex,
    "RootDocHeader render order must be h1, optional root-doc-plate, then children",
  );

  assert.match(
    source,
    /(?:plate\s*&&|plate\s*\?|\bif\s*\(\s*plate\s*\))/,
    "RootDocHeader must only render the plate wrapper when plate is present",
  );
});

for (const page of READY_PAGES) {
  test(`${page.label} page imports and renders RootDocHeader`, () => {
    const source = readSource(page.path);

    assert.match(
      source,
      /import\s*\{[^}]*\bRootDocHeader\b[^}]*\}\s*from\s*["'][^"']*root-doc-header["']/,
      `${page.label}-page must import RootDocHeader from root-doc-header`,
    );
    assert.match(
      source,
      new RegExp(`<RootDocHeader[\\s\\S]*title=["']${page.title}["']`),
      `${page.label}-page must render RootDocHeader with title "${page.title}"`,
    );
  });
}

test("colors page passes COLORS_MEADOW PulseField as the header plate before lede children", () => {
  const source = readSource(colorsPagePath);
  const usage = extractRootDocHeaderUsage(source);

  assert.ok(
    usage,
    "colors-page must render RootDocHeader instead of a hand-rolled header",
  );
  assert.match(
    usage,
    /\bplate\s*=\s*\{/,
    "colors-page must pass a plate prop to RootDocHeader",
  );
  assert.match(
    usage,
    /PulseField/,
    "colors-page plate must render PulseField",
  );
  assert.match(
    usage,
    /COLORS_MEADOW/,
    "colors-page plate must use the COLORS_MEADOW scene",
  );

  const plateIndex = usage.search(/\bplate\s*=/);
  const ledeIndex = usage.search(/root-doc-lede/);

  assert.ok(
    plateIndex !== -1 && ledeIndex !== -1 && plateIndex < ledeIndex,
    "colors-page must pass the plate prop before lede children inside RootDocHeader",
  );
  assert.doesNotMatch(
    usage,
    /root-doc-lede[\s\S]*PulseField/,
    "colors-page must not place PulseField after lede paragraphs in the header",
  );
});

test("colors page keeps Seeds as the first section after the header", () => {
  const source = readSource(colorsPagePath);

  assert.match(
    source,
    /<RootDocHeader[\s\S]*<\/RootDocHeader>[\s\S]*<section className="root-doc-section">\s*<h2>Seeds<\/h2>/,
    "colors-page first section after RootDocHeader must remain Seeds",
  );
});

for (const page of READY_PAGES.filter((entry) => !entry.hasPlate)) {
  test(`${page.label} page does not pass a header plate to RootDocHeader`, () => {
    const source = readSource(page.path);
    const usage = extractRootDocHeaderUsage(source);

    assert.ok(
      usage,
      `${page.label}-page must render RootDocHeader`,
    );
    assert.doesNotMatch(
      usage,
      /\bplate\s*=/,
      `${page.label}-page must not pass plate= to RootDocHeader`,
    );
  });
}

test("Pulse section page file must not exist", () => {
  assert.ok(
    !fs.existsSync(pulsePagePath),
    "components/root/pulse-page.tsx must be deleted (Pulse section removed from Root docs)",
  );
});

test("Pulse section plate and wash scene files must not exist", () => {
  assert.ok(
    !fs.existsSync(pulsePlatesPath),
    "components/root/pulse-plates.tsx must be deleted (Pulse section removed from Root docs)",
  );
  assert.ok(
    !fs.existsSync(pulseWashPath),
    "lib/scenes/pulse-wash.ts must be deleted (Pulse section removed from Root docs)",
  );
});

test("colors header order is title then plate then lede, not lede then PulseField", () => {
  const source = readSource(colorsPagePath);
  const usage = extractRootDocHeaderUsage(source);

  if (usage) {
    const plateIndex = usage.search(/\bplate\s*=/);
    const ledeIndex = usage.search(/root-doc-lede/);
    assert.ok(
      plateIndex !== -1 &&
        ledeIndex !== -1 &&
        plateIndex < ledeIndex,
      "colors-page header must place the plate before lede paragraphs",
    );
    return;
  }

  const header = extractLegacyHeaderBlock(source);
  assert.ok(header, "colors-page must define a root-doc-header block");

  const ledeIndex = header.search(/root-doc-lede/);
  const fieldIndex = header.search(/PulseField/);

  assert.ok(ledeIndex !== -1, "colors-page header must include lede paragraphs");
  assert.ok(fieldIndex !== -1, "colors-page header must include PulseField");
  assert.ok(
    fieldIndex < ledeIndex,
    "colors-page header order must be title, PulseField plate, then lede — not lede then PulseField",
  );
});

test("globals.css defines root-doc-plate with a space token and zeros nested pulse field margin-top", () => {
  const css = readSource(globalsCssPath);
  const plateRule = findRootDocPlateRule(css);
  const nestedFieldRule = findRootDocPlatePulseFieldRule(css);

  assert.ok(
    plateRule,
    "globals.css must define .root-doc-plate for the header illustration slot",
  );
  assert.match(
    plateRule,
    /var\(--space-(?:related|grouped)\)/,
    ".root-doc-plate must use var(--space-related) or var(--space-grouped) for vertical rhythm",
  );

  assert.ok(
    nestedFieldRule,
    "globals.css must define .root-doc-plate .root-pulse-field",
  );
  assert.match(
    nestedFieldRule,
    /margin-top:\s*0\b/,
    ".root-doc-plate .root-pulse-field must zero margin-top so the wrapper owns rhythm",
  );
});
