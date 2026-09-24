import SwiftUI

struct CalendarView: View {
    let model: AppModel
    @State private var month = Calendar.current.date(from: Calendar.current.dateComponents([.year, .month], from: Date()))!

    private var cal: Calendar { var c = Calendar(identifier: .gregorian); c.firstWeekday = 2; return c }
    private var renewalsByDay: [String: [Renewal]] { Dictionary(grouping: model.renewals, by: { String($0.renewalDate.prefix(10)) }) }

    private var days: [Date?] {
        let range = cal.range(of: .day, in: .month, for: month)!
        let firstWeekday = (cal.component(.weekday, from: month) + 5) % 7
        return Array(repeating: nil, count: firstWeekday) + range.map { cal.date(byAdding: .day, value: $0 - 1, to: month) }
    }

    private var monthRenewals: [Renewal] {
        model.renewals.filter { r in
            guard let d = Iso.date(r.renewalDate) else { return false }
            return cal.isDate(d, equalTo: month, toGranularity: .month)
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                QPageHeader(title: "Calendario") {
                    HStack(spacing: 8) {
                        Button { shift(-1) } label: { Image(systemName: "chevron.left") }.buttonStyle(.qSecondary)
                        Text(month.formatted(.dateTime.month(.wide).year().locale(Locale(identifier: "it_IT"))).capitalized)
                            .font(.system(size: 15, weight: .semibold)).frame(minWidth: 130)
                        Button { shift(1) } label: { Image(systemName: "chevron.right") }.buttonStyle(.qSecondary)
                    }
                }

                VStack(spacing: 10) {
                    HStack {
                        ForEach(["L", "M", "M", "G", "V", "S", "D"], id: \.self) { d in
                            Text(d).font(.system(size: 11, weight: .semibold)).foregroundStyle(Color.qTextTertiary).frame(maxWidth: .infinity)
                        }
                    }
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: 7), spacing: 6) {
                        ForEach(Array(days.enumerated()), id: \.offset) { _, day in
                            if let day { dayCell(day) } else { Color.clear.frame(height: 48) }
                        }
                    }
                }
                .padding(22).qCard()

                QSectionLabel(title: "Rinnovi del mese", trailing: "\(monthRenewals.count)")
                if monthRenewals.isEmpty {
                    QEmptyState(icon: "calendar", title: "Nessun rinnovo questo mese").qCard()
                } else {
                    QList {
                        ForEach(Array(monthRenewals.enumerated()), id: \.element.id) { index, r in
                            if index > 0 { QDivider() }
                            QRow(title: r.subscriptions?.name ?? "Abbonamento", subtitle: formatIsoDate(r.renewalDate)) {
                                Circle().fill(Color.qAccent).frame(width: 10, height: 10).padding(13)
                            } trailing: {
                                Text(Iso.relative(r.renewalDate)).font(.system(size: 12)).foregroundStyle(Color.qTextSecondary)
                            }
                        }
                    }
                }
            }
            .padding(28)
        }
    }

    private func dayCell(_ day: Date) -> some View {
        let iso = Iso.string(day)
        let has = renewalsByDay[iso] != nil
        let isToday = iso == Iso.today
        return VStack(spacing: 4) {
            Text("\(cal.component(.day, from: day))")
                .font(.system(size: 14, weight: isToday ? .bold : .medium))
                .foregroundStyle(isToday ? Color.white : Color.qTextPrimary)
                .frame(width: 28, height: 28)
                .background(isToday ? Color.qAccent : .clear, in: Circle())
            Circle().fill(has ? Color.qAccent : .clear).frame(width: 5, height: 5)
        }
        .frame(maxWidth: .infinity, minHeight: 48)
    }

    private func shift(_ delta: Int) {
        month = cal.date(byAdding: .month, value: delta, to: month) ?? month
    }
}
