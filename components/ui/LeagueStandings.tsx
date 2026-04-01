import { useMemo } from 'react';
import { useLiveOddsStore } from '../../store';
import { LEAGUE_TEAMS } from '../../lib/mockData';
import clsx from 'clsx';

interface TeamStats {
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
}

interface Props {
  leagueKey: string;
}

export function LeagueStandings({ leagueKey }: Props) {
  const { matches, matchStates } = useLiveOddsStore();
  
  const standings = useMemo(() => {
    const league = LEAGUE_TEAMS[leagueKey];
    if (!league) return [];

    const statsMap: Record<string, TeamStats> = {};
    
    // Initialize stats for each team
    league.teams.forEach(team => {
      statsMap[team] = {
        name: team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        points: 0,
      };
    });

    // Process finished matches for this league
    matches.forEach(match => {
      if (match.sport_key !== leagueKey) return;
      
      const state = matchStates[match.id];
      if (state?.status !== 'finished') return;

      const { home, away } = state.score;
      const hStats = statsMap[match.home_team];
      const aStats = statsMap[match.away_team];

      if (!hStats || !aStats) return;

      hStats.played++;
      aStats.played++;
      hStats.gf += home;
      hStats.ga += away;
      aStats.gf += away;
      aStats.ga += home;

      if (home > away) {
        hStats.won++;
        hStats.points += 3;
        aStats.lost++;
      } else if (away > home) {
        aStats.won++;
        aStats.points += 3;
        hStats.lost++;
      } else {
        hStats.drawn++;
        aStats.drawn++;
        hStats.points += 1;
        aStats.points += 1;
      }
    });

    return Object.values(statsMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdB = b.gf - b.ga;
      const gdA = a.gf - a.ga;
      if (gdB !== gdA) return gdB - gdA;
      return b.gf - a.gf;
    });
  }, [leagueKey, matches, matchStates]);

  const leagueTitle = LEAGUE_TEAMS[leagueKey]?.title || 'League';

  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      <div className="px-6 py-4 border-b border-white/8 bg-white/[0.02]">
        <h3 className="font-display font-black text-sm tracking-widest text-white uppercase italic">
          {leagueTitle} STANDINGS
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-[11px]">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-4 py-3 font-bold text-white/40 uppercase tracking-widest">#</th>
              <th className="px-4 py-3 font-bold text-white/40 uppercase tracking-widest">TEAM</th>
              <th className="px-2 py-3 font-bold text-white/40 uppercase tracking-widest text-center">P</th>
              <th className="px-2 py-3 font-bold text-white/40 uppercase tracking-widest text-center">W</th>
              <th className="px-2 py-3 font-bold text-white/40 uppercase tracking-widest text-center">D</th>
              <th className="px-2 py-3 font-bold text-white/40 uppercase tracking-widest text-center">L</th>
              <th className="px-2 py-3 font-bold text-white/40 uppercase tracking-widest text-center">GD</th>
              <th className="px-4 py-3 font-bold text-volt uppercase tracking-widest text-center">PTS</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, idx) => (
              <tr key={team.name} className="border-b border-white/3 hover:bg-white/[0.03] transition-colors group">
                <td className="px-4 py-3 text-white/30 italic">{idx + 1}</td>
                <td className="px-4 py-3">
                  <span className="font-display font-bold text-xs text-white group-hover:text-volt transition-colors uppercase">
                    {team.name}
                  </span>
                </td>
                <td className="px-2 py-3 text-center text-white/60">{team.played}</td>
                <td className="px-2 py-3 text-center text-white/60">{team.won}</td>
                <td className="px-2 py-3 text-center text-white/60">{team.drawn}</td>
                <td className="px-2 py-3 text-center text-white/60">{team.lost}</td>
                <td className="px-2 py-3 text-center text-white/60">{team.gf - team.ga}</td>
                <td className="px-4 py-3 text-center font-bold text-white">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {standings.length === 0 && (
        <div className="p-8 text-center bg-white/[0.01]">
          <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.2em]">Select a league to view standings</p>
        </div>
      )}
    </div>
  );
}
