import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client. Keys come from .env.local (see SETUP.md / .env.local.example):
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 *
 * If the keys aren't set, `supabase` is null and the app runs in local-only mode
 * (browser localStorage) so it still works before the backend is wired up.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Safety guard: the secret/service_role key (`sb_secret_…`) must NEVER run in a
// browser — it bypasses row-level security. If someone pastes it into
// VITE_SUPABASE_ANON_KEY by mistake, refuse it and stay in local-only mode.
const isSecretKey = Boolean(anon && anon.startsWith('sb_secret_'));

export const hasSupabase = Boolean(url && anon && !isSecretKey);

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url as string, anon as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

if (isSecretKey) {
  console.error('[buzzget] VITE_SUPABASE_ANON_KEY is a SECRET key (sb_secret_…). The secret key must never be used in the browser. Use your PUBLISHABLE/anon key (sb_publishable_… or a long eyJ… JWT) instead. Staying in local-only mode until fixed.');
} else if (!hasSupabase) {
  console.info('[buzzget] Supabase not configured — running in local-only mode. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to enable cloud accounts.');
}
