package it.trevisantech.quota.data

import android.content.Intent
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.handleDeeplinks
import io.github.jan.supabase.auth.providers.builtin.OTP
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class AuthManager(private val client: SupabaseClient) {
    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()

    private val _isSendingLink = MutableStateFlow(false)
    val isSendingLink: StateFlow<Boolean> = _isSendingLink.asStateFlow()

    private val _magicLinkSentTo = MutableStateFlow<String?>(null)
    val magicLinkSentTo: StateFlow<String?> = _magicLinkSentTo.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    suspend fun watchSession() {
        client.auth.sessionStatus.collect { status ->
            _isAuthenticated.value = status is SessionStatus.Authenticated
        }
    }

    suspend fun sendMagicLink(rawEmail: String) {
        val email = rawEmail.trim().lowercase()
        _errorMessage.value = null

        if (!email.contains("@")) {
            _errorMessage.value = "Inserisci un indirizzo email valido"
            return
        }
        if (email != Config.ADMIN_EMAIL.lowercase()) {
            _errorMessage.value = "Questa è un'app privata: l'accesso è riservato all'amministratore."
            return
        }

        _isSendingLink.value = true
        try {
            client.auth.signInWith(OTP) { this.email = email }
            _magicLinkSentTo.value = email
        } catch (e: Exception) {
            _errorMessage.value = "Impossibile inviare il link. Riprova."
        } finally {
            _isSendingLink.value = false
        }
    }

    /** Chiamato da onCreate/onNewIntent quando Android apre quota://login-callback?... */
    fun handleIntent(intent: Intent) {
        try {
            client.handleDeeplinks(intent)
            _magicLinkSentTo.value = null
        } catch (e: Exception) {
            _magicLinkSentTo.value = null
            _errorMessage.value = "Accesso non riuscito. Richiedi un nuovo link."
        }
    }

    suspend fun signOut() {
        try {
            client.auth.signOut()
        } catch (_: Exception) {
        }
    }
}
