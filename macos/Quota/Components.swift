import SwiftUI

struct QAvatar: View {
    let name: String
    var size: CGFloat = 44

    private var tint: Color {
        let sum = name.unicodeScalars.reduce(0) { $0 + Int($1.value) }
        return Color.qAvatarTints[sum % Color.qAvatarTints.count]
    }

    var body: some View {
        Circle().fill(tint)
            .frame(width: size, height: size)
            .overlay(Text(initials(name)).font(.system(size: size * 0.34, weight: .bold)).foregroundStyle(.white))
    }
}

func initials(_ name: String) -> String {
    let parts = name.split(separator: " ").prefix(2)
    return parts.compactMap { $0.first.map(String.init) }.joined().uppercased()
}

struct QBadge: View {
    let label: String
    let icon: String
    let color: Color

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 10, weight: .bold))
            Text(label).font(.system(size: 12, weight: .semibold))
        }
        .foregroundStyle(color)
        .padding(.horizontal, 10).padding(.vertical, 5)
        .background(color.opacity(0.15), in: Capsule())
    }
}

extension Charge {
    var badge: QBadge {
        switch chargeStatus {
        case "paid": QBadge(label: "Pagato", icon: "checkmark", color: .qAccentText)
        case "partial": QBadge(label: "Parziale", icon: "circle.lefthalf.filled", color: .qAmber)
        case "overdue": QBadge(label: "In ritardo", icon: "exclamationmark", color: .qRed)
        case "credit": QBadge(label: "Credito", icon: "plus", color: .qPurple)
        default: QBadge(label: "Da pagare", icon: "clock", color: .qAmber)
        }
    }
}

struct QProgressBar: View {
    let value: Double

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.qTextPrimary.opacity(0.1))
                Capsule().fill(Color.qAccent).frame(width: geo.size.width * min(1, max(0, value)))
            }
        }
        .frame(height: 6)
    }
}

struct QSectionLabel: View {
    let title: String
    var trailing: String?

    var body: some View {
        HStack {
            Text(title.uppercased())
                .font(.system(size: 11, weight: .semibold)).tracking(0.6)
                .foregroundStyle(Color.qTextSecondary)
            Spacer()
            if let trailing { Text(trailing).font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.qTextSecondary) }
        }
    }
}

struct QPageHeader<Trailing: View>: View {
    let title: String
    var subtitle: String?
    @ViewBuilder var trailing: () -> Trailing

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 34, weight: .bold)).foregroundStyle(Color.qTextPrimary)
                if let subtitle { Text(subtitle).font(.system(size: 14)).foregroundStyle(Color.qTextSecondary) }
            }
            Spacer()
            trailing()
        }
    }
}

extension QPageHeader where Trailing == EmptyView {
    init(title: String, subtitle: String? = nil) { self.init(title: title, subtitle: subtitle) { EmptyView() } }
}

/// Lista dentro una sola card, righe separate da hairline (come Membri nel mockup).
struct QList<Content: View>: View {
    @ViewBuilder var content: () -> Content
    var body: some View {
        VStack(spacing: 0) { content() }
            .padding(.horizontal, 20).padding(.vertical, 6)
            .qCard()
    }
}

struct QRow<Leading: View, Trailing: View>: View {
    var title: String
    var subtitle: String?
    var showsChevron = false
    @ViewBuilder var leading: () -> Leading
    @ViewBuilder var trailing: () -> Trailing

    var body: some View {
        HStack(spacing: 14) {
            leading()
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 15, weight: .semibold)).foregroundStyle(Color.qTextPrimary)
                if let subtitle { Text(subtitle).font(.system(size: 13)).foregroundStyle(Color.qTextSecondary) }
            }
            Spacer(minLength: 8)
            trailing()
            if showsChevron {
                Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.qTextTertiary)
            }
        }
        .padding(.vertical, 12)
        .contentShape(Rectangle())
    }
}

struct QDivider: View {
    var body: some View { Rectangle().fill(Color.qSeparator).frame(height: 1) }
}

struct QErrorBanner: View {
    let message: String
    var body: some View {
        Text(message).font(.system(size: 13)).foregroundStyle(Color.qRed)
            .padding(12).frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.qRed.opacity(0.12), in: RoundedRectangle(cornerRadius: QRadius.input, style: .continuous))
    }
}

struct QEmptyState: View {
    let icon: String
    let title: String
    var message: String?
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 28)).foregroundStyle(Color.qTextTertiary)
            Text(title).font(.system(size: 15, weight: .semibold))
            if let message { Text(message).font(.system(size: 13)).foregroundStyle(Color.qTextSecondary).multilineTextAlignment(.center) }
        }
        .frame(maxWidth: .infinity).padding(32)
    }
}
