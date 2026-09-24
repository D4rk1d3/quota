import SwiftUI

struct ActivityView: View {
    let model: AppModel

    private var groups: [(title: String, items: [ActivityItem])] {
        let cal = Calendar.current
        let byDay = Dictionary(grouping: model.activity) { cal.startOfDay(for: $0.createdAt) }
        return byDay.keys.sorted(by: >).map { day in
            let title: String
            if cal.isDateInToday(day) { title = "Oggi" }
            else if cal.isDateInYesterday(day) { title = "Ieri" }
            else { title = day.formatted(.dateTime.day().month(.wide).year().locale(Locale(identifier: "it_IT"))) }
            return (title, byDay[day] ?? [])
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                QPageHeader(title: "Attività")
                if model.activity.isEmpty && !model.loading {
                    QEmptyState(icon: "clock", title: "Nessuna attività ancora",
                                message: "Pagamenti, storni e nuovi cicli compariranno qui.").qCard()
                }
                ForEach(groups, id: \.title) { group in
                    QSectionLabel(title: group.title)
                    QList {
                        ForEach(Array(group.items.enumerated()), id: \.element.id) { index, item in
                            if index > 0 { QDivider() }
                            QRow(title: item.title, subtitle: subtitle(item)) {
                                Image(systemName: item.icon).font(.system(size: 16))
                                    .foregroundStyle(item.eventType == "payment_reversed" ? Color.qRed : Color.qAccentText)
                                    .frame(width: 36, height: 36)
                                    .background(Color.qTextPrimary.opacity(0.06), in: Circle())
                            } trailing: {
                                Text(item.createdAt.formatted(.dateTime.hour().minute()))
                                    .font(.system(size: 12)).foregroundStyle(Color.qTextTertiary)
                            }
                        }
                    }
                }
            }
            .padding(28)
        }
        .refreshable { await model.refresh() }
    }

    private func subtitle(_ item: ActivityItem) -> String? {
        var parts: [String] = []
        if let amount = item.amount { parts.append(formatMoney(amount)) }
        if let reason = item.reason { parts.append(reason) }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }
}
