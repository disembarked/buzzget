/**
 * Buzzget — GT Dining Dollars Tracker
 */

const STORAGE_KEYS = {
  TOTAL: 'gt_dining_total',
  START_DATE: 'gt_dining_start_date',
  END_DATE: 'gt_dining_end_date',
  SEMESTER: 'gt_dining_semester',
  MEALS_PER_WEEK: 'gt_dining_meals_per_week',
  BREAKS: 'gt_dining_breaks',
  TRANSACTIONS: 'gt_dining_transactions',
  PRESETS: 'gt_dining_presets',
  LAST_VISIT_DATE: 'gt_dining_last_visit',
};

// DOM
const currentSpendEl = document.getElementById('current-spend');
const budgetContextEl = document.getElementById('budget-context');
const statusBadgeEl = document.getElementById('status-badge');
const remainingBalanceEl = document.getElementById('remaining-balance');
const daysLeftEl = document.getElementById('days-left');
const aheadInlineEl = document.getElementById('ahead-inline');
const spendAmountInput = document.getElementById('spend-amount');
const spendNoteInput = document.getElementById('spend-note');
const addAmountInput = document.getElementById('add-amount');
const logSpendBtn = document.getElementById('log-spend');
const addFundsBtn = document.getElementById('add-funds');
const totalDollarsInput = document.getElementById('total-dollars');
const endDateInput = document.getElementById('end-date');
const mealsPerWeekSelect = document.getElementById('meals-per-week');
const semesterSelect = document.getElementById('semester');
const breakStartInput = document.getElementById('break-start');
const breakEndInput = document.getElementById('break-end');
const addBreakBtn = document.getElementById('add-break');
const breaksListEl = document.getElementById('breaks-list');
const saveBudgetBtn = document.getElementById('save-budget');
const resetBudgetBtn = document.getElementById('reset-budget');
const transactionList = document.getElementById('transaction-list');
const walletVisual = document.getElementById('wallet-visual');
const presetChipsEl = document.getElementById('preset-chips');
const savePresetBtn = document.getElementById('save-preset');
const presetsListEl = document.getElementById('presets-list');
const presetNameInput = document.getElementById('preset-name');
const presetAmountInput = document.getElementById('preset-amount');
const addPresetBtn = document.getElementById('add-preset');

// Tab switching
document.querySelectorAll('.tab').forEach((t) => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('tab-' + t.dataset.tab).classList.add('active');
    if (t.dataset.tab === 'stats') renderStats();
  });
});

// Wallet animation: money out (spend)
function playMoneyOut() {
  if (!walletVisual) return;
  walletVisual.classList.remove('money-in');
  walletVisual.classList.add('money-out');
  setTimeout(() => walletVisual.classList.remove('money-out'), 800);
}

// Wallet animation: money in (add)
function playMoneyIn() {
  if (!walletVisual) return;
  walletVisual.classList.remove('money-out');
  walletVisual.classList.add('money-in');
  setTimeout(() => walletVisual.classList.remove('money-in'), 800);
}

function applySemester(id) {
  if (typeof GT_ACADEMIC_CALENDAR === 'undefined') return;
  const s = GT_ACADEMIC_CALENDAR.find((x) => x.id === id);
  if (s) {
    endDateInput.value = s.endDate;
    const breaks = (s.breaks || []).map((b) => ({ start: b.start, end: b.end, name: b.name || '' }));
    localStorage.setItem(STORAGE_KEYS.BREAKS, JSON.stringify(breaks));
    if (breaksListEl) renderBreaks(breaks);
  }
}

function setDefaultEndDate() {
  const d = new Date();
  const m = d.getMonth();
  const y = d.getFullYear();
  endDateInput.value = m < 5 ? `${y}-05-07` : `${y}-12-15`;
}

function getBreaks() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.BREAKS) || '[]');
}

function loadData() {
  const total = parseFloat(localStorage.getItem(STORAGE_KEYS.TOTAL));
  const endDate = localStorage.getItem(STORAGE_KEYS.END_DATE);
  const meals = localStorage.getItem(STORAGE_KEYS.MEALS_PER_WEEK);
  const breaksJson = localStorage.getItem(STORAGE_KEYS.BREAKS);

  if (!isNaN(total) && total > 0) totalDollarsInput.value = total;
  if (endDate) endDateInput.value = endDate;
  else setDefaultEndDate();
  if (semesterSelect) semesterSelect.value = localStorage.getItem(STORAGE_KEYS.SEMESTER) || '';
  if (meals) mealsPerWeekSelect.value = meals;
  else mealsPerWeekSelect.value = '7';
  if (breaksJson) renderBreaks(JSON.parse(breaksJson));
}

