package it.trevisantech.quota.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AccountBalanceWallet
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Notifications
import androidx.compose.material.icons.rounded.NotificationsActive
import androidx.compose.material.icons.rounded.PersonOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import it.trevisantech.quota.data.Money
import it.trevisantech.quota.data.QuotaException
import it.trevisantech.quota.data.QuotaRepository
import it.trevisantech.quota.model.FundState
import it.trevisantech.quota.model.SpotifyPlan
import kotlinx.coroutines.launch

private data class NotificationRule(val icon: androidx.compose.ui.graphics.vector.ImageVector, val title: String, val description: String)

private val notificationRules = listOf(
    NotificationRule(Icons.Rounded.CalendarMonth, "3 giorni prima dell'addebito", "Promemoria in-app + email il giorno prima della finestra di addebito Spotify."),
    NotificationRule(Icons.Rounded.NotificationsActive, "Il giorno dell'addebito", "Notifica il giorno 5 di ogni mese, quando Spotify addebita il piano Family."),
    NotificationRule(Icons.Rounded.PersonOff, "Membro non coperto", "Avviso quando un membro non copre ancora il ciclo che sta per iniziare."),
    NotificationRule(Icons.Rounded.AccountBalanceWallet, "Copertura in scadenza", "Avviso quando la copertura di un membro termina entro 7 giorni."),
)

