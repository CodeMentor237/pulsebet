import { Match } from './types';

export const MOCK_MATCHES: Match[] = [
  {
    id: 'mock_1',
    sport_key: 'soccer_epl',
    sport_title: 'EPL',
    commence_time: new Date(Date.now() + 3600000).toISOString(),
    home_team: 'Arsenal',
    away_team: 'Manchester City',
    isLive: false,
    bookmakers: [
      {
        key: 'bet365',
        title: 'Bet365',
        lastUpdate: new Date().toISOString(),
        markets: [{
          key: 'h2h',
          lastUpdate: new Date().toISOString(),
          outcomes: [
            { name: 'Arsenal', price: 2.60 },
            { name: 'Draw', price: 3.40 },
            { name: 'Manchester City', price: 2.75 },
          ]
        }]
      },
      {
        key: 'williamhill',
        title: 'William Hill',
        lastUpdate: new Date().toISOString(),
        markets: [{
          key: 'h2h',
          lastUpdate: new Date().toISOString(),
          outcomes: [
            { name: 'Arsenal', price: 2.55 },
            { name: 'Draw', price: 3.30 },
            { name: 'Manchester City', price: 2.80 },
          ]
        }]
      }
    ]
  },
  {
    id: 'mock_2',
    sport_key: 'soccer_epl',
    sport_title: 'EPL',
    commence_time: new Date(Date.now() - 1800000).toISOString(),
    home_team: 'Liverpool',
    away_team: 'Chelsea',
    isLive: true,
    bookmakers: [
      {
        key: 'bet365',
        title: 'Bet365',
        lastUpdate: new Date().toISOString(),
        markets: [{
          key: 'h2h',
          lastUpdate: new Date().toISOString(),
          outcomes: [
            { name: 'Liverpool', price: 1.85 },
            { name: 'Draw', price: 3.80 },
            { name: 'Chelsea', price: 4.20 },
          ]
        }]
      }
    ]
  },
  {
    id: 'mock_3',
    sport_key: 'soccer_champions_league',
    sport_title: 'UEFA Champions League',
    commence_time: new Date(Date.now() + 7200000).toISOString(),
    home_team: 'Real Madrid',
    away_team: 'Bayern Munich',
    isLive: false,
    bookmakers: [
      {
        key: 'bet365',
        title: 'Bet365',
        lastUpdate: new Date().toISOString(),
        markets: [{
          key: 'h2h',
          lastUpdate: new Date().toISOString(),
          outcomes: [
            { name: 'Real Madrid', price: 2.10 },
            { name: 'Draw', price: 3.60 },
            { name: 'Bayern Munich', price: 3.20 },
          ]
        }]
      }
    ]
  },
  {
    id: 'mock_4',
    sport_key: 'soccer_champions_league',
    sport_title: 'UEFA Champions League',
    commence_time: new Date(Date.now() + 10800000).toISOString(),
    home_team: 'PSG',
    away_team: 'Barcelona',
    isLive: false,
    bookmakers: [
      {
        key: 'bet365',
        title: 'Bet365',
        lastUpdate: new Date().toISOString(),
        markets: [{
          key: 'h2h',
          lastUpdate: new Date().toISOString(),
          outcomes: [
            { name: 'PSG', price: 2.30 },
            { name: 'Draw', price: 3.50 },
            { name: 'Barcelona', price: 3.00 },
          ]
        }]
      }
    ]
  },
  {
    id: 'mock_5',
    sport_key: 'soccer_epl',
    sport_title: 'EPL',
    commence_time: new Date(Date.now() - 900000).toISOString(),
    home_team: 'Manchester United',
    away_team: 'Tottenham',
    isLive: true,
    bookmakers: [
      {
        key: 'bet365',
        title: 'Bet365',
        lastUpdate: new Date().toISOString(),
        markets: [{
          key: 'h2h',
          lastUpdate: new Date().toISOString(),
          outcomes: [
            { name: 'Manchester United', price: 2.00 },
            { name: 'Draw', price: 3.50 },
            { name: 'Tottenham', price: 3.75 },
          ]
        }]
      }
    ]
  },
  {
    id: 'mock_6',
    sport_key: 'soccer_epl',
    sport_title: 'EPL',
    commence_time: new Date(Date.now() + 86400000).toISOString(),
    home_team: 'Newcastle',
    away_team: 'Aston Villa',
    isLive: false,
    bookmakers: [
      {
        key: 'bet365',
        title: 'Bet365',
        lastUpdate: new Date().toISOString(),
        markets: [{
          key: 'h2h',
          lastUpdate: new Date().toISOString(),
          outcomes: [
            { name: 'Newcastle', price: 2.15 },
            { name: 'Draw', price: 3.40 },
            { name: 'Aston Villa', price: 3.30 },
          ]
        }]
      }
    ]
  },
];

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
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours === 0) return `${mins}m`;
  if (hours < 24) return `${hours}h ${mins}m`;
  return d.toLocaleDateString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
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

