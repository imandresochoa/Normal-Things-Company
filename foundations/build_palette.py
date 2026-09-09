#!/usr/bin/env python3
"""Build the Root primitive palette from three OKLCH seeds."""
from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def _s2l(c: float) -> float:
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _l2s(c: float) -> float:
    v = 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055
    return v * 255.0


M1 = [
    [0.4122214708, 0.5363325363, 0.0514459929],
    [0.2119034982, 0.6806995451, 0.1073969566],
    [0.0883024619, 0.2817188376, 0.6299787005],
]
M2 = [
    [0.2104542553, 0.7936177850, -0.0040720468],
    [1.9779984951, -2.4285922050, 0.4505937099],
    [0.0259040371, 0.7827717662, -0.8086757660],
]
M1I = [
    [4.0767416621, -3.3077115913, 0.2309699292],
    [-1.2684380046, 2.6097574011, -0.3413193965],
    [-0.0041960863, -0.7034186147, 1.7076147010],
]
M2I = [
    [1.0, 0.3963377774, 0.2158037573],
    [1.0, -0.1055613458, -0.0638541728],
    [1.0, -0.0894841775, -1.2914855480],
]


def _mul(matrix: list[list[float]], vector: list[float]) -> list[float]:
    return [sum(matrix[i][j] * vector[j] for j in range(3)) for i in range(3)]


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def rgb_to_hex(rgb: list[float]) -> str:
    return "#" + "".join(f"{max(0, min(255, round(v))):02X}" for v in rgb)


def rgb_to_oklch(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    L, a, b = _mul(
        M2,
        [
            math.copysign(abs(x) ** (1 / 3), x)
            for x in _mul(M1, [_s2l(c) for c in rgb])
        ],
    )
    return L, math.hypot(a, b), math.degrees(math.atan2(b, a)) % 360


def oklch_to_rgb(L: float, C: float, H: float) -> list[float]:
    h = math.radians(H)
    lms_ = _mul(M2I, [L, C * math.cos(h), C * math.sin(h)])
    return [_l2s(c) for c in _mul(M1I, [x**3 for x in lms_])]


def oklch_to_hex(L: float, C: float, H: float, tol: float = 0.35) -> tuple[str, float]:
    """Lower chroma by bisection until the color fits in sRGB."""

    def ok(chroma: float) -> bool:
        return all(-tol <= v <= 255 + tol for v in oklch_to_rgb(L, chroma, H))

    if not ok(C):
        lo, hi = 0.0, C
        for _ in range(40):
            mid = (lo + hi) / 2
            lo, hi = (mid, hi) if ok(mid) else (lo, mid)
        C = lo
    return rgb_to_hex(oklch_to_rgb(L, C, H)), C


SEEDS = {
    "neutral": "#FBFAF9",
    "blue-electric": "#2A56F7",
    "orange-electric": "#F7452A",
}
SEED_LCH = {name: rgb_to_oklch(hex_to_rgb(hex_value)) for name, hex_value in SEEDS.items()}

STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]

ROLES = {
    100: "Canvas / default background",
    200: "Raised surface / hover background",
    300: "Pressed surface / grouped background",
    400: "Hairline divider (decorative)",
    500: "Control border",
    600: "Hover border",
    700: "Solid brand fill",
    800: "Solid fill that can hold text / hover",
    900: "Secondary text and icon",
    1000: "Primary text and icon",
}

# Step that is the seed, used as-is.
ANCHOR = {
    "neutral": {"light": 100, "dark": 1000},
    "blue-electric": {"light": 700, "dark": 700},
    "orange-electric": {"light": 700, "dark": 700},
}

L_TARGET = {
    "light": {
        "neutral": [0.9856, 0.9600, 0.9300, 0.8800, 0.6500, 0.5950, 0.5450, 0.4900, 0.4400, 0.2650],
        "blue-electric": [0.9780, 0.9530, 0.9200, 0.8700, 0.6750, 0.6100, 0.5346, 0.4700, 0.4200, 0.3100],
        "orange-electric": [0.9800, 0.9570, 0.9250, 0.8780, 0.8000, 0.7200, 0.6485, 0.5350, 0.4500, 0.3300],
    },
    "dark": {
        "neutral": [0.1350, 0.2150, 0.2550, 0.3100, 0.5000, 0.5550, 0.6100, 0.6600, 0.7300, 0.9856],
        "blue-electric": [0.2000, 0.2400, 0.2800, 0.3350, 0.4350, 0.4850, 0.5346, 0.6250, 0.7350, 0.9050],
        "orange-electric": [0.2050, 0.2450, 0.2850, 0.3400, 0.4900, 0.5600, 0.6485, 0.7100, 0.7800, 0.9150],
    },
}

