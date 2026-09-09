#!/usr/bin/env python3
"""Write tokens.json from a verified palette.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
palette = json.loads((ROOT / "palette.json").read_text())
FAMILIES = ["neutral", "blue-electric", "orange-electric"]
STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]


def hx(family: str, mode: str, step: int) -> str:
    return next(row["hex"] for row in palette[family][mode] if row["step"] == step)


def row(family: str, mode: str, step: int) -> dict:
    return next(item for item in palette[family][mode] if item["step"] == step)


def _lum(hex_value: str) -> float:
    hex_value = hex_value.lstrip("#")
    channels = [int(hex_value[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    channels = [
        x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in channels
    ]
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]


def ratio(fg: str, bg: str) -> float:
    a, b = _lum(fg), _lum(bg)
    lo, hi = min(a, b), max(a, b)
    return round((hi + 0.05) / (lo + 0.05), 2)


SEM = [
    (
        "Backgrounds",
        [
            ("bg-canvas", "neutral", 100, 100, None, None),
            ("bg-elevated", "neutral", 200, 200, None, None),
            ("bg-sunken", "neutral", 300, 100, None, None),
            ("bg-disabled", "neutral", 300, 300, None, None),
            ("bg-fill", "neutral", 1000, 1000, None, None),
            ("bg-fill-hover", "neutral", 900, 900, None, None),
            ("bg-accent", "blue-electric", 700, 700, None, None),
            ("bg-accent-hover", "blue-electric", 800, 800, None, None),
            ("bg-accent-subtle", "blue-electric", 200, 200, None, None),
            ("bg-expressive", "orange-electric", 700, 700, None, None),
            ("bg-expressive-strong", "orange-electric", 800, 800, None, None),
            ("bg-expressive-subtle", "orange-electric", 200, 200, None, None),
        ],
    ),
    (
        "Text and icons",
        [
            ("text-primary", "neutral", 1000, 1000, "bg-canvas", 4.5),
            ("text-secondary", "neutral", 900, 900, "bg-canvas", 4.5),
            ("text-tertiary", "neutral", 800, 800, "bg-canvas", 4.5),
            ("text-disabled", "neutral", 700, 700, "bg-canvas", None),
            ("text-link", "blue-electric", 900, 900, "bg-canvas", 4.5),
            ("text-expressive", "orange-electric", 900, 900, "bg-canvas", 4.5),
            ("text-on-fill", "neutral", 100, 100, "bg-fill", 4.5),
            ("text-on-accent", "neutral", 100, 1000, "bg-accent", 4.5),
            ("text-on-expressive", "neutral", 100, 100, "bg-expressive-strong", 4.5),
            ("icon-accent", "blue-electric", 700, 700, "bg-canvas", 3.0),
            ("icon-expressive", "orange-electric", 700, 700, "bg-canvas", 3.0),
        ],
    ),
    (
        "Borders",
        [
            ("border-hairline", "neutral", 400, 400, "bg-canvas", None),
            ("border-control", "neutral", 500, 500, "bg-canvas", 3.0),
            ("border-control-hover", "neutral", 600, 600, "bg-canvas", 3.0),
            ("border-focus", "blue-electric", 700, 700, "bg-canvas", 3.0),
            ("border-on-accent-subtle", "blue-electric", 700, 800, "bg-accent-subtle", 3.0),
            ("border-on-expressive-subtle", "orange-electric", 700, 800, "bg-expressive-subtle", 3.0),
        ],
    ),
]

BG_OF = {token: (family, light_step, dark_step) for _, group in SEM for (token, family, light_step, dark_step, _ref, _thr) in group}


def sem_hex(token: str, mode: str) -> str:
    family, light_step, dark_step = BG_OF[token]
    return hx(family, mode, light_step if mode == "light" else dark_step)


tokens = {
    "$description": "Root foundations. Primitive ramps and semantic color aliases.",
    "color": {"primitive": {}, "semantic": {"light": {}, "dark": {}}},
}

for family in FAMILIES:
    tokens["color"]["primitive"][family] = {}
    for step in STEPS:
        light, dark = row(family, "light", step), row(family, "dark", step)
        tokens["color"]["primitive"][family][str(step)] = {
            "$type": "color",
            "$value": {"light": light["hex"], "dark": dark["hex"]},
            "$description": light["role"],
            "$extensions": {
                "ntc.oklch": {"light": light["oklch"], "dark": dark["oklch"]},
                "ntc.seed": light["seed"] or dark["seed"],
            },
        }

tokens["color"]["primitive"]["neutral-alpha"] = {
    str(light["step"]): {
        "$type": "color",
        "$value": {"light": light["hex"], "dark": dark["hex"]},
        "$description": "Ink on canvas, for states and veils",
    }
    for light, dark in zip(palette["neutral-alpha"]["light"], palette["neutral-alpha"]["dark"])
}

for group, items in SEM:
    for token, family, light_step, dark_step, _ref, _thr in items:
        for mode, step in (("light", light_step), ("dark", dark_step)):
            tokens["color"]["semantic"][mode][token] = {
                "$type": "color",
                "$value": f"{{color.primitive.{family}.{step}}}",
                "$description": f"{group} — {row(family, mode, step)['role']}",
                "$extensions": {"ntc.resolved": hx(family, mode, step)},
            }

(ROOT / "tokens.json").write_text(json.dumps(tokens, indent=2, ensure_ascii=False) + "\n")
print("wrote tokens.json")
