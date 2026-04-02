import { memo } from 'react';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import { Match } from '../../lib/types';
import { getBestOdds, formatKickoff, leagueShortName } from '../../lib/mockData';
import { OddsButton } from './OddsButton';
import { useBetSlipStore, useLiveOddsStore } from '../../store';

interface Props {
  match: Match;
}

export const MatchCard = memo(function MatchCard({ match }: Props) {
  const router = useRouter();
  const liveState = useLiveOddsStore(s => s.matchStates[match.id]);
  
  const bestOdds = getBestOdds(match);
  const kickoff = formatKickoff(match.commence_time);
  const status = liveState?.status;
  const isLive = status === 'live' || status === 'halftime' || (!status && (match.isLive || new Date(match.commence_time) < new Date()));
  const isFinished = status === 'finished';

  const addSelection = useBetSlipStore(s => s.addSelection);
  const hasHomeSelection = useBetSlipStore(s => s.selections.some(sel => sel.matchId === match.id && sel.selection === match.home_team));
  const hasDrawSelection = useBetSlipStore(s => s.selections.some(sel => sel.matchId === match.id && sel.selection === 'Draw'));
  const hasAwaySelection = useBetSlipStore(s => s.selections.some(sel => sel.matchId === match.id && sel.selection === match.away_team));

  const score = liveState?.score ?? { home: 0, away: 0 };
  const minute = liveState?.minute ?? 0;

  const handleOdds = (selection: string, odds: number) => {
    if (isFinished) return;
    addSelection({
      matchId: match.id,
      matchTitle: `${match.home_team} v ${match.away_team}`,
      market: 'Match Result',
      selection,
      odds,
      addedAt: Date.now(),
    });
  };

  const handleNavigate = () => {
    router.push(`/match/${match.id}`);
  };

  return (
    <div 
      onClick={handleNavigate}
      className={clsx(
        'glass rounded-xl overflow-hidden cursor-pointer card-float',
        'border border-white/8 transition-all duration-300',
        isLive && 'border-volt/30 live-card-glow bg-white/[0.02]',
        isFinished && 'border-white/5 opacity-80 !scale-[0.98] blur-[0.2px] saturate-[0.8]'
      )}
    >
      {/* Header */}
      <div className={clsx(
        'flex items-center justify-between px-4 py-2.5 border-b transition-colors',
        isFinished ? "bg-white/[0.03] border-white/5" : "bg-white/2 border-white/6"
      )}>
        <div className="flex items-center gap-3">
          {isLive || isFinished ? (
            <div className="flex items-center gap-2">
              <div className={clsx(
                "flex items-center gap-1.5 px-1.5 py-0.5 rounded border", 
                isFinished ? "bg-white/10 border-white/10 text-white/50" : "bg-volt/10 border-volt/20 text-volt"
              )}>
                {!isFinished && <div className="live-dot" />}
                <span className="font-mono text-[10px] font-bold leading-none uppercase">
                  {status === 'halftime' ? 'HT' : isFinished ? 'FT' : `${minute}'`}
                </span>
              </div>
              <div className={clsx(
                "flex items-center gap-1 font-display font-black text-sm tracking-tighter",
                isFinished ? "text-white/40" : "text-white"
              )}>
                <span>{score.home}</span>
                <span className="text-white/10">-</span>
                <span>{score.away}</span>
              </div>
            </div>
          ) : (
            <span className="font-mono text-xs text-white/40">{kickoff}</span>
          )}
        </div>
        <div className="flex items-center gap-2 h-6">
          {liveState?.lastEvent && !isFinished ? (
            <div
              key={liveState.lastEvent}
              className="flex items-center event-badge-enter"
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
            </div>
          ) : (
            <span className="font-display text-[10px] font-bold tracking-widest text-white/30 uppercase">
              {leagueShortName(match.sport_key)}
            </span>
          )}
        </div>
      </div>

      {/* Teams area */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex justify-between items-center mb-5">
          <div className="flex flex-col items-center gap-2 max-w-[100px]">
            <div className={clsx("team-avatar border transition-colors", isFinished ? "bg-white/5 border-white/10 text-white/30" : "bg-white/8 border-white/15 text-white")}>
              {match.home_team.charAt(0)}
            </div>
            <p className={clsx("font-display text-[11px] font-black tracking-widest text-center uppercase truncate w-full", isFinished ? "text-white/30" : "text-white")}>
              {match.home_team}
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            {isFinished ? (
               <div className="flex flex-col items-center opacity-50 grayscale">
                 <span className="font-display font-black text-2xl text-white tracking-widest">{score.home}:{score.away}</span>
                 <span className="font-mono text-[8px] text-white/40 tracking-[0.3em] uppercase mt-1">Final Result</span>
               </div>
            ) : (
               <div className="flex items-center justify-center -space-x-1">
                 <div className="w-1 h-1 rounded-full bg-white/20" />
                 <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                 <div className="w-1.5 h-1.5 rounded-full bg-white/40 mx-2" />
                 <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                 <div className="w-1 h-1 rounded-full bg-white/20" />
               </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 max-w-[100px]">
            <div className={clsx("team-avatar border transition-colors", isFinished ? "bg-white/5 border-white/10 text-white/30" : "bg-white/8 border-white/15 text-white")}>
              {match.away_team.charAt(0)}
            </div>
            <p className={clsx("font-display text-[11px] font-black tracking-widest text-center uppercase truncate w-full", isFinished ? "text-white/30" : "text-white")}>
              {match.away_team}
            </p>
          </div>
        </div>

        {/* Action / Odds row */}
        {isFinished ? (
          <div className="h-10 w-full flex items-center justify-center bg-white/[0.02] rounded-lg border border-white/5 font-mono text-[9px] text-white/20 tracking-[0.2em] uppercase">
            MATCH COMPLETED IN {leagueShortName(match.sport_key)}
          </div>
        ) : (
          <div className="flex gap-2 justify-between" role="group" aria-label="Match odds">
            <OddsButton
              matchId={match.id}
              outcomeName={match.home_team}
              fallbackOdds={bestOdds.home}
              label="1"
              isSelected={hasHomeSelection}
              onClick={(odds) => handleOdds(match.home_team, odds)}
              size="md"
            />
            <OddsButton
              matchId={match.id}
              outcomeName="Draw"
              fallbackOdds={bestOdds.draw}
              label="X"
              isSelected={hasDrawSelection}
              onClick={(odds) => handleOdds('Draw', odds)}
              size="md"
            />
            <OddsButton
              matchId={match.id}
              outcomeName={match.away_team}
              fallbackOdds={bestOdds.away}
              label="2"
              isSelected={hasAwaySelection}
              onClick={(odds) => handleOdds(match.away_team, odds)}
              size="md"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={clsx(
        "px-4 py-2 border-t flex items-center justify-between",
        isFinished ? "bg-white/[0.01] border-white/3" : "bg-white/2 border-white/5"
      )}>
        <span className="font-mono text-[8px] text-white/20 uppercase tracking-widest">
          {isFinished ? 'READ ONLY' : `Best odds from ${match.bookmakers.length} markets`}
        </span>
        <button className="font-mono text-[9px] text-white/30 font-bold hover:text-volt transition-colors uppercase tracking-[0.1em]">
          STATS →
        </button>
      </div>
    </div>
  );
});
