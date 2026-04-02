import { memo, useMemo } from 'react';
import { useAuthStore, useBetSlipStore } from '../../store';
import clsx from 'clsx';

interface Props {
  liveCount: number;
}

export const HeroStats = memo(function HeroStats({ liveCount }: Props) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const balance = useAuthStore(s => s.balance);
  const toggleAccountModal = useAuthStore(s => s.toggleAccountModal);
  
  const selectionsCount = useBetSlipStore(s => s.selections.length);
  const placedBets = useBetSlipStore(s => s.placedBets);

  const activeBetsCount = useMemo(() => placedBets.filter(b => b.status === 'pending').length, [placedBets]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {/* Live Matches Stat */}
      <div className="glass rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Live Matches</span>
          {liveCount > 0 && <div className="live-dot" />}
        </div>
        <div className="font-display font-black text-2xl text-white">
          {liveCount}
        </div>
        {/* Decorative background glow */}
        {liveCount > 0 && (
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-volt/10 blur-xl rounded-full pointer-events-none" />
        )}
      </div>

      {/* Slip Selections Stat */}
      <div className="glass rounded-xl p-4 flex flex-col justify-between border border-white/5">
        <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-2">On Slip</span>
        <div className="font-display font-black text-2xl text-white">
          {selectionsCount > 0 ? (
            <span className="text-volt">{selectionsCount}</span>
          ) : (
            <span className="text-white/20">0</span>
          )}
        </div>
      </div>

      {/* Authenticated Stats */}
      {isAuthenticated ? (
        <>
          <div className="glass rounded-xl p-4 flex flex-col justify-between border border-white/5">
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-2">Active Bets</span>
            <div className="font-display font-black text-2xl text-white">
              {activeBetsCount}
            </div>
          </div>

          <button
            onClick={toggleAccountModal}
            className="glass rounded-xl p-4 flex flex-col justify-between border border-volt/20 bg-volt/5 hover:bg-volt/10 active:scale-[0.98] transition-all text-left relative overflow-hidden"
          >
            <span className="font-mono text-[10px] text-volt/60 uppercase tracking-widest mb-2">Wallet</span>
            <div className="font-display font-black text-2xl text-white">
              <span className="text-volt/50 text-xl inline-block mr-1">$</span>
              {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-volt/20 blur-2xl rounded-full pointer-events-none" />
          </button>
        </>
      ) : (
        <div className="col-span-2 glass rounded-xl p-4 flex flex-col justify-center items-center border border-white/5 bg-gradient-to-r from-transparent to-white/5">
          <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-2">Sign in to bet</p>
          <p className="font-display text-sm text-white/80">Connect your account to access your wallet</p>
        </div>
      )}
    </div>
  );
});
