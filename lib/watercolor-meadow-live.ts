/* ==================================================================
   The painting is the source image itself, converted from reflectance
   into optical density and loaded into the deposited pigment layer.
   Dry, it renders back to the original exactly. Wet, it moves.

   Model: Curtis, Anderson, Seims, Fleischer & Salesin,
   "Computer-Generated Watercolor" (SIGGRAPH 1997), on the GPU.

   Per frame:
     1  splat        water + momentum under the pointer
     2  velocity     semi-Lagrangian advection, ∇h forcing, viscosity, drag
     3  divergence
     4  pressure     Jacobi relaxation, dry paper is a solid boundary
     5  project      subtract ∇p so the wet layer is incompressible
     6  outflow      drain water at the wet boundary  → bloom edges
     7  capillary    saturation seeps into dry paper along its fibres
     8  advect       carry suspended pigment on the velocity field
     9  transfer     deposition ⇄ reflotation, biased by the paper's tooth
    10  render       Beer–Lambert through both pigment layers
================================================================== */

export const PAPER_RGB: readonly [number, number, number] = [
  1.0, 0.99608, 0.98824,
];

export const FLU_W = 640;
export const FLU_H = 360;
export const JACOBI = 24;

export const SPLAT_HOVER_RADIUS = 0.03;
export const SPLAT_HOVER_AMOUNT = 0.016;
export const SPLAT_POUR_RADIUS = 0.075;
export const SPLAT_POUR_AMOUNT = 0.055;

export const COLORS_PLATE_SOURCE = "/root/colors-bouquet.jpg";

export type SplatParamsInput = {
  pointerDown: boolean;
  speed: number;
};

export type SplatParams = {
  radius: number;
  amount: number;
};

export function splatParams({ pointerDown, speed }: SplatParamsInput): SplatParams {
  if (pointerDown) {
    return { radius: SPLAT_POUR_RADIUS, amount: SPLAT_POUR_AMOUNT };
  }
  return {
    radius: 0.03 + 0.014 * Math.exp(-speed * 40),
    amount: SPLAT_HOVER_AMOUNT,
  };
}

export type MountWatercolorMeadowLiveOptions = {
  source?: string;
};

export type WatercolorMeadowLiveHandle = {
  reset: () => void;
  destroy: () => void;
};

type Fbo = {
  tex: WebGLTexture;
  f: WebGLFramebuffer;
  w: number;
  h: number;
  texel: [number, number];
};

type DoubleFbo = {
  read: Fbo;
  write: Fbo;
  swap: () => void;
  w: number;
  h: number;
  texel: [number, number];
};

type Program = {
  use: () => Record<string, WebGLUniformLocation | null>;
};

export function mountWatercolorMeadowLive(
  canvas: HTMLCanvasElement,
  options: MountWatercolorMeadowLiveOptions = {},
): WatercolorMeadowLiveHandle {
  const source = options.source ?? COLORS_PLATE_SOURCE;
  let destroyed = false;
  let booted: WatercolorMeadowLiveHandle | null = null;
  const img = new Image();

  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = reducedQuery.matches;

  function onReducedChange() {
    reducedMotion = reducedQuery.matches;
  }

  reducedQuery.addEventListener("change", onReducedChange);

  img.onload = () => {
    if (destroyed) {
      return;
    }
    try {
      booted = boot(canvas, img, source, () => reducedMotion);
    } catch (error) {
      dryFallback(canvas, source, String((error as Error).message || error));
    }
  };

  img.onerror = () => {
    if (!destroyed) {
      dryFallback(canvas, source, "The image failed to decode.");
    }
  };

  img.src = source;

  return {
    reset() {
      booted?.reset();
    },
    destroy() {
      destroyed = true;
      reducedQuery.removeEventListener("change", onReducedChange);
      booted?.destroy();
      booted = null;
    },
  };
}

function dryFallback(canvas: HTMLCanvasElement, source: string, reason: string) {
  const el = document.createElement("img");
  el.src = source;
  el.alt = reason;
  canvas.replaceWith(el);
}

