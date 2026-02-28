import { useState, useCallback, useEffect } from 'react';
import { Wallet, BarChart3, Settings as SettingsIcon, Calendar, CalendarDays } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useBudget } from './hooks/useBudget';
import { BudgetOverview } from './components/budget-overview';
import { WeeklyOverview } from './components/weekly-overview';
import { DateNavigation } from './components/date-navigation';
import { SpendForm } from './components/spend-form';
import { AddFunds } from './components/add-funds';
import { MealPresets } from './components/meal-presets';
import { TransactionHistory } from './components/transaction-history';
import { StatsView } from './components/stats-view';
import { SettingsPanel } from './components/settings-panel';
import { WelcomeScreen } from './components/welcome-screen';

type Tab = 'wallet' | 'stats' | 'settings';
type ViewMode = 'daily' | 'weekly';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('wallet');
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const budget = useBudget();

  // Update selectedDate when semester dates change
  useEffect(() => {
    if (budget.settings.startDate && budget.settings.endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const semesterStart = new Date(budget.settings.startDate);
      semesterStart.setHours(0, 0, 0, 0);
      
      const semesterEnd = new Date(budget.settings.endDate);
      semesterEnd.setHours(0, 0, 0, 0);
      
      // If today is outside the semester bounds, set to semester start
      if (today < semesterStart || today > semesterEnd) {
        setSelectedDate(semesterStart);
      } else {
        // If we're within the semester, set to today
        setSelectedDate(today);
      }
    }
  }, [budget.settings.startDate, budget.settings.endDate]);

  const budgetPerMeal = budget.getBudgetPerMeal();
  const remainingBalance = budget.getRemainingBalance();
  const daysLeft = budget.getEatingDaysRemaining();
  const totalSpent = budget.getTotalSpent();
  const todaysSpending = budget.getTodaysSpending();
  
  // Calculate based on selected date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isViewingToday = selectedDate.toISOString().slice(0, 10) === today.toISOString().slice(0, 10);
  
  // Get start of current week
  const getCurrentWeekStart = () => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  };
  
  const getSelectedWeekStart = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  };
  
  const isViewingCurrentWeek = getCurrentWeekStart().toISOString().slice(0, 10) === getSelectedWeekStart().toISOString().slice(0, 10);
  
  const isViewingFutureWeek = getSelectedWeekStart() > getCurrentWeekStart();
  
  const daysElapsed = isViewingToday 
    ? budget.getEatingDaysElapsed() 
    : budget.getEatingDaysElapsedAsOf(selectedDate);
  
  const aheadBy = isViewingToday 
    ? budget.getAheadBy() 
    : budget.getAheadByAsOf(selectedDate);
  
  const weeklyAheadBy = isViewingCurrentWeek
    ? budget.getAheadBy()
    : budget.getWeeklyAheadBy(selectedDate);
  
  const weeklySpending = isViewingCurrentWeek
    ? budget.getWeeklySpending()
    : budget.getWeeklySpendingForWeek(selectedDate);
  
  const weekNumber = budget.getWeekNumber(selectedDate);
  
  const isSetup = budget.settings.total > 0 && budget.settings.endDate;

  const handleSpend = useCallback((amount: number, note: string) => {
    budget.addTransaction({ type: 'spend', amount, note });
  }, [budget]);

  const handleAddFunds = useCallback((amount: number) => {
    budget.addTransaction({ type: 'add', amount, note: 'Added funds' });
  }, [budget]);

  const handlePresetSelect = useCallback((preset: { name: string; amount: number }) => {
    if (preset.amount > remainingBalance) {
      toast.error(`Cannot spend $${preset.amount.toFixed(2)}. Only $${remainingBalance.toFixed(2)} remaining.`);
      return;
    }
    budget.addTransaction({ type: 'spend', amount: preset.amount, note: preset.name });
    toast.success(`Logged ${preset.name} - $${preset.amount.toFixed(2)}`);
  }, [budget, remainingBalance]);

  const tabs = [
    { id: 'wallet' as Tab, label: 'Wallet', icon: Wallet },
    { id: 'stats' as Tab, label: 'Stats', icon: BarChart3 },
    { id: 'settings' as Tab, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#001933]">
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#003057',
            color: '#fff',
            border: '1px solid rgba(179, 163, 105, 0.3)',
          },
          className: 'sonner-toast',
        }}
      />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-[#003057] to-[#00264d] border-b border-white/10 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B3A369] to-[#d4c58a] flex items-center justify-center shadow-lg">
                <span className="text-lg">🐝</span>
              </div>
              <h1 className="text-xl font-bold text-white">Buzzget</h1>
            </div>
            <div className="text-xs text-gray-400">GT Dining Tracker</div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-5">
        {!isSetup && activeTab === 'wallet' ? (
          <WelcomeScreen onGetStarted={() => setActiveTab('settings')} />
        ) : (
          <>
            {activeTab === 'wallet' && (
              <div className="space-y-4 md:space-y-5">
                {isSetup && (
                  <>
                    <DateNavigation
                      selectedDate={selectedDate}
                      onDateChange={setSelectedDate}
                      startDate={budget.settings.startDate}
                      endDate={budget.settings.endDate}
                      viewMode={viewMode}
                    />
                    
                    {/* View Mode Toggle */}
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setViewMode('daily')}
                        className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-medium text-xs md:text-sm transition-all ${
                          viewMode === 'daily'
                            ? 'bg-gradient-to-r from-[#B3A369] to-[#d4c58a] text-white shadow-lg'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        Daily
                      </button>
                      <button
                        onClick={() => setViewMode('weekly')}
                        className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-medium text-xs md:text-sm transition-all ${
                          viewMode === 'weekly'
                            ? 'bg-gradient-to-r from-[#B3A369] to-[#d4c58a] text-white shadow-lg'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <CalendarDays className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        Weekly
                      </button>
                    </div>
                  </>
                )}
                
                {viewMode === 'daily' && (
                  <BudgetOverview
                    budgetPerMeal={budgetPerMeal}
                    aheadBy={aheadBy}
                    remainingBalance={remainingBalance}
                    daysLeft={daysLeft}
                    isViewingToday={isViewingToday}
                    todaysSpending={todaysSpending}
                  />
                )}
                
                {viewMode === 'weekly' && (
                  <WeeklyOverview
                    budgetPerMeal={budgetPerMeal}
                    mealsPerWeek={budget.settings.mealsPerWeek}
                    aheadBy={weeklyAheadBy}
                    remainingBalance={remainingBalance}
                    daysLeft={daysLeft}
                    weeklySpending={weeklySpending}
                    currentWeekNumber={weekNumber}
                    isViewingCurrentWeek={isViewingCurrentWeek}
                    isViewingFutureWeek={isViewingFutureWeek}
                  />
                )}
                
                {isViewingToday && (
                  <>
                    <MealPresets
                      presets={budget.presets}
                      onSelect={handlePresetSelect}
                    />

                    <SpendForm
                      onSpend={handleSpend}
                      remainingBalance={remainingBalance}
                    />
                  </>
                )}

                {isViewingToday && <AddFunds onAdd={handleAddFunds} />}

                <TransactionHistory
                  transactions={budget.transactions}
                  onDelete={budget.deleteTransaction}
                />
              </div>
            )}

            {activeTab === 'stats' && (
              <StatsView
                transactions={budget.transactions}
                totalBudget={budget.settings.total}
                totalSpent={totalSpent}
                remainingBalance={remainingBalance}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel
                settings={budget.settings}
                presets={budget.presets}
                onSave={budget.saveSettings}
                onAddPreset={budget.addPreset}
                onDeletePreset={budget.deletePreset}
                onReset={budget.resetAll}
                onSaveComplete={() => setActiveTab('wallet')}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#003057] to-[#00264d] border-t border-white/10 safe-area-inset-bottom shadow-lg">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                    isActive
                      ? 'text-[#B3A369]'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom padding for fixed nav */}
      <div className="h-20" />
    </div>
  );
}