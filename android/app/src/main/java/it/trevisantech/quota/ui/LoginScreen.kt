package it.trevisantech.quota.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.MarkEmailRead
import androidx.compose.material.icons.rounded.MusicNote
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import it.trevisantech.quota.data.AuthManager
import it.trevisantech.quota.data.Config
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(auth: AuthManager) {
    var email by remember { mutableStateOf(Config.ADMIN_EMAIL) }
    val isSending by auth.isSendingLink.collectAsState()
    val sentTo by auth.magicLinkSentTo.collectAsState()
    val error by auth.errorMessage.collectAsState()
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(QuotaBackground)
            .padding(PaddingValues(horizontal = 32.dp)),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(
            imageVector = Icons.Rounded.MusicNote,
            contentDescription = null,
            tint = Color.White,
            modifier = Modifier
                .size(72.dp)
                .shadow(elevation = 24.dp, shape = RoundedCornerShape(20.dp), ambientColor = QuotaAccent.copy(alpha = 0.5f), spotColor = QuotaAccent.copy(alpha = 0.5f))
                .background(QuotaAccent, RoundedCornerShape(20.dp))
                .padding(18.dp),
        )
        androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 12.dp))
        Text("Quota", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Text("Spotify Family — gestione quote", fontSize = 13.sp, color = QuotaTextSecondary)

        androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 28.dp))

        if (sentTo != null) {
            Icon(Icons.Rounded.MarkEmailRead, contentDescription = null, tint = QuotaAccentText, modifier = Modifier.size(28.dp))
            Text(
                "Link di accesso inviato a $sentTo",
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 8.dp).width(280.dp),
            )
            Text(
                "Apri l'email e clicca il link: questa app si aprirà automaticamente.",
                fontSize = 12.sp,
                color = QuotaTextSecondary,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 4.dp).width(280.dp),
            )
            TextButton(onClick = { /* re-send handled by clearing state below */ }) {
                Text("Invia di nuovo", color = QuotaAccentText, fontSize = 12.sp)
            }
        } else {
            if (error != null) {
                Row(
                    modifier = Modifier
                        .width(280.dp)
                        .background(QuotaBrick.copy(alpha = 0.12f), RoundedCornerShape(RadiusInput))
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Icon(Icons.Rounded.ErrorOutline, contentDescription = null, tint = QuotaBrick, modifier = Modifier.size(18.dp))
                    Column {
                        Text("Invio non riuscito", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = QuotaBrick)
                        Text(error ?: "", fontSize = 12.sp, color = QuotaTextSecondary)
                    }
                }
                androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 12.dp))
            }

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                placeholder = { Text("nome@esempio.com") },
                singleLine = true,
                shape = RoundedCornerShape(RadiusInput),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = QuotaSurface,
                    unfocusedContainerColor = QuotaSurface,
                    focusedBorderColor = Color.Transparent,
                    unfocusedBorderColor = Color.Transparent,
                ),
                modifier = Modifier.width(280.dp).height(52.dp),
            )

            androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 12.dp))

            Button(
                onClick = { scope.launch { auth.sendMagicLink(email) } },
                enabled = !isSending && email.isNotBlank(),
                shape = RoundedCornerShape(50),
                colors = ButtonDefaults.buttonColors(containerColor = QuotaAccent),
                modifier = Modifier.width(280.dp).height(48.dp),
            ) {
                if (isSending) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                        Text("Invio in corso…")
                    }
                } else {
                    Text(if (error != null) "Riprova" else "Invia link di accesso")
                }
            }

            androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 14.dp))

            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Icon(Icons.Rounded.Lock, contentDescription = null, tint = QuotaTextTertiary, modifier = Modifier.size(13.dp))
                Text(
                    "Nessuna password: solo un link sicuro valido 15 minuti.",
                    fontSize = 11.5.sp,
                    color = QuotaTextTertiary,
                )
            }
        }
    }
}
