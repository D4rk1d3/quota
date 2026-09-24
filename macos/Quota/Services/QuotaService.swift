import Foundation
import Supabase

@MainActor
final class QuotaService {
    static let shared = QuotaService()

    let client = SupabaseClient(
        supabaseURL: Config.supabaseURL,
        supabaseKey: Config.supabaseAnonKey
    )

    func dashboard() async throws -> DashboardSummary {
        let rows: [DashboardSummary] = try await client.rpc("get_dashboard").execute().value
        return rows.first ?? .empty
    }

    func subscriptions() async throws -> [Subscription] {
        try await client.from("subscriptions")
            .select("id, name, currency, current_price, billing_frequency, next_renewal_date, status")
            .order("created_at", ascending: true)
            .execute().value
    }

    func entitlement(userId: UUID) async throws -> Entitlement {
        let rows: [Entitlement] = try await client
            .rpc("get_current_entitlement", params: ["p_user_id": userId.uuidString])
            .execute().value
        return rows.first ?? .free
    }
}
