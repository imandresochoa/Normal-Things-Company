import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const globalsCssPath = path.join(root, "app", "globals.css");
const sidebarPath = path.join(root, "components", "root", "sidebar.tsx");

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Walk CSS and collect `{ selector, body, media }` for each rule block.
 * `media` is the stack of @media preludes, outermost first (empty string = top level).
 */
function collectCssRules(css) {
  const rules = [];
  const stripped = stripCssComments(css);
  const mediaStack = [];

  function walk(chunk, depth = 0) {
    let i = 0;

    while (i < chunk.length) {
      const mediaStart = chunk.indexOf("@media", i);
      const ruleStart = chunk.indexOf("{", i);

      if (ruleStart === -1) {
        break;
      }

      if (mediaStart !== -1 && mediaStart < ruleStart) {
        const preludeEnd = chunk.indexOf("{", mediaStart);
        const prelude = chunk.slice(mediaStart, preludeEnd).trim();
        const innerStart = preludeEnd + 1;
        let innerDepth = 1;
        let j = innerStart;

        while (j < chunk.length && innerDepth > 0) {
          if (chunk[j] === "{") {
            innerDepth += 1;
          } else if (chunk[j] === "}") {
            innerDepth -= 1;
          }
          j += 1;
        }

        mediaStack.push(prelude);
        walk(chunk.slice(innerStart, j - 1), depth + 1);
        mediaStack.pop();
        i = j;
        continue;
      }

      const selector = chunk.slice(i, ruleStart).trim();
      if (!selector || selector.startsWith("@")) {
        i = ruleStart + 1;
        continue;
      }

      let bodyDepth = 1;
      let j = ruleStart + 1;
      while (j < chunk.length && bodyDepth > 0) {
        if (chunk[j] === "{") {
          bodyDepth += 1;
        } else if (chunk[j] === "}") {
          bodyDepth -= 1;
        }
        j += 1;
      }

      const body = chunk.slice(ruleStart + 1, j - 1).trim();
      rules.push({
        selector,
        body,
        media: mediaStack.join(" | "),
      });

      i = j;
    }
  }

  walk(stripped);
  return rules;
}

function isNavUnderlineSelector(selector) {
  return (
    selector.includes("root-nav-link") &&
    (selector.includes("underline-mark") || selector.includes("data-underline-stroke"))
  );
}

function isRootNavFocusVisibleUnderlineSelector(selector) {
  return (
    selector.includes("root-nav-link:focus-visible") &&
    (selector.includes("underline-mark") || selector.includes("data-underline-stroke"))
  );
}

function isRootNavActiveUnderlineSelector(selector) {
  return (
    selector.includes("root-nav-link") &&
    selector.includes('data-active="true"') &&
    (selector.includes("underline-mark") || selector.includes("data-underline-stroke"))
  );
}

function transitionUsesHomeTrace(transitionValue) {
  return (
    /--underline-trace-ms/.test(transitionValue) || /\b700ms\b/.test(transitionValue)
  );
}

function removeMediaBlocks(css, mediaPattern) {
  let result = css;
  const re = new RegExp(
    `@media\\s*${mediaPattern.source}[\\s\\S]*?\\{`,
    "g",
  );

  for (const match of css.matchAll(re)) {
    const start = match.index;
    const openBrace = match.index + match[0].length - 1;
    let depth = 1;
    let i = openBrace + 1;

    while (i < css.length && depth > 0) {
      if (css[i] === "{") {
        depth += 1;
      } else if (css[i] === "}") {
        depth -= 1;
      }
      i += 1;
    }

    result = result.slice(0, start) + result.slice(i);
  }

  return result;
}

const FINE_HOVER_MEDIA = /\(hover:\s*hover\)\s*and\s*\(\s*pointer:\s*fine\s*\)/;

test("nav underline must not use the 700ms home trace transition", () => {
  const css = readSource(globalsCssPath);
  const rules = collectCssRules(css);
  const navUnderlineRules = rules.filter((rule) =>
    isNavUnderlineSelector(rule.selector),
  );

  const navTransitionRules = navUnderlineRules.filter((rule) =>
    /transition\s*:/.test(rule.body),
  );

  assert.ok(
    navTransitionRules.length > 0,
    "globals.css must include a nav-specific underline transition rule for .root-nav-link (selector with underline-mark or [data-underline-stroke]); nav links currently inherit the shared 700ms .underline-mark rule",
  );

  for (const rule of navTransitionRules) {
    const transitionMatch = rule.body.match(
      /transition\s*:\s*([^;]+)/,
    );
    assert.ok(
      transitionMatch,
      `nav underline rule must declare transition (${rule.selector})`,
    );

    assert.ok(
      !transitionUsesHomeTrace(transitionMatch[1]),
      `nav underline transition must not use var(--underline-trace-ms) or 700ms (${rule.selector}: ${transitionMatch[1].trim()})`,
    );
  }

  const badNavRules = navUnderlineRules.filter((rule) => {
    const transitionMatch = rule.body.match(/transition\s*:\s*([^;]+)/);
    return transitionMatch && transitionUsesHomeTrace(transitionMatch[1]);
  });

  assert.equal(
    badNavRules.length,
    0,
    "no .root-nav-link underline rule may use var(--underline-trace-ms) or 700ms for stroke-dashoffset transition",
  );
});

