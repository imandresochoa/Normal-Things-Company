import chartTokens from "@/foundations/chart_tokens.json";
import { COLOR_STEPS, type ColorStep } from "@/lib/root-tokens";

export const CHART_FAMILY_IDS = ["indigo", "ember", "teal", "moss"] as const;
export type ChartFamily = (typeof CHART_FAMILY_IDS)[number];

type ModeHex = {
  light: string;
  dark: string;
};

type PrimitiveStep = {
  $value: ModeHex;
  $description: string;
  $extensions?: {
    "ntc.oklch"?: ModeHex;
    "ntc.seed"?: boolean;
  };
};

type SemanticToken = {
  $value: string;
  $description: string;
  $extensions?: {
    "ntc.resolved"?: string;
  };
};

const primitive = chartTokens.color.primitive as Record<
  ChartFamily,
  Record<string, PrimitiveStep>
>;
const semantic = chartTokens.color.semantic as Record<string, SemanticToken>;

export const CHART_FAMILIES: {
  id: ChartFamily;
  label: string;
  seed: ColorStep;
}[] = [
  { id: "indigo", label: "Indigo · chart series", seed: "700" },
  { id: "ember", label: "Ember · chart series", seed: "700" },
  { id: "teal", label: "Teal · chart series", seed: "700" },
  { id: "moss", label: "Moss · chart series", seed: "700" },
];

export function chartPrimitive(family: ChartFamily, step: ColorStep) {
  return primitive[family][step];
}

export function chartFamily700(family: ChartFamily) {
  return chartPrimitive(family, "700").$value.light;
}

export function chartSemantic(name: string) {
  const token = semantic[name];
  return {
    name,
    reference: token.$value,
    hex: token.$extensions?.["ntc.resolved"] ?? "",
  };
}

export function chartFamilySteps(family: ChartFamily) {
  return COLOR_STEPS.map((step) => {
    const token = chartPrimitive(family, step);
    return {
      step,
      role: token.$description,
      value: token.$value,
      oklch: token.$extensions?.["ntc.oklch"],
      seed: Boolean(token.$extensions?.["ntc.seed"]),
    };
  });
}

export const PLOT_TOKEN_NAMES = [
  "plot-paper",
  "plot-grid-minor",
  "plot-grid-major",
  "plot-axis",
  "plot-context",
  "plot-subject",
  "plot-moment",
  "plot-label",
  "plot-label-quiet",
] as const;

export const SERIES_TOKEN_NAMES = [
  "series-1",
  "series-2",
  "series-3",
  "series-4",
] as const;

export const ILLUST_TOKEN_NAMES = [
  "illust-indigo",
  "illust-ember",
  "illust-teal",
  "illust-moss",
  "illust-indigo-wash",
  "illust-ember-wash",
  "illust-teal-wash",
  "illust-moss-wash",
] as const;

export const PULSE_SEMANTIC_GROUPS: {
  title: string;
  tokens: readonly string[];
}[] = [
  { title: "Plot", tokens: PLOT_TOKEN_NAMES },
  { title: "Series", tokens: SERIES_TOKEN_NAMES },
  { title: "Illustration", tokens: ILLUST_TOKEN_NAMES },
];

export function pulseCssVars(): Record<`--${string}`, string> {
  const vars = {} as Record<`--${string}`, string>;

  for (const name of Object.keys(semantic)) {
    const hex = semantic[name].$extensions?.["ntc.resolved"];
    if (hex) {
      vars[`--${name}`] = hex;
    }
  }

  return vars;
}
