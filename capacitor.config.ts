import type { CapacitorConfig } from "@capacitor/cli";

// L'app Android non impacchetta una build statica: la WebView nativa carica
// direttamente il deployment Vercel di produzione (server actions, sessione
// Supabase via cookie, RSC non sono compatibili con un export statico).
// Il valore nativo aggiunto dal wrapper e' Capacitor stesso: push
// notifications reali (FCM), icona/splash nativi, distribuzione Play Store.
const config: CapacitorConfig = {
  appId: "com.quota.app",
  appName: "Quota",
  webDir: "public",
  server: {
    url: "https://quota-nu-six.vercel.app",
    androidScheme: "https",
    cleartext: false,
  },
};

export default config;
