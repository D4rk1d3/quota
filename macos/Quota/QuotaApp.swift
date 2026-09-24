import SwiftUI

@main
struct QuotaApp: App {
    @State private var auth = AuthStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(auth)
                .task { await auth.start() }
                .onOpenURL { url in
                    Task { await auth.handle(url: url) }
                }
                .frame(minWidth: 720, minHeight: 480)
        }
    }
}
