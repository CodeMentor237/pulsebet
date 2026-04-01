import { useEffect, useRef, useState, memo } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveOddsStore } from '../../store';

interface Props {
  matchId: string;
  outcomeName: string;
  fallbackOdds: number;
  label: string;
  isSelected?: boolean;
  onClick: (odds: number) => void;
  size?: 'sm' | 'md';
}

/**
 * OddsButton — memoized odds cell that reads from the live odds store.
 * Only re-renders when its specific odds change (atom-level reactivity pattern).
 * Flash animation fires on trend change via CSS class swap.
 */
export const OddsButton = memo(function OddsButton({
  matchId, outcomeName, fallbackOdds, label, isSelected, onClick, size = 'md'
}: Props) {
  const meta = useLiveOddsStore(s => s.matchStates[matchId]);
  const liveRecord = useLiveOddsStore(s => s.oddsMap[matchId]?.[outcomeName]);
  
  const status = meta?.status;
  const isFinished = status === 'finished';
  const price = liveRecord?.price ?? fallbackOdds;
  const trend = liveRecord?.trend ?? 'stable';
  const changedAt = liveRecord?.changedAt ?? 0;

  const [flashClass, setFlashClass] = useState<'up' | 'down' | null>(null);
  const [clickFlash, setClickFlash] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const prevChangedAt = useRef(0);

  useEffect(() => {
    if (changedAt === 0 || changedAt === prevChangedAt.current) return;
    prevChangedAt.current = changedAt;
    if (trend === 'stable') {
      setShowTrend(false);
      return;
    }
    
    setFlashClass(trend === 'up' ? 'up' : 'down');
    setShowTrend(true);
    
    // Normalize after 3 seconds
    const t = setTimeout(() => {
      setFlashClass(null);
      setShowTrend(false);
    }, 3000);
    
    return () => clearTimeout(t);
  }, [changedAt, trend]);

  const handleClick = (e: React.MouseEvent) => {
    if (showTrend && trend !== 'stable') return;
    e.stopPropagation();
    
    // Trigger micro-animation
    setClickFlash(true);
    setTimeout(() => setClickFlash(false), 250);
    
    onClick(price);
  };

  const isLocked = (showTrend && trend !== 'stable') || isFinished;

  return (
    <button
      onClick={handleClick}
      disabled={isLocked}
      aria-label={`${label}: ${price.toFixed(2)} odds ${isLocked ? '(Locked)' : ''}`}
      aria-pressed={isSelected}
      className={clsx(
        'odds-btn relative flex flex-col items-center justify-center rounded transition-all duration-150',
        'border font-display font-bold tracking-wide transition-all',
        size === 'md' ? 'px-3 py-2 min-w-[72px] text-xs gap-0.5' : 'px-2 py-1.5 min-w-[60px] text-xs gap-0.5',
        isSelected
          ? clsx(
              'odds-selected text-pitch border-volt shadow-[0_0_16px_rgba(200,241,53,0.4)] transition-colors duration-300',
              flashClass === 'down' ? 'bg-fire border-fire shadow-[0_0_16px_rgba(255,76,43,0.4)] scale-[1.02]' : 'bg-volt'
            )
          : isLocked 
            ? 'bg-white/5 border-white/5 text-white/10 cursor-not-allowed grayscale'
            : 'glass glass-hover border-white/10 text-white/80 hover:border-white/20 hover:text-white',
        flashClass === 'up' && !isSelected && 'odds-up border-volt/30',
        flashClass === 'down' && !isSelected && 'odds-down border-fire/30',
        clickFlash && 'odds-pop'
      )}
    >
      <span className={clsx('text-[10px] font-body font-normal transition-opacity', isSelected ? 'text-pitch/70' : 'text-white/40', isLocked && 'opacity-20')}>
        {label}
      </span>
      
      <div className="relative">
        <span className={clsx('odds-number transition-all', size === 'md' ? 'text-base' : 'text-sm', isLocked && 'blur-[1px] opacity-30')}>
          {price.toFixed(2)}
        </span>
        <AnimatePresence>
          {clickFlash && (
            <motion.div
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute left-1/2 -top-6 -translate-x-1/2 text-[10px] font-black text-volt float-badge"
            >
              +1
            </motion.div>
          )}
        </AnimatePresence>
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-black text-white/50">{isFinished ? 'FT' : '🔒'}</span>
          </div>
        )}
      </div>

      {showTrend && trend !== 'stable' && !isSelected && (
        <span className={clsx(
          'absolute top-0.5 right-1 text-[9px] font-mono font-bold animate-fade-in',
          trend === 'up' ? 'text-volt/60' : 'text-fire/60'
        )}>
          {trend === 'up' ? '▲' : '▼'}
        </span>
      )}
    </button>
  );
});