// Additional mock matches
MOCK_MATCHES.push(
  {
    id: 'mock_7',
    sport_key: 'soccer_spain_la_liga',
    sport_title: 'La Liga',
    commence_time: new Date(Date.now() + 14400000).toISOString(),
    home_team: 'Real Madrid',
    away_team: 'Atletico Madrid',
    isLive: false,
    bookmakers: [{
      key: 'bet365',
      title: 'Bet365',
      lastUpdate: new Date().toISOString(),
      markets: [{
        key: 'h2h',
        lastUpdate: new Date().toISOString(),
        outcomes: [
          { name: 'Real Madrid', price: 1.95 },
          { name: 'Draw', price: 3.50 },
          { name: 'Atletico Madrid', price: 3.80 },
        ]
      }]
    }]
  },
  {
    id: 'mock_8',
    sport_key: 'soccer_spain_la_liga',
    sport_title: 'La Liga',
    commence_time: new Date(Date.now() + 18000000).toISOString(),
    home_team: 'Barcelona',
    away_team: 'Girona',
    isLive: false,
    bookmakers: [{
      key: 'bet365',
      title: 'Bet365',
      lastUpdate: new Date().toISOString(),
      markets: [{
        key: 'h2h',
        lastUpdate: new Date().toISOString(),
        outcomes: [
          { name: 'Barcelona', price: 1.45 },
          { name: 'Draw', price: 4.75 },
          { name: 'Girona', price: 6.50 },
        ]
      }]
    }]
  },
  {
    id: 'mock_9',
    sport_key: 'soccer_italy_serie_a',
    sport_title: 'Serie A',
    commence_time: new Date(Date.now() - 3600000).toISOString(),
    home_team: 'Inter Milan',
    away_team: 'AC Milan',
    isLive: true,
    bookmakers: [{
      key: 'bet365',
      title: 'Bet365',
      lastUpdate: new Date().toISOString(),
      markets: [{
        key: 'h2h',
        lastUpdate: new Date().toISOString(),
        outcomes: [
          { name: 'Inter Milan', price: 2.10 },
          { name: 'Draw', price: 3.30 },
          { name: 'AC Milan', price: 3.50 },
        ]
      }]
    }]
  },
  {
    id: 'mock_10',
    sport_key: 'soccer_germany_bundesliga',
    sport_title: 'Bundesliga',
    commence_time: new Date(Date.now() + 21600000).toISOString(),
    home_team: 'Bayern Munich',
    away_team: 'Dortmund',
    isLive: false,
    bookmakers: [{
      key: 'bet365',
      title: 'Bet365',
      lastUpdate: new Date().toISOString(),
      markets: [{
        key: 'h2h',
        lastUpdate: new Date().toISOString(),
        outcomes: [
          { name: 'Bayern Munich', price: 1.55 },
          { name: 'Draw', price: 4.50 },
          { name: 'Dortmund', price: 5.25 },
        ]
      }]
    }]
  },
  {
    id: 'mock_11',
    sport_key: 'soccer_france_ligue_1',
    sport_title: 'Ligue 1',
    commence_time: new Date(Date.now() + 25200000).toISOString(),
    home_team: 'PSG',
    away_team: 'Marseille',
    isLive: false,
    bookmakers: [{
      key: 'bet365',
      title: 'Bet365',
      lastUpdate: new Date().toISOString(),
      markets: [{
        key: 'h2h',
        lastUpdate: new Date().toISOString(),
        outcomes: [
          { name: 'PSG', price: 1.40 },
          { name: 'Draw', price: 5.00 },
          { name: 'Marseille', price: 7.50 },
        ]
      }]
    }]
  },
  {
    id: 'mock_12',
    sport_key: 'soccer_italy_serie_a',
    sport_title: 'Serie A',
    commence_time: new Date(Date.now() + 28800000).toISOString(),
    home_team: 'Juventus',
    away_team: 'Napoli',
    isLive: false,
    bookmakers: [{
      key: 'bet365',
      title: 'Bet365',
      lastUpdate: new Date().toISOString(),
      markets: [{
        key: 'h2h',
        lastUpdate: new Date().toISOString(),
        outcomes: [
          { name: 'Juventus', price: 2.35 },
          { name: 'Draw', price: 3.20 },
          { name: 'Napoli', price: 3.10 },
        ]
      }]
    }]
  }
);
