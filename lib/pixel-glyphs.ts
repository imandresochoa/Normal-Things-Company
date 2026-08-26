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

const LETTER_N: readonly string[] = [
  "#   #",
  "##  #",
  "# # #",
  "#  ##",
  "#   #",
  "#   #",
  "#   #",
];

const LETTER_O: readonly string[] = [
  "     ",
  " ### ",
  "#   #",
  "#   #",
  "#   #",
  " ### ",
  "     ",
];

const LETTER_T: readonly string[] = [
  "  #  ",
  "#####",
  "  #  ",
  "  #  ",
  "  #  ",
  "  #  ",
  "  ## ",
];

const LETTER_Y: readonly string[] = [
  "     ",
  "#   #",
  "#   #",
  " # # ",
  "  #  ",
  "  #  ",
  " ##  ",
];

const LETTER_E: readonly string[] = [
  "     ",
  " ### ",
  "#   #",
  "#####",
  "#    ",
  " ### ",
  "     ",
];

const PERIOD: readonly string[] = [
  "  ",
  "  ",
  "  ",
  "  ",
  "  ",
  "##",
  "##",
];

const EYE_GAP = 8;
const LETTER_GAP = 1;
const WORD_GAP = 3;

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

function bounds(cells: readonly PixelCell[]): {
  width: number;
  height: number;
} {
  let maxX = -1;
  let maxY = -1;

  for (const cell of cells) {
    if (cell.x > maxX) {
      maxX = cell.x;
    }
    if (cell.y > maxY) {
      maxY = cell.y;
    }
  }

  return {
    width: maxX + 1,
    height: maxY + 1,
  };
}

const eyeWidth = EYE[0].length;
const leftEye = blit(EYE, 0, 0);
const rightEye = blit(EYE, eyeWidth + EYE_GAP, 0);
const eyesCells: PixelCell[] = [...leftEye, ...rightEye];

function layoutWords(
  words: readonly (readonly (readonly string[])[])[],
): PixelCell[] {
  const cells: PixelCell[] = [];
  let cursor = 0;

  for (const [wordIndex, word] of words.entries()) {
    if (wordIndex > 0) {
      cursor += WORD_GAP;
    }

    for (const [letterIndex, pattern] of word.entries()) {
      if (letterIndex > 0) {
        cursor += LETTER_GAP;
      }
      cells.push(...blit(pattern, cursor, 0));
      cursor += pattern[0].length;
    }
  }

  return cells;
}

const notYetCells = layoutWords([
  [LETTER_N, LETTER_O, LETTER_T],
  [LETTER_Y, LETTER_E, LETTER_T, PERIOD],
]);

export const EYES_GLYPH: Glyph = {
  cells: eyesCells,
  ...bounds(eyesCells),
};

export const NOT_YET_GLYPH: Glyph = {
  cells: notYetCells,
  ...bounds(notYetCells),
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
