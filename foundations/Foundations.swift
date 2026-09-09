// Foundations.swift
// Root · semantic color layer
//
// GENERATED. Do not edit by hand. Rebuild with build_palette.py and emit.py.
//
// Primitive steps (neutral-100…1000, and the rest) are not here on purpose.
// If a view needs a primitive, a semantic alias is missing.
//
// Each alias also exists as a Color Set in Assets.xcassets with Any / Dark
// appearances. Production code uses Color("name"). The literals below are
// for previews and tests.

import SwiftUI

public extension Color {

    // MARK: Backgrounds

    /// `neutral-100` light · `neutral-100` dark — #FBFAF9 / #090807
    static let bgCanvas = Color("bg-canvas", bundle: .main)
    /// `neutral-200` light · `neutral-200` dark — #F3F1F0 / #1B1918
    static let bgElevated = Color("bg-elevated", bundle: .main)
    /// `neutral-300` light · `neutral-100` dark — #EAE7E5 / #090807
    static let bgSunken = Color("bg-sunken", bundle: .main)
    /// `neutral-300` light · `neutral-300` dark — #EAE7E5 / #242221
    static let bgDisabled = Color("bg-disabled", bundle: .main)
    /// `neutral-1000` light · `neutral-1000` dark — #262524 / #FBFAF9
    static let bgFill = Color("bg-fill", bundle: .main)
    /// `neutral-900` light · `neutral-900` dark — #545250 / #A9A7A5
    static let bgFillHover = Color("bg-fill-hover", bundle: .main)
    /// `blue-electric-700` light · `blue-electric-700` dark — #2A56F7 / #2A56F7
    static let bgAccent = Color("bg-accent", bundle: .main)
    /// `blue-electric-800` light · `blue-electric-800` dark — #1B3DE3 / #4D7CFF
    static let bgAccentHover = Color("bg-accent-hover", bundle: .main)
    /// `blue-electric-200` light · `blue-electric-200` dark — #E8F0FF / #131E38
    static let bgAccentSubtle = Color("bg-accent-subtle", bundle: .main)
    /// `orange-electric-700` light · `orange-electric-700` dark — #F7452A / #F7452A
    static let bgExpressive = Color("bg-expressive", bundle: .main)
    /// `orange-electric-800` light · `orange-electric-800` dark — #C91E00 / #FF6C54
    static let bgExpressiveStrong = Color("bg-expressive-strong", bundle: .main)
    /// `orange-electric-200` light · `orange-electric-200` dark — #FFECE8 / #341711
    static let bgExpressiveSubtle = Color("bg-expressive-subtle", bundle: .main)

    // MARK: Text and icons

    /// `neutral-1000` light · `neutral-1000` dark — #262524 / #FBFAF9
    static let textPrimary = Color("text-primary", bundle: .main)
    /// `neutral-900` light · `neutral-900` dark — #545250 / #A9A7A5
    static let textSecondary = Color("text-secondary", bundle: .main)
    /// `neutral-800` light · `neutral-800` dark — #63605D / #94928F
    static let textTertiary = Color("text-tertiary", bundle: .main)
    /// `neutral-700` light · `neutral-700` dark — #736F6C / #858380
    static let textDisabled = Color("text-disabled", bundle: .main)
    /// `blue-electric-900` light · `blue-electric-900` dark — #1531C5 / #80A6FF
    static let textLink = Color("text-link", bundle: .main)
    /// `orange-electric-900` light · `orange-electric-900` dark — #9F1600 / #FF9683
    static let textExpressive = Color("text-expressive", bundle: .main)
    /// `neutral-100` light · `neutral-100` dark — #FBFAF9 / #090807
    static let textOnFill = Color("text-on-fill", bundle: .main)
    /// `neutral-100` light · `neutral-1000` dark — #FBFAF9 / #FBFAF9
    static let textOnAccent = Color("text-on-accent", bundle: .main)
    /// `neutral-100` light · `neutral-100` dark — #FBFAF9 / #090807
    static let textOnExpressive = Color("text-on-expressive", bundle: .main)
    /// `blue-electric-700` light · `blue-electric-700` dark — #2A56F7 / #2A56F7
    static let iconAccent = Color("icon-accent", bundle: .main)
    /// `orange-electric-700` light · `orange-electric-700` dark — #F7452A / #F7452A
    static let iconExpressive = Color("icon-expressive", bundle: .main)

    // MARK: Borders

    /// `neutral-400` light · `neutral-400` dark — #DAD7D4 / #32302E
    static let borderHairline = Color("border-hairline", bundle: .main)
    /// `neutral-500` light · `neutral-500` dark — #928E8B / #656360
    static let borderControl = Color("border-control", bundle: .main)
    /// `neutral-600` light · `neutral-600` dark — #817E7A / #75726F
    static let borderControlHover = Color("border-control-hover", bundle: .main)
    /// `blue-electric-700` light · `blue-electric-700` dark — #2A56F7 / #2A56F7
    static let borderFocus = Color("border-focus", bundle: .main)
    /// `blue-electric-700` light · `blue-electric-800` dark — #2A56F7 / #4D7CFF
    static let borderOnAccentSubtle = Color("border-on-accent-subtle", bundle: .main)
    /// `orange-electric-700` light · `orange-electric-800` dark — #F7452A / #FF6C54
    static let borderOnExpressiveSubtle = Color("border-on-expressive-subtle", bundle: .main)
}

