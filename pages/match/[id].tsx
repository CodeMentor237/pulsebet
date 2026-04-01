import { useCallback, useMemo } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../../components/layout/Layout';
import { OddsButton } from '../../components/ui/OddsButton';
import { Match, BetSelection, MatchEvent, MatchStats } from '../../lib/types';
import { MOCK_MATCHES, getBestOdds, formatKickoff, leagueShortName } from '../../lib/mockData';
import { useLiveOddsStore, useBetSlipStore } from '../../store';

interface Props {
  match: Match | null;
  fetchedAt: string;
}

const MatchDetail: NextPage<Props> = ({ match, fetchedAt }) => {
  const { simulationEnabled, matchStates } = useLiveOddsStore();
  const { addSelection, hasSelection } = useBetSlipStore();

  const liveState = useLiveOddsStore(s => (match ? s.matchStates[match.id] : null));

  if (!match) {
    return (
      <Layout>
        <Head><title>Match Not Found — PulseBet</title></Head>
        <div className="text-center py-24">
          <p className="font-display text-3xl font-black text-white/20 tracking-wide mb-3">MATCH NOT FOUND</p>
          <Link href="/" className="font-mono text-xs text-volt hover:underline">← Back to lobby</Link>
        </div>
      </Layout>
    );
  }

  const bestOdds = getBestOdds(match);
  const isLive = match.isLive || new Date(match.commence_time) < new Date();
  const kickoff = formatKickoff(match.commence_time);

  const score = liveState?.score ?? { home: 0, away: 0 };
  const minute = liveState?.minute ?? 0;
  const stats = liveState?.stats;
  const events = liveState?.events ?? [];

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

  const homeScorers = events.filter(e => e.type === 'goal' && e.team === 'home');
  const awayScorers = events.filter(e => e.type === 'goal' && e.team === 'away');

  return (
    <Layout>
      <Head>
        <title>{`${match.home_team} vs ${match.away_team} — PulseBet`}</title>
        <meta name="description" content={`Live odds for ${match.home_team} vs ${match.away_team}`} />
      </Head>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 font-mono text-xs text-white/30">
        <Link href="/" className="hover:text-volt transition-colors lowercase">lobby</Link>
        <span>/</span>
        <span className="text-white/50 lowercase">{leagueShortName(match.sport_key)}</span>
        <span>/</span>
        <span className="text-white/70 truncate lowercase">{match.home_team} vs {match.away_team}</span>
      </div>

      {/* MATCH CENTER HERO */}
      <div className={clsx(
        'glass rounded-3xl p-8 mb-6 border relative overflow-hidden shadow-2xl transition-all',
        isLive ? 'border-volt/30' : 'border-white/8'
      )}>
        {/* Animated Background Pulse for Live */}
        {isLive && (
          <motion.div 
            animate={{ opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-br from-volt/20 via-transparent to-transparent" 
          />
        )}

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              {isLive ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-volt text-pitch font-display font-black text-[10px] tracking-widest uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-pitch animate-pulse" />
                  LIVE {minute}'
                </div>
              ) : (
                <div className="px-3 py-1 rounded-full bg-white/10 text-white/60 font-mono text-[10px] tracking-widest uppercase">
                  {kickoff}
                </div>
              )}
              <span className="font-mono text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                {match.sport_title} · {leagueShortName(match.sport_key)}
              </span>
            </div>
            {liveState?.lastEvent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                key={liveState.lastEvent}
                className="font-display font-bold text-[10px] text-volt border border-volt/30 px-3 py-1 rounded-full bg-volt/5"
              >
                {liveState.lastEvent}
              </motion.div>
            )}
          </div>

          {/* MAIN SCOREBOARD */}
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8 mb-8">
            {/* Home Team */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h1 className="font-display font-black text-4xl sm:text-5xl text-white tracking-tight mb-2 uppercase">
                {match.home_team}
              </h1>
              <div className="space-y-1 min-h-[40px]">
                {homeScorers.map(e => (
                   <p key={e.id} className="font-mono text-[11px] text-white/50">
                    <span className="text-volt">⚽</span> {e.player} {e.minute}' 
                    {e.assist && <span className="text-white/20"> (Asst: {e.assist.split(' ')[1] || e.assist})</span>}
                   </p>
                ))}
              </div>
            </div>

            {/* Score / VS */}
            <div className="flex flex-col items-center justify-center">
              {isLive ? (
                <div className="flex items-center gap-6 font-display font-black text-6xl text-white tabular-nums tracking-tighter">
                  <motion.span key={`home-${score.home}`} initial={{ scale: 1.2, color: '#C8F135' }} animate={{ scale: 1, color: '#FFFFFF' }}>
                    {score.home}
                  </motion.span>
                  <span className="text-white/10">:</span>
                  <motion.span key={`away-${score.away}`} initial={{ scale: 1.2, color: '#C8F135' }} animate={{ scale: 1, color: '#FFFFFF' }}>
                    {score.away}
                  </motion.span>
                </div>
              ) : (
                <span className="font-display font-black text-6xl text-white/10">VS</span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center md:items-end text-center md:text-right">
              <h1 className="font-display font-black text-4xl sm:text-5xl text-white tracking-tight mb-2 uppercase">
                {match.away_team}
              </h1>
              <div className="space-y-1 min-h-[40px]">
                {awayScorers.map(e => (
                   <p key={e.id} className="font-mono text-[11px] text-white/50 text-right">
                    {e.player} {e.minute}' <span className="text-volt">⚽</span>
                    {e.assist && <span className="text-white/20"> (Asst: {e.assist.split(' ')[1] || e.assist})</span>}
                   </p>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Odds Bar */}
          <div className="border-t border-white/5 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="font-mono text-[9px] text-white/30 tracking-[0.2em] uppercase mb-2">Match Result Odds</span>
                <div className="flex gap-2">
                  <OddsButton
                    matchId={match.id}
                    outcomeName={match.home_team}
                    fallbackOdds={bestOdds.home}
                    label="1"
                    isSelected={hasSelection(match.id, match.home_team)}
                    onClick={(odds) => handleOdds(match.home_team, odds)}
                    size="md"
                  />
                  <OddsButton
                    matchId={match.id}
                    outcomeName="Draw"
                    fallbackOdds={bestOdds.draw}
                    label="X"
                    isSelected={hasSelection(match.id, 'Draw')}
                    onClick={(odds) => handleOdds('Draw', odds)}
                    size="md"
                  />
                  <OddsButton
                    matchId={match.id}
                    outcomeName={match.away_team}
                    fallbackOdds={bestOdds.away}
                    label="2"
                    isSelected={hasSelection(match.id, match.away_team)}
                    onClick={(odds) => handleOdds(match.away_team, odds)}
                    size="md"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <p className="font-display font-bold text-lg text-white">Decimal</p>
                    <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest">Odds Format</p>
                 </div>
                 <div className="h-10 w-px bg-white/10" />
                 <div className="text-right">
                    <p className="font-display font-bold text-lg text-white">{match.bookmakers.length}</p>
                    <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest">Bookmakers</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT & CENTER: Stats and Bookmakers */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* LIVE MATCH STATS */}
          {isLive && stats && (
            <div className="glass rounded-2xl p-6 border border-white/8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-sm tracking-widest text-white uppercase">Match Stats</h2>
                <span className="font-mono text-[10px] text-volt uppercase">Live Feed</span>
              </div>

              <div className="space-y-6">
                {/* Possession Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between font-display font-bold text-xs text-white uppercase tracking-tighter">
                    <span>Possession %</span>
                  </div>
                  <div className="h-2.5 w-full bg-white/5 rounded-full flex overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: '50%' }}
                      animate={{ width: `${stats.possession.home}%` }}
                      className="bg-volt h-full relative"
                    >
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-pitch">
                        {stats.possession.home}%
                      </span>
                    </motion.div>
                    <motion.div 
                      initial={{ width: '50%' }}
                      animate={{ width: `${stats.possession.away}%` }}
                      className="bg-white/10 h-full relative"
                    >
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/60">
                        {stats.possession.away}%
                      </span>
                    </motion.div>
                  </div>
                </div>

                {/* Grid Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Shots Target', valHome: stats.shotsOnTarget.home, valAway: stats.shotsOnTarget.away },
                    { label: 'Shots Off', valHome: stats.shotsOffTarget.home, valAway: stats.shotsOffTarget.away },
                    { label: 'Corners', valHome: stats.corners.home, valAway: stats.corners.away },
                    { label: 'Fouls', valHome: stats.fouls.home, valAway: stats.fouls.away },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/3 rounded-xl p-3 border border-white/5 text-center">
                      <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest mb-1.5">{s.label}</p>
                      <div className="flex items-center justify-center gap-3">
                        <span className="font-display font-bold text-lg text-white">{s.valHome}</span>
                        <div className="h-3 w-[1px] bg-white/10" />
                        <span className="font-display font-bold text-lg text-white/50">{s.valAway}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bookmakers Comparison */}
          <div className="glass rounded-2xl overflow-hidden border border-white/8">
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between bg-white/[0.02]">
              <h2 className="font-display font-bold text-sm tracking-wider text-white">BOOKMAKER COMPARISON</h2>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-volt shadow-[0_0_8px_rgba(200,241,53,0.5)]" />
                 <span className="font-mono text-[10px] text-white/40 uppercase">Streaming Odds</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="text-left px-5 py-4 font-mono text-[10px] text-white/20 tracking-widest uppercase">Bookmaker</th>
                    <th className="text-center px-4 py-4 font-mono text-[10px] text-white/20 tracking-widest uppercase">Home</th>
                    <th className="text-center px-4 py-4 font-mono text-[10px] text-white/20 tracking-widest uppercase">Draw</th>
                    <th className="text-center px-4 py-4 font-mono text-[10px] text-white/20 tracking-widest uppercase">Away</th>
                  </tr>
                </thead>
                <tbody>
                  {match.bookmakers.map((bm, i) => {
                    const h2h = bm.markets.find(m => m.key === 'h2h');
                    if (!h2h) return null;
                    const hOdds = h2h.outcomes.find(o => o.name === match.home_team)?.price ?? 0;
                    const dOdds = h2h.outcomes.find(o => o.name === 'Draw')?.price ?? 0;
                    const aOdds = h2h.outcomes.find(o => o.name === match.away_team)?.price ?? 0;

                    return (
                      <tr key={bm.key} className="border-b border-white/3 hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-display font-bold text-sm text-white/80">{bm.title}</span>
                          <p className="font-mono text-[9px] text-white/20">EU License</p>
                        </td>
                        {[
                          { val: hOdds, name: match.home_team, isBest: hOdds === bestOdds.home },
                          { val: dOdds, name: 'Draw', isBest: dOdds === bestOdds.draw },
                          { val: aOdds, name: match.away_team, isBest: aOdds === bestOdds.away },
                        ].map((o) => (
                          <td key={o.name} className="px-4 py-4 text-center">
                            <button 
                              onClick={() => handleOdds(o.name, o.val)}
                              className={clsx(
                                "font-mono font-bold text-sm px-3 py-1.5 rounded-lg border transition-all",
                                o.isBest 
                                  ? "bg-volt/10 border-volt/30 text-volt hover:bg-volt/20" 
                                  : "border-white/5 text-white/40 hover:text-white"
                              )}
                            >
                              {o.val.toFixed(2)}
                            </button>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Match Timeline */}
        <div className="space-y-6">
           <div className="glass rounded-2xl p-6 border border-white/8 h-fit lg:sticky lg:top-24">
              <h2 className="font-display font-bold text-sm tracking-widest text-white uppercase mb-6">Match Timeline</h2>
              
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-3.5 top-0 bottom-0 w-[1px] bg-white/10" />

                <div className="space-y-8 relative">
                  {events.length === 0 ? (
                    <div className="pl-10 py-2">
                       <p className="font-mono text-[11px] text-white/20 uppercase italic">No key events yet</p>
                    </div>
                  ) : (
                    events.map((e, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={e.id} 
                        className="flex items-start gap-5"
                      >
                        <div className={clsx(
                          "z-10 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2",
                          e.type === 'goal' ? "bg-volt border-pitch text-pitch" : "bg-pitch border-white/20 text-white/60"
                        )}>
                           {e.type === 'goal' ? '⚽' : e.type === 'card' ? '🟨' : '↻'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-xs font-bold text-white">{e.minute}'</span>
                            {e.type === 'goal' && <span className="text-[10px] font-display font-bold text-volt uppercase tracking-tighter">Goal</span>}
                            {e.type === 'card' && <span className="text-[10px] font-display font-bold text-yellow-500 uppercase tracking-tighter">Yellow Card</span>}
                          </div>
                          <p className="font-display font-bold text-sm text-white/90">{e.player}</p>
                          {e.assist && <p className="font-mono text-[10px] text-white/30">Assist: {e.assist}</p>}
                          <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest mt-1">
                            {e.team === 'home' ? match.home_team : match.away_team}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                  {/* Start of Match */}
                  <div className="flex items-center gap-5">
                    <div className="z-10 w-7 h-7 rounded-full bg-pitch border-2 border-white/10 flex items-center justify-center text-[10px] text-white/40">
                      ⏱
                    </div>
                    <p className="font-mono text-[11px] text-white/30 uppercase tracking-widest">Kick Off</p>
                  </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const id = params?.id as string;
  const fetchedAt = new Date().toISOString();
  const mockMatch = MOCK_MATCHES.find(m => m.id === id);
  return { props: { match: mockMatch ?? null, fetchedAt } };
};

export default MatchDetail;
