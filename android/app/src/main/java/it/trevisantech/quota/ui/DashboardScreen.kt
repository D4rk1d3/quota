package it.trevisantech.quota.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Inbox
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import it.trevisantech.quota.data.IsoDate
import it.trevisantech.quota.data.Money
import it.trevisantech.quota.data.QuotaRepository
import it.trevisantech.quota.model.FundState
import it.trevisantech.quota.model.Member
import it.trevisantech.quota.model.MemberStatus
import it.trevisantech.quota.model.SpotifyPlan
import kotlinx.coroutines.launch

@Composable
fun DashboardScreen(repository: QuotaRepository, onSelectMember: (String) -> Unit) {
    var plan by remember { mutableStateOf<SpotifyPlan?>(null) }
    var fund by remember { mutableStateOf<FundState?>(null) }
    var members by remember { mutableStateOf<List<Member>>(emptyList()) }
    var asOf by remember { mutableStateOf(IsoDate.todayInRome()) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var showRegisterPayment by remember { mutableStateOf(false) }
    var showNewMember by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScopeCompat()

    suspend fun load() {
        isLoading = true
        error = null
        try {
            plan = repository.getSubscriptionPlan()
            fund = repository.getFundState()
            val result = repository.getMembersWithCoverage()
            members = result.members
            asOf = result.asOf
        } catch (e: Exception) {
            error = "Impossibile caricare i dati. Controlla la connessione."
        }
        isLoading = false
    }

    LaunchedEffect(Unit) { load() }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 100.dp),
        ) {
            item {
                if (error != null) ErrorBanner(error!!, onRetry = { scope.launch { load() } })
            }
            item {
                val p = plan; val f = fund
                if (p != null && f != null) {
                    HeroChargeCard(plan = p, fund = f, asOf = asOf, onRegister = { showRegisterPayment = true })
                }
            }
            if (members.isEmpty() && !isLoading && error == null) {
                item { EmptyMembersState(onAdd = { showNewMember = true }) }
            } else {
                item { Text("Membri", fontSize = 15.sp, fontWeight = FontWeight.SemiBold) }
                items(members.sortedBy { statusOrder(it.status) }) { member ->
                    MemberRowCard(member = member, onClick = { onSelectMember(member.id) })
                }
            }
        }

        if (isLoading) {
            CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
        }
    }

    if (showRegisterPayment) {
        RegisterPaymentDialog(
            repository = repository,
            members = members,
            preselectedMemberId = null,
            onDismiss = { showRegisterPayment = false },
            onSaved = { showRegisterPayment = false; scope.launch { load() } },
        )
    }
    if (showNewMember) {
        MemberFormDialog(
            repository = repository,
            existing = null,
            onDismiss = { showNewMember = false },
            onSaved = { showNewMember = false; scope.launch { load() } },
        )
    }
}

private fun statusOrder(status: MemberStatus): Int = when (status) {
    MemberStatus.IN_RITARDO -> 0
    MemberStatus.IN_SCADENZA -> 1
    MemberStatus.REGOLARE -> 2
}

