import { useState, useEffect, useRef, useMemo } from 'react';
import { useStore, type Preset, type Tx } from './useStore';

type Tab = 'wallet' | 'stats' | 'ledger' | 'settings';
type RangeId = '7' | '30' | 'sem' | 'all' | 'custom';
interface Brk { name: string; s: string; e: string; }
interface Sem { name: string; start: string; end: string; }

/* Georgia Tech academic calendar — registrar.gatech.edu (Fall 2026+ from the
   official Five-Term calendar; 2025-26 secondary breaks are best-known/tentative) */
const GT_BREAKS: Brk[] = [
  { name: 'Labor Day',       s: '2025-09-01', e: '2025-09-01' },
  { name: 'Fall Recess',     s: '2025-10-13', e: '2025-10-14' },
  { name: 'Thanksgiving',    s: '2025-11-26', e: '2025-11-28' },
  { name: 'Winter Break',    s: '2025-12-14', e: '2026-01-11' },
  { name: 'MLK Day',         s: '2026-01-19', e: '2026-01-19' },
  { name: 'Spring Break',    s: '2026-03-16', e: '2026-03-20' },
  { name: 'Memorial Day',    s: '2026-05-25', e: '2026-05-25' },
  { name: 'Juneteenth',      s: '2026-06-19', e: '2026-06-19' },
  { name: 'Independence Day',s: '2026-07-02', e: '2026-07-03' },
  { name: 'Labor Day',       s: '2026-09-07', e: '2026-09-07' },
  { name: 'Thanksgiving',    s: '2026-11-25', e: '2026-11-27' },
  { name: 'Winter Break',    s: '2026-12-18', e: '2027-01-10' },
  { name: 'MLK Day',         s: '2027-01-18', e: '2027-01-18' },
  { name: 'Spring Break',    s: '2027-03-22', e: '2027-03-26' },
];
const GT_SEMS: Sem[] = [
  { name: 'Fall 2025',   start: '2025-08-18', end: '2025-12-13' },
  { name: 'Spring 2026', start: '2026-01-12', end: '2026-05-07' },
  { name: 'Summer 2026', start: '2026-05-18', end: '2026-07-31' },
  { name: 'Fall 2026',   start: '2026-08-24', end: '2026-12-17' },
  { name: 'Spring 2027', start: '2027-01-11', end: '2027-05-07' },
];

const ds = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const pd = (s: string) => { const [y, m, d] = s.split('-').map(Number); const dt = new Date(y, m - 1, d); dt.setHours(0, 0, 0, 0); return dt; };
const tod = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const isBreak = (s: string) => GT_BREAKS.some(b => s >= b.s && s <= b.e);
const curBreak = () => { const s = ds(tod()); return GT_BREAKS.find(b => s >= b.s && s <= b.e) || null; };
const nxtBreak = () => { const s = ds(tod()); return GT_BREAKS.find(b => b.s > s) || null; };
const semForDate = (s: string) => GT_SEMS.find(x => s >= x.start && s <= x.end) || null;
const countActive = (a: string, b: string) => { let c = 0; const d = pd(a), e = pd(b); while (d <= e) { if (!isBreak(ds(d))) c++; d.setDate(d.getDate() + 1); } return Math.max(c, 1); };

