import type { LogoStroke } from "@/lib/logo-strokes";

export const PULSE_WORD_SPACE = 16;

const ARE_DX = 7.6;
const STILL_DX = 7.2;
const ON_DX = 18;
const IT_DX = 24.1;

export const PULSE_MARK_VIEWBOX = "0 0 312 56";

function shiftPathX(d: string, dx: number): string {
  if (dx === 0) {
    return d;
  }

  let index = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, (raw) => {
    const value = Number(raw);
    const next = index % 2 === 0 ? value + dx : value;
    index += 1;
    return String(Math.round(next * 10) / 10);
  });
}

function stroke(id: string, d: string, dx: number): LogoStroke {
  return { id, d: shiftPathX(d, dx) };
}

export const pulseStrokes: LogoStroke[] = [
  stroke(
    "w",
    "M8.4 16.8C8.8 26.4 9.4 36.8 10.4 48.2C12.2 38.6 14.2 28.4 16.2 24.2C17.8 30.2 19.6 39.4 20.8 48C22.6 37.2 24.6 26.4 26.8 16.4",
    0,
  ),
  stroke(
    "e",
    "M46.8 29.2C41.2 26.4 34.6 30.2 34.2 38.6C33.8 46.2 40.2 49.6 46.8 47.4",
    0,
  ),
  stroke("e-bar", "M34.8 38C39.2 37.2 43.6 37.4 47.6 38.4", 0),
  stroke(
    "a",
    "M56 43.2C57.4 35.4 59 26.8 60.4 21.4C62 26.6 64 35.2 65.8 43.4",
    ARE_DX,
  ),
  stroke("a-bar", "M58.4 32.4C60 31.8 61.8 31.6 63.6 32", ARE_DX),
  stroke("r-stem", "M70 23.2C69.5 30.4 69.2 37.8 69.6 45.4", ARE_DX),
  stroke(
    "r-bowl",
    "M70.2 23.4C76 22.6 81.8 25.8 81.4 31.6C81 36.2 75.8 36.4 70.8 35.6C75.4 38.2 80 42.2 84.4 45.8",
    ARE_DX,
  ),
  stroke(
    "e-2",
    "M100.8 29.2C95.2 26.4 88.6 30.2 88.2 38.6C87.8 46.2 94.2 49.6 100.8 47.4",
    ARE_DX,
  ),
  stroke("e-2-bar", "M88.8 38C93.2 37.2 97.6 37.4 101.6 38.4", ARE_DX),
  stroke(
    "s",
    "M126 19.2C121 17.4 118.2 21.4 119.6 26.2C122.2 31.6 126.4 35.4 125 40.4C123.4 44.6 119 44.8 118 42.6",
    STILL_DX,
  ),
  stroke("t-bar", "M128.8 21.6C133.6 20.4 139.8 19.2 145 19.8", STILL_DX),
  stroke("t", "M138 21.2C138.2 28.6 138.8 36.4 139.6 43.8", STILL_DX),
  stroke("i-top", "M143.6 20.2C146.8 19.2 150 18.8 152.8 19.6", STILL_DX),
  stroke("i", "M148 21.4C147.9 27.6 148.2 34.2 148.8 40.2", STILL_DX),
  stroke("i-bottom", "M144.4 42.4C147.8 43.2 151 43.8 153.6 44.6", STILL_DX),
  stroke(
    "l",
    "M164 22.8C163.4 28.6 163 34.8 163.4 40.4C167.2 40.6 171.4 40.4 175.2 40.8",
    STILL_DX,
  ),
  stroke(
    "l-2",
    "M180 22.8C179.4 28.6 179 34.8 179.4 40.4C183.2 40.6 187.4 40.4 191.2 40.8",
    STILL_DX,
  ),
  stroke(
    "o",
    "M204 26.2C207.8 27.4 208.4 32.2 207.8 37.4C207.2 42.4 204.4 44.4 201.8 44.2C198.2 43.8 196.4 39.6 196.8 34.6C197.2 29.4 200 25.2 203.7 25.6",
    ON_DX,
  ),
  stroke(
    "n",
    "M220 47.8C219.7 36.2 220.2 22.6 221.4 16.2C223.2 24.8 228 39.6 232.2 47.2C232.7 36.4 233.1 22.8 233.7 18.2",
    ON_DX,
  ),
  stroke("i-2-top", "M243.6 20.2C246.8 19.2 250 18.8 252.8 19.6", IT_DX),
  stroke("i-2", "M248 21.4C247.9 27.6 248.2 34.2 248.8 40.2", IT_DX),
  stroke("i-2-bottom", "M244.4 42.4C247.8 43.2 251 43.8 253.6 44.6", IT_DX),
  stroke("t-2-bar", "M260.8 21.6C265.6 20.4 271.8 19.2 277 19.8", IT_DX),
  stroke("t-2", "M270 21.2C270.2 28.6 270.8 36.4 271.6 43.8", IT_DX),
];
