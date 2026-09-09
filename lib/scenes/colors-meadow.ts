import type { FieldMark, PulseFieldScene } from "../pulse-field-scene";

const WIDTH = 720;
const HEIGHT = 360;
const GRID = 16;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function snap(value: number) {
  return Math.round(value / GRID) * GRID;
}

function nx(px: number) {
  return Math.min(1, Math.max(0, snap(px) / WIDTH));
}

function ny(px: number) {
  return Math.min(1, Math.max(0, snap(px) / HEIGHT));
}

function buildColorsMeadow(): PulseFieldScene {
  const rand = mulberry32(0xa11e);
  const layers: FieldMark[] = [];

  function between(min: number, max: number) {
    return min + rand() * (max - min);
  }

  const hillInks = [
    "illust-moss-wash",
    "illust-teal-wash",
    "illust-ember-wash",
    "illust-moss-wash",
    "illust-indigo-wash",
  ] as const;

  for (let i = 0; i < 14; i += 1) {
    layers.push({
      kind: "wash",
      ink: hillInks[i % hillInks.length],
      x: nx(40 + i * 52 + between(-12, 12)),
      y: ny(128 + Math.sin(i * 0.7) * 18 + (i % 3) * 8),
      opacity: between(0.38, 0.62),
      rx: between(0.14, 0.24),
      ry: between(0.06, 0.11),
    });
  }

  layers.push(
    {
      kind: "wash",
      ink: "illust-moss",
      x: nx(360),
      y: ny(224),
      opacity: 0.18,
      rx: 0.55,
      ry: 0.16,
    },
    {
      kind: "wash",
      ink: "illust-teal",
      x: nx(140),
      y: ny(208),
      opacity: 0.14,
      rx: 0.28,
      ry: 0.12,
    },
    {
      kind: "wash",
      ink: "illust-indigo-wash",
      x: nx(360),
      y: ny(192),
      opacity: 0.5,
      rx: 0.48,
      ry: 0.08,
    },
    {
      kind: "wash",
      ink: "illust-indigo-wash",
      x: nx(200),
      y: ny(208),
      opacity: 0.42,
      rx: 0.22,
      ry: 0.07,
    },
    {
      kind: "wash",
      ink: "illust-ember-wash",
      x: nx(560),
      y: ny(176),
      opacity: 0.36,
      rx: 0.22,
      ry: 0.09,
    },
  );

  for (let i = 0; i < 220; i += 1) {
    layers.push({
      kind: "stem",
      ink: rand() > 0.65 ? "illust-teal" : "illust-moss",
      x: between(0.01, 0.99),
      y: between(0.62, 0.99),
      opacity: between(0.22, 0.55),
      h: between(0.1, 0.28),
      rotate: between(-8, 8),
    });
  }

  for (let i = 0; i < 55; i += 1) {
    const x = between(0.04, 0.96);
    const y = between(0.52, 0.78);
    const spikes = 4 + Math.floor(rand() * 5);
    layers.push({
      kind: "wash",
      ink: "illust-indigo",
      x,
      y: y - 0.03,
      opacity: between(0.22, 0.4),
      rx: between(0.01, 0.018),
      ry: between(0.05, 0.09),
    });
    for (let j = 0; j < spikes; j += 1) {
      layers.push({
        kind: "dab",
        ink: j % 2 === 0 ? "illust-indigo" : "illust-indigo-wash",
        x: x + between(-0.01, 0.01),
        y: y - j * between(0.01, 0.018),
        opacity: between(0.35, 0.7),
        r: between(0.006, 0.014),
      });
    }
  }

  for (let i = 0; i < 120; i += 1) {
    const x = between(0.02, 0.98);
    const y = between(0.64, 0.97);
    layers.push({
      kind: "dab",
      ink: "illust-ember-wash",
      x: x + between(-0.008, 0.008),
      y: y + between(-0.006, 0.006),
      opacity: between(0.4, 0.7),
      r: between(0.012, 0.024),
    });
    layers.push({
      kind: "dab",
      ink: "illust-ember",
      x,
      y,
      opacity: between(0.35, 0.65),
      r: between(0.007, 0.015),
    });
  }

  for (let i = 0; i < 28; i += 1) {
    layers.push({
      kind: "dab",
      ink: "plot-moment",
      x: between(0.06, 0.94),
      y: between(0.7, 0.96),
      opacity: between(0.55, 0.85),
      r: between(0.01, 0.02),
    });
  }

  for (let i = 0; i < 50; i += 1) {
    layers.push({
      kind: "dab",
      ink: "illust-moss",
      x: between(0.02, 0.98),
      y: between(0.74, 0.99),
      opacity: between(0.12, 0.28),
      r: between(0.012, 0.032),
    });
  }

  return {
    id: "colors-meadow",
    width: WIDTH,
    height: HEIGHT,
    air: 0.28,
    layers,
  };
}

export const COLORS_MEADOW = buildColorsMeadow();
