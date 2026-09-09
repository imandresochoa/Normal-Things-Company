import type { PulseFieldScene } from "../pulse-field-scene";

export const PULSE_WASH_SCENE = {
  id: "pulse-wash",
  width: 320,
  height: 176,
  air: 0.22,
  layers: [
    {
      kind: "wash",
      ink: "illust-moss-wash",
      x: 118 / 320,
      y: 92 / 176,
      opacity: 0.72,
      rx: 92 / 320,
      ry: 58 / 176,
    },
    {
      kind: "wash",
      ink: "illust-moss",
      x: 118 / 320,
      y: 92 / 176,
      opacity: 0.28,
      rx: 70 / 320,
      ry: 42 / 176,
    },
    {
      kind: "wash",
      ink: "illust-ember-wash",
      x: 204 / 320,
      y: 78 / 176,
      opacity: 0.7,
      rx: 86 / 320,
      ry: 58 / 176,
    },
    {
      kind: "wash",
      ink: "illust-indigo-wash",
      x: 168 / 320,
      y: 108 / 176,
      opacity: 0.62,
      rx: 64 / 320,
      ry: 40 / 176,
    },
  ],
} satisfies PulseFieldScene;
