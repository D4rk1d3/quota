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
        Form {
            TextField("Nome", text: $name)
            TextField("Prezzo (€)", text: $price)
            Picker("Frequenza", selection: $frequency) {
                Text("Mensile").tag("monthly")
                Text("Trimestrale").tag("quarterly")
                Text("Annuale").tag("yearly")
            }
            Picker("Divisione", selection: $shareType) {
                Text("In parti uguali").tag("equal")
                Text("Importo fisso").tag("fixed")
                Text("Percentuale").tag("percentage")
            }
            DatePicker("Data di inizio", selection: $startDate, displayedComponents: .date)
            if let errorMessage { Text(errorMessage).foregroundStyle(.red) }
            HStack {
                Spacer()
                Button("Annulla") { dismiss() }
                Button(busy ? "Salvataggio…" : "Crea", action: save)
                    .buttonStyle(.borderedProminent)
                    .disabled(busy || name.trimmingCharacters(in: .whitespaces).isEmpty || parsedPrice == nil)
            }
        }
        .padding(24)
        .frame(width: 420)
    }

    private var parsedPrice: Double? {
        guard let value = Double(price.replacingOccurrences(of: ",", with: ".")), value > 0 else { return nil }
        return value
    }

    private func save() {
        guard let parsedPrice else { return }
        busy = true
        errorMessage = nil
        Task {
            do {
                try await QuotaService.shared.createSubscription(
                    name: name.trimmingCharacters(in: .whitespaces), price: parsedPrice,
                    frequency: frequency, shareType: shareType, startDate: isoDay(startDate)
                )
                await onDone()
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            busy = false
        }
    }
}

func isoDay(_ date: Date) -> String {
    let f = DateFormatter()
    f.dateFormat = "yyyy-MM-dd"
    f.locale = Locale(identifier: "en_US_POSIX")
    return f.string(from: date)
}
