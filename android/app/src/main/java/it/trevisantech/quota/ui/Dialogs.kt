package it.trevisantech.quota.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import it.trevisantech.quota.data.IsoDate
import it.trevisantech.quota.data.Money
import it.trevisantech.quota.data.QuotaException
import it.trevisantech.quota.data.QuotaRepository
import it.trevisantech.quota.model.Member
import it.trevisantech.quota.model.Payment
import it.trevisantech.quota.model.PaymentMethod
import kotlinx.coroutines.launch

/** Selettore a tendina minimale: un campo di sola lettura + DropdownMenu. */
@Composable
private fun <T> SimpleDropdown(label: String, selectedLabel: String, items: List<T>, itemLabel: (T) -> String, onSelect: (T) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        OutlinedTextField(
            value = selectedLabel,
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            modifier = Modifier.fillMaxWidth().clickable { expanded = true },
            enabled = false,
        )
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            items.forEach { item ->
                DropdownMenuItem(text = { Text(itemLabel(item)) }, onClick = { onSelect(item); expanded = false })
            }
        }
    }
}

@Composable
fun RegisterPaymentDialog(
    repository: QuotaRepository,
    members: List<Member>,
    preselectedMemberId: String?,
    onDismiss: () -> Unit,
    onSaved: () -> Unit,
) {
    var selectedMember by remember {
        mutableStateOf(members.firstOrNull { it.id == preselectedMemberId } ?: members.firstOrNull())
    }
    var amountText by remember(selectedMember) {
        mutableStateOf(selectedMember?.let { "%.2f".format(it.monthlyShareCents / 100.0) } ?: "")
    }
    var method by remember { mutableStateOf(PaymentMethod.BONIFICO) }
    var note by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Registra pagamento") },
        text = {
            Column {
                SimpleDropdown(
                    label = "Membro",
                    selectedLabel = selectedMember?.name ?: "",
                    items = members,
                    itemLabel = { it.name },
                    onSelect = { selectedMember = it },
                )

                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it },
                    label = { Text("Importo (€)") },
                    modifier = Modifier.fillMaxWidth().padding(top = 10.dp),
                )

                Box(modifier = Modifier.padding(top = 10.dp)) {
                    SimpleDropdown(
                        label = "Metodo",
                        selectedLabel = method.label,
                        items = PaymentMethod.entries,
                        itemLabel = { it.label },
                        onSelect = { method = it },
                    )
                }

                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    label = { Text("Nota (opzionale)") },
                    modifier = Modifier.fillMaxWidth().padding(top = 10.dp),
                )

                if (error != null) {
                    Text(error ?: "", color = QuotaBrick, modifier = Modifier.padding(top = 8.dp))
                }
            }
        },
        confirmButton = {
            Button(
                enabled = !isSaving && selectedMember != null && amountText.replace(",", ".").toDoubleOrNull() != null,
                colors = ButtonDefaults.buttonColors(containerColor = QuotaAccent),
                onClick = {
                    val member = selectedMember ?: return@Button
                    val amount = amountText.replace(",", ".").toDoubleOrNull() ?: return@Button
                    isSaving = true
                    scope.launch {
                        try {
                            repository.recordPayment(
                                memberId = member.id,
                                amountCents = Money.euroToCents(amount),
                                method = method,
                                paidAt = IsoDate.todayInRome(),
                                note = note.ifBlank { null },
                            )
                            onSaved()
                        } catch (e: QuotaException) {
                            error = e.message
                        } catch (e: Exception) {
                            error = "Impossibile registrare il pagamento."
                        }
                        isSaving = false
                    }
                },
            ) { Text("Registra") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Annulla") } },
    )
}

