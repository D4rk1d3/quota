import Foundation
import Supabase

private struct NewSubscription: Encodable {
    let organizer_id: UUID
    let name: String
    let current_price: Double
    let billing_frequency: String
    let share_type: String
    let start_date: String
    let next_renewal_date: String
}

private struct NewMember: Encodable {
    let subscription_id: UUID
    let name: String
}

private struct MemberStatusUpdate: Encodable { let status: String }

private struct NewReminder: Encodable {
    let organizer_id: UUID
    let member_id: UUID
    let charge_id: UUID
    let message: String
    let channel = "copy"
    let status = "sent"
    let sent_at: String
}

private struct CheckoutResponse: Decodable { let url: URL }

@MainActor
final class QuotaService {
    static let shared = QuotaService()

    let client = SupabaseClient(
        supabaseURL: Config.supabaseURL,
        supabaseKey: Config.supabaseAnonKey
    )

    private func currentUserId() throws -> UUID {
        guard let id = client.auth.currentUser?.id else { throw QuotaError.message("Sessione scaduta.") }
        return id
    }

    // MARK: Lettura

    func dashboard() async throws -> DashboardSummary {
        let rows: [DashboardSummary] = try await client.rpc("get_dashboard").execute().value
        return rows.first ?? .empty
    }

    func subscriptions() async throws -> [Subscription] {
        try await client.from("subscriptions")
            .select("id, name, currency, current_price, billing_frequency, next_renewal_date, status, start_date")
            .order("created_at", ascending: true)
            .execute().value
    }

    func entitlement(userId: UUID) async throws -> Entitlement {
        let rows: [Entitlement] = try await client
            .rpc("get_current_entitlement", params: ["p_user_id": userId.uuidString])
            .execute().value
        return rows.first ?? .free
    }

    func detail(subscriptionId: UUID) async throws -> SubscriptionDetail {
        let members: [Member] = try await client.from("subscription_members")
            .select("id, name, status").eq("subscription_id", value: subscriptionId)
            .order("created_at").execute().value
        let cycles: [BillingCycle] = try await client.from("billing_cycles")
            .select("id, period_start, period_end, renewal_date, expected_total, collected_total, currency, status")
            .eq("subscription_id", value: subscriptionId)
            .order("period_start", ascending: false).limit(12).execute().value

        var result = SubscriptionDetail(members: members, cycles: cycles)
        let cycleIds = cycles.map(\.id)
        guard !cycleIds.isEmpty else { return result }

        result.charges = try await client.from("v_member_charges")
            .select("id, billing_cycle_id, member_id, expected_amount, currency, due_date, remaining_amount, charge_status")
            .in("billing_cycle_id", values: cycleIds).execute().value
        result.payments = try await client.from("payments")
            .select("id, charge_id, amount, currency, paid_at, status, payment_methods(label)")
            .in("charge_id", values: result.charges.map(\.id))
            .order("paid_at", ascending: false).execute().value
        return result
    }

    func currentCycle(subscriptionId: UUID) async throws -> BillingCycle? {
        let rows: [BillingCycle] = try await client.from("billing_cycles")
            .select("id, period_start, period_end, renewal_date, expected_total, collected_total, currency, status")
            .eq("subscription_id", value: subscriptionId)
            .in("status", values: ["current", "overdue", "upcoming"])
            .order("period_start", ascending: true).limit(1).execute().value
        return rows.first
    }

    func paymentMethods() async throws -> [PaymentMethodItem] {
        try await client.from("payment_methods")
            .select("id, label, method_type, is_default")
            .is("archived_at", value: nil)
            .order("is_default", ascending: false).execute().value
    }

    func activity(limit: Int = 60) async throws -> [ActivityItem] {
        try await client.from("activity_log")
            .select("id, event_type, metadata, created_at")
            .order("created_at", ascending: false).limit(limit).execute().value
    }

    func renewals() async throws -> [Renewal] {
        try await client.from("billing_cycles")
            .select("id, renewal_date, status, subscriptions(name)")
            .in("status", values: ["upcoming", "current", "overdue"])
            .order("renewal_date", ascending: true).limit(120).execute().value
    }

