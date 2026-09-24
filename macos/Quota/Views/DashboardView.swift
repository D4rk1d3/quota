import SwiftUI
import AppKit

struct DashboardView: View {
    @Environment(AuthStore.self) private var auth
    let userId: UUID

    @State private var summary = DashboardSummary.empty
    @State private var subscriptions: [Subscription] = []
    @State private var entitlement = Entitlement.free
    @State private var loading = true
    @State private var errorMessage: String?
    @State private var showingAdd = false

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
                        Text("Nessun abbonamento ancora. Aggiungi il primo.").foregroundStyle(.secondary)
                    }
                    ForEach(subscriptions) { sub in
                        NavigationLink(value: sub) {
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
                }

                if !entitlement.isPro {
                    Section("Piano") {
                        UpgradeRow()
                    }
                }

                if let errorMessage {
                    Text(errorMessage).foregroundStyle(.red)
                }
            }
            .navigationTitle("Quota")
            .navigationDestination(for: Subscription.self) { sub in
                SubscriptionDetailView(subscription: sub, onChange: { Task { await load() } })
            }
            .toolbar {
                ToolbarItem {
                    Button("Nuovo abbonamento", systemImage: "plus") { showingAdd = true }
                }
                ToolbarItem {
                    Text(entitlement.isPro ? "Pro" : "Gratuito").font(.caption).foregroundStyle(.secondary)
                }
                ToolbarItem {
                    Button("Esci") { Task { await auth.signOut() } }
                }
            }
            .sheet(isPresented: $showingAdd) {
                AddSubscriptionSheet { await load() }
            }
        }
        .task { await load() }
        .onReceive(NotificationCenter.default.publisher(for: NSApplication.didBecomeActiveNotification)) { _ in
            Task { await load() }
        }
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
        do {
            let service = QuotaService.shared
            async let s = service.dashboard()
            async let subs = service.subscriptions()
            async let e = service.entitlement(userId: userId)
            (summary, subscriptions, entitlement) = try await (s, subs, e)
            errorMessage = nil
        } catch {
            errorMessage = "Errore nel caricamento: \(error.localizedDescription)"
        }
        loading = false
    }
}

struct UpgradeRow: View {
    @State private var busy = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Il piano gratuito include 1 abbonamento con fino a 6 membri. Passa a Pro per averne senza limiti.")
                .font(.callout)
            Button(busy ? "Un attimo…" : "Passa a Pro") {
                busy = true
                Task {
                    do {
                        NSWorkspace.shared.open(try await QuotaService.shared.checkoutURL())
                    } catch {
                        errorMessage = error.localizedDescription
                    }
                    busy = false
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(busy)
            if let errorMessage { Text(errorMessage).foregroundStyle(.red).font(.caption) }
        }
    }
}
