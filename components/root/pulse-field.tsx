"use client";

import { useEffect, useRef } from "react";
import { chartSemantic } from "@/lib/pulse-tokens";
import {
  FIELD_INKS,
  type FieldInk,
  type FieldMark,
  type PulseFieldScene,
} from "@/lib/pulse-field-scene";
import {
  accumulateWetness,
  createWetnessMap,
  type WetnessMap,
} from "@/lib/pulse-wetness";
import { PulsePaint } from "./pulse-paint";

const PAPER = chartSemantic("plot-paper").hex;
const INK_HEX: Record<FieldInk, string> = Object.fromEntries(
  FIELD_INKS.map((name) => [name, chartSemantic(name).hex]),
) as Record<FieldInk, string>;

type PulseFieldProps = {
  scene: PulseFieldScene;
  label: string;
  className?: string;
};

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function markSize(mark: FieldMark, width: number, height: number) {
  const minSide = Math.min(width, height);
  return {
    rx: (mark.rx ?? 0) * width,
    ry: (mark.ry ?? 0) * height,
    r: (mark.r ?? 0) * minSide,
    h: (mark.h ?? 0) * height,
  };
}

function plateReady(img: HTMLImageElement | null) {
  return Boolean(img?.complete && img.naturalWidth > 0);
}

function coverPlateRect(
  img: HTMLImageElement,
  width: number,
  height: number,
  scale: number,
) {
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = width / height;
  if (imgAspect > canvasAspect) {
    const drawH = height * scale;
    const drawW = drawH * imgAspect;
    return {
      x: (width - drawW) / 2,
      y: (height - drawH) / 2,
      w: drawW,
      h: drawH,
    };
  }
  const drawW = width * scale;
  const drawH = drawW / imgAspect;
  return {
    x: (width - drawW) / 2,
    y: (height - drawH) / 2,
    w: drawW,
    h: drawH,
  };
}

function paintPlate(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  mode: "dry" | "wet",
) {
  const { width, height } = ctx.canvas;
  const wet = mode === "wet";
  const scale = wet ? 1.16 : 1;
  const opacityMul = wet ? 0.58 : 1;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);

  if (!plateReady(img)) {
    return;
  }

  if (wet) {
    ctx.filter = `blur(${Math.max(8, width / 110)}px)`;
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = opacityMul;
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  const rect = coverPlateRect(img!, width, height, scale);
  ctx.drawImage(img!, rect.x, rect.y, rect.w, rect.h);
  ctx.globalAlpha = 1;
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
}