@Composable
fun VoidPaymentDialog(repository: QuotaRepository, payment: Payment, onDismiss: () -> Unit, onSaved: () -> Unit) {
    var note by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Annulla pagamento") },
        text = {
            Column {
                Text(
                    "Il pagamento da ${Money.euroString(payment.amountCents)} non viene eliminato: resta nello storico come annullato, e la copertura viene ricalcolata di conseguenza.",
                )
                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    label = { Text("Motivo") },
                    modifier = Modifier.fillMaxWidth().padding(top = 10.dp),
                )
                if (error != null) {
                    Text(error ?: "", color = QuotaBrick, modifier = Modifier.padding(top = 8.dp))
                }
            }
        },
        confirmButton = {
            Button(
                enabled = !isSaving && note.trim().length >= 3,
                colors = ButtonDefaults.buttonColors(containerColor = QuotaBrick),
                onClick = {
                    isSaving = true
                    scope.launch {
                        try {
                            repository.voidPayment(payment.id, note.trim())
                            onSaved()
                        } catch (e: QuotaException) {
                            error = e.message
                        } catch (e: Exception) {
                            error = "Impossibile annullare il pagamento."
                        }
                        isSaving = false
                    }
                },
            ) { Text("Annulla pagamento") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Chiudi") } },
    )
}

@Composable
fun MemberFormDialog(repository: QuotaRepository, existing: Member?, onDismiss: () -> Unit, onSaved: () -> Unit) {
    val palette = listOf("#5B8F6F", "#5A8FBF", "#8E7CC3", "#C97B96", "#D99457", "#5FAFA8")
    var name by remember { mutableStateOf(existing?.name ?: "") }
    var email by remember { mutableStateOf(existing?.email ?: "") }
    var color by remember { mutableStateOf(existing?.color ?: palette.random()) }
    var shareText by remember { mutableStateOf(existing?.let { "%.2f".format(it.monthlyShareCents / 100.0) } ?: "3,50") }
    var notes by remember { mutableStateOf(existing?.notes ?: "") }
    var isSaving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (existing == null) "Nuovo membro" else "Modifica membro") },
        text = {
            Column {
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nome") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email (opzionale)") }, modifier = Modifier.fillMaxWidth().padding(top = 10.dp))
                OutlinedTextField(value = shareText, onValueChange = { shareText = it }, label = { Text("Quota mensile (€)") }, modifier = Modifier.fillMaxWidth().padding(top = 10.dp))

                Row(modifier = Modifier.padding(top = 10.dp)) {
                    palette.forEach { hex ->
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .padding(3.dp)
                                .clip(CircleShape)
                                .background(colorFromHex(hex))
                                .then(if (color == hex) Modifier.border(2.dp, Color.White, CircleShape) else Modifier)
                                .clickable { color = hex },
                        )
                    }
                }

                OutlinedTextField(value = notes, onValueChange = { notes = it }, label = { Text("Note (opzionale)") }, modifier = Modifier.fillMaxWidth().padding(top = 10.dp))

                if (error != null) {
                    Text(error ?: "", color = QuotaBrick, modifier = Modifier.padding(top = 8.dp))
                }
            }
        },
        confirmButton = {
            Button(
                enabled = !isSaving && name.trim().length >= 2,
                colors = ButtonDefaults.buttonColors(containerColor = QuotaAccent),
                onClick = {
                    isSaving = true
                    val shareCents = shareText.replace(",", ".").toDoubleOrNull()?.let { Money.euroToCents(it) }
                    scope.launch {
                        try {
                            if (existing != null) {
                                repository.updateMember(
                                    id = existing.id,
                                    name = name.trim(),
                                    email = email.trim().ifBlank { null },
                                    color = color,
                                    monthlyShareCents = shareCents,
                                    notes = notes.trim().ifBlank { null },
                                )
                            } else {
                                repository.createMember(
                                    name = name.trim(),
                                    email = email.trim().ifBlank { null },
                                    color = color,
                                    monthlyShareCents = shareCents,
                                    notes = notes.trim().ifBlank { null },
                                )
                            }
                            onSaved()
                        } catch (e: QuotaException) {
                            error = e.message
                        } catch (e: Exception) {
                            error = "Operazione non riuscita."
                        }
                        isSaving = false
                    }
                },
            ) { Text(if (existing == null) "Aggiungi" else "Salva") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Annulla") } },
    )
}
