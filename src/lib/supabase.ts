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

export const hasSupabase = Boolean(url && anon);

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url as string, anon as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

if (!hasSupabase) {
  console.info('[buzzget] Supabase not configured — running in local-only mode. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to enable cloud accounts.');
}
