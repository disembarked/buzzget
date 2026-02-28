import { ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react';
import { Transaction } from '../types/budget';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export function TransactionHistory({ transactions, onDelete }: TransactionHistoryProps) {
  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-[#003057] via-[#00264d] to-[#001933] rounded-3xl p-6 shadow-xl border border-white/10">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#B3A369] rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative">
          <h3 className="font-semibold text-white mb-4">Recent Activity 📋</h3>
          <p className="text-sm text-gray-400 text-center py-8">No transactions yet. Start logging your spending!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#003057] via-[#00264d] to-[#001933] rounded-3xl p-5 shadow-xl border border-white/10">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#B3A369] rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>
      
      <div className="relative">
        <h3 className="font-semibold text-white mb-4">Recent Activity 📋</h3>
        
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div 
              key={tx.id} 
              className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl transition-colors group bg-white/5 backdrop-blur-sm border border-white/10"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                tx.type === 'add' 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-red-500 to-red-600'
              }`}>
                {tx.type === 'add' ? (
                  <ArrowDownLeft className="w-5 h-5 text-white" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-white" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{tx.note}</div>
                <div className="text-xs text-gray-400">{formatDate(tx.date)}</div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`font-semibold ${
                  tx.type === 'add' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {tx.type === 'add' ? '+' : '-'}${tx.amount.toFixed(2)}
                </div>
                <button
                  onClick={() => onDelete(tx.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}