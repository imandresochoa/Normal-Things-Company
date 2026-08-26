import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootsStrokesPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "lib",
  "roots-strokes.ts",
);

const WORD_GROUPS = {
  WE: ["w", "e", "e-bar"],
  ARE: ["a", "a-bar", "r-stem", "r-bowl", "e-2", "e-2-bar"],
  STILL: ["s", "t-bar", "t", "i-top", "i", "i-bottom", "l", "l-2"],
  ON: ["o", "n"],
  IT: ["i-2-top", "i-2", "i-2-bottom", "t-2-bar", "t-2"],
};

const WORD_PAIRS = [
  ["WE", "ARE"],
  ["ARE", "STILL"],
  ["STILL", "ON"],
  ["ON", "IT"],
];

const GAP_TOLERANCE = 0.15;

function shiftPathX(d, dx) {
  if (dx === 0) {
    return d;
  }

  let index = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, (raw) => {
    const value = Number(raw);
    const next = index % 2 === 0 ? value + dx : value;
    index += 1;
    return String(Math.round(next * 10) / 10);
  });
}

function pathXs(d) {
  const numbers = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) =>
    Number(match[0]),
  );
  return numbers.filter((_, index) => index % 2 === 0);
}

function parseDxConstants(source) {
  const constants = {};
  for (const match of source.matchAll(/const\s+(\w+)\s*=\s*(-?\d+(?:\.\d+)?)/g)) {
    constants[match[1]] = Number(match[2]);
  }
  return constants;
}

function parseStrokes(source, dxConstants) {
  const strokes = [];
  const strokePattern =
    /stroke\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*(\w+|\d+(?:\.\d+)?)\s*,?\s*\)/gs;

  for (const match of source.matchAll(strokePattern)) {
    const id = match[1];
    const d = match[2];
    const dxRaw = match[3];
    const dx = dxConstants[dxRaw] ?? Number(dxRaw);
    const shifted = shiftPathX(d, dx);
    const xs = pathXs(shifted);

    strokes.push({
      id,
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
    });
  }

  return strokes;
}

function wordBounds(strokes, ids) {
  const grouped = strokes.filter((stroke) => ids.includes(stroke.id));
  assert.ok(
    grouped.length === ids.length,
    `expected ${ids.length} strokes for word group [${ids.join(", ")}], got ${grouped.length}`,
  );

  return {
    minX: Math.min(...grouped.map((stroke) => stroke.minX)),
    maxX: Math.max(...grouped.map((stroke) => stroke.maxX)),
  };
}

function gapBetweenWords(strokes, previousWord, nextWord) {
  const previous = wordBounds(strokes, WORD_GROUPS[previousWord]);
  const next = wordBounds(strokes, WORD_GROUPS[nextWord]);
  return next.minX - previous.maxX;
}

function parseRootsWordSpace(source) {
  const match = source.match(/export const ROOTS_WORD_SPACE\s*=\s*(-?\d+(?:\.\d+)?)/);
  assert.ok(match, "roots-strokes.ts must export ROOTS_WORD_SPACE");
  return Number(match[1]);
}

test("roots-strokes exports ROOTS_WORD_SPACE = 16", () => {
  const source = fs.readFileSync(rootsStrokesPath, "utf8");
  const match = source.match(/export const ROOTS_WORD_SPACE\s*=\s*(-?\d+(?:\.\d+)?)/);

  assert.ok(match, "roots-strokes.ts must export ROOTS_WORD_SPACE");
  assert.equal(
    Number(match[1]),
    16,
    "ROOTS_WORD_SPACE must be 16 viewBox units",
  );
});

test("adjacent Roots word gaps equal ROOTS_WORD_SPACE after stroke shifts", () => {
  const source = fs.readFileSync(rootsStrokesPath, "utf8");
  const rootsWordSpace = parseRootsWordSpace(source);
  const dxConstants = parseDxConstants(source);
  const strokes = parseStrokes(source, dxConstants);

  assert.equal(
    strokes.length,
    24,
    "roots-strokes.ts must define 24 stroke paths for the mark",
  );

  for (const [previousWord, nextWord] of WORD_PAIRS) {
    const gap = gapBetweenWords(strokes, previousWord, nextWord);
    assert.ok(
      Math.abs(gap - rootsWordSpace) <= GAP_TOLERANCE,
      `${previousWord}→${nextWord} gap must be ${rootsWordSpace} ± ${GAP_TOLERANCE} (got ${gap.toFixed(2)})`,
    );
  }
});
