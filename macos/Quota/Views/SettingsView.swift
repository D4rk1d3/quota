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
    @State private var displayName = ""
    @State private var daysBefore = 3
    @State private var exporting = false
    @State private var savedNote: String?

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

                QSectionLabel(title: "Profilo")
                VStack(alignment: .leading, spacing: 14) {
                    QField(label: "Come ti chiami") { TextField("Il tuo nome", text: $displayName).qInput() }
                    Button("Salva profilo", action: saveProfile).buttonStyle(.qPrimary)
                }
                .padding(22).frame(maxWidth: .infinity, alignment: .leading).qCard()

                QSectionLabel(title: "Notifiche di rinnovo")
                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        Text("Avvisami").font(.system(size: 15, weight: .semibold))
                        Spacer()
                        Picker("", selection: $daysBefore) {
                            Text("Il giorno stesso").tag(0)
                            ForEach([1, 2, 3, 5, 7], id: \.self) { Text("\($0) \($0 == 1 ? "giorno" : "giorni") prima").tag($0) }
                        }.labelsHidden().frame(width: 170)
                    }
                    Text("Ricevi una notifica su questo Mac alle 9:00. Al primo salvataggio macOS ti chiede il permesso.")
                        .font(.system(size: 13)).foregroundStyle(Color.qTextSecondary)
                    Button("Salva preavviso", action: saveNotifications).buttonStyle(.qSecondary)
                    if let savedNote { Text(savedNote).font(.system(size: 12)).foregroundStyle(Color.qAccentText) }
                }
                .padding(22).frame(maxWidth: .infinity, alignment: .leading).qCard()

                QSectionLabel(title: "Esporta")
                VStack(alignment: .leading, spacing: 14) {
                    Text("Tutti i pagamenti registrati, compresi quelli stornati, con abbonamento, ciclo, membro e metodo.")
                        .font(.system(size: 13)).foregroundStyle(Color.qTextSecondary)
                    HStack(spacing: 10) {
                        Button(exporting ? "Preparo…" : "Esporta CSV") { export(pdf: false) }.buttonStyle(.qSecondary).disabled(exporting)
                        Button("Esporta PDF") { export(pdf: true) }.buttonStyle(.qSecondary).disabled(exporting)
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
        .onAppear {
            displayName = model.profile.displayName ?? ""
            daysBefore = model.profile.notifyDaysBefore
        }
    }

    private func saveProfile() {
        Task {
            do {
                try await QuotaService.shared.updateProfile(displayName: displayName.trimmingCharacters(in: .whitespaces), notifyDaysBefore: daysBefore)
                await model.refresh()
                savedNote = nil; errorMessage = nil
            } catch { errorMessage = error.localizedDescription }
        }
    }

    private func saveNotifications() {
        Task {
            _ = await NotificationScheduler.requestPermission()
            do {
                try await QuotaService.shared.updateProfile(displayName: displayName.trimmingCharacters(in: .whitespaces), notifyDaysBefore: daysBefore)
                await model.refresh()
                savedNote = "Preavviso salvato."
                errorMessage = nil
            } catch { errorMessage = error.localizedDescription }
        }
    }

    private func export(pdf: Bool) {
        exporting = true
        Task {
            do {
                let lines = Exporter.lines(from: try await QuotaService.shared.exportRows())
                let stamp = Iso.today
                if pdf {
                    _ = Exporter.save(data: Exporter.pdf(lines, title: "Quota — pagamenti al \(formatIsoDate(stamp))"), suggestedName: "quota-pagamenti-\(stamp).pdf")
                } else {
                    _ = Exporter.save(data: Data(Exporter.csv(lines).utf8), suggestedName: "quota-pagamenti-\(stamp).csv")
                }
                errorMessage = nil
            } catch { errorMessage = "Esportazione non riuscita." }
            exporting = false
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