function boot(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  source: string,
  getReducedMotion: () => boolean,
): WatercolorMeadowLiveHandle {
  const maybeGl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });

  if (!maybeGl) {
    showDryFallback(canvas, source, "This browser has no WebGL2, so the paint can only be shown dry.");
    return { reset: () => {}, destroy: () => {} };
  }

  if (!maybeGl.getExtension("EXT_color_buffer_float")) {
    showDryFallback(
      canvas,
      source,
      "This GPU can't render to float textures, so the paint can only be shown dry.",
    );
    return { reset: () => {}, destroy: () => {} };
  }

  const gl: WebGL2RenderingContext = maybeGl;

  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const budget = Math.min(window.innerWidth < 900 ? 1280 : 1792, maxTex);
  const scale = Math.min(1, budget / img.naturalWidth);
  const PIG_W = Math.round(img.naturalWidth * scale);
  const PIG_H = Math.round(img.naturalHeight * scale);
  const ASPECT = PIG_W / PIG_H;

  const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

  function compile(type: number, src: string) {
    const s = gl.createShader(type);
    if (!s) {
      throw new Error("Failed to create shader.");
    }
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s), src);
      throw new Error("A shader failed to compile; see the console.");
    }
    return s;
  }

  function program(fragSrc: string): Program {
    const p = gl.createProgram();
    if (!p) {
      throw new Error("Failed to create program.");
    }
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(String(gl.getProgramInfoLog(p)));
    }
    const u: Record<string, WebGLUniformLocation | null> = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i += 1) {
      const info = gl.getActiveUniform(p, i);
      if (!info) {
        continue;
      }
      const name = info.name.replace("[0]", "");
      u[name] = gl.getUniformLocation(p, name);
    }
    return {
      use() {
        gl.useProgram(p);
        return u;
      },
    };
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function fbo(w: number, h: number, internal: number, format: number): Fbo {
    const tex = gl.createTexture();
    if (!tex) {
      throw new Error("Failed to create texture.");
    }
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    const f = gl.createFramebuffer();
    if (!f) {
      throw new Error("Failed to create framebuffer.");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, f, w, h, texel: [1 / w, 1 / h] };
  }

  function double(w: number, h: number, internal: number, format: number): DoubleFbo {
    let a = fbo(w, h, internal, format);
    let b = fbo(w, h, internal, format);
    return {
      get read() {
        return a;
      },
      get write() {
        return b;
      },
      swap() {
        const t = a;
        a = b;
        b = t;
      },
      w,
      h,
      get texel() {
        return a.texel;
      },
    };
  }

  let unit = 0;
  function bind(t: WebGLTexture) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    const current = unit;
    unit += 1;
    return current;
  }

  function target(t: Fbo | null) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.f : null);
    gl.viewport(0, 0, t ? t.w : canvas.width, t ? t.h : canvas.height);
  }

  function draw() {
    unit = 0;
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const texPaint = (() => {
    const tex = gl.createTexture();
    if (!tex) {
      throw new Error("Failed to create paint texture.");
    }
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    return tex;
  })();

  const velocity = double(FLU_W, FLU_H, gl.RG16F, gl.RG);
  const pressure = double(FLU_W, FLU_H, gl.R16F, gl.RED);
  const divergence = fbo(FLU_W, FLU_H, gl.R16F, gl.RED);
  const maskBlur = double(FLU_W, FLU_H, gl.R16F, gl.RED);
  const water = double(FLU_W, FLU_H, gl.RGBA16F, gl.RGBA);
  const suspended = double(PIG_W, PIG_H, gl.RGBA16F, gl.RGBA);
  const deposited = double(PIG_W, PIG_H, gl.RGBA16F, gl.RGBA);
  const paperTex = fbo(PIG_W, PIG_H, gl.R16F, gl.RED);
  const mrt = gl.createFramebuffer();
  if (!mrt) {
    throw new Error("Failed to create MRT framebuffer.");
  }

  const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
`;

  const progInit = program(`${HEAD}
uniform sampler2D uPaint;
uniform vec3 uPaperCol;
out vec4 o;
void main(){
  vec3 c = texture(uPaint, vUv).rgb;
  vec3 d = -log(clamp(c / uPaperCol, 0.004, 1.0));
  o = vec4(d, 1.0);
}`);

  const progPaper = program(`${HEAD}
uniform sampler2D uPaint;
uniform vec2 uTexel;
out vec4 o;
float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  float c = lum(texture(uPaint, vUv).rgb);
  float avg = 0.0;
  for (int y = -2; y <= 2; y++)
    for (int x = -2; x <= 2; x++)
      avg += lum(texture(uPaint, vUv + vec2(float(x), float(y)) * uTexel * 1.6).rgb);
  avg /= 25.0;
  float tooth = (c - avg) * 7.0 + 0.5;
  float grit  = hash(floor(vUv / uTexel));
  o = vec4(clamp(mix(tooth, grit, 0.35), 0.0, 1.0), 0.0, 0.0, 1.0);
}`);

  const progClear = program(`${HEAD}
