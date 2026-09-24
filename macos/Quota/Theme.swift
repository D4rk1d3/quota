import SwiftUI
import AppKit

private func nsColor(hex: String, alpha: CGFloat = 1) -> NSColor {
    var value: UInt64 = 0
    Scanner(string: hex).scanHexInt64(&value)
    return NSColor(
        srgbRed: CGFloat((value >> 16) & 0xFF) / 255,
        green: CGFloat((value >> 8) & 0xFF) / 255,
        blue: CGFloat(value & 0xFF) / 255,
        alpha: alpha
    )
}

extension Color {
    /// Colore che segue il tema di sistema: `dark` e `light` da PALETTE.md.
    init(dark: String, light: String, darkAlpha: CGFloat = 1, lightAlpha: CGFloat = 1) {
        self.init(nsColor: NSColor(name: nil) { appearance in
            let isDark = appearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
            return isDark ? nsColor(hex: dark, alpha: darkAlpha) : nsColor(hex: light, alpha: lightAlpha)
        })
    }

    init(hex: String) { self.init(nsColor: nsColor(hex: hex)) }

    static let qBackground = Color(dark: "0B0B0D", light: "F2F2F5")
    static let qSurface = Color(dark: "1C1C1E", light: "FFFFFF")
    static let qTextPrimary = Color(dark: "FFFFFF", light: "1C1C1E")
    static let qTextSecondary = Color(dark: "FFFFFF", light: "000000", darkAlpha: 0.56, lightAlpha: 0.55)
    static let qTextTertiary = Color(dark: "FFFFFF", light: "000000", darkAlpha: 0.35, lightAlpha: 0.35)
    static let qSeparator = Color(dark: "FFFFFF", light: "000000", darkAlpha: 0.08, lightAlpha: 0.08)
    static let qAccent = Color(dark: "5B8F6F", light: "4C7A5D")
    static let qAccentText = Color(dark: "7FB093", light: "3F6350")
    static let qAmber = Color(dark: "E3A548", light: "9A5F12")
    static let qRed = Color(dark: "E2685C", light: "C23B2E")
    static let qPurple = Color(dark: "8E7CC3", light: "6B54A8")
    static let qBlue = Color(hex: "5A8FBF")

    static let qAvatarTints: [Color] = ["5A8FBF", "8E7CC3", "C97B9A", "D9925A", "5AB3AB", "5B8F6F"].map { Color(hex: $0) }
}

enum QRadius {
    static let input: CGFloat = 14
    static let card: CGFloat = 22
    static let hero: CGFloat = 26
}

extension View {
    /// Card piena #1C1C1E con ombra morbida (elevation.2).
    func qCard(radius: CGFloat = QRadius.card) -> some View {
        background(Color.qSurface, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
            .shadow(color: .black.opacity(0.28), radius: 14, x: 0, y: 8)
    }
}

struct QPillButtonStyle: ButtonStyle {
    enum Kind { case primary, secondary, destructive }
    var kind: Kind = .primary
    var large = false
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        let (bg, fg): (Color, Color) = switch kind {
        case .primary: (.qAccent, .white)
        case .secondary: (Color.qTextPrimary.opacity(0.08), .qTextPrimary)
        case .destructive: (Color.qRed.opacity(0.14), .qRed)
        }
        configuration.label
            .font(.system(size: large ? 15 : 13, weight: .semibold))
            .foregroundStyle(fg)
            .padding(.horizontal, large ? 22 : 16)
            .frame(height: large ? 52 : 34)
            .background(bg.opacity(configuration.isPressed ? 0.75 : 1), in: Capsule())
            .contentShape(Capsule())
            .opacity(isEnabled ? 1 : 0.4)
    }
}

extension ButtonStyle where Self == QPillButtonStyle {
    static var qPrimary: QPillButtonStyle { .init(kind: .primary) }
    static var qPrimaryLarge: QPillButtonStyle { .init(kind: .primary, large: true) }
    static var qSecondary: QPillButtonStyle { .init(kind: .secondary) }
    static var qDestructive: QPillButtonStyle { .init(kind: .destructive) }
}
