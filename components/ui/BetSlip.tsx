import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useBetSlipStore, useAuthStore } from '../../store';

export function BetSlip() {
  const {
    selections, stake, isOpen, placingBet, betPlaced,
    removeSelection, setStake, clearSlip, placeBet, totalOdds, potentialPayout, toggleSlip
  } = useBetSlipStore();
  const { isAuthenticated } = useAuthStore();
  const stakeRef = useRef<HTMLInputElement>(null);

  const total = totalOdds();
  const payout = potentialPayout();

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSlip}
        className={clsx(
          'fixed bottom-4 right-4 z-40 lg:hidden',
          'flex items-center gap-2 px-4 py-3 rounded-full',
          'font-display font-bold text-sm tracking-wider',
          'transition-all duration-200',
          selections.length > 0
            ? 'bg-volt text-pitch shadow-[0_0_20px_rgba(200,241,53,0.4)]'
            : 'glass border border-white/20 text-white'
        )}
        aria-label={`Betting slip, ${selections.length} selections`}
      >
        <span>SLIP</span>
        {selections.length > 0 && (
          <span className="w-5 h-5 bg-pitch rounded-full flex items-center justify-center text-xs font-black">
            {selections.length}
          </span>
        )}
      </button>

      {/* Slip panel */}
      <aside
        className={clsx(
          'fixed right-0 top-0 h-full z-30 w-80 transition-transform duration-300 ease-in-out',
          'lg:relative lg:translate-x-0 lg:w-72 lg:min-h-screen',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-label="Betting slip"
      >
        <div className="h-full bg-[#0D1420]/98 backdrop-blur-3xl border-l border-white/12 flex flex-col pt-16 lg:pt-0 shadow-[-20px_0_40px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className={clsx('w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]', selections.length > 0 ? 'text-volt bg-volt' : 'text-white/20 bg-white/20')} />
              <span className="font-display font-bold text-sm tracking-widest text-white">BET SLIP</span>
              {selections.length > 0 && (
                <span className="font-mono text-xs text-white/40">({selections.length})</span>
              )}
            </div>
            {selections.length > 0 && (
              <button
                onClick={clearSlip}
                className="font-mono text-[10px] text-white/30 hover:text-fire transition-colors"
                aria-label="Clear all selections"
              >
                CLEAR
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {betPlaced ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 text-center"
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-volt/20 border border-volt/40 flex items-center justify-center">
                  <span className="text-volt text-2xl">✓</span>
                </div>
                <p className="font-display font-bold text-lg text-volt">BET PLACED!</p>
                <p className="font-mono text-xs text-white/40 mt-1">
                  Potential: {payout.toFixed(2)} USDT
                </p>
              </motion.div>
            ) : selections.length === 0 ? (
              <div className="mt-12 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="text-white/20 text-xl">◯</span>
                </div>
                <p className="font-display text-sm text-white/30 tracking-wide">SELECT ODDS TO BEGIN</p>
                <p className="font-mono text-[10px] text-white/20 mt-1">Tap any odds button</p>
              </div>
            ) : (
              <AnimatePresence>
                {selections.map(sel => (
                  <motion.div
                    key={`${sel.matchId}-${sel.selection}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="mb-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg p-3 border border-white/8 transition-colors"
                    aria-label={`${sel.selection} in ${sel.matchTitle}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="font-display font-bold text-xs text-white/90 truncate">{sel.selection}</p>
                        <p className="font-mono text-[10px] text-white/35 truncate mt-0.5">{sel.matchTitle}</p>
                        <p className="font-mono text-[9px] text-white/25">{sel.market}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-display font-bold text-base text-volt">{sel.odds.toFixed(2)}</span>
                        <button
                          onClick={() => removeSelection(sel.matchId, sel.selection)}
                          className="text-white/20 hover:text-fire transition-colors text-xs"
                          aria-label={`Remove ${sel.selection}`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Footer with stake & place bet */}
          {selections.length > 0 && !betPlaced && (
            <div className="px-4 py-4 border-t border-white/8 space-y-3">
              {/* Accumulator odds */}
              {selections.length > 1 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-white/40">ACCA ODDS</span>
                  <span className="font-display font-bold text-white">{total.toFixed(2)}</span>
                </div>
              )}

              {/* Stake input */}
              <div>
                <label className="font-mono text-[10px] text-white/40 block mb-1.5">STAKE (USDT)</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center glass rounded-lg border border-white/15 px-3 focus-within:border-volt/50 transition-colors">
                    <span className="font-mono text-xs text-volt mr-1">₮</span>
                    <input
                      ref={stakeRef}
                      type="number"
                      value={stake}
                      onChange={e => setStake(e.target.value)}
                      className="flex-1 bg-transparent font-mono text-sm text-white outline-none py-2 w-full"
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      aria-label="Stake amount in USDT"
                    />
                  </div>
                  {/* Quick stakes */}
                  {['5','10','25','50'].map(v => (
                    <button
                      key={v}
                      onClick={() => setStake(v)}
                      className={clsx(
                        'font-mono text-[10px] px-2 py-1 rounded glass border transition-colors',
                        stake === v ? 'border-volt/60 text-volt' : 'border-white/10 text-white/30 hover:border-white/20'
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payout */}
              <div className="flex justify-between items-center py-2 border-t border-white/8">
                <span className="font-mono text-xs text-white/40">POTENTIAL WIN</span>
                <span className="font-display font-bold text-lg text-volt volt-text-glow">
                  {payout.toFixed(2)} <span className="text-xs text-volt/60">USDT</span>
                </span>
              </div>

              {/* Place bet button */}
              {isAuthenticated ? (
                <button
                  onClick={() => placeBet()}
                  disabled={placingBet || parseFloat(stake) <= 0}
                  className={clsx(
                    'w-full py-3.5 rounded-xl font-display font-black text-base tracking-wider transition-all duration-200',
                    placingBet
                      ? 'bg-volt/30 text-pitch/60 cursor-not-allowed'
                      : 'bg-volt text-pitch hover:bg-volt-glow active:scale-98 volt-glow'
                  )}
                >
                  {placingBet ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⟳</span> PLACING BET...
                    </span>
                  ) : 'PLACE BET'}
                </button>
              ) : (
                <a
                  href="/login"
                  className="block w-full py-3.5 rounded-xl font-display font-black text-sm tracking-wider text-center bg-white/10 text-white/60 hover:bg-white/15 transition-colors"
                >
                  LOG IN TO BET
                </a>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
