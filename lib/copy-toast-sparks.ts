export type CopyToastSpark = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Outward nudge in viewBox units for burst translate. */
  dx: number;
  dy: number;
};

export const COPY_TOAST_SPARK_WIDTH = 145;
export const COPY_TOAST_SPARK_HEIGHT = 28;
export const COPY_TOAST_SPARK_PAD = 16;

const W = COPY_TOAST_SPARK_WIDTH;
const H = COPY_TOAST_SPARK_HEIGHT;

/** Radial dashes around the copied toast pill. */
export const copyToastSparks: CopyToastSpark[] = [
  { id: "n", x1: W * 0.5, y1: 0, x2: W * 0.5, y2: -8, dx: 0, dy: -8 },
  { id: "nne", x1: W * 0.72, y1: 0, x2: W * 0.72 + 6, y2: -7, dx: 4, dy: -6 },
  { id: "nnw", x1: W * 0.28, y1: 0, x2: W * 0.28 - 6, y2: -7, dx: -4, dy: -6 },
  { id: "ne", x1: W - 4, y1: 4, x2: W + 8, y2: -4, dx: 6, dy: -5 },
  { id: "e", x1: W, y1: H * 0.5, x2: W + 10, y2: H * 0.5, dx: 8, dy: 0 },
  { id: "se", x1: W - 4, y1: H - 4, x2: W + 8, y2: H + 8, dx: 6, dy: 6 },
  { id: "s", x1: W * 0.5, y1: H, x2: W * 0.5, y2: H + 8, dx: 0, dy: 8 },
  { id: "sw", x1: 4, y1: H - 4, x2: -8, y2: H + 8, dx: -6, dy: 6 },
  { id: "w", x1: 0, y1: H * 0.5, x2: -10, y2: H * 0.5, dx: -8, dy: 0 },
  { id: "nw", x1: 4, y1: 4, x2: -8, y2: -4, dx: -6, dy: -6 },
];
