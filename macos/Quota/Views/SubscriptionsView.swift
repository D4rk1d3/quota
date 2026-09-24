import SwiftUI

struct SubscriptionsView: View {
    let model: AppModel
    @Binding var path: [Subscription]
    @State private var showingAdd = false

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    QPageHeader(title: "Abbonamenti") {
                        Button { showingAdd = true } label: {
                            Image(systemName: "plus").font(.system(size: 16, weight: .semibold)).foregroundStyle(.white)
                                .frame(width: 44, height: 44).background(Color.qAccent, in: Circle())
                        }
                        .buttonStyle(.plain).help("Nuovo abbonamento")
                    }
                    if model.subscriptions.isEmpty && !model.loading {
                        QEmptyState(icon: "rectangle.stack.badge.plus", title: "Nessun abbonamento ancora",
                                    message: "Aggiungi il primo abbonamento condiviso (Netflix, Spotify, palestra…).").qCard()
                    } else {
                        QList {
                            ForEach(Array(model.subscriptions.enumerated()), id: \.element.id) { index, sub in
                                if index > 0 { QDivider() }
                                NavigationLink(value: sub) {
                                    QRow(title: sub.name,
                                         subtitle: "\(formatMoney(sub.currentPrice, currency: sub.currency)) · rinnovo \(formatIsoShort(sub.nextRenewalDate))",
                                         showsChevron: true) {
                                        QAvatar(name: sub.name)
                                    } trailing: {
                                        if sub.status != "active" {
                                            QBadge(label: sub.status == "paused" ? "In pausa" : "Chiuso", icon: "pause", color: .qTextSecondary)
                                        }
                                    }
                                }.buttonStyle(.plain)
                            }
                        }
                    }
                }
                .padding(28)
            }
            .navigationDestination(for: Subscription.self) { sub in
                SubscriptionDetailView(model: model, subscription: sub)
            }
            .toolbar(removing: .title)
        }
        .sheet(isPresented: $showingAdd) {
            AddSubscriptionSheet { await model.refresh() }
        }
    }
}

struct SubscriptionDetailView: View {
    let model: AppModel
    let subscription: Subscription

    @State private var detail = SubscriptionDetail()
    @State private var errorMessage: String?
    @State private var newMemberName = ""
    @State private var payingCharge: Charge?
    @State private var reversingPayment: Payment?

    private var memberNames: [UUID: String] {
        Dictionary(uniqueKeysWithValues: detail.members.map { ($0.id, $0.name) })
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                QPageHeader(title: subscription.name,
                            subtitle: "\(formatMoney(subscription.currentPrice, currency: subscription.currency)) · rinnovo \(formatIsoDate(subscription.nextRenewalDate))")
                if let errorMessage { QErrorBanner(message: errorMessage) }

                QSectionLabel(title: "Membri", trailing: "\(detail.members.count)")
                QList {
                    ForEach(Array(detail.members.enumerated()), id: \.element.id) { index, member in
                        if index > 0 { QDivider() }
                        QRow(title: member.name, subtitle: member.status == "active" ? nil : (member.status == "paused" ? "In pausa" : "Rimosso")) {
                            QAvatar(name: member.name)
                        } trailing: {
                            Menu {
                                if member.status == "active" {
                                    Button("Metti in pausa") { setStatus(member, "paused") }
                                } else {
                                    Button("Riattiva") { setStatus(member, "active") }
                                }
                                Button("Rimuovi", role: .destructive) { setStatus(member, "removed") }
                            } label: {
                                Image(systemName: "ellipsis").foregroundStyle(Color.qTextSecondary)
                            }
                            .menuStyle(.borderlessButton).menuIndicator(.hidden).fixedSize()
                        }
                    }
                    if !detail.members.isEmpty { QDivider() }
                    HStack(spacing: 10) {
                        TextField("Aggiungi membro", text: $newMemberName)
                            .textFieldStyle(.plain).font(.system(size: 14)).onSubmit(addMember)
                        Button("Aggiungi", action: addMember).buttonStyle(.qSecondary)
                            .disabled(newMemberName.trimmingCharacters(in: .whitespaces).isEmpty)
                    }.padding(.vertical, 12)
                }

                if detail.cycles.isEmpty {
                    QEmptyState(icon: "calendar.badge.plus", title: "Nessun ciclo di fatturazione",
                                message: "Genera il primo ciclo per iniziare a registrare i pagamenti.").qCard()
                    Button("Genera il primo ciclo") {
                        run { try await QuotaService.shared.generateCycle(subscriptionId: subscription.id, periodStart: subscription.startDate) }
                    }
                    .buttonStyle(.qPrimary).disabled(detail.members.isEmpty)
                }

                ForEach(detail.cycles) { cycle in cycleCard(cycle) }
            }
            .padding(28)
        }
        .task { await reload() }
        .sheet(item: $payingCharge) { charge in
            RecordPaymentSheet(memberName: memberNames[charge.memberId] ?? "Membro", charge: charge) {
                await reload(); await model.refresh()
            }
        }
        .sheet(item: $reversingPayment) { payment in
            ReversePaymentSheet(payment: payment) { await reload(); await model.refresh() }
        }
    }

    private func cycleCard(_ cycle: BillingCycle) -> some View {
        let charges = detail.charges.filter { $0.billingCycleId == cycle.id }
        let progress = cycle.expectedTotal > 0 ? cycle.collectedTotal / cycle.expectedTotal : 0
        return VStack(alignment: .leading, spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(formatIsoShort(cycle.periodStart)) — \(formatIsoShort(cycle.periodEnd))")
                        .font(.system(size: 16, weight: .semibold))
                    Text(cycleStatus(cycle.status)).font(.system(size: 13)).foregroundStyle(Color.qTextSecondary)
                }
                Spacer()
                Text("\(formatMoney(cycle.collectedTotal, currency: cycle.currency)) / \(formatMoney(cycle.expectedTotal, currency: cycle.currency))")
                    .font(.system(size: 14, weight: .semibold)).monospacedDigit()
            }
            QProgressBar(value: progress).padding(.top, 12)
            ForEach(charges) { charge in
                QDivider().padding(.top, 8)
                chargeRow(charge)
            }
        }
        .padding(22).qCard()
    }

    private func chargeRow(_ charge: Charge) -> some View {
        let name = memberNames[charge.memberId] ?? "Membro"
        return VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 12) {
                QAvatar(name: name, size: 36)
                VStack(alignment: .leading, spacing: 1) {
                    Text(name).font(.system(size: 14, weight: .semibold))
                    Text(formatMoney(charge.expectedAmount, currency: charge.currency))
                        .font(.system(size: 12)).foregroundStyle(Color.qTextSecondary).monospacedDigit()
                }
                Spacer()
                charge.badge
                if !charge.isSettled {
                    Button("Promemoria") { sendReminder(charge, name: name) }.buttonStyle(.qSecondary)
                    Button("Registra") { payingCharge = charge }.buttonStyle(.qPrimary)
                }
            }
            ForEach(detail.payments.filter { $0.chargeId == charge.id }) { payment in
                HStack(spacing: 8) {
                    Text("\(formatMoney(payment.amount, currency: payment.currency)) · \(formatIsoShort(String(payment.paidAt.prefix(10))))"
                         + (payment.paymentMethods.map { " · \($0.label)" } ?? ""))
                        .strikethrough(payment.status == "reversed")
                    if payment.status == "active" {
                        Button("Storna") { reversingPayment = payment }.buttonStyle(.link)
                    } else {
                        Text("stornato")
                    }
                }
                .font(.system(size: 12)).foregroundStyle(Color.qTextSecondary).padding(.leading, 48)
            }
        }
        .padding(.top, 12)
    }

    private func cycleStatus(_ status: String) -> String {
        switch status {
        case "current": "In corso"
        case "overdue": "In ritardo"
        case "upcoming": "In arrivo"
        default: "Chiuso"
        }
    }

    private func reload() async {
        do {
            detail = try await QuotaService.shared.detail(subscriptionId: subscription.id)
            errorMessage = nil
        } catch { errorMessage = "Errore nel caricamento." }
    }

    private func run(_ work: @escaping () async throws -> Void) {
        Task {
            do { try await work(); await reload(); await model.refresh() }
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
        run { try await QuotaService.shared.recordReminder(memberId: charge.memberId, chargeId: charge.id, message: message) }
    }
}
