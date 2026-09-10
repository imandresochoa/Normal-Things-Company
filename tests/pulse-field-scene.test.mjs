import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const fieldScenePath = path.join(root, "lib", "pulse-field-scene.ts");
const colorsMeadowPath = path.join(root, "lib", "scenes", "colors-meadow.ts");
const pulseFieldPath = path.join(root, "components", "root", "pulse-field.tsx");
const plateJpegPath = path.join(root, "public", "root", "colors-bouquet.jpg");

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

test("PulseFieldScene supports optional plate URL", () => {
  const source = readSource(fieldScenePath);

  assert.match(
    source,
    /plate\??:\s*string/,
    "PulseFieldScene must declare optional plate?: string",
  );
});

test("COLORS_MEADOW is 720x405 with air in [0.22, 0.35]", () => {
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
  assert.equal(result.value.height, 405);
  assert.equal(typeof result.value.id, "string");
  assert.ok(
    result.value.air >= 0.22 && result.value.air <= 0.35,
    `air must be in [0.22, 0.35] (got ${result.value.air})`,
  );
});

test('COLORS_MEADOW.plate is "/root/colors-bouquet.jpg"', () => {
  const result = callColorsMeadow(`
    console.log(JSON.stringify({ plate: COLORS_MEADOW.plate }));
  `);

  assert.ok(result.ok, `COLORS_MEADOW must be importable: ${result.error ?? ""}`);
  assert.equal(result.value.plate, "/root/colors-bouquet.jpg");
});

test("public/root/colors-bouquet.jpg exists for the Colors header plate", () => {
  assert.ok(
    fs.existsSync(plateJpegPath),
    "public/root/colors-bouquet.jpg must exist (added in Green)",
  );
});

test("plate scenes may use empty layers; existing layers must still be FIELD_INKs", () => {
  const result = callColorsMeadow(`
    import * as fieldScene from ${JSON.stringify(pathToFileURL(fieldScenePath).href)};
    const hasPlate = Boolean(COLORS_MEADOW.plate);
    const bad = COLORS_MEADOW.layers
      .filter((layer) => !fieldScene.isFieldInk(layer.ink))
      .map((layer) => layer.ink);
    const hasPlotSubject = COLORS_MEADOW.layers.some(
      (layer) => layer.ink === "plot-subject",
    );
    console.log(JSON.stringify({
      hasPlate,
      layerCount: COLORS_MEADOW.layers.length,
      bad,
      hasPlotSubject,
    }));
  `);

  assert.ok(result.ok, `COLORS_MEADOW layers must be readable: ${result.error ?? ""}`);
  assert.equal(
    result.value.bad.length,
    0,
    `every layer ink must pass isFieldInk (invalid: ${result.value.bad.join(", ")})`,
  );
  assert.equal(result.value.hasPlotSubject, false);
  if (result.value.hasPlate) {
    assert.ok(
      result.value.layerCount >= 0,
      "plate scenes may use empty layers",
    );
  }
});

test("pulse-field.tsx loads scene.plate with Image and drawImage", () => {
  const source = readSource(pulseFieldPath);

  assert.match(
    source,
    /scene\.plate/,
    "pulse-field must reference scene.plate",
  );
  assert.match(
    source,
    /\bnew\s+Image\s*\(/,
    "pulse-field must load the plate with new Image()",
  );
  assert.match(
    source,
    /drawImage/,
    "pulse-field must paint the plate with drawImage",
  );
});

test("pulse-field does not clip plate painting with scene.air (air skip is mark-layer only)", () => {
  const source = readSource(pulseFieldPath);

  assert.match(
    source,
    /scene\.plate/,
    "pulse-field must implement plate painting",
  );

  const airSkipInMarkLoop = /for\s*\(\s*const mark of scene\.layers\s*\)\s*\{[\s\S]*?mark\.y\s*<\s*scene\.air/;
  assert.match(
    source,
    airSkipInMarkLoop,
    "scene.air skip must live inside the mark layer loop",
  );

  const plateBranch = source.match(
    /if\s*\(\s*scene\.plate\s*\)\s*\{([\s\S]*?)\n\s*\}/,
  );
  assert.ok(
    plateBranch,
    "pulse-field must branch on scene.plate before or outside mark air clipping",
  );
  assert.doesNotMatch(
    plateBranch[1],
    /scene\.air/,
    "plate painting must not be gated by scene.air",
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