@Composable
fun SettingsScreen(repository: QuotaRepository) {
    var plan by remember { mutableStateOf<SpotifyPlan?>(null) }
    var fund by remember { mutableStateOf<FundState?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    var costText by remember { mutableStateOf("") }
    var billingDayText by remember { mutableStateOf("5") }
    var shareText by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }
    var saveError by remember { mutableStateOf<String?>(null) }
    var savedFlash by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScopeCompat()

    suspend fun load() {
        isLoading = true
        error = null
        try {
            val p = repository.getSubscriptionPlan()
            val f = repository.getFundState()
            plan = p
            fund = f
            costText = "%.2f".format(p.monthlyCostCents / 100.0).replace(".", ",")
            billingDayText = p.billingDay.toString()
            shareText = "%.2f".format(p.perMemberShareCents / 100.0).replace(".", ",")
        } catch (e: Exception) {
            error = "Impossibile caricare le impostazioni."
        }
        isLoading = false
    }

    LaunchedEffect(Unit) { load() }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 110.dp),
        ) {
            item { if (error != null) ErrorBanner(error!!) }

            item {
                Column(
                    modifier = Modifier.fillMaxWidth().glassCard().padding(18.dp),
                ) {
                    Text("Piano Spotify Family", fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    Text("Dati del piano condiviso.", fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(top = 2.dp))

                    plan?.let { p ->
                        Text("Piano", fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(top = 14.dp))
                        Text(
                            p.planName,
                            fontSize = 13.sp,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 4.dp)
                                .background(Color.White.copy(alpha = 0.06f), RoundedCornerShape(8.dp))
                                .padding(12.dp),
                        )

                        Row(modifier = Modifier.padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedTextField(
                                value = costText,
                                onValueChange = { costText = it },
                                label = { Text("Costo mensile (€)") },
                                modifier = Modifier.weight(1f),
                            )
                            OutlinedTextField(
                                value = billingDayText,
                                onValueChange = { billingDayText = it.filter { c -> c.isDigit() } },
                                label = { Text("Giorno addebito") },
                                modifier = Modifier.weight(1f),
                            )
                        }

                        OutlinedTextField(
                            value = shareText,
                            onValueChange = { shareText = it },
                            label = { Text("Quota per membro (€)") },
                            modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                        )

                        if (saveError != null) {
                            Text(saveError ?: "", fontSize = 12.sp, color = QuotaBrick, modifier = Modifier.padding(top = 8.dp))
                        }

                        Row(modifier = Modifier.fillMaxWidth().padding(top = 12.dp), horizontalArrangement = Arrangement.End, verticalAlignment = Alignment.CenterVertically) {
                            if (savedFlash) {
                                Text("Salvate", fontSize = 12.sp, color = QuotaAccent, modifier = Modifier.padding(end = 10.dp))
                            }
                            Button(
                                enabled = !isSaving,
                                colors = ButtonDefaults.buttonColors(containerColor = QuotaAccent),
                                onClick = {
                                    val costValue = costText.replace(",", ".").toDoubleOrNull()
                                    val shareValue = shareText.replace(",", ".").toDoubleOrNull()
                                    val day = billingDayText.toIntOrNull()
                                    if (costValue == null || shareValue == null || day == null || day !in 1..28) {
                                        saveError = "Controlla i valori inseriti."
                                        return@Button
                                    }
                                    isSaving = true
                                    saveError = null
                                    savedFlash = false
                                    scope.launch {
                                        try {
                                            repository.updateSubscription(
                                                monthlyCostCents = Money.euroToCents(costValue),
                                                billingDay = day,
                                                memberQuotaCents = Money.euroToCents(shareValue),
                                            )
                                            fund = repository.getFundState()
                                            savedFlash = true
                                        } catch (e: QuotaException) {
                                            saveError = e.message
                                        } catch (e: Exception) {
                                            saveError = "Impossibile salvare le impostazioni del piano."
                                        }
                                        isSaving = false
                                    }
                                },
                            ) { Text(if (isSaving) "Salvataggio…" else "Salva modifiche") }
                        }
                    }
                }
            }

            item {
                Column(
                    modifier = Modifier.fillMaxWidth().glassCard().padding(18.dp),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Rounded.Notifications, contentDescription = null, tint = QuotaAccentStrong, modifier = Modifier.size(18.dp))
                        Text("Notifiche automatiche", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(start = 6.dp))
                    }
                    Text(
                        "Il job giornaliero genera queste notifiche in-app e via email; non sono configurabili.",
                        fontSize = 12.sp,
                        color = Color.Gray,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                    notificationRules.forEach { rule ->
                        Row(modifier = Modifier.padding(top = 12.dp)) {
                            Icon(rule.icon, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(16.dp).padding(top = 2.dp))
                            Column(modifier = Modifier.padding(start = 10.dp)) {
                                Text(rule.title, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                Text(rule.description, fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(top = 1.dp))
                            }
                        }
                    }
                }
            }

            item {
                Column(
                    modifier = Modifier.fillMaxWidth().glassCard().padding(18.dp),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Rounded.AccountBalanceWallet, contentDescription = null, tint = QuotaAccentStrong, modifier = Modifier.size(18.dp))
                        Text("Fondo Spotify", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(start = 6.dp))
                    }
                    Text(
                        "Il saldo accantonato dagli arrotondamenti delle quote.",
                        fontSize = 12.sp,
                        color = Color.Gray,
                        modifier = Modifier.padding(top = 4.dp),
                    )

                    val f = fund
                    val p = plan
                    if (f != null && p != null) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 12.dp)
                                .background(Color.White.copy(alpha = 0.06f), RoundedCornerShape(10.dp))
                                .padding(14.dp),
                        ) {
                            Text("Saldo attuale", fontSize = 12.sp, color = Color.Gray)
                            Text(Money.euroString(f.balanceCents), fontSize = 22.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 2.dp))
                        }

                        val shareValue = shareText.replace(",", ".").toDoubleOrNull() ?: (p.perMemberShareCents / 100.0)
                        val costValue = costText.replace(",", ".").toDoubleOrNull() ?: (p.monthlyCostCents / 100.0)
                        val shareCents = Money.euroToCents(shareValue)
                        val costCents = Money.euroToCents(costValue)
                        val totalCollected = shareCents * f.totalMembers
                        val surplus = maxOf(totalCollected - costCents, 0)

                        Text(
                            "${f.totalMembers} membri × ${Money.euroString(shareCents)} = ${Money.euroString(totalCollected)} raccolti ogni ciclo, a fronte di un costo reale di ${Money.euroString(costCents)}. L'eccedenza di ${Money.euroString(surplus)} per ciclo si accumula nel fondo e copre eventuali arrotondamenti futuri.",
                            fontSize = 12.sp,
                            color = Color.Gray,
                            modifier = Modifier.padding(top = 10.dp),
                        )
                    }
                }
            }
        }
        if (isLoading) CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
    }
}

@Composable
private fun rememberCoroutineScopeCompat() = androidx.compose.runtime.rememberCoroutineScope()
