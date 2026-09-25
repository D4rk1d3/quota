package it.trevisantech.quota.data

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import it.trevisantech.quota.model.ActivityItem
import it.trevisantech.quota.model.ActivityType
import it.trevisantech.quota.model.CoverageAllocationRow
import it.trevisantech.quota.model.FundState
import it.trevisantech.quota.model.FundStateRow
import it.trevisantech.quota.model.Member
import it.trevisantech.quota.model.MemberCoverageRow
import it.trevisantech.quota.model.MemberCoverageSingleRow
import it.trevisantech.quota.model.MemberRow
import it.trevisantech.quota.model.MemberStatus
import it.trevisantech.quota.model.Payment
import it.trevisantech.quota.model.PaymentListRow
import it.trevisantech.quota.model.PaymentMethod
import it.trevisantech.quota.model.PaymentRow
import it.trevisantech.quota.model.PaymentSummaryRow
import it.trevisantech.quota.model.NotificationRow
import it.trevisantech.quota.model.SpotifyPlan
import it.trevisantech.quota.model.SubscriptionRow
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class QuotaException(message: String) : Exception(message)

/**
 * Rispecchia 1:1 lib/supabase/queries.ts e lib/actions (payments/members) della web app
 * (e SupabaseService.swift nell'app macOS): stessi nomi di RPC/tabelle,
 * stessa logica di derivazione (coversUntil, voided, status).
 */
class QuotaRepository(private val client: SupabaseClient) {

    private fun statusFromCoverage(isOverdue: Boolean, coveredUntil: String, asOf: String): MemberStatus {
        if (isOverdue) return MemberStatus.IN_RITARDO
        val days = IsoDate.daysBetween(asOf, coveredUntil)
        return if (days <= 7) MemberStatus.IN_SCADENZA else MemberStatus.REGOLARE
    }

    suspend fun getSubscriptionPlan(): SpotifyPlan {
        val row = client.from("subscriptions").select {
            filter { eq("active", true) }
        }.decodeSingle<SubscriptionRow>()
        return SpotifyPlan(
            planName = row.name,
            monthlyCostCents = row.monthly_cost_cents,
            billingDay = row.billing_day,
            perMemberShareCents = row.member_quota_cents,
        )
    }

    suspend fun updateSubscription(monthlyCostCents: Int, billingDay: Int, memberQuotaCents: Int) {
        try {
            client.from("subscriptions").update(buildJsonObject {
                put("monthly_cost_cents", monthlyCostCents)
                put("billing_day", billingDay)
                put("member_quota_cents", memberQuotaCents)
            }) {
                filter { eq("active", true) }
            }
        } catch (e: Exception) {
            throw QuotaException("Impossibile salvare le impostazioni del piano.")
        }
    }

    data class MembersWithCoverage(val members: List<Member>, val asOf: String)

    suspend fun getMembersWithCoverage(): MembersWithCoverage {
        val asOf = IsoDate.todayInRome()

        val coverage = client.postgrest.rpc("member_coverage_all", buildJsonObject { put("p_as_of", asOf) })
            .decodeList<MemberCoverageRow>()
        val memberRows = client.from("members").select {
            filter { eq("active", true) }
        }.decodeList<MemberRow>()
        val payments = client.from("payments")
            .select(columns = Columns.list("member_id", "amount_cents", "paid_at", "kind")) {
                filter { eq("kind", "payment") }
                order("paid_at", Order.DESCENDING)
            }.decodeList<PaymentSummaryRow>()

        val joinedAtByMember = memberRows.associate { it.id to it.joined_at }
        val lastPaymentByMember = mutableMapOf<String, Pair<String, Int>>()
        for (p in payments) {
            val memberId = p.member_id ?: continue
            if (!lastPaymentByMember.containsKey(memberId)) {
                lastPaymentByMember[memberId] = p.paid_at to p.amount_cents
            }
        }

        val members = coverage.map { c ->
            val last = lastPaymentByMember[c.member_id]
            Member(
                id = c.member_id,
                name = c.name,
                monthlyShareCents = c.monthly_share_cents,
                coveredUntil = c.covered_until,
                lastPaymentDate = last?.first,
                lastPaymentAmountCents = last?.second,
                status = statusFromCoverage(c.is_overdue, c.covered_until, asOf),
                joinedAt = joinedAtByMember[c.member_id] ?: asOf,
                color = c.color,
            )
        }
        return MembersWithCoverage(members, asOf)
    }

