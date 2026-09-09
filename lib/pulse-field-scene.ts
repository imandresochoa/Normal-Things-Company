export const FIELD_INKS = [
  "illust-indigo",
  "illust-ember",
  "illust-teal",
  "illust-moss",
  "illust-indigo-wash",
  "illust-ember-wash",
  "illust-teal-wash",
  "illust-moss-wash",
  "plot-paper",
  "plot-moment",
] as const;

export type FieldInk = (typeof FIELD_INKS)[number];

export function isFieldInk(name: string): boolean {
  return FIELD_INKS.includes(name as FieldInk);
}

export type FieldMark = {
  kind: "wash" | "dab" | "stem";
  ink: FieldInk;
  x: number;
  y: number;
  opacity: number;
  rx?: number;
  ry?: number;
  r?: number;
  h?: number;
  rotate?: number;
};

export type PulseFieldScene = {
  id: string;
  width: number;
  height: number;
  air: number;
  layers: FieldMark[];
};