out vec4 o;
void main(){ o = vec4(0.0); }`);

  const progSplat = program(`${HEAD}
uniform sampler2D uWater;
uniform vec2 uPoint, uPrev;
uniform float uRadius, uAmount, uAspect;
out vec4 o;
float segDist(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float t = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length((pa - ba * t) * vec2(uAspect, 1.0));
}
void main(){
  vec4 w = texture(uWater, vUv);
  float d = segDist(vUv, uPrev, uPoint);
  float f = exp(-(d * d) / (uRadius * uRadius));
  w.x += uAmount * f;
  w.y = max(w.y, smoothstep(0.05, 0.45, f));
  w.z = max(w.z, f * 0.9);
  o = w;
}`);

  const progSplatVel = program(`${HEAD}
uniform sampler2D uVel;
uniform vec2 uPoint, uPrev, uDir;
uniform float uRadius, uStrength, uAspect;
out vec4 o;
float segDist(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float t = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length((pa - ba * t) * vec2(uAspect, 1.0));
}
void main(){
  vec2 v = texture(uVel, vUv).xy;
  float d = segDist(vUv, uPrev, uPoint);
  float f = exp(-(d * d) / (uRadius * uRadius));
  o = vec4(v + uDir * uStrength * f, 0.0, 1.0);
}`);

  const progVelocity = program(`${HEAD}
uniform sampler2D uVel, uWater;
uniform vec2 uTexel;
uniform float uDt, uForce, uVisc, uDrag;
out vec4 o;
void main(){
  float m = texture(uWater, vUv).y;
  vec2 v = texture(uVel, vUv).xy;
  vec2 va = texture(uVel, vUv - uDt * v).xy;
  float hL = texture(uWater, vUv - vec2(uTexel.x, 0.0)).x;
  float hR = texture(uWater, vUv + vec2(uTexel.x, 0.0)).x;
  float hB = texture(uWater, vUv - vec2(0.0, uTexel.y)).x;
  float hT = texture(uWater, vUv + vec2(0.0, uTexel.y)).x;
  vec2 nv = va - uForce * vec2(hR - hL, hT - hB) * 0.5 * uDt;
  vec2 lap = (texture(uVel, vUv - vec2(uTexel.x, 0.0)).xy
            + texture(uVel, vUv + vec2(uTexel.x, 0.0)).xy
            + texture(uVel, vUv - vec2(0.0, uTexel.y)).xy
            + texture(uVel, vUv + vec2(0.0, uTexel.y)).xy) * 0.25 - v;
  nv += uVisc * lap;
  nv *= (1.0 - uDrag * uDt);
  nv *= smoothstep(0.02, 0.35, m);
  o = vec4(clamp(nv, -1.5, 1.5), 0.0, 1.0);
}`);

  const progDivergence = program(`${HEAD}
