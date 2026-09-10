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

test("pulse-page distinguishes Colors plate live GPU wash from mark-field wetness map", () => {
  const source = readSource(pulsePagePath);

  assert.match(
    source,
    /(?:WebGL|GPU)[\s\S]{0,160}(?:plate|Colors|watercolor)|(?:plate|Colors|watercolor)[\s\S]{0,160}(?:WebGL|GPU)/i,
    "pulse-page must describe the Colors plate as a live GPU watercolor wash",
  );
  assert.match(
    source,
    /wetness map/i,
    "pulse-page may still document wetness-map Fields for mark demos",
  );
  assert.doesNotMatch(
    source,
    /Colors[\s\S]{0,200}20 seconds[\s\S]{0,200}wetness map/i,
    "pulse-page must not describe the Colors plate as a 20-second wetness-map soak",
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
