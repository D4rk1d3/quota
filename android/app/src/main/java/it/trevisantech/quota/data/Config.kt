package it.trevisantech.quota.data

/**
 * Config del progetto Supabase "quota". La anon key è pubblica per design
 * (protetta da RLS lato server) — stesso schema di NEXT_PUBLIC_SUPABASE_ANON_KEY
 * nella web app e di Config.swift nell'app macOS.
 */
object Config {
    const val SUPABASE_URL = "https://npkcgyebqszcrrsqawnc.supabase.co"
    const val SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wa2NneWVicXN6Y3Jyc3Fhd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NjI2NDgsImV4cCI6MjEwNDUzODY0OH0.jukU9QvmVshAdDZ4whdszRKdSiKrHhrYPhWXwvf0tx8"
    const val ADMIN_EMAIL = "trevisanpietro12@gmail.com"

    /** Deve essere in Supabase → Authentication → URL Configuration → Redirect URLs. */
    const val AUTH_REDIRECT_URL = "quota://login-callback"
}
