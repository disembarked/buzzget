import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WeeklyOverviewProps {
  budgetPerMeal: number;
  mealsPerWeek: number;
  aheadBy: number;
  remainingBalance: number;
  daysLeft: number;
  weeklySpending: number;
  currentWeekNumber: number;
  isViewingCurrentWeek: boolean;
  isViewingFutureWeek: boolean;
  originalDailyBudget: number;
  eatingDaysInWeek: number;
}

export function WeeklyOverview({ 
  budgetPerMeal, 
  mealsPerWeek, 
  aheadBy, 
  remainingBalance, 
  daysLeft, 
  weeklySpending,
  currentWeekNumber,
  isViewingCurrentWeek,
  isViewingFutureWeek,
  originalDailyBudget,
  eatingDaysInWeek
}: WeeklyOverviewProps) {
  // Use ORIGINAL daily budget times the ACTUAL eating days in this specific week
  // This accounts for partial weeks at the start/end of semester and breaks
  const weeklyBudget = originalDailyBudget * eatingDaysInWeek;
  
  // Account for rollover/deficit in the weekly remaining calculation
  // For current week: (base allowance + rollover) - spent so far
  // For future week: base allowance + projected rollover at that point
  const weeklyRemaining = (weeklyBudget + aheadBy) - weeklySpending;
  
  const isAhead = aheadBy > 0.5;
  const isBehind = aheadBy < -0.5;
  
  const statusColor = isAhead ? 'text-emerald-500' : isBehind ? 'text-red-400' : 'text-amber-400';
  const statusBg = isAhead ? 'bg-emerald-500/10' : isBehind ? 'bg-red-500/10' : 'bg-amber-500/10';
  const statusText = isAhead ? 'Ahead' : isBehind ? 'Behind' : 'On Track';
  const StatusIcon = isAhead ? TrendingUp : isBehind ? TrendingDown : Minus;
  
  const remainingColor = weeklyRemaining > 0 
    ? 'text-emerald-400' 
    : weeklyRemaining < 0 
      ? 'text-red-400' 
      : 'text-amber-400';

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#003057] via-[#00264d] to-[#001933] rounded-3xl p-4 md:p-6 text-white shadow-xl">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#B3A369] rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#B3A369] rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative">
        {/* Status badge */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#B3A369] animate-pulse" />
            <span className="text-xs md:text-sm font-medium text-gray-300">Week {currentWeekNumber} 🐝</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1 rounded-full ${statusBg}`}>
            <StatusIcon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${statusColor}`} />
            <span className={`text-[10px] md:text-xs font-semibold ${statusColor}`}>{statusText}</span>
          </div>
        </div>

        {/* Weekly Budget */}
        <div className="mb-4 md:mb-6 text-center">
          <div className="text-xs md:text-sm text-gray-400 mb-1">Weekly Budget</div>
          <div className="text-4xl md:text-5xl font-bold text-[#B3A369] tracking-tight">
            ${weeklyBudget.toFixed(2)}
          </div>
          <div className="text-[10px] md:text-xs text-gray-400 mt-1">
            {eatingDaysInWeek.toFixed(1)} eating days this week
          </div>
        </div>

        {/* This Week's Remaining or Forecast */}
        <div className="mb-4 md:mb-6 text-center">
          {isViewingFutureWeek ? (
            <>
              <div className="text-[10px] md:text-xs text-gray-400 mb-2 uppercase tracking-wide">
                Forecasted Budget
              </div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400">
                ${(weeklyBudget + aheadBy).toFixed(2)}
              </div>
              {Math.abs(aheadBy) > 0.5 && (
                <div className={`text-[10px] md:text-xs mt-2 ${aheadBy > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  ${weeklyBudget.toFixed(2)} base + ${Math.abs(aheadBy).toFixed(2)} {aheadBy > 0 ? 'rollover' : 'deficit'}
                </div>
              )}
              {Math.abs(aheadBy) <= 0.5 && (
                <div className="text-[10px] md:text-xs text-gray-300 mt-1">
                  On track with budget
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-[10px] md:text-xs text-gray-400 mb-2 uppercase tracking-wide">
                Remaining This Week
              </div>
              <div className={`text-3xl md:text-4xl font-bold ${remainingColor}`}>
                ${Math.abs(weeklyRemaining).toFixed(2)}
              </div>
              {Math.abs(aheadBy) > 0.5 && (
                <div className={`text-[10px] md:text-xs mt-2 ${aheadBy > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  ${weeklyBudget.toFixed(2)} base {aheadBy > 0 ? '+' : '-'} ${Math.abs(aheadBy).toFixed(2)} {aheadBy > 0 ? 'rollover' : 'deficit'} - ${weeklySpending.toFixed(2)} spent
                </div>
              )}
              {Math.abs(aheadBy) <= 0.5 && (
                <div className="text-[10px] md:text-xs text-gray-300 mt-1">
                  ${weeklySpending.toFixed(2)} spent this week
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white/5 rounded-xl p-2.5 md:p-3 backdrop-blur-sm border border-white/10 text-center">
            <div className="text-[10px] md:text-xs text-gray-400 mb-1">Total Remaining</div>
            <div className="text-base md:text-lg font-bold">${remainingBalance.toFixed(2)}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 md:p-3 backdrop-blur-sm border border-white/10 text-center">
            <div className="text-[10px] md:text-xs text-gray-400 mb-1">Days Left</div>
            <div className="text-base md:text-lg font-bold">{Math.round(daysLeft)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}