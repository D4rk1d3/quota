import Foundation

struct DashboardSummary: Decodable, Sendable {
    let totalExpected: Double
    let totalCollected: Double
    let totalOutstanding: Double
    let paymentsCount: Int
    let overdueCount: Int
    let nextRenewalDate: String?
    let nextRenewalSubscription: String?

    enum CodingKeys: String, CodingKey {
        case totalExpected = "total_expected"
        case totalCollected = "total_collected"
        case totalOutstanding = "total_outstanding"
        case paymentsCount = "payments_count"
        case overdueCount = "overdue_count"
        case nextRenewalDate = "next_renewal_date"
        case nextRenewalSubscription = "next_renewal_subscription"
    }

    static let empty = DashboardSummary(
        totalExpected: 0, totalCollected: 0, totalOutstanding: 0,
        paymentsCount: 0, overdueCount: 0, nextRenewalDate: nil, nextRenewalSubscription: nil
    )
}

struct Subscription: Decodable, Identifiable, Hashable, Sendable {
    let id: UUID
    let name: String
    let currency: String
    let currentPrice: Double
    let billingFrequency: String
    let nextRenewalDate: String
    let startDate: String
    let status: String

    enum CodingKeys: String, CodingKey {
        case id, name, currency, status
        case currentPrice = "current_price"
        case billingFrequency = "billing_frequency"
        case nextRenewalDate = "next_renewal_date"
        case startDate = "start_date"
    }
}

struct Entitlement: Decodable, Sendable {
    let isPro: Bool
    let status: String

    enum CodingKeys: String, CodingKey {
        case isPro = "is_pro"
        case status
    }

    static let free = Entitlement(isPro: false, status: "free")
}

struct Member: Decodable, Identifiable, Hashable, Sendable {
    let id: UUID
    let name: String
    let status: String
}

struct BillingCycle: Decodable, Identifiable, Hashable, Sendable {
    let id: UUID
    let periodStart: String
    let periodEnd: String
    let renewalDate: String
    let expectedTotal: Double
    let collectedTotal: Double
    let currency: String
    let status: String

    enum CodingKeys: String, CodingKey {
        case id, currency, status
        case periodStart = "period_start"
        case periodEnd = "period_end"
        case renewalDate = "renewal_date"
        case expectedTotal = "expected_total"
        case collectedTotal = "collected_total"
    }
}

struct Charge: Decodable, Identifiable, Hashable, Sendable {
    let id: UUID
    let billingCycleId: UUID
    let memberId: UUID
    let expectedAmount: Double
    let currency: String
    let dueDate: String
    let remainingAmount: Double
    let chargeStatus: String

    enum CodingKeys: String, CodingKey {
        case id, currency
        case billingCycleId = "billing_cycle_id"
        case memberId = "member_id"
        case expectedAmount = "expected_amount"
        case dueDate = "due_date"
        case remainingAmount = "remaining_amount"
        case chargeStatus = "charge_status"
    }

    var isSettled: Bool { chargeStatus == "paid" || chargeStatus == "credit" }
}

struct PaymentMethodLabel: Decodable, Hashable, Sendable { let label: String }

struct Payment: Decodable, Identifiable, Hashable, Sendable {
    let id: UUID
    let chargeId: UUID
    let amount: Double
    let currency: String
    let paidAt: String
    let status: String
    let paymentMethods: PaymentMethodLabel?

    enum CodingKeys: String, CodingKey {
        case id, amount, currency, status
        case chargeId = "charge_id"
        case paidAt = "paid_at"
        case paymentMethods = "payment_methods"
    }
}

struct SubscriptionDetail: Sendable {
    var members: [Member] = []
    var cycles: [BillingCycle] = []
    var charges: [Charge] = []
    var payments: [Payment] = []
}

extension Charge {
    var statusLabel: String {
        switch chargeStatus {
        case "paid": "Pagato"
        case "partial": "Parziale"
        case "overdue": "In ritardo"
        case "credit": "Credito"
        default: "Da pagare"
        }
    }
}

enum QuotaError: LocalizedError {
    case message(String)
    var errorDescription: String? {
        if case .message(let m) = self { return m }
        return nil
    }

    /// Traduce gli errori del DB (FREE_LIMIT_*, ecc.) in testo per l'utente.
    static func from(_ error: Error) -> QuotaError {
        let text = "\(error)"
        if text.contains("FREE_LIMIT_SUBSCRIPTIONS") {
            return .message("Il piano gratuito include 1 abbonamento. Passa a Pro per aggiungerne altri.")
        }
        if text.contains("FREE_LIMIT_MEMBERS") {
            return .message("Il piano gratuito include 6 membri per abbonamento. Passa a Pro per aggiungerne altri.")
        }
        return .message("Operazione non riuscita. Riprova.")
    }
}
