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
  return snap(px) / WIDTH;
}

function ny(px: number) {
  return snap(px) / HEIGHT;
}

function buildColorsMeadow(): PulseFieldScene {
  const rand = mulberry32(0xc01d);
  const layers: FieldMark[] = [];

  function between(min: number, max: number) {
    return min + rand() * (max - min);
  }

  layers.push(
    {
      kind: "wash",
      ink: "illust-moss-wash",
      x: nx(360),
      y: ny(128),
      opacity: 0.42,
      rx: 0.52,
      ry: 0.16,
    },
    {
      kind: "wash",
      ink: "illust-teal-wash",
      x: nx(176),
      y: ny(144),
      opacity: 0.38,
      rx: 0.34,
      ry: 0.12,
    },
    {
      kind: "wash",
      ink: "illust-ember-wash",
      x: nx(528),
      y: ny(160),
      opacity: 0.32,
      rx: 0.36,
      ry: 0.11,
    },
    {
      kind: "wash",
      ink: "illust-moss-wash",
      x: nx(400),
      y: ny(176),
      opacity: 0.5,
      rx: 0.48,
      ry: 0.14,
    },
    {
      kind: "wash",
      ink: "illust-teal-wash",
      x: nx(96),
      y: ny(192),
      opacity: 0.34,
      rx: 0.28,
      ry: 0.13,
    },
    {
      kind: "wash",
      ink: "illust-indigo-wash",
      x: nx(360),
      y: ny(208),
      opacity: 0.46,
      rx: 0.58,
      ry: 0.1,
    },
    {
      kind: "wash",
      ink: "illust-moss",
      x: nx(280),
      y: ny(240),
      opacity: 0.16,
      rx: 0.42,
      ry: 0.16,
    },
    {
      kind: "wash",
      ink: "illust-teal",
      x: nx(520),
      y: ny(224),
      opacity: 0.12,
      rx: 0.3,
      ry: 0.12,
    },
    {
      kind: "wash",
      ink: "illust-indigo-wash",
      x: nx(200),
      y: ny(224),
      opacity: 0.4,
      rx: 0.26,
      ry: 0.09,
    },
    {
      kind: "wash",
      ink: "illust-ember-wash",
      x: nx(120),
      y: ny(256),
      opacity: 0.22,
      rx: 0.2,
      ry: 0.1,
    },
  );

  for (let i = 0; i < 160; i += 1) {
    const x = between(0.02, 0.98);
    const y = between(0.58, 0.98);
    layers.push({
      kind: "stem",
      ink: rand() > 0.72 ? "illust-teal" : "illust-moss",
      x,
      y,
      opacity: between(0.18, 0.42),
      h: between(0.08, 0.22),
      rotate: between(-7, 7),
    });
  }

  for (let i = 0; i < 70; i += 1) {
    const x = between(0.04, 0.96);
    const y = between(0.5, 0.78);
    const count = 3 + Math.floor(rand() * 4);
    for (let j = 0; j < count; j += 1) {
      layers.push({
        kind: "dab",
        ink: j === 0 ? "illust-indigo" : "illust-indigo-wash",
        x: x + between(-0.012, 0.012),
        y: y - j * between(0.012, 0.02),
        opacity: j === 0 ? between(0.28, 0.48) : between(0.22, 0.4),
        r: between(0.008, 0.016),
      });
    }
  }

  for (let i = 0; i < 90; i += 1) {
    const x = between(0.03, 0.97);
    const y = between(0.62, 0.96);
    layers.push({
      kind: "dab",
      ink: "illust-ember-wash",
      x: x + between(-0.006, 0.006),
      y: y + between(-0.006, 0.006),
      opacity: between(0.28, 0.5),
      r: between(0.012, 0.022),
    });
    layers.push({
      kind: "dab",
      ink: "illust-ember",
      x,
      y,
      opacity: between(0.22, 0.4),
      r: between(0.007, 0.014),
    });
  }

  for (let i = 0; i < 18; i += 1) {
    layers.push({
      kind: "dab",
      ink: "plot-moment",
      x: between(0.08, 0.92),
      y: between(0.68, 0.94),
      opacity: between(0.42, 0.7),
      r: between(0.01, 0.018),
    });
  }

  for (let i = 0; i < 40; i += 1) {
    layers.push({
      kind: "dab",
      ink: "illust-moss",
      x: between(0.02, 0.98),
      y: between(0.7, 0.98),
      opacity: between(0.08, 0.18),
      r: between(0.01, 0.03),
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
