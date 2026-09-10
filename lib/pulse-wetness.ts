export const FIELD_SOAK_MS = 20_000;

export type WetnessMap = {
  width: number;
  height: number;
  cells: Float32Array;
};

export function createWetnessMap(width: number, height: number): WetnessMap {
  return {
    width,
    height,
    cells: new Float32Array(width * height),
  };
}

export function resetWetness(map: WetnessMap): void {
  map.cells.fill(0);
}

export function brushFalloff(dist: number, radius: number): number {
  if (radius <= 0 || dist >= radius) return 0;
  if (dist <= 0) return 1;
  const t = 1 - dist / radius;
  return t * t * (3 - 2 * t);
}

export function wetMaskAlpha(wetness: number): number {
  const w = Math.min(1, Math.max(0, wetness));
  return w ** 0.4;
}

export function accumulateWetness(
  map: WetnessMap,
  x: number,
  y: number,
  dtMs: number,
  options?: { radius?: number; soakMs?: number },
): { changed: boolean } {
  if (dtMs <= 0 || x < 0 || x > 1 || y < 0 || y > 1) {
    return { changed: false };
  }

  const { width, height, cells } = map;
  const radius = options?.radius ?? 4;
  const soakMs = options?.soakMs ?? FIELD_SOAK_MS;

  const tx = Math.min(width - 1, Math.floor(x * width));
  const ty = Math.min(height - 1, Math.floor(y * height));

  let changed = false;
  const minX = Math.max(0, Math.ceil(tx - radius));
  const maxX = Math.min(width - 1, Math.floor(tx + radius));
  const minY = Math.max(0, Math.ceil(ty - radius));
  const maxY = Math.min(height - 1, Math.floor(ty + radius));

  for (let iy = minY; iy <= maxY; iy++) {
    for (let ix = minX; ix <= maxX; ix++) {
      const dist = Math.hypot(ix - tx, iy - ty);
      if (dist >= radius) {
        continue;
      }

      const falloff = brushFalloff(dist, radius);
      const index = iy * width + ix;
      const next = Math.min(1, cells[index] + falloff * (dtMs / soakMs));
      if (next > cells[index]) {
        cells[index] = next;
        changed = true;
      }
    }
  }

  return { changed };
}
