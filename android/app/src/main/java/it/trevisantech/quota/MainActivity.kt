package it.trevisantech.quota

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import it.trevisantech.quota.data.AuthManager
import it.trevisantech.quota.data.QuotaRepository
import it.trevisantech.quota.data.SupabaseModule
import it.trevisantech.quota.ui.QuotaTheme
import it.trevisantech.quota.ui.RootScreen

class MainActivity : ComponentActivity() {
    private val auth by lazy { AuthManager(SupabaseModule.client) }
    private val repository by lazy { QuotaRepository(SupabaseModule.client) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        auth.handleIntent(intent)

        setContent {
            LaunchedEffect(Unit) { auth.watchSession() }

            QuotaTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    RootScreen(auth = auth, repository = repository)
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        auth.handleIntent(intent)
    }
}
