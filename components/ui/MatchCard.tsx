import { memo } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { Match } from '../../lib/types';
import { getBestOdds, formatKickoff, leagueShortName } from '../../lib/mockData';
import { OddsButton } from './OddsButton';
import { useBetSlipStore, useLiveOddsStore } from '../../store';
import { BetSelection } from '../../lib/types';

interface Props {
  match: Match;
}

export const MatchCard = memo(function MatchCard({ match }: Props) {
  const router = useRouter();
  const liveState = useLiveOddsStore(s => s.matchStates[match.id]);
  
  const bestOdds = getBestOdds(match);
  const kickoff = formatKickoff(match.commence_time);
  const isLive = match.isLive || new Date(match.commence_time) < new Date();
  const { addSelection, hasSelection } = useBetSlipStore();

  const score = liveState?.score ?? { home: 0, away: 0 };
  const minute = liveState?.minute ?? 0;

  const handleOdds = (selection: string, odds: number) => {
    const sel: BetSelection = {
      matchId: match.id,
      matchTitle: `${match.home_team} v ${match.away_team}`,
      market: 'Match Result',
      selection,
      odds,
      addedAt: Date.now(),
    };
    addSelection(sel);
  };

  const handleNavigate = () => {
    router.push(`/match/${match.id}`);
  };

  return (
    <div 
      onClick={handleNavigate}
      className={clsx(
        'glass glass-hover rounded-xl overflow-hidden transition-all duration-200 group cursor-pointer',
        'border border-white/8 hover:border-white/14',
        isLive && 'border-volt/20 hover:border-volt/30'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/6 bg-white/2">
        <div className="flex items-center gap-3">
          {isLive ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-volt/10 border border-volt/20">
                <div className="live-dot" />
                <span className="font-mono text-[10px] font-bold text-volt leading-none">{minute}'</span>
              </div>
              <div className="flex items-center gap-1 font-display font-black text-sm tracking-tighter text-white">
                <span>{score.home}</span>
                <span className="text-white/20">-</span>
                <span>{score.away}</span>
              </div>
            </div>
          ) : (
            <span className="font-mono text-xs text-white/40">{kickoff}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {liveState?.lastEvent ? (
              <motion.div
                key={liveState.lastEvent}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center"
              >
                {liveState.lastEvent.includes('Card') ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 shadow-sm">
                    <div className={clsx(
                      "w-3 h-4 rounded-[1px] shadow-sm",
                      liveState.lastEvent.includes('Yellow') ? "bg-yellow-400" : "bg-fire"
                    )} />
                    <span className="font-mono text-[10px] font-black text-white/90">
                      {liveState.lastEvent.match(/\((\d+)\)/)?.[1] || '1'}
                    </span>
                  </div>
                ) : (
                  <span className="font-display text-[9px] font-bold text-volt uppercase tracking-tighter px-1.5 py-0.5 rounded bg-volt/5 border border-volt/10">
                    {liveState.lastEvent.split('!')[0]}!
                  </span>
                )}
              </motion.div>
            ) : (
              <span className="font-display text-[10px] font-bold tracking-widest text-white/30 uppercase">
                {leagueShortName(match.sport_key)}
              </span>
            )}
          </AnimatePresence>
          <span className="text-[10px] text-white/30 group-hover:text-volt transition-colors">
            Details →
          </span>
        </div>
      </div>

      {/* Teams */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex justify-between items-center mb-3">
          <div className="flex-1">
            <p className="font-display text-sm font-bold tracking-wide text-white leading-tight">
              {match.home_team}
            </p>
          </div>
          <div className="px-3 text-center">
            <span className="font-display text-lg font-black text-white/20">VS</span>
          </div>
          <div className="flex-1 text-right">
            <p className="font-display text-sm font-bold tracking-wide text-white leading-tight">
              {match.away_team}
            </p>
          </div>
        </div>

        {/* Odds row */}
        <div className="flex gap-2 justify-between" role="group" aria-label="Match odds">
          <OddsButton
            matchId={match.id}
            outcomeName={match.home_team}
            fallbackOdds={bestOdds.home}
            label="HOME"
            isSelected={hasSelection(match.id, match.home_team)}
            onClick={(odds) => handleOdds(match.home_team, odds)}
            size="md"
          />
          <OddsButton
            matchId={match.id}
            outcomeName="Draw"
            fallbackOdds={bestOdds.draw}
            label="DRAW"
            isSelected={hasSelection(match.id, 'Draw')}
            onClick={(odds) => handleOdds('Draw', odds)}
            size="md"
          />
          <OddsButton
            matchId={match.id}
            outcomeName={match.away_team}
            fallbackOdds={bestOdds.away}
            label="AWAY"
            isSelected={hasSelection(match.id, match.away_team)}
            onClick={(odds) => handleOdds(match.away_team, odds)}
            size="md"
          />
        </div>
      </div>

      {/* Bookmaker count */}
      <div className="px-4 py-2 border-t border-white/5">
        <span className="font-mono text-[10px] text-white/25">
          {match.bookmakers.length} bookmaker{match.bookmakers.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
});
