import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { publicEnv } from "@/lib/env";

/**
 * Client Supabase lato server con la sessione dell'utente corrente (dai
 * cookie). Usa SEMPRE la anon key: l'autorizzazione e' delegata alla RLS
 * (private.is_admin()), mai alla service_role. Da usare in Server
 * Component, Route Handler e Server Action.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Chiamato da un Server Component: le cookie verranno comunque
            // aggiornate dal middleware sulla richiesta successiva.
          }
        },
      },
    }
  );
}
