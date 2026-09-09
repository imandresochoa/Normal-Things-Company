import tokens from "@/foundations/tokens.json";
import contrastPairs from "@/foundations/contraste-pares.json";

export const COLOR_STEPS = [
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "1000",
] as const;

export type ColorStep = (typeof COLOR_STEPS)[number];
export type ColorMode = "light" | "dark";

export type PrimitiveFamily =
  | "neutral"
  | "blue-electric"
  | "orange-electric"
  | "neutral-alpha";

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

const primitive = tokens.color.primitive as Record<
  PrimitiveFamily,
  Record<string, PrimitiveStep>
>;
const semantic = tokens.color.semantic as Record<
  ColorMode,
  Record<string, SemanticToken>
>;

export const STEP_ROLES: Record<ColorStep, string> = {
  "100": "Canvas / default background",
  "200": "Raised surface / hover background",
  "300": "Pressed surface / grouped background",
  "400": "Hairline divider (decorative)",
  "500": "Control border",
  "600": "Hover border",
  "700": "Solid brand fill",
  "800": "Solid fill that can hold text / hover",
  "900": "Secondary text and icon",
  "1000": "Primary text and icon",
};

export const COLOR_FAMILIES: {
  id: PrimitiveFamily;
  label: string;
  seed?: string;
}[] = [
  { id: "neutral", label: "Neutral · paper", seed: "100" },
  { id: "blue-electric", label: "Blue electric · interactive accent", seed: "700" },
  { id: "orange-electric", label: "Orange electric · expressive mark", seed: "700" },
  { id: "neutral-alpha", label: "Neutral alpha · states and veils" },
];

export const SEMANTIC_GROUPS: { title: string; tokens: string[] }[] = [
  {
    title: "Backgrounds",
    tokens: [
      "bg-canvas",
      "bg-elevated",
      "bg-sunken",
      "bg-disabled",
      "bg-fill",
      "bg-fill-hover",
      "bg-accent",
      "bg-accent-hover",
      "bg-accent-subtle",
      "bg-expressive",
      "bg-expressive-strong",
      "bg-expressive-subtle",
    ],
  },
  {
    title: "Text and icons",
    tokens: [
      "text-primary",
      "text-secondary",
      "text-tertiary",
      "text-disabled",
      "text-link",
      "text-expressive",
      "text-on-fill",
      "text-on-accent",
      "text-on-expressive",
      "icon-accent",
      "icon-expressive",
    ],
  },
  {
    title: "Borders",
    tokens: [
      "border-hairline",
      "border-control",
      "border-control-hover",
      "border-focus",
      "border-on-accent-subtle",
      "border-on-expressive-subtle",
    ],
  },
];

export function primitiveStep(family: PrimitiveFamily, step: ColorStep) {
  return primitive[family][step];
}

export function semanticResolved(name: string, mode: ColorMode) {
  const token = semantic[mode][name];
  return {
    name,
    reference: token.$value,
    hex: token.$extensions?.["ntc.resolved"] ?? "",
    primitive: primitiveFromReference(token.$value),
  };
}

export function familySteps(family: PrimitiveFamily) {
  return COLOR_STEPS.map((step) => {
    const token = primitiveStep(family, step);
    return {
      step,
      role: STEP_ROLES[step],
      value: token.$value,
      oklch: token.$extensions?.["ntc.oklch"],
      seed: Boolean(token.$extensions?.["ntc.seed"]),
    };
  });
}

export function primitiveFromReference(reference: string) {
  const match = reference.match(/color\.primitive\.([^.]+)\.(\d+)/);
  if (!match) {
    return reference;
  }

  return `${match[1]} / ${match[2]}`;
}

