package it.trevisantech.quota.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

enum class PaymentMethod(val raw: String, val label: String) {
    BONIFICO("bonifico", "Bonifico"),
    REVOLUT("revolut", "Revolut"),
    TRADE_REPUBLIC("trade_republic", "Trade Republic"),
    CONTANTI("contanti", "Contanti"),
    SATISPAY("satispay", "Satispay");

    companion object {
        fun fromRaw(raw: String?): PaymentMethod = entries.firstOrNull { it.raw == raw } ?: BONIFICO
    }
}

enum class MemberStatus(val label: String) {
    REGOLARE("In regola"),
    IN_SCADENZA("In scadenza"),
    IN_RITARDO("In ritardo"),
}

data class Member(
    val id: String,
    val name: String,
    val monthlyShareCents: Int,
    val coveredUntil: String,
    val lastPaymentDate: String?,
    val lastPaymentAmountCents: Int?,
    val status: MemberStatus,
    val joinedAt: String,
    val color: String,
    val active: Boolean = true,
    val email: String? = null,
    val notes: String? = null,
)

data class Payment(
    val id: String,
    val memberId: String,
    val amountCents: Int,
    val date: String,
    val method: PaymentMethod,
    val note: String?,
    val coversUntil: String,
    val voided: Boolean,
)

enum class ActivityType { PAYMENT, REMINDER, MEMBER_ADDED, CHARGE }

data class ActivityItem(
    val id: String,
    val type: ActivityType,
    val memberId: String?,
    val date: String,
    val amountCents: Int?,
    val description: String,
)

data class SpotifyPlan(
    val planName: String,
    val monthlyCostCents: Int,
    val billingDay: Int,
    val perMemberShareCents: Int,
)

data class FundState(
    val balanceCents: Int,
    val collectedThisCycleCents: Int,
    val expectedThisCycleCents: Int,
    val toRecoverCents: Int,
    val membersInGoodStanding: Int,
    val totalMembers: Int,
)

// ---- Wire rows (rispecchiano esattamente le colonne selezionate) ----

@Serializable
data class SubscriptionRow(
    val name: String,
    val monthly_cost_cents: Int,
    val billing_day: Int,
    val member_quota_cents: Int,
    val start_date: String,
)

@Serializable
data class MemberCoverageRow(
    val member_id: String,
    val name: String,
    val color: String,
    val monthly_share_cents: Int,
    val active: Boolean,
    val credit_cents: Int,
    val fully_covered_cycles: Int,
    val covered_until: String,
    val is_overdue: Boolean,
)

@Serializable
data class MemberCoverageSingleRow(
    val member_id: String,
    val credit_cents: Int,
    val fully_covered_cycles: Int,
    val covered_until: String,
    val is_overdue: Boolean,
)

@Serializable
data class MemberRow(
    val id: String,
    val name: String,
    val email: String? = null,
    val color: String,
    val monthly_share_cents: Int,
    val active: Boolean,
    val notes: String? = null,
    val joined_at: String,
)

@Serializable
data class PaymentRow(
    val id: String,
    val member_id: String? = null,
    val amount_cents: Int,
    val kind: String,
    val method: String? = null,
    val paid_at: String,
    val note: String? = null,
    val voids_payment_id: String? = null,
    val created_at: String,
)

/** Select parziale: solo le colonne usate per l'ultimo pagamento per membro. */
@Serializable
data class PaymentSummaryRow(
    val member_id: String? = null,
    val amount_cents: Int,
    val paid_at: String,
    val kind: String,
)

/** Select parziale: elenco pagamenti senza id/created_at. */
@Serializable
data class PaymentListRow(
    val id: String,
    val member_id: String? = null,
    val amount_cents: Int,
    val kind: String,
    val method: String? = null,
    val paid_at: String,
    val note: String? = null,
)

@Serializable
data class CoverageAllocationRow(
    val payment_id: String,
    val cycle_date: String,
    val amount_cents: Int,
)

@Serializable
data class FundStateRow(
    val current_cycle_date: String,
    val balance_cents: Int,
    val collected_this_cycle_cents: Int,
    val expected_this_cycle_cents: Int,
    val to_recover_cents: Int,
    val members_in_good_standing: Int,
    val total_members: Int,
)

@Serializable
data class NotificationRow(
    val id: String,
    val member_id: String? = null,
    val type: String,
    val created_at: String,
    val body: String,
)
