package it.trevisantech.quota.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.ui.draw.shadow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ChevronLeft
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import it.trevisantech.quota.data.IsoDate
import it.trevisantech.quota.data.Money
import it.trevisantech.quota.data.QuotaRepository
import it.trevisantech.quota.model.ActivityItem
import it.trevisantech.quota.model.ActivityType
import it.trevisantech.quota.model.Member
import it.trevisantech.quota.model.Payment
import it.trevisantech.quota.model.SpotifyPlan
import java.time.LocalDate
import java.time.YearMonth

private enum class EventKind { CHARGE, PAYMENT, REMINDER }
private data class CalEvent(val kind: EventKind, val label: String, val detail: String)

private fun EventKind.color(): Color = when (this) {
    EventKind.CHARGE -> Color.Gray
    EventKind.PAYMENT -> QuotaAccent
    EventKind.REMINDER -> QuotaAmber
}

@Composable
private fun legendItem(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(6.dp).background(color, CircleShape))
        Spacer(Modifier.padding(start = 6.dp))
        Text(label, fontSize = 12.sp, color = QuotaTextSecondary)
    }
}

private val MONTH_LABELS = listOf(
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
)
private val WEEKDAY_LABELS = listOf("Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom")

@Composable
fun CalendarScreen(repository: QuotaRepository) {
    var yearMonth by remember { mutableStateOf(YearMonth.now()) }
    var plan by remember { mutableStateOf<SpotifyPlan?>(null) }
    var payments by remember { mutableStateOf<List<Payment>>(emptyList()) }
    var activity by remember { mutableStateOf<List<ActivityItem>>(emptyList()) }
    var members by remember { mutableStateOf<List<Member>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var selectedDay by remember { mutableStateOf<Int?>(null) }

    LaunchedEffect(yearMonth) {
        isLoading = true
        try {
            plan = repository.getSubscriptionPlan()
            payments = repository.getAllPayments()
            activity = repository.getActivity(200)
            members = repository.getMembersWithCoverage().members
        } catch (_: Exception) {
        }
        isLoading = false
    }

    val nameById = remember(members) { members.associate { it.id to it.name } }

    val eventsByDay = remember(plan, payments, activity, yearMonth, nameById) {
        val map = mutableMapOf<Int, MutableList<CalEvent>>()
        fun push(day: Int, ev: CalEvent) { map.getOrPut(day) { mutableListOf() }.add(ev) }

        plan?.let { p ->
            push(p.billingDay, CalEvent(EventKind.CHARGE, "Spotify · ${Money.euroString(p.monthlyCostCents)}", "Addebito ricorrente del piano Family"))
        }
        for (p in payments) {
            val parts = IsoDate.parts(p.date)
            if (parts.y == yearMonth.year && parts.m == yearMonth.monthValue) {
                val name = nameById[p.memberId] ?: "Membro"
                push(parts.d, CalEvent(EventKind.PAYMENT, "$name ha pagato", "${Money.euroString(p.amountCents)} · $name"))
            }
        }
        for (a in activity.filter { it.type == ActivityType.REMINDER }) {
            val parts = IsoDate.parts(a.date)
            if (parts.y == yearMonth.year && parts.m == yearMonth.monthValue) {
                push(parts.d, CalEvent(EventKind.REMINDER, "Promemoria inviato", a.description))
            }
        }
        map
    }

    val today = LocalDate.now()
    val isCurrentMonth = today.year == yearMonth.year && today.monthValue == yearMonth.monthValue

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("${MONTH_LABELS[yearMonth.monthValue - 1]} ${yearMonth.year}", fontSize = 24.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .background(Color.White.copy(alpha = 0.06f), CircleShape)
                        .clickable { yearMonth = yearMonth.minusMonths(1) },
                    contentAlignment = Alignment.Center,
                ) { Icon(Icons.Rounded.ChevronLeft, contentDescription = "Mese precedente", modifier = Modifier.size(16.dp)) }
                Spacer(Modifier.width(10.dp))
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .background(Color.White.copy(alpha = 0.06f), CircleShape)
                        .clickable { yearMonth = yearMonth.plusMonths(1) },
                    contentAlignment = Alignment.Center,
                ) { Icon(Icons.Rounded.ChevronRight, contentDescription = "Mese successivo", modifier = Modifier.size(16.dp)) }
            }

            Row(modifier = Modifier.fillMaxWidth().padding(top = 16.dp)) {
                WEEKDAY_LABELS.forEach { d ->
                    Text(d.uppercase(), fontSize = 11.sp, color = QuotaLabelSecondary, modifier = Modifier.weight(1f), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                }
            }

            val firstDay = yearMonth.atDay(1)
            val leading = (firstDay.dayOfWeek.value - 1) // Monday=1 -> 0 leading blanks
            val daysInMonth = yearMonth.lengthOfMonth()
            val cells: List<Int?> = List(leading) { null } + (1..daysInMonth).toList()

            LazyVerticalGrid(columns = GridCells.Fixed(7), modifier = Modifier.fillMaxWidth().padding(top = 4.dp)) {
                items(cells) { day ->
                    Box(
                        modifier = Modifier
                            .aspectRatio(0.85f)
                            .padding(2.dp)
                            .then(if (day != null) Modifier.clickable { selectedDay = day } else Modifier),
                        contentAlignment = Alignment.Center,
                    ) {
                        if (day != null) {
                            val isToday = isCurrentMonth && day == today.dayOfMonth
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    "$day",
                                    fontSize = 12.5.sp,
                                    fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal,
                                    color = Color.White,
                                    modifier = Modifier
                                        .size(24.dp)
                                        .background(if (isToday) QuotaAccent else Color.Transparent, CircleShape)
                                        .wrapContentHeight(Alignment.CenterVertically),
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                                )
                                Row(horizontalArrangement = Arrangement.spacedBy(2.dp), modifier = Modifier.padding(top = 2.dp)) {
                                    eventsByDay[day]?.map { it.kind }?.distinct()?.forEach { kind ->
                                        Box(modifier = Modifier.size(4.dp).background(kind.color(), CircleShape))
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.padding(top = 16.dp)) {
                legendItem(EventKind.CHARGE.color(), "Addebito Spotify")
                legendItem(EventKind.PAYMENT.color(), "Pagamento ricevuto")
                legendItem(EventKind.REMINDER.color(), "Promemoria inviato")
            }
        }

        if (isLoading) CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))

        androidx.compose.animation.AnimatedVisibility(
            visible = selectedDay != null,
            enter = androidx.compose.animation.fadeIn(androidx.compose.animation.core.tween(120)),
            exit = androidx.compose.animation.fadeOut(androidx.compose.animation.core.tween(120)),
        ) {
            val day = selectedDay ?: return@AnimatedVisibility
            Box(
                modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.45f)).clickable { selectedDay = null },
                contentAlignment = Alignment.Center,
            ) {
                Column(
                    modifier = Modifier
                        .animateEnterExit(
                            enter = androidx.compose.animation.fadeIn(androidx.compose.animation.core.tween(120)) +
                                androidx.compose.animation.scaleIn(initialScale = 0.94f, animationSpec = androidx.compose.animation.core.tween(120)),
                            exit = androidx.compose.animation.fadeOut(androidx.compose.animation.core.tween(90)) +
                                androidx.compose.animation.scaleOut(targetScale = 0.96f, animationSpec = androidx.compose.animation.core.tween(90)),
                        )
                        .widthIn(max = 300.dp)
                        .padding(horizontal = 28.dp)
                        .glassSurface(shape = RoundedCornerShape(GlassCornerMedium), elevation = 24.dp, opacity = 0.97f)
                        .clickable(enabled = false) {}
                        .padding(18.dp),
                ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                "$day ${MONTH_LABELS[yearMonth.monthValue - 1]} ${yearMonth.year}",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.weight(1f),
                            )
                            IconButton(onClick = { selectedDay = null }, modifier = Modifier.size(28.dp)) {
                                Icon(Icons.Rounded.Close, contentDescription = "Chiudi", tint = Color.Gray, modifier = Modifier.size(18.dp))
                            }
                        }
                        val events = eventsByDay[day].orEmpty()
                        if (events.isEmpty()) {
                            Text("Nessun evento.", fontSize = 12.5.sp, color = Color.Gray, modifier = Modifier.padding(top = 4.dp))
                        } else {
                            events.forEachIndexed { index, ev ->
                                Column(modifier = Modifier.padding(top = if (index == 0) 10.dp else 12.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(modifier = Modifier.size(6.dp).background(ev.kind.color(), CircleShape))
                                        Spacer(Modifier.padding(start = 8.dp))
                                        Text(ev.label, fontSize = 12.5.sp, fontWeight = FontWeight.Medium)
                                    }
                                    Text(ev.detail, fontSize = 11.5.sp, color = Color.Gray, modifier = Modifier.padding(top = 1.dp, start = 14.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
