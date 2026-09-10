import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const enginePath = path.join(root, "lib", "watercolor-meadow-live.ts");

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function callEngine(script) {
  const moduleUrl = pathToFileURL(enginePath).href;
  const fullScript = `
    import * as engine from ${JSON.stringify(moduleUrl)};
    ${script}
  `;

  const result = spawnSync(
    "node",
    ["--experimental-strip-types", "--input-type=module", "-e", fullScript],
    { encoding: "utf8", cwd: root },
  );

  if (result.status !== 0) {
    return { ok: false, error: result.stderr || result.stdout };
  }

  return { ok: true, value: JSON.parse(result.stdout.trim()) };
}

test("lib/watercolor-meadow-live.ts exists", () => {
  assert.ok(
    fs.existsSync(enginePath),
    "lib/watercolor-meadow-live.ts must exist",
  );
});

test("engine uses Curtis SIGGRAPH 1997 watercolor model (not 2D JPEG blur soak)", () => {
  const source = readSource(enginePath);

  assert.match(
    source,
    /Curtis|SIGGRAPH\s*1997|Computer-Generated Watercolor/i,
    "engine must reference the Curtis et al. SIGGRAPH 1997 watercolor model",
  );
  assert.match(
    source,
    /Beer[\s-]*Lambert|exp\s*\(\s*-\s*d\s*\)/,
    "render stage must use Beer–Lambert exp(-d)",
  );
  assert.doesNotMatch(
    source,
    /globalCompositeOperation\s*=\s*["']source-over["'][\s\S]{0,200}filter\s*=\s*`blur/,
    "engine must not implement wet paint as a blurred JPEG composite",
  );
});

test("engine exports fluid and paper constants from the HTML reference", () => {
  const result = callEngine(`
    console.log(JSON.stringify({
      paperRgb: engine.PAPER_RGB,
      fluW: engine.FLU_W,
      fluH: engine.FLU_H,
      jacobi: engine.JACOBI,
    }));
  `);

  assert.ok(result.ok, `constants must be importable: ${result.error ?? ""}`);
  assert.deepEqual(result.value.paperRgb, [1.0, 0.99608, 0.98824]);
  assert.equal(result.value.fluW, 640);
  assert.equal(result.value.fluH, 360);
  assert.equal(result.value.jacobi, 24);
});

test("engine exports splat hover vs pour parameters from the HTML reference", () => {
  const result = callEngine(`
    console.log(JSON.stringify({
      hoverRadius: engine.SPLAT_HOVER_RADIUS,
      hoverAmount: engine.SPLAT_HOVER_AMOUNT,
      pourRadius: engine.SPLAT_POUR_RADIUS,
      pourAmount: engine.SPLAT_POUR_AMOUNT,
    }));
  `);

  assert.ok(result.ok, `splat constants must be importable: ${result.error ?? ""}`);
  assert.equal(result.value.hoverRadius, 0.03);
  assert.equal(result.value.hoverAmount, 0.016);
  assert.equal(result.value.pourRadius, 0.075);
  assert.equal(result.value.pourAmount, 0.055);
});

test("splatParams returns pour radius/amount when pointer is down", () => {
  const result = callEngine(`
    const out = engine.splatParams({ pointerDown: true, speed: 0 });
    console.log(JSON.stringify(out));
  `);

  assert.ok(result.ok, `splatParams must be callable: ${result.error ?? ""}`);
  assert.equal(result.value.radius, 0.075);
  assert.equal(result.value.amount, 0.055);
});

test("splatParams returns lingering hover radius when pointer is up and still", () => {
  const result = callEngine(`
    const out = engine.splatParams({ pointerDown: false, speed: 0 });
    console.log(JSON.stringify(out));
  `);

  assert.ok(result.ok, `splatParams must be callable: ${result.error ?? ""}`);
  // HTML: 0.030 + 0.014 * exp(-speed * 40). Speed 0 → 0.044 (wide puddle).
  assert.ok(
    Math.abs(result.value.radius - 0.044) < 0.002,
    `lingering hover radius must be about 0.044 (got ${result.value.radius})`,
  );
  assert.equal(result.value.amount, 0.016);
});

test("splatParams returns a smaller hover radius on a fast stroke", () => {
  const result = callEngine(`
    const out = engine.splatParams({ pointerDown: false, speed: 1 });
    console.log(JSON.stringify(out));
  `);

  assert.ok(result.ok, `splatParams must be callable: ${result.error ?? ""}`);
  assert.ok(
    Math.abs(result.value.radius - 0.03) < 0.002,
    `fast hover radius must be about 0.030 (got ${result.value.radius})`,
  );
  assert.equal(result.value.amount, 0.016);
});

test("engine SOURCE defaults to /root/colors-bouquet.jpg and embeds no data URI", () => {
  const source = readSource(enginePath);

  assert.match(
    source,
    /\/root\/colors-bouquet\.jpg/,
    "engine must load /root/colors-bouquet.jpg",
  );
  assert.doesNotMatch(
    source,
    /data:image\/jpeg/i,
    "engine must not embed a data:image/jpeg URI",
  );

  const result = callEngine(`
    console.log(JSON.stringify({ source: engine.COLORS_PLATE_SOURCE }));
  `);
  assert.ok(result.ok, `COLORS_PLATE_SOURCE must be importable: ${result.error ?? ""}`);
  assert.equal(result.value.source, "/root/colors-bouquet.jpg");
});

test("init shader converts reflectance to density with -log", () => {
  const source = readSource(enginePath);

  assert.match(
    source,
    /-log\s*\(/,
    "pigment init must convert reflectance to optical density via -log",
  );
  assert.match(
    source,
    /0\.99608|0\.98824/,
    "PAPER_RGB white point must be used when converting reflectance",
  );
});

test("engine source includes the GPU pipeline stages from the HTML reference", () => {
  const source = readSource(enginePath);
  const stages = [
    "splat",
    "velocity",
    "divergence",
    "Jacobi",
    "project",
    "outflow",
    "capillary",
    "advect",
    "transfer",
  ];

  for (const stage of stages) {
    assert.match(
      source,
      new RegExp(stage, "i"),
      `engine must include ${stage} pipeline stage`,
    );
  }
});

test("engine requests webgl2 and EXT_color_buffer_float", () => {
  const source = readSource(enginePath);

  assert.match(source, /webgl2/i, "engine must request a webgl2 context");
  assert.match(
    source,
    /EXT_color_buffer_float/,
    "engine must require EXT_color_buffer_float",
  );
});

test("engine exports mountWatercolorMeadowLive with reset and destroy", () => {
  const source = readSource(enginePath);

  assert.match(
    source,
    /export function mountWatercolorMeadowLive\s*\(/,
    "engine must export mountWatercolorMeadowLive",
  );
  assert.match(
    source,
    /reset\s*\(\s*\)/,
    "engine must expose reset() for drying pigment back to the source image",
  );
  assert.match(
    source,
    /destroy\s*\(\s*\)/,
    "engine must expose destroy() for unmount cleanup",
  );
});

test("engine handles R / r keyboard reset", () => {
  const source = readSource(enginePath);

  assert.match(
    source,
    /key\s*===\s*["']r["']\s*\|\|\s*e\.key\s*===\s*["']R["']/,
    "engine must reset deposited pigment on R or r",
  );
});

test("engine respects prefers-reduced-motion (stays dry, no splat/step)", () => {
  const source = readSource(enginePath);

  assert.match(
    source,
    /prefers-reduced-motion:\s*reduce/,
    "engine must read prefers-reduced-motion",
  );
  assert.match(
    source,
    /reducedMotion|reduced\s*motion/i,
    "engine must branch on reduced motion",
  );
  assert.match(
    source,
    /reduced[\s\S]{0,240}splat|splat[\s\S]{0,240}reduced/i,
    "reduced motion must skip splat interaction",
  );
});

test("engine falls back to dry JPEG when WebGL2 or float buffers are unavailable", () => {
  const source = readSource(enginePath);

  assert.match(
    source,
    /fallback|showDry|dryFallback/i,
    "engine must implement a dry-image fallback path",
  );
  assert.match(
    source,
    /!gl\b|no WebGL2|EXT_color_buffer_float/,
    "fallback must trigger when WebGL2 or float render targets are missing",
  );
  assert.match(
    source,
    /drawImage|HTMLImageElement|<img/,
    "fallback must show the source JPEG dry via img or 2d drawImage",
  );
});

test("mountWatercolorMeadowLive is exported for PulseField plate scenes", () => {
  const result = callEngine(`
    console.log(JSON.stringify({
      hasMount: typeof engine.mountWatercolorMeadowLive === "function",
    }));
  `);

  assert.ok(result.ok, `mountWatercolorMeadowLive must import: ${result.error ?? ""}`);
  assert.equal(result.value.hasMount, true);
});

/** GLSL body of progRender only (not advection/capillary shaders that also sample hL–hT). */
function extractProgRenderShader(source) {
  const match = source.match(/const progRender = program\(`[\s\S]*?`\)/);
  assert.ok(match, "engine must define const progRender = program(...)");
  return match[0];
}

test("progRender shader uses Beer–Lambert and wet darkening without additive specular", () => {
  const render = extractProgRenderShader(readSource(enginePath));

  assert.match(
    render,
    /uPaperCol\s*\*\s*exp\s*\(\s*-\s*d\s*\)/,
    "progRender must use Beer–Lambert: paper * exp(-d)",
  );
  assert.match(
    render,
    /col\s*\*=\s*1\.0\s*-\s*0\.09\s*\*\s*wet/,
    "progRender must darken wet paper: col *= 1.0 - 0.09 * wet",
  );
  assert.doesNotMatch(
    render,
    /col\s*\+=\s*pow\s*\(\s*max\s*\(\s*dot\s*\(/,
    "progRender must not add a Phong specular: col += pow(max(dot(...",
  );
  assert.doesNotMatch(
    render,
    /normalize\s*\(\s*vec3\s*\(\s*hL\s*-\s*hR\s*,\s*hB\s*-\s*hT/,
    "progRender must not build water-height normals for lighting",
  );
  assert.doesNotMatch(
    render,
    /col\s*\+=[\s\S]{0,120}wet/,
    "progRender must not add col += highlight terms involving wet",
  );
});

test("progRender shader does not sample water height for a specular highlight", () => {
  const render = extractProgRenderShader(readSource(enginePath));

  assert.doesNotMatch(
    render,
    /float\s+hL\s*=\s*texture\s*\(\s*uWater/,
    "progRender must not sample hL from uWater for specular normals",
  );
  assert.doesNotMatch(
    render,
    /pow\s*\(\s*max\s*\(\s*dot\s*\([^)]+\)\s*,\s*0\.0\s*\)\s*,\s*\d+/,
    "progRender must not use pow(max(dot(...), 0.0), exponent) specular",
  );
});
