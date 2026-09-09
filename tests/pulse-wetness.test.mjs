import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const wetnessPath = path.join(root, "lib", "pulse-wetness.ts");

const MAP_WIDTH = 32;
const MAP_HEIGHT = 16;
// Default brush radius in map cells; center cell at (0.5, 0.5) must be wetted.
const BRUSH_RADIUS = 4;

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function callWetness(script) {
  const moduleUrl = pathToFileURL(wetnessPath).href;
  const fullScript = `
    import * as wetness from ${JSON.stringify(moduleUrl)};
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

function centerCellIndex(width, height) {
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  return cy * width + cx;
}

function cornerCellIndex(width, height) {
  return 0;
}

test("lib/pulse-wetness.ts exists", () => {
  assert.ok(fs.existsSync(wetnessPath), "lib/pulse-wetness.ts must exist");
});

test("createWetnessMap returns width, height, and zero-filled Float32Array", () => {
  const result = callWetness(`
    const map = wetness.createWetnessMap(${MAP_WIDTH}, ${MAP_HEIGHT});
    console.log(JSON.stringify({
      width: map.width,
      height: map.height,
      length: map.cells.length,
      isFloat32: map.cells instanceof Float32Array,
      allZero: map.cells.every((v) => v === 0),
    }));
  `);

  assert.ok(result.ok, `createWetnessMap must be callable: ${result.error ?? ""}`);
  assert.equal(result.value.width, MAP_WIDTH);
  assert.equal(result.value.height, MAP_HEIGHT);
  assert.equal(result.value.length, MAP_WIDTH * MAP_HEIGHT);
  assert.equal(result.value.isFloat32, true);
  assert.equal(result.value.allZero, true);
});

test("center cell stays well below full soak after 2000ms accumulation", () => {
  const result = callWetness(`
    const map = wetness.createWetnessMap(${MAP_WIDTH}, ${MAP_HEIGHT});
    const center = ${centerCellIndex(MAP_WIDTH, MAP_HEIGHT)};
    const dt = 100;
    for (let t = 0; t < 2000; t += dt) {
      wetness.accumulateWetness(map, 0.5, 0.5, dt, { radius: ${BRUSH_RADIUS} });
    }
    console.log(JSON.stringify({ center: map.cells[center] }));
  `);

  assert.ok(result.ok, `accumulateWetness must be callable: ${result.error ?? ""}`);
  assert.ok(
    result.value.center < 0.2,
    `center cell must stay below 0.2 after 2000ms (got ${result.value.center})`,
  );
});

test("center cell reaches ~1 after FIELD_SOAK_MS accumulation", () => {
  const result = callWetness(`
    const map = wetness.createWetnessMap(${MAP_WIDTH}, ${MAP_HEIGHT});
    const center = ${centerCellIndex(MAP_WIDTH, MAP_HEIGHT)};
    const soakMs = wetness.FIELD_SOAK_MS;
    const dt = 100;
    for (let t = 0; t < soakMs; t += dt) {
      wetness.accumulateWetness(map, 0.5, 0.5, dt, { radius: ${BRUSH_RADIUS} });
    }
    console.log(JSON.stringify({ center: map.cells[center], soakMs }));
  `);

  assert.ok(result.ok, `accumulateWetness must be callable: ${result.error ?? ""}`);
  assert.equal(result.value.soakMs, 20_000);
  assert.ok(
    result.value.center >= 0.95 && result.value.center <= 1,
    `center cell must be ~1 after FIELD_SOAK_MS (got ${result.value.center})`,
  );
});

test("wetness clamps to 1 after additional accumulation beyond full soak", () => {
  const result = callWetness(`
    const map = wetness.createWetnessMap(${MAP_WIDTH}, ${MAP_HEIGHT});
    const center = ${centerCellIndex(MAP_WIDTH, MAP_HEIGHT)};
    const soakMs = wetness.FIELD_SOAK_MS;
    const dt = 100;
    for (let t = 0; t < soakMs * 2; t += dt) {
      wetness.accumulateWetness(map, 0.5, 0.5, dt, { radius: ${BRUSH_RADIUS} });
    }
    console.log(JSON.stringify({ center: map.cells[center] }));
  `);

  assert.ok(result.ok, `accumulateWetness must be callable: ${result.error ?? ""}`);
  assert.ok(
    result.value.center <= 1,
    `center cell must not exceed 1 (got ${result.value.center})`,
  );
});

test("wetness is local: corner stays ~0 when brushing center to full soak", () => {
  const result = callWetness(`
    const map = wetness.createWetnessMap(${MAP_WIDTH}, ${MAP_HEIGHT});
    const corner = ${cornerCellIndex(MAP_WIDTH, MAP_HEIGHT)};
    const soakMs = wetness.FIELD_SOAK_MS;
    const dt = 100;
    for (let t = 0; t < soakMs; t += dt) {
      wetness.accumulateWetness(map, 0.5, 0.5, dt, { radius: ${BRUSH_RADIUS} });
    }
    console.log(JSON.stringify({ corner: map.cells[corner] }));
  `);

  assert.ok(result.ok, `accumulateWetness must be callable: ${result.error ?? ""}`);
  assert.ok(
    result.value.corner < 0.05,
    `corner cell must stay ~0 when brushing center (got ${result.value.corner})`,
  );
});

test("wetness does not dry; resetWetness clears all cells", () => {
  const result = callWetness(`
    const map = wetness.createWetnessMap(${MAP_WIDTH}, ${MAP_HEIGHT});
    const center = ${centerCellIndex(MAP_WIDTH, MAP_HEIGHT)};
    const soakMs = wetness.FIELD_SOAK_MS;
    const dt = 100;
    for (let t = 0; t < soakMs; t += dt) {
      wetness.accumulateWetness(map, 0.5, 0.5, dt, { radius: ${BRUSH_RADIUS} });
    }
    const afterSoak = map.cells[center];
    wetness.accumulateWetness(map, 0.5, 0.5, 0, { radius: ${BRUSH_RADIUS} });
    const afterZeroDt = map.cells[center];
    wetness.resetWetness(map);
    const afterReset = map.cells[center];
    const allZero = map.cells.every((v) => v === 0);
    console.log(JSON.stringify({ afterSoak, afterZeroDt, afterReset, allZero }));
  `);

  assert.ok(result.ok, `wetness persistence/reset must be callable: ${result.error ?? ""}`);
  assert.ok(result.value.afterSoak >= 0.95, "center should be soaked before reset");
  assert.equal(
    result.value.afterZeroDt,
    result.value.afterSoak,
    "dtMs=0 must not change wetness",
  );
  assert.equal(result.value.afterReset, 0);
  assert.equal(result.value.allZero, true);
});

test("accumulateWetness returns changed true when adding water", () => {
  const result = callWetness(`
    const map = wetness.createWetnessMap(${MAP_WIDTH}, ${MAP_HEIGHT});
    const out = wetness.accumulateWetness(map, 0.5, 0.5, 100, { radius: ${BRUSH_RADIUS} });
    console.log(JSON.stringify(out));
  `);

  assert.ok(result.ok, `accumulateWetness must be callable: ${result.error ?? ""}`);
  assert.equal(result.value.changed, true);
});

test("accumulateWetness returns changed false when pointer is outside map", () => {
  const result = callWetness(`
    const map = wetness.createWetnessMap(${MAP_WIDTH}, ${MAP_HEIGHT});
    const outside = wetness.accumulateWetness(map, -0.1, 0.5, 100, { radius: ${BRUSH_RADIUS} });
    const outsideY = wetness.accumulateWetness(map, 0.5, 1.5, 100, { radius: ${BRUSH_RADIUS} });
    console.log(JSON.stringify({ outside, outsideY }));
  `);

  assert.ok(result.ok, `accumulateWetness must be callable: ${result.error ?? ""}`);
  assert.equal(result.value.outside.changed, false);
  assert.equal(result.value.outsideY.changed, false);
});

test("accumulateWetness returns changed false when dtMs is 0", () => {
  const result = callWetness(`
    const map = wetness.createWetnessMap(${MAP_WIDTH}, ${MAP_HEIGHT});
    const out = wetness.accumulateWetness(map, 0.5, 0.5, 0, { radius: ${BRUSH_RADIUS} });
    console.log(JSON.stringify(out));
  `);

  assert.ok(result.ok, `accumulateWetness must be callable: ${result.error ?? ""}`);
  assert.equal(result.value.changed, false);
});

test("lib/pulse-wetness.ts exports required public API", () => {
  const source = readSource(wetnessPath);

  assert.match(source, /export const FIELD_SOAK_MS\s*=\s*20_?000/);
  assert.match(source, /export function createWetnessMap\s*\(/);
  assert.match(source, /export function resetWetness\s*\(/);
  assert.match(source, /export function accumulateWetness\s*\(/);
});
