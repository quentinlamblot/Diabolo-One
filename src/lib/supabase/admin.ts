import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client "service role" — usage strictement côté serveur (jamais exposé au navigateur).
// Nécessite SUPABASE_SERVICE_ROLE_KEY dans les variables d'environnement du serveur.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
