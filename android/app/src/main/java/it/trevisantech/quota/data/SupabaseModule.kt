package it.trevisantech.quota.data

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest

object SupabaseModule {
    val client: SupabaseClient by lazy {
        createSupabaseClient(
            supabaseUrl = Config.SUPABASE_URL,
            supabaseKey = Config.SUPABASE_ANON_KEY,
        ) {
            install(Auth) {
                scheme = "quota"
                host = "login-callback"
            }
            install(Postgrest)
        }
    }
}