function saveBudget() {
  const total = parseFloat(totalDollarsInput.value);
  const endDate = endDateInput.value;
  if (!total || total <= 0) {
    alert('Enter a valid total.');
    return;
  }
  if (!endDate) {
    alert('Select an end date.');
    return;
  }

  const existingStart = localStorage.getItem(STORAGE_KEYS.START_DATE);
  if (!existingStart) {
    localStorage.setItem(STORAGE_KEYS.START_DATE, new Date().toISOString().slice(0, 10));
  }

  localStorage.setItem(STORAGE_KEYS.TOTAL, total.toString());
  localStorage.setItem(STORAGE_KEYS.END_DATE, endDate);
  localStorage.setItem(STORAGE_KEYS.MEALS_PER_WEEK, mealsPerWeekSelect.value);
  localStorage.setItem(STORAGE_KEYS.SEMESTER, semesterSelect?.value || '');
  localStorage.setItem(STORAGE_KEYS.BREAKS, JSON.stringify(getBreaks()));

  updateDisplay();
}

function resetBudget() {
  if (!confirm('Reset everything? This clears all transactions and settings.')) return;
  localStorage.removeItem(STORAGE_KEYS.TOTAL);
  localStorage.removeItem(STORAGE_KEYS.START_DATE);
  localStorage.removeItem(STORAGE_KEYS.END_DATE);
  localStorage.removeItem(STORAGE_KEYS.SEMESTER);
  localStorage.removeItem(STORAGE_KEYS.MEALS_PER_WEEK);
  localStorage.removeItem(STORAGE_KEYS.BREAKS);
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.PRESETS);
  totalDollarsInput.value = '';
  endDateInput.value = '';
  setDefaultEndDate();
  loadData();
  updateDisplay();
}

function addBreak() {
  const start = breakStartInput?.value;
  const end = breakEndInput?.value;
  if (!start || !end) {
    alert('Select start and end dates.');
    return;
  }
  const breaks = getBreaks();
  breaks.push({ start, end });
  localStorage.setItem(STORAGE_KEYS.BREAKS, JSON.stringify(breaks));
  renderBreaks(breaks);
  breakStartInput.value = '';
  breakEndInput.value = '';
  updateDisplay();
}

function removeBreak(i) {
  const breaks = getBreaks();
  breaks.splice(i, 1);
  localStorage.setItem(STORAGE_KEYS.BREAKS, JSON.stringify(breaks));
  renderBreaks(breaks);
  updateDisplay();
}

function renderBreaks(breaks) {
  if (!breaksListEl) return;
  if (!breaks?.length) {
    breaksListEl.innerHTML = '';
    return;
  }
  breaksListEl.innerHTML = breaks
    .map(
      (b, i) =>
        `<div class="break-item"><span>${(b.name || '')} ${formatBreakDate(b.start)}–${formatBreakDate(b.end)}</span>
         <button class="btn-icon" data-remove="${i}">✕</button></div>`
    )
    .join('');
  breaksListEl.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => removeBreak(parseInt(btn.dataset.remove, 10)));
  });
}

function formatBreakDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Balance = total + adds - spends
function getRemainingBalance() {
  const total = parseFloat(localStorage.getItem(STORAGE_KEYS.TOTAL)) || 0;
  const tx = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
  let balance = total;
  tx.forEach((t) => {
    const amt = parseFloat(t.amount) || 0;
    if (t.type === 'add') balance += amt;
    else balance -= amt; // spend (default)
  });
  return Math.max(0, balance);
}

// Sum of spend transactions only
function getTotalSpent() {
  const tx = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
  return tx.filter((t) => t.type !== 'add').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
}

function countEatingDays(startStr, endStr) {
  const breaks = getBreaks();
  let days = 0;
  const cur = new Date(startStr);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(endStr);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    const inBreak = breaks.some((b) => {
      const s = new Date(b.start);
      const e = new Date(b.end);
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return cur >= s && cur <= e;
    });
    if (!inBreak) days++;
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function getEatingDaysRemaining() {
  const endStr = localStorage.getItem(STORAGE_KEYS.END_DATE);
  if (!endStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endStr);
  if (today > end) return 0;
  return countEatingDays(today.toISOString().slice(0, 10), endStr);
}

function getBudgetStartDate() {
  return localStorage.getItem(STORAGE_KEYS.START_DATE) || new Date().toISOString().slice(0, 10);
}

function getTotalEatingDays() {
  const start = getBudgetStartDate();
  const end = localStorage.getItem(STORAGE_KEYS.END_DATE);
  if (!end) return 0;
  if (new Date(start) > new Date(end)) return 0;
  return countEatingDays(start, end);
}

function getEatingDaysElapsed() {
  const start = getBudgetStartDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday < new Date(start)) return 0;
  return countEatingDays(start, yesterday.toISOString().slice(0, 10));
}

