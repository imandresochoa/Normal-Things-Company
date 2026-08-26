import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cssPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "app",
  "globals.css",
);

function toMilliseconds(value, unit) {
  if (unit === "s") {
    return Number(value) * 1000;
  }

  return Number(value);
}

test("logo stroke draw lasts much longer than 550ms", () => {
  const css = fs.readFileSync(cssPath, "utf8");
  const match = css.match(
    /animation:\s*logo-trace\s+(\d+(?:\.\d+)?)(ms|s)\b/,
  );

  assert.ok(match, "logo-trace duration must be set on the stroke animation");

  const durationMs = toMilliseconds(match[1], match[2]);
  assert.ok(
    durationMs >= 2000,
    `logo-trace duration must be at least 2000ms so the draw is much slower than 550ms (got ${durationMs}ms)`,
  );
});

test("logo stroke stagger is slower than 40ms", () => {
  const css = fs.readFileSync(cssPath, "utf8");
  const match = css.match(
    /animation-delay:\s*calc\(\s*var\(--i\)\s*\*\s*(\d+(?:\.\d+)?)(ms|s)\s*\)/,
  );

  assert.ok(match, "logo stroke animation-delay stagger must be set");

  const staggerMs = toMilliseconds(match[1], match[2]);
  assert.ok(
    staggerMs >= 80,
    `logo stroke stagger must be at least 80ms so the sequence is much slower than 40ms (got ${staggerMs}ms)`,
  );
});
