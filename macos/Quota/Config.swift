import Foundation

enum Config {
    static let supabaseURL = URL(string: "https://nsxgzemqcsetxggmujdc.supabase.co")!
    // Chiave anon: pubblica per design, i dati sono protetti da RLS.
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeGd6ZW1xY3NldHhnZ211amRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NzU1ODMsImV4cCI6MjEwNTI1MTU4M30.1JUrX86ADh507C-_gLUCS0rPtuQTVKBOBy65DBE4q4s"
    static let authRedirect = URL(string: "app.quota.mac://login-callback")!
}
