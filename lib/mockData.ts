import { Match } from './types';

export const LEAGUE_TEAMS: Record<string, { title: string; teams: string[] }> = {
  soccer_epl: {
    title: 'EPL',
    teams: ['Arsenal', 'Man City', 'Liverpool', 'Chelsea', 'Man United', 'Tottenham', 'Newcastle', 'Aston Villa', 'West Ham', 'Brighton', 'Wolves', 'Everton']
  },
  soccer_champions_league: {
    title: 'UEFA Champions League',
    teams: ['Real Madrid', 'Bayern Munich', 'PSG', 'Barcelona', 'Inter Milan', 'AC Milan', 'Dortmund', 'Atletico Madrid', 'Juventus', 'Napoli', 'Porto', 'Benfica']
  },
  soccer_spain_la_liga: {
    title: 'La Liga',
    teams: ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Girona', 'Real Sociedad', 'Athletic Bilbao', 'Valencia', 'Sevilla', 'Villarreal', 'Betis']
  },
  soccer_italy_serie_a: {
    title: 'Serie A',
    teams: ['Inter Milan', 'AC Milan', 'Juventus', 'Napoli', 'Lazio', 'Roma', 'Atalanta', 'Fiorentina', 'Bologna', 'Torino']
  },
  soccer_germany_bundesliga: {
    title: 'Bundesliga',
    teams: ['Bayern Munich', 'Dortmund', 'Bayer Leverkusen', 'RB Leipzig', 'Stuttgart', 'Eintracht Frankfurt', 'Wolfsburg', 'Freiburg', 'Monchengladbach']
  }
};

export const MOCK_MATCHES: Match[] = [];

/**
 * Generates a set of randomized matches.
 * @param count - Number of matches to generate.
 * @param startOffsetMs - Initial time offset from Date.now() for the first match group.
 * @param spreadMs - The duration window in which to spread the commence_times.
 */
export function generateMatches(count: number, startOffsetMs: number, spreadMs: number = 300000): Match[] {
  const matches: Match[] = [];
  const leagueKeys = Object.keys(LEAGUE_TEAMS);
  
  for (let i = 0; i < count; i++) {
    const sport_key = leagueKeys[Math.floor(Math.random() * leagueKeys.length)];
    const league = LEAGUE_TEAMS[sport_key];
    
    // Pick two unique teams
    const homeIdx = Math.floor(Math.random() * league.teams.length);
    let awayIdx = Math.floor(Math.random() * league.teams.length);
    while (awayIdx === homeIdx) awayIdx = Math.floor(Math.random() * league.teams.length);
    
    const home_team = league.teams[homeIdx];
    const away_team = league.teams[awayIdx];
    
    // Calculate a staggered start time within the given spread
    const randomOffset = Math.floor(Math.random() * spreadMs);
    const commence_time = new Date(Date.now() + startOffsetMs + randomOffset).toISOString();

    matches.push({
      id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sport_key,
      sport_title: league.title,
      home_team,
      away_team,
      commence_time,
      bookmakers: [
        {
          key: 'bet365',
          title: 'Bet365',
          lastUpdate: new Date().toISOString(),
          markets: [{
            key: 'h2h',
            lastUpdate: new Date().toISOString(),
            outcomes: [
              { name: home_team, price: 1.5 + Math.random() * 2 },
              { name: 'Draw', price: 3.0 + Math.random() * 1.5 },
              { name: away_team, price: 1.5 + Math.random() * 3 },
            ]
          }]
        }
      ]
    });
  }
  
  return matches;
}

export function generateMatchPool(count: number): Match[] {
  // Distribution for initial pool:
  // - 6 Live matches (started up to 90 mins ago)
  // - 6 Starting soon (next 5 mins)
  // - 8 Starting later (5 - 60 mins)
  const pool = [
     ...generateMatches(6, -80000, 80000), // Live
     ...generateMatches(6, 1000, 300000),   // Soon
     ...generateMatches(8, 300000, 3600000) // Later (up to 1h)
  ];
  return pool.sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime());
}

export function getBestOdds(match: Match) {
  let home = 0, draw = 0, away = 0;
  for (const bm of match.bookmakers) {
    const h2h = bm.markets.find(m => m.key === 'h2h');
    if (!h2h) continue;
    for (const o of h2h.outcomes) {
      if (o.name === match.home_team && o.price > home) home = o.price;
      if (o.name === 'Draw' && o.price > draw) draw = o.price;
      if (o.name === match.away_team && o.price > away) away = o.price;
    }
  }
  return { home, draw, away };
}

export function formatKickoff(time: string): string {
  const d = new Date(time);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff < 0) return 'LIVE';
  
  // If simulated/real time suggests it's close
  if (diff < 3600000) return `${Math.floor(diff / 1000)}m`;
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function leagueShortName(key: string): string {
  const map: Record<string, string> = {
    soccer_epl: 'EPL',
    soccer_champions_league: 'UCL',
    soccer_spain_la_liga: 'LA LIGA',
    soccer_italy_serie_a: 'SERIE A',
    soccer_germany_bundesliga: 'BUNDESLIGA',
    soccer_france_ligue_1: 'LIGUE 1',
  };
  return map[key] || key.toUpperCase().replace('SOCCER_', '').replace('_', ' ');
}
