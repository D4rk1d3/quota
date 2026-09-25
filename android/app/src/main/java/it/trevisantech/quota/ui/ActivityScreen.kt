package it.trevisantech.quota.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.EuroSymbol
import androidx.compose.material.icons.rounded.MusicNote
import androidx.compose.material.icons.rounded.Notifications
import androidx.compose.material.icons.rounded.PersonAdd
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
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

@Composable
fun ActivityScreen(repository: QuotaRepository) {
    var items by remember { mutableStateOf<List<ActivityItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        isLoading = true
        try {
            items = repository.getActivity(40)
        } catch (e: Exception) {
            error = "Impossibile caricare l'attività."
        }
        isLoading = false
    }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 110.dp),
        ) {
            item { if (error != null) ErrorBanner(error!!) }
            if (items.isEmpty() && !isLoading) {
                item { Text("Nessuna attività recente.", fontSize = 13.sp, color = Color.Gray) }
            }
            items(items) { item ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .glassCard(shape = RoundedCornerShape(GlassCornerSmall))
                        .padding(12.dp),
                    verticalAlignment = Alignment.Top,
                ) {
                    Icon(iconFor(item.type), contentDescription = null, tint = colorFor(item.type), modifier = Modifier.size(18.dp))
                    Column(modifier = Modifier.weight(1f).padding(start = 10.dp)) {
                        Text(item.description, fontSize = 13.sp)
                        Text(IsoDate.formatDayMonthYear(item.date), fontSize = 11.5.sp, color = Color.Gray)
                    }
                    item.amountCents?.let {
                        Text(Money.euroString(it), fontSize = 12.5.sp, fontWeight = FontWeight.Medium)
                    }
                }
            }
        }
        if (isLoading) CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
    }
}

private fun iconFor(type: ActivityType) = when (type) {
    ActivityType.PAYMENT -> Icons.Rounded.EuroSymbol
    ActivityType.REMINDER -> Icons.Rounded.Notifications
    ActivityType.MEMBER_ADDED -> Icons.Rounded.PersonAdd
    ActivityType.CHARGE -> Icons.Rounded.MusicNote
}

private fun colorFor(type: ActivityType): Color = when (type) {
    ActivityType.PAYMENT -> QuotaAccent
    ActivityType.REMINDER -> QuotaAmber
    ActivityType.MEMBER_ADDED -> QuotaAccent
    ActivityType.CHARGE -> Color.Gray
}