function getBudgetPerMeal() {
  const remaining = getRemainingBalance();
  const daysLeft = getEatingDaysRemaining();
  const mealsPerWeek = parseInt(localStorage.getItem(STORAGE_KEYS.MEALS_PER_WEEK) || '7', 10);
  const mealsLeft = daysLeft * (mealsPerWeek / 7);
  return mealsLeft <= 0 ? 0 : remaining / mealsLeft;
}

function getAheadBy() {
  const total = parseFloat(localStorage.getItem(STORAGE_KEYS.TOTAL)) || 0;
  const mealsPerWeek = parseInt(localStorage.getItem(STORAGE_KEYS.MEALS_PER_WEEK) || '7', 10);
  const totalDays = getTotalEatingDays();
  const elapsed = getEatingDaysElapsed();
  const spent = getTotalSpent();

  if (!total || totalDays <= 0) return 0;
  const totalMeals = totalDays * (mealsPerWeek / 7);
  const mealsElapsed = elapsed * (mealsPerWeek / 7);
  const perMeal = total / totalMeals;
  const expected = mealsElapsed * perMeal;
  return expected - spent;
}

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

let lastBudget = 0;

// Show "new day" hint when user opens app on a new day (ahead increases automatically)
function checkNewDay() {
  const today = new Date().toISOString().slice(0, 10);
  const lastVisit = localStorage.getItem(STORAGE_KEYS.LAST_VISIT_DATE);
  localStorage.setItem(STORAGE_KEYS.LAST_VISIT_DATE, today);
  const hintEl = document.getElementById('new-day-hint');
  if (!hintEl) return;
  if (!lastVisit || lastVisit === today) {
    hintEl.hidden = true;
    return;
  }
  const perMeal = getBudgetPerMeal();
  const mealsPerWeek = parseInt(localStorage.getItem(STORAGE_KEYS.MEALS_PER_WEEK) || '7', 10);
  const mealsPerDay = mealsPerWeek / 7;
  const dayBudget = perMeal * mealsPerDay;
  if (dayBudget > 0.01) {
    hintEl.textContent = 'New day! +' + formatCurrency(dayBudget) + ' added to your ahead (saved from yesterday).';
    hintEl.hidden = false;
    setTimeout(() => (hintEl.hidden = true), 5000);
  }
}

function updateDisplay() {
  const remaining = getRemainingBalance();
  const daysLeft = getEatingDaysRemaining();
  const perMeal = getBudgetPerMeal();
  const aheadBy = getAheadBy();
  const isAhead = aheadBy > 0.5;
  const isBehind = aheadBy < -0.5;

  if (currentSpendEl) currentSpendEl.textContent = formatCurrency(perMeal);
  if (budgetContextEl) budgetContextEl.textContent = 'per meal';
  if (statusBadgeEl) {
    statusBadgeEl.textContent = isAhead ? 'Ahead' : isBehind ? 'Behind' : 'On track';
    statusBadgeEl.className = 'hero-meta ' + (isAhead ? 'ahead' : isBehind ? 'behind' : 'on-track');
  }
  if (perMeal > lastBudget && lastBudget > 0 && currentSpendEl) {
    currentSpendEl.classList.add('boosted');
    setTimeout(() => currentSpendEl.classList.remove('boosted'), 400);
  }
  lastBudget = perMeal;

  if (aheadInlineEl) {
    aheadInlineEl.textContent = (aheadBy >= 0 ? 'Ahead ' : 'Behind ') + formatCurrency(Math.abs(aheadBy));
    aheadInlineEl.className = 'ahead-inline' + (aheadBy < 0 ? ' behind' : '');
  }
  if (remainingBalanceEl) remainingBalanceEl.textContent = formatCurrency(remaining);
  if (daysLeftEl) daysLeftEl.textContent = daysLeft;

  renderTransactions();
  renderBreaks(getBreaks());
  renderPresetChips();
}

// Meal presets
function getPresets() {
  try {
    const j = localStorage.getItem(STORAGE_KEYS.PRESETS);
    return j ? JSON.parse(j) : [];
  } catch {
    return [];
  }
}

