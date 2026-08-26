export type LogoSpark = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Outward nudge in viewBox units for burst translate. */
  dx: number;
  dy: number;
};

/** Radial dashes around the 200×95 wordmark, including top sparks. */
export const logoSparks: LogoSpark[] = [
  { id: "n", x1: 100, y1: 4, x2: 100, y2: -6, dx: 0, dy: -8 },
  { id: "nne", x1: 128, y1: 2, x2: 136, y2: -6, dx: 4, dy: -6 },
  { id: "nnw", x1: 72, y1: 2, x2: 64, y2: -6, dx: -4, dy: -6 },
  { id: "ne", x1: 168, y1: 8, x2: 178, y2: 2, dx: 6, dy: -5 },
  { id: "e", x1: 186, y1: 42, x2: 196, y2: 40, dx: 8, dy: 0 },
  { id: "se", x1: 172, y1: 78, x2: 182, y2: 88, dx: 6, dy: 6 },
  { id: "s", x1: 100, y1: 88, x2: 100, y2: 98, dx: 0, dy: 8 },
  { id: "sw", x1: 28, y1: 78, x2: 18, y2: 88, dx: -6, dy: 6 },
  { id: "w", x1: 14, y1: 48, x2: 4, y2: 46, dx: -8, dy: 0 },
  { id: "nw", x1: 32, y1: 12, x2: 22, y2: 2, dx: -6, dy: -6 },
  { id: "nene", x1: 152, y1: 0, x2: 160, y2: -8, dx: 5, dy: -6 },
];
