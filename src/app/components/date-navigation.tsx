import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DateNavigationProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  startDate: string;
  endDate: string;
  viewMode?: 'daily' | 'weekly';
}

export function DateNavigation({ selectedDate, onDateChange, startDate, endDate, viewMode = 'daily' }: DateNavigationProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isToday = selectedDate.toISOString().slice(0, 10) === today.toISOString().slice(0, 10);
  const isFuture = selectedDate > today;
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  // Check if today is within the semester bounds
  const isTodayInSemester = today >= start && today <= end;
  
  const increment = viewMode === 'weekly' ? 7 : 1;
  
  const canGoPrev = viewMode === 'weekly' 
    ? (() => {
        // For weekly: check if the START of the previous week is >= semester start
        const prevWeekDate = new Date(selectedDate);
        prevWeekDate.setDate(prevWeekDate.getDate() - 7);
        
        // Get the start of that week (Sunday)
        const prevWeekStart = new Date(prevWeekDate);
        const dayOfWeek = prevWeekStart.getDay();
        prevWeekStart.setDate(prevWeekStart.getDate() - dayOfWeek);
        prevWeekStart.setHours(0, 0, 0, 0);
        
        return prevWeekStart >= start;
      })()
    : selectedDate > start;
    
  const canGoNext = viewMode === 'weekly'
    ? (() => {
        // For weekly: check if the END of the next week is <= semester end
        const nextWeekDate = new Date(selectedDate);
        nextWeekDate.setDate(nextWeekDate.getDate() + 7);
        
        // Get the end of that week (Saturday)
        const nextWeekStart = new Date(nextWeekDate);
        const dayOfWeek = nextWeekStart.getDay();
        nextWeekStart.setDate(nextWeekStart.getDate() - dayOfWeek);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
        nextWeekEnd.setHours(23, 59, 59, 999);
        
        return nextWeekEnd <= end;
      })()
    : selectedDate < end;
  
  const handlePrevDay = () => {
    if (!canGoPrev) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - increment);
    onDateChange(newDate);
  };
  
  const handleNextDay = () => {
    if (!canGoNext) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + increment);
    onDateChange(newDate);
  };
  
  const handleToday = () => {
    onDateChange(today);
  };
  
  const formatDate = (date: Date) => {
    if (viewMode === 'weekly') {
      // Get start of week (Sunday)
      const weekStart = new Date(date);
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      
      // Get end of week (Saturday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const formatShort = (d: Date) => d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
      
      return `${formatShort(weekStart)} - ${formatShort(weekEnd)}`;
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#003057] via-[#00264d] to-[#001933] rounded-2xl p-3 md:p-4 text-white shadow-lg border border-[#B3A369]/30">
      <div className="relative flex items-center justify-between gap-2 md:gap-3">
        <button
          onClick={handlePrevDay}
          disabled={!canGoPrev}
          className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center transition-all ${
            canGoPrev 
              ? 'bg-white/10 hover:bg-white/20 text-white' 
              : 'bg-white/5 text-gray-600 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
          
            {isFuture && (
              <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Ahead
              </span>
            )}
            {isToday && (
              <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Today
              </span>
            )}
          </div>
          <div className="font-semibold text-base md:text-lg">{formatDate(selectedDate)}</div>
          {!isToday && isTodayInSemester && (
            <button
              onClick={handleToday}
              className="text-[10px] md:text-xs text-[#B3A369] hover:text-[#d4c58a] mt-1 transition-colors"
            >
              Jump to Today
            </button>
          )}
        </div>
        
        <button
          onClick={handleNextDay}
          disabled={!canGoNext}
          className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center transition-all ${
            canGoNext 
              ? 'bg-white/10 hover:bg-white/20 text-white' 
              : 'bg-white/5 text-gray-600 cursor-not-allowed'
          }`}
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>
    </div>
  );
}