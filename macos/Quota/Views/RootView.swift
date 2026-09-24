import SwiftUI

struct RootView: View {
    @Environment(AuthStore.self) private var auth

    var body: some View {
        Group {
            switch auth.state {
            case .loading: ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            case .signedOut: LoginView()
            case .signedIn(let user):
                MainShell(model: AppModel(userId: user.id, email: user.email ?? ""))
                    .id(user.id)
            }
        }
        .background(Color.qBackground)
    }
}

enum SidebarItem: String, CaseIterable, Identifiable {
    case dashboard = "Dashboard"
    case subscriptions = "Abbonamenti"
    case calendar = "Calendario"
    case activity = "Attività"
    case settings = "Impostazioni"

    var id: String { rawValue }
    var icon: String {
        switch self {
        case .dashboard: "house"
        case .subscriptions: "rectangle.stack.person.crop"
        case .calendar: "calendar"
        case .activity: "clock"
        case .settings: "gearshape"
        }
    }
}

struct MainShell: View {
    @State var model: AppModel
    @State private var selection: SidebarItem? = .dashboard
    @State private var path: [Subscription] = []

    var body: some View {
        NavigationSplitView {
            List(SidebarItem.allCases, selection: $selection) { item in
                Label(item.rawValue, systemImage: item.icon)
                    .font(.system(size: 14, weight: .medium))
                    .tag(item)
            }
            .navigationSplitViewColumnWidth(min: 190, ideal: 210)
            .safeAreaInset(edge: .top) {
                HStack(spacing: 8) {
                    Image(systemName: "creditcard.fill")
                        .font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
                        .frame(width: 26, height: 26)
                        .background(Color.qAccent, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    Text("Quota").font(.system(size: 15, weight: .bold))
                    Spacer()
                }
                .padding(.horizontal, 14).padding(.top, 6)
            }
        } detail: {
            Group {
                switch selection ?? .dashboard {
                case .dashboard:
                    DashboardView(model: model) { sub in
                        path = [sub]
                        selection = .subscriptions
                    }
                case .subscriptions: SubscriptionsView(model: model, path: $path)
                case .calendar: CalendarView(model: model)
                case .activity: ActivityView(model: model)
                case .settings: SettingsView(model: model)
                }
            }
            .background(Color.qBackground)
            .toolbar(removing: .title)
        }
        .task { await model.refresh() }
    }
}
