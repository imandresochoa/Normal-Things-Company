import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = path.join(root, "app", "globals.css");
const logoPath = path.join(root, "components", "company-logo.tsx");

function toMilliseconds(value, unit) {
  if (unit === "s") {
    return Number(value) * 1000;
  }

  return Number(value);
}

function burstSparkRule(css) {
  const match = css.match(
    /\.logo-sparks\[data-state="burst"\] \[data-spark\] \{[^}]+\}/,
  );
  return match ? match[0] : null;
}

test("logo burst sparks stagger with a delay between objects", () => {
  const css = fs.readFileSync(cssPath, "utf8");
  const rule = burstSparkRule(css);

  assert.ok(rule, "logo burst spark rule must exist");

  const delay = rule.match(
    /animation-delay:\s*calc\(\s*var\(--i\)\s*\*\s*(\d+(?:\.\d+)?)(ms|s)\s*\)/,
  );

  assert.ok(
    delay,
    "burst sparks must delay each object with calc(var(--i) * stagger), like copy-toast burst",
  );

  const staggerMs = toMilliseconds(delay[1], delay[2]);
  assert.ok(
    staggerMs >= 30 && staggerMs <= 80,
    `burst spark stagger must be 30-80ms (got ${staggerMs}ms)`,
  );
});

test("logo spark lines receive a stagger index --i", () => {
  const source = fs.readFileSync(logoPath, "utf8");

  assert.match(
    source,
    /function sparkStyle[\s\S]*?"--i":/,
    "sparkStyle must set CSS --i so burst delay can stagger each spark",
  );
  assert.match(
    source,
    /style=\{sparkStyle\(index,\s*spark\)\}/,
    "each spark line must pass its index into sparkStyle",
  );
});