C_NEUTRAL = {
    "light": [0.0017, 0.0030, 0.0042, 0.0055, 0.0068, 0.0068, 0.0064, 0.0058, 0.0048, 0.0032],
    "dark": [0.0030, 0.0038, 0.0045, 0.0052, 0.0058, 0.0058, 0.0055, 0.0050, 0.0042, 0.0017],
}
C_FRACTION = {
    "light": {
        "blue-electric": [0.070, 0.140, 0.230, 0.350, 0.780, 0.900, 1.000, 1.020, 0.930, 0.700],
        "orange-electric": [0.070, 0.145, 0.240, 0.365, 0.620, 0.820, 1.000, 1.000, 0.900, 0.640],
    },
    "dark": {
        "blue-electric": [0.145, 0.215, 0.295, 0.410, 0.720, 0.840, 1.000, 0.960, 0.700, 0.340],
        "orange-electric": [0.150, 0.225, 0.305, 0.420, 0.730, 0.850, 1.000, 0.920, 0.660, 0.310],
    },
}

ALPHA = [
    (100, 0.03),
    (200, 0.05),
    (300, 0.08),
    (400, 0.11),
    (500, 0.16),
    (600, 0.22),
    (700, 0.30),
    (800, 0.42),
    (900, 0.60),
    (1000, 0.85),
]


def build_family(family: str, mode: str) -> list[dict]:
    seed_l, seed_c, seed_h = SEED_LCH[family]
    rows = []
    for i, step in enumerate(STEPS):
        if ANCHOR[family][mode] == step:
            hex_value, L, C, H = SEEDS[family], seed_l, seed_c, seed_h
        else:
            L = L_TARGET[mode][family][i]
            C = (
                C_NEUTRAL[mode][i]
                if family == "neutral"
                else seed_c * C_FRACTION[mode][family][i]
            )
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
                "role": ROLES[step],
                "seed": ANCHOR[family][mode] == step,
            }
        )
    lightness = [row["L"] for row in rows]
    ascending = all(b >= a for a, b in zip(lightness, lightness[1:]))
    descending = all(b <= a for a, b in zip(lightness, lightness[1:]))
    assert ascending or descending, f"{family}/{mode} is not monotone in L: {lightness}"
    return rows


def build() -> dict:
    palette = {
        family: {mode: build_family(family, mode) for mode in ("light", "dark")}
        for family in SEEDS
    }
    palette["neutral-alpha"] = {
        mode: [
            {
                "step": step,
                "hex": ("#000000" if mode == "light" else "#FFFFFF")
                + f"{round(alpha * 255):02X}",
                "alpha": alpha,
                "role": ROLES[step],
            }
            for step, alpha in ALPHA
        ]
        for mode in ("light", "dark")
    }
    return palette


if __name__ == "__main__":
    palette = build()
    for family in SEEDS:
        print(f"\n=== {family.upper()} ===")
        print(f"{'step':>5} {'light':>9} {'dark':>9}   role")
        for i, step in enumerate(STEPS):
            light, dark = palette[family]["light"][i], palette[family]["dark"][i]
            mark = " *" if light["seed"] or dark["seed"] else "  "
            print(f"{step:>5} {light['hex']:>9} {dark['hex']:>9}{mark} {light['role']}")
    print("\n=== NEUTRAL-ALPHA ===")
    for light, dark in zip(palette["neutral-alpha"]["light"], palette["neutral-alpha"]["dark"]):
        print(f"{light['step']:>5} {light['hex']:>10} {dark['hex']:>10}   {light['role']}")
    (ROOT / "palette.json").write_text(json.dumps(palette, indent=2))
    print("\n* = anchored seed. Monotone check passed on all six ramps.")
