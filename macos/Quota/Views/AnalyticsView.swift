import SwiftUI
import Charts

struct AnalyticsView: View {
    let model: AppModel
    @State private var stats: [MonthStat] = []
    @State private var loaded = false
    @State private var errorMessage: String?

    struct MonthStat: Identifiable {
        let month: Date
        let expected: Double
        let collected: Double
        var id: Date { month }
    }

    private var totalExpected: Double { stats.reduce(0) { $0 + $1.expected } }
    private var totalCollected: Double { stats.reduce(0) { $0 + $1.collected } }
    private var rate: Double { totalExpected > 0 ? totalCollected / totalExpected : 0 }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                QPageHeader(title: "Analisi", subtitle: "Ultimi 6 mesi")
                if let errorMessage { QErrorBanner(message: errorMessage) }

                HStack(spacing: 16) {
                    metric("Tasso di incasso", "\(Int((rate * 100).rounded()))%", rate >= 0.9 ? .qAccentText : .qAmber)
                    metric("Incassato", formatMoney(totalCollected), .qTextPrimary)
                    metric("Da incassare", formatMoney(max(0, totalExpected - totalCollected)), totalExpected - totalCollected > 0.005 ? .qAmber : .qTextPrimary)
                }

                VStack(alignment: .leading, spacing: 14) {
                    QSectionLabel(title: "Atteso e incassato per mese")
                    if totalExpected == 0 && loaded {
                        QEmptyState(icon: "chart.bar", title: "Ancora nessun dato",
                                    message: "I grafici compaiono quando ci sono cicli di fatturazione.")
                    } else {
                        Chart {
                            ForEach(stats) { s in
                                BarMark(x: .value("Mese", s.month, unit: .month), y: .value("Importo", s.expected))
                                    .foregroundStyle(Color.qTextPrimary.opacity(0.14)).position(by: .value("Tipo", "Atteso"))
                                BarMark(x: .value("Mese", s.month, unit: .month), y: .value("Importo", s.collected))
                                    .foregroundStyle(Color.qAccent).position(by: .value("Tipo", "Incassato"))
                            }
                        }
                        .chartXAxis { AxisMarks(values: .stride(by: .month)) { _ in
                            AxisValueLabel(format: .dateTime.month(.abbreviated).locale(Locale(identifier: "it_IT")))
                        } }
                        .chartYAxis { AxisMarks { _ in AxisGridLine().foregroundStyle(Color.qSeparator); AxisValueLabel() } }
                        .frame(height: 260)
                        HStack(spacing: 16) {
                            legend(Color.qTextPrimary.opacity(0.14), "Atteso")
                            legend(.qAccent, "Incassato")
                        }
                    }
                }
                .padding(22).qCard()
            }
            .padding(28)
        }
        .task { await load() }
    }

    private func metric(_ label: String, _ value: String, _ tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased()).font(.system(size: 11, weight: .semibold)).tracking(0.6).foregroundStyle(Color.qTextSecondary)
            Text(value).font(.system(size: 26, weight: .bold)).monospacedDigit().foregroundStyle(tint)
        }
        .frame(maxWidth: .infinity, alignment: .leading).padding(20).qCard()
    }

    private func legend(_ color: Color, _ text: String) -> some View {
        HStack(spacing: 6) {
            RoundedRectangle(cornerRadius: 3).fill(color).frame(width: 10, height: 10)
            Text(text).font(.system(size: 12)).foregroundStyle(Color.qTextSecondary)
        }
    }

    private func load() async {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Europe/Rome") ?? .current
        let thisMonth = cal.date(from: cal.dateComponents([.year, .month], from: Date()))!
        let start = cal.date(byAdding: .month, value: -5, to: thisMonth)!
        do {
            let rows = try await QuotaService.shared.cycleStats(since: Iso.string(start))
            let grouped = Dictionary(grouping: rows.filter { $0.currency == "EUR" }) { row -> Date in
                let d = Iso.date(row.periodStart) ?? start
                return cal.date(from: cal.dateComponents([.year, .month], from: d))!
            }
            stats = (0..<6).compactMap { i in
                guard let m = cal.date(byAdding: .month, value: i, to: start) else { return nil }
                let items = grouped[m] ?? []
                return MonthStat(month: m, expected: items.reduce(0) { $0 + $1.expectedTotal }, collected: items.reduce(0) { $0 + $1.collectedTotal })
            }
            errorMessage = nil
        } catch { errorMessage = "Impossibile caricare le statistiche." }
        loaded = true
    }
}
