import { useState, useMemo } from 'react';
import type { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import clsx from 'clsx';
import { Layout } from '../components/layout/Layout';
import { HeroStats } from '../components/ui/HeroStats';
import { FeaturedLive } from '../components/ui/FeaturedLive';
import { MatchCard } from '../components/ui/MatchCard';
import { LeagueStandings } from '../components/ui/LeagueStandings';
import { Match } from '../lib/types';
import { leagueShortName } from '../lib/mockData';
import { useLiveOddsStore } from '../store';

interface Props {
  matches: Match[];
  fetchedAt: string;
  dataSource: 'api' | 'mock';
  remainingCredits?: number;
}

type FilterTab = 'all' | 'live' | 'upcoming' | 'results';
type ViewMode = 'matches' | 'standings';

const Home: NextPage<Props> = ({ matches, fetchedAt, dataSource, remainingCredits }) => {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('matches');
  
  const { simulationEnabled, matches: storeMatches, matchStates, resetSimulation } = useLiveOddsStore();
  
  const activeMatches = storeMatches.length > 0 ? storeMatches : matches;

  const filtered = useMemo(() => {
    return activeMatches.filter(m => {
      const state = matchStates[m.id];
      const status = state?.status || (m.isLive ? 'live' : 'upcoming');
      
      const isLive = status === 'live' || status === 'halftime';
      const isUpcoming = status === 'upcoming';
      const isFinished = status === 'finished';

      let passesTime = false;
      if (filter === 'all') passesTime = status !== 'finished';
      else if (filter === 'live') passesTime = isLive;
      else if (filter === 'upcoming') passesTime = isUpcoming;
      else if (filter === 'results') passesTime = isFinished;

      const passesLeague = leagueFilter === 'all' || m.sport_key === leagueFilter;
      return passesTime && passesLeague;
    });
  }, [activeMatches, filter, leagueFilter, matchStates]);

  const liveMatches = activeMatches.filter(m => {
    const status = matchStates[m.id]?.status || (m.isLive ? 'live' : 'upcoming');
    return status === 'live' || status === 'halftime';
  });
  
  const liveCount = liveMatches.length;
  const leagues = Array.from(new Set(activeMatches.map(m => m.sport_key)));

  return (
    <Layout>
      <Head>
        <title>PulseBet — Live Football Odds</title>
        <meta name="description" content="Real-time football betting odds with Smart Update Engine" />
      </Head>

      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h1 className="font-display font-black text-3xl text-white tracking-wide uppercase">
            Football Lobby
          </h1>
          
          <div className="flex gap-1 glass p-1 rounded-lg border border-white/5">
             {(['matches', 'standings'] as ViewMode[]).map(mode => (
               <button
                 key={mode}
                 onClick={() => setViewMode(mode)}
                 className={clsx(
                   "px-4 py-1.5 rounded-md font-display font-bold text-[10px] tracking-widest uppercase transition-all",
                   viewMode === mode ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white/50"
                 )}
               >
                 {mode}
               </button>
             ))}
          </div>
        </div>

        <HeroStats liveCount={liveCount} />

        <p className="font-mono text-[10px] text-white/20 mt-3 hidden md:block uppercase tracking-widest">
          {activeMatches.length} Simulated Matches · 1s = 1m Tick · Total Odds updated live
        </p>
      </div>

      {viewMode === 'matches' ? (
        <>
          {filter !== 'upcoming' && filter !== 'results' && liveMatches.length > 0 && (
            <FeaturedLive liveMatches={liveMatches} />
          )}

          {/* Filter tabs */}
          <div className="sticky top-14 z-50 py-3 bg-pitch/95 backdrop-blur shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)] flex gap-4 md:gap-6 mb-5 border-b border-white/5">
            <div className="flex gap-1 glass rounded-lg p-1 shrink-0 overflow-x-auto no-scrollbar" role="tablist">
              {(['all', 'live', 'upcoming', 'results'] as FilterTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={clsx(
                    'px-3 py-1.5 rounded-md font-display font-bold text-[10px] tracking-widest transition-all whitespace-nowrap uppercase',
                    filter === tab
                      ? tab === 'live' ? 'bg-volt text-pitch' : 'bg-white/15 text-white'
                      : 'text-white/35 hover:text-white/60'
                  )}
                >
                  {tab === 'live' && liveCount > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-pitch animate-pulse" />
                      LIVE ({liveCount})
                    </span>
                  ) : tab}
                </button>
              ))}
            </div>

            <div className="w-px h-8 bg-white/10 hidden md:block" />

            <div className="flex gap-2 pill-scroll items-center pr-4 relative">
              <button
                onClick={() => setLeagueFilter('all')}
                className={clsx(
                  'px-4 py-1.5 rounded-full font-display font-bold text-[10px] tracking-widest transition-all border whitespace-nowrap uppercase',
                  leagueFilter === 'all'
                    ? 'border-white/30 text-white bg-white/10 shadow-sm'
                    : 'border-white/5 text-white/40 hover:border-white/15 bg-white/2'
                )}
              >
                ALL LEAGUES
              </button>
              {leagues.map(l => (
                <button
                  key={l}
                  onClick={() => setLeagueFilter(l)}
                  className={clsx(
                    'px-4 py-1.5 flex items-center gap-2 rounded-full font-display font-bold text-[10px] tracking-widest transition-all border whitespace-nowrap uppercase',
                    leagueFilter === l
                      ? 'border-white/30 text-white bg-white/10'
                      : 'border-white/5 text-white/40 hover:border-white/15 bg-white/2'
                  )}
                >
                  <span className="opacity-70 italic">🏆</span>
                  {leagueShortName(l)}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 glass rounded-2xl border border-dashed border-white/10 mt-6 relative overflow-hidden">
               <span className="font-display font-black text-2xl text-white/20 tracking-widest uppercase">NO MATCHES FOUND</span>
               <button
                 onClick={() => { setFilter('all'); setLeagueFilter('all'); }}
                 className="mt-4 px-6 py-2 rounded-lg bg-white/10 text-white hover:bg-white/15 transition-colors font-display font-bold tracking-widest text-[10px] border border-white/20 uppercase"
               >
                 CLEAR FILTERS
               </button>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex gap-2 pill-scroll items-center pb-4 border-b border-white/5">
             <button
               onClick={() => setLeagueFilter('all')}
               className={clsx(
                 'px-6 py-2 rounded-lg font-display font-bold text-[10px] tracking-[0.2em] transition-all border whitespace-nowrap uppercase',
                 leagueFilter === 'all' ? 'border-volt text-volt bg-volt/5 shadow-[0_0_20px_rgba(200,241,53,0.1)]' : 'border-white/5 text-white/30'
               )}
             >
               GLOBAL RANKINGS
             </button>
             {leagues.map(l => (
               <button
                 key={l}
                 onClick={() => setLeagueFilter(l)}
                 className={clsx(
                   'px-6 py-2 rounded-lg font-display font-bold text-[10px] tracking-[0.2em] transition-all border whitespace-nowrap uppercase',
                   leagueFilter === l ? 'border-volt text-volt bg-volt/5' : 'border-white/5 text-white/30'
                 )}
               >
                 {leagueShortName(l)}
               </button>
             ))}
           </div>

           {leagueFilter === 'all' ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
               {leagues.map(l => (
                 <LeagueStandings key={l} leagueKey={l} />
               ))}
             </div>
           ) : (
             <div className="max-w-4xl mx-auto pt-4 pb-20">
               <LeagueStandings leagueKey={leagueFilter} />
             </div>
           )}
        </div>
      )}

      {/* Engine status badge */}
      <div className="mt-12 flex flex-col items-center gap-4">
        <div className="glass rounded-full px-4 py-2 flex items-center gap-2 border border-white/8">
          {simulationEnabled && <div className="live-dot w-1.5 h-1.5" />}
          <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.2em]">
            {simulationEnabled ? 'PERPETUAL SESSION SIMULATION ACTIVE' : 'Simulation paused'}
          </span>
        </div>
        
        <button 
          onClick={resetSimulation}
          className="text-[9px] font-mono text-white/20 hover:text-white/50 transition-colors uppercase tracking-[0.3em] font-bold"
        >
          [ REGENERATE UNIVERSE ]
        </button>
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  return {
    props: { matches: [], fetchedAt: new Date().toISOString(), dataSource: 'mock' },
    revalidate: 60,
  };
};

export default Home;
