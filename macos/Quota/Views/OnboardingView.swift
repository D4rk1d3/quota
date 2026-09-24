import SwiftUI

struct OnboardingView: View {
    let model: AppModel
    var onFinish: () -> Void

    @State private var step = 0
    @State private var name = ""
    @State private var price = ""
    @State private var frequency = "monthly"
    @State private var shareType = "equal"
    @State private var startDate = Date()
    @State private var subscriptionId: UUID?
    @State private var members: [String] = []
    @State private var newMember = ""
    @State private var busy = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 24) {
            HStack(spacing: 8) {
                ForEach(0..<4, id: \.self) { i in
                    Capsule().fill(i <= step ? Color.qAccent : Color.qTextPrimary.opacity(0.12)).frame(width: i == step ? 28 : 8, height: 8)
                }
            }
            Group {
                switch step {
                case 0: welcome
                case 1: createStep
                case 2: membersStep
                default: doneStep
                }
            }
            if let errorMessage { QErrorBanner(message: errorMessage) }
        }
        .padding(36).frame(width: 520).background(Color.qSurface)
        .interactiveDismissDisabled()
        .animation(.easeInOut(duration: 0.24), value: step)
    }

    private var welcome: some View {
        VStack(spacing: 16) {
            Image(systemName: "creditcard.fill").font(.system(size: 28, weight: .bold)).foregroundStyle(.white)
                .frame(width: 68, height: 68).background(Color.qAccent, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            Text("Benvenuto in Quota").font(.system(size: 28, weight: .bold))
            Text("Tieni traccia degli abbonamenti che dividi con altri: chi ha pagato, quanto manca, quando si rinnova. Quota non muove mai soldi, registra soltanto.")
                .font(.system(size: 15)).foregroundStyle(Color.qTextSecondary).multilineTextAlignment(.center)
            Button("Inizia") { step = 1 }.buttonStyle(.qPrimaryLarge).padding(.top, 8)
        }
    }

    private var createStep: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Crea il tuo primo gruppo").font(.system(size: 24, weight: .bold))
            Text("L'abbonamento che dividi: Netflix, Spotify, la palestra…").font(.system(size: 14)).foregroundStyle(Color.qTextSecondary)
            SubscriptionFields(name: $name, price: $price, frequency: $frequency, shareType: $shareType, startDate: $startDate)
            HStack {
                Button("Indietro") { step = 0 }.buttonStyle(.qSecondary)
                Spacer()
                Button(busy ? "Creazione…" : "Avanti", action: createSubscription).buttonStyle(.qPrimary)
                    .disabled(busy || name.trimmingCharacters(in: .whitespaces).isEmpty || parsePrice(price) == nil)
            }
        }
    }

    private var membersStep: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Chi partecipa?").font(.system(size: 24, weight: .bold))
            Text("Aggiungi chi paga con te. Non serve che abbiano un account.").font(.system(size: 14)).foregroundStyle(Color.qTextSecondary)
            HStack(spacing: 10) {
                TextField("Nome", text: $newMember).qInput().onSubmit(addMember)
                Button("Aggiungi", action: addMember).buttonStyle(.qSecondary)
                    .disabled(busy || newMember.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            if !members.isEmpty {
                VStack(spacing: 0) {
                    ForEach(members, id: \.self) { m in
                        HStack(spacing: 12) { QAvatar(name: m, size: 32); Text(m).font(.system(size: 14, weight: .medium)); Spacer() }.padding(.vertical, 8)
                    }
                }
            }
            HStack {
                Spacer()
                Button("Avanti") { step = 3; Task { await finishSetup() } }.buttonStyle(.qPrimary).disabled(members.isEmpty)
            }
        }
    }

    private var doneStep: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill").font(.system(size: 52)).foregroundStyle(Color.qAccent)
            Text("Tutto pronto").font(.system(size: 28, weight: .bold))
            Text(busy ? "Preparo il primo ciclo di fatturazione…" : "Ora puoi registrare i pagamenti di \(name).")
                .font(.system(size: 15)).foregroundStyle(Color.qTextSecondary)
            Button("Vai alla dashboard") { onFinish() }.buttonStyle(.qPrimaryLarge).disabled(busy)
        }
    }

    private func createSubscription() {
        guard let value = parsePrice(price) else { return }
        busy = true; errorMessage = nil
        Task {
            do {
                subscriptionId = try await QuotaService.shared.createSubscription(
                    name: name.trimmingCharacters(in: .whitespaces), price: value,
                    frequency: frequency, shareType: shareType, startDate: Iso.string(startDate))
                step = 2
            } catch { errorMessage = error.localizedDescription }
            busy = false
        }
    }

    private func addMember() {
        let n = newMember.trimmingCharacters(in: .whitespaces)
        guard !n.isEmpty, let subscriptionId else { return }
        busy = true; errorMessage = nil
        Task {
            do {
                try await QuotaService.shared.addMember(subscriptionId: subscriptionId, name: n)
                members.append(n); newMember = ""
            } catch { errorMessage = error.localizedDescription }
            busy = false
        }
    }

    private func finishSetup() async {
        guard let subscriptionId else { return }
        busy = true
        do { try await QuotaService.shared.generateCycle(subscriptionId: subscriptionId, periodStart: Iso.string(startDate)) }
        catch { errorMessage = error.localizedDescription }
        await model.refresh()
        busy = false
    }
}
