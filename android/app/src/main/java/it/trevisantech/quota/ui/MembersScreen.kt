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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.Undo
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.EuroSymbol
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import it.trevisantech.quota.data.IsoDate
import it.trevisantech.quota.data.Money
import it.trevisantech.quota.data.QuotaRepository
import it.trevisantech.quota.model.Member
import it.trevisantech.quota.model.Payment
import kotlinx.coroutines.launch

@Composable
fun MembersScreen(repository: QuotaRepository, preselectedMemberId: String?, onConsumedPreselection: () -> Unit) {
    var members by remember { mutableStateOf<List<Member>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var selectedId by remember { mutableStateOf<String?>(null) }
    var showNewMember by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    suspend fun load() {
        isLoading = true
        try {
            members = repository.getMembersWithCoverage().members
        } catch (e: Exception) {
            error = "Impossibile caricare i membri."
        }
        isLoading = false
    }

    LaunchedEffect(Unit) { load() }
    LaunchedEffect(preselectedMemberId) {
        if (preselectedMemberId != null) {
            selectedId = preselectedMemberId
            onConsumedPreselection()
        }
    }

    if (selectedId != null) {
        MemberDetailScreen(
            repository = repository,
            memberId = selectedId!!,
            onBack = { selectedId = null },
            onChanged = { scope.launch { load() } },
        )
        return
    }

    Scaffold(
        containerColor = Color.Transparent,
        // Senza questo, lo Scaffold annidato riapplica per conto suo l'inset
        // della status bar (già gestito dallo Scaffold esterno con la sua
        // topBar), raddoppiando lo spazio vuoto in alto.
        contentWindowInsets = androidx.compose.foundation.layout.WindowInsets(0, 0, 0, 0),
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showNewMember = true },
                containerColor = QuotaAccent,
                shape = CircleShape,
                modifier = Modifier.padding(bottom = 100.dp),
            ) {
                Icon(Icons.Rounded.Add, contentDescription = "Nuovo membro")
            }
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 100.dp),
            ) {
                item { if (error != null) ErrorBanner(error!!) }
                items(members) { member ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .glassCard(shape = RoundedCornerShape(GlassCornerMedium))
                            .clickable { selectedId = member.id }
                            .padding(13.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(modifier = Modifier.size(32.dp).background(colorFromHex(member.color), CircleShape), contentAlignment = Alignment.Center) {
                            Text(IsoDate.initials(member.name), fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        }
                        Spacer(Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(member.name, fontSize = 13.sp)
                            Text(member.status.label, fontSize = 11.sp, color = member.status.color())
                        }
                    }
                }
            }
            if (isLoading) CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
        }
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