    suspend fun getFundState(): FundState {
        val asOf = IsoDate.todayInRome()
        val row = client.postgrest.rpc("fund_state", buildJsonObject { put("p_as_of", asOf) })
            .decodeSingle<FundStateRow>()
        return FundState(
            balanceCents = row.balance_cents,
            collectedThisCycleCents = row.collected_this_cycle_cents,
            expectedThisCycleCents = row.expected_this_cycle_cents,
            toRecoverCents = row.to_recover_cents,
            membersInGoodStanding = row.members_in_good_standing,
            totalMembers = row.total_members,
        )
    }

    suspend fun getActivity(limit: Int = 20): List<ActivityItem> {
        val payments = client.from("payments")
            .select(columns = Columns.list("id", "member_id", "amount_cents", "kind", "paid_at", "created_at", "note")) {
                order("created_at", Order.DESCENDING)
                limit(limit.toLong())
            }.decodeList<PaymentRow>()
        val notifications = client.from("notifications")
            .select(columns = Columns.list("id", "member_id", "type", "created_at", "body")) {
                order("created_at", Order.DESCENDING)
                limit(limit.toLong())
            }.decodeList<NotificationRow>()
        val members = client.from("members").select().decodeList<MemberRow>()
        val nameById = members.associate { it.id to it.name }

        val paymentItems = payments.map { p ->
            val name = p.member_id?.let { nameById[it] } ?: "Membro"
            val description = when (p.kind) {
                "payment" -> "$name ha pagato la quota"
                "void" -> "Pagamento di $name annullato"
                else -> "Rettifica sul pagamento di $name"
            }
            ActivityItem(
                id = p.id,
                type = ActivityType.PAYMENT,
                memberId = p.member_id,
                date = p.created_at.take(10),
                amountCents = p.amount_cents,
                description = description,
            )
        }
        val notificationItems = notifications.map { n ->
            ActivityItem(
                id = n.id,
                type = if (n.type == "charge_due" || n.type == "charge_reminder_3d") ActivityType.CHARGE else ActivityType.REMINDER,
                memberId = n.member_id,
                date = n.created_at.take(10),
                amountCents = null,
                description = n.body,
            )
        }
        return (paymentItems + notificationItems).sortedByDescending { it.date }.take(limit)
    }

    data class MemberDetail(val member: Member, val payments: List<Payment>)

    suspend fun getMemberDetail(id: String): MemberDetail? {
        val asOf = IsoDate.todayInRome()

        val memberRow = client.from("members").select {
            filter { eq("id", id) }
        }.decodeSingleOrNull<MemberRow>() ?: return null

        val coverageRows = client.postgrest.rpc(
            "member_coverage",
            buildJsonObject { put("p_member_id", id); put("p_as_of", asOf) }
        ).decodeList<MemberCoverageSingleRow>()
        val coverage = coverageRows.firstOrNull()

        val paymentRows = client.from("payments")
            .select(columns = Columns.list("id", "amount_cents", "kind", "method", "paid_at", "note", "voids_payment_id", "created_at")) {
                filter { eq("member_id", id) }
                order("created_at", Order.DESCENDING)
            }.decodeList<PaymentRow>()

        val allocRows = client.from("coverage_allocations")
            .select(columns = Columns.list("payment_id", "cycle_date", "amount_cents")) {
                filter { eq("member_id", id) }
            }.decodeList<CoverageAllocationRow>()

        val maxCycleByPayment = mutableMapOf<String, String>()
        for (a in allocRows) {
            val current = maxCycleByPayment[a.payment_id]
            if (current == null || a.cycle_date > current) maxCycleByPayment[a.payment_id] = a.cycle_date
        }

        val voidedPaymentIds = paymentRows.filter { it.kind == "void" }.mapNotNull { it.voids_payment_id }.toSet()

        val payments = paymentRows.filter { it.kind == "payment" }.map { p ->
            val lastCycle = maxCycleByPayment[p.id]
            val coversUntil = lastCycle?.let { IsoDate.addOneMonth(it) } ?: p.paid_at
            Payment(
                id = p.id,
                memberId = id,
                amountCents = p.amount_cents,
                date = p.paid_at,
                method = PaymentMethod.fromRaw(p.method),
                note = p.note,
                coversUntil = coversUntil,
                voided = voidedPaymentIds.contains(p.id),
            )
        }

        val lastActive = payments.firstOrNull { !it.voided }

        val member = Member(
            id = memberRow.id,
            name = memberRow.name,
            monthlyShareCents = memberRow.monthly_share_cents,
            coveredUntil = coverage?.covered_until ?: asOf,
            lastPaymentDate = lastActive?.date,
            lastPaymentAmountCents = lastActive?.amountCents,
            status = coverage?.let { statusFromCoverage(it.is_overdue, it.covered_until, asOf) } ?: MemberStatus.IN_RITARDO,
            joinedAt = memberRow.joined_at,
            color = memberRow.color,
            active = memberRow.active,
            email = memberRow.email,
            notes = memberRow.notes,
        )

        return MemberDetail(member, payments)
    }

