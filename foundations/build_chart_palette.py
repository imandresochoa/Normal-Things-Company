#!/usr/bin/env python3
"""Build Chart primitives and plot aliases. Light plate only. Not UI chrome."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from build_palette import (  # noqa: E402
    C_FRACTION,
    L_TARGET,
    STEPS,
    hex_to_rgb,
    oklch_to_hex,
    rgb_to_oklch,
)

SEEDS = {
    "indigo": "#4868B7",
    "ember": "#C46150",
    "teal": "#1B9CAB",
    "moss": "#0C5E27",
}
SEED_LCH = {name: rgb_to_oklch(hex_to_rgb(hex_value)) for name, hex_value in SEEDS.items()}
FAMILIES = list(SEEDS)
ANCHOR_STEP = 700
ANCHOR_INDEX = STEPS.index(ANCHOR_STEP)
TEMPLATE_L = L_TARGET["light"]["blue-electric"]
CHROMA_FRACTION = C_FRACTION["light"]["blue-electric"]
L_START = TEMPLATE_L[0]
L_END = TEMPLATE_L[-1]
T_ANCHOR = TEMPLATE_L[ANCHOR_INDEX]

CHART_ROLES = {
    100: "Lightest chart wash",
    200: "Light chart wash",
    300: "Soft chart wash",
    400: "Illustration wash",
    500: "Muted chart fill",
    600: "Chart fill hover",
    700: "Series and illustration ink",
    800: "Deeper chart ink",
    900: "Dark chart ink",
    1000: "Darkest chart ink",
}


def lightness_for(seed_l: float, index: int) -> float:
    """Keep the electric light-plate shape, pinned to this family's 700 L."""
    if index <= ANCHOR_INDEX:
        span_t = L_START - T_ANCHOR
        span_n = L_START - seed_l
        return L_START - (L_START - TEMPLATE_L[index]) * (span_n / span_t)

    end = min(L_END, seed_l - 0.08)
    if end >= seed_l:
        end = seed_l * 0.75
    frac = (T_ANCHOR - TEMPLATE_L[index]) / (T_ANCHOR - L_END)
    return seed_l - frac * (seed_l - end)


def build_family(family: str) -> list[dict]:
    seed_l, seed_c, seed_h = SEED_LCH[family]
    rows = []
    for i, step in enumerate(STEPS):
        if step == ANCHOR_STEP:
            hex_value, L, C, H = SEEDS[family], seed_l, seed_c, seed_h
        else:
            L = lightness_for(seed_l, i)
            C = seed_c * CHROMA_FRACTION[i]
            H = seed_h
            hex_value, C = oklch_to_hex(L, C, H)
        rows.append(
            {
                "step": step,
                "hex": hex_value,
                "oklch": f"oklch({L:.4f} {C:.4f} {H:.2f})",
                "L": round(L, 4),
                "C": round(C, 4),
                "H": round(H, 2),
                "role": CHART_ROLES[step],
                "seed": step == ANCHOR_STEP,
            }
        )
    lightness = [row["L"] for row in rows]
    descending = all(b <= a for a, b in zip(lightness, lightness[1:]))
    assert descending, f"{family} is not monotone in L: {lightness}"
    return rows


def ui_primitive_hex(tokens: dict, family: str, step: int) -> str:
    return tokens["color"]["primitive"][family][str(step)]["$value"]["light"]


def semantic_token(reference: str, resolved: str, description: str) -> dict:
    return {
        "$type": "color",
        "$value": reference,
        "$description": description,
        "$extensions": {"ntc.resolved": resolved},
    }


def build_tokens(palette: dict) -> dict:
    ui_tokens = json.loads((ROOT / "tokens.json").read_text())
    hex_at = {
        family: {row["step"]: row for row in rows} for family, rows in palette.items()
    }

    tokens: dict = {
        "$description": (
            "Root Pulse. Chart primitives and plot/illustration aliases. "
            "Not for UI chrome."
        ),
        "color": {"primitive": {}, "semantic": {}},
    }

    for family in FAMILIES:
        tokens["color"]["primitive"][family] = {}
        for row in palette[family]:
            step = str(row["step"])
            tokens["color"]["primitive"][family][step] = {
                "$type": "color",
                "$value": {"light": row["hex"], "dark": row["hex"]},
                "$description": row["role"],
                "$extensions": {
                    "ntc.oklch": {"light": row["oklch"], "dark": row["oklch"]},
                    "ntc.seed": row["seed"],
                },
            }

    semantic = tokens["color"]["semantic"]
    for index, family in enumerate(FAMILIES, start=1):
        ink = hex_at[family][700]
        wash = hex_at[family][400]
        semantic[f"series-{index}"] = semantic_token(
            f"{{color.primitive.{family}.700}}",
            ink["hex"],
            f"Series {index} — {ink['role']}",
        )
        semantic[f"illust-{family}"] = semantic_token(
            f"{{color.primitive.{family}.700}}",
            ink["hex"],
            f"Illustration ink — {family} 700",
        )
        semantic[f"illust-{family}-wash"] = semantic_token(
            f"{{color.primitive.{family}.400}}",
            wash["hex"],
            f"Illustration wash — {family} 400",
        )

    plot_aliases = [
        ("plot-paper", "neutral", 100, "Plot paper"),
        ("plot-grid-minor", "neutral", 300, "Plot minor grid"),
        ("plot-grid-major", "neutral", 400, "Plot major grid"),
        ("plot-axis", "neutral", 500, "Plot axis"),
        ("plot-context", "neutral", 400, "Plot context"),
        ("plot-label", "neutral", 1000, "Plot label"),
        ("plot-label-quiet", "neutral", 900, "Plot quiet label"),
        ("plot-subject", "blue-electric", 700, "Plot subject"),
        ("plot-moment", "orange-electric", 700, "Plot moment"),
    ]
    for name, family, step, description in plot_aliases:
        resolved = ui_primitive_hex(ui_tokens, family, step)
        semantic[name] = semantic_token(
            f"{{color.primitive.{family}.{step}}}",
            resolved,
            description,
        )

    return tokens


def build() -> dict:
    return {family: build_family(family) for family in FAMILIES}


if __name__ == "__main__":
    palette = build()
    for family in FAMILIES:
        print(f"\n=== {family.upper()} ===")
        print(f"{'step':>5} {'hex':>9}   role")
        for row in palette[family]:
            mark = " *" if row["seed"] else "  "
            print(f"{row['step']:>5} {row['hex']:>9}{mark} {row['role']}")
    tokens = build_tokens(palette)
    (ROOT / "chart_tokens.json").write_text(
        json.dumps(tokens, indent=2, ensure_ascii=False) + "\n"
    )
    print("\n* = anchored Chart 700. Light plate only. Wrote chart_tokens.json.")
