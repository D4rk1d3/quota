import SwiftUI

struct PayableCharge: Identifiable, Hashable {
    let charge: Charge
    let memberName: String
    var id: UUID { charge.id }
}

struct RecordPaymentSheet: View {
    @Environment(\.dismiss) private var dismiss
    let options: [PayableCharge]
    let methods: [PaymentMethodItem]
    let onDone: () async -> Void

    @State private var selectedId: UUID
    @State private var amount = ""
    @State private var methodId: UUID?
    @State private var date = Date()
    @State private var note = ""
    @State private var busy = false
    @State private var errorMessage: String?

    init(options: [PayableCharge], selected: UUID, methods: [PaymentMethodItem], onDone: @escaping () async -> Void) {
        self.options = options
        self.methods = methods
        self.onDone = onDone
        _selectedId = State(initialValue: selected)
    }

    private var current: PayableCharge? { options.first { $0.id == selectedId } }

    var body: some View {
        QSheet(title: "Registra pagamento") {
            QField(label: "Membro") {
                Picker("", selection: $selectedId) {
                    ForEach(options) { Text($0.memberName).tag($0.id) }
                }.labelsHidden().frame(height: 44)
            }
            QField(label: hint) {
                TextField("0,00", text: $amount)
                    .textFieldStyle(.plain).font(.system(size: 26, weight: .bold)).monospacedDigit()
                    .padding(.horizontal, 16).frame(height: 60)
                    .background(Color.qAccent.opacity(0.10), in: RoundedRectangle(cornerRadius: QRadius.input, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: QRadius.input, style: .continuous).stroke(Color.qAccent.opacity(0.6), lineWidth: 1.5))
            }
            HStack(spacing: 12) {
                QField(label: "Metodo") {
                    Picker("", selection: $methodId) {
                        Text("Non specificato").tag(UUID?.none)
                        ForEach(methods) { Text($0.label).tag(UUID?.some($0.id)) }
                    }.labelsHidden().frame(height: 44)
                }
                QField(label: "Data") { DatePicker("", selection: $date, in: ...Date(), displayedComponents: .date).labelsHidden().frame(height: 44) }
            }
            QField(label: "Nota (facoltativa)") { TextField("Es. bonifico del 17", text: $note).qInput(height: 44) }
            if let errorMessage { QErrorBanner(message: errorMessage) }
            HStack {
                Spacer()
                Button("Annulla") { dismiss() }.buttonStyle(.qSecondary)
                Button(busy ? "Registrazione…" : "Registra", action: save).buttonStyle(.qPrimary)
                    .disabled(busy || parsePrice(amount) == nil)
            }
        }
        .onAppear(perform: syncAmount)
        .onChange(of: selectedId) { _, _ in syncAmount() }
    }

    private var hint: String {
        guard let c = current?.charge else { return "Importo" }
        return "Importo — restano \(formatMoney(c.remainingAmount, currency: c.currency)) su \(formatMoney(c.expectedAmount, currency: c.currency))"
    }

    private func syncAmount() {
        guard let c = current?.charge else { return }
        amount = String(format: "%.2f", c.remainingAmount).replacingOccurrences(of: ".", with: ",")
    }

    private func save() {
        guard let value = parsePrice(amount), let c = current?.charge else { return }
        busy = true
        errorMessage = nil
        Task {
            do {
                try await QuotaService.shared.recordPayment(chargeId: c.id, amount: value, methodId: methodId,
                                                            paidAt: date, note: note.trimmingCharacters(in: .whitespaces))
                await onDone(); dismiss()
            } catch { errorMessage = error.localizedDescription }
            busy = false
        }
    }
}

struct ReversePaymentSheet: View {
    @Environment(\.dismiss) private var dismiss
    let payment: Payment
    let onDone: () async -> Void

    @State private var reason = ""
    @State private var busy = false
    @State private var errorMessage: String?

    var body: some View {
        QSheet(title: "Storna pagamento",
               subtitle: "\(formatMoney(payment.amount, currency: payment.currency)) · \(formatIsoShort(String(payment.paidAt.prefix(10))))") {
            Text("Il pagamento non viene cancellato: resta nello storico come stornato, così la correzione è sempre tracciata.")
                .font(.system(size: 13)).foregroundStyle(Color.qTextSecondary)
            QField(label: "Motivo dello storno") { TextField("Es. importo sbagliato", text: $reason).qInput() }
            if let errorMessage { QErrorBanner(message: errorMessage) }
            HStack {
                Spacer()
                Button("Annulla") { dismiss() }.buttonStyle(.qSecondary)
                Button(busy ? "Storno…" : "Storna pagamento", action: save).buttonStyle(.qDestructive)
                    .disabled(busy || reason.trimmingCharacters(in: .whitespaces).count < 3)
            }
        }
    }

    private func save() {
        busy = true
        Task {
            do {
                try await QuotaService.shared.reversePayment(paymentId: payment.id, reason: reason.trimmingCharacters(in: .whitespaces))
                await onDone(); dismiss()
            } catch { errorMessage = error.localizedDescription }
            busy = false
        }
    }
}

struct EditSubscriptionSheet: View {
    @Environment(\.dismiss) private var dismiss
    let subscription: Subscription
    let onDone: () async -> Void

    @State private var name: String
    @State private var price: String
    @State private var busy = false
    @State private var errorMessage: String?

    init(subscription: Subscription, onDone: @escaping () async -> Void) {
        self.subscription = subscription
        self.onDone = onDone
        _name = State(initialValue: subscription.name)
        _price = State(initialValue: String(format: "%.2f", subscription.currentPrice).replacingOccurrences(of: ".", with: ","))
    }

    var body: some View {
        QSheet(title: "Modifica abbonamento") {
            QField(label: "Nome") { TextField("Nome", text: $name).qInput() }
            QField(label: "Prezzo (€)") { TextField("Prezzo", text: $price).qInput() }
            Text("Il nuovo prezzo vale dai prossimi cicli: quelli già generati non cambiano.")
                .font(.system(size: 12)).foregroundStyle(Color.qTextSecondary)
            if let errorMessage { QErrorBanner(message: errorMessage) }
            HStack {
                Spacer()
                Button("Annulla") { dismiss() }.buttonStyle(.qSecondary)
                Button(busy ? "Salvataggio…" : "Salva", action: save).buttonStyle(.qPrimary)
                    .disabled(busy || name.trimmingCharacters(in: .whitespaces).isEmpty || parsePrice(price) == nil)
            }
        }
    }

    private func save() {
        guard let value = parsePrice(price) else { return }
        busy = true
        Task {
            do {
                try await QuotaService.shared.updateSubscription(id: subscription.id, name: name.trimmingCharacters(in: .whitespaces), price: value)
                await onDone(); dismiss()
            } catch { errorMessage = error.localizedDescription }
            busy = false
        }
    }
}