    // MARK: Scrittura

    func createPaymentMethod(label: String, type: String) async throws {
        struct New: Encodable { let organizer_id: UUID; let label: String; let method_type: String }
        do {
            try await client.from("payment_methods")
                .insert(New(organizer_id: try currentUserId(), label: label, method_type: type)).execute()
        } catch { throw QuotaError.from(error) }
    }

    func archivePaymentMethod(_ id: UUID) async throws {
        struct Patch: Encodable { let archived_at: String }
        try await client.from("payment_methods")
            .update(Patch(archived_at: ISO8601DateFormatter().string(from: Date())))
            .eq("id", value: id).execute()
    }

    @discardableResult
    func createSubscription(name: String, price: Double, frequency: String, shareType: String, startDate: String) async throws -> UUID {
        do {
            let userId = try currentUserId()
            struct Params: Encodable { let p_date: String; let p_frequency: String; let p_interval: Int }
            let renewal: String = try await client.rpc("add_billing_period", params: Params(
                p_date: startDate, p_frequency: frequency, p_interval: 1
            )).execute().value
            struct Created: Decodable { let id: UUID }
            let created: Created = try await client.from("subscriptions").insert(NewSubscription(
                organizer_id: userId, name: name, current_price: price,
                billing_frequency: frequency, share_type: shareType,
                start_date: startDate, next_renewal_date: renewal
            )).select("id").single().execute().value
            return created.id
        } catch { throw QuotaError.from(error) }
    }

    func addMember(subscriptionId: UUID, name: String) async throws {
        do {
            try await client.from("subscription_members")
                .insert(NewMember(subscription_id: subscriptionId, name: name)).execute()
        } catch { throw QuotaError.from(error) }
    }

    func setMemberStatus(_ id: UUID, status: String) async throws {
        do {
            try await client.from("subscription_members")
                .update(MemberStatusUpdate(status: status)).eq("id", value: id).execute()
        } catch { throw QuotaError.from(error) }
    }

    func generateCycle(subscriptionId: UUID, periodStart: String) async throws {
        do {
            try await client.rpc("generate_billing_cycle", params: [
                "p_subscription_id": subscriptionId.uuidString, "p_period_start": periodStart,
            ]).execute()
        } catch { throw QuotaError.from(error) }
    }

    func recordPayment(chargeId: UUID, amount: Double, methodId: UUID?, paidAt: Date, note: String?) async throws {
        struct Params: Encodable {
            let p_charge_id: UUID
            let p_amount: Double
            let p_payment_method_id: UUID?
            let p_paid_at: String
            let p_note: String?
        }
        do {
            try await client.rpc("record_payment", params: Params(
                p_charge_id: chargeId, p_amount: amount, p_payment_method_id: methodId,
                p_paid_at: ISO8601DateFormatter().string(from: paidAt),
                p_note: (note?.isEmpty ?? true) ? nil : note
            )).execute()
        } catch { throw QuotaError.from(error) }
    }

    func updateSubscription(id: UUID, name: String, price: Double) async throws {
        struct Patch: Encodable { let name: String; let current_price: Double }
        do {
            try await client.from("subscriptions").update(Patch(name: name, current_price: price)).eq("id", value: id).execute()
        } catch { throw QuotaError.from(error) }
    }

    func reversePayment(paymentId: UUID, reason: String) async throws {
        do {
            try await client.rpc("reverse_payment", params: [
                "p_payment_id": paymentId.uuidString, "p_reason": reason,
            ]).execute()
        } catch { throw QuotaError.from(error) }
    }

    func recordReminder(memberId: UUID, chargeId: UUID, message: String) async throws {
        let userId = try currentUserId()
        try await client.from("reminders").insert(NewReminder(
            organizer_id: userId, member_id: memberId, charge_id: chargeId, message: message,
            sent_at: ISO8601DateFormatter().string(from: Date())
        )).execute()
    }

    func checkoutURL() async throws -> URL {
        do {
            let response: CheckoutResponse = try await client.functions.invoke("create-checkout")
            return response.url
        } catch { throw QuotaError.message("Impossibile avviare il pagamento. Riprova più tardi.") }
    }
}