uniform sampler2D uVel, uWater;
uniform vec2 uTexel;
out vec4 o;
void main(){
  vec2 vL = texture(uVel, vUv - vec2(uTexel.x, 0.0)).xy;
  vec2 vR = texture(uVel, vUv + vec2(uTexel.x, 0.0)).xy;
  vec2 vB = texture(uVel, vUv - vec2(0.0, uTexel.y)).xy;
  vec2 vT = texture(uVel, vUv + vec2(0.0, uTexel.y)).xy;
  float mL = texture(uWater, vUv - vec2(uTexel.x, 0.0)).y;
  float mR = texture(uWater, vUv + vec2(uTexel.x, 0.0)).y;
  float mB = texture(uWater, vUv - vec2(0.0, uTexel.y)).y;
  float mT = texture(uWater, vUv + vec2(0.0, uTexel.y)).y;
  o = vec4(0.5 * ((vR.x * mR - vL.x * mL) + (vT.y * mT - vB.y * mB)), 0.0, 0.0, 1.0);
}`);

  const progJacobi = program(`${HEAD}
uniform sampler2D uP, uDiv, uWater;
uniform vec2 uTexel;
out vec4 o;
void main(){
  float c = texture(uP, vUv).x;
  float l = texture(uP, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uP, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uP, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uP, vUv + vec2(0.0, uTexel.y)).x;
  float mL = texture(uWater, vUv - vec2(uTexel.x, 0.0)).y;
  float mR = texture(uWater, vUv + vec2(uTexel.x, 0.0)).y;
  float mB = texture(uWater, vUv - vec2(0.0, uTexel.y)).y;
  float mT = texture(uWater, vUv + vec2(0.0, uTexel.y)).y;
  l = mix(c, l, smoothstep(0.02, 0.3, mL));
  r = mix(c, r, smoothstep(0.02, 0.3, mR));
  b = mix(c, b, smoothstep(0.02, 0.3, mB));
  t = mix(c, t, smoothstep(0.02, 0.3, mT));
  o = vec4((l + r + b + t - texture(uDiv, vUv).x) * 0.25, 0.0, 0.0, 1.0);
}`);

  const progProject = program(`${HEAD}
uniform sampler2D uP, uVel, uWater;
uniform vec2 uTexel;
out vec4 o;
void main(){
  float l = texture(uP, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uP, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uP, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uP, vUv + vec2(0.0, uTexel.y)).x;
  vec2 v = texture(uVel, vUv).xy - vec2(r - l, t - b) * 0.5;
  o = vec4(v * smoothstep(0.02, 0.35, texture(uWater, vUv).y), 0.0, 1.0);
}`);

  const progBlurMask = program(`${HEAD}
uniform sampler2D uSrc;
uniform vec2 uDir;
uniform int uChannel;
out vec4 o;
void main(){
  float w[5]; w[0]=0.0702; w[1]=0.2445; w[2]=0.3706; w[3]=0.2445; w[4]=0.0702;
  float s = 0.0;
  for (int i = 0; i < 5; i++){
    vec4 t = texture(uSrc, vUv + uDir * float(i - 2));
    s += (uChannel == 0 ? t.y : t.x) * w[i];
  }
  o = vec4(s, 0.0, 0.0, 1.0);
}`);

  const progWater = program(`${HEAD}
uniform sampler2D uWater, uMaskBlur, uPaper;
uniform vec2 uTexel;
uniform float uDt, uOutflow, uEvap, uCapSpeed, uCapCap, uSigma;
out vec4 o;
void main(){
  vec4 w = texture(uWater, vUv);
  float h = w.x, m = w.y, s = w.z;
  float rho = texture(uPaper, vUv).r;
  h -= uOutflow * (1.0 - texture(uMaskBlur, vUv).x) * m * uDt;
  float cap = uCapCap * (0.35 + 0.65 * rho);
  vec2 offs[4] = vec2[4](vec2(-uTexel.x,0.0), vec2(uTexel.x,0.0), vec2(0.0,-uTexel.y), vec2(0.0,uTexel.y));
  float in_ = 0.0;
  for (int i = 0; i < 4; i++) in_ += max(0.0, texture(uWater, vUv + offs[i]).z - s) * 0.25;
  s = min(s + in_ * uCapSpeed * uDt + h * 0.06 * uDt, cap);
  h = max(0.0, h - uEvap * uDt);
  s = max(0.0, s - uEvap * 0.6 * uDt);
  m = max(smoothstep(uSigma, uSigma * 2.2, s), smoothstep(0.0, 0.02, h));
  o = vec4(h, m, s, 1.0);
}`);

  const progAdvect = program(`${HEAD}
