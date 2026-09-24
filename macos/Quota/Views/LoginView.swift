import SwiftUI

struct LoginView: View {
    @Environment(AuthStore.self) private var auth
    @State private var email = ""
    @State private var sending = false
    @State private var sent = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            Image(systemName: "creditcard.fill")
                .font(.system(size: 26, weight: .bold)).foregroundStyle(.white)
                .frame(width: 64, height: 64)
                .background(Color.qAccent, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            Text("Quota").font(.system(size: 34, weight: .bold)).padding(.top, 20)
            Text("Dividi gli abbonamenti in comune col tuo gruppo, senza fogli di calcolo.")
                .font(.system(size: 15)).foregroundStyle(Color.qTextSecondary)
                .multilineTextAlignment(.center).padding(.top, 6)

            VStack(spacing: 14) {
                if sent {
                    VStack(spacing: 6) {
                        Image(systemName: "envelope.badge").font(.system(size: 24)).foregroundStyle(Color.qAccentText)
                        Text("Controlla la posta").font(.system(size: 16, weight: .semibold))
                        Text("Abbiamo inviato un link a \(email). Aprilo per accedere.")
                            .font(.system(size: 13)).foregroundStyle(Color.qTextSecondary).multilineTextAlignment(.center)
                    }
                } else {
                    TextField("La tua email", text: $email)
                        .textFieldStyle(.plain).font(.system(size: 15))
                        .padding(.horizontal, 16).frame(height: 48)
                        .background(Color.qTextPrimary.opacity(0.06), in: RoundedRectangle(cornerRadius: QRadius.input, style: .continuous))
                        .onSubmit(send)
                    Button(action: send) {
                        Text(sending ? "Invio…" : "Invia link di accesso").frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.qPrimaryLarge)
                    .disabled(sending || email.isEmpty)
                    if let errorMessage { QErrorBanner(message: errorMessage) }
                }
            }
            .padding(24).frame(width: 380)
            .qCard(radius: QRadius.hero).padding(.top, 32)
        }
        .padding(40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func send() {
        sending = true
        errorMessage = nil
        Task {
            do {
                try await auth.sendMagicLink(email: email.trimmingCharacters(in: .whitespaces))
                sent = true
            } catch {
                errorMessage = "Impossibile inviare il link. Riprova tra qualche minuto."
            }
            sending = false
        }
    }
}
