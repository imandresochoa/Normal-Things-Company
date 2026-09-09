import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const globalsCssPath = path.join(root, "app", "globals.css");

const BODY_WEIGHT_PATTERN =
  /^(?:400|var\(--type-body-weight\))$/;
const HEADING_WEIGHT_PATTERN =
  /^(?:500|var\(--type-heading-weight\))$/;

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

function parseCustomProperty(ruleBody, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = ruleBody.match(new RegExp(`${escaped}:\\s*([^;]+)`));
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

function assertUsesHeadingWeight(selector, ruleBody) {
  const fontWeight = parseFontWeight(ruleBody);

  assert.ok(
    fontWeight,
    `${selector} must declare font-weight`,
  );
  assert.match(
    fontWeight,
    HEADING_WEIGHT_PATTERN,
    `${selector} font-weight must be var(--type-heading-weight) or 500, got "${fontWeight}"`,
  );
  assert.doesNotMatch(
    fontWeight,
    /--type-body-weight/,
    `${selector} must not use var(--type-body-weight)`,
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

test(":root type weights are 400 body and 500 heading", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, ":root");
  const bodyWeight = parseCustomProperty(rule.body, "--type-body-weight");
  const headingWeight = parseCustomProperty(rule.body, "--type-heading-weight");

  assert.equal(
    bodyWeight,
    "400",
    `--type-body-weight must be 400, got "${bodyWeight}"`,
  );
  assert.equal(
    headingWeight,
    "500",
    `--type-heading-weight must be 500, got "${headingWeight}"`,
  );
  assert.equal(
    Number(headingWeight) - Number(bodyWeight),
    100,
    "--type-heading-weight must be exactly 100 more than --type-body-weight",
  );
});

test(".root-page-title uses heading font-weight", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-page-title");

  assertUsesHeadingWeight(rule.selector, rule.body);
});

test(".root-doc-header h1 and .root-doc h1 use heading font-weight", () => {
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
    assertUsesHeadingWeight(rule.selector, rule.body);
  }
});

test(".root-doc h2 uses heading font-weight", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-doc h2");

  assertUsesHeadingWeight(rule.selector, rule.body);
});

test(".root-doc h3 uses heading font-weight", () => {
  const css = readSource(globalsCssPath);
  const rule = findRuleBySelector(css, "\\.root-doc h3");

  assertUsesHeadingWeight(rule.selector, rule.body);
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
