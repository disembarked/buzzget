import { useState } from 'react';
import { ShoppingBag, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface SpendFormProps {
  onSpend: (amount: number, note: string) => void;
  remainingBalance: number;
}

export function SpendForm({ onSpend, remainingBalance }: SpendFormProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    if (amt > remainingBalance) {
      toast.error(`Cannot spend $${amt.toFixed(2)}. Only $${remainingBalance.toFixed(2)} remaining.`);
      return;
    }
    onSpend(amt, note || 'Purchase');
    setAmount('');
    setNote('');
    toast.success(`Logged $${amt.toFixed(2)} spending`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative overflow-hidden bg-gradient-to-br from-[#003057] via-[#00264d] to-[#001933] rounded-3xl p-4 md:p-5 shadow-xl border border-white/10">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
            <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
          </div>
          <h3 className="text-sm md:text-base font-semibold text-white">Log Purchase</h3>
        </div>
        
        <div className="space-y-2.5 md:space-y-3">
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const value = e.target.value;
                // Allow numbers and decimal point
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setAmount(value);
                }
              }}
              placeholder="0.00"
              className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 bg-white/10 border border-white/20 rounded-xl text-base md:text-lg font-semibold text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B3A369] focus:border-transparent backdrop-blur-sm"
            />
          </div>
          
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you buy?"
            className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-white/10 border border-white/20 rounded-xl text-sm md:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B3A369] focus:border-transparent backdrop-blur-sm"
          />
          
          <button
            type="submit"
            className="w-full py-2.5 md:py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm md:text-base font-semibold rounded-xl transition-all shadow-lg"
          >
            Log Spending
          </button>
        </div>
      </div>
    </form>
  );
}