const fmt = (n: number) => '$' + Math.abs(n).toFixed(2);
const fmtSigned = (n: number) => (n < 0 ? '-$' : '$') + Math.abs(n).toFixed(2);
const fmtT = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const mdy = (s: string) => pd(s).toLocaleDateString([], { month: 'short', day: 'numeric' });
const fmtDL = (s: string) => {
  const d = pd(s), t = tod();
  if (s === ds(t)) return 'Today';
  const y = new Date(t); y.setDate(y.getDate() - 1);
  if (s === ds(y)) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

const WELCOMES =['Welcome', 'Chào mừng', '환영합니다', 'Bienvenido', 'Bienvenue', 'Willkommen'];

const NAV: [Tab, string, string][] = [
  ['wallet', 'ti-wallet', 'Wallet'],
  ['stats', 'ti-chart-histogram', 'Stats'],
  ['ledger', 'ti-list-details', 'Ledger'],
  ['settings', 'ti-adjustments-horizontal', 'Settings'],
];

export default function App() {
  const store = useStore();
  const { settings, tx, presets } = store;

  const [tab, setTab] = useState<Tab>('wallet');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err'; show: boolean }>({ msg: '', type: 'ok', show: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // form state
  const [sNote, setSNote] = useState(''); const [sAmt, setSAmt] = useState('');
  const [aAmt, setAAmt] = useState('');
  const [pName, setPName] = useState(''); const [pAmt, setPAmt] = useState('');
  const [cfgTotal, setCfgTotal] = useState<string>('');
  // keep the settings-form total in sync when the profile loads/saves
  useEffect(() => { setCfgTotal(settings.total ? String(settings.total) : ''); }, [settings.total]);

  // ledger state
  const [range, setRange] = useState<RangeId>('30');
  const [rangeStartS, setRangeStartS] = useState('');
  const [rangeEndS, setRangeEndS] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState(''); const [editAmt, setEditAmt] = useState('');

  // rotating welcome word
  const [welIdx, setWelIdx] = useState(0);

  // auth form state (email/password + sign in vs sign up)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPw, setAuthPw] = useState('');

  const isSetup = settings.total > 0 && !!settings.startDate && !!settings.endDate;
  const isWelcome = !isSetup && tab === 'wallet';

  useEffect(() => {
    if (!isWelcome) return;
    const id = setInterval(() => setWelIdx(i => (i + 1) % WELCOMES.length), 2200);
    return () => clearInterval(id);
  }, [isWelcome]);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type, show: true });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2400);
  };

  const go = (t: Tab) => { setTab(t); setEditingId(null); };

  // surface background sync errors from the store as a toast
  useEffect(() => {
    if (store.syncError) { showToast(store.syncError, 'err'); store.ackError(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.syncError]);

  /* ---------------- auth ---------------- */
  const acctName = (store.email.split('@')[0] || 'user').replace(/[._]/g, ' ');
  const acctInitials = acctName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || 'U';
  const doSignIn = async () => {
    const email = authEmail.trim();
    if (!email) { showToast('Enter your email', 'err'); return; }
    if (store.mode === 'cloud' && authPw.length < 6) { showToast('Password must be at least 6 characters', 'err'); return; }
    const res = authMode === 'signin' ? await store.signInEmail(email, authPw) : await store.signUpEmail(email, authPw);
    if (res.error) { showToast(res.error, 'err'); return; }
    if (res.info) { showToast(res.info); setAuthMode('signin'); return; }
    if (store.mode === 'local') showToast(authMode === 'signin' ? 'Signed in' : 'Account created');
  };
  const doGoogle = async () => { const res = await store.signInGoogle(); if (res.error) showToast(res.error, 'err'); };
  const doSignOut = async () => { await store.signOut(); setAuthEmail(''); setAuthPw(''); setTab('wallet'); };

  /* ---------------- derived values ---------------- */
  const v = useMemo(() => {
    const set = settings;
    const setup = set.total > 0 && !!set.startDate && !!set.endDate;
    const todayS = ds(tod());

    const tSpent = tx.filter(t => t.type === 'spend').reduce((a, t) => a + t.amount, 0);
    const tAdded = tx.filter(t => t.type === 'add').reduce((a, t) => a + t.amount, 0);
    const remBal = set.total - tSpent + tAdded;
    const bpd = setup ? set.total / countActive(set.startDate, set.endDate) : 0;
    const elapsed = setup ? (pd(set.startDate) > tod() ? 0 : countActive(set.startDate, todayS)) : 0;
    const leftActive = setup ? (tod() > pd(set.endDate) ? 0 : countActive(todayS, set.endDate)) : 0;
    const aheadBy = setup ? bpd * elapsed - tSpent : 0;
    const spentOn = (s: string) => tx.filter(t => t.type === 'spend' && t.date === s).reduce((a, t) => a + t.amount, 0);
    const pct = set.total > 0 ? Math.min(100, (tSpent / set.total) * 100) : 0;
    const avg = elapsed > 0 ? tSpent / elapsed : 0;

    // 7-day chart
    const chartDays: { day: string; spent: number; isToday: boolean; brk: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(tod()); d.setDate(d.getDate() - i); const s = ds(d);
      chartDays.push({ day: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()], spent: spentOn(s), isToday: s === todayS, brk: isBreak(s) });
    }
    const maxSp = Math.max(...chartDays.map(c => c.spent), 1);
    const chart = chartDays.map(c => ({
      day: c.day,
      valStr: c.spent > 0 ? '$' + Math.round(c.spent) : '',
      h: (c.brk ? 4 : Math.round((c.spent / maxSp) * 110) + 3) + 'px',
      fill: c.isToday ? 'var(--gold2)' : (c.brk ? 'var(--line)' : 'var(--line2)'),
      dayColor: c.isToday ? 'var(--gold)' : 'var(--ink3)',
      dayWeight: c.isToday ? 700 : 400,
    }));

    // today's transactions
    const selTx = tx.filter(t => t.date === todayS).sort((a, b) => b.ts - a.ts).map(t => ({
      id: t.id, note: t.note || 'No note', timeStr: fmtT(t.ts),
      dot: t.type === 'spend' ? 'var(--neg)' : 'var(--pos)',
      amtColor: t.type === 'spend' ? 'var(--ink)' : 'var(--pos)',
      amtStr: (t.type === 'spend' ? '−' : '+') + fmt(t.amount),
    }));

    // safe-to-spend & run-out
    const safeToday = leftActive > 0 ? remBal / leftActive : remBal;
    let runOutStr = '—', runOutSub = 'at current pace';
    if (remBal <= 0) { runOutStr = 'Depleted'; runOutSub = ''; }
    else if (avg > 0.001) {
      const need = remBal / avg; const d = new Date(tod()); let counted = 0, guard = 0;
      while (counted < need && guard < 800) { d.setDate(d.getDate() + 1); if (!isBreak(ds(d))) counted++; guard++; }
      if (setup && ds(d) > set.endDate) { runOutStr = 'Covers the term'; runOutSub = 'through ' + mdy(set.endDate); }
      else { runOutStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' }); runOutSub = 'at current pace'; }
    }

    // stats
    const txSp = tx.filter(t => t.type === 'spend');
    const weeksRaw: { l: string; val: number; cur: boolean }[] = [];
    for (let w = 3; w >= 0; w--) {
      const ws = new Date(tod()); ws.setDate(ws.getDate() - ws.getDay() - w * 7);
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      const sp = tx.filter(t => t.type === 'spend' && t.date >= ds(ws) && t.date <= ds(we)).reduce((a, t) => a + t.amount, 0);
      const sameM = ws.getMonth() === we.getMonth();
      const l = sameM
        ? `${ws.toLocaleDateString([], { month: 'short', day: 'numeric' })}–${we.getDate()}`
        : `${ws.toLocaleDateString([], { month: 'short', day: 'numeric' })}–${we.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
      weeksRaw.push({ l, val: sp, cur: w === 0 });
    }
    const maxW = Math.max(...weeksRaw.map(w => w.val), 1);
    const weeks = weeksRaw.map(w => ({
      l: w.l, vStr: '$' + Math.round(w.val),
      h: Math.round((w.val / maxW) * 130) + 3 + 'px',
      fill: w.cur ? 'var(--gold2)' : 'var(--line2)', color: w.cur ? 'var(--gold)' : 'var(--ink2)',
    }));
    const topExp = [...txSp].sort((a, b) => b.amount - a.amount).slice(0, 8).map(t => ({
      id: t.id, note: t.note || 'No note', date: mdy(t.date), amtStr: '−' + fmt(t.amount),
    }));
    const breaks = GT_BREAKS.filter(b => b.e >= todayS).slice(0, 5).map(b => {
      const active = todayS >= b.s && todayS <= b.e, past = b.e < todayS;
      return {
        name: b.name,
        range: mdy(b.s) + (b.s !== b.e ? ' – ' + mdy(b.e) : ''),
        badge: active ? 'Active' : past ? 'Past' : 'Upcoming',
        badgeColor: active ? 'var(--gold)' : 'var(--ink3)',
      };
    });

    const autoSem = semForDate(todayS) || GT_SEMS.find(s => s.start > todayS) || GT_SEMS[GT_SEMS.length - 1];
    const activeSemName = set.semName || semForDate(todayS)?.name || autoSem.name;
    const semRange = mdy((set.startDate || autoSem.start)) + ' – ' + mdy((set.endDate || autoSem.end));
    const nb = nxtBreak(); const cb = curBreak();

    // ledger — running balance (chronological over full history)
    const chrono = [...tx].sort((a, b) => a.ts - b.ts);
    let run = set.total; const balMap: Record<string, number> = {};
    chrono.forEach(t => { run += (t.type === 'add' ? t.amount : -t.amount); balMap[t.id] = run; });

    let rA: string, rB: string;
    if (range === 'custom' && rangeStartS && rangeEndS) { rA = rangeStartS; rB = rangeEndS; }
    else if (range === '7') { const d = new Date(tod()); d.setDate(d.getDate() - 6); rA = ds(d); rB = todayS; }
    else if (range === '30') { const d = new Date(tod()); d.setDate(d.getDate() - 29); rA = ds(d); rB = todayS; }
    else if (range === 'sem' && setup) { rA = set.startDate; rB = todayS < set.endDate ? todayS : set.endDate; }
    else { const dates = tx.map(t => t.date).sort(); rA = dates[0] || todayS; rB = todayS; }
    // guard against inverted custom bounds
    if (rA > rB) { const t2 = rA; rA = rB; rB = t2; }

    const filtered = tx.filter(t => t.date >= rA && t.date <= rB);
    const fSpent = filtered.filter(t => t.type === 'spend').reduce((a, t) => a + t.amount, 0);
    const byDay: Record<string, Tx[]> = {};
    filtered.forEach(t => { (byDay[t.date] = byDay[t.date] || []).push(t); });
    const ledgerDays = Object.keys(byDay).sort().reverse().map(dk => {
      const rows = byDay[dk].slice().sort((a, b) => b.ts - a.ts);
      const net = rows.reduce((a, t) => a + (t.type === 'add' ? t.amount : -t.amount), 0);
      return {
        key: dk, label: fmtDL(dk),
        count: rows.length + (rows.length === 1 ? ' entry' : ' entries'),
        subtotal: fmtSigned(net),
        rows: rows.map(t => ({
          id: t.id, timeStr: fmtT(t.ts), note: t.note || 'No note',
          typeLabel: t.type === 'add' ? 'Add' : 'Spend',
          typeColor: t.type === 'add' ? 'var(--pos)' : 'var(--ink3)',
          amtColor: t.type === 'add' ? 'var(--pos)' : 'var(--ink)',
          amtStr: (t.type === 'add' ? '+' : '−') + fmt(t.amount),
          balStr: fmt(balMap[t.id]),
        })),
      };
    });

    return {
      todayS, setup, remBal, tSpent, bpd, leftActive, aheadBy, pct, avg,
      todaySpent: spentOn(todayS), chart, chartPeak: '$' + Math.round(maxSp), selTx,
      safeToday, runOutStr, runOutSub,
      weeks, topExp, breaks, txSpCount: txSp.length,
      activeSemName, semRange, autoSem, nb, cb,
      ledgerDays, ledgerSummary: mdy(rA) + ' – ' + mdy(rB) + ' · ' + fmt(fSpent) + ' spent · ' + filtered.length + ' entries',
      rA, rB, balMap, filtered,
    };
  }, [settings, tx, presets, range, rangeStartS, rangeEndS]);

  /* ---------------- actions ---------------- */
  const delTx = (id: string) => { store.removeTx(id); setEditingId(null); showToast('Removed'); };

  const logPreset = (p: Preset) => {
    if (p.amount > v.remBal + 0.001) { showToast(`Only ${fmt(v.remBal)} left`, 'err'); return; }
    store.addTx('spend', p.amount, p.name);
    showToast(`${p.name} · ${fmt(p.amount)}`);
  };
  const doSpend = () => {
    const amt = parseFloat(sAmt || '0');
    if (isNaN(amt) || amt <= 0) { showToast('Enter a valid amount', 'err'); return; }
    if (amt > v.remBal + 0.001) { showToast(`Only ${fmt(v.remBal)} left`, 'err'); return; }
    store.addTx('spend', amt, sNote.trim() || 'Dining');
    showToast(`Logged ${fmt(amt)}`); setSNote(''); setSAmt('');
  };
  const doAdd = () => {
    const amt = parseFloat(aAmt || '0');
    if (isNaN(amt) || amt <= 0) { showToast('Enter a valid amount', 'err'); return; }
    store.addTx('add', amt, 'Funds added'); showToast(`${fmt(amt)} added`); setAAmt('');
  };
  const saveSett = () => {
    const total = parseFloat(cfgTotal || '0');
    if (!total || total <= 0) { showToast('Enter a starting balance', 'err'); return; }
    store.saveSettings({ total, startDate: v.autoSem.start, endDate: v.autoSem.end, semName: v.autoSem.name });
    setTab('wallet'); showToast(`Saved for ${v.autoSem.name}`);
  };
  const addPreset = () => {
    const amt = parseFloat(pAmt || '0');
    if (!pName.trim() || isNaN(amt) || amt <= 0) { showToast('Name and amount required', 'err'); return; }
    store.addPreset(pName.trim(), amt);
    showToast('Preset added'); setPName(''); setPAmt('');
  };
  const delPreset = (id: string) => store.removePreset(id);
  const resetAll = () => {
    if (!confirm('Delete all data and reset settings?')) return;
    store.resetAll(); setCfgTotal(''); setTab('wallet');
  };
  const startEdit = (id: string, note: string, amount: number) => { setEditingId(id); setEditNote(note); setEditAmt(String(amount)); };
  const saveEdit = () => {
    const amt = parseFloat(editAmt || '0');
    if (isNaN(amt) || amt <= 0) { showToast('Enter a valid amount', 'err'); return; }
    const cur = tx.find(x => x.id === editingId);
    store.updateTx(editingId as string, { note: editNote.trim() || cur?.note || '', amount: amt });
    setEditingId(null); showToast('Updated');
  };
  const exportCSV = () => {
    const rows: string[][] = [['Date', 'Time', 'Type', 'Note', 'Amount', 'Balance']];
    v.filtered.slice().sort((a, b) => a.ts - b.ts).forEach(t => {
      rows.push([t.date, fmtT(t.ts), t.type, '"' + (t.note || '').replace(/"/g, '""') + '"',
        (t.type === 'add' ? '' : '-') + t.amount.toFixed(2), (v.balMap[t.id] ?? 0).toFixed(2)]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'buzzget-ledger.csv'; a.click();
    URL.revokeObjectURL(url); showToast('CSV exported');
  };

  /* ---------------- screens ---------------- */
  const Auth = () => (
    <div className="bz-auth">
      <div className="brand"><img src="/bee-wallet.png" alt="" /><div className="nm serif">BuzzGet</div></div>
      <h1 className="serif">{authMode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
      <div className="sub">{authMode === 'signin'
        ? 'Sign in to track your dining dollars.'
        : 'One balance, paced across the whole semester.'}</div>
      {store.mode === 'cloud' && <>
        <button className="bz-google" onClick={doGoogle}><i className="ti ti-brand-google" style={{ fontSize: 16 }} />Continue with Google</button>
        <div className="bz-or">OR</div>
      </>}
      <label>Email</label>
      <input className="bz-input" style={{ marginBottom: 13 }} type="email" autoComplete="email" placeholder="you@gatech.edu" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
      <label>Password</label>
      <input className="bz-input" style={{ marginBottom: 20 }} type="password" autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} placeholder="••••••••" value={authPw} onChange={e => setAuthPw(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') doSignIn(); }} />
      <button className="bz-btn bz-btn-primary" style={{ width: '100%' }} disabled={store.authBusy} onClick={doSignIn}>{store.authBusy ? 'Please wait…' : authMode === 'signin' ? 'Sign in' : 'Create account'}</button>
      <div className="switch">
        {authMode === 'signin' ? 'New to BuzzGet? ' : 'Already have an account? '}
        <a onClick={() => setAuthMode(m => m === 'signin' ? 'signup' : 'signin')} style={{ fontWeight: 600 }}>
          {authMode === 'signin' ? 'Create one' : 'Sign in'}
        </a>
      </div>
    </div>
  );

  const Welcome = () => (
    <div className="bz-welcome">
      <div className="word">{WELCOMES[welIdx]}</div>
      <h2>Know exactly how far your dining dollars go.</h2>
      <p>Set your starting balance once. BuzzGet paces it across the semester, skips academic breaks, and keeps a clean ledger of every meal.</p>
      <button className="bz-btn bz-btn-primary" onClick={() => setTab('settings')}>Start tracking<i className="ti ti-arrow-right" /></button>
    </div>
  );

  const Wallet = () => (
    <div className="bz-wallet">
      {v.cb ? (
        <div className="bz-breakpill now"><i className="ti ti-calendar-off" />Break day · {v.cb.name}</div>
      ) : v.nb ? (
        <div className="bz-breakpill"><i className="ti ti-calendar-event" />Next break · {v.nb.name}, {mdy(v.nb.s)}</div>
      ) : null}

      <div className="bz-hero">
        <div className="col">
          <div className="bz-cap">Remaining balance</div>
          <div className={`bz-bal serif ${v.remBal < 0 ? 'neg' : ''}`}>{fmt(v.remBal)}</div>
          <div className="bz-pace" style={{ color: v.aheadBy >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
            <i className={`ti ${v.aheadBy >= 0 ? 'ti-trending-up' : 'ti-trending-down'}`} />
            {fmt(Math.abs(v.aheadBy))} {v.aheadBy >= 0 ? 'ahead' : 'behind'} of pace
          </div>
        </div>
        <div className="col secondary">
          <div className="bz-cap">Spent today</div>
          <div className="bz-metric">{fmt(v.todaySpent)}</div>
          <div className="bz-sub">Budget {fmt(v.bpd)} / active day</div>
        </div>
        <div className="col secondary">
          <div className="bz-cap">Days left</div>
          <div className="bz-metric">{v.leftActive}</div>
          <div className="bz-sub">{v.pct.toFixed(0)}% of budget used</div>
        </div>
      </div>
      <div className="bz-progress"><div style={{ width: v.pct.toFixed(1) + '%' }} /></div>

      <div className="bz-hero2">
        <div className="col">
          <div className="bz-cap">Safe to spend today</div>
          <div className="big gold">{fmt(v.safeToday)}</div>
          <div className="bz-sub">keeps you on pace</div>
        </div>
        <div className="col">
          <div className="bz-cap">Funds last until</div>
          <div className="big">{v.runOutStr}</div>
          <div className="bz-sub">{v.runOutSub}</div>
        </div>
        <div className="col tertiary">
          <div className="bz-cap">Avg / active day</div>
          <div className="big">{fmt(v.avg)}</div>
          <div className="bz-sub">vs. {fmt(v.bpd)} budget</div>
        </div>
      </div>

      <div className="bz-cols">
        <div className="left">
          <div className="bz-sechdr"><div className="bz-eyebrow">Last 7 days</div><div className="bz-sub" style={{ marginTop: 0 }}>peak {v.chartPeak}</div></div>
          <div className="bz-bars">
            {v.chart.map((c, i) => (
              <div key={i} className="bz-bar-col">
                <div className="bz-bar-val">{c.valStr}</div>
                <div className="bz-bar" style={{ background: c.fill, height: c.h }} />
                <div className="bz-bar-day" style={{ color: c.dayColor, fontWeight: c.dayWeight }}>{c.day}</div>
              </div>
            ))}
          </div>

          {v.cb ? (
            <div className="bz-empty" style={{ marginTop: 30 }}>Break day — spending isn't counted toward your pace.</div>
          ) : (
            <>
              <div className="bz-sechdr" style={{ marginTop: 30 }}><div className="bz-eyebrow">Quick log</div></div>
              <div className="bz-presets">
                {presets.map(p => (
                  <button key={p.id} className="bz-preset" onClick={() => logPreset(p)}>
                    <div className="pn">{p.name}</div><div className="pa">{fmt(p.amount)}</div>
                  </button>
                ))}
              </div>
              <div className="bz-logrow">
                <input className="bz-input" style={{ flex: 1.4 }} type="text" placeholder="Note — what did you eat?" value={sNote} onChange={e => setSNote(e.target.value)} />
                <input className="bz-input" style={{ flex: 0.7 }} type="number" placeholder="0.00" value={sAmt} onChange={e => setSAmt(e.target.value)} />
                <button className="bz-btn bz-btn-primary" style={{ padding: '0 18px' }} onClick={doSpend}>Log</button>
              </div>
            </>
          )}
        </div>

        <div className="right">
          <div className="bz-sechdr"><div className="bz-eyebrow">Today</div><div className="bz-sub" style={{ marginTop: 0 }}>{v.selTx.length}{v.selTx.length === 1 ? ' entry' : ' entries'}</div></div>
          {v.selTx.length === 0 && <div className="bz-empty">Nothing logged yet today.</div>}
          {v.selTx.map(t => (
            <div key={t.id} className="bz-txrow">
              <div className="bz-dot" style={{ background: t.dot }} />
              <div className="info"><div className="note">{t.note}</div><div className="time">{t.timeStr}</div></div>
              <div className="amt" style={{ color: t.amtColor }}>{t.amtStr}</div>
              <button className="bz-iconbtn" onClick={() => delTx(t.id)} title="Delete"><i className="ti ti-x" style={{ fontSize: 13 }} /></button>
            </div>
          ))}
          <div className="bz-logrow">
            <input className="bz-input" style={{ flex: 1 }} type="number" placeholder="Add funds" value={aAmt} onChange={e => setAAmt(e.target.value)} />
            <button className="bz-btn bz-btn-ghost" style={{ padding: '0 16px' }} onClick={doAdd}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );

  const Stats = () => (
    <div>
      <h1 className="bz-h1 serif">Statistics</h1>
      <div className="bz-statgrid">
        {[
          { l: 'Total spent', val: fmt(v.tSpent), s: 'of ' + fmt(settings.total), color: 'var(--ink)' },
          { l: 'Remaining', val: fmt(v.remBal), s: v.leftActive + ' days left', color: v.remBal >= 0 ? 'var(--pos)' : 'var(--neg)' },
          { l: 'Avg / active day', val: fmt(v.avg), s: 'budget ' + fmt(v.bpd), color: 'var(--ink)' },
          { l: 'Logged meals', val: String(v.txSpCount), s: 'transactions', color: 'var(--ink)' },
        ].map((s, i) => (
          <div key={i} className="bz-statcell"><div className="l">{s.l}</div><div className="v" style={{ color: s.color }}>{s.val}</div><div className="s">{s.s}</div></div>
        ))}
      </div>
      <div className="bz-cols bz-stats-cols" style={{ gridTemplateColumns: '1.3fr 1fr', marginTop: 34 }}>
        <div className="left">
          <div className="bz-eyebrow" style={{ marginBottom: 18, display: 'block' }}>Weekly spending</div>
          <div className="bz-bars" style={{ height: 150 }}>
            {v.weeks.map((w, i) => (
              <div key={i} className="bz-bar-col">
                <div className="bz-bar-val" style={{ fontWeight: 600, color: w.color }}>{w.vStr}</div>
                <div className="bz-bar" style={{ background: w.fill, height: w.h, borderRadius: '6px 6px 0 0' }} />
                <div className="bz-bar-day">{w.l}</div>
              </div>
            ))}
          </div>
          <div className="bz-eyebrow" style={{ margin: '34px 0 8px', display: 'block' }}>Academic breaks</div>
          {v.breaks.map((b, i) => (
            <div key={i} className="bz-breakrow"><div><div className="nm">{b.name}</div><div className="rg">{b.range}</div></div><span className="bd" style={{ color: b.badgeColor }}>{b.badge}</span></div>
          ))}
        </div>
        <div className="right">
          <div className="bz-eyebrow" style={{ marginBottom: 14, display: 'block' }}>Top expenses</div>
          {v.topExp.length === 0 && <div className="bz-empty">No spending logged yet.</div>}
          {v.topExp.map(t => (
            <div key={t.id} className="bz-txrow"><div className="info"><div className="note">{t.note}</div><div className="time">{t.date}</div></div><div className="amt" style={{ color: 'var(--neg)' }}>{t.amtStr}</div></div>
          ))}
        </div>
      </div>
    </div>
  );

  const RANGE_PRESETS: [RangeId, string][] = [['7', '7 days'], ['30', '30 days'], ['sem', 'Semester'], ['all', 'All']];
  const Ledger = () => (
    <div className="bz-ledger">
      <div className="bz-ledger-head">
        <div>
          <h1 className="bz-h1 serif" style={{ marginBottom: 6 }}>Ledger</h1>
          <div className="bz-sub" style={{ marginTop: 0 }}>{v.ledgerSummary}</div>
        </div>
        <button className="bz-btn bz-btn-ghost" style={{ padding: '9px 14px', fontSize: 12.5 }} onClick={exportCSV}><i className="ti ti-download" style={{ fontSize: 14 }} />Export CSV</button>
      </div>
      <div className="bz-chips">
        {RANGE_PRESETS.map(([id, label]) => (
          <button key={id} className={`bz-chip ${range === id ? 'on' : 'off'}`} onClick={() => setRange(id)}>{label}</button>
        ))}
        <div style={{ width: 1, height: 20, background: 'var(--line)', margin: '0 4px' }} />
        <div className="bz-daterange">
          <input className="bz-date" type="date" value={v.rA} onChange={e => { setRange('custom'); setRangeStartS(e.target.value); setRangeEndS(rangeEndS || v.rB); }} />
          <span style={{ color: 'var(--ink3)', fontSize: 12 }}>to</span>
          <input className="bz-date" type="date" value={v.rB} onChange={e => { setRange('custom'); setRangeEndS(e.target.value); setRangeStartS(rangeStartS || v.rA); }} />
        </div>
      </div>

      <div className="bz-ledger-cols bz-ledger-head-row">
        <div>Date / Time</div><div>Note</div><div>Type</div><div style={{ textAlign: 'right' }}>Amount</div><div style={{ textAlign: 'right' }}>Balance</div>
      </div>
      <div className="bz-ledger-body bz-scroll">
        {v.ledgerDays.length === 0 && <div className="bz-empty" style={{ padding: '26px 4px' }}>No transactions in this range.</div>}
        {v.ledgerDays.map(d => (
          <div key={d.key}>
            <div className="bz-day-hdr"><div className="d">{d.label}</div><div className="s">{d.subtotal} · {d.count}</div></div>
            {d.rows.map(t => {
              const editing = editingId === t.id;
              return (
                <div key={t.id} className="bz-ledger-cols bz-ledger-row" style={{ background: editing ? 'var(--gold-soft)' : 'transparent' }}>
                  <div className="tcell">{t.timeStr}</div>
                  {editing ? (
                    <div className="bz-edit">
                      <input className="en" type="text" value={editNote} onChange={e => setEditNote(e.target.value)} />
                      <input className="ea" type="number" value={editAmt} onChange={e => setEditAmt(e.target.value)} />
                      <button className="bz-mini-btn save" onClick={saveEdit}>Save</button>
                      <button className="bz-mini-btn cancel" onClick={() => setEditingId(null)}>Cancel</button>
                      <button className="bz-iconbtn" style={{ color: 'var(--neg)' }} onClick={() => delTx(t.id)}><i className="ti ti-trash" style={{ fontSize: 14 }} /></button>
                    </div>
                  ) : (
                    <>
                      <div className="ncell">{t.note}</div>
                      <div className="tycell"><span style={{ color: t.typeColor }}>{t.typeLabel}</span></div>
                      <div className="acell" style={{ color: t.amtColor }}>{t.amtStr}</div>
                      <div className="bcell">{t.balStr}<button className="bz-iconbtn" onClick={() => startEdit(t.id, t.note === 'No note' ? '' : t.note, parseFloat(t.amtStr.replace(/[^\d.]/g, '')))}><i className="ti ti-pencil" style={{ fontSize: 13 }} /></button></div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  const SettingsScreen = () => (
    <div className="bz-settings">
      <h1 className="bz-h1 serif">Settings</h1>
      <div className="bz-acct-row">
        <div className="bz-avatar">{acctInitials}</div>
        <div className="meta"><div className="n">{acctName}</div><div className="e">{store.email}</div></div>
        <button className="bz-btn bz-btn-ghost" style={{ padding: '7px 12px', fontSize: 12 }} onClick={doSignOut}>Sign out</button>
      </div>
      <div className="bz-settings-grid">
        <div className="left">
          <div className="bz-eyebrow" style={{ marginBottom: 12, display: 'block' }}>Balance</div>
          <label className="bz-field-lbl">Starting balance ($)</label>
          <input className="bz-input" style={{ marginBottom: 14 }} type="number" placeholder="e.g. 788" value={cfgTotal} onChange={e => setCfgTotal(e.target.value)} />
          <label className="bz-check"><input type="checkbox" defaultChecked />Exclude academic breaks from pacing</label>
          <button className="bz-btn bz-btn-primary" onClick={saveSett}>Save settings</button>
          <div className="bz-eyebrow" style={{ margin: '34px 0 10px', display: 'block' }}>Data</div>
          <button className="bz-btn bz-btn-danger" onClick={resetAll}><i className="ti ti-trash" style={{ fontSize: 14 }} />Reset all data</button>
        </div>
        <div className="right">
          <div className="bz-eyebrow" style={{ marginBottom: 12, display: 'block' }}>Meal presets</div>
          {presets.map(p => (
            <div key={p.id} className="bz-preset-line">
              <div><span className="nm">{p.name}</span><span className="am">{fmt(p.amount)}</span></div>
              <button className="bz-iconbtn" onClick={() => delPreset(p.id)}><i className="ti ti-x" style={{ fontSize: 14 }} /></button>
            </div>
          ))}
          <div className="bz-addrow">
            <input className="bz-input" style={{ flex: 1.4, padding: '9px 11px', fontSize: 12.5 }} type="text" placeholder="Name" value={pName} onChange={e => setPName(e.target.value)} />
            <input className="bz-input" style={{ flex: 0.7, padding: '9px 11px', fontSize: 12.5 }} type="number" placeholder="$" value={pAmt} onChange={e => setPAmt(e.target.value)} />
            <button className="bz-btn bz-btn-ghost" style={{ padding: '0 14px', fontSize: 12.5 }} onClick={addPreset}>Add</button>
          </div>
          <div className="bz-eyebrow" style={{ margin: '30px 0 10px', display: 'block' }}>Current semester</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><div style={{ fontSize: 14, fontWeight: 600 }}>{v.autoSem.name}</div><div style={{ fontSize: 11.5, color: 'var(--ink3)', marginTop: 1 }}>{mdy(v.autoSem.start)} – {mdy(v.autoSem.end)}</div></div>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--gold)' }}>Auto</span>
          </div>
        </div>
      </div>
    </div>
  );

  // NOTE: call screens as functions (not <Screen/>) so React keeps the same tree
  // across renders — otherwise inputs remount and lose focus on every keystroke.
  const screen = isWelcome ? Welcome() : tab === 'wallet' ? Wallet() : tab === 'stats' ? Stats() : tab === 'ledger' ? Ledger() : SettingsScreen();

  const toastEl = (
    <div className={`bz-toast ${toast.show ? 'show' : ''} ${toast.type}`}>
      <i className={`ti ${toast.type === 'ok' ? 'ti-check' : 'ti-alert-triangle'}`} />{toast.msg}
    </div>
  );

  if (!store.ready) {
    return (
      <div className="bz-root">
        <div className="bz-authwrap" style={{ alignItems: 'center' }}>
          <img src="/bee-wallet.png" alt="" width={72} height={72} style={{ opacity: 0.85 }} />
        </div>
      </div>
    );
  }

  if (!store.authed) {
    return (
      <div className="bz-root">
        {toastEl}
        <div className="bz-shell"><div className="bz-authwrap">{Auth()}</div></div>
      </div>
    );
  }

  return (
    <div className="bz-root">
      {toastEl}
      <div className="bz-shell">
        <div className="bz-frame">
          {/* desktop sidebar */}
          <aside className="bz-sidebar">
            <div className="bz-brand"><img src="/bee-wallet.png" alt="" /><div className="name">BuzzGet</div></div>
            {NAV.map(([id, icon, label]) => (
              <button key={id} className={`bz-navbtn ${!isWelcome && tab === id ? 'on' : ''}`} onClick={() => go(id)}>
                <i className={`ti ${icon}`} />{label}
              </button>
            ))}
            <div className="spacer" />
            <div className="bz-sidefoot">
              <div className="bz-acct">
                <div className="bz-avatar">{acctInitials}</div>
                <div className="meta"><div className="n">{acctName}</div><div className="e">{store.email}</div></div>
                <button className="bz-iconbtn" title="Sign out" onClick={doSignOut}><i className="ti ti-logout" style={{ fontSize: 16 }} /></button>
              </div>
              {store.mode === 'cloud' && (
                <div className="bz-sync">
                  <span className="dot" style={{ background: store.sync === 'synced' ? 'var(--pos)' : store.sync === 'syncing' ? 'var(--gold2)' : 'var(--ink3)' }} />
                  {store.sync === 'synced' ? 'Synced' : store.sync === 'syncing' ? 'Syncing…' : 'Offline'}
                </div>
              )}
              <div className="sem-cap">Semester</div>
              <div className="sem-name">{v.activeSemName}</div>
              <div className="sem-range">{v.semRange}</div>
            </div>
          </aside>

          {/* mobile header */}
          <header className="bz-mobilehdr">
            <div className="lhs"><img src="/bee-wallet.png" alt="" /><div className="nm">BuzzGet</div></div>
            <div className="sem">{v.activeSemName}</div>
          </header>

          <main className="bz-main bz-scroll">{screen}</main>

          {/* mobile bottom nav */}
          <nav className="bz-mobilenav">
            {NAV.map(([id, icon, label]) => (
              <button key={id} className={!isWelcome && tab === id ? 'on' : ''} onClick={() => go(id)}>
                <i className={`ti ${icon}`} /><span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
