import SwiftUI

struct LoginView: View {
    @Environment(AuthStore.self) private var auth
    @State private var email = ""
    @State private var sending = false
    @State private var sent = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "creditcard.circle.fill")
                .font(.system(size: 48))
                .foregroundStyle(.tint)
            Text("Quota").font(.largeTitle.bold())
            Text("Dividi gli abbonamenti in comune col tuo gruppo.")
                .foregroundStyle(.secondary)

            if sent {
                Text("Controlla la posta: apri il link per accedere.")
                    .multilineTextAlignment(.center)
            } else {
                TextField("La tua email", text: $email)
                    .textFieldStyle(.roundedBorder)
                    .frame(maxWidth: 280)
                    .onSubmit(send)
                Button(sending ? "Invio…" : "Invia link di accesso", action: send)
                    .buttonStyle(.borderedProminent)
                    .disabled(sending || email.isEmpty)
            }

            if let errorMessage {
                Text(errorMessage).foregroundStyle(.red).font(.callout)
            }
        }
        .padding(40)
    }

    private func send() {
        sending = true
        errorMessage = nil
        Task {
            do {
                try await auth.sendMagicLink(email: email.trimmingCharacters(in: .whitespaces))
                sent = true
            } catch {
                errorMessage = "Impossibile inviare il link. Riprova."
            }
            sending = false
        }
    }
}
