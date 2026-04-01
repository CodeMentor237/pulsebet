import { useState, useMemo } from 'react';
import type { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import clsx from 'clsx';
import { Layout } from '../components/layout/Layout';
import { HeroStats } from '../components/ui/HeroStats';
import { FeaturedLive } from '../components/ui/FeaturedLive';
import { MatchCard } from '../components/ui/MatchCard';
import { Match } from '../lib/types';
import { MOCK_MATCHES, leagueShortName } from '../lib/mockData';
import { useLiveOddsStore } from '../store';

interface Props {
  matches: Match[];
  fetchedAt: string;
  dataSource: 'api' | 'mock';
  remainingCredits?: number;
}

type FilterTab = 'all' | 'live' | 'upcoming';

const Home: NextPage<Props> = ({ matches, fetchedAt, dataSource, remainingCredits }) => {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const { simulationEnabled } = useLiveOddsStore();

  // Filtered matches
  const filtered = useMemo(() => {
    return matches.filter(m => {
      const isLive = m.isLive || new Date(m.commence_time) < new Date();
      const passesTime = filter === 'all' || (filter === 'live' && isLive) || (filter === 'upcoming' && !isLive);
      const passesLeague = leagueFilter === 'all' || m.sport_key === leagueFilter;
      return passesTime && passesLeague;
    });
  }, [matches, filter, leagueFilter]);

  const liveCount = matches.filter(m => m.isLive || new Date(m.commence_time) < new Date()).length;
  const leagues = Array.from(new Set(matches.map(m => m.sport_key)));

  return (
    <Layout>
      <Head>
        <title>PulseBet — Live Football Odds</title>
        <meta name="description" content="Real-time football betting odds with Smart Update Engine" />
      </Head>

      <div className="mb-6">
        <div className="flex items-baseline gap-3 mb-4">
          <h1 className="font-display font-black text-3xl text-white tracking-wide">
            FOOTBALL
          </h1>
        </div>

        {/* Hero Stats */}
        <HeroStats liveCount={liveCount} />

        <p className="font-mono text-xs text-white/30 hidden md:block">
          {dataSource === 'api' ? (
            <>Real odds via The Odds API · Updated {new Date(fetchedAt).toLocaleTimeString('en-GB')}
              {remainingCredits !== undefined && ` · ${remainingCredits} credits remaining`}</>
          ) : (
            <>Demo mode · Smart Update Engine active · Simulated odds fluctuating</>
          )}
        </p>
      </div>

      {/* Featured Live */}
      {filter !== 'upcoming' && (
        <FeaturedLive liveMatches={matches.filter(m => m.isLive || new Date(m.commence_time) < new Date())} />
      )}

      {/* Filter tabs */}
      <div className="sticky top-14 z-50 py-3 bg-pitch/95 backdrop-blur shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)] flex gap-4 md:gap-6 mb-5 border-b border-white/5">
        <div className="flex gap-1 glass rounded-lg p-1 shrink-0" role="tablist" aria-label="Match filter">
          {(['all', 'live', 'upcoming'] as FilterTab[]).map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={filter === tab}
              onClick={() => setFilter(tab)}
              className={clsx(
                'px-3 py-1.5 rounded-md font-display font-bold text-xs tracking-widest transition-all',
                filter === tab
                  ? tab === 'live'
                    ? 'bg-volt text-pitch'
                    : 'bg-white/15 text-white'
                  : 'text-white/35 hover:text-white/60'
              )}
            >
              {tab === 'live' ? (
                <span className="flex items-center gap-1.5">
                  {filter === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-pitch" />}
                  LIVE
                </span>
              ) : tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-white/10 hidden md:block" />

        {/* League filters horizontal scroll */}
        <div className="flex gap-2 pill-scroll items-center pr-4 relative">
          <button
            onClick={() => setLeagueFilter('all')}
            className={clsx(
              'px-4 py-1.5 rounded-full font-display font-medium text-xs tracking-widest transition-all border whitespace-nowrap',
              leagueFilter === 'all'
                ? 'border-white/30 text-white bg-white/10 shadow-sm'
                : 'border-white/5 text-white/40 hover:border-white/15 hover:text-white/60 bg-white/2'
            )}
          >
            ALL LEAGUES
          </button>
          {leagues.map(l => (
            <button
              key={l}
              onClick={() => setLeagueFilter(l)}
              className={clsx(
                'px-4 py-1.5 flex items-center gap-2 rounded-full font-display font-medium text-xs tracking-widest transition-all border whitespace-nowrap',
                leagueFilter === l
                  ? 'border-white/30 text-white bg-white/10 shadow-sm'
                  : 'border-white/5 text-white/40 hover:border-white/15 hover:text-white/60 bg-white/2'
              )}
            >
              <span className="w-3 h-3 rounded-sm bg-white/10 flex items-center justify-center opacity-70">🏆</span>
              {leagueShortName(l)}
            </button>
          ))}
        </div>
      </div>

      {/* Match grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl border border-dashed border-white/10 mt-6 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02]">
            <span className="text-[200px]">⚽</span>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-2xl">
            🔍
          </div>
          <p className="font-display font-black text-2xl text-white tracking-wide">NO MATCHES FOUND</p>
          <p className="font-mono text-sm text-white/40 mt-2 mb-6">No matches match your current filters.</p>
          <button
            onClick={() => { setFilter('all'); setLeagueFilter('all'); }}
            className="px-6 py-2 rounded-lg bg-white/10 text-white hover:bg-white/15 transition-colors font-display font-bold tracking-widest text-sm border border-white/20"
          >
            CLEAR FILTERS
          </button>
        </div>
      ) : (
        <>
          <div
            className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
            aria-label="Match list"
            aria-live="polite"
            aria-atomic="false"
          >
            {filtered.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>

          {/* Engine status badge */}
          <div className="mt-6 flex items-center justify-center">
            <div className="glass rounded-full px-4 py-2 flex items-center gap-2 border border-white/8">
              {simulationEnabled && <div className="live-dot w-1.5 h-1.5" style={{ width: '6px', height: '6px' }} />}
              <span className="font-mono text-[10px] text-white/30">
                {simulationEnabled
                  ? 'Smart Update Engine active · buffering at 180ms'
                  : 'Simulation paused · click SIM ON to resume'}
              </span>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

/**
 * ISR — revalidate every 60 seconds (static shell, background refresh)
 * Falls back to mock data if ODDS_API_KEY is not set
 */
export const getStaticProps: GetStaticProps<Props> = async () => {
  const apiKey = process.env.ODDS_API_KEY;
  const fetchedAt = new Date().toISOString();

  if (!apiKey) {
    return {
      props: { matches: MOCK_MATCHES, fetchedAt, dataSource: 'mock' },
      revalidate: 60,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const [eplRes, uclRes] = await Promise.allSettled([
      fetch(
        `https://api.the-odds-api.com/v4/sports/soccer_epl/odds?apiKey=${apiKey}&regions=eu,uk&markets=h2h&oddsFormat=decimal&dateFormat=iso`,
        { signal: controller.signal }
      ),
      fetch(
        `https://api.the-odds-api.com/v4/sports/soccer_uefa_champs_league/odds?apiKey=${apiKey}&regions=eu,uk&markets=h2h&oddsFormat=decimal&dateFormat=iso`,
        { signal: controller.signal }
      ),
    ]);

    clearTimeout(timeout);

    let matches: Match[] = [];
    let remainingCredits: number | undefined;

    for (const result of [eplRes, uclRes]) {
      if (result.status === 'fulfilled' && result.value.ok) {
        const credits = result.value.headers.get('x-requests-remaining');
        if (credits) remainingCredits = parseInt(credits);
        const data = await result.value.json();
        if (Array.isArray(data)) {
          matches = [...matches, ...data.slice(0, 6)];
        }
      }
    }

    if (matches.length === 0) throw new Error('No matches from API');

    return {
      props: { matches, fetchedAt, dataSource: 'api', remainingCredits },
      revalidate: 60,
    };
  } catch {
    return {
      props: { matches: MOCK_MATCHES, fetchedAt, dataSource: 'mock' },
      revalidate: 60,
    };
  }
};

export default Home;
