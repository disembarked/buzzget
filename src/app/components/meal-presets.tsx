import { Zap } from 'lucide-react';
import { MealPreset } from '../types/budget';

interface MealPresetsProps {
  presets: MealPreset[];
  onSelect: (preset: MealPreset) => void;
}

export function MealPresets({ presets, onSelect }: MealPresetsProps) {
  if (presets.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-[#003057] via-[#00264d] to-[#001933] rounded-2xl p-4 shadow-xl border border-white/10">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#B3A369] rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#B3A369] to-[#d4c58a] flex items-center justify-center shadow-lg">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-white">Quick Meals</h3>
          </div>
          <p className="text-xs text-gray-400">No saved meals yet. Add presets in Settings to quickly log common purchases.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#003057] via-[#00264d] to-[#001933] rounded-2xl p-3 md:p-4 shadow-xl border border-white/10">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#B3A369] rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      </div>
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-[#B3A369] to-[#d4c58a] flex items-center justify-center shadow-lg">
            <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
          </div>
          <h3 className="text-xs md:text-sm font-semibold text-white">Quick Meals</h3>
        </div>
        
        <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-[#B3A369]/30 scrollbar-track-white/5">
          <div className="flex flex-wrap gap-1.5 pr-1 justify-center">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onSelect(preset)}
                className="px-2.5 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-[#B3A369] to-[#d4c58a] hover:from-[#d4c58a] hover:to-[#B3A369] text-white rounded-full text-[10px] md:text-xs font-medium transition-all shadow-md hover:shadow-lg"
              >
                {preset.name} · ${preset.amount.toFixed(2)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}