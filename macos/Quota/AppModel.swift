import Foundation
import Observation

@MainActor
@Observable
final class AppModel {
    let userId: UUID
    let email: String

    var subscriptions: [Subscription] = []
    var summary = DashboardSummary.empty
    var entitlement = Entitlement.free
    var paymentMethods: [PaymentMethodItem] = []
    var activity: [ActivityItem] = []
    var renewals: [Renewal] = []
    var heroCycle: BillingCycle?
    var profile = Profile.empty
    var loading = true
    var errorMessage: String?

    init(userId: UUID, email: String) {
        self.userId = userId
        self.email = email
    }

    /// Abbonamento con il prossimo rinnovo (per la card hero della dashboard).
    var nextSubscription: Subscription? {
        subscriptions.filter { $0.status == "active" }.min { $0.nextRenewalDate < $1.nextRenewalDate }
    }

    func refresh() async {
        let service = QuotaService.shared
        do {
            async let s = service.dashboard()
            async let subs = service.subscriptions()
            async let e = service.entitlement(userId: userId)
            async let m = service.paymentMethods()
            async let a = service.activity()
            async let r = service.renewals()
            async let p = service.profile()
            (summary, subscriptions, entitlement, paymentMethods, activity, renewals, profile) = try await (s, subs, e, m, a, r, p)
            await NotificationScheduler.reschedule(renewals: renewals, daysBefore: profile.notifyDaysBefore)
            if let next = nextSubscription {
                heroCycle = try await service.currentCycle(subscriptionId: next.id)
            } else {
                heroCycle = nil
            }
            errorMessage = nil
        } catch {
            errorMessage = "Impossibile caricare i dati. Controlla la connessione."
        }
        loading = false
    }
}