@Composable
private fun MemberDetailScreen(repository: QuotaRepository, memberId: String, onBack: () -> Unit, onChanged: () -> Unit) {
    var member by remember { mutableStateOf<Member?>(null) }
    var payments by remember { mutableStateOf<List<Payment>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var showEdit by remember { mutableStateOf(false) }
    var showRegisterPayment by remember { mutableStateOf(false) }
    var voidTarget by remember { mutableStateOf<Payment?>(null) }
    val scope = rememberCoroutineScope()

    suspend fun load() {
        isLoading = true
        error = null
        try {
            val detail = repository.getMemberDetail(memberId)
            if (detail == null) {
                error = "Membro non trovato."
            } else {
                member = detail.member
                payments = detail.payments
            }
        } catch (e: Exception) {
            error = "Impossibile caricare il membro."
        }
        isLoading = false
    }

    LaunchedEffect(memberId) { load() }

    Scaffold(
        containerColor = Color.Transparent,
        contentWindowInsets = androidx.compose.foundation.layout.WindowInsets(0, 0, 0, 0),
        topBar = {
            Row(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Indietro") }
                Text("Membri", fontSize = 15.sp, color = QuotaTextSecondary)
            }
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            val m = member
            if (m != null) {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 100.dp),
                ) {
                    item { if (error != null) ErrorBanner(error!!) }
                    item {
                        Column(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Box(
                                modifier = Modifier.size(72.dp).background(colorFromHex(m.color), CircleShape),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(IsoDate.initials(m.name), fontSize = 22.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                            }
                            Spacer(Modifier.padding(top = 10.dp))
                            Text(m.name, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                            if (!m.email.isNullOrBlank()) {
                                Text(m.email, fontSize = 13.sp, color = QuotaTextSecondary, modifier = Modifier.padding(top = 2.dp))
                            }
                            Text(
                                m.status.label,
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Medium,
                                color = m.status.color(),
                                modifier = Modifier
                                    .padding(top = 8.dp)
                                    .background(m.status.softColor(), RoundedCornerShape(50))
                                    .padding(horizontal = 9.dp, vertical = 4.dp),
                            )

                            HorizontalDivider(modifier = Modifier.padding(vertical = 20.dp), color = QuotaSeparator)

                            Row(horizontalArrangement = Arrangement.spacedBy(48.dp)) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("QUOTA MENSILE", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 0.5.sp, color = QuotaLabelSecondary)
                                    Text(Money.euroString(m.monthlyShareCents), fontSize = 17.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 4.dp))
                                }
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("COPERTO FINO AL", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 0.5.sp, color = QuotaLabelSecondary)
                                    Text(IsoDate.formatDayMonthYear(m.coveredUntil), fontSize = 17.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 4.dp))
                                }
                            }

                            HorizontalDivider(modifier = Modifier.padding(vertical = 20.dp), color = QuotaSeparator)

                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                Text(
                                    "Modifica",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    modifier = Modifier
                                        .clickable { showEdit = true }
                                        .background(Color.White.copy(alpha = 0.08f), RoundedCornerShape(50))
                                        .padding(horizontal = 16.dp, vertical = 9.dp),
                                )
                                Text(
                                    "+  Registra pagamento",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color.White,
                                    modifier = Modifier
                                        .clickable { showRegisterPayment = true }
                                        .background(QuotaAccent, RoundedCornerShape(50))
                                        .padding(horizontal = 16.dp, vertical = 9.dp),
                                )
                            }
                        }
                    }
                    item {
                        Text(
                            "STORICO PAGAMENTI",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 0.5.sp,
                            color = QuotaLabelSecondary,
                        )
                    }
                    if (payments.isEmpty() && !isLoading) {
                        item { Text("Nessun pagamento registrato.", fontSize = 13.sp, color = QuotaTextSecondary) }
                    }
                    items(payments) { payment ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .glassCard(shape = RoundedCornerShape(GlassCornerSmall))
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Box(
                                modifier = Modifier.size(32.dp).background(QuotaAccent.copy(alpha = 0.16f), CircleShape),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(Icons.Rounded.EuroSymbol, contentDescription = null, tint = QuotaAccentText, modifier = Modifier.size(14.dp))
                            }
                            Spacer(Modifier.padding(start = 10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        Money.euroString(payment.amountCents),
                                        fontSize = 13.5.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = if (payment.voided) QuotaTextSecondary else Color.White,
                                        textDecoration = if (payment.voided) androidx.compose.ui.text.style.TextDecoration.LineThrough else null,
                                    )
                                    Text(" · ${payment.method.label}", fontSize = 12.5.sp, color = QuotaTextSecondary)
                                }
                                Text(
                                    if (payment.voided) "${IsoDate.formatDayMonthYear(payment.date)} · annullato"
                                    else "${IsoDate.formatDayMonthYear(payment.date)} · copre fino al ${IsoDate.formatDayMonthYear(payment.coversUntil)}",
                                    fontSize = 12.sp,
                                    color = QuotaTextSecondary,
                                )
                            }
                            if (payment.voided) {
                                Text(
                                    "Annullato",
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = QuotaBrick,
                                    modifier = Modifier.background(QuotaBrick.copy(alpha = 0.14f), RoundedCornerShape(50)).padding(horizontal = 8.dp, vertical = 4.dp),
                                )
                            } else {
                                IconButton(onClick = { voidTarget = payment }, modifier = Modifier.size(28.dp)) {
                                    Icon(Icons.AutoMirrored.Rounded.Undo, contentDescription = "Annulla", tint = QuotaTextSecondary, modifier = Modifier.size(14.dp))
                                }
                            }
                        }
                    }
                }
            }
            if (isLoading) CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
        }
    }

    if (showEdit && member != null) {
        MemberFormDialog(
            repository = repository,
            existing = member,
            onDismiss = { showEdit = false },
            onSaved = { showEdit = false; scope.launch { load(); onChanged() } },
        )
    }
    if (showRegisterPayment && member != null) {
        RegisterPaymentDialog(
            repository = repository,
            members = listOf(member!!),
            preselectedMemberId = member!!.id,
            onDismiss = { showRegisterPayment = false },
            onSaved = { showRegisterPayment = false; scope.launch { load(); onChanged() } },
        )
    }
    voidTarget?.let { payment ->
        VoidPaymentDialog(
            repository = repository,
            payment = payment,
            onDismiss = { voidTarget = null },
            onSaved = { voidTarget = null; scope.launch { load(); onChanged() } },
        )
    }
}
