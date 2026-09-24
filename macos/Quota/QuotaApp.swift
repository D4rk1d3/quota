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
                .frame(minWidth: 860, minHeight: 560)
        }
        .defaultSize(width: 1120, height: 780)
        .windowToolbarStyle(.unified(showsTitle: false))
    }
}
