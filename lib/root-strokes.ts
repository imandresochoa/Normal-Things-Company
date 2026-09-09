import { logoStrokes, type LogoStroke } from "@/lib/logo-strokes";

export const ROOT_MARK_VIEWBOX = "0 16 74 34";

const ROOT_DX = {
  r: -37.6,
  o: -8,
  o2: 5.4,
  t: -59.2,
} as const;

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

function pathById(id: string): string {
  const found = logoStrokes.find((stroke) => stroke.id === id);

  if (!found) {
    throw new Error(`missing logo stroke: ${id}`);
  }

  return found.d;
}

function stroke(id: string, sourceId: string, dx: number): LogoStroke {
  return { id, d: shiftPathX(pathById(sourceId), dx) };
}

export const rootStrokes: LogoStroke[] = [
  stroke("r-stem", "r-stem", ROOT_DX.r),
  stroke("r-bowl", "r-bowl", ROOT_DX.r),
  stroke("o", "o", ROOT_DX.o),
  stroke("o-2", "o", ROOT_DX.o2),
  stroke("t-bar", "t-bar", ROOT_DX.t),
  stroke("t", "t", ROOT_DX.t),
];
