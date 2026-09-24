import SwiftUI
import AppKit

struct SubscriptionDetailView: View {
    let subscription: Subscription
    let onChange: () -> Void

    @State private var detail = SubscriptionDetail()
    @State private var errorMessage: String?
    @State private var newMemberName = ""
    @State private var payingCharge: Charge?
    @State private var reversingPayment: Payment?

    private var memberNames: [UUID: String] {
        Dictionary(uniqueKeysWithValues: detail.members.map { ($0.id, $0.name) })
    }

    var body: some View {
        List {
            Section("Membri") {
                ForEach(detail.members) { member in
                    HStack {
                        Text(member.name)
                        if member.status != "active" {
                            Text(member.status == "paused" ? "In pausa" : "Rimosso")
                                .font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Menu {
                            if member.status == "active" {
                                Button("Metti in pausa") { setStatus(member, "paused") }
                            } else {
                                Button("Riattiva") { setStatus(member, "active") }
                            }
                            Button("Rimuovi", role: .destructive) { setStatus(member, "removed") }
                        } label: { Image(systemName: "ellipsis.circle") }
                        .menuStyle(.borderlessButton).fixedSize()
                    }
                }
                HStack {
                    TextField("Aggiungi membro", text: $newMemberName).onSubmit(addMember)
                    Button("Aggiungi", action: addMember)
                        .disabled(newMemberName.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }

            if detail.cycles.isEmpty {
                Section("Cicli") {
                    Text("Nessun ciclo di fatturazione ancora.").foregroundStyle(.secondary)
                    Button("Genera il primo ciclo") { run { try await QuotaService.shared.generateCycle(
                        subscriptionId: subscription.id, periodStart: subscription.startDate) } }
                        .disabled(detail.members.isEmpty)
                }
            }

            ForEach(detail.cycles) { cycle in
                Section {
                    ForEach(detail.charges.filter { $0.billingCycleId == cycle.id }) { charge in
                        chargeRow(charge)
                    }
                } header: {
                    HStack {
                        Text("\(formatIsoDate(cycle.periodStart)) — \(formatIsoDate(cycle.periodEnd))")
                        Spacer()
                        Text("\(formatMoney(cycle.collectedTotal, currency: cycle.currency)) / \(formatMoney(cycle.expectedTotal, currency: cycle.currency))")
                    }
                }
            }

            if let errorMessage { Text(errorMessage).foregroundStyle(.red) }
        }
        .navigationTitle(subscription.name)
        .task { await reload() }
        .sheet(item: $payingCharge) { charge in
            RecordPaymentSheet(memberName: memberNames[charge.memberId] ?? "Membro", charge: charge) {
                await reload(); onChange()
            }
        }
        .sheet(item: $reversingPayment) { payment in
            ReversePaymentSheet(payment: payment) { await reload(); onChange() }
        }
    }

    @ViewBuilder
    private func chargeRow(_ charge: Charge) -> some View {
        let name = memberNames[charge.memberId] ?? "Membro"
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(name)
                Text(charge.statusLabel).font(.caption).foregroundStyle(.secondary)
                Spacer()
                Text(formatMoney(charge.expectedAmount, currency: charge.currency)).foregroundStyle(.secondary)
                if !charge.isSettled {
                    Button("Promemoria") { sendReminder(charge, name: name) }
                    Button("Registra") { payingCharge = charge }
                }
            }
            ForEach(detail.payments.filter { $0.chargeId == charge.id }) { payment in
                HStack(spacing: 8) {
                    Text("\(formatMoney(payment.amount, currency: payment.currency)) · \(formatIsoDate(String(payment.paidAt.prefix(10))))"
                         + (payment.paymentMethods.map { " · \($0.label)" } ?? ""))
                        .strikethrough(payment.status == "reversed")
                    if payment.status == "active" {
                        Button("Storna") { reversingPayment = payment }.buttonStyle(.link)
                    } else {
                        Text("stornato")
                    }
                }
                .font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    private func reload() async {
        do {
            detail = try await QuotaService.shared.detail(subscriptionId: subscription.id)
            errorMessage = nil
        } catch {
            errorMessage = "Errore nel caricamento."
        }
    }

    private func run(_ work: @escaping () async throws -> Void) {
        Task {
            do { try await work(); await reload(); onChange() }
            catch { errorMessage = error.localizedDescription }
        }
    }

    private func addMember() {
        let name = newMemberName.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return }
        newMemberName = ""
        run { try await QuotaService.shared.addMember(subscriptionId: subscription.id, name: name) }
    }

    private func setStatus(_ member: Member, _ status: String) {
        run { try await QuotaService.shared.setMemberStatus(member.id, status: status) }
    }

    private func sendReminder(_ charge: Charge, name: String) {
        let message = "Ciao \(name), ti ricordo \(formatMoney(charge.remainingAmount, currency: charge.currency)) per \(subscription.name) (scadenza \(formatIsoDate(charge.dueDate)))."
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(message, forType: .string)
        errorMessage = nil
        run { try await QuotaService.shared.recordReminder(memberId: charge.memberId, chargeId: charge.id, message: message) }
    }
}