    suspend fun getAllPayments(): List<Payment> {
        val rows = client.from("payments")
            .select(columns = Columns.list("id", "member_id", "amount_cents", "kind", "method", "paid_at", "note")) {
                filter { eq("kind", "payment") }
                order("paid_at", Order.DESCENDING)
            }.decodeList<PaymentListRow>()

        return rows.mapNotNull { p ->
            val memberId = p.member_id ?: return@mapNotNull null
            Payment(
                id = p.id,
                memberId = memberId,
                amountCents = p.amount_cents,
                date = p.paid_at,
                method = PaymentMethod.fromRaw(p.method),
                note = p.note,
                coversUntil = p.paid_at,
                voided = false,
            )
        }
    }

    // ---- Member actions ----

    suspend fun createMember(name: String, email: String?, color: String?, monthlyShareCents: Int?, notes: String?) {
        try {
            client.from("members").insert(buildJsonObject {
                put("name", name)
                email?.let { put("email", it) }
                color?.let { put("color", it) }
                monthlyShareCents?.let { put("monthly_share_cents", it) }
                notes?.let { put("notes", it) }
            })
        } catch (e: Exception) {
            throw QuotaException("Impossibile aggiungere il membro.")
        }
    }

    suspend fun updateMember(
        id: String,
        name: String? = null,
        email: String? = null,
        color: String? = null,
        monthlyShareCents: Int? = null,
        active: Boolean? = null,
        notes: String? = null,
    ) {
        val payload = buildJsonObject {
            name?.let { put("name", it) }
            email?.let { put("email", it) }
            color?.let { put("color", it) }
            monthlyShareCents?.let { put("monthly_share_cents", it) }
            active?.let { put("active", it) }
            notes?.let { put("notes", it) }
        }
        if (payload.isEmpty()) return
        try {
            client.from("members").update(payload) {
                filter { eq("id", id) }
            }
        } catch (e: Exception) {
            throw QuotaException("Impossibile aggiornare il membro.")
        }
    }

    suspend fun deactivateMember(id: String) {
        try {
            client.from("members").update(buildJsonObject { put("active", false) }) {
                filter { eq("id", id) }
            }
        } catch (e: Exception) {
            throw QuotaException("Impossibile rimuovere il membro.")
        }
    }

    // ---- Payment actions (RPC, atomiche lato DB) ----

    suspend fun recordPayment(memberId: String, amountCents: Int, method: PaymentMethod, paidAt: String, note: String?) {
        try {
            client.postgrest.rpc("record_payment", buildJsonObject {
                put("p_member_id", memberId)
                put("p_amount_cents", amountCents)
                put("p_method", method.raw)
                put("p_paid_at", paidAt)
                note?.let { put("p_note", it) }
            })
        } catch (e: Exception) {
            throw QuotaException("Impossibile registrare il pagamento.")
        }
    }

    suspend fun voidPayment(paymentId: String, note: String) {
        if (note.trim().length < 3) throw QuotaException("Spiega brevemente il motivo dell'annullamento.")
        try {
            client.postgrest.rpc("void_payment", buildJsonObject {
                put("p_payment_id", paymentId)
                put("p_note", note)
            })
        } catch (e: Exception) {
            throw QuotaException("Impossibile annullare il pagamento.")
        }
    }

    suspend fun adjustPayment(paymentId: String, deltaCents: Int, note: String) {
        if (deltaCents == 0) throw QuotaException("Il delta non può essere zero")
        if (note.trim().length < 3) throw QuotaException("Spiega il motivo della rettifica")
        try {
            client.postgrest.rpc("adjust_payment", buildJsonObject {
                put("p_payment_id", paymentId)
                put("p_delta_cents", deltaCents)
                put("p_note", note)
            })
        } catch (e: Exception) {
            throw QuotaException("Impossibile rettificare il pagamento.")
        }
    }
}
