import SwiftUI

struct RootView: View {
    @Environment(AuthStore.self) private var auth

    var body: some View {
        switch auth.state {
        case .loading:
            ProgressView()
        case .signedOut:
            LoginView()
        case .signedIn(let user):
            DashboardView(userId: user.id)
        }
    }
}
