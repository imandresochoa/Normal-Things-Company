import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootTokensPath = path.join(root, "lib", "root-tokens.ts");
const globalsCssPath = path.join(root, "app", "globals.css");
const letterPagePath = path.join(root, "app", "page.tsx");

const EXPECTED_PRIMITIVES = [4, 8, 16, 24, 48, 80, 120];
const EXPECTED_ROLES = {
  tight: 4,
  related: 8,
  grouped: 16,
  inset: 24,
  section: 48,
  gutter: 80,
  canvas: 120,
};
const FORBIDDEN_PRIMITIVES = [12, 20, 28, 32, 40];
const SPACE_CSS_VARS = [
  { name: "--space-tight", px: 4 },
  { name: "--space-related", px: 8 },
  { name: "--space-grouped", px: 16 },
  { name: "--space-inset", px: 24 },
  { name: "--space-section", px: 48 },
  { name: "--space-gutter", px: 80 },
  { name: "--space-canvas", px: 120 },
];

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function parseExportedArrayBlock(source, exportName) {
  const match = source.match(
    new RegExp(
      `export const ${exportName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*(?:as const)?;`,
    ),
  );
  return match ? match[1] : null;
}

function parseSpacePrimitives(source) {
  const block = parseExportedArrayBlock(source, "SPACE_PRIMITIVES");
  if (!block) {
    return null;
  }

  return [...block.matchAll(/\b(\d+)\b/g)].map((match) => Number(match[1]));
}

function parseSpaceRoles(source) {
  const arrayBlock = parseExportedArrayBlock(source, "SPACE_ROLES");
  if (arrayBlock) {
    const roles = {};
    for (const match of arrayBlock.matchAll(
      /token:\s*"([^"]+)"[\s\S]*?(?:value|px|size):\s*(\d+)/g,
    )) {
      roles[match[1]] = Number(match[2]);
    }
    return roles;
  }

  const recordMatch = source.match(
    /export const SPACE_ROLES\s*=\s*\{([\s\S]*?)\}\s*(?:as const)?;/,
  );
  if (!recordMatch) {
    return null;
  }

  const roles = {};
  for (const match of recordMatch[1].matchAll(/(\w+):\s*(\d+)/g)) {
    roles[match[1]] = Number(match[2]);
  }

  return roles;
}

function extractRuleBodies(css, selectorPattern) {
  const rules = [];
  const pattern = new RegExp(`(${selectorPattern})\\s*\\{([^}]+)\\}`, "g");

  for (const match of css.matchAll(pattern)) {
    rules.push({ selector: match[1].trim(), body: match[2] });
  }

  return rules;
}

function findRuleBySelector(css, selectorPattern) {
  const rules = extractRuleBodies(css, selectorPattern);
  assert.ok(
    rules.length > 0,
    `globals.css must include a rule for ${selectorPattern}`,
  );
  return rules[0];
}

function parseCustomProperty(ruleBody, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = ruleBody.match(new RegExp(`${escaped}:\\s*([^;]+)`));
  return match ? match[1].trim() : null;
}

function parseMargin(ruleBody) {
  const match = ruleBody.match(/margin:\s*([^;]+)/);
  if (!match) {
    return null;
  }

  const parts = match[1].trim().split(/\s+/);
  if (parts.length === 1) {
    return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  }
  if (parts.length === 2) {
    return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  }
  if (parts.length === 3) {
    return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  }

  return {
    top: parts[0],
    right: parts[1],
    bottom: parts[2],
    left: parts[3],
  };
}

function parseMarginSide(ruleBody, side) {
  const longhand = ruleBody.match(new RegExp(`margin-${side}:\\s*([^;]+)`));
  if (longhand) {
    return longhand[1].trim();
  }

  const shorthand = parseMargin(ruleBody);
  return shorthand ? shorthand[side] : null;
}

function parseGap(ruleBody) {
  const match = ruleBody.match(/gap:\s*([^;]+)/);
  return match ? match[1].trim() : null;
}

function findRootBlock(css) {
  const match = css.match(/:root\s*\{([^}]+)\}/);
  return match ? match[1] : null;
}

function assertUsesSpaceToken(actual, expectedToken, context) {
  assert.equal(
    actual,
    `var(${expectedToken})`,
    `${context} must use var(${expectedToken}), got "${actual ?? "missing"}"`,
  );
}

test("root-tokens.ts exports SPACE_PRIMITIVES with the seven-step scale", () => {
  const source = readSource(rootTokensPath);

  assert.match(
    source,
    /export const SPACE_PRIMITIVES\s*=/,
    "lib/root-tokens.ts must export SPACE_PRIMITIVES",
  );

  const values = parseSpacePrimitives(source);
  assert.ok(values, "SPACE_PRIMITIVES must be a numeric array export");
  assert.deepEqual(
    values,
    EXPECTED_PRIMITIVES,
    "SPACE_PRIMITIVES must be exactly [4, 8, 16, 24, 48, 80, 120]",
  );
});

