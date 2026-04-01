import { useState, useMemo } from 'react';
import type { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import clsx from 'clsx';
import { Layout } from '../components/layout/Layout';
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

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="font-display font-black text-3xl text-white tracking-wide">
            FOOTBALL
          </h1>
          {liveCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="live-dot" />
              <span className="font-display font-bold text-xs text-volt tracking-widest">
                {liveCount} LIVE
              </span>
            </div>
          )}
        </div>
        <p className="font-mono text-xs text-white/30">
          {dataSource === 'api' ? (
            <>Real odds via The Odds API · Updated {new Date(fetchedAt).toLocaleTimeString('en-GB')}
            {remainingCredits !== undefined && ` · ${remainingCredits} credits remaining`}</>
          ) : (
            <>Demo mode · Smart Update Engine active · Simulated odds fluctuating</>
          )}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-1 glass rounded-lg p-1" role="tablist" aria-label="Match filter">
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

        {/* League filters */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setLeagueFilter('all')}
            className={clsx(
              'px-3 py-1.5 rounded-lg font-display font-bold text-xs tracking-widest transition-all border',
              leagueFilter === 'all'
                ? 'border-white/30 text-white bg-white/10'
                : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/50'
            )}
          >
            ALL
          </button>
          {leagues.map(l => (
            <button
              key={l}
              onClick={() => setLeagueFilter(l)}
              className={clsx(
                'px-3 py-1.5 rounded-lg font-display font-bold text-xs tracking-widest transition-all border',
                leagueFilter === l
                  ? 'border-ice/60 text-ice bg-ice/10'
                  : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/50'
              )}
            >
              {leagueShortName(l)}
            </button>
          ))}
        </div>
      </div>

      {/* Match grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-display text-xl text-white/20 tracking-wide">NO MATCHES</p>
          <p className="font-mono text-xs text-white/15 mt-1">Try changing your filters</p>
        </div>
      ) : (
        <>
          <div
            className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
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
              {simulationEnabled && <div className="live-dot w-1.5 h-1.5" style={{width:'6px',height:'6px'}} />}
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