function hexChannel(value: number) {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function parseHex(hex: string): [number, number, number] {
  const raw = hex.replace("#", "");
  const body = raw.length === 3 ? raw.split("").map((part) => part + part).join("") : raw;
  return [
    Number.parseInt(body.slice(0, 2), 16),
    Number.parseInt(body.slice(2, 4), 16),
    Number.parseInt(body.slice(4, 6), 16),
  ];
}

export function relativeLuminance(hex: string) {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * hexChannel(r) + 0.7152 * hexChannel(g) + 0.0722 * hexChannel(b);
}

export function contrastRatio(foreground: string, background: string) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

export function contrastPairLabel(id: string) {
  return id
    .replace(/^CLARO \//, "Light / ")
    .replace(/^OSCURO \//, "Dark / ")
    .replace(/aviso: /g, "note: ")
    .replace(/texto pequeno/g, "small text")
    .replace(/texto grande/g, "large text")
    .replace(/ con texto papel/g, " with paper text")
    .replace(/ sobre /g, " on ")
    .replace(/ \(decorativo\)/g, " (decorative)")
    .replace(/borde /g, "border ")
    .replace(/texto /g, "text ")
    .replace(/lienzo/g, "canvas");
}

export function contrastRequirement(pair: ContrastPair) {
  if (pair.tipo === "decorativo") {
    return { label: "Decorative", min: null as number | null };
  }

  if (pair.tipo === "ui") {
    return { label: "UI 3:1", min: 3 };
  }

  const size = pair.size ?? 0;
  const weight = pair.weight ?? 400;
  const large = size >= 24 || (size >= 18 && weight >= 700);

  if (large) {
    return { label: "Large text 3:1", min: 3 };
  }

  return { label: "Small text 4.5:1", min: 4.5 };
}

export const TYPE_FAMILIES = [
  {
    id: "sans",
    token: "family-sans",
    name: "SF Pro",
    swift: ".system(design: .default)",
    role: "All UI: controls, labels, navigation, and body text.",
  },
  {
    id: "serif",
    token: "family-serif",
    name: "New York",
    swift: ".system(design: .serif)",
    role: "Screen titles, editorial moments, and empty states.",
  },
  {
    id: "mono",
    token: "family-mono",
    name: "SF Mono",
    swift: ".system(design: .monospaced)",
    role: "Data, times, identifiers, and figures that you compare.",
  },
] as const;

export const TYPE_WEIGHTS = [
  { token: "weight-regular", value: 400, use: "Body, labels, and the default." },
  {
    token: "weight-medium",
    value: 510,
    use: "Emphasis in a paragraph, numeric values, and the active tab.",
  },
  {
    token: "weight-semibold",
    value: 590,
    use: "Headline, buttons, and section headers.",
  },
  {
    token: "weight-bold",
    value: 700,
    use: "Only display and title-1 in serif.",
  },
] as const;

export const TYPE_STYLES = [
  {
    token: "display",
    family: "serif",
    apple: "Large Title",
    size: 34,
    lineHeight: 41,
    weight: 700,
    use: "Screen title. One per view, and not always.",
  },
  {
    token: "title-1-serif",
    family: "serif",
    apple: "Title 1",
    size: 28,
    lineHeight: 34,
    weight: 700,
    use: "Editorial section header.",
  },
  {
    token: "title-2",
    family: "sans",
    apple: "Title 2",
    size: 22,
    lineHeight: 28,
    weight: 590,
    use: "Section header.",
  },
  {
    token: "title-3",
    family: "sans",
    apple: "Title 3",
    size: 20,
    lineHeight: 25,
    weight: 590,
    use: "Subheader and card title.",
  },
  {
    token: "headline",
    family: "sans",
    apple: "Headline",
    size: 17,
    lineHeight: 22,
    weight: 590,
    use: "Emphasized row, button, and list header.",
  },
  {
    token: "body",
    family: "sans",
    apple: "Body",
    size: 17,
    lineHeight: 22,
    weight: 400,
    use: "Default body. The style used most often.",
  },
  {
    token: "body-emphasis",
    family: "sans",
    apple: "Body",
    size: 17,
    lineHeight: 22,
    weight: 510,
    use: "Emphasis inside body text.",
  },
  {
    token: "body-serif",
    family: "serif",
    apple: "Body",
    size: 17,
    lineHeight: 22,
    weight: 400,
    use: "Long reading: notes, articles, a forecast paragraph.",
  },
  {
    token: "callout",
    family: "sans",
    apple: "Callout",
    size: 16,
    lineHeight: 21,
    weight: 400,
    use: "Secondary text that is still content.",
  },
  {
    token: "subheadline",
    family: "sans",
    apple: "Subheadline",
    size: 15,
    lineHeight: 20,
    weight: 400,
    use: "Metadata and row subtitle.",
  },
  {
    token: "footnote",
    family: "sans",
    apple: "Footnote",
    size: 13,
    lineHeight: 18,
    weight: 400,
    use: "Footnotes and contextual help.",
  },
  {
    token: "caption-1",
    family: "sans",
    apple: "Caption 1",
    size: 12,
    lineHeight: 16,
    weight: 400,
    use: "Labels and counters.",
  },
  {
    token: "caption-2",
    family: "sans",
    apple: "Caption 2",
    size: 11,
    lineHeight: 13,
    weight: 400,
    use: "The minimum. Use only if there is no other option.",
  },
  {
    token: "mono-body",
    family: "mono",
    apple: "Body",
    size: 17,
    lineHeight: 22,
    weight: 400,
    use: "Inline data and identifiers.",
  },
  {
    token: "mono-footnote",
    family: "mono",
    apple: "Footnote",
    size: 13,
    lineHeight: 18,
    weight: 400,
    use: "Times, table figures, and timestamps.",
  },
] as const;

export const WEB_TYPE_FAMILIES = [
  {
    id: "sans",
    token: "family-sans-web",
    name: "Inter",
    role: "All web UI: the letter, docs, titles, and controls. Web only.",
  },
  {
    id: "mono",
    token: "family-mono-web",
    name: "ui-monospace",
    role: "Data, times, identifiers, and figures that you compare. System stand-in on the web.",
  },
] as const;

export const WEB_TYPE_WEIGHTS = [
  {
    token: "weight-regular",
    value: 400,
    use: "Body, UI, captions, and the default.",
  },
  {
    token: "weight-heading",
    value: 500,
    use: "Titles and headings only. One hundred points above body.",
  },
] as const;

export const WEB_TYPE_STYLES = [
  {
    token: "body",
    family: "sans" as const,
    size: 17,
    lineHeight: 22,
    weight: 400,
    color: "Neutral 700",
    use: "Default reading text. The style used most often.",
  },
  {
    token: "heading",
    family: "sans" as const,
    size: 17,
    lineHeight: 22,
    weight: 500,
    color: "Neutral 1000",
    use: "Page titles and section titles.",
  },
  {
    token: "ui",
    family: "sans" as const,
    size: 15,
    lineHeight: 20,
    weight: 400,
    color: "Neutral 900",
    use: "Tables, toast, contrast chips, and compact chrome.",
  },
  {
    token: "caption",
    family: "sans" as const,
    size: 12,
    lineHeight: 16,
    weight: 400,
    color: "Neutral 900",
    use: "Kickers, swatch captions, ramp hex, and type meta.",
  },
] as const;

export type ContrastPair = {
  id: string;
  fg: string;
  bg: string;
  tipo: string;
  size?: number;
  weight?: number;
};

export const CONTRAST_PAIRS = contrastPairs as ContrastPair[];
