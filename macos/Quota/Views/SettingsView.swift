import SwiftUI
import AppKit

struct SettingsView: View {
    let model: AppModel
    @Environment(AuthStore.self) private var auth
    @State private var busy = false
    @State private var errorMessage: String?
    @State private var adding = false
    @State private var newLabel = ""
    @State private var newType = "revolut"

    private let types = [("revolut", "Revolut"), ("bank_transfer", "Bonifico"), ("cash", "Contanti"),
                         ("satispay", "Satispay"), ("trade_republic", "Trade Republic"), ("paypal", "PayPal"), ("other", "Altro")]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                QPageHeader(title: "Impostazioni")
                if let errorMessage { QErrorBanner(message: errorMessage) }

                QSectionLabel(title: "Account")
                QList {
                    QRow(title: model.email, subtitle: "Accesso con link via email") {
                        QAvatar(name: model.email)
                    } trailing: {
                        Button("Esci") { Task { await auth.signOut() } }.buttonStyle(.qSecondary)
                    }
                }

                QSectionLabel(title: "Piano")
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text(model.entitlement.isPro ? "Quota Pro" : "Piano gratuito").font(.system(size: 17, weight: .semibold))
                        Spacer()
                        QBadge(label: model.entitlement.isPro ? "Attivo" : "Gratuito",
                               icon: model.entitlement.isPro ? "checkmark" : "gift", color: model.entitlement.isPro ? .qAccentText : .qTextSecondary)
                    }
                    if !model.entitlement.isPro {
                        Text("Il piano gratuito include 1 abbonamento con fino a 6 membri. Passa a Pro per averne senza limiti.")
                            .font(.system(size: 14)).foregroundStyle(Color.qTextSecondary)
                        Button(busy ? "Un attimo…" : "Passa a Pro", action: upgrade).buttonStyle(.qPrimary).disabled(busy)
                    }
                }
                .padding(22).frame(maxWidth: .infinity, alignment: .leading).qCard()

                QSectionLabel(title: "Metodi di pagamento")
                QList {
                    ForEach(Array(model.paymentMethods.enumerated()), id: \.element.id) { index, m in
                        if index > 0 { QDivider() }
                        QRow(title: m.label, subtitle: m.typeLabel) {
                            Image(systemName: "creditcard").foregroundStyle(Color.qAccentText)
                                .frame(width: 36, height: 36).background(Color.qTextPrimary.opacity(0.06), in: Circle())
                        } trailing: {
                            Button { archive(m) } label: { Image(systemName: "xmark") }.buttonStyle(.plain).foregroundStyle(Color.qTextTertiary)
                        }
                    }
                    if !model.paymentMethods.isEmpty { QDivider() }
                    if adding {
                        HStack(spacing: 10) {
                            TextField("Nome (es. Il mio Revolut)", text: $newLabel).textFieldStyle(.plain)
                            Picker("", selection: $newType) { ForEach(types, id: \.0) { Text($0.1).tag($0.0) } }
                                .labelsHidden().frame(width: 140)
                            Button("Annulla") { adding = false }.buttonStyle(.qSecondary)
                            Button("Salva", action: addMethod).buttonStyle(.qPrimary)
                                .disabled(newLabel.trimmingCharacters(in: .whitespaces).isEmpty)
                        }.padding(.vertical, 12)
                    } else {
                        Button { adding = true } label: { Label("Aggiungi metodo", systemImage: "plus") }
                            .buttonStyle(.plain).foregroundStyle(Color.qAccentText).padding(.vertical, 14)
                    }
                }
            }
            .padding(28)
        }
    }

    private func upgrade() {
        busy = true
        Task {
            do { NSWorkspace.shared.open(try await QuotaService.shared.checkoutURL()) }
            catch { errorMessage = error.localizedDescription }
            busy = false
        }
    }

    private func addMethod() {
        Task {
            do {
                try await QuotaService.shared.createPaymentMethod(label: newLabel.trimmingCharacters(in: .whitespaces), type: newType)
                newLabel = ""; adding = false
                await model.refresh()
            } catch { errorMessage = error.localizedDescription }
        }
    }

    private func archive(_ m: PaymentMethodItem) {
        Task { try? await QuotaService.shared.archivePaymentMethod(m.id); await model.refresh() }
    }
}
