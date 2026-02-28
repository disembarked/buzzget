import { Calendar, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DailyBudgetInfoProps {
  budgetPerDay: number;
  daysElapsed: number;
  aheadBy: number;
  isViewingToday?: boolean;
}

const LAST_VISIT_KEY = 'buzzget_last_visit_date';

export function DailyBudgetInfo({ budgetPerDay, daysElapsed, aheadBy, isViewingToday = true }: DailyBudgetInfoProps) {
  const [showNewDayMessage, setShowNewDayMessage] = useState(false);
  const rolloverBudget = Math.max(0, aheadBy);
  const canSpendToday = budgetPerDay + rolloverBudget;

  useEffect(() => {
    // Only show "New Day" message when viewing today
    if (!isViewingToday) return;
    
    const today = new Date().toISOString().slice(0, 10);
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);

    // Show message if it's a new day
    if (lastVisit && lastVisit !== today && budgetPerDay > 0) {
      setShowNewDayMessage(true);
      setTimeout(() => setShowNewDayMessage(false), 5000);
    }

    localStorage.setItem(LAST_VISIT_KEY, today);
  }, [budgetPerDay, daysElapsed, isViewingToday]);

  if (!showNewDayMessage && budgetPerDay <= 0) {
    return null;
  }

  return (
    <>
      {showNewDayMessage && isViewingToday && (
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/20 via-emerald-600/20 to-emerald-700/20 rounded-2xl p-4 shadow-lg border border-emerald-400/30 backdrop-blur-sm mb-5 animate-in fade-in slide-in-from-top duration-500">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400 rounded-full blur-3xl" />
          </div>
          
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-emerald-100">New Day!</div>
              <div className="text-sm text-emerald-200">
                +${budgetPerDay.toFixed(2)} added to your daily budget
              </div>
            </div>
          </div>
        </div>
      )}

      {budgetPerDay > 0 && (
        <div className="relative overflow-hidden bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm mb-5">
          <div className="p-3 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Daily Allowance</span>
            </div>
            <span className="text-sm font-bold text-gray-300">
              ${budgetPerDay.toFixed(2)}
            </span>
          </div>
          
          {rolloverBudget > 0 && (
            <div className="p-3 flex items-center justify-between border-b border-white/10 bg-emerald-500/5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-300">Rollover Budget</span>
              </div>
              <span className="text-sm font-bold text-emerald-400">
                +${rolloverBudget.toFixed(2)}
              </span>
            </div>
          )}
          
          <div className="p-3 flex items-center justify-between bg-[#B3A369]/5">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#B3A369]" />
              <span className="text-sm font-semibold text-gray-200">
                {isViewingToday ? 'Total Available Today' : 'Expected Available'}
              </span>
            </div>
            <span className="text-base font-bold text-[#B3A369]">
              ${canSpendToday.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </>
  );
}