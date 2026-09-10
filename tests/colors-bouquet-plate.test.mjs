import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const globalsCssPath = path.join(root, "app", "globals.css");
const colorsPagePath = path.join(root, "components", "root", "colors-page.tsx");
const pulsePagePath = path.join(root, "components", "root", "pulse-page.tsx");
const pulseFieldPath = path.join(root, "components", "root", "pulse-field.tsx");

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function extractPaintPlateBody(source) {
  const match = source.match(/function paintPlate\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/);
  return match ? match[1] : null;
}

function extractPaintPlateWetBranch(body) {
  if (!body) {
    return null;
  }
  const match = body.match(/if\s*\(\s*wet\s*\)\s*\{([\s\S]*?)\}\s*else\s*\{/);
  return match ? match[1] : null;
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

test("paintPlate wet path fills paper first then uses source-over (not multiply)", () => {
  const source = readSource(pulseFieldPath);
  const body = extractPaintPlateBody(source);

  assert.ok(body, "pulse-field must define paintPlate");
  assert.match(
    body,
    /fillStyle\s*=\s*PAPER[\s\S]*fillRect/,
    "paintPlate must fill paper before painting the plate image",
  );

  const wetBranch = extractPaintPlateWetBranch(body);
  assert.ok(wetBranch, "paintPlate must branch on wet mode");
  assert.doesNotMatch(
    wetBranch,
    /globalCompositeOperation\s*=\s*["']multiply["']/,
    "paintPlate wet path must not use multiply composite",
  );
  assert.match(
    wetBranch,
    /globalCompositeOperation\s*=\s*["']source-over["']/,
    "paintPlate wet path must use source-over composite",
  );
});

test("paintPlate wet path uses large blur, not width / 110", () => {
  const source = readSource(pulseFieldPath);
  const body = extractPaintPlateBody(source);
  const wetBranch = extractPaintPlateWetBranch(body);

  assert.ok(wetBranch, "paintPlate must branch on wet mode");
  assert.match(
    wetBranch,
    /width\s*\/\s*1[4-8]\b/,
    "paintPlate wet blur must use width / 14, /16, or /18 (large bloom)",
  );
  assert.doesNotMatch(
    wetBranch,
    /width\s*\/\s*110\b/,
    "paintPlate wet path must not use the old width / 110 blur",
  );
});

test("paintPlate wet path uses low-coverage globalAlpha for main wash", () => {
  const source = readSource(pulseFieldPath);
  const body = extractPaintPlateBody(source);
  const wetBranch = extractPaintPlateWetBranch(body);

  assert.ok(wetBranch, "paintPlate must branch on wet mode");
  assert.match(
    wetBranch,
    /globalAlpha\s*=\s*(?:0\.(?:25|28|3(?:0|2|5))|0\.35)\b/,
    "paintPlate wet wash must use globalAlpha in 0.25–0.35 range",
  );
});

test("paintPlate wet path draws a second fainter bloom drawImage", () => {
  const source = readSource(pulseFieldPath);
  const body = extractPaintPlateBody(source);

  assert.ok(body, "pulse-field must define paintPlate");
  const drawImageCount = (body.match(/\bdrawImage\b/g) ?? []).length;
  assert.ok(
    drawImageCount >= 2,
    `paintPlate must call drawImage at least twice for main wash + bloom (got ${drawImageCount})`,
  );
});

test("pulse-field brush radius uses map.width * 0.12", () => {
  const source = readSource(pulseFieldPath);

  assert.match(
    source,
    /map\.width\s*\*\s*0\.12\b/,
    "brushRadius must use map.width * 0.12",
  );
  assert.doesNotMatch(
    source,
    /map\.width\s*\*\s*0\.08\b/,
    "brushRadius must not use the old map.width * 0.08",
  );
});

test("writeWetnessMask calls wetMaskAlpha instead of inline Math.pow(wetness, 0.62)", () => {
  const source = readSource(pulseFieldPath);
  const match = source.match(
    /function writeWetnessMask\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/,
  );

  assert.ok(match, "pulse-field must define writeWetnessMask");
  const body = match[1];
  assert.match(
    body,
    /wetMaskAlpha\s*\(/,
    "writeWetnessMask must call wetMaskAlpha",
  );
  assert.doesNotMatch(
    body,
    /Math\.pow\s*\(\s*wetness\s*,\s*0\.62\s*\)/,
    "writeWetnessMask must not inline Math.pow(wetness, 0.62)",
  );
});