@Composable
private fun HeroChargeCard(plan: SpotifyPlan, fund: FundState, asOf: String, onRegister: () -> Unit) {
    val nextCharge = IsoDate.nextChargeDate(plan.billingDay, asOf)
    val days = IsoDate.daysBetween(asOf, nextCharge)
    val covered = fund.collectedThisCycleCents + fund.balanceCents >= plan.monthlyCostCents
    val progressPct = if (fund.expectedThisCycleCents > 0)
        (fund.collectedThisCycleCents.toFloat() / fund.expectedThisCycleCents.toFloat()).coerceAtMost(1f)
    else 0f

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard(shape = RoundedCornerShape(RadiusHeroCard))
            .padding(22.dp),
    ) {
        Row(verticalAlignment = Alignment.Top) {
            Text(
                "PROSSIMO ADDEBITO",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.6.sp,
                color = QuotaLabelSecondary,
                modifier = Modifier.weight(1f),
            )
            val badgeColor = if (covered) QuotaAccent else QuotaAmber
            Text(
                if (covered) "Fondo sufficiente"
                else "Mancano ${Money.euroString(plan.monthlyCostCents - fund.collectedThisCycleCents - fund.balanceCents)}",
                fontSize = 12.sp,
                color = if (covered) QuotaAccentText else QuotaAmber,
                fontWeight = FontWeight.Medium,
                modifier = Modifier
                    .background(badgeColor.copy(alpha = 0.16f), RoundedCornerShape(50))
                    .padding(horizontal = 10.dp, vertical = 6.dp),
            )
        }

        Text(Money.euroString(plan.monthlyCostCents), fontSize = 34.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 8.dp))

        Text(
            "${IsoDate.formatDayMonthYear(nextCharge)} · ${if (days == 0L) "oggi" else if (days == 1L) "tra 1 giorno" else "tra $days giorni"}",
            fontSize = 13.sp,
            color = QuotaTextSecondary,
        )

        Row(modifier = Modifier.fillMaxWidth().padding(top = 18.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Fondo coperto", fontSize = 13.sp, color = QuotaTextSecondary)
            Text(
                "${Money.euroString(fund.collectedThisCycleCents)} / ${Money.euroString(fund.expectedThisCycleCents)}",
                fontSize = 13.sp,
                color = QuotaTextSecondary,
            )
        }
        Spacer(Modifier.height(6.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(3.dp)),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(progressPct)
                    .height(6.dp)
                    .background(QuotaAccent, RoundedCornerShape(3.dp)),
            )
        }

        Spacer(Modifier.height(18.dp))
        Button(
            onClick = onRegister,
            shape = RoundedCornerShape(50),
            colors = ButtonDefaults.buttonColors(containerColor = QuotaAccent),
            modifier = Modifier.fillMaxWidth().height(48.dp),
        ) {
            Text("+  Registra pagamento Spotify")
        }
    }
}

@Composable
private fun MemberRowCard(member: Member, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard(shape = RoundedCornerShape(GlassCornerMedium))
            .clickable(onClick = onClick)
            .padding(13.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier.size(36.dp).background(colorFromHex(member.color), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(IsoDate.initials(member.name), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(member.name, fontSize = 13.5.sp, fontWeight = FontWeight.Medium)
            Text("Coperto fino al ${IsoDate.formatDayMonthYear(member.coveredUntil)}", fontSize = 12.sp, color = Color.Gray)
        }
        Text(
            member.status.label,
            fontSize = 11.5.sp,
            fontWeight = FontWeight.Medium,
            color = member.status.color(),
            modifier = Modifier
                .glowBadge(member.status.color())
                .background(member.status.softColor(), RoundedCornerShape(50))
                .padding(horizontal = 9.dp, vertical = 4.dp),
        )
    }
}

@Composable
fun ErrorBanner(message: String, onRetry: (() -> Unit)? = null) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(QuotaBrick.copy(alpha = 0.12f), RoundedCornerShape(RadiusInput))
            .border(1.dp, QuotaBrick.copy(alpha = 0.3f), RoundedCornerShape(RadiusInput))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text("Impossibile aggiornare i dati", color = QuotaBrick, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            Text(message, color = Color.White.copy(alpha = 0.56f), fontSize = 12.sp, modifier = Modifier.padding(top = 2.dp))
        }
        if (onRetry != null) {
            Text(
                "Riprova",
                fontSize = 12.5.sp,
                fontWeight = FontWeight.Medium,
                color = Color.White,
                modifier = Modifier
                    .clickable(onClick = onRetry)
                    .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(50))
                    .padding(horizontal = 12.dp, vertical = 8.dp),
            )
        }
    }
}

@Composable
private fun EmptyMembersState(onAdd: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard()
            .padding(vertical = 40.dp, horizontal = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            modifier = Modifier.size(52.dp).background(Color.White.copy(alpha = 0.06f), RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center,
        ) {
            androidx.compose.material3.Icon(
                androidx.compose.material.icons.Icons.Rounded.Inbox,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.35f),
                modifier = Modifier.size(24.dp),
            )
        }
        Spacer(Modifier.height(14.dp))
        Text("Nessun membro ancora", fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
        Text(
            "Aggiungi le persone che condividono l'abbonamento per iniziare a tracciare i pagamenti.",
            fontSize = 12.5.sp,
            color = Color.White.copy(alpha = 0.56f),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            modifier = Modifier.padding(top = 6.dp, start = 12.dp, end = 12.dp),
        )
        Spacer(Modifier.height(16.dp))
        Button(
            onClick = onAdd,
            shape = RoundedCornerShape(50),
            colors = ButtonDefaults.buttonColors(containerColor = QuotaAccent),
        ) {
            Text("+  Aggiungi il primo membro")
        }
    }
}

@Composable
private fun rememberCoroutineScopeCompat() = androidx.compose.runtime.rememberCoroutineScope()
