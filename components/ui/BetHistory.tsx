import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBetSlipStore, useAuthStore } from '../../store';
import { PlacedBet } from '../../lib/types';
import clsx from 'clsx';

interface BetHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BetHistory: React.FC<BetHistoryProps> = ({ isOpen, onClose }) => {
  const { username } = useAuthStore();
  const { placedBets } = useBetSlipStore();

  const userBets = placedBets.filter(b => b.username === username);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          />

          {/* History Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 z-[60] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  My Bet History
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Viewing bets for {username}</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {userBets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <span className="text-2xl text-zinc-600">⚖️</span>
                  </div>
                  <h3 className="text-white font-medium">No bets yet</h3>
                  <p className="text-sm text-zinc-500 mt-2">
                    Your placed bets will appear here once you start betting.
                  </p>
                </div>
              ) : (
                userBets.map((bet) => (
                  <BetCard key={bet.id} bet={bet} />
                ))
              )}
            </div>

            {/* Footer shadow */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              <p className="text-[10px] text-zinc-500 text-center uppercase tracking-widest font-semibold">
                PulseBet Secure Settlement
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const BetCard: React.FC<{ bet: PlacedBet }> = ({ bet }) => {
  return (
    <div className="relative group">
      <div className={clsx(
        "p-4 rounded-2xl border transition-all duration-300 bg-white/5",
        bet.status === 'won' ? "border-emerald-500/30 group-hover:border-emerald-500/50" : 
        bet.status === 'lost' ? "border-rose-500/30 group-hover:border-rose-500/50" : 
        "border-zinc-800"
      )}>
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">
            ID: {bet.id.split('_').slice(1).join('_')}
          </span>
          <span className={clsx(
            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            bet.status === 'won' ? "bg-emerald-500/20 text-emerald-400" :
            bet.status === 'lost' ? "bg-rose-500/20 text-rose-400" :
            "bg-blue-500/20 text-blue-400"
          )}>
            {bet.status}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          {bet.selections.map((sel, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-xs font-semibold text-white truncate">{sel.matchTitle}</span>
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-400">{sel.selection} @ {sel.odds.toFixed(2)}</span>
                <span className="text-zinc-500 italic">{sel.market}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-white/5 flex justify-between items-end">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-semibold">Stake</p>
            <p className="text-sm font-bold text-white">${bet.stake.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase font-semibold">
              {bet.status === 'won' ? 'Payout' : 'Potential Payout'}
            </p>
            <p className={clsx(
              "text-lg font-black",
              bet.status === 'won' ? "text-emerald-400" : "text-zinc-400"
            )}>
                ${bet.potentialPayout.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-2 text-[9px] text-zinc-600">
          Placed on {new Date(bet.placedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
};
