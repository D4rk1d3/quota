import Foundation
import Observation
import Supabase

@MainActor
@Observable
final class AuthStore {
    enum State { case loading, signedOut, signedIn(User) }

    private(set) var state: State = .loading
    private let client = QuotaService.shared.client

    func start() async {
        for await (_, session) in client.auth.authStateChanges {
            if let user = session?.user {
                state = .signedIn(user)
            } else {
                state = .signedOut
            }
        }
    }

    func sendMagicLink(email: String) async throws {
        try await client.auth.signInWithOTP(email: email, redirectTo: Config.authRedirect)
    }

    func handle(url: URL) async {
        try? await client.auth.session(from: url)
    }

    func signOut() async {
        try? await client.auth.signOut()
    }
}
