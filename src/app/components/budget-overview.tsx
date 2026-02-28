import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BudgetOverviewProps {
  budgetPerMeal: number;
  aheadBy: number;
  remainingBalance: number;
  daysLeft: number;
  isViewingToday?: boolean;
  todaysSpending: number;
  todaysFundsAdded: number;
  originalDailyBudget: number;
}

export function BudgetOverview({ 
  budgetPerMeal, 
  aheadBy, 
  remainingBalance, 
  daysLeft, 
  isViewingToday = true, 
  todaysSpending,
  todaysFundsAdded,
  originalDailyBudget 
}: BudgetOverviewProps) {
  // Calculate total available for the selected date
  // If viewing today: start with (daily allowance + rollover/deficit) + funds added today - today's spending
  // If viewing future: daily allowance + rollover/deficit (which accounts for all spending up to today)
  // IMPORTANT: Use originalDailyBudget (what the plan gives you), not budgetPerMeal (forecast)
  const totalAvailableForDate = isViewingToday 
    ? (originalDailyBudget + aheadBy) + todaysFundsAdded - todaysSpending
    : originalDailyBudget + aheadBy;
  
  // When viewing today, use totalAvailableForDate (includes today's spending) for status
  // When viewing other dates, use aheadBy (which is the buffer at that point)
  const statusValue = isViewingToday ? totalAvailableForDate : aheadBy;
  
  // Status logic:
  // - Behind: statusValue < 0 (need to save)
  // - On Track: 0 <= statusValue <= originalDailyBudget (have your allowance available)
  // - Ahead: statusValue > originalDailyBudget (have rollover from being good)
  const isBehind = statusValue < 0;
  const isAhead = statusValue > originalDailyBudget;
  
  const statusColor = isAhead ? 'text-emerald-500' : isBehind ? 'text-red-400' : 'text-amber-400';
  const statusBg = isAhead ? 'bg-emerald-500/10' : isBehind ? 'bg-red-500/10' : 'bg-amber-500/10';
  const statusText = isAhead ? 'Ahead' : isBehind ? 'Behind' : 'On Track';
  const StatusIcon = isAhead ? TrendingUp : isBehind ? TrendingDown : Minus;
  
  // Check if you're behind the ORIGINAL PLAN after today's spending
  const isNowBehind = totalAvailableForDate < 0;
  
  // The amount to display
  const displayAmount = Math.abs(totalAvailableForDate);
  
  // Display color based on current state after spending
  // Red if overspent against plan, green if ahead, amber otherwise
  const displayColor = isNowBehind 
    ? 'text-red-400' 
    : (totalAvailableForDate > 0.5)
      ? 'text-emerald-400'
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
            <span className="text-xs md:text-sm font-medium text-gray-300">BuzzGet 🐝</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1 rounded-full ${statusBg}`}>
            <StatusIcon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${statusColor}`} />
            <span className={`text-[10px] md:text-xs font-semibold ${statusColor}`}>{statusText}</span>
          </div>
        </div>

        {/* Main amount */}
        <div className="mb-4 md:mb-6 text-center">
          <div className="text-xs md:text-sm text-gray-400 mb-1">Meal Allowance</div>
          <div className="text-4xl md:text-5xl font-bold text-[#B3A369] tracking-tight">
            ${originalDailyBudget.toFixed(2)}
          </div>
        </div>

        {/* Total Available Today - Emphasized */}
        <div className="mb-4 md:mb-6 text-center">
          <div className="text-[10px] md:text-xs text-gray-400 mb-2 uppercase tracking-wide">
            {isNowBehind 
              ? 'Need to Save' 
              : isViewingToday 
                ? 'Total Available Today' 
                : 'Expected Available'
            }
          </div>
          <div className={`text-3xl md:text-4xl font-bold ${displayColor}`}>
            ${displayAmount.toFixed(2)}
          </div>
          {!isNowBehind && aheadBy > 0 && todaysSpending === 0 && (
            <div className="text-[10px] md:text-xs text-emerald-300 mt-1">
              Includes ${originalDailyBudget.toFixed(2)} daily allowance
            </div>
          )}
          {todaysSpending > 0 && !isNowBehind && (
            <div className="text-[10px] md:text-xs text-gray-300 mt-1">
              ${todaysSpending.toFixed(2)} spent today
            </div>
          )}
          {isNowBehind && (
            <div className="text-[10px] md:text-xs text-red-300 mt-1">
              Save to Get Back on Track
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white/5 rounded-xl p-2.5 md:p-3 backdrop-blur-sm border border-white/10 text-center">
            <div className="text-[10px] md:text-xs text-gray-400 mb-1">Remaining</div>
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