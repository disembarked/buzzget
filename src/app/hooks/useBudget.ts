import { useState, useEffect, useCallback } from 'react';
import { Transaction, BudgetSettings, MealPreset, Break } from '../types/budget';

const STORAGE_KEYS = {
  TOTAL: 'gt_dining_total',
  START_DATE: 'gt_dining_start_date',
  END_DATE: 'gt_dining_end_date',
  SEMESTER: 'gt_dining_semester',
  MEALS_PER_WEEK: 'gt_dining_meals_per_week',
  BREAKS: 'gt_dining_breaks',
  TRANSACTIONS: 'gt_dining_transactions',
  PRESETS: 'gt_dining_presets',
};

export function useBudget() {
  const [settings, setSettings] = useState<BudgetSettings>({
    total: 0,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    mealsPerWeek: 7,
    semester: '',
    breaks: [],
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [presets, setPresets] = useState<MealPreset[]>([]);

  // Load from localStorage
  useEffect(() => {
    const total = parseFloat(localStorage.getItem(STORAGE_KEYS.TOTAL) || '0');
    const startDate = localStorage.getItem(STORAGE_KEYS.START_DATE) || new Date().toISOString().slice(0, 10);
    const endDate = localStorage.getItem(STORAGE_KEYS.END_DATE) || '';
    const mealsPerWeek = parseInt(localStorage.getItem(STORAGE_KEYS.MEALS_PER_WEEK) || '7', 10);
    const semester = localStorage.getItem(STORAGE_KEYS.SEMESTER) || '';
    const breaks = JSON.parse(localStorage.getItem(STORAGE_KEYS.BREAKS) || '[]');
    const txns = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
    const savedPresets = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRESETS) || '[]');

    setSettings({ total, startDate, endDate, mealsPerWeek, semester, breaks });
    setTransactions(txns);
    setPresets(savedPresets);
  }, []);

  const saveSettings = useCallback((newSettings: Partial<BudgetSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.TOTAL, updated.total.toString());
      localStorage.setItem(STORAGE_KEYS.START_DATE, updated.startDate);
      localStorage.setItem(STORAGE_KEYS.END_DATE, updated.endDate);
      localStorage.setItem(STORAGE_KEYS.MEALS_PER_WEEK, updated.mealsPerWeek.toString());
      localStorage.setItem(STORAGE_KEYS.SEMESTER, updated.semester);
      localStorage.setItem(STORAGE_KEYS.BREAKS, JSON.stringify(updated.breaks));
      return updated;
    });
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'date'>) => {
    const newTx: Transaction = {
      ...tx,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    setTransactions((prev) => {
      const updated = [newTx, ...prev];
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addPreset = useCallback((name: string, amount: number) => {
    const newPreset: MealPreset = {
      id: Date.now().toString(),
      name,
      amount,
    };
    setPresets((prev) => {
      const updated = [...prev, newPreset];
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetAll = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setSettings({
      total: 0,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      mealsPerWeek: 7,
      semester: '',
      breaks: [],
    });
    setTransactions([]);
    setPresets([]);
  }, []);

  // Calculations
  const countEatingDays = useCallback((startStr: string, endStr: string, breaks: Break[]) => {
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
  }, []);

  const getRemainingBalance = useCallback(() => {
    let balance = settings.total;
    transactions.forEach((t) => {
      if (t.type === 'add') balance += t.amount;
      else balance -= t.amount;
    });
    return Math.max(0, balance);
  }, [settings.total, transactions]);

  // Helper: Get balance as of end of a specific date
  const getBalanceAsOf = useCallback((asOfDate: Date) => {
    const targetDateStr = asOfDate.toISOString().slice(0, 10);
    let balance = settings.total;
    
    transactions.forEach((t) => {
      const txDate = t.date.slice(0, 10);
      if (txDate <= targetDateStr) {
        if (t.type === 'add') balance += t.amount;
        else balance -= t.amount;
      }
    });
    
    return Math.max(0, balance);
  }, [settings.total, transactions]);

  const getTotalSpent = useCallback(() => {
    return transactions.filter((t) => t.type === 'spend').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const getSpentUpToYesterday = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    
    return transactions
      .filter((t) => t.type === 'spend' && t.date.slice(0, 10) < todayStr)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const getEatingDaysRemaining = useCallback(() => {
    if (!settings.endDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(settings.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(settings.endDate);
    end.setHours(0, 0, 0, 0);
    
    // If we're viewing a semester that doesn't include today,
    // return the total eating days for that entire semester
    if (today < start || today > end) {
      const calendarDays = countEatingDays(settings.startDate, settings.endDate, settings.breaks);
      return calendarDays * (settings.mealsPerWeek / 7);
    }
    
    // If we're in the current semester, calculate days remaining from today
    if (today > end) return 0;
    const calendarDays = countEatingDays(today.toISOString().slice(0, 10), settings.endDate, settings.breaks);
    // Adjust for meals per week
    return calendarDays * (settings.mealsPerWeek / 7);
  }, [settings.startDate, settings.endDate, settings.breaks, settings.mealsPerWeek, countEatingDays]);

  const getTotalEatingDays = useCallback(() => {
    if (!settings.endDate) return 0;
    if (new Date(settings.startDate) > new Date(settings.endDate)) return 0;
    const calendarDays = countEatingDays(settings.startDate, settings.endDate, settings.breaks);
    // Adjust for meals per week (e.g., if eating 5 days/week, multiply by 5/7)
    return calendarDays * (settings.mealsPerWeek / 7);
  }, [settings.startDate, settings.endDate, settings.breaks, settings.mealsPerWeek, countEatingDays]);

  const getEatingDaysElapsed = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday < new Date(settings.startDate)) return 0;
    const calendarDays = countEatingDays(settings.startDate, yesterday.toISOString().slice(0, 10), settings.breaks);
    // Adjust for meals per week
    return calendarDays * (settings.mealsPerWeek / 7);
  }, [settings.startDate, settings.breaks, settings.mealsPerWeek, countEatingDays]);

  const getBudgetPerMeal = useCallback(() => {
    const remaining = getRemainingBalance();
    const daysLeft = getEatingDaysRemaining();
    if (daysLeft <= 0) return 0;
    
    // Daily forecast based on remaining balance
    return remaining / daysLeft;
  }, [getRemainingBalance, getEatingDaysRemaining]);

  const getOriginalDailyBudget = useCallback(() => {
    const totalDays = getTotalEatingDays();
    if (totalDays <= 0) return 0;
    
    // Original daily budget from the plan (never changes)
    return settings.total / totalDays;
  }, [getTotalEatingDays, settings.total]);

  const getAheadBy = useCallback(() => {
    const totalDays = getTotalEatingDays();
    const elapsed = getEatingDaysElapsed();

    if (totalDays <= 0) return 0;
    
    // Calculate original budget per day (using initial total, not adjusted)
    const originalBudgetPerDay = settings.total / totalDays;
    
    // Expected remaining = what we should have left based on original plan AFTER YESTERDAY
    const expectedRemaining = settings.total - (elapsed * originalBudgetPerDay);
    
    // Actual remaining = what we actually have left AS OF END OF YESTERDAY
    // Start with settings.total and subtract all spending up to yesterday, add all funds
    let actualRemaining = settings.total;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    
    transactions.forEach((t) => {
      const txDate = t.date.slice(0, 10);
      if (txDate < todayStr) {
        if (t.type === 'add') actualRemaining += t.amount;
        else actualRemaining -= t.amount;
      }
    });
    
    // If actual > expected, we're ahead
    // If actual < expected, we're behind
    return actualRemaining - expectedRemaining;
  }, [getTotalEatingDays, getEatingDaysElapsed, settings.total, transactions]);

  const getEatingDaysElapsedAsOf = useCallback((asOfDate: Date) => {
    const targetDate = new Date(asOfDate);
    targetDate.setHours(0, 0, 0, 0);
    const yesterday = new Date(targetDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (yesterday < new Date(settings.startDate)) return 0;
    const calendarDays = countEatingDays(settings.startDate, yesterday.toISOString().slice(0, 10), settings.breaks);
    // Adjust for meals per week
    return calendarDays * (settings.mealsPerWeek / 7);
  }, [settings.startDate, settings.breaks, settings.mealsPerWeek, countEatingDays]);

  const getAheadByAsOf = useCallback((asOfDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(asOfDate);
    targetDate.setHours(0, 0, 0, 0);
    
    // If viewing today, return current ahead/behind
    if (targetDate.getTime() === today.getTime()) {
      return getAheadBy();
    }
    
    const totalDays = getTotalEatingDays();
    const elapsed = getEatingDaysElapsedAsOf(asOfDate);
    
    if (totalDays <= 0) return 0;
    
    // Original budget per day (never changes)
    const originalBudgetPerDay = settings.total / totalDays;
    
    // Expected remaining = what balance should be at end of day before target date
    const expectedRemaining = settings.total - (elapsed * originalBudgetPerDay);
    
    // Actual remaining = actual balance at that point in time
    let actualRemaining;
    if (targetDate > today) {
      // Future: use current balance (no future transactions assumed)
      actualRemaining = getRemainingBalance();
    } else {
      // Past: calculate balance as of day before target date
      const dayBefore = new Date(targetDate);
      dayBefore.setDate(dayBefore.getDate() - 1);
      actualRemaining = getBalanceAsOf(dayBefore);
    }
    
    // Ahead/behind = actual - expected
    return actualRemaining - expectedRemaining;
  }, [getAheadBy, getTotalEatingDays, getEatingDaysElapsedAsOf, settings.total, getRemainingBalance, getBalanceAsOf]);

  const getTodaysSpending = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    
    return transactions
      .filter((t) => t.type === 'spend' && t.date.slice(0, 10) === todayStr)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);
  
  const getTodaysFundsAdded = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    
    return transactions
      .filter((t) => t.type === 'add' && t.date.slice(0, 10) === todayStr)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const getWeeklySpending = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get start of current week (Sunday)
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startStr = startOfWeek.toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);
    
    return transactions
      .filter((t) => {
        if (t.type !== 'spend') return false;
        const txDate = t.date.slice(0, 10);
        return txDate >= startStr && txDate <= todayStr;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const getCurrentWeekNumber = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(settings.startDate);
    start.setHours(0, 0, 0, 0);
    
    if (today < start) return 1;
    
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  }, [settings.startDate]);

  const getWeekNumber = useCallback((date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const start = new Date(settings.startDate);
    start.setHours(0, 0, 0, 0);
    
    if (d < start) return 1;
    
    const diffTime = d.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  }, [settings.startDate]);

  const getWeeklySpendingForWeek = useCallback((weekDate: Date) => {
    const date = new Date(weekDate);
    date.setHours(0, 0, 0, 0);
    
    // Get start of week (Sunday)
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get end of week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Only count up to today if in current/past week
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const effectiveEnd = endOfWeek > today ? today : endOfWeek;
    
    const startStr = startOfWeek.toISOString().slice(0, 10);
    const endStr = new Date(effectiveEnd).toISOString().slice(0, 10);
    
    return transactions
      .filter((t) => {
        if (t.type !== 'spend') return false;
        const txDate = t.date.slice(0, 10);
        return txDate >= startStr && txDate <= endStr;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Helper: Get the number of eating days in a specific week, considering semester bounds and breaks
  const getEatingDaysInWeek = useCallback((weekDate: Date) => {
    const date = new Date(weekDate);
    date.setHours(0, 0, 0, 0);
    
    // Get start of week (Sunday)
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get end of week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(0, 0, 0, 0);
    
    // Constrain to semester bounds
    const semesterStart = new Date(settings.startDate);
    semesterStart.setHours(0, 0, 0, 0);
    const semesterEnd = new Date(settings.endDate);
    semesterEnd.setHours(0, 0, 0, 0);
    
    const effectiveStart = startOfWeek < semesterStart ? semesterStart : startOfWeek;
    const effectiveEnd = endOfWeek > semesterEnd ? semesterEnd : endOfWeek;
    
    // If the week is entirely outside the semester, return 0
    if (effectiveStart > effectiveEnd) return 0;
    
    // Count calendar days in this week within semester bounds
    const calendarDays = countEatingDays(
      effectiveStart.toISOString().slice(0, 10),
      effectiveEnd.toISOString().slice(0, 10),
      settings.breaks
    );
    
    // Apply meals per week ratio (e.g., 5/7 if eating 5 days per week)
    return calendarDays * (settings.mealsPerWeek / 7);
  }, [settings.startDate, settings.endDate, settings.breaks, settings.mealsPerWeek, countEatingDays]);

  const getWeeklyAheadBy = useCallback((weekDate: Date) => {
    const date = new Date(weekDate);
    date.setHours(0, 0, 0, 0);
    
    // Get start of selected week (Sunday) 
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get start of current week
    const currentWeekStart = new Date(today);
    const currentDayOfWeek = currentWeekStart.getDay();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentDayOfWeek);
    
    // Use ORIGINAL daily budget (not dynamic forecast)
    const totalDays = getTotalEatingDays();
    if (totalDays <= 0) return 0;
    const originalDailyBudget = settings.total / totalDays;
    
    const weekNum = getWeekNumber(weekDate);
    
    // Calculate allowance for the current week based on actual eating days in this week
    const currentWeekEatingDays = getEatingDaysInWeek(weekDate);
    const currentWeekAllowance = originalDailyBudget * currentWeekEatingDays;
    
    // If viewing Week 1, there's no rollover - just show spent vs allowance
    if (weekNum === 1) {
      const spentThisWeek = getWeeklySpendingForWeek(weekDate);
      // Ahead by = allowance - spent
      return currentWeekAllowance - spentThisWeek;
    }
    
    // For all other weeks (past, current, or future), calculate rollover from all previous weeks
    const startDate = new Date(settings.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    let accumulatedRollover = 0;
    
    // Iterate through each week from Week 1 to the week before the target week
    for (let w = 1; w < weekNum; w++) {
      // Calculate the start of week w
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + ((w - 1) * 7));
      
      // Get the actual eating days and allowance for this specific week
      const weekEatingDays = getEatingDaysInWeek(weekStart);
      const weekAllowance = originalDailyBudget * weekEatingDays;
      
      // Get spending for that week
      const spentInWeek = getWeeklySpendingForWeek(weekStart);
      
      // Week 1 has no prior rollover
      if (w === 1) {
        accumulatedRollover = weekAllowance - spentInWeek;
      } else {
        // Subsequent weeks: carry forward previous rollover + new allowance - spending
        accumulatedRollover = accumulatedRollover + weekAllowance - spentInWeek;
      }
    }
    
    // If viewing current week, subtract this week's spending
    if (startOfWeek.getTime() === currentWeekStart.getTime()) {
      const spentThisWeek = getWeeklySpendingForWeek(weekDate);
      return accumulatedRollover - spentThisWeek;
    }
    
    // For past or future weeks, return the accumulated rollover from all previous weeks
    return accumulatedRollover;
  }, [getTotalEatingDays, settings.total, settings.startDate, getWeeklySpendingForWeek, getWeekNumber, getEatingDaysInWeek]);

  return {
    settings,
    transactions,
    presets,
    saveSettings,
    addTransaction,
    deleteTransaction,
    addPreset,
    deletePreset,
    resetAll,
    getRemainingBalance,
    getBalanceAsOf,
    getTotalSpent,
    getSpentUpToYesterday,
    getEatingDaysRemaining,
    getEatingDaysElapsed,
    getBudgetPerMeal,
    getOriginalDailyBudget,
    getAheadBy,
    getEatingDaysElapsedAsOf,
    getAheadByAsOf,
    getTodaysSpending,
    getTodaysFundsAdded,
    getWeeklySpending,
    getCurrentWeekNumber,
    getWeekNumber,
    getWeeklySpendingForWeek,
    getWeeklyAheadBy,
    getEatingDaysInWeek,
    getTotalEatingDays,
  };
}