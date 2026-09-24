import Foundation
import UserNotifications

/// Notifiche locali di rinnovo: pianificate sul Mac, arrivano anche ad app chiusa.
enum NotificationScheduler {
    private static let prefix = "quota.renewal."

    static func requestPermission() async -> Bool {
        (try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound])) ?? false
    }

    static func reschedule(renewals: [Renewal], daysBefore: Int) async {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        guard settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional else { return }

        let pending = await center.pendingNotificationRequests()
        center.removePendingNotificationRequests(withIdentifiers: pending.map(\.identifier).filter { $0.hasPrefix(prefix) })

        var calendar = Calendar.current
        calendar.timeZone = TimeZone(identifier: "Europe/Rome") ?? .current
        for renewal in renewals.prefix(60) {
            guard let renewalDay = Iso.date(renewal.renewalDate),
                  let notifyDay = calendar.date(byAdding: .day, value: -daysBefore, to: renewalDay),
                  var parts = Optional(calendar.dateComponents([.year, .month, .day], from: notifyDay)) else { continue }
            parts.hour = 9
            parts.minute = 0
            guard let fire = calendar.date(from: parts), fire > Date() else { continue }

            let content = UNMutableNotificationContent()
            let name = renewal.subscriptions?.name ?? "Abbonamento"
            content.title = name
            content.body = daysBefore == 0
                ? "Si rinnova oggi: \(formatMoney(renewal.expectedTotal, currency: renewal.currency))."
                : "Si rinnova tra \(daysBefore) \(daysBefore == 1 ? "giorno" : "giorni"): \(formatMoney(renewal.expectedTotal, currency: renewal.currency))."
            content.sound = .default
            let trigger = UNCalendarNotificationTrigger(dateMatching: parts, repeats: false)
            try? await center.add(UNNotificationRequest(identifier: prefix + renewal.id.uuidString, content: content, trigger: trigger))
        }
    }
}