test("root-tokens.ts exports SPACE_ROLES mapped to semantic px values", () => {
  const source = readSource(rootTokensPath);

  assert.match(
    source,
    /export const SPACE_ROLES\s*=/,
    "lib/root-tokens.ts must export SPACE_ROLES",
  );

  const roles = parseSpaceRoles(source);
  assert.ok(roles, "SPACE_ROLES must export semantic token mappings");

  for (const [token, px] of Object.entries(EXPECTED_ROLES)) {
    assert.equal(
      roles[token],
      px,
      `SPACE_ROLES.${token} must map to ${px}px`,
    );
  }
});

test("SPACE_PRIMITIVES must not include forbidden intermediate steps", () => {
  const source = readSource(rootTokensPath);
  const values = parseSpacePrimitives(source);

  assert.ok(
    values,
    "SPACE_PRIMITIVES must exist before checking forbidden steps",
  );

  for (const forbidden of FORBIDDEN_PRIMITIVES) {
    assert.ok(
      !values.includes(forbidden),
      `SPACE_PRIMITIVES must not include ${forbidden}`,
    );
  }
});

test(":root defines all seven --space-* CSS variables", () => {
  const css = readSource(globalsCssPath);
  const rootBlock = findRootBlock(css);

  assert.ok(rootBlock, "globals.css must define a :root token block");

  for (const token of SPACE_CSS_VARS) {
    const pattern = new RegExp(
      `${token.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*${token.px}px\\b`,
    );
    assert.match(
      rootBlock,
      pattern,
      `:root must define ${token.name}: ${token.px}px`,
    );
  }
});

test(".root-docs canvas padding tokens use var(--space-canvas)", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-docs");

  assertUsesSpaceToken(
    parseCustomProperty(rule.body, "--root-top"),
    "--space-canvas",
    ".root-docs --root-top",
  );
  assertUsesSpaceToken(
    parseCustomProperty(rule.body, "--root-bottom"),
    "--space-canvas",
    ".root-docs --root-bottom",
  );
});

test(".root-docs --root-gutter uses var(--space-gutter)", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-docs");

  assertUsesSpaceToken(
    parseCustomProperty(rule.body, "--root-gutter"),
    "--space-gutter",
    ".root-docs --root-gutter",
  );
});

test(".root-doc-section margin-top uses var(--space-section)", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-doc-section");

  assertUsesSpaceToken(
    parseMarginSide(rule.body, "top"),
    "--space-section",
    ".root-doc-section margin-top",
  );
});

test(".root-doc h2 space to following copy uses var(--space-related)", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-doc h2");

  assertUsesSpaceToken(
    parseMarginSide(rule.body, "bottom"),
    "--space-related",
    ".root-doc h2 margin-bottom",
  );
});

test(".root-doc p paragraph stacking uses var(--space-grouped)", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-doc p");

  assertUsesSpaceToken(
    parseMarginSide(rule.body, "bottom"),
    "--space-grouped",
    ".root-doc p margin-bottom",
  );
});

test(".root-doc h3 top and bottom spacing use inset and related tokens", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-doc h3");

  assertUsesSpaceToken(
    parseMarginSide(rule.body, "top"),
    "--space-inset",
    ".root-doc h3 margin-top",
  );
  assertUsesSpaceToken(
    parseMarginSide(rule.body, "bottom"),
    "--space-related",
    ".root-doc h3 margin-bottom",
  );
});

test(".root-swatch-caption uses var(--space-tight)", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-swatch-caption");

  assertUsesSpaceToken(
    parseMarginSide(rule.body, "top"),
    "--space-tight",
    ".root-swatch-caption margin-top",
  );
});

test(".root-nav gap uses var(--space-section)", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-nav");

  assertUsesSpaceToken(parseGap(rule.body), "--space-section", ".root-nav gap");
});

test(".root-nav-list gap uses var(--space-related)", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-nav-list");

  assertUsesSpaceToken(
    parseGap(rule.body),
    "--space-related",
    ".root-nav-list gap",
  );
});

test(".root-nav-title margin uses var(--space-related)", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-nav-title");

  assertUsesSpaceToken(
    parseMarginSide(rule.body, "bottom"),
    "--space-related",
    ".root-nav-title margin-bottom",
  );
});

test(".root-doc-kicker uses var(--space-tight)", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-doc-kicker");

  assertUsesSpaceToken(
    parseMarginSide(rule.body, "bottom"),
    "--space-tight",
    ".root-doc-kicker margin-bottom",
  );
});

test("letter page must not use Tailwind gap-8 or py-10", () => {
  const source = readSource(letterPagePath);

  assert.doesNotMatch(
    source,
    /\bgap-8\b/,
    "app/page.tsx must not use Tailwind gap-8; use var(--space-inset) for letter-to-logo gap",
  );
  assert.doesNotMatch(
    source,
    /\bpy-10\b/,
    "app/page.tsx must not use Tailwind py-10; use var(--space-grouped) for top padding",
  );
});

test("letter page uses spacing tokens for gap and padding", () => {
  const source = readSource(letterPagePath);

  assert.match(
    source,
    /var\(--space-inset\)/,
    "app/page.tsx must use var(--space-inset) for the letter-to-logo gap",
  );
  assert.match(
    source,
    /var\(--space-grouped\)/,
    "app/page.tsx must use var(--space-grouped) for side padding and mobile top padding",
  );
});
