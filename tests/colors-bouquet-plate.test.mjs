import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const globalsCssPath = path.join(root, "app", "globals.css");
const colorsPagePath = path.join(root, "components", "root", "colors-page.tsx");
const pulseFieldPath = path.join(root, "components", "root", "pulse-field.tsx");

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function findRootDocPlatePulseFieldRule(css) {
  const match = css.match(
    /\.root-doc-plate\s+\.root-pulse-field\s*\{([^}]+)\}/,
  );
  return match ? match[1] : null;
}

function extractPlateEffectBody(source) {
  const useEffectMatch = source.match(
    /useEffect\s*\(\s*\(\)\s*=>\s*\{([\s\S]*?)\n\s*\},\s*\[scene\]\s*\)/,
  );
  if (!useEffectMatch) {
    return null;
  }
  const plateMatch = useEffectMatch[1].match(
    /if\s*\(\s*scene\.plate\s*\)\s*\{([\s\S]*?)\n\s*\}\s*else\s*\{/,
  );
  return plateMatch ? plateMatch[1] : null;
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

test("globals.css must not define Pulse-page-only .root-pulse-field-demo", () => {
  const css = readSource(globalsCssPath);

  assert.doesNotMatch(
    css,
    /\.root-pulse-field-demo\s*\{/,
    "globals.css must not define .root-pulse-field-demo (Pulse section demo CSS removed)",
  );
});

const PULSE_PAGE_ONLY_CSS_CLASSES = [
  ".root-pulse-substrate",
  ".root-pulse-defs",
  ".root-pulse-figure",
  ".root-pulse-plate",
  ".root-pulse-plot",
  ".root-pulse-bar-labels",
  ".root-pulse-wash-plate",
  ".root-pulse-diverging",
  ".root-pulse-overprint",
];

test("globals.css must not define Pulse-page-only plate and wash rules", () => {
  const css = readSource(globalsCssPath);

  for (const selector of PULSE_PAGE_ONLY_CSS_CLASSES) {
    const escaped = selector.replace(/\./g, "\\.");
    assert.doesNotMatch(
      css,
      new RegExp(`${escaped}\\s*\\{`),
      `globals.css must not define ${selector} (Pulse section CSS removed)`,
    );
  }
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

test("pulse-field imports watercolor-meadow-live for plate scenes", () => {
  const source = readSource(pulseFieldPath);

  assert.match(
    source,
    /from\s+["']@\/lib\/watercolor-meadow-live["']/,
    "pulse-field must import the live watercolor engine module",
  );
  assert.match(
    source,
    /mountWatercolorMeadowLive/,
    "pulse-field must mount the live watercolor engine for plate scenes",
  );
});

test("pulse-field plate path boots WebGL watercolor instead of paintPlate soak", () => {
  const source = readSource(pulseFieldPath);
  const plateEffectBody = extractPlateEffectBody(source);
  const paintScenePlate = source.match(
    /if\s*\(\s*scene\.plate\s*\)\s*\{([\s\S]*?)\n\s*return;/,
  );

  assert.ok(
    plateEffectBody,
    "pulse-field must branch on scene.plate in the plate effect",
  );
  assert.match(
    plateEffectBody,
    /mountWatercolorMeadowLive|watercolor-meadow-live/,
    "scene.plate effect must boot the live WebGL engine",
  );
  assert.doesNotMatch(
    plateEffectBody,
    /accumulateWetness\s*\(/,
    "scene.plate effect must not use the mark-demo wetness map",
  );

  assert.ok(paintScenePlate, "paintScene must handle scene.plate");
  assert.doesNotMatch(
    paintScenePlate[1],
    /paintPlate\s*\(/,
    "paintScene must not route scene.plate through 2D paintPlate soak",
  );
  assert.doesNotMatch(
    source,
    /function paintPlate[\s\S]*filter\s*=\s*`blur/,
    "pulse-field must not keep paintPlate wet JPEG blur for Colors water",
  );
});

test("pulse-field mark demo still uses wetness map when scene.plate is absent", () => {
  const source = readSource(pulseFieldPath);

  assert.match(
    source,
    /accumulateWetness\s*\(/,
    "mark-demo Fields without scene.plate must still accumulate wetness",
  );
  assert.match(
    source,
    /createWetnessMap\s*\(/,
    "mark-demo Fields without scene.plate must still use a wetness map",
  );
});

test("public/root/colors-bouquet.jpg exists for the Colors header plate", () => {
  const plateJpegPath = path.join(root, "public", "root", "colors-bouquet.jpg");
  assert.ok(
    fs.existsSync(plateJpegPath),
    "public/root/colors-bouquet.jpg must exist",
  );
});
