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
    const end = new Date(settings.endDate);
    if (today > end) return 0;
    const calendarDays = countEatingDays(today.toISOString().slice(0, 10), settings.endDate, settings.breaks);
    // Adjust for meals per week
    return calendarDays * (settings.mealsPerWeek / 7);
  }, [settings.endDate, settings.breaks, settings.mealsPerWeek, countEatingDays]);

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
    const totalDays = getTotalEatingDays();
    if (totalDays <= 0) return 0;
    
    // Simple budget per day calculation
    return settings.total / totalDays;
  }, [settings.total, getTotalEatingDays]);

  const getAheadBy = useCallback(() => {
    const totalDays = getTotalEatingDays();
    const elapsed = getEatingDaysElapsed();
    const spent = getSpentUpToYesterday(); // Only count spending up to yesterday
    const budgetPerDay = getBudgetPerMeal();

    if (totalDays <= 0) return 0;
    
    // How much we expected to spend by yesterday (end of day)
    const expectedSpent = elapsed * budgetPerDay;
    
    // If we've spent less than expected, we're ahead
    // If we've spent more than expected, we're behind
    return expectedSpent - spent;
  }, [getTotalEatingDays, getEatingDaysElapsed, getSpentUpToYesterday, getBudgetPerMeal]);

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
    
    // Calculate current rollover (ahead/behind)
    const currentRollover = getAheadBy();
    
    // If viewing current or past date, calculate based on actual spending
    if (targetDate <= today) {
      const totalDays = getTotalEatingDays();
      const elapsed = getEatingDaysElapsedAsOf(asOfDate);
      const spent = getTotalSpent();
      const budgetPerDay = getBudgetPerMeal();

      if (totalDays <= 0) return 0;
      
      // How much we expected to spend by the selected date
      const expectedSpent = elapsed * budgetPerDay;
      
      // If we've spent less than expected, we're ahead
      // If we've spent more than expected, we're behind
      return expectedSpent - spent;
    }
    
    // For future dates, add daily allowances for each day in between
    // Count eating days between today and target date
    const daysBetween = countEatingDays(
      today.toISOString().slice(0, 10), 
      targetDate.toISOString().slice(0, 10), 
      settings.breaks
    ) * (settings.mealsPerWeek / 7);
    
    const dailyBudget = getBudgetPerMeal();
    
    // Accumulated budget = current rollover + (days in between - 1) * daily allowance
    // Subtract 1 because the target day itself provides the base budget shown separately
    return currentRollover + ((daysBetween - 1) * dailyBudget);
  }, [getAheadBy, getTotalEatingDays, getEatingDaysElapsedAsOf, getTotalSpent, getBudgetPerMeal, countEatingDays, settings.breaks, settings.mealsPerWeek]);

  const getTodaysSpending = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    
    return transactions
      .filter((t) => t.type === 'spend' && t.date.slice(0, 10) === todayStr)
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

  const getWeeklyRollover = useCallback(() => {
    // Calculate rollover as: (total remaining balance) - (remaining eating days * daily budget)
    const remaining = getRemainingBalance();
    const daysLeft = getEatingDaysRemaining();
    const dailyBudget = getBudgetPerMeal();
    
    // If we have more than we "should" have, we're ahead (positive rollover)
    // If we have less than we "should" have, we're behind (negative rollover)
    return remaining - (daysLeft * dailyBudget);
  }, [getRemainingBalance, getEatingDaysRemaining, getBudgetPerMeal]);

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
    
    const dailyBudget = getBudgetPerMeal();
    const weeklyAllowance = dailyBudget * settings.mealsPerWeek;
    const weekNum = getWeekNumber(weekDate);
    
    // If viewing Week 1, there's no rollover - just show spent vs allowance
    if (weekNum === 1) {
      const spentThisWeek = getWeeklySpendingForWeek(weekDate);
      // Ahead by = 0 - spent (negative if spent, 0 if nothing spent)
      return -spentThisWeek;
    }
    
    // For all other weeks (past, current, or future), calculate rollover from all previous weeks
    // Start with Week 1's rollover
    const startDate = new Date(settings.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    let accumulatedRollover = 0;
    
    // Iterate through each week from Week 1 to the week before the target week
    for (let w = 1; w < weekNum; w++) {
      // Calculate the start of week w
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + ((w - 1) * 7));
      
      // Get spending for that week
      const spentInWeek = getWeeklySpendingForWeek(weekStart);
      
      // Week 1 has no prior rollover
      if (w === 1) {
        accumulatedRollover = weeklyAllowance - spentInWeek;
      } else {
        // Subsequent weeks: carry forward previous rollover + new allowance - spending
        accumulatedRollover = accumulatedRollover + weeklyAllowance - spentInWeek;
      }
    }
    
    // If viewing current week, add this week's spending
    if (startOfWeek.getTime() === currentWeekStart.getTime()) {
      const spentThisWeek = getWeeklySpendingForWeek(weekDate);
      return accumulatedRollover - spentThisWeek;
    }
    
    // For past or future weeks, return the accumulated rollover from all previous weeks
    return accumulatedRollover;
  }, [getBudgetPerMeal, settings.mealsPerWeek, settings.startDate, getWeeklySpendingForWeek, getWeekNumber]);

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
    getTotalSpent,
    getSpentUpToYesterday,
    getEatingDaysRemaining,
    getEatingDaysElapsed,
    getBudgetPerMeal,
    getAheadBy,
    getEatingDaysElapsedAsOf,
    getAheadByAsOf,
    getTodaysSpending,
    getWeeklySpending,
    getCurrentWeekNumber,
    getWeekNumber,
    getWeeklySpendingForWeek,
    getWeeklyAheadBy,
  };
}