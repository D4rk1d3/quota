import SwiftUI

struct AddSubscriptionSheet: View {
    @Environment(\.dismiss) private var dismiss
    let onDone: () async -> Void

    @State private var name = ""
    @State private var price = ""
    @State private var frequency = "monthly"
    @State private var shareType = "equal"
    @State private var startDate = Date()
    @State private var busy = false
    @State private var errorMessage: String?

    var body: some View {
        QSheet(title: "Nuovo abbonamento") {
            SubscriptionFields(name: $name, price: $price, frequency: $frequency, shareType: $shareType, startDate: $startDate)
            if let errorMessage { QErrorBanner(message: errorMessage) }
            HStack {
                Spacer()
                Button("Annulla") { dismiss() }.buttonStyle(.qSecondary)
                Button(busy ? "Salvataggio…" : "Crea", action: save).buttonStyle(.qPrimary)
                    .disabled(busy || name.trimmingCharacters(in: .whitespaces).isEmpty || parsePrice(price) == nil)
            }
        }
    }

    private func save() {
        guard let value = parsePrice(price) else { return }
        busy = true
        errorMessage = nil
        Task {
            do {
                try await QuotaService.shared.createSubscription(
                    name: name.trimmingCharacters(in: .whitespaces), price: value,
                    frequency: frequency, shareType: shareType, startDate: Iso.string(startDate))
                await onDone()
                dismiss()
            } catch { errorMessage = error.localizedDescription }
            busy = false
        }
    }
}

func parsePrice(_ text: String) -> Double? {
    guard let value = Double(text.replacingOccurrences(of: ",", with: ".")), value > 0 else { return nil }
    return value
}

struct SubscriptionFields: View {
    @Binding var name: String
    @Binding var price: String
    @Binding var frequency: String
    @Binding var shareType: String
    @Binding var startDate: Date

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            QField(label: "Nome") { TextField("Netflix, Spotify, palestra…", text: $name).qInput() }
            HStack(spacing: 12) {
                QField(label: "Prezzo (€)") { TextField("19,99", text: $price).qInput() }
                QField(label: "Frequenza") {
                    Picker("", selection: $frequency) {
                        Text("Mensile").tag("monthly"); Text("Trimestrale").tag("quarterly"); Text("Annuale").tag("yearly")
                    }.labelsHidden().frame(height: 48)
                }
            }
            HStack(spacing: 12) {
                QField(label: "Divisione") {
                    Picker("", selection: $shareType) {
                        Text("In parti uguali").tag("equal"); Text("Importo fisso").tag("fixed"); Text("Percentuale").tag("percentage")
                    }.labelsHidden()
                }
                QField(label: "Data di inizio") {
                    DatePicker("", selection: $startDate, displayedComponents: .date).labelsHidden()
                }
            }
        }
    }
}
