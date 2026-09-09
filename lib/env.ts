import { z } from "zod";

// Variabili pubbliche (esposte al browser, mai segreti): solo URL e anon key.
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// Variabili solo server. ADMIN_EMAIL e' l'unico indirizzo autorizzato ad
// amministrare l'app: usato come seconda verifica applicativa oltre a
// private.is_admin() lato database. SUPABASE_SERVICE_ROLE_KEY non e'
// utilizzata dall'app Next.js (nessun server action ne ha bisogno: girano
// tutte sotto la sessione dell'admin e la RLS); esiste solo per completezza
// di configurazione locale/CI, non viene mai importata in questo progetto
// Next.js.
const serverEnvSchema = z.object({
  ADMIN_EMAIL: z.string().email(),
  RESEND_API_KEY: z.string().min(1).optional(),
  NOTIFICATIONS_FROM_EMAIL: z.string().email().optional(),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NOTIFICATIONS_FROM_EMAIL: process.env.NOTIFICATIONS_FROM_EMAIL,
  });
}