public extension Color {
    static func ntc(light: UInt32, dark: UInt32) -> Color {
        Color(UIColor { $0.userInterfaceStyle == .dark
            ? UIColor(hex: dark) : UIColor(hex: light) })
    }
}

extension UIColor {
    convenience init(hex: UInt32) {
        self.init(red:   CGFloat((hex >> 16) & 0xFF) / 255,
                  green: CGFloat((hex >>  8) & 0xFF) / 255,
                  blue:  CGFloat( hex        & 0xFF) / 255,
                  alpha: 1)
    }
}

public enum NTCColor {
    public static let bgCanvas = Color.ntc(light: 0xFBFAF9, dark: 0x090807)
    public static let bgElevated = Color.ntc(light: 0xF3F1F0, dark: 0x1B1918)
    public static let bgSunken = Color.ntc(light: 0xEAE7E5, dark: 0x090807)
    public static let bgDisabled = Color.ntc(light: 0xEAE7E5, dark: 0x242221)
    public static let bgFill = Color.ntc(light: 0x262524, dark: 0xFBFAF9)
    public static let bgFillHover = Color.ntc(light: 0x545250, dark: 0xA9A7A5)
    public static let bgAccent = Color.ntc(light: 0x2A56F7, dark: 0x2A56F7)
    public static let bgAccentHover = Color.ntc(light: 0x1B3DE3, dark: 0x4D7CFF)
    public static let bgAccentSubtle = Color.ntc(light: 0xE8F0FF, dark: 0x131E38)
    public static let bgExpressive = Color.ntc(light: 0xF7452A, dark: 0xF7452A)
    public static let bgExpressiveStrong = Color.ntc(light: 0xC91E00, dark: 0xFF6C54)
    public static let bgExpressiveSubtle = Color.ntc(light: 0xFFECE8, dark: 0x341711)
    public static let textPrimary = Color.ntc(light: 0x262524, dark: 0xFBFAF9)
    public static let textSecondary = Color.ntc(light: 0x545250, dark: 0xA9A7A5)
    public static let textTertiary = Color.ntc(light: 0x63605D, dark: 0x94928F)
    public static let textDisabled = Color.ntc(light: 0x736F6C, dark: 0x858380)
    public static let textLink = Color.ntc(light: 0x1531C5, dark: 0x80A6FF)
    public static let textExpressive = Color.ntc(light: 0x9F1600, dark: 0xFF9683)
    public static let textOnFill = Color.ntc(light: 0xFBFAF9, dark: 0x090807)
    public static let textOnAccent = Color.ntc(light: 0xFBFAF9, dark: 0xFBFAF9)
    public static let textOnExpressive = Color.ntc(light: 0xFBFAF9, dark: 0x090807)
    public static let iconAccent = Color.ntc(light: 0x2A56F7, dark: 0x2A56F7)
    public static let iconExpressive = Color.ntc(light: 0xF7452A, dark: 0xF7452A)
    public static let borderHairline = Color.ntc(light: 0xDAD7D4, dark: 0x32302E)
    public static let borderControl = Color.ntc(light: 0x928E8B, dark: 0x656360)
    public static let borderControlHover = Color.ntc(light: 0x817E7A, dark: 0x75726F)
    public static let borderFocus = Color.ntc(light: 0x2A56F7, dark: 0x2A56F7)
    public static let borderOnAccentSubtle = Color.ntc(light: 0x2A56F7, dark: 0x4D7CFF)
    public static let borderOnExpressiveSubtle = Color.ntc(light: 0xF7452A, dark: 0xFF6C54)
}

public enum NTCState {
    /// neutral-alpha-200 — 5%
    public static let hover = Color.ntc(light: 0x000000, dark: 0xFFFFFF).opacity(0.05)
    /// neutral-alpha-300 — 8%
    public static let pressed = Color.ntc(light: 0x000000, dark: 0xFFFFFF).opacity(0.08)
    /// neutral-alpha-900 — 60%, veil for sheets and overlays
    public static let scrim = Color.ntc(light: 0x000000, dark: 0x000000).opacity(0.60)
}

public extension Font {
    static let display = Font.system(.largeTitle, design: .serif, weight: .bold)
    static let title1Serif = Font.system(.title, design: .serif, weight: .bold)
    static let bodySerif = Font.system(.body, design: .serif, weight: .regular)

    static let title2 = Font.system(.title2, design: .default, weight: .semibold)
    static let title3 = Font.system(.title3, design: .default, weight: .semibold)
    static let headlineNTC = Font.system(.headline, design: .default, weight: .semibold)
    static let bodyNTC = Font.system(.body, design: .default, weight: .regular)
    static let bodyEmphasis = Font.system(.body, design: .default, weight: .medium)
    static let calloutNTC = Font.system(.callout, design: .default, weight: .regular)
    static let subheadline = Font.system(.subheadline, design: .default, weight: .regular)
    static let footnoteNTC = Font.system(.footnote, design: .default, weight: .regular)
    static let caption1 = Font.system(.caption, design: .default, weight: .regular)
    static let caption2 = Font.system(.caption2, design: .default, weight: .regular)

    static let monoBody = Font.system(.body, design: .monospaced, weight: .regular)
    static let monoFootnote = Font.system(.footnote, design: .monospaced, weight: .regular)
}

public enum NTCSpace {
    public static let tight: CGFloat = 4
    public static let related: CGFloat = 8
    public static let grouped: CGFloat = 16
    public static let inset: CGFloat = 24
    public static let section: CGFloat = 48
    public static let gutter: CGFloat = 80
    public static let canvas: CGFloat = 120
}