function savePresets(presets) {
  localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
}

function addPreset(name, amount) {
  const n = String(name || '').trim();
  const a = parseFloat(amount);
  if (!n || !a || a <= 0) return;
  const presets = getPresets();
  if (presets.some((p) => p.name.toLowerCase() === n.toLowerCase())) return;
  presets.push({ id: Date.now().toString(), name: n, amount: a });
  savePresets(presets);
  presetNameInput.value = '';
  presetAmountInput.value = '';
  renderPresetChips();
  renderPresetsList();
}

function removePreset(id) {
  const presets = getPresets().filter((p) => p.id !== id);
  savePresets(presets);
  renderPresetChips();
  renderPresetsList();
}

function renderPresetChips() {
  if (!presetChipsEl) return;
  const presets = getPresets();
  if (!presets.length) {
    presetChipsEl.innerHTML = '<span class="preset-empty">No presets yet. Save a meal in Settings or below.</span>';
    return;
  }
  presetChipsEl.innerHTML = presets
    .map(
      (p) =>
        `<button type="button" class="preset-chip" data-id="${p.id}">
          ${escapeHtml(p.name)}<span class="chip-amount">${formatCurrency(p.amount)}</span>
        </button>`
    )
    .join('');
  presetChipsEl.querySelectorAll('.preset-chip').forEach((btn) => {
    const preset = presets.find((p) => p.id === btn.dataset.id);
    if (preset) {
      btn.addEventListener('click', () => {
        spendAmountInput.value = preset.amount;
        spendNoteInput.value = preset.name;
      });
    }
  });
}

function renderPresetsList() {
  if (!presetsListEl) return;
  const presets = getPresets();
  if (!presets.length) {
    presetsListEl.innerHTML = '';
    return;
  }
  presetsListEl.innerHTML = presets
    .map(
      (p) =>
        `<div class="preset-list-item">
          <span>${escapeHtml(p.name)} — ${formatCurrency(p.amount)}</span>
          <button type="button" class="btn-icon" data-remove-preset="${p.id}">✕</button>
        </div>`
    )
    .join('');
  presetsListEl.querySelectorAll('[data-remove-preset]').forEach((btn) => {
    btn.addEventListener('click', () => removePreset(btn.dataset.removePreset));
  });
}

function saveCurrentAsPreset() {
  const note = (spendNoteInput?.value || '').trim();
  const amount = parseFloat(spendAmountInput?.value);
  if (!note || !amount || amount <= 0) {
    alert('Enter amount and note first, then save.');
    return;
  }
  addPreset(note, amount);
}