function paintScene(
  ctx: CanvasRenderingContext2D,
  scene: PulseFieldScene,
  mode: "dry" | "wet",
  plateImage: HTMLImageElement | null = null,
) {
  const { width, height } = ctx.canvas;
  const wet = mode === "wet";
  const scale = wet ? 1.16 : 1;
  const opacityMul = wet ? 0.58 : 1;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);

  if (scene.plate) {
    paintPlate(ctx, plateImage, mode);
    return;
  }

  if (wet) {
    ctx.filter = `blur(${Math.max(8, width / 110)}px)`;
  }

  ctx.globalCompositeOperation = "multiply";

  for (const mark of scene.layers) {
    if (mark.y < scene.air) {
      continue;
    }
    const cx = mark.x * width;
    const cy = mark.y * height;
    const size = markSize(mark, width, height);
    const rotate = ((mark.rotate ?? 0) * Math.PI) / 180;
    ctx.fillStyle = INK_HEX[mark.ink];
    ctx.strokeStyle = INK_HEX[mark.ink];
    ctx.globalAlpha = mark.opacity * opacityMul;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotate);
    ctx.scale(scale, scale);

    if (mark.kind === "stem") {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -size.h);
      ctx.lineWidth = Math.max(1, width / 480);
      ctx.lineCap = "round";
      ctx.stroke();
    } else if (mark.kind === "dab") {
      ctx.beginPath();
      ctx.ellipse(0, 0, size.r, size.r * 0.86, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, size.rx, size.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(size.rx * 0.12, size.ry * 0.08, size.rx * 0.82, size.ry * 0.88, 0.12, 0, Math.PI * 2);
      ctx.fill();
      if (!wet) {
        ctx.globalAlpha = mark.opacity * 0.4;
        ctx.beginPath();
        ctx.ellipse(2, 1.2, size.rx * 0.9, size.ry * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  ctx.globalAlpha = 1;
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
}

function writeWetnessMask(ctx: CanvasRenderingContext2D, map: WetnessMap) {
  const image = ctx.createImageData(map.width, map.height);
  const data = image.data;
  for (let i = 0; i < map.cells.length; i += 1) {
    const wetness = map.cells[i];
    const alpha = Math.round(Math.pow(wetness, 0.62) * 255);
    const offset = i * 4;
    data[offset] = 255;
    data[offset + 1] = 255;
    data[offset + 2] = 255;
    data[offset + 3] = alpha;
  }
  ctx.putImageData(image, 0, 0);
}

export function PulseField({ scene, label, className }: PulseFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const plateImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const surface: HTMLCanvasElement = canvas;
    let plateImage: HTMLImageElement | null = null;

    if (scene.plate) {
      plateImage = new Image();
      plateImageRef.current = plateImage;
      plateImage.src = scene.plate;
      const onPlateReady = () => {
        sizeCanvases();
      };
      plateImage.onload = onPlateReady;
      void plateImage.decode?.().then(onPlateReady).catch(() => {});
    } else {
      plateImageRef.current = null;
    }

    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reducedQuery.matches;
    let hovering = false;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let lastTime = 0;
    let dry: HTMLCanvasElement | null = null;
    let wet: HTMLCanvasElement | null = null;
    let mask: HTMLCanvasElement | null = null;
    let wetLayer: HTMLCanvasElement | null = null;
    let map: WetnessMap | null = null;
    let hasWetness = false;

    const view = surface.getContext("2d", { alpha: false });
    if (!view) {
      return;
    }

    function sizeCanvases() {
      const rect = surface.getBoundingClientRect();
      const cssW = Math.max(1, rect.width);
      const cssH = Math.max(1, rect.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(cssW * dpr));
      const height = Math.max(1, Math.round(cssH * dpr));

      surface.width = width;
      surface.height = height;

      dry = makeCanvas(width, height);
      wet = makeCanvas(width, height);
      wetLayer = makeCanvas(width, height);
      const dryCtx = dry.getContext("2d", { alpha: false });
      const wetCtx = wet.getContext("2d", { alpha: false });
      if (!dryCtx || !wetCtx) {
        return;
      }

      paintScene(dryCtx, scene, "dry", plateImage);
      paintScene(wetCtx, scene, "wet", plateImage);

      const mapW = Math.max(32, Math.round(cssW / 4));
      const mapH = Math.max(16, Math.round(cssH / 4));
      map = createWetnessMap(mapW, mapH);
      mask = makeCanvas(mapW, mapH);
      hasWetness = false;
      lastTime = 0;
      composite();
    }

    function composite() {
      if (!dry || !view) {
        return;
      }

      const width = surface.width;
      const height = surface.height;
      view.setTransform(1, 0, 0, 1, 0, 0);
      view.globalCompositeOperation = "source-over";
      view.drawImage(dry, 0, 0, width, height);

      if (reduced || !hasWetness || !wet || !mask || !wetLayer || !map) {
        return;
      }

      const maskCtx = mask.getContext("2d", { alpha: true });
      const layerCtx = wetLayer.getContext("2d", { alpha: true });
      if (!maskCtx || !layerCtx) {
        return;
      }

      writeWetnessMask(maskCtx, map);
      layerCtx.clearRect(0, 0, width, height);
      layerCtx.globalCompositeOperation = "source-over";
      layerCtx.drawImage(wet, 0, 0, width, height);
      layerCtx.globalCompositeOperation = "destination-in";
      layerCtx.imageSmoothingEnabled = true;
      layerCtx.imageSmoothingQuality = "high";
      layerCtx.drawImage(mask, 0, 0, width, height);
      layerCtx.globalCompositeOperation = "source-over";
      view.drawImage(wetLayer, 0, 0, width, height);
    }

    function brushRadius() {
      if (!map) {
        return 4;
      }
      return Math.max(6, map.width * 0.08);
    }

    function tick(now: number) {
      frameRef.current = 0;
      if (!hovering || reduced || !map) {
        return;
      }

      const dt = lastTime === 0 ? 16 : Math.min(50, now - lastTime);
      lastTime = now;
      const result = accumulateWetness(map, pointerX, pointerY, dt, {
        radius: brushRadius(),
      });
      if (result.changed) {
        hasWetness = true;
        composite();
      }

      if (hovering && !reduced) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    function startLoop() {
      if (reduced || frameRef.current) {
        return;
      }
      lastTime = 0;
      frameRef.current = requestAnimationFrame(tick);
    }

    function pointFromEvent(event: PointerEvent) {
      const rect = surface.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width;
      pointerY = (event.clientY - rect.top) / rect.height;
    }

    function onPointerEnter(event: PointerEvent) {
      if (reduced) {
        return;
      }
      hovering = true;
      pointFromEvent(event);
      startLoop();
    }

    function onPointerMove(event: PointerEvent) {
      if (reduced) {
        return;
      }
      hovering = true;
      pointFromEvent(event);
      startLoop();
    }

    function onPointerLeave() {
      hovering = false;
      lastTime = 0;
    }

    function onReducedChange() {
      reduced = reducedQuery.matches;
      if (reduced) {
        hovering = false;
        composite();
      }
    }

    sizeCanvases();
    const resize = new ResizeObserver(() => {
      sizeCanvases();
    });
    resize.observe(canvas);

    canvas.addEventListener("pointerenter", onPointerEnter);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    reducedQuery.addEventListener("change", onReducedChange);

    return () => {
      resize.disconnect();
      canvas.removeEventListener("pointerenter", onPointerEnter);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      reducedQuery.removeEventListener("change", onReducedChange);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [scene]);

  const classes = ["root-pulse-field", className].filter(Boolean).join(" ");

  return (
    <PulsePaint className="root-pulse-paint">
      <div className={classes}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={label}
        />
      </div>
    </PulsePaint>
  );
}
