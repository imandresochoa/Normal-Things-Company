"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  BLINK_GLYPH,
  EYES_GLYPH,
  centerGlyph,
  type PixelCell,
} from "@/lib/pixel-glyphs";

const PREFERRED_PITCH = 8;
const MIN_PITCH = 4;
const LOOK_MAX_X_CELLS = 4;
const LOOK_MAX_Y_CELLS = 3;
const LOOK_TAU_S = 0.167;
const BLINK_CLOSE_MS = 120;
const BLINK_HOLD_MS = 80;
const BLINK_GAP_MIN_MS = 2500;
const BLINK_GAP_MAX_MS = 5000;

type Lid = "open" | "closed";

type LitCell = PixelCell & {
  readonly open: boolean;
  readonly closed: boolean;
};

type BandStyle = CSSProperties & {
  "--led-pitch": string;
  "--led-shift-x": string;
  "--led-shift-y": string;
};

type CellStyle = CSSProperties & {
  "--cx": number;
  "--cy": number;
};

type Grid = {
  pitch: number;
  cols: number;
  rows: number;
  shiftX: number;
  shiftY: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function snapToPitch(value: number, pitch: number): number {
  if (pitch <= 0) {
    return 0;
  }
  return Math.round(value / pitch) * pitch;
}

function randomBlinkGap(): number {
  return (
    BLINK_GAP_MIN_MS + Math.random() * (BLINK_GAP_MAX_MS - BLINK_GAP_MIN_MS)
  );
}

function fitGrid(width: number, height: number): Grid {
  const minCols = EYES_GLYPH.width + 4 + LOOK_MAX_X_CELLS * 2;
  const minRows = EYES_GLYPH.height + 2 + LOOK_MAX_Y_CELLS * 2;
  const pitch = Math.max(
    MIN_PITCH,
    Math.min(
      PREFERRED_PITCH,
      Math.floor(width / minCols),
      Math.floor(height / minRows),
    ),
  );
  const cols = Math.max(1, Math.floor(width / pitch));
  const rows = Math.max(1, Math.floor(height / pitch));

  return {
    pitch,
    cols,
    rows,
    shiftX: (width - cols * pitch) / 2,
    shiftY: (height - rows * pitch) / 2,
  };
}

function litCellsForGrid(cols: number, rows: number): LitCell[] {
  const open = centerGlyph(EYES_GLYPH, { cols, rows });
  const closed = centerGlyph(BLINK_GLYPH, { cols, rows });
  const merged = new Map<string, LitCell>();

  const take = (cell: PixelCell, lid: Lid) => {
    const key = `${cell.x},${cell.y}`;
    const existing = merged.get(key);

    if (existing) {
      merged.set(key, {
        ...existing,
        open: existing.open || lid === "open",
        closed: existing.closed || lid === "closed",
      });
      return;
    }

    merged.set(key, {
      x: cell.x,
      y: cell.y,
      open: lid === "open",
      closed: lid === "closed",
    });
  };

  for (const cell of open) {
    take(cell, "open");
  }
  for (const cell of closed) {
    take(cell, "closed");
  }

  return [...merged.values()];
}

function cellStyle(cell: LitCell): CellStyle {
  return {
    "--cx": cell.x,
    "--cy": cell.y,
  };
}

function lookTargetFromPointer(event: PointerEvent, band: HTMLElement, pitch: number): {
  x: number;
  y: number;
} {
  const rect = band.getBoundingClientRect();
  const halfW = rect.width / 2 || 1;
  const halfH = rect.height / 2 || 1;
  const nx = clamp((event.clientX - (rect.left + halfW)) / halfW, -1, 1);
  const ny = clamp((event.clientY - (rect.top + halfH)) / halfH, -1, 1);

  return {
    x: nx * LOOK_MAX_X_CELLS * pitch,
    y: ny * LOOK_MAX_Y_CELLS * pitch,
  };
}

export function PixelDisplay() {
  const bandRef = useRef<HTMLDivElement>(null);
  const gazeRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const lookRef = useRef({ x: 0, y: 0 });
  const trackingId = useRef<number | null>(null);
  const pitchRef = useRef(PREFERRED_PITCH);
  const reduceMotionRef = useRef(false);

  const [lid, setLid] = useState<Lid>("open");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [grid, setGrid] = useState<Grid>({
    pitch: PREFERRED_PITCH,
    cols: 0,
    rows: 0,
    shiftX: 0,
    shiftY: 0,
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduceMotion(media.matches);
      reduceMotionRef.current = media.matches;
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const band = bandRef.current;
    if (!band) {
      return;
    }

    const measure = () => {
      const rect = band.getBoundingClientRect();
      const next = fitGrid(rect.width, rect.height);
      pitchRef.current = next.pitch;
      setGrid(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(band);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      targetRef.current = { x: 0, y: 0 };
      lookRef.current = { x: 0, y: 0 };
      const gaze = gazeRef.current;
      if (gaze) {
        gaze.style.transform = "translate(0px, 0px)";
      }
      return;
    }

    let closeTimer = 0;
    let gapTimer = 0;

    const schedule = () => {
      gapTimer = window.setTimeout(() => {
        setLid("closed");
        closeTimer = window.setTimeout(() => {
          setLid("open");
          schedule();
        }, BLINK_CLOSE_MS + BLINK_HOLD_MS);
      }, randomBlinkGap());
    };

    schedule();

    return () => {
      window.clearTimeout(gapTimer);
      window.clearTimeout(closeTimer);
    };
  }, [reduceMotion]);

  useEffect(() => {
    const band = bandRef.current;
    const gaze = gazeRef.current;
    if (!band || !gaze || reduceMotion) {
      return;
    }

    const home = () => {
      targetRef.current = { x: 0, y: 0 };
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") {
        return;
      }
      if (trackingId.current !== null) {
        return;
      }
      trackingId.current = event.pointerId;
      targetRef.current = lookTargetFromPointer(event, band, pitchRef.current);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "mouse") {
        targetRef.current = lookTargetFromPointer(event, band, pitchRef.current);
        return;
      }
      if (trackingId.current !== event.pointerId) {
        return;
      }
      targetRef.current = lookTargetFromPointer(event, band, pitchRef.current);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === "mouse") {
        return;
      }
      if (trackingId.current !== event.pointerId) {
        return;
      }
      trackingId.current = null;
      home();
    };

    const onPageLeave = () => {
      trackingId.current = null;
      home();
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPageLeave);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.documentElement.removeEventListener("mouseleave", onPageLeave);
    };
  }, [reduceMotion]);

  useEffect(() => {
    const gaze = gazeRef.current;
    if (!gaze || reduceMotion) {
      return;
    }

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - last, 32) / 1000;
      last = now;
      const k = 1 - Math.exp(-dt / LOOK_TAU_S);
      const look = lookRef.current;
      const target = targetRef.current;
      look.x += (target.x - look.x) * k;
      look.y += (target.y - look.y) * k;
      const pitch = pitchRef.current;
      const snapX = snapToPitch(look.x, pitch);
      const snapY = snapToPitch(look.y, pitch);
      gaze.style.transform = `translate(${snapX}px, ${snapY}px)`;
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [reduceMotion]);

  const cells = useMemo(
    () => (grid.cols === 0 ? [] : litCellsForGrid(grid.cols, grid.rows)),
    [grid.cols, grid.rows],
  );

  const bandStyle: BandStyle = {
    "--led-pitch": `${grid.pitch}px`,
    "--led-shift-x": `${grid.shiftX}px`,
    "--led-shift-y": `${grid.shiftY}px`,
  };

  return (
    <div
      ref={bandRef}
      className="led-band relative h-[220px] w-full overflow-hidden md:h-[280px]"
      role="img"
      aria-label="Pixel eyes"
      data-lid={reduceMotion ? "open" : lid}
      style={bandStyle}
    >
      <div ref={gazeRef} className="led-gaze">
        {cells.map((cell) => (
          <span
            key={`${cell.x},${cell.y}`}
            className="led-cell"
            data-open={cell.open ? "" : undefined}
            data-closed={cell.closed ? "" : undefined}
            style={cellStyle(cell)}
          />
        ))}
      </div>
    </div>
  );
}
