import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const copyToastPath = path.join(root, "components", "copy-toast.tsx");

function readCopyToastSource() {
  return fs.readFileSync(copyToastPath, "utf8");
}

function extractTryCopyBody(source) {
  const match = source.match(
    /const tryCopy = useCallback\(async \(\) => \{([\s\S]*?)\n  \}, \[showToast\]\);/,
  );

  assert.ok(match, "tryCopy useCallback must exist in copy-toast.tsx");
  return match[1];
}

function splitAtClipboardWrite(body) {
  const marker = "await navigator.clipboard.writeText";
  const index = body.indexOf(marker);

  assert.ok(
    index !== -1,
    "tryCopy must await navigator.clipboard.writeText",
  );

  return {
    beforeAwait: body.slice(0, index),
    afterAwait: body.slice(index + marker.length),
  };
}

const positionCapturePattern =
  /toastAnchor\s*\(|getBoundingClientRect\s*\(/;

const generationIncrementPattern =
  /(?:const|let)\s+\w*(?:attempt|generation|seq)\w*\s*=|\w*(?:Attempt|Generation|Seq)\w*\.current\s*(?:\+\+|\+=\s*1)/i;

const staleWriteGuardPattern =
  /if\s*\([^)]*(?:attempt|generation|seq)[^)]*(?:!==|!==|!=)[^)]*\.current[^)]*\)\s*\{?\s*return/i;

test("tryCopy captures toast position before clipboard write", () => {
  const body = extractTryCopyBody(readCopyToastSource());
  const { beforeAwait } = splitAtClipboardWrite(body);

  assert.match(
    beforeAwait,
    positionCapturePattern,
    "tryCopy must measure toastAnchor or getBoundingClientRect before awaiting clipboard.writeText",
  );
});

test("tryCopy does not re-measure toast position after clipboard write", () => {
  const body = extractTryCopyBody(readCopyToastSource());
  const { afterAwait } = splitAtClipboardWrite(body);

  assert.doesNotMatch(
    afterAwait,
    positionCapturePattern,
    "tryCopy must not call toastAnchor or getBoundingClientRect after awaiting clipboard.writeText",
  );
});

test("tryCopy guards stale clipboard writes with a generation token", () => {
  const body = extractTryCopyBody(readCopyToastSource());
  const { beforeAwait, afterAwait } = splitAtClipboardWrite(body);

  assert.match(
    beforeAwait,
    generationIncrementPattern,
    "tryCopy must increment or capture an attempt/generation token before awaiting clipboard.writeText",
  );

  assert.match(
    afterAwait,
    staleWriteGuardPattern,
    "tryCopy must bail after clipboard.writeText when the attempt/generation token is no longer current",
  );
});
