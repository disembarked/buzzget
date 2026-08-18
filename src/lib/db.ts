import { supabase } from './supabase';

// Types mirror the SQL schema in SETUP.md.
export type DbTxType = 'spend' | 'add';
export interface DbTx { id: string; user_id: string; type: DbTxType; amount: number; note: string; date: string; ts: string; }
export interface DbPreset { id: string; user_id: string; name: string; amount: number; }
export interface DbProfile { id: string; email: string | null; total: number; start_date: string | null; end_date: string | null; sem_name: string | null; }

function sb() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

/**
 * Data layer. Every query is scoped to the signed-in user by row-level security
 * on the server, so we never filter by user_id on reads — RLS does it for us.
 */
export const db = {
  /** Initial load — call once after sign-in. */
  async loadAll() {
    const [{ data: profile }, { data: tx }, { data: presets }] = await Promise.all([
      sb().from('profiles').select('*').maybeSingle(),
      sb().from('transactions').select('*').order('ts', { ascending: true }),
      sb().from('presets').select('*'),
    ]);
    return {
      profile: (profile as DbProfile | null) ?? null,
      tx: (tx ?? []) as DbTx[],
      presets: (presets ?? []) as DbPreset[],
    };
  },

  // ---- transactions ----
  async addTx(userId: string, t: { type: DbTxType; amount: number; note: string; date: string }) {
    const { data, error } = await sb().from('transactions').insert({ user_id: userId, ...t }).select().single();
    if (error) throw error;
    return data as DbTx;
  },
  async updateTx(id: string, patch: { amount?: number; note?: string }) {
    const { error } = await sb().from('transactions').update(patch).eq('id', id);
    if (error) throw error;
  },
  async deleteTx(id: string) {
    const { error } = await sb().from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  // ---- profile / settings ----
  async saveProfile(userId: string, p: { total: number; start_date: string; end_date: string; sem_name: string }) {
    // upsert so it works whether or not the signup trigger already created the row
    const { error } = await sb().from('profiles').upsert({ id: userId, ...p });
    if (error) throw error;
  },

  // ---- presets ----
  async addPreset(userId: string, name: string, amount: number) {
    const { data, error } = await sb().from('presets').insert({ user_id: userId, name, amount }).select().single();
    if (error) throw error;
    return data as DbPreset;
  },
  async deletePreset(id: string) {
    const { error } = await sb().from('presets').delete().eq('id', id);
    if (error) throw error;
  },

  // ---- reset ----
  async clearAll(userId: string) {
    await Promise.all([
      sb().from('transactions').delete().eq('user_id', userId),
      sb().from('presets').delete().eq('user_id', userId),
    ]);
    await sb().from('profiles').upsert({ id: userId, total: 0, start_date: null, end_date: null, sem_name: null });
  },
};
