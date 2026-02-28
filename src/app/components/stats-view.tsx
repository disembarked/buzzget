import { Transaction } from '../types/budget';
import { BarChart3, Calendar, PieChart } from 'lucide-react';

interface StatsViewProps {
  transactions: Transaction[];
  totalBudget: number;
  totalSpent: number;
  remainingBalance: number;
}

export function StatsView({ transactions, totalBudget, totalSpent, remainingBalance }: StatsViewProps) {
  const spendTransactions = transactions.filter((t) => t.type === 'spend');

  if (spendTransactions.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500">Log some purchases to see your stats!</p>
      </div>
    );
  }

  // Top items by spending
  const itemStats: Record<string, { count: number; total: number }> = {};
  spendTransactions.forEach((tx) => {
    const name = tx.note || 'Unknown';
    if (!itemStats[name]) {
      itemStats[name] = { count: 0, total: 0 };
    }
    itemStats[name].count++;
    itemStats[name].total += tx.amount;
  });

  const topItems = Object.entries(itemStats)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const totalOfTopItems = topItems.reduce((sum, item) => sum + item.total, 0);

  // By day of week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDay = [0, 0, 0, 0, 0, 0, 0];
  spendTransactions.forEach((tx) => {
    const day = new Date(tx.date).getDay();
    byDay[day] += tx.amount;
  });
  const maxDay = Math.max(...byDay, 1);

  return (
    <div className="space-y-5 pb-6">
      {/* Overview */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#003057] via-[#00264d] to-[#001933] rounded-3xl p-5 shadow-xl border border-white/10">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <PieChart className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-white">Overview</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Budget</span>
              <span className="font-semibold text-white">${totalBudget.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Spent</span>
              <span className="font-semibold text-red-400">-${totalSpent.toFixed(2)}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Remaining</span>
              <span className="font-semibold text-emerald-400">${remainingBalance.toFixed(2)}</span>
            </div>
            
            {/* Progress bar */}
            <div className="pt-2">
              <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-[#B3A369] to-[#d4c58a]"
                  style={{ width: `${Math.min((remainingBalance / totalBudget) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Items */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#003057] via-[#00264d] to-[#001933] rounded-3xl p-5 shadow-xl border border-white/10">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#B3A369] rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B3A369] to-[#d4c58a] flex items-center justify-center shadow-lg">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-white">Top Purchases</h3>
          </div>
          
          <div className="space-y-3">
            {topItems.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-300 truncate">{item.name}</span>
                  <span className="text-[#B3A369] font-semibold ml-2">${item.total.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className="h-full bg-gradient-to-r from-[#B3A369] to-[#d4c58a] transition-all duration-500"
                    style={{ width: `${(item.total / totalOfTopItems) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* By Day */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#003057] via-[#00264d] to-[#001933] rounded-3xl p-5 shadow-xl border border-white/10">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#B3A369] rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#003057] to-[#00264d] flex items-center justify-center shadow-lg border border-[#B3A369]">
              <Calendar className="w-4 h-4 text-[#B3A369]" />
            </div>
            <h3 className="font-semibold text-white">Spending by Day</h3>
          </div>
          
          <div className="space-y-3">
            {dayNames.map((day, idx) => (
              <div key={day}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-300 w-12">{day}</span>
                  <div className="flex-1 mx-3">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                      <div 
                        className="h-full bg-gradient-to-r from-[#B3A369] to-[#d4c58a] transition-all duration-500"
                        style={{ width: `${(byDay[idx] / maxDay) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-gray-300 font-medium w-16 text-right">${byDay[idx].toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}