function logSpending() {
  const amount = parseFloat(spendAmountInput?.value);
  const note = (spendNoteInput?.value || 'Purchase').trim();

  if (!amount || amount <= 0) {
    alert('Enter a valid amount.');
    return;
  }

  const remaining = getRemainingBalance();
  if (amount > remaining && !confirm(`You only have ${formatCurrency(remaining)}. Log anyway?`)) return;

  const tx = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
  tx.unshift({
    id: Date.now().toString(),
    type: 'spend',
    amount,
    note,
    date: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(tx));

  const savedNote = note;
  const savedAmount = amount;
  spendAmountInput.value = '';
  spendNoteInput.value = '';
  playMoneyOut();
  updateDisplay();
  renderPresetChips();

  // Suggest preset if bought same thing 2+ times and not already saved
  const tx = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
  const spends = tx.filter((t) => t.type !== 'add');
  const sameNote = spends.filter((t) => (t.note || '').toLowerCase() === savedNote.toLowerCase());
  const presets = getPresets();
  const alreadyPreset = presets.some((p) => p.name.toLowerCase() === savedNote.toLowerCase());
  if (sameNote.length >= 2 && !alreadyPreset && confirm(`Save "${savedNote}" (${formatCurrency(savedAmount)}) as a preset for quick add?`)) {
    addPreset(savedNote, savedAmount);
  }
}

function addFunds() {
  const amount = parseFloat(addAmountInput?.value);
  if (!amount || amount <= 0) {
    alert('Enter a valid amount to add.');
    return;
  }

  const tx = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
  tx.unshift({
    id: Date.now().toString(),
    type: 'add',
    amount,
    note: 'Added funds',
    date: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(tx));

  addAmountInput.value = '';
  playMoneyIn();
  updateDisplay();
}

function deleteTransaction(id) {
  const tx = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(tx.filter((t) => t.id !== id)));
  updateDisplay();
  renderStats();
}

function renderTransactions() {
  const tx = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');

  if (tx.length === 0) {
    transactionList.innerHTML = '<li class="empty-state">No transactions yet.</li>';
    return;
  }

  transactionList.innerHTML = tx
    .map(
      (t) => {
        const amt = parseFloat(t.amount) || 0;
        const isAdd = t.type === 'add';
        return `<li class="tx-item ${isAdd ? 'tx-add' : 'tx-spend'}">
          <div>
            <span class="tx-amount">${isAdd ? '+' : '-'}${formatCurrency(amt)}</span>
            <span class="tx-note">${escapeHtml(t.note)}</span>
            <span class="tx-date">${formatDate(t.date)}</span>
          </div>
          <button class="btn-icon" data-delete="${t.id}">✕</button>
        </li>`;
      }
    )
    .join('');

  transactionList.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => deleteTransaction(btn.dataset.delete));
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function escapeHtml(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

// Stats tab
function renderStats() {
  const tx = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]').filter((t) => t.type !== 'add');
  const emptyEl = document.getElementById('stats-empty');
  const topFoodsEl = document.getElementById('top-foods-chart');
  const dayChartEl = document.getElementById('day-chart');
  const overviewEl = document.getElementById('spend-overview');

  const statCards = document.querySelectorAll('#tab-stats .stat-card:not(.empty-state)');
  if (tx.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    statCards.forEach((c) => (c.style.display = 'none'));
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';
  statCards.forEach((c) => (c.style.display = 'block'));

  // Top foods by note
  const foodCount = {};
  tx.forEach((t) => {
    const n = (t.note || 'Unknown').trim() || 'Unknown';
    if (!foodCount[n]) foodCount[n] = { count: 0, total: 0 };
    foodCount[n].count++;
    foodCount[n].total += parseFloat(t.amount) || 0;
  });
  const topFoods = Object.entries(foodCount)
    .map(([name, d]) => ({ name, count: d.count, total: d.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const maxTotal = Math.max(...topFoods.map((f) => f.total), 1);

  if (topFoodsEl) {
    topFoodsEl.innerHTML = topFoods
      .map(
        (f) =>
          `<div class="bar-row">
            <span class="bar-label">${escapeHtml(f.name)}</span>
            <div class="bar-wrap"><div class="bar-fill" style="width:${(f.total / maxTotal) * 100}%"></div></div>
            <span class="bar-value">${formatCurrency(f.total)}</span>
          </div>`
      )
      .join('');
  }

  // By day of week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDay = [0, 0, 0, 0, 0, 0, 0];
  tx.forEach((t) => {
    const d = new Date(t.date).getDay();
    byDay[d] += parseFloat(t.amount) || 0;
  });
  const maxDay = Math.max(...byDay, 1);

  if (dayChartEl) {
    dayChartEl.innerHTML = dayNames
      .map(
        (name, i) =>
          `<div class="day-row">
            <span class="day-label">${name}</span>
            <div class="day-bar-wrap"><div class="day-bar" style="width:${(byDay[i] / maxDay) * 100}%"></div></div>
            <span class="day-value">${formatCurrency(byDay[i])}</span>
          </div>`
      )
      .join('');
  }

  // Overview
  const totalSpent = tx.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const remaining = getRemainingBalance();
  const total = parseFloat(localStorage.getItem(STORAGE_KEYS.TOTAL)) || 0;
  if (overviewEl) {
    overviewEl.innerHTML = `
      <div class="overview-row"><span>Total budget</span><span>${formatCurrency(total)}</span></div>
      <div class="overview-row"><span>Spent</span><span class="spent">${formatCurrency(totalSpent)}</span></div>
      <div class="overview-row"><span>Remaining</span><span class="remaining">${formatCurrency(remaining)}</span></div>
    `;
  }
}

// Events
saveBudgetBtn?.addEventListener('click', saveBudget);
resetBudgetBtn?.addEventListener('click', resetBudget);
logSpendBtn?.addEventListener('click', logSpending);
addFundsBtn?.addEventListener('click', addFunds);
addBreakBtn?.addEventListener('click', addBreak);
savePresetBtn?.addEventListener('click', saveCurrentAsPreset);
addPresetBtn?.addEventListener('click', () => addPreset(presetNameInput?.value, presetAmountInput?.value));
semesterSelect?.addEventListener('change', () => {
  const id = semesterSelect.value;
  if (id) {
    localStorage.setItem(STORAGE_KEYS.SEMESTER, id);
    applySemester(id);
  }
});

loadData();
updateDisplay();
checkNewDay();
renderPresetChips();
renderPresetsList();