uniform sampler2D uSusp, uVel, uWater;
uniform vec2 uTexel;
uniform float uDt, uDiffuse;
out vec4 o;
void main(){
  float m = texture(uWater, vUv).y;
  vec2 v = texture(uVel, vUv).xy;
  vec4 p = mix(texture(uSusp, vUv), texture(uSusp, vUv - uDt * v), smoothstep(0.02, 0.3, m));
  vec4 lap = (texture(uSusp, vUv - vec2(uTexel.x, 0.0))
            + texture(uSusp, vUv + vec2(uTexel.x, 0.0))
            + texture(uSusp, vUv - vec2(0.0, uTexel.y))
            + texture(uSusp, vUv + vec2(0.0, uTexel.y))) * 0.25 - p;
  o = max(p + lap * uDiffuse * m, vec4(0.0));
}`);

  const progTransfer = program(`${HEAD}
uniform sampler2D uSusp, uDep, uWater, uPaper;
uniform float uDt, uDeposit, uLift, uGranule;
layout(location = 0) out vec4 oSusp;
layout(location = 1) out vec4 oDep;
void main(){
  vec4 susp = texture(uSusp, vUv);
  vec4 dep  = texture(uDep, vUv);
  vec4 w    = texture(uWater, vUv);
  float rho = texture(uPaper, vUv).r;
  float wetness = smoothstep(0.02, 0.35, w.y);
  float deep    = clamp(w.x * 5.0, 0.0, 1.0);
  float down = uDeposit * (0.25 + 0.75 * (1.0 - deep)) * (1.0 - (1.0 - rho) * uGranule) * uDt;
  float up   = uLift * wetness * deep * (1.0 + (rho - 1.0) * uGranule) * uDt;
  vec4 settle = susp * clamp(down, 0.0, 1.0);
  vec4 lift   = dep  * clamp(up, 0.0, 1.0);
  oSusp = max(susp - settle + lift, vec4(0.0));
  oDep  = max(dep  + settle - lift, vec4(0.0));
}`);

  const progRender = program(`${HEAD}
