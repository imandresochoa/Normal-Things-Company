export type PixelCell = {
  readonly x: number;
  readonly y: number;
};

type Glyph = {
  readonly cells: readonly PixelCell[];
  readonly width: number;
  readonly height: number;
};

const EYE: readonly string[] = [
  "  ####  ",
  " ###### ",
  "########",
  "########",
  "########",
  "########",
  "########",
  "########",
  "########",
  "########",
  "########",
  "########",
  "########",
  " ###### ",
  "  ####  ",
];

const BLINK: readonly string[] = [
  "        ",
  "        ",
  "        ",
  "        ",
  "        ",
  "        ",
  "  ####  ",
  " ###### ",
  "        ",
  "        ",
  "        ",
  "        ",
  "        ",
  "        ",
  "        ",
];

const EYE_GAP = 8;

function blit(
  pattern: readonly string[],
  originX: number,
  originY: number,
): PixelCell[] {
  const cells: PixelCell[] = [];

  for (let y = 0; y < pattern.length; y += 1) {
    const row = pattern[y];
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === "#") {
        cells.push({ x: originX + x, y: originY + y });
      }
    }
  }

  return cells;
}

function pairEyes(pattern: readonly string[]): PixelCell[] {
  const eyeWidth = pattern[0].length;
  return [
    ...blit(pattern, 0, 0),
    ...blit(pattern, eyeWidth + EYE_GAP, 0),
  ];
}

export const EYES_GLYPH: Glyph = {
  cells: pairEyes(EYE),
  width: EYE[0].length * 2 + EYE_GAP,
  height: EYE.length,
};

export const BLINK_GLYPH: Glyph = {
  cells: pairEyes(BLINK),
  width: EYES_GLYPH.width,
  height: EYES_GLYPH.height,
};

export function centerGlyph(
  glyph: Glyph,
  grid: { readonly cols: number; readonly rows: number },
): PixelCell[] {
  const dx = Math.floor((grid.cols - glyph.width) / 2);
  const dy = Math.floor((grid.rows - glyph.height) / 2);

  return glyph.cells
    .map((cell) => ({
      x: cell.x + dx,
      y: cell.y + dy,
    }))
    .filter(
      (cell) =>
        cell.x >= 0 &&
        cell.x < grid.cols &&
        cell.y >= 0 &&
        cell.y < grid.rows,
    );
}
