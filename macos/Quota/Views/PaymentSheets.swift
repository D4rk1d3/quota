import SwiftUI

struct RecordPaymentSheet: View {
    @Environment(\.dismiss) private var dismiss
    let memberName: String
    let charge: Charge
    let onDone: () async -> Void

    @State private var amount = ""
    @State private var busy = false
    @State private var errorMessage: String?

    var body: some View {
        Form {
            Text("Registra pagamento — \(memberName)").font(.headline)
            TextField("Importo (€)", text: $amount)
            if let errorMessage { Text(errorMessage).foregroundStyle(.red) }
            HStack {
                Spacer()
                Button("Annulla") { dismiss() }
                Button(busy ? "Registrazione…" : "Registra", action: save)
                    .buttonStyle(.borderedProminent).disabled(busy || parsed == nil)
            }
        }
        .padding(24).frame(width: 360)
        .onAppear { amount = String(format: "%.2f", charge.remainingAmount).replacingOccurrences(of: ".", with: ",") }
    }

    private var parsed: Double? {
        guard let v = Double(amount.replacingOccurrences(of: ",", with: ".")), v > 0 else { return nil }
        return v
    }

    private func save() {
        guard let parsed else { return }
        busy = true
        Task {
            do {
                try await QuotaService.shared.recordPayment(chargeId: charge.id, amount: parsed)
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
        Form {
            Text("Storna pagamento — \(formatMoney(payment.amount, currency: payment.currency))").font(.headline)
            TextField("Motivo dello storno", text: $reason)
            if let errorMessage { Text(errorMessage).foregroundStyle(.red) }
            HStack {
                Spacer()
                Button("Annulla") { dismiss() }
                Button(busy ? "Storno…" : "Storna", role: .destructive, action: save)
                    .disabled(busy || reason.trimmingCharacters(in: .whitespaces).count < 3)
            }
        }
        .padding(24).frame(width: 360)
    }

    private func save() {
        busy = true
        Task {
            do {
                try await QuotaService.shared.reversePayment(
                    paymentId: payment.id, reason: reason.trimmingCharacters(in: .whitespaces))
                await onDone(); dismiss()
            } catch { errorMessage = error.localizedDescription }
            busy = false
        }
    }
}
