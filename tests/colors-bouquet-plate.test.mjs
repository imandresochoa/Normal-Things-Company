import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const globalsCssPath = path.join(root, "app", "globals.css");
const colorsPagePath = path.join(root, "components", "root", "colors-page.tsx");
const pulsePagePath = path.join(root, "components", "root", "pulse-page.tsx");

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function findRootDocPlatePulseFieldRule(css) {
  const match = css.match(
    /\.root-doc-plate\s+\.root-pulse-field\s*\{([^}]+)\}/,
  );
  return match ? match[1] : null;
}

test(".root-doc-plate .root-pulse-field uses aspect-ratio 16/9 and height auto", () => {
  const css = readSource(globalsCssPath);
  const rule = findRootDocPlatePulseFieldRule(css);

  assert.ok(
    rule,
    "globals.css must define .root-doc-plate .root-pulse-field",
  );
  assert.match(
    rule,
    /aspect-ratio:\s*16\s*\/\s*9\b/,
    ".root-doc-plate .root-pulse-field must set aspect-ratio: 16 / 9",
  );
  assert.match(
    rule,
    /height:\s*auto\b/,
    ".root-doc-plate .root-pulse-field must set height: auto",
  );
});

test(".root-pulse-field-demo height stays 176px (header plate CSS must not change demo fields)", () => {
  const css = readSource(globalsCssPath);
  const match = css.match(/\.root-pulse-field-demo\s*\{([^}]+)\}/);

  assert.ok(match, "globals.css must define .root-pulse-field-demo");
  assert.match(
    match[1],
    /height:\s*176px\b/,
    ".root-pulse-field-demo must keep height: 176px",
  );
});

test("colors-page PulseField label describes the wildflower watercolor plate", () => {
  const source = readSource(colorsPagePath);

  assert.doesNotMatch(
    source,
    /label="Meadow painted in Pulse inks"/,
    "colors-page must not use the old meadow-ink aria label",
  );
  assert.match(
    source,
    /label="[^"]*(?:wildflower|watercolor|poppy|hills)[^"]*"/i,
    "colors-page PulseField label must describe the wildflower watercolor plate",
  );
});

test("pulse-page Field copy describes the Colors watercolor plate and water still works", () => {
  const source = readSource(pulsePagePath);

  assert.doesNotMatch(
    source,
    /No sky\. No distant mountains\./,
    "pulse-page must not forbid sky or mountains for the Colors watercolor plate",
  );
  assert.match(
    source,
    /Colors[\s\S]{0,120}watercolor|watercolor[\s\S]{0,120}Colors/i,
    "pulse-page must describe the Colors plate as a watercolor",
  );
  assert.match(
    source,
    /water[\s\S]{0,80}(?:still|answers|pointer)/i,
    "pulse-page must say water still answers the pointer on the Field",
  );
});
