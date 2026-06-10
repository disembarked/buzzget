import { useState, useEffect, useRef, useMemo } from 'react';

type Tab = 'wallet' | 'stats' | 'settings';
type View = 'daily' | 'weekly';
type TxType = 'spend' | 'add';
interface Tx { id: string; type: TxType; amount: number; note: string; date: string; ts: number; }
interface Preset { id: string; name: string; amount: number; }
interface Settings { total: number; startDate: string; endDate: string; semName: string; }
interface Brk { name: string; s: string; e: string; }
interface Sem { name: string; start: string; end: string; }

const GT_BREAKS: Brk[] = [
  { name: 'Labor Day',    s: '2025-09-01', e: '2025-09-01' },
  { name: 'Fall Break',   s: '2025-10-06', e: '2025-10-07' },
  { name: 'Thanksgiving', s: '2025-11-26', e: '2025-11-28' },
  { name: 'Winter Break', s: '2025-12-14', e: '2026-01-11' },
  { name: 'MLK Day',      s: '2026-01-19', e: '2026-01-19' },
  { name: 'Spring Break', s: '2026-03-23', e: '2026-03-27' },
  { name: 'Labor Day',    s: '2026-09-07', e: '2026-09-07' },
  { name: 'Fall Break',   s: '2026-10-05', e: '2026-10-06' },
  { name: 'Thanksgiving', s: '2026-11-24', e: '2026-11-27' },
  { name: 'Winter Break', s: '2026-12-18', e: '2027-01-10' },
];
const GT_SEMS: Sem[] = [
  { name: 'Fall 2025',   start: '2025-08-18', end: '2025-12-13' },
  { name: 'Spring 2026', start: '2026-01-12', end: '2026-05-08' },
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
const countActive = (a: string, b: string) => { let c = 0, d = pd(a), e = pd(b); while (d <= e) { if (!isBreak(ds(d))) c++; d.setDate(d.getDate() + 1); } return Math.max(c, 1); };

const LS = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v != null ? JSON.parse(v) : d; } catch { return d; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const DEFAULT_PRESETS: Preset[] = [
  { id: '1', name: 'Breakfast', amount: 8 },
  { id: '2', name: 'Lunch', amount: 12 },
  { id: '3', name: 'Dinner', amount: 15 },
  { id: '4', name: 'Snack', amount: 5 },
];

function DateField({ value, onChange, placeholder = 'Pick a date' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => value ? pd(value) : tod());
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (value) setView(pd(value)); }, [value]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const year = view.getFullYear(), month = view.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: { d: number; m: number; y: number; muted: boolean }[] = [];
  for (let i = startOffset - 1; i >= 0; i--) cells.push({ d: daysInPrev - i, m: month - 1, y: year, muted: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, m: month, y: year, muted: false });
  while (cells.length % 7 !== 0 || cells.length < 42) cells.push({ d: cells.length - daysInMonth - startOffset + 1, m: month + 1, y: year, muted: true });

  const todayStr = ds(tod());
  const dow = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="df" ref={wrapRef}>
      <button type="button" className={`df-trigger ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className={`df-val ${value ? '' : 'empty'}`}>{value ? pd(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : placeholder}</span>
        <i className="ti ti-calendar" />
      </button>
      {open && (
        <div className="cal">
          <div className="cal-hdr">
            <button type="button" className="cal-nav" onClick={() => setView(new Date(year, month - 1, 1))}><i className="ti ti-chevron-left" /></button>
            <div className="cal-title">{view.toLocaleDateString([], { month: 'long', year: 'numeric' })}</div>
            <button type="button" className="cal-nav" onClick={() => setView(new Date(year, month + 1, 1))}><i className="ti ti-chevron-right" /></button>
          </div>
          <div className="cal-grid">
            {dow.map((d, i) => <div key={i} className="cal-dow">{d}</div>)}
            {cells.map((c, i) => {
              const dt = new Date(c.y, c.m, c.d); dt.setHours(0, 0, 0, 0);
              const dstr = ds(dt);
              const sel = value === dstr;
              const isToday = todayStr === dstr;
              return (
                <button key={i} type="button" className={`cal-cell ${c.muted ? 'muted' : ''} ${isToday ? 'today' : ''} ${sel ? 'sel' : ''}`} onClick={() => { onChange(dstr); setOpen(false); }}>
                  {c.d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const fmt = (n: number) => '$' + Math.abs(n).toFixed(2);
const fmtT = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const fmtDL = (s: string) => {
  const d = pd(s), t = tod();
  if (s === ds(t)) return 'Today';
  const y = new Date(t); y.setDate(y.getDate() - 1);
  if (s === ds(y)) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
};
const wkLabel = (s: string) => {
  const d = pd(s); const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
  const we = new Date(ws); we.setDate(ws.getDate() + 6);
  return ws.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' – ' + we.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function App() {
  const [tab, setTab] = useState<Tab>('wallet');
  const [view, setView] = useState<View>('daily');
  const [selDate, setSelDate] = useState<string>(() => ds(tod()));
  const [settings, setSettings] = useState<Settings>(() => LS.get<Settings>('bz4_s', { total: 0, startDate: '', endDate: '', semName: '' }));
  const [tx, setTx] = useState<Tx[]>(() => LS.get<Tx[]>('bz4_tx', []));
  const [presets, setPresets] = useState<Preset[]>(() => LS.get<Preset[]>('bz4_p', DEFAULT_PRESETS));
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err'; show: boolean }>({ msg: '', type: 'ok', show: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => LS.set('bz4_s', settings), [settings]);
  useEffect(() => LS.set('bz4_tx', tx), [tx]);
  useEffect(() => LS.set('bz4_p', presets), [presets]);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type, show: true });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  const isSetup = settings.total > 0 && settings.startDate && settings.endDate;
  const tSpent = useMemo(() => tx.filter(t => t.type === 'spend').reduce((a, t) => a + t.amount, 0), [tx]);
  const tAdded = useMemo(() => tx.filter(t => t.type === 'add').reduce((a, t) => a + t.amount, 0), [tx]);
  const remBal = settings.total - tSpent + tAdded;
  const bpd = isSetup ? settings.total / countActive(settings.startDate, settings.endDate) : 0;
  const elapsedActive = isSetup ? (pd(settings.startDate) > tod() ? 0 : countActive(settings.startDate, ds(tod()))) : 0;
  const leftActive = isSetup ? (tod() > pd(settings.endDate) ? 0 : countActive(ds(tod()), settings.endDate)) : 0;
  const aheadBy = isSetup ? bpd * elapsedActive - tSpent : 0;
  const spentOn = (s: string) => tx.filter(t => t.type === 'spend' && t.date === s).reduce((a, t) => a + t.amount, 0);
  const txOn = (s: string) => tx.filter(t => t.date === s).sort((a, b) => b.ts - a.ts);
  const pct = settings.total > 0 ? Math.min(100, (tSpent / settings.total) * 100) : 0;

  const activeSemName = settings.semName || semForDate(ds(tod()))?.name || '';

  const shiftDate = (n: number) => {
    const dt = pd(selDate);
    if (view === 'daily') dt.setDate(dt.getDate() + n);
    else dt.setDate(dt.getDate() + n * 7);
    setSelDate(ds(dt));
  };

  const addTx = (type: TxType, amount: number, note: string) => {
    const now = new Date();
    setTx(prev => [...prev, {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      type, amount: parseFloat(amount.toFixed(2)), note, date: ds(now), ts: now.getTime(),
    }]);
  };
  const delTx = (id: string) => { setTx(prev => prev.filter(t => t.id !== id)); showToast('Removed', 'ok'); };

  const logPreset = (id: string) => {
    const p = presets.find(x => x.id === id); if (!p) return;
    if (p.amount > remBal + 0.001) { showToast(`Only ${fmt(remBal)} remaining`, 'err'); return; }
    addTx('spend', p.amount, p.name);
    showToast(`${p.name} — ${fmt(p.amount)}`, 'ok');
  };

  const [sNote, setSNote] = useState(''); const [sAmt, setSAmt] = useState('');
  const [aAmt, setAAmt] = useState('');
  const doSpend = () => {
    const amt = parseFloat(sAmt || '0');
    if (isNaN(amt) || amt <= 0) { showToast('Enter a valid amount', 'err'); return; }
    if (amt > remBal + 0.001) { showToast(`Only ${fmt(remBal)} remaining`, 'err'); return; }
    addTx('spend', amt, sNote.trim() || 'Dining');
    showToast(`Logged ${fmt(amt)}`, 'ok');
    setSNote(''); setSAmt('');
  };
  const doAdd = () => {
    const amt = parseFloat(aAmt || '0');
    if (isNaN(amt) || amt <= 0) { showToast('Enter a valid amount', 'err'); return; }
    addTx('add', amt, 'Funds added');
    showToast(`${fmt(amt)} added`, 'ok');
    setAAmt('');
  };

  const autoSem = useMemo(() => {
    const today = ds(tod());
    return semForDate(today) || GT_SEMS.find(s => s.start > today) || GT_SEMS[GT_SEMS.length - 1];
  }, []);

  const [cfgTotal, setCfgTotal] = useState<string>(() => settings.total ? String(settings.total) : '');

  const saveSett = () => {
    const total = parseFloat(cfgTotal || '0');
    if (!total || total <= 0) { showToast('Enter a starting balance', 'err'); return; }
    setSettings({ total, startDate: autoSem.start, endDate: autoSem.end, semName: autoSem.name });
    setTab('wallet');
    showToast(`Saved for ${autoSem.name}`, 'ok');
  };

  const [pName, setPName] = useState(''); const [pAmt, setPAmt] = useState('');
  const addPreset = () => {
    const amt = parseFloat(pAmt || '0');
    if (!pName.trim() || isNaN(amt) || amt <= 0) { showToast('Name and amount required', 'err'); return; }
    setPresets(prev => [...prev, { id: Date.now().toString(36), name: pName.trim(), amount: parseFloat(amt.toFixed(2)) }]);
    showToast(`${pName.trim()} added`, 'ok');
    setPName(''); setPAmt('');
  };
  const delPreset = (id: string) => setPresets(prev => prev.filter(p => p.id !== id));

  const resetAll = () => {
    if (!confirm('Delete all data and reset settings?')) return;
    setSettings({ total: 0, startDate: '', endDate: '', semName: '' });
    setTx([]); setPresets(DEFAULT_PRESETS); setTab('wallet');
  };

  const WELCOMES = ['Welcome', 'Chào mừng', '환영합니다', 'Bienvenido', 'Bienvenue', 'Bem-vindo', 'خوش آمدید', 'स्वागत है', 'ਜੀ ਆਇਆਂ ਨੂੰ', 'સ્વાગત છે',
                    '欢迎', 'Willkommen'];
  const [welIdx, setWelIdx] = useState(0);
  const [welAnim, setWelAnim] = useState(true);
  useEffect(() => {
    if (isSetup || tab !== 'wallet') return;
    const id = setInterval(() => {
      setWelAnim(false);
      setTimeout(() => {
        setWelIdx(i => (i + 1) % WELCOMES.length);
        setWelAnim(true);
      }, 280);
    }, 2200);
    return () => clearInterval(id);
  }, [isSetup, tab]);

  const Welcome = () => (
    <div className="wel">
      <div className="wel-title-wrap">
        <div key={welIdx} className={`wel-title ${welAnim ? 'in' : 'out'}`}>{WELCOMES[welIdx]}</div>
      </div>
      <button className="btn btn-gold" onClick={() => setTab('settings')}><i className="ti" />Start Tracking</button>
      <div className="wel-body">Visualize and Track your Dining Dollars</div>
    </div>
  );

  const Wallet = () => {
    const bal = remBal, ah = aheadBy, spent = spentOn(ds(tod())), rate = bpd;
    const dLeft = leftActive;
    const prog = pct;
    const isBrk = isBreak(selDate);
    const isToday = selDate === ds(tod());
    const selTx = txOn(selDate);
    const cb = curBreak(), nb = nxtBreak();
    const chartDays: { day: string; spent: number; isToday: boolean; brk: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(tod()); d.setDate(d.getDate() - i);
      const s = ds(d);
      chartDays.push({ day: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()], spent: spentOn(s), isToday: s === ds(tod()), brk: isBreak(s) });
    }
    const maxSp = Math.max(...chartDays.map(c => c.spent), 1);

    return (
      <>
        {cb && (
          <div className="break-banner">
            <i className="ti ti-calendar-off" aria-hidden="true" />
            <div>
              <div className="break-title">{cb.name}</div>
              <div className="break-sub">Break day — not counted in calculation. Resumes {new Date(pd(cb.e).getTime() + 86400000).toLocaleDateString([], { month: 'short', day: 'numeric' })}.</div>
            </div>
          </div>
        )}
        {!cb && nb && (
          <div className="break-banner" style={{ background: 'var(--gold-bg)', borderColor: 'var(--gold-bd)' }}>
            <i className="ti ti-calendar-event" aria-hidden="true" style={{ color: 'var(--gold)' }} />
            <div>
              <div className="break-title" style={{ color: 'var(--gold)' }}>{nb.name} — {pd(nb.s).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
              <div className="break-sub">Next Academic Break</div>
            </div>
          </div>
        )}
        <div className="dtoggle">
          <button className={`dtoggle-btn ${view === 'daily' ? 'on' : ''}`} onClick={() => setView('daily')}><i className="ti ti-calendar-day" />Daily</button>
          <button className={`dtoggle-btn ${view === 'weekly' ? 'on' : ''}`} onClick={() => setView('weekly')}><i className="ti ti-calendar-day" />Weekly</button>
        </div>
        <div className="dnav">
          <button className="dnav-arrow" onClick={() => shiftDate(-1)}><i className="ti ti-chevron-left" /></button>
          <div style={{ textAlign: 'center' }}>
            <div className="dnav-date">{view === 'daily' ? fmtDL(selDate) : wkLabel(selDate)}</div>
            <div className="dnav-sub">{view === 'daily' ? (isBrk ? 'Academic Break' : 'Active day') : 'Weekly view'}</div>
          </div>
          <button className="dnav-arrow" onClick={() => shiftDate(1)}><i className="ti ti-chevron-right" /></button>
        </div>
        {!isToday && (
          <button className="jump-today" onClick={() => setSelDate(ds(tod()))}>
            <i className="ti ti-arrow-back-up" />Jump to Today
          </button>
        )}
        <div className="card">
          <div className="bal-label">Remaining balance</div>
          <div className={`bal-amount ${bal < 0 ? 'warn' : ''}`}>{fmt(bal)}</div>
          <div className={`pace-pill ${ah >= 0 ? 'ok' : 'behind'}`}>
            <i className={`ti ${ah >= 0 ? 'ti-trending-up' : 'ti-trending-down'}`} />
            {fmt(Math.abs(ah))} {ah >= 0 ? 'Ahead' : 'Behind'}
          </div>
          <div className="stat-row">
            <div className="stat"><div className="stat-lbl">Today</div><div className="stat-val r">{fmt(spent)}</div></div>
            <div className="stat"><div className="stat-lbl">Daily Rate</div><div className="stat-val g">{fmt(rate)}</div></div>
            <div className="stat"><div className="stat-lbl">Days Left</div><div className="stat-val">{dLeft}</div></div>
          </div>
          <div className="prog-wrap">
            <div className="prog-labels"><span>Budget Used</span><span>{prog.toFixed(0)}%</span></div>
            <div className="prog-track"><div className={`prog-fill ${prog > 90 ? 'danger' : ''}`} style={{ width: prog.toFixed(1) + '%' }} /></div>
          </div>
        </div>
        <div className="card">
          <div className="sec-hdr"><span className="sec-title">7-day Activity</span></div>
          <div className="chart-wrap">
            {(() => {
              const order = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
              return [...chartDays].sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day));
            })().map((c, i) => (
              <div key={i} className="bar-col">
                <div className={`bar-fill ${c.isToday ? 'hi' : ''} ${c.brk ? 'brk' : ''}`} style={{ height: (c.brk ? 4 : Math.round((c.spent / maxSp) * 50) + 3) + 'px' }} />
                <div className="bar-day" style={c.isToday ? { color: 'var(--gold)', fontWeight: 600 } : undefined}>{c.day}</div>
              </div>
            ))}
          </div>
        </div>
        {isToday && !isBrk && (
          <>
            <div className="sec-hdr" style={{ marginBottom: 7 }}><span className="sec-title">Quick Log</span></div>
            <div className="presets-grid">
              {presets.map(p => (
                <button key={p.id} className="preset" onClick={() => logPreset(p.id)}>
                  <div className="preset-name">{p.name}</div>
                  <div className="preset-amt">{fmt(p.amount)}</div>
                </button>
              ))}
            </div>
            <div className="card">
              <div className="sec-hdr"></div>
              <div className="inp-row">
                <div className="form-grp" style={{ flex: 1.3 }}><label className="form-lbl">Note</label><input className="inp" type="text" name="spend-note" placeholder="What did you eat?" value={sNote} onChange={e => setSNote(e.target.value)} style={{ background: 'rgba(0,0,0,0.18)', borderColor: 'var(--gold-bd)', color: 'var(--gold2)' }} /></div>
                <div className="form-grp" style={{ flex: 0.8 }}><label className="form-lbl">Amount</label><input className="inp" type="number" placeholder="0.00" min="0" step="0.01" value={sAmt} onChange={e => setSAmt(e.target.value)} style={{ background: 'rgba(0,0,0,0.18)', borderColor: 'var(--gold-bd)', color: 'var(--gold2)' }} /></div>
              </div>
              <button className="btn btn-gold" onClick={doSpend}><i className="ti" />Log Spending</button>
            </div>
            <div className="card">
              <div className="sec-hdr"></div>
              <div className="form-grp"><input className="inp" type="number" placeholder="Add Funds" min="0" step="0.01" value={aAmt} onChange={e => setAAmt(e.target.value)} style={{ background: 'rgba(0,0,0,0.18)', borderColor: 'var(--gold-bd)', color: 'var(--gold2)' }}/></div>
              <button className="btn btn-gold" onClick={doAdd}><i className="ti" />Add Funds</button>
            </div>
          </>
        )}
        <div className="card">
          <div className="sec-hdr">
            <span className="sec-title">{isToday ? 'Today' : 'Transactions'}</span>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>{selTx.length} item{selTx.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="tx-list">
            {selTx.length === 0 ? (
              <div className="tx-empty">{isToday ? (isBrk ? 'Break day — No transactions' : 'Nothing logged yet') : 'No transactions for this date'}</div>
            ) : (
              selTx.map(t => (
                <div key={t.id} className="tx">
                  <div className={`tx-ico ${t.type}`}><i className={`ti ti-${t.type === 'spend' ? 'arrow-down' : 'arrow-up'}`} /></div>
                  <div className="tx-info"><div className="tx-note">{t.note || 'No note'}</div><div className="tx-time">{fmtT(t.ts)}</div></div>
                  <div className={`tx-amt ${t.type}`}>{t.type === 'spend' ? '-' : '+'}{fmt(t.amount)}</div>
                  <button className="tx-del" onClick={() => delTx(t.id)} title="Delete"><i className="ti ti-trash" /></button>
                </div>
              ))
            )}
          </div>
        </div>
      </>
    );
  };

  const Stats = () => {
    const bal = remBal, ts = tSpent, dLeft = leftActive;
    const el = elapsedActive;
    const avg = el > 0 ? ts / el : 0;
    const txSp = tx.filter(t => t.type === 'spend');
    const weeks: { l: string; v: number; cur: boolean }[] = [];
    for (let w = 3; w >= 0; w--) {
      const ws = new Date(tod()); ws.setHours(0, 0, 0, 0); ws.setDate(ws.getDate() - ws.getDay() - w * 7);
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      const sp = tx.filter(t => t.type === 'spend' && t.date >= ds(ws) && t.date <= ds(we)).reduce((a, t) => a + t.amount, 0);
      const sameMonth = ws.getMonth() === we.getMonth();
      const l = sameMonth
        ? `${ws.toLocaleDateString([], { month: 'short', day: 'numeric' })}–${we.getDate()}`
        : `${ws.toLocaleDateString([], { month: 'short', day: 'numeric' })}–${we.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
      weeks.push({ l, v: sp, cur: w === 0 });
    }
    const maxW = Math.max(...weeks.map(w => w.v), 1);

    return (
      <>
        <div className="stats-grid">
          <div className="sc"><div className="sc-lbl">Total Spent</div><div className="sc-val">{fmt(ts)}</div><div className="sc-sub">of{fmt(settings.total)}</div></div>
          <div className="sc"><div className="sc-lbl">Remaining</div><div className="sc-val" style={{ color: bal >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(bal)}</div><div className="sc-sub">{dLeft} days left</div></div>
          <div className="sc"><div className="sc-lbl">Avg / Active day</div><div className="sc-val">{fmt(avg)}</div><div className="sc-sub">Budget{fmt(bpd)}/Day</div></div>
          <div className="sc"><div className="sc-lbl">Logged Meals</div><div className="sc-val">{txSp.length}</div><div className="sc-sub">Transactions</div></div>
        </div>
        <div className="card">
          <div className="sec-hdr"><span className="sec-title">Weekly Spending</span></div>
          <div className="chart-wrap" style={{ height: 70 }}>
            {weeks.map((w, i) => (
              <div key={i} className="bar-col">
                <div className={`bar-fill ${w.cur ? 'hi' : ''}`} style={{ height: Math.round((w.v / maxW) * 60) + 3 + 'px' }} />
                <div className="bar-day" style={w.cur ? { color: 'var(--gold)', fontWeight: 600 } : undefined}>{w.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 2 }}>
            {weeks.map((w, i) => <div key={i} style={{ fontSize: 9.5, color: 'var(--text3)', textAlign: 'center' }}>{fmt(w.v)}</div>)}
          </div>
        </div>
        {txSp.length > 0 && (
          <div className="card">
            <div className="sec-hdr"><span className="sec-title">Top Expenses</span></div>
            <div className="tx-list">
              {[...txSp].sort((a, b) => b.amount - a.amount).slice(0, 10).map(t => (
                <div key={t.id} className="tx">
                  <div className="tx-ico spend"><i className="ti ti-arrow-down" /></div>
                  <div className="tx-info"><div className="tx-note">{t.note || 'No note'}</div><div className="tx-time">{t.date}</div></div>
                  <div className="tx-amt spend">-{fmt(t.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="card">
          <div className="sec-hdr"><span className="sec-title">Academic Breaks</span></div>
          {GT_BREAKS.filter(b => b.e >= ds(tod())).slice(0, 6).map((b, i) => {
            const s = ds(tod());
            const active = s >= b.s && s <= b.e, past = b.e < s;
            return (
              <div key={i} className="sett-row">
                <div>
                  <div className="sett-lbl">{b.name}</div>
                  <div className="sett-sub">{pd(b.s).toLocaleDateString([], { month: 'short', day: 'numeric' })}{b.s !== b.e ? ' – ' + pd(b.e).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}</div>
                </div>
                <span className={`badge ${active ? 'badge-active' : past ? 'badge-past' : 'badge-upcoming'}`}>{active ? 'Active' : past ? 'Past' : 'Upcoming'}</span>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const Settings = () => (
    <>
      <div className="card">
        
        <div className="form-grp"><label className="form-lbl">Starting Balance ($)</label>
          <input className="inp" type="number" placeholder="e.g. 788" value={cfgTotal} onChange={e => setCfgTotal(e.target.value)} min="0" step="1" /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
          <input type="checkbox" id="cfg-auto" defaultChecked style={{ width: 14, height: 14 }} />
          <label htmlFor="cfg-auto" style={{ fontSize: 12, cursor: 'pointer', color: 'var(--text2)' }}>Exclude Academic Breaks from Calculations</label>
        </div>
        <button className="btn btn-gold" onClick={saveSett}><i className="ti" />Save Settings</button>
      </div>
      <div className="card">
        <div className="sec-hdr"><span className="sec-title">Current Semester</span></div>
        <div className="sett-row">
          <div>
            <div className="sett-lbl">{autoSem.name}</div>
            <div className="sett-sub">{pd(autoSem.start).toLocaleDateString([], { month: 'short', day: 'numeric' })} – {pd(autoSem.end).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
          </div>
          <span className="badge badge-active">Auto</span>
        </div>
      </div>
      <div className="card">
        <div className="sec-hdr"><span className="sec-title">Meal Presets</span></div>
        <div className="preset-list" style={presets.length > 5 ? { maxHeight: 220, overflowY: 'auto' } : undefined}>
          {presets.map(p => (
            <div key={p.id} className="sett-row">
              <div><div className="sett-lbl">{p.name}</div><div className="sett-sub">{fmt(p.amount)}</div></div>
              <button className="btn btn-danger btn-sm" onClick={() => delPreset(p.id)}><i className="ti ti-trash" /></button>
            </div>
          ))}
        </div>
        <div className="divider" />
        <div className="inp-row">
          <div className="form-grp" style={{ flex: 1.4 }}><input className="inp" type="text" placeholder="Name" autoComplete="off" value={pName} onChange={e => setPName(e.target.value)} style={{ background: 'rgba(0,0,0,0.18)', borderColor: 'var(--gold-bd)', color: 'var(--gold2)' }}/></div>
          <div className="form-grp" style={{ flex: 0.8 }}><input className="inp" type="number" placeholder="$" min="0" step="0.01" value={pAmt} onChange={e => setPAmt(e.target.value)} style={{ background: 'rgba(0,0,0,0.18)', borderColor: 'var(--gold-bd)', color: 'var(--gold2)' }}/></div>
        </div>
        <button className="btn btn-gold" onClick={addPreset}><i className="ti" />Add Preset</button>
      </div>
      <div className="card">
        <div className="sec-hdr"><span className="sec-title">Data</span></div>
        <button className="btn btn-danger" onClick={resetAll}><i className="ti ti-trash" />Reset all data</button>
      </div>
    </>
  );

  const showWelcome = !isSetup && tab === 'wallet';
  const navTabs: [Tab, string, string][] = [['wallet', 'ti-wallet', 'Wallet'], ['stats', 'ti-chart-bar', 'Stats'], ['settings', 'ti-settings', 'Settings']];

  return (
    <div className="outer">
      <div className="shell">
        <div className={`toast ${toast.show ? 'show' : ''} ${toast.type}`}>
          <i className={`ti ${toast.type === 'ok' ? 'ti-check' : 'ti-alert-circle'}`} />{toast.msg}
        </div>
        <div className="hdr">
          <div className="hdr-left">
            <div className="logo"><i className="ti ti-cash" aria-hidden="true" /></div>
          </div>
          {activeSemName
            ? <div className="sem-badge">{activeSemName}</div>
            : <div className="sem-badge" style={{ opacity: 0 }}>—</div>}
        </div>
        <div className="scroll-area">
          {showWelcome
            ? <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Welcome()}</div>
            : tab === 'wallet' ? Wallet() : tab === 'stats' ? Stats() : Settings()}
        </div>
        <nav className="bnav">
          {navTabs.map(([id, ic, lb]) => (
            <button key={id} className={`bnav-btn ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
              <i className={`ti ${ic}`} aria-hidden="true" /><span className="bnav-label">{lb}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
