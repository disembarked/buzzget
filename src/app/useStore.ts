import { useCallback, useEffect, useRef, useState } from 'react';
import { hasSupabase, supabase } from '../lib/supabase';
import { db } from '../lib/db';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signOut as sbSignOut } from '../lib/auth';

export type TxType = 'spend' | 'add';
export interface Tx { id: string; type: TxType; amount: number; note: string; date: string; ts: number; }
export interface Preset { id: string; name: string; amount: number; }
export interface Settings { total: number; startDate: string; endDate: string; semName: string; }
export type Sync = 'synced' | 'syncing' | 'offline';

export const DEFAULT_PRESETS: Omit<Preset, 'id'>[] = [
  { name: 'Breakfast', amount: 8 },
  { name: 'Lunch', amount: 12 },
  { name: 'Dinner', amount: 15 },
  { name: 'Snack', amount: 5 },
];
const EMPTY_SETTINGS: Settings = { total: 0, startDate: '', endDate: '', semName: '' };

const ds = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const localId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

const LS = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v != null ? JSON.parse(v) : d; } catch { return d; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

const mapTx = (r: { id: string; type: TxType; amount: number | string; note: string; date: string; ts: string }): Tx =>
  ({ id: r.id, type: r.type, amount: Number(r.amount), note: r.note, date: r.date, ts: Date.parse(r.ts) });

interface AuthResult { error?: string; info?: string; }

export interface Store {
  mode: 'cloud' | 'local';
  ready: boolean;
  authed: boolean;
  email: string;
  authBusy: boolean;
  sync: Sync;
  syncError: string | null;
  ackError: () => void;
  settings: Settings;
  tx: Tx[];
  presets: Preset[];
  signInEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpEmail: (email: string, password: string) => Promise<AuthResult>;
  signInGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  addTx: (type: TxType, amount: number, note: string) => void;
  updateTx: (id: string, patch: { note: string; amount: number }) => void;
  removeTx: (id: string) => void;
  saveSettings: (s: Settings) => void;
  addPreset: (name: string, amount: number) => void;
  removePreset: (id: string) => void;
  resetAll: () => void;
}

export function useStore(): Store {
  const mode: 'cloud' | 'local' = hasSupabase ? 'cloud' : 'local';

  const [ready, setReady] = useState(mode === 'local');
  // local mode initialises synchronously from localStorage; cloud mode starts
  // empty and hydrates once a session resolves.
  const [authed, setAuthed] = useState(() => mode === 'local' && LS.get('bz4_auth', { authed: false, email: '' }).authed);
  const [email, setEmail] = useState(() => (mode === 'local' ? LS.get('bz4_auth', { authed: false, email: '' }).email : ''));
  const [authBusy, setAuthBusy] = useState(false);
  const [sync, setSync] = useState<Sync>('synced');
  const [syncError, setSyncError] = useState<string | null>(null);

  const [settings, setSettings] = useState<Settings>(() => (mode === 'local' ? LS.get<Settings>('bz4_s', EMPTY_SETTINGS) : EMPTY_SETTINGS));
  const [tx, setTx] = useState<Tx[]>(() => (mode === 'local' ? LS.get<Tx[]>('bz4_tx', []) : []));
  const [presets, setPresets] = useState<Preset[]>(() => (mode === 'local' ? LS.get<Preset[]>('bz4_p', DEFAULT_PRESETS.map(p => ({ ...p, id: localId() }))) : []));

  const userId = useRef<string | null>(null);
  const ackError = useCallback(() => setSyncError(null), []);
  const fail = useCallback((e: unknown) => {
    setSync('offline');
    setSyncError(e instanceof Error ? e.message : 'Sync failed — changes may not be saved.');
  }, []);
  const done = useCallback(() => setSync('synced'), []);

  // persist local mode
  useEffect(() => { if (mode === 'local') LS.set('bz4_s', settings); }, [mode, settings]);
  useEffect(() => { if (mode === 'local') LS.set('bz4_tx', tx); }, [mode, tx]);
  useEffect(() => { if (mode === 'local') LS.set('bz4_p', presets); }, [mode, presets]);
  useEffect(() => { if (mode === 'local') LS.set('bz4_auth', { authed, email }); }, [mode, authed, email]);

  /* ---------------- cloud mode: session + hydrate ---------------- */
  const hydrate = useCallback(async () => {
    setSync('syncing');
    try {
      const { profile, tx: rows, presets: prows } = await db.loadAll();
      setSettings(profile
        ? { total: Number(profile.total) || 0, startDate: profile.start_date || '', endDate: profile.end_date || '', semName: profile.sem_name || '' }
        : EMPTY_SETTINGS);
      setTx(rows.map(mapTx));
      if (prows.length) {
        setPresets(prows.map(p => ({ id: p.id, name: p.name, amount: Number(p.amount) })));
      } else if (userId.current) {
        // seed the default quick-log presets for a brand-new account
        const seeded = await Promise.all(DEFAULT_PRESETS.map(p => db.addPreset(userId.current as string, p.name, p.amount)));
        setPresets(seeded.map(p => ({ id: p.id, name: p.name, amount: Number(p.amount) })));
      }
      done();
    } catch (e) { fail(e); }
  }, [done, fail]);

  useEffect(() => {
    if (mode !== 'cloud' || !supabase) return;
    let active = true;

    const apply = async (session: { user: { id: string; email?: string } } | null) => {
      if (!active) return;
      if (session) {
        userId.current = session.user.id;
        setAuthed(true); setEmail(session.user.email || '');
        await hydrate();
      } else {
        userId.current = null;
        setAuthed(false); setEmail('');
        setSettings(EMPTY_SETTINGS); setTx([]); setPresets([]);
      }
      setReady(true);
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => apply(s));
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [mode, hydrate]);

  // Surface OAuth errors that come back in the redirect URL (e.g. provider not
  // enabled, access denied) instead of failing silently, then clean the URL.
  useEffect(() => {
    if (mode !== 'cloud') return;
    const q = new URLSearchParams(window.location.search);
    const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const err = q.get('error_description') || h.get('error_description') || q.get('error') || h.get('error');
    if (err) {
      setSyncError(err.replace(/\+/g, ' '));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [mode]);

  /* ---------------- auth actions ---------------- */
  const signInEmail = useCallback(async (e: string, pw: string): Promise<AuthResult> => {
    if (mode === 'local') { setAuthed(true); setEmail(e); return {}; }
    setAuthBusy(true);
    const { error } = await signInWithEmail(e, pw);
    setAuthBusy(false);
    return { error: error?.message };
  }, [mode]);

  const signUpEmail = useCallback(async (e: string, pw: string): Promise<AuthResult> => {
    if (mode === 'local') { setAuthed(true); setEmail(e); return {}; }
    setAuthBusy(true);
    const { data, error } = await signUpWithEmail(e, pw);
    setAuthBusy(false);
    if (error) return { error: error.message };
    if (!data.session) return { info: 'Account created — check your email to confirm, then sign in.' };
    return {};
  }, [mode]);

  const signInGoogle = useCallback(async (): Promise<AuthResult> => {
    if (mode === 'local') return { error: 'Google sign-in needs Supabase configured.' };
    const { error } = await signInWithGoogle();
    return { error: error?.message };
  }, [mode]);

  const signOut = useCallback(async () => {
    if (mode === 'local') { setAuthed(false); setEmail(''); LS.set('bz4_auth', { authed: false, email: '' }); return; }
    await sbSignOut();
  }, [mode]);

  /* ---------------- data mutations (optimistic) ---------------- */
  const addTx = useCallback((type: TxType, amount: number, note: string) => {
    const amt = parseFloat(amount.toFixed(2));
    const date = ds(new Date());
    if (mode === 'cloud' && userId.current) {
      const tmp = 'tmp_' + localId();
      setTx(prev => [...prev, { id: tmp, type, amount: amt, note, date, ts: Date.now() }]);
      setSync('syncing');
      db.addTx(userId.current, { type, amount: amt, note, date })
        .then(row => { setTx(prev => prev.map(x => x.id === tmp ? mapTx(row) : x)); done(); })
        .catch(e => { setTx(prev => prev.filter(x => x.id !== tmp)); fail(e); });
    } else {
      setTx(prev => [...prev, { id: localId(), type, amount: amt, note, date, ts: Date.now() }]);
    }
  }, [mode, done, fail]);

  const updateTx = useCallback((id: string, patch: { note: string; amount: number }) => {
    const amt = parseFloat(patch.amount.toFixed(2));
    setTx(prev => prev.map(x => x.id === id ? { ...x, note: patch.note, amount: amt } : x));
    if (mode === 'cloud') { setSync('syncing'); db.updateTx(id, { note: patch.note, amount: amt }).then(done).catch(fail); }
  }, [mode, done, fail]);

  const removeTx = useCallback((id: string) => {
    setTx(prev => prev.filter(x => x.id !== id));
    if (mode === 'cloud') { setSync('syncing'); db.deleteTx(id).then(done).catch(fail); }
  }, [mode, done, fail]);

  const saveSettings = useCallback((s: Settings) => {
    setSettings(s);
    if (mode === 'cloud' && userId.current) {
      setSync('syncing');
      db.saveProfile(userId.current, { total: s.total, start_date: s.startDate, end_date: s.endDate, sem_name: s.semName }).then(done).catch(fail);
    }
  }, [mode, done, fail]);

  const addPreset = useCallback((name: string, amount: number) => {
    const amt = parseFloat(amount.toFixed(2));
    if (mode === 'cloud' && userId.current) {
      const tmp = 'tmp_' + localId();
      setPresets(prev => [...prev, { id: tmp, name, amount: amt }]);
      setSync('syncing');
      db.addPreset(userId.current, name, amt)
        .then(row => { setPresets(prev => prev.map(p => p.id === tmp ? { id: row.id, name: row.name, amount: Number(row.amount) } : p)); done(); })
        .catch(e => { setPresets(prev => prev.filter(p => p.id !== tmp)); fail(e); });
    } else {
      setPresets(prev => [...prev, { id: localId(), name, amount: amt }]);
    }
  }, [mode, done, fail]);

  const removePreset = useCallback((id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    if (mode === 'cloud') { setSync('syncing'); db.deletePreset(id).then(done).catch(fail); }
  }, [mode, done, fail]);

  const resetAll = useCallback(() => {
    const freshPresets = DEFAULT_PRESETS.map(p => ({ ...p, id: localId() }));
    setSettings(EMPTY_SETTINGS); setTx([]); setPresets(freshPresets);
    if (mode === 'cloud' && userId.current) {
      setSync('syncing');
      const uid = userId.current;
      db.clearAll(uid)
        .then(() => Promise.all(DEFAULT_PRESETS.map(p => db.addPreset(uid, p.name, p.amount))))
        .then(rows => { setPresets(rows.map(r => ({ id: r.id, name: r.name, amount: Number(r.amount) }))); done(); })
        .catch(fail);
    }
  }, [mode, done, fail]);

  return {
    mode, ready, authed, email, authBusy, sync, syncError, ackError,
    settings, tx, presets,
    signInEmail, signUpEmail, signInGoogle, signOut,
    addTx, updateTx, removeTx, saveSettings, addPreset, removePreset, resetAll,
  };
}
