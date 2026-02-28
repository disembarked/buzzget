import { Settings, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-[#B3A369] to-[#d4c58a] flex items-center justify-center shadow-2xl">
        <span className="text-5xl">🐝</span>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2">Welcome to Buzzget!</h2>
      <p className="text-gray-400 text-center mb-8 max-w-sm">
        Track your Georgia Tech dining dollars and never run out before the end of the semester.
      </p>

      <div className="relative overflow-hidden bg-gradient-to-br from-[#003057] via-[#00264d] to-[#001933] rounded-3xl p-6 shadow-2xl border border-white/10 mb-8 max-w-md w-full">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#B3A369] rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <div className="relative">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#B3A369]" />
            Get Started
          </h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#B3A369] to-[#d4c58a] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">1</div>
              <span>Enter your total dining dollars budget</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#B3A369] to-[#d4c58a] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">2</div>
              <span>Select your semester or set a custom end date</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#B3A369] to-[#d4c58a] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">3</div>
              <span>Choose how many meals per week you eat on campus</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#B3A369] to-[#d4c58a] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">4</div>
              <span>Start tracking your spending and stay on budget!</span>
            </li>
          </ul>
        </div>
      </div>

      <button
        onClick={onGetStarted}
        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#B3A369] to-[#d4c58a] hover:from-[#d4c58a] hover:to-[#B3A369] text-white font-semibold rounded-xl transition-all shadow-2xl hover:shadow-xl"
      >
        Set Up Budget
        <ArrowRight className="w-5 h-5" />
      </button>

      <p className="mt-8 text-xs text-gray-500 text-center max-w-xs">
        Your data is stored locally in your browser. No account required.
      </p>
    </div>
  );
}