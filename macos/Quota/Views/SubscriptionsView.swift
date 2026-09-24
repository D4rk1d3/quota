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
    @State var subscription: Subscription

    @State private var detail = SubscriptionDetail()
    @State private var errorMessage: String?
    @State private var newMemberName = ""
    @State private var selectedCycleId: UUID?
    @State private var payingSelection: UUID?
    @State private var reversingPayment: Payment?
    @State private var editing = false

    private var memberNames: [UUID: String] {
        Dictionary(uniqueKeysWithValues: detail.members.map { ($0.id, $0.name) })
    }

    private var orderedCycles: [BillingCycle] { detail.cycles.sorted { $0.periodStart < $1.periodStart } }
    private var selectedCycle: BillingCycle? { orderedCycles.first { $0.id == selectedCycleId } }
    private var cycleCharges: [Charge] {
        guard let id = selectedCycle?.id else { return [] }
        let order = Dictionary(uniqueKeysWithValues: detail.members.enumerated().map { ($1.id, $0) })
        return detail.charges.filter { $0.billingCycleId == id }.sorted { (order[$0.memberId] ?? 0) < (order[$1.memberId] ?? 0) }
    }
    private var payable: [PayableCharge] {
        cycleCharges.filter { !$0.isSettled }.map { PayableCharge(charge: $0, memberName: memberNames[$0.memberId] ?? "Membro") }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                QPageHeader(title: subscription.name,
                            subtitle: "\(formatMoney(subscription.currentPrice, currency: subscription.currency)) · rinnova il \(formatIsoDate(subscription.nextRenewalDate))") {
                    HStack(spacing: 10) {
                        Button { editing = true } label: { Label("Modifica", systemImage: "pencil") }.buttonStyle(.qSecondary)
                        Button { payingSelection = payable.first?.id } label: { Label("Registra pagamento", systemImage: "plus") }
                            .buttonStyle(.qPrimary).disabled(payable.isEmpty)
                    }
                }
                if let errorMessage { QErrorBanner(message: errorMessage) }

                if detail.cycles.isEmpty {
                    QEmptyState(icon: "calendar.badge.plus", title: "Nessun ciclo di fatturazione",
                                message: "Aggiungi i membri, poi genera il primo ciclo per iniziare a registrare i pagamenti.").qCard()
                    Button("Genera il primo ciclo") {
                        run { try await QuotaService.shared.generateCycle(subscriptionId: subscription.id, periodStart: subscription.startDate) }
                    }
                    .buttonStyle(.qPrimary).disabled(detail.members.isEmpty)
                } else {
                    cycleChips
                    if let cycle = selectedCycle { cycleSummary(cycle) }
                    QSectionLabel(title: "Membri — ciclo di \(selectedCycle.map { monthName($0.periodStart) } ?? "")")
                    QList {
                        ForEach(Array(cycleCharges.enumerated()), id: \.element.id) { index, charge in
                            if index > 0 { QDivider() }
                            chargeRow(charge)
                        }
                    }
                }

                QSectionLabel(title: "Gestisci membri", trailing: "\(detail.members.count)")
                QList {
                    ForEach(Array(detail.members.enumerated()), id: \.element.id) { index, member in
                        if index > 0 { QDivider() }
                        QRow(title: member.name, subtitle: member.status == "active" ? nil : (member.status == "paused" ? "In pausa" : "Rimosso")) {
                            QAvatar(name: member.name, size: 40)
                        } trailing: {
                            Menu {
                                if member.status == "active" {
                                    Button("Metti in pausa") { setStatus(member, "paused") }
                                } else {
                                    Button("Riattiva") { setStatus(member, "active") }
                                }
                                Button("Rimuovi", role: .destructive) { setStatus(member, "removed") }
                            } label: { Image(systemName: "ellipsis").foregroundStyle(Color.qTextSecondary) }
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
            }
            .padding(28)
        }
        .task { await reload() }
        .sheet(isPresented: Binding(get: { payingSelection != nil }, set: { if !$0 { payingSelection = nil } })) {
            if let selected = payingSelection {
                RecordPaymentSheet(options: payable, selected: selected, methods: model.paymentMethods) {
                    await reload(); await model.refresh()
                }
            }
        }
        .sheet(item: $reversingPayment) { payment in
            ReversePaymentSheet(payment: payment) { await reload(); await model.refresh() }
        }
        .sheet(isPresented: $editing) {
            EditSubscriptionSheet(subscription: subscription) {
                await model.refresh()
                if let updated = model.subscriptions.first(where: { $0.id == subscription.id }) { subscription = updated }
                await reload()
            }
        }
    }

    private var cycleChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(orderedCycles) { cycle in
                    let selected = cycle.id == selectedCycleId
                    Button { selectedCycleId = cycle.id } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(monthName(cycle.periodStart) + (cycle.status == "current" ? " · attuale" : ""))
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(selected ? Color.qAccentText : Color.qTextSecondary)
                            cycleBadge(cycle)
                        }
                        .padding(.horizontal, 16).padding(.vertical, 10)
                        .background(selected ? Color.qAccent.opacity(0.10) : Color.qSurface,
                                    in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(selected ? Color.qAccent.opacity(0.6) : Color.clear, lineWidth: 1))
                    }.buttonStyle(.plain)
                }
            }
        }
    }

    @ViewBuilder
    private func cycleBadge(_ cycle: BillingCycle) -> some View {
        switch cycle.status {
        case "closed": QBadge(label: "Pagato", icon: "checkmark", color: .qAccentText)
        case "overdue": QBadge(label: "In ritardo", icon: "exclamationmark", color: .qRed)
        case "current": QBadge(label: "In scadenza", icon: "clock", color: .qAmber)
        default: Text("In arrivo").font(.system(size: 11, weight: .medium)).foregroundStyle(Color.qTextTertiary)
        }
    }

    private func cycleSummary(_ cycle: BillingCycle) -> some View {
        let remaining = max(0, cycle.expectedTotal - cycle.collectedTotal)
        let progress = cycle.expectedTotal > 0 ? cycle.collectedTotal / cycle.expectedTotal : 0
        return HStack(alignment: .top, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text("CICLO DI \(monthName(cycle.periodStart).uppercased())").font(.system(size: 11, weight: .semibold)).tracking(0.6)
                    .foregroundStyle(Color.qTextSecondary)
                QProgressBar(value: progress)
                Text("\(formatMoney(cycle.collectedTotal, currency: cycle.currency)) raccolti su \(formatMoney(cycle.expectedTotal, currency: cycle.currency))")
                    .font(.system(size: 13)).foregroundStyle(Color.qTextSecondary).monospacedDigit()
            }
            .frame(maxWidth: .infinity, alignment: .leading).padding(20).qCard()
            VStack(alignment: .leading, spacing: 4) {
                Text("RIMANE DA INCASSARE").font(.system(size: 11, weight: .semibold)).tracking(0.6).foregroundStyle(Color.qTextSecondary)
                Text(formatMoney(remaining, currency: cycle.currency)).font(.system(size: 26, weight: .bold)).monospacedDigit()
                    .foregroundStyle(remaining > 0.005 ? Color.qAmber : Color.qAccentText)
            }
            .frame(maxWidth: .infinity, alignment: .leading).padding(20).qCard()
        }
    }

    private func chargeRow(_ charge: Charge) -> some View {
        let name = memberNames[charge.memberId] ?? "Membro"
        let payments = detail.payments.filter { $0.chargeId == charge.id }
        return VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 14) {
                QAvatar(name: name)
                VStack(alignment: .leading, spacing: 2) {
                    Text(name).font(.system(size: 15, weight: .semibold))
                    Text(charge.chargeStatus == "partial"
                         ? "\(formatMoney(charge.expectedAmount - charge.remainingAmount, currency: charge.currency)) / \(formatMoney(charge.expectedAmount, currency: charge.currency))"
                         : formatMoney(charge.expectedAmount, currency: charge.currency))
                        .font(.system(size: 13)).foregroundStyle(Color.qTextSecondary).monospacedDigit()
                }
                Spacer()
                ShareLink(item: statusText(charge, name: name)) { Image(systemName: "square.and.arrow.up") }
                    .buttonStyle(.qSecondary).help("Condividi lo stato con \(name)")
                if !charge.isSettled {
                    Button { sendReminder(charge, name: name) } label: { Image(systemName: "bell") }
                        .buttonStyle(.qSecondary).help("Copia il promemoria negli appunti")
                    Button("Registra") { payingSelection = charge.id }.buttonStyle(.qSecondary)
                }
                charge.badge
            }
            ForEach(payments) { payment in
                HStack(spacing: 8) {
                    Text("\(formatMoney(payment.amount, currency: payment.currency)) · \(formatIsoShort(String(payment.paidAt.prefix(10))))"
                         + (payment.paymentMethods.map { " · \($0.label)" } ?? ""))
                        .strikethrough(payment.status == "reversed")
                    if payment.status == "active" {
                        Button("Storna") { reversingPayment = payment }.buttonStyle(.link)
                    } else { Text("stornato") }
                }
                .font(.system(size: 12)).foregroundStyle(Color.qTextSecondary).padding(.leading, 58)
            }
        }
        .padding(.vertical, 12)
    }

    private func statusText(_ charge: Charge, name: String) -> String {
        let paid = max(0, charge.expectedAmount - charge.remainingAmount)
        var text = "Quota — \(subscription.name)\nCiao \(name), ecco il tuo stato.\n"
        text += "Dovuto: \(formatMoney(charge.expectedAmount, currency: charge.currency))\n"
        text += "Pagato: \(formatMoney(paid, currency: charge.currency))\n"
        if charge.remainingAmount > 0.005 {
            text += "Resta da pagare: \(formatMoney(charge.remainingAmount, currency: charge.currency)) entro il \(formatIsoDate(charge.dueDate))."
        } else {
            text += "Tutto in regola, grazie!"
        }
        return text
    }

    private func monthName(_ iso: String) -> String {
        guard let d = Iso.date(iso) else { return iso }
        return d.formatted(.dateTime.month(.wide).locale(Locale(identifier: "it_IT"))).capitalized
    }

    private func reload() async {
        do {
            detail = try await QuotaService.shared.detail(subscriptionId: subscription.id)
            if selectedCycle == nil {
                selectedCycleId = (orderedCycles.first { $0.status == "overdue" } ?? orderedCycles.first { $0.status == "current" }
                                   ?? orderedCycles.first { $0.status == "upcoming" } ?? orderedCycles.last)?.id
            }
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
