export type LogoSpark = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Outward nudge in viewBox units for burst translate. */
  dx: number;
  dy: number;
  /** Desync offset for looping frenzy (ms). Scrambled, not ring order. */
  phaseMs?: number;
};

/** Radial dashes for a single press burst — all fire together. */
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

/** Denser sparks for overheat — continuous loop, phases scrambled so they don't circle. */
export const logoFrenzySparks: LogoSpark[] = [
  { id: "f-n", x1: 100, y1: 2, x2: 100, y2: -10, dx: 0, dy: -10, phaseMs: 0 },
  { id: "f-n2", x1: 110, y1: 0, x2: 114, y2: -9, dx: 2, dy: -9, phaseMs: 170 },
  { id: "f-nne", x1: 130, y1: 0, x2: 140, y2: -8, dx: 5, dy: -8, phaseMs: 40 },
  { id: "f-ne", x1: 168, y1: 6, x2: 180, y2: -2, dx: 8, dy: -6, phaseMs: 220 },
  { id: "f-ne2", x1: 156, y1: 14, x2: 168, y2: 6, dx: 7, dy: -5, phaseMs: 90 },
  { id: "f-e", x1: 188, y1: 36, x2: 200, y2: 34, dx: 10, dy: 0, phaseMs: 140 },
  { id: "f-e2", x1: 186, y1: 50, x2: 198, y2: 54, dx: 10, dy: 2, phaseMs: 280 },
  { id: "f-se", x1: 174, y1: 74, x2: 186, y2: 86, dx: 8, dy: 8, phaseMs: 60 },
  { id: "f-se2", x1: 160, y1: 84, x2: 170, y2: 96, dx: 6, dy: 9, phaseMs: 200 },
  { id: "f-s", x1: 100, y1: 90, x2: 100, y2: 102, dx: 0, dy: 10, phaseMs: 110 },
  { id: "f-s2", x1: 88, y1: 88, x2: 84, y2: 100, dx: -2, dy: 10, phaseMs: 250 },
  { id: "f-sw", x1: 26, y1: 76, x2: 14, y2: 88, dx: -8, dy: 8, phaseMs: 30 },
  { id: "f-sw2", x1: 40, y1: 86, x2: 30, y2: 98, dx: -6, dy: 9, phaseMs: 180 },
  { id: "f-w", x1: 12, y1: 44, x2: 0, y2: 42, dx: -10, dy: 0, phaseMs: 70 },
  { id: "f-w2", x1: 14, y1: 58, x2: 2, y2: 62, dx: -10, dy: 2, phaseMs: 240 },
  { id: "f-nw", x1: 30, y1: 10, x2: 18, y2: 0, dx: -8, dy: -7, phaseMs: 130 },
  { id: "f-nw2", x1: 44, y1: 4, x2: 34, y2: -6, dx: -6, dy: -8, phaseMs: 20 },
  { id: "f-nnw", x1: 68, y1: 0, x2: 60, y2: -9, dx: -4, dy: -9, phaseMs: 190 },
  { id: "f-mid-ne", x1: 140, y1: 20, x2: 150, y2: 12, dx: 6, dy: -5, phaseMs: 100 },
  { id: "f-mid-se", x1: 148, y1: 68, x2: 158, y2: 78, dx: 6, dy: 6, phaseMs: 260 },
  { id: "f-mid-sw", x1: 52, y1: 68, x2: 42, y2: 78, dx: -6, dy: 6, phaseMs: 50 },
  { id: "f-mid-nw", x1: 54, y1: 22, x2: 44, y2: 12, dx: -6, dy: -5, phaseMs: 210 },
];
