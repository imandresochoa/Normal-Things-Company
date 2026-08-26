"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  EYES_GLYPH,
  NOT_YET_GLYPH,
  centerGlyph,
  type PixelCell,
} from "@/lib/pixel-glyphs";

const PREFERRED_PITCH = 8;
const MIN_PITCH = 4;
const HOLD_MS = 1800;
const CYCLE_MS = HOLD_MS + 500;
const STAGGER_MS = 80;

type Frame = "eyes" | "text";

type LitCell = PixelCell & {
  readonly eyes: boolean;
  readonly text: boolean;
  readonly delayMs: number;
};

type BandStyle = CSSProperties & {
  "--led-pitch": string;
  "--led-shift-x": string;
  "--led-shift-y": string;
};

type CellStyle = CSSProperties & {
  "--cx": number;
  "--cy": number;
  "--led-delay": string;
};

function fitGrid(width: number, height: number): {
  pitch: number;
  cols: number;
  rows: number;
  shiftX: number;
  shiftY: number;
} {
  const minCols = Math.max(EYES_GLYPH.width, NOT_YET_GLYPH.width) + 4;
  const minRows = Math.max(EYES_GLYPH.height, NOT_YET_GLYPH.height) + 2;
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
  const eyes = centerGlyph(EYES_GLYPH, { cols, rows });
  const text = centerGlyph(NOT_YET_GLYPH, { cols, rows });
  const merged = new Map<string, LitCell>();
  const centerX = cols / 2;
  const centerY = rows / 2;
  const maxDist = Math.hypot(centerX, centerY) || 1;

  const take = (cell: PixelCell, frame: Frame) => {
    const key = `${cell.x},${cell.y}`;
    const existing = merged.get(key);
    const dist = Math.hypot(cell.x - centerX, cell.y - centerY);
    const delayMs = Math.round((dist / maxDist) * STAGGER_MS);

    if (existing) {
      merged.set(key, {
        ...existing,
        eyes: existing.eyes || frame === "eyes",
        text: existing.text || frame === "text",
      });
      return;
    }

    merged.set(key, {
      x: cell.x,
      y: cell.y,
      eyes: frame === "eyes",
      text: frame === "text",
      delayMs,
    });
  };

  for (const cell of eyes) {
    take(cell, "eyes");
  }
  for (const cell of text) {
    take(cell, "text");
  }

  return [...merged.values()];
}

function cellStyle(cell: LitCell): CellStyle {
  return {
    "--cx": cell.x,
    "--cy": cell.y,
    "--led-delay": `${cell.delayMs}ms`,
  };
}

export function PixelDisplay() {
  const bandRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<Frame>("eyes");
  const [grid, setGrid] = useState({
    pitch: PREFERRED_PITCH,
    cols: 0,
    rows: 0,
    shiftX: 0,
    shiftY: 0,
  });

  useEffect(() => {
    const band = bandRef.current;
    if (!band) {
      return;
    }

    const measure = () => {
      const rect = band.getBoundingClientRect();
      setGrid(fitGrid(rect.width, rect.height));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(band);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFrame((current) => (current === "eyes" ? "text" : "eyes"));
    }, CYCLE_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

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
      aria-label="Not yet."
      data-frame={frame}
      style={bandStyle}
    >
      {cells.map((cell) => (
        <span
          key={`${cell.x},${cell.y}`}
          className="led-cell"
          data-eyes={cell.eyes ? "" : undefined}
          data-text={cell.text ? "" : undefined}
          style={cellStyle(cell)}
        />
      ))}
    </div>
  );
}
