import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const nextConfigPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "next.config.ts",
);

function readNextConfig() {
  return fs.readFileSync(nextConfigPath, "utf8");
}

function findRootsRedirectBlock(source) {
  const match = source.match(
    /\{[^{}]*source\s*:\s*["']\/roots["'][^{}]*\}/s,
  );
  return match ? match[0] : null;
}

test("next.config.ts declares a redirects entry", () => {
  const source = readNextConfig();

  assert.match(
    source,
    /\bredirects\s*(?:\([^)]*\))?\s*(?:=>|:|\{)/,
    "next.config.ts must declare redirects (sync or async function, or redirects property)",
  );
});

test("redirects entry maps /roots to /pulse with permanent: true", () => {
  const source = readNextConfig();
  const redirect = findRootsRedirectBlock(source);

  assert.ok(
    redirect,
    'next.config.ts redirects must include an entry with source "/roots"',
  );

  assert.match(
    redirect,
    /destination\s*:\s*["']\/pulse["']/,
    'roots redirect must set destination "/pulse"',
  );

  assert.match(
    redirect,
    /permanent\s*:\s*true\b/,
    "roots redirect must set permanent: true (308)",
  );
});
