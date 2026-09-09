import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const colorsPagePath = path.join(root, "components", "root", "colors-page.tsx");
const pulsePagePath = path.join(root, "components", "root", "pulse-page.tsx");
const pulseTokensPath = path.join(root, "lib", "pulse-tokens.ts");

const CHART_FAMILY_LABELS = ["Indigo", "Ember", "Teal", "Moss"];
const REQUIRED_PULSE_ALIASES = ["series-1", "illust-indigo"];

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("colors page documents Chart family inks Indigo, Ember, Teal, and Moss", () => {
  const source = readSource(colorsPagePath);

  for (const label of CHART_FAMILY_LABELS) {
    assert.match(
      source,
      new RegExp(`\\b${label}\\b`),
      `colors-page must document the Chart family ink "${label}"`,
    );
  }
});

test("colors page shows Pulse semantic aliases from pulse-tokens", () => {
  const colorsSource = readSource(colorsPagePath);
  const pulseTokensSource = readSource(pulseTokensPath);

  assert.match(
    colorsSource,
    /@\/lib\/pulse-tokens|from\s+["']@\/lib\/pulse-tokens["']/,
    "colors-page must import Pulse semantic aliases from lib/pulse-tokens.ts",
  );

  for (const alias of REQUIRED_PULSE_ALIASES) {
    assert.match(
      pulseTokensSource,
      new RegExp(`["']${alias}["']`),
      `lib/pulse-tokens.ts must define alias "${alias}"`,
    );
    assert.match(
      colorsSource,
      new RegExp(alias),
      `colors-page must show Pulse semantic alias "${alias}"`,
    );
  }
});

test("colors page does not defer Chart family inks to the Pulse page", () => {
  const source = readSource(colorsPagePath);

  assert.doesNotMatch(
    source,
    /Chart family lives on Pulse/i,
    'colors-page must not say the Chart family "lives on Pulse"',
  );
});

test("pulse page does not own Chart family ramps or Pulse palettes heading", () => {
  const source = readSource(pulsePagePath);

  assert.doesNotMatch(
    source,
    /<h2>Pulse palettes<\/h2>/,
    'pulse-page must not render a "Pulse palettes" section heading',
  );
  assert.doesNotMatch(
    source,
    /function ChartRamp\s*\(/,
    "pulse-page must not define ChartRamp for Chart family ramps",
  );
  assert.doesNotMatch(
    source,
    /<ChartRamp\b/,
    "pulse-page must not render ChartRamp components",
  );
  assert.doesNotMatch(
    source,
    /chartFamilySteps\s*\(/,
    "pulse-page must not render Chart family step ramps",
  );
});