uniform sampler2D uDep, uSusp, uWater;
uniform vec3 uPaperCol;
uniform vec2 uTexel;
out vec4 o;
void main(){
  vec3 d = texture(uDep, vUv).rgb + texture(uSusp, vUv).rgb;
  vec4 w = texture(uWater, vUv);
  vec3 col = uPaperCol * exp(-d);
  float wet = smoothstep(0.02, 0.4, w.y) * clamp(w.x * 4.0, 0.0, 1.0);
  col *= 1.0 - 0.09 * wet;
  float hL = texture(uWater, vUv - vec2(uTexel.x, 0.0)).x;
  float hR = texture(uWater, vUv + vec2(uTexel.x, 0.0)).x;
  float hB = texture(uWater, vUv - vec2(0.0, uTexel.y)).x;
  float hT = texture(uWater, vUv + vec2(0.0, uTexel.y)).x;
  vec3 n = normalize(vec3(hL - hR, hB - hT, 0.06));
  col += pow(max(dot(n, normalize(vec3(-0.4, 0.5, 0.75))), 0.0), 24.0) * 0.16 * wet;
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}`);

  let wetEnergy = 0;

  function reset() {
    let u = progInit.use();
    gl.uniform1i(u.uPaint, bind(texPaint));
    gl.uniform3fv(u.uPaperCol, PAPER_RGB);
    target(deposited.write);
    draw();
    deposited.swap();

    progClear.use();
    for (const f of [
      suspended.write,
      suspended.read,
      water.write,
      water.read,
      velocity.write,
      velocity.read,
      pressure.write,
      pressure.read,
    ]) {
      target(f);
      draw();
    }
    wetEnergy = 0;
  }

  function buildPaper() {
    const u = progPaper.use();
    gl.uniform1i(u.uPaint, bind(texPaint));
    gl.uniform2fv(u.uTexel, paperTex.texel);
    target(paperTex);
    draw();
  }

  const pointer = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, moved: false, down: false };

  function uvFrom(event: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    return [
      (event.clientX - r.left) / r.width,
      1 - (event.clientY - r.top) / r.height,
    ] as const;
  }

  function splat() {
    const dx = pointer.x - pointer.px;
    const dy = pointer.y - pointer.py;
    const speed = Math.hypot(dx, dy);
    const { radius, amount } = splatParams({ pointerDown: pointer.down, speed });

    let u = progSplat.use();
    gl.uniform1i(u.uWater, bind(water.read.tex));
    gl.uniform2f(u.uPoint, pointer.x, pointer.y);
    gl.uniform2f(u.uPrev, pointer.px, pointer.py);
    gl.uniform1f(u.uRadius, radius);
    gl.uniform1f(u.uAmount, amount);
    gl.uniform1f(u.uAspect, ASPECT);
    target(water.write);
    draw();
    water.swap();

    u = progSplatVel.use();
    gl.uniform1i(u.uVel, bind(velocity.read.tex));
    gl.uniform2f(u.uPoint, pointer.x, pointer.y);
    gl.uniform2f(u.uPrev, pointer.px, pointer.py);
    gl.uniform2f(u.uDir, dx * 4.0, dy * 4.0);
    gl.uniform1f(u.uRadius, radius);
    gl.uniform1f(u.uStrength, 0.9);
    gl.uniform1f(u.uAspect, ASPECT);
    target(velocity.write);
    draw();
    velocity.swap();

    wetEnergy = Math.min(1.6, wetEnergy + amount * (pointer.down ? 6 : 2.2));
  }

  function step(dt: number) {
    gl.disable(gl.BLEND);

    let u = progVelocity.use();
    gl.uniform1i(u.uVel, bind(velocity.read.tex));
    gl.uniform1i(u.uWater, bind(water.read.tex));
    gl.uniform2fv(u.uTexel, velocity.texel);
    gl.uniform1f(u.uDt, dt);
    gl.uniform1f(u.uForce, 5.2);
    gl.uniform1f(u.uVisc, 0.22);
    gl.uniform1f(u.uDrag, 1.35);
    target(velocity.write);
    draw();
    velocity.swap();

    u = progDivergence.use();
    gl.uniform1i(u.uVel, bind(velocity.read.tex));
    gl.uniform1i(u.uWater, bind(water.read.tex));
    gl.uniform2fv(u.uTexel, velocity.texel);
    target(divergence);
    draw();

    progClear.use();
    target(pressure.write);
    draw();
    pressure.swap();

    u = progJacobi.use();
    for (let i = 0; i < JACOBI; i += 1) {
      gl.uniform1i(u.uP, bind(pressure.read.tex));
      gl.uniform1i(u.uDiv, bind(divergence.tex));
      gl.uniform1i(u.uWater, bind(water.read.tex));
      gl.uniform2fv(u.uTexel, pressure.texel);
      target(pressure.write);
      draw();
      pressure.swap();
    }

    u = progProject.use();
    gl.uniform1i(u.uP, bind(pressure.read.tex));
    gl.uniform1i(u.uVel, bind(velocity.read.tex));
    gl.uniform1i(u.uWater, bind(water.read.tex));
    gl.uniform2fv(u.uTexel, velocity.texel);
    target(velocity.write);
    draw();
    velocity.swap();

    u = progBlurMask.use();
    gl.uniform1i(u.uSrc, bind(water.read.tex));
    gl.uniform2f(u.uDir, water.texel[0] * 2.5, 0);
    gl.uniform1i(u.uChannel, 0);
    target(maskBlur.write);
    draw();
    maskBlur.swap();
    gl.uniform1i(u.uSrc, bind(maskBlur.read.tex));
    gl.uniform2f(u.uDir, 0, water.texel[1] * 2.5);
    gl.uniform1i(u.uChannel, 1);
    target(maskBlur.write);
    draw();
    maskBlur.swap();

    u = progWater.use();
    gl.uniform1i(u.uWater, bind(water.read.tex));
    gl.uniform1i(u.uMaskBlur, bind(maskBlur.read.tex));
    gl.uniform1i(u.uPaper, bind(paperTex.tex));
    gl.uniform2fv(u.uTexel, water.texel);
    gl.uniform1f(u.uDt, dt);
    gl.uniform1f(u.uOutflow, 0.22);
    gl.uniform1f(u.uEvap, 0.055);
    gl.uniform1f(u.uCapSpeed, 1.7);
    gl.uniform1f(u.uCapCap, 0.5);
    gl.uniform1f(u.uSigma, 0.11);
    target(water.write);
    draw();
    water.swap();

    u = progAdvect.use();
    gl.uniform1i(u.uSusp, bind(suspended.read.tex));
    gl.uniform1i(u.uVel, bind(velocity.read.tex));
    gl.uniform1i(u.uWater, bind(water.read.tex));
    gl.uniform2fv(u.uTexel, suspended.texel);
    gl.uniform1f(u.uDt, dt);
    gl.uniform1f(u.uDiffuse, 0.16);
    target(suspended.write);
    draw();
    suspended.swap();

    u = progTransfer.use();
    gl.uniform1i(u.uSusp, bind(suspended.read.tex));
    gl.uniform1i(u.uDep, bind(deposited.read.tex));
    gl.uniform1i(u.uWater, bind(water.read.tex));
    gl.uniform1i(u.uPaper, bind(paperTex.tex));
    gl.uniform1f(u.uDt, dt);
    gl.uniform1f(u.uDeposit, 2.0);
    gl.uniform1f(u.uLift, 1.4);
    gl.uniform1f(u.uGranule, 0.85);
    gl.bindFramebuffer(gl.FRAMEBUFFER, mrt);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      suspended.write.tex,
      0,
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT1,
      gl.TEXTURE_2D,
      deposited.write.tex,
      0,
    );
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.viewport(0, 0, PIG_W, PIG_H);
    draw();
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    suspended.swap();
    deposited.swap();

    wetEnergy *= 0.985 ** (dt * 60);
  }

  function present() {
    const u = progRender.use();
    gl.uniform1i(u.uDep, bind(deposited.read.tex));
    gl.uniform1i(u.uSusp, bind(suspended.read.tex));
    gl.uniform1i(u.uWater, bind(water.read.tex));
    gl.uniform3fv(u.uPaperCol, PAPER_RGB);
    gl.uniform2fv(u.uTexel, water.texel);
    target(null);
    draw();
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    present();
  }

  let frameRef = 0;
  let last = performance.now();

  function loop(now: number) {
    const dt = Math.min(1 / 30, (now - last) / 1000);
    last = now;

    const reducedMotion = getReducedMotion();
    if (!reducedMotion) {
      if (pointer.moved || pointer.down) {
        splat();
        pointer.moved = false;
      }
      if (!pointer.down) {
        pointer.px = pointer.x;
        pointer.py = pointer.y;
      }
      if (wetEnergy > 0.0015) {
        step(dt);
      }
    }

    present();
    frameRef = requestAnimationFrame(loop);
  }

  function onPointerMove(event: PointerEvent) {
    const [x, y] = uvFrom(event);
    pointer.px = pointer.x;
    pointer.py = pointer.y;
    pointer.x = x;
    pointer.y = y;
    pointer.moved = true;
  }

  function onPointerDown(event: PointerEvent) {
    const [x, y] = uvFrom(event);
    pointer.px = pointer.x = x;
    pointer.py = pointer.y = y;
    pointer.down = true;
    pointer.moved = true;
    canvas.setPointerCapture(event.pointerId);
  }

  function onPointerUp() {
    pointer.down = false;
  }

  function onKeyDown(e: KeyboardEvent) {
    const { key } = e;
    if (key === "r" || e.key === "R") {
      reset();
    }
  }

  buildPaper();
  reset();
  resize();

  window.addEventListener("resize", resize);
  canvas.addEventListener("pointermove", onPointerMove, { passive: true });
  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("keydown", onKeyDown);

  frameRef = requestAnimationFrame(loop);

  return {
    reset,
    destroy() {
      cancelAnimationFrame(frameRef);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    },
  };
}

function showDryFallback(canvas: HTMLCanvasElement, source: string, reason: string) {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = source;
    return;
  }

  const el = document.createElement("img");
  el.src = source;
  el.alt = reason;
  canvas.replaceWith(el);
}
