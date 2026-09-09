import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const globalsCssPath = path.join(root, "app", "globals.css");

const BODY_WEIGHT_PATTERN =
  /^(?:400|var\(--type-body-weight\))$/;

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function extractRuleBodies(css, selectorPattern) {
  const rules = [];
  const pattern = new RegExp(`(${selectorPattern})\\s*\\{([^}]+)\\}`, "g");

  for (const match of css.matchAll(pattern)) {
    rules.push({ selector: match[1].trim(), body: match[2] });
  }

  return rules;
}

function parseFontWeight(ruleBody) {
  const match = ruleBody.match(/font-weight:\s*([^;]+)/);
  return match ? match[1].trim() : null;
}

function assertUsesBodyWeight(selector, ruleBody) {
  const fontWeight = parseFontWeight(ruleBody);

  assert.ok(
    fontWeight,
    `${selector} must declare font-weight`,
  );
  assert.match(
    fontWeight,
    BODY_WEIGHT_PATTERN,
    `${selector} font-weight must be var(--type-body-weight) or 400, got "${fontWeight}"`,
  );
  assert.doesNotMatch(
    fontWeight,
    /--type-heading-weight/,
    `${selector} must not use var(--type-heading-weight)`,
  );
}

function findRuleBySelector(css, selectorPattern) {
  const rules = extractRuleBodies(css, selectorPattern);
  assert.ok(
    rules.length > 0,
    `globals.css must include a rule for ${selectorPattern}`,
  );
  return rules[0];
}

test(".root-nav-title uses body font-weight", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-nav-title");

  assertUsesBodyWeight(rule.selector, rule.body);
});

test(".root-nav-link uses body font-weight", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-nav-link(?!\\[)");

  assertUsesBodyWeight(rule.selector, rule.body);
});

test(".root-nav-link[data-active=\"true\"] does not use heading font-weight", () => {
  const css = readSource(globalsCssPath);
  const rules = extractRuleBodies(
    css,
    '\\.root-nav-link\\[data-active="true"\\](?::\\w+)?',
  );

  assert.ok(
    rules.length > 0,
    'globals.css must include a rule for .root-nav-link[data-active="true"]',
  );

  for (const rule of rules) {
    const fontWeight = parseFontWeight(rule.body);

    if (fontWeight) {
      assert.match(
        fontWeight,
        BODY_WEIGHT_PATTERN,
        `${rule.selector} font-weight must be var(--type-body-weight) or 400 when set, got "${fontWeight}"`,
      );
      assert.doesNotMatch(
        fontWeight,
        /--type-heading-weight/,
        `${rule.selector} must not use var(--type-heading-weight) for active state`,
      );
    }
  }
});

test(".root-page-title uses body font-weight", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-page-title");

  assertUsesBodyWeight(rule.selector, rule.body);
});

test(".root-doc-header h1 and .root-doc h1 use body font-weight", () => {
  const css = readSource(globalsCssPath);
  const rules = extractRuleBodies(
    css,
    "\\.root-doc-header h1|\\.root-doc h1(?!\\d)",
  );

  assert.ok(
    rules.length > 0,
    "globals.css must include rules for .root-doc-header h1 / .root-doc h1",
  );

  for (const rule of rules) {
    assertUsesBodyWeight(rule.selector, rule.body);
  }
});

test(".root-doc h2 uses body font-weight", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-doc h2");

  assertUsesBodyWeight(rule.selector, rule.body);
});

test(".root-doc h3 uses body font-weight", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-doc h3");

  assertUsesBodyWeight(rule.selector, rule.body);
});

test(".root-doc-list strong uses body font-weight", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-doc-list strong");

  assertUsesBodyWeight(rule.selector, rule.body);
});

test(".root-swatch-label uses body font-weight", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-swatch-label");

  assertUsesBodyWeight(rule.selector, rule.body);
});

test(".root-table th uses body font-weight", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-table th");

  assertUsesBodyWeight(rule.selector, rule.body);
});
