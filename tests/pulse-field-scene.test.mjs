import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const fieldScenePath = path.join(root, "lib", "pulse-field-scene.ts");
const colorsMeadowPath = path.join(root, "lib", "scenes", "colors-meadow.ts");

const EXPECTED_ILLUST_INKS = [
  "illust-indigo",
  "illust-ember",
  "illust-teal",
  "illust-moss",
  "illust-indigo-wash",
  "illust-ember-wash",
  "illust-teal-wash",
  "illust-moss-wash",
];

const EXPECTED_PLOT_INKS = ["plot-paper", "plot-moment"];

const REQUIRED_MEADOW_INKS = [
  "illust-moss",
  "illust-moss-wash",
  "illust-teal",
  "illust-teal-wash",
  "illust-indigo",
  "illust-indigo-wash",
  "illust-ember",
  "illust-ember-wash",
  "plot-moment",
];

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function callFieldScene(script) {
  const moduleUrl = pathToFileURL(fieldScenePath).href;
  const fullScript = `
    import * as fieldScene from ${JSON.stringify(moduleUrl)};
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

function callColorsMeadow(script) {
  const moduleUrl = pathToFileURL(colorsMeadowPath).href;
  const fullScript = `
    import { COLORS_MEADOW } from ${JSON.stringify(moduleUrl)};
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

test("lib/pulse-field-scene.ts exists", () => {
  assert.ok(fs.existsSync(fieldScenePath), "lib/pulse-field-scene.ts must exist");
});

test("lib/scenes/colors-meadow.ts exists", () => {
  assert.ok(
    fs.existsSync(colorsMeadowPath),
    "lib/scenes/colors-meadow.ts must exist",
  );
});

test("FIELD_INKS includes all eight illust tokens plus plot-paper and plot-moment", () => {
  const result = callFieldScene(`
    console.log(JSON.stringify({
      inks: fieldScene.FIELD_INKS,
    }));
  `);

  assert.ok(result.ok, `FIELD_INKS must be importable: ${result.error ?? ""}`);

  const inks = result.value.inks;
  for (const token of [...EXPECTED_ILLUST_INKS, ...EXPECTED_PLOT_INKS]) {
    assert.ok(
      inks.includes(token),
      `FIELD_INKS must include "${token}"`,
    );
  }
});

test('isFieldInk("plot-subject") is false', () => {
  const result = callFieldScene(`
    console.log(JSON.stringify(fieldScene.isFieldInk("plot-subject")));
  `);

  assert.ok(result.ok, `isFieldInk must be callable: ${result.error ?? ""}`);
  assert.equal(result.value, false);
});

test('isFieldInk("illust-moss") is true', () => {
  const result = callFieldScene(`
    console.log(JSON.stringify(fieldScene.isFieldInk("illust-moss")));
  `);

  assert.ok(result.ok, `isFieldInk must be callable: ${result.error ?? ""}`);
  assert.equal(result.value, true);
});

test("COLORS_MEADOW is 720x360 with air in [0.22, 0.35]", () => {
  const result = callColorsMeadow(`
    console.log(JSON.stringify({
      width: COLORS_MEADOW.width,
      height: COLORS_MEADOW.height,
      air: COLORS_MEADOW.air,
      id: COLORS_MEADOW.id,
    }));
  `);

  assert.ok(result.ok, `COLORS_MEADOW must be importable: ${result.error ?? ""}`);
  assert.equal(result.value.width, 720);
  assert.equal(result.value.height, 360);
  assert.equal(typeof result.value.id, "string");
  assert.ok(
    result.value.air >= 0.22 && result.value.air <= 0.35,
    `air must be in [0.22, 0.35] (got ${result.value.air})`,
  );
});

test("every COLORS_MEADOW layer ink is a FIELD_INK", () => {
  const result = callColorsMeadow(`
    import * as fieldScene from ${JSON.stringify(pathToFileURL(fieldScenePath).href)};
    const bad = COLORS_MEADOW.layers
      .filter((layer) => !fieldScene.isFieldInk(layer.ink))
      .map((layer) => layer.ink);
    console.log(JSON.stringify({ bad }));
  `);

  assert.ok(result.ok, `COLORS_MEADOW layers must be readable: ${result.error ?? ""}`);
  assert.deepEqual(
    result.value.bad,
    [],
    `every layer ink must pass isFieldInk (invalid: ${result.value.bad.join(", ")})`,
  );
});

test("COLORS_MEADOW uses required meadow inks", () => {
  const result = callColorsMeadow(`
    const used = new Set(COLORS_MEADOW.layers.map((layer) => layer.ink));
    const missing = ${JSON.stringify(REQUIRED_MEADOW_INKS)}.filter((ink) => !used.has(ink));
    console.log(JSON.stringify({ missing }));
  `);

  assert.ok(result.ok, `COLORS_MEADOW layers must be readable: ${result.error ?? ""}`);
  assert.deepEqual(
    result.value.missing,
    [],
    `COLORS_MEADOW must use required inks (missing: ${result.value.missing.join(", ")})`,
  );
});

test("COLORS_MEADOW does not use plot-subject", () => {
  const result = callColorsMeadow(`
    const hasPlotSubject = COLORS_MEADOW.layers.some((layer) => layer.ink === "plot-subject");
    console.log(JSON.stringify({ hasPlotSubject }));
  `);

  assert.ok(result.ok, `COLORS_MEADOW layers must be readable: ${result.error ?? ""}`);
  assert.equal(result.value.hasPlotSubject, false);
});

test("lib/pulse-field-scene.ts exports FIELD_INKS and isFieldInk", () => {
  const source = readSource(fieldScenePath);

  assert.match(source, /export const FIELD_INKS\s*=/);
  assert.match(source, /export function isFieldInk\s*\(/);
});

test("lib/scenes/colors-meadow.ts exports COLORS_MEADOW", () => {
  const source = readSource(colorsMeadowPath);

  assert.match(source, /export const COLORS_MEADOW\s*=/);
});
