import SwiftUI

struct DashboardView: View {
    @Environment(AuthStore.self) private var auth
    let userId: UUID

    @State private var summary = DashboardSummary.empty
    @State private var subscriptions: [Subscription] = []
    @State private var entitlement = Entitlement.free
    @State private var loading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack(spacing: 24) {
                        metric("Incassato", formatMoney(summary.totalCollected),
                               "su \(formatMoney(summary.totalExpected)) attesi")
                        metric("Da recuperare", formatMoney(summary.totalOutstanding),
                               "\(summary.overdueCount) in ritardo")
                        metric("Pagamenti", String(summary.paymentsCount),
                               summary.nextRenewalDate.map { "Prossimo rinnovo: \(formatIsoDate($0))" } ?? "Nessun rinnovo")
                    }
                    .padding(.vertical, 4)
                }

                Section("Abbonamenti") {
                    if subscriptions.isEmpty && !loading {
                        Text("Nessun abbonamento ancora.").foregroundStyle(.secondary)
                    }
                    ForEach(subscriptions) { sub in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(sub.name).font(.headline)
                                Text("Rinnovo \(formatIsoDate(sub.nextRenewalDate))")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text(formatMoney(sub.currentPrice, currency: sub.currency))
                        }
                    }
                }

                if let errorMessage {
                    Text(errorMessage).foregroundStyle(.red)
                }
            }
            .navigationTitle("Dashboard")
            .toolbar {
                ToolbarItem {
                    Text(entitlement.isPro ? "Pro" : "Gratuito").font(.caption)
                }
                ToolbarItem {
                    Button("Esci") { Task { await auth.signOut() } }
                }
            }
        }
        .task { await load() }
    }

    private func metric(_ label: String, _ value: String, _ hint: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.title2.bold())
            Text(hint).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func load() async {
        loading = true
        do {
            let service = QuotaService.shared
            async let s = service.dashboard()
            async let subs = service.subscriptions()
            async let e = service.entitlement(userId: userId)
            (summary, subscriptions, entitlement) = try await (s, subs, e)
        } catch {
            errorMessage = "Errore nel caricamento: \(error.localizedDescription)"
        }
        loading = false
    }
}
