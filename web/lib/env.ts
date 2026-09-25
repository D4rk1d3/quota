import { z } from "zod";

// Variabili pubbliche (esposte al browser, mai segreti): solo URL e anon key.
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// Variabili solo server per il checkout LemonSqueezy (createCheckoutSession,
// lib/actions/billing.ts). Tutte opzionali: finche' non sono configurate il
// checkout mostra un messaggio invece di rompersi (l'account LemonSqueezy e'
// un passo che spetta all'utente, non all'app).
const serverEnvSchema = z.object({
  LEMONSQUEEZY_API_KEY: z.string().min(1).optional(),
  LEMONSQUEEZY_STORE_ID: z.string().min(1).optional(),
  LEMONSQUEEZY_VARIANT_ID: z.string().min(1).optional(),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY,
    LEMONSQUEEZY_STORE_ID: process.env.LEMONSQUEEZY_STORE_ID,
    LEMONSQUEEZY_VARIANT_ID: process.env.LEMONSQUEEZY_VARIANT_ID,
  });
}
