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
    let status: String

    enum CodingKeys: String, CodingKey {
        case id, name, currency, status
        case currentPrice = "current_price"
        case billingFrequency = "billing_frequency"
        case nextRenewalDate = "next_renewal_date"
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
