import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { BudgetSettings, MealPreset } from '../types/budget';
import { GT_SEMESTERS } from '../data/semesters';
import { DatePicker } from './ui/date-picker';

// Helper function to format date as YYYY-MM-DD in local timezone
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to parse YYYY-MM-DD string as local date (not UTC)
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

interface SettingsPanelProps {
  settings: BudgetSettings;
  presets: MealPreset[];
  onSave: (settings: Partial<BudgetSettings>) => void;
  onAddPreset: (name: string, amount: number) => void;
  onDeletePreset: (id: string) => void;
  onReset: () => void;
  onSaveComplete?: () => void;
}

export function SettingsPanel({ settings, presets, onSave, onAddPreset, onDeletePreset, onReset, onSaveComplete }: SettingsPanelProps) {
  const [total, setTotal] = useState(settings.total.toString());
  const [startDate, setStartDate] = useState(settings.startDate);
  const [endDate, setEndDate] = useState(settings.endDate);
  const [mealsPerWeek, setMealsPerWeek] = useState(settings.mealsPerWeek.toString());
  const [semester, setSemester] = useState(settings.semester);
  const [breaks, setBreaks] = useState(settings.breaks);
  const [newBreakStart, setNewBreakStart] = useState('');
  const [newBreakEnd, setNewBreakEnd] = useState('');
  const [presetName, setPresetName] = useState('');
  const [presetAmount, setPresetAmount] = useState('');

  // Sync with settings prop
  useEffect(() => {
    setTotal(settings.total.toString());
    setStartDate(settings.startDate);
    setEndDate(settings.endDate);
    setMealsPerWeek(settings.mealsPerWeek.toString());
    setSemester(settings.semester);
    setBreaks(settings.breaks);
  }, [settings]);
  
  // Auto-select current semester if none is set
  useEffect(() => {
    if (!settings.semester) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find the semester that includes today
      const currentSemester = GT_SEMESTERS.find(sem => {
        const start = new Date(sem.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(sem.endDate);
        end.setHours(0, 0, 0, 0);
        return today >= start && today <= end;
      });
      
      if (currentSemester) {
        // Auto-save the current semester
        onSave({
          semester: currentSemester.id,
          startDate: currentSemester.startDate,
          endDate: currentSemester.endDate,
          breaks: currentSemester.breaks,
        });
      }
    }
  }, []);
  
  // Categorize semesters
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentAndPastSemesters = GT_SEMESTERS.filter(sem => {
    const start = new Date(sem.startDate);
    start.setHours(0, 0, 0, 0);
    return start <= today;
  });
  
  const futureSemesters = GT_SEMESTERS.filter(sem => {
    const start = new Date(sem.startDate);
    start.setHours(0, 0, 0, 0);
    return start > today;
  });

  const handleSemesterChange = (semId: string) => {
    setSemester(semId);
    const sem = GT_SEMESTERS.find((s) => s.id === semId);
    if (sem) {
      setStartDate(sem.startDate);
      setEndDate(sem.endDate);
      setBreaks(sem.breaks);
    }
  };

  const handleAddBreak = () => {
    if (!newBreakStart || !newBreakEnd) {
      toast.error('Please select start and end dates.');
      return;
    }
    if (new Date(newBreakStart) > new Date(newBreakEnd)) {
      toast.error('Start date must be before end date.');
      return;
    }
    setBreaks([...breaks, { start: newBreakStart, end: newBreakEnd }]);
    setNewBreakStart('');
    setNewBreakEnd('');
  };

  const handleRemoveBreak = (index: number) => {
    setBreaks(breaks.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const totalNum = parseFloat(total);
    if (!totalNum || totalNum <= 0) {
      toast.error('Please enter a valid total budget.');
      return;
    }
    if (!endDate) {
      toast.error('Please select an end date.');
      return;
    }
    onSave({
      total: totalNum,
      startDate,
      endDate,
      mealsPerWeek: parseInt(mealsPerWeek, 10),
      semester,
      breaks,
    });
    toast.success('Budget settings saved!');
    if (onSaveComplete) {
      onSaveComplete();
    }
  };

  const handleAddPreset = () => {
    const amount = parseFloat(presetAmount);
    if (!presetName.trim() || !amount || amount <= 0) {
      toast.error('Please enter a valid preset name and amount.');
      return;
    }
    onAddPreset(presetName.trim(), amount);
    setPresetName('');
    setPresetAmount('');
    toast.success(`Added "${presetName.trim()}" preset!`);
  };

  const handleReset = () => {
    if (confirm('Reset everything? This clears all transactions and settings.')) {
      onReset();
    }
  };

  const formatBreakDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4 md:space-y-5 pb-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#003057] via-[#00264d] to-[#001933] rounded-3xl p-4 md:p-5 shadow-xl border border-white/10">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#B3A369] rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-4 md:mb-5">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#003057] to-[#00264d] flex items-center justify-center shadow-lg border border-[#B3A369]">
              <Settings className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#B3A369]" />
            </div>
            <h3 className="text-sm md:text-base font-semibold text-white">Budget Settings</h3>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">
                Total Dining Dollars
              </label>
              <input
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="400"
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm md:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B3A369] focus:border-transparent backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm md:text-base text-white focus:outline-none focus:ring-2 focus:ring-[#B3A369] focus:border-transparent backdrop-blur-sm"
              >
                <option value="" className="bg-[#003057]">Custom</option>
                {currentAndPastSemesters.length > 0 && (
                  <optgroup label="Current & Past" className="bg-[#003057]">
                    {currentAndPastSemesters.map((sem) => (
                      <option key={sem.id} value={sem.id} className="bg-[#003057]">
                        {sem.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {futureSemesters.length > 0 && (
                  <optgroup label="Future" className="bg-[#003057]">
                    {futureSemesters.map((sem) => (
                      <option key={sem.id} value={sem.id} className="bg-[#003057]">
                        {sem.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <DatePicker
                date={startDate ? parseLocalDate(startDate) : undefined}
                onDateChange={(date) => setStartDate(date ? formatDateLocal(date) : '')}
                placeholder="Select start date"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <DatePicker
                date={endDate ? parseLocalDate(endDate) : undefined}
                onDateChange={(date) => setEndDate(date ? formatDateLocal(date) : '')}
                placeholder="Select end date"
                fromDate={startDate ? parseLocalDate(startDate) : undefined}
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">
                Meals per Week
              </label>
              <select
                value={mealsPerWeek}
                onChange={(e) => setMealsPerWeek(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm md:text-base text-white focus:outline-none focus:ring-2 focus:ring-[#B3A369] focus:border-transparent backdrop-blur-sm"
              >
                <option value="5" className="bg-[#003057]">5 meals/week</option>
                <option value="7" className="bg-[#003057]">7 meals/week</option>
                <option value="10" className="bg-[#003057]">10 meals/week</option>
                <option value="14" className="bg-[#003057]">14 meals/week</option>
                <option value="21" className="bg-[#003057]">21 meals/week</option>
              </select>
            </div>

            {/* Breaks */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">
                Academic Breaks
              </label>
              {breaks.length > 0 && (
                <div className="space-y-2 mb-3">
                  {breaks.map((brk, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm">
                      <span className="text-sm text-gray-300">
                        {brk.name && `${brk.name} · `}
                        {formatBreakDate(brk.start)} – {formatBreakDate(brk.end)}
                      </span>
                      <button
                        onClick={() => handleRemoveBreak(idx)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <DatePicker
                  date={newBreakStart ? parseLocalDate(newBreakStart) : undefined}
                  onDateChange={(date) => setNewBreakStart(date ? formatDateLocal(date) : '')}
                  placeholder="Break start"
                  fromDate={startDate ? parseLocalDate(startDate) : undefined}
                  toDate={endDate ? parseLocalDate(endDate) : undefined}
                  className="flex-1"
                />
                <DatePicker
                  date={newBreakEnd ? parseLocalDate(newBreakEnd) : undefined}
                  onDateChange={(date) => setNewBreakEnd(date ? formatDateLocal(date) : '')}
                  placeholder="Break end"
                  fromDate={newBreakStart ? parseLocalDate(newBreakStart) : (startDate ? parseLocalDate(startDate) : undefined)}
                  toDate={endDate ? parseLocalDate(endDate) : undefined}
                  className="flex-1"
                />
                <button
                  onClick={handleAddBreak}
                  className="px-3 py-2 bg-gradient-to-br from-[#B3A369] to-[#d4c58a] text-white rounded-lg hover:from-[#d4c58a] hover:to-[#B3A369] transition-all shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#B3A369] to-[#d4c58a] hover:from-[#d4c58a] hover:to-[#B3A369] text-white font-semibold rounded-xl transition-all shadow-lg"
              >
                <Save className="w-4 h-4" />
                Save Settings
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2.5 border border-white/20 hover:bg-white/10 text-gray-300 font-medium rounded-xl transition-colors backdrop-blur-sm"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Presets */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#003057] via-[#00264d] to-[#001933] rounded-2xl p-3 md:p-4 shadow-xl border border-white/10">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#B3A369] rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative">
          <h3 className="text-xs md:text-sm font-semibold text-white mb-3">Meal Presets</h3>
          
          {presets.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {presets.map((preset) => (
                <div key={preset.id} className="flex items-center justify-between p-1.5 bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm">
                  <span className="text-xs font-medium text-gray-300">
                    {preset.name} · ${preset.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onDeletePreset(preset.id)}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="e.g. Chick-fil-A"
              className="flex-1 px-2.5 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B3A369] backdrop-blur-sm"
            />
            <input
              type="number"
              value={presetAmount}
              onChange={(e) => setPresetAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-20 px-2.5 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B3A369] backdrop-blur-sm"
            />
            <button
              onClick={handleAddPreset}
              className="px-2.5 py-1.5 bg-gradient-to-r from-[#B3A369] to-[#d4c58a] text-white rounded-lg hover:from-[#d4c58a] hover:to-[#B3A369] transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}