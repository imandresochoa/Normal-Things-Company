import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const chartTokensPath = path.join(root, "foundations", "chart_tokens.json");
const uiTokensPath = path.join(root, "foundations", "tokens.json");
const rootTokensPath = path.join(root, "lib", "root-tokens.ts");
const pulseTokensPath = path.join(root, "lib", "pulse-tokens.ts");

const CHART_FAMILIES_700 = [
  { family: "indigo", hex: "#4868B7" },
  { family: "ember", hex: "#C46150" },
  { family: "teal", hex: "#1B9CAB" },
  { family: "moss", hex: "#0C5E27" },
];

const CHART_FAMILY_IDS = CHART_FAMILIES_700.map((entry) => entry.family);
const SERIES_ALIASES = ["series-1", "series-2", "series-3", "series-4"];
const ILLUST_ALIASES = CHART_FAMILY_IDS.map((family) => `illust-${family}`);
const ILLUST_WASH_ALIASES = CHART_FAMILY_IDS.map(
  (family) => `illust-${family}-wash`,
);

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function normalizeHex(value) {
  const match = String(value).match(/#([0-9a-fA-F]{6})\b/);
  return match ? `#${match[1].toUpperCase()}` : null;
}

function walk(node, visit) {
  if (Array.isArray(node)) {
    for (const item of node) {
      walk(item, visit);
    }
    return;
  }

  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      visit(key, value);
      walk(value, visit);
    }
  }
}

function collectHexes(node, hexes = []) {
  if (typeof node === "string") {
    const hex = normalizeHex(node);
    if (hex) {
      hexes.push(hex);
    }
    return hexes;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectHexes(item, hexes);
    }
    return hexes;
  }

  if (node && typeof node === "object") {
    for (const value of Object.values(node)) {
      collectHexes(value, hexes);
    }
  }

  return hexes;
}

function findFamily700Hexes(tokens, family) {
  const hexes = [];
  const familyLower = family.toLowerCase();

  walk(tokens, (key, value) => {
    const keyLower = key.toLowerCase().replace(/^--/, "");

    if (keyLower === familyLower && value && typeof value === "object") {
      const step = value["700"] ?? value[700];
      if (step != null) {
        collectHexes(step, hexes);
      }
    }

    if (
      keyLower === `${familyLower}-700` ||
      keyLower === `${familyLower}.700`
    ) {
      collectHexes(value, hexes);
    }
  });

  return hexes;
}

function collectTokenNames(node, names = new Set()) {
  if (typeof node === "string") {
    const lower = node.toLowerCase();
    for (const match of lower.matchAll(
      /--?(series-\d+|illust-[a-z]+(?:-wash)?)/g,
    )) {
      names.add(match[1]);
    }
    return names;
  }

  walk(node, (key) => {
    const normalized = key.toLowerCase().replace(/^--/, "");
    names.add(normalized);
  });

  if (node && typeof node === "object") {
    walk(node, (_key, value) => {
      if (typeof value === "string") {
        collectTokenNames(value, names);
      }
    });
  }

  return names;
}

function loadChartTokens() {
  assert.ok(
    fs.existsSync(chartTokensPath),
    "foundations/chart_tokens.json must exist",
  );

  return JSON.parse(readSource(chartTokensPath));
}

function parsePrimitiveFamilyMembers(source) {
  const match = source.match(/export type PrimitiveFamily\s*=\s*([\s\S]*?);/);
  if (!match) {
    return [];
  }

  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

function parseColorFamilyIds(source) {
  const match = source.match(
    /export const COLOR_FAMILIES[\s\S]*?=\s*\[([\s\S]*?)\];/,
  );
  if (!match) {
    return [];
  }

  return [...match[1].matchAll(/id:\s*"([^"]+)"/g)].map((entry) => entry[1]);
}

function semanticTokenNames(tokens) {
  const semantic = tokens?.color?.semantic ?? {};
  const names = [];

  walk(semantic, (key) => {
    names.push(key.toLowerCase().replace(/^--/, ""));
  });

  return names;
}

test("foundations/chart_tokens.json publishes Chart family 700s", () => {
  const tokens = loadChartTokens();

  for (const { family, hex } of CHART_FAMILIES_700) {
    const hexes = findFamily700Hexes(tokens, family);
    const expected = normalizeHex(hex);

    assert.ok(
      hexes.includes(expected),
      `chart_tokens.json must publish ${family} 700 as ${hex} (found ${hexes.join(", ") || "none"})`,
    );
  }
});

test("foundations/chart_tokens.json exposes series and illustration aliases", () => {
  const tokens = loadChartTokens();
  const names = collectTokenNames(tokens);

  for (const alias of SERIES_ALIASES) {
    assert.ok(
      names.has(alias),
      `chart_tokens.json must expose ${alias} (or --${alias})`,
    );
  }

  for (const alias of ILLUST_ALIASES) {
    assert.ok(
      names.has(alias),
      `chart_tokens.json must expose ${alias} (or --${alias})`,
    );
  }

  for (const alias of ILLUST_WASH_ALIASES) {
    assert.ok(
      names.has(alias),
      `chart_tokens.json must expose ${alias} (or --${alias})`,
    );
  }
});

test("UI tokens.json does not publish Chart primitive families", () => {
  const tokens = JSON.parse(readSource(uiTokensPath));
  const primitive = tokens?.color?.primitive ?? {};
  const familyKeys = Object.keys(primitive).map((key) => key.toLowerCase());

  for (const family of CHART_FAMILY_IDS) {
    assert.ok(
      !familyKeys.includes(family),
      `foundations/tokens.json must not include "${family}" as a primitive family`,
    );
  }
});

test("UI tokens.json semantic tokens omit series and illust aliases", () => {
  const tokens = JSON.parse(readSource(uiTokensPath));
  const names = semanticTokenNames(tokens);
  const banned = [...SERIES_ALIASES, ...ILLUST_ALIASES, ...ILLUST_WASH_ALIASES];

  for (const alias of banned) {
    assert.ok(
      !names.includes(alias),
      `foundations/tokens.json semantic tokens must not include ${alias}`,
    );
  }
});

test("root-tokens.ts COLOR_FAMILIES and PrimitiveFamily omit Chart hues", () => {
  const source = readSource(rootTokensPath);
  const familyIds = parseColorFamilyIds(source).map((id) => id.toLowerCase());
  const primitiveMembers = parsePrimitiveFamilyMembers(source).map((id) =>
    id.toLowerCase(),
  );

  for (const family of CHART_FAMILY_IDS) {
    assert.ok(
      !familyIds.includes(family),
      `COLOR_FAMILIES must not list "${family}"`,
    );
    assert.ok(
      !primitiveMembers.includes(family),
      `PrimitiveFamily must not include "${family}"`,
    );
  }
});

test("root-tokens.ts does not mention --series-* or --illust-*", () => {
  const source = readSource(rootTokensPath);

  assert.doesNotMatch(
    source,
    /--series-/,
    "lib/root-tokens.ts must not mention --series-* custom properties",
  );
  assert.doesNotMatch(
    source,
    /--illust-/,
    "lib/root-tokens.ts must not mention --illust-* custom properties",
  );
});

test("lib/pulse-tokens.ts exists and exports Chart 700 readers", () => {
  assert.ok(
    fs.existsSync(pulseTokensPath),
    "lib/pulse-tokens.ts must exist",
  );

  const source = readSource(pulseTokensPath);
  const hasChartExport =
    /export\s+const\s+CHART_FAMILIES\b/.test(source) ||
    /export\s+const\s+chartFamilies\b/.test(source) ||
    /export\s+(?:const|function)\s+chartPrimitive\b/.test(source) ||
    /export\s+const\s+CHART_PRIMITIVES\b/.test(source);

  assert.ok(
    hasChartExport,
    "lib/pulse-tokens.ts must export a way to read Chart 700s (CHART_FAMILIES, chartPrimitive, or similar)",
  );
});