test(".root-nav-link:focus-visible must not set stroke-dashoffset 0 on underline", () => {
  const css = readSource(globalsCssPath);
  const rules = collectCssRules(css);

  const offending = rules.filter(
    (rule) =>
      isRootNavFocusVisibleUnderlineSelector(rule.selector) &&
      /stroke-dashoffset\s*:\s*0\b/.test(rule.body),
  );

  assert.equal(
    offending.length,
    0,
    offending.length > 0
      ? `.root-nav-link:focus-visible must not draw the underline on keyboard focus; remove stroke-dashoffset: 0 from: ${offending.map((r) => r.selector).join(", ")}`
      : "unexpected pass — focus-visible underline draw should still be present in current CSS",
  );
});

test("root-nav-link hover text color must live inside fine-pointer hover media query", () => {
  const css = readSource(globalsCssPath);
  const outsideFineHover = removeMediaBlocks(css, FINE_HOVER_MEDIA);

  const ungatedHoverColor =
    /\.root-nav-link(?::visited)?:hover\b[\s\S]*?\{[^}]*\bcolor\s*:\s*var\(--root-text\)/.test(
      outsideFineHover,
    ) ||
    /\.root-nav-link:visited:hover\b[\s\S]*?\{[^}]*\bcolor\s*:\s*var\(--root-text\)/.test(
      outsideFineHover,
    );

  assert.ok(
    !ungatedHoverColor,
    ".root-nav-link:hover and .root-nav-link:visited:hover text color must only be set inside @media (hover: hover) and (pointer: fine), not at the top level",
  );

  const insideFineHoverRules = collectCssRules(css).filter(
    (rule) =>
      FINE_HOVER_MEDIA.test(rule.media) &&
      /\.root-nav-link(?::visited)?:hover/.test(rule.selector) &&
      /color\s*:\s*var\(--root-text\)/.test(rule.body),
  );

  assert.ok(
    insideFineHoverRules.length > 0,
    "globals.css must set .root-nav-link (and :visited:hover) text color inside @media (hover: hover) and (pointer: fine)",
  );
});

test("active root-nav-link draws full underline instantly with transition none", () => {
  const css = readSource(globalsCssPath);
  const rules = collectCssRules(css);
  const activeRules = rules.filter((rule) =>
    isRootNavActiveUnderlineSelector(rule.selector),
  );

  assert.ok(
    activeRules.length > 0,
    'globals.css must include a .root-nav-link[data-active="true"] underline rule',
  );

  const activeWithDash = activeRules.filter((rule) =>
    /stroke-dashoffset\s*:\s*0\b/.test(rule.body),
  );

  assert.ok(
    activeWithDash.length > 0,
    '[data-active="true"] must still set stroke-dashoffset: 0 on the nav underline',
  );

  const activeInstant = activeRules.filter((rule) =>
    /transition\s*:\s*none\b/.test(rule.body),
  );

  assert.ok(
    activeInstant.length > 0,
    '[data-active="true"] nav underline must set transition: none so the selected line appears on the first frame',
  );
});

test("sidebar keeps Link for ready nav items", () => {
  const source = readSource(sidebarPath);

  assert.match(
    source,
    /isRootNavItemReady\s*\(\s*item\.slug\s*\)[\s\S]*?<Link[\s\S]*href=\{rootPath\(item\.slug\)\}/,
    "ready items must still use Next Link with rootPath(item.slug) inside the ready branch",
  );
});

test("root-nav-link should use touch-action manipulation", () => {
  const css = readSource(globalsCssPath);
  const rules = collectCssRules(css);
  const navLinkRules = rules.filter((rule) =>
    /^\.root-nav-link\b/.test(rule.selector.trim()),
  );

  const hasTouchAction = navLinkRules.some((rule) =>
    /touch-action\s*:\s*manipulation\b/.test(rule.body),
  );

  assert.ok(
    hasTouchAction,
    ".root-nav-link must include touch-action: manipulation to avoid first-tap hover delay on touch devices",
  );
});
