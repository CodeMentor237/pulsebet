export interface Bookmaker {
  key: string;
  title: string;
  lastUpdate: string;
  markets: Market[];
}

export interface Market {
  key: string;
  lastUpdate: string;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number;
  previousPrice?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface Match {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
  isLive?: boolean;
  score?: { home: number, away: number };
  minute?: number;
}

export interface MatchStats {
  possession: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  shotsOffTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
}

export interface MatchEvent {
  id: string;
  type: 'goal' | 'card' | 'sub';
  minute: number;
  team: 'home' | 'away';
  player: string;
  assist?: string;
  cardType?: 'yellow' | 'red';
}

export interface ProcessedMatch extends Match {
  bestOdds: {
    home: number;
    draw: number;
    away: number;
  };
  simulatedLatencyMs?: number;
}

export interface BetSelection {
  matchId: string;
  matchTitle: string;
  market: string;
  selection: string;
  odds: number;
  addedAt: number;
}

export interface OddsUpdate {
  matchId: string;
  outcomeKey: string;
  newPrice: number;
  timestamp: number;
}

export interface LatencyState {
  ms: number;
  status: 'good' | 'warn' | 'bad';
  lastUpdate: number;
}

export interface PlacedBet {
  id: string;
  username: string;
  selections: BetSelection[];
  stake: number;
  totalOdds: number;
  potentialPayout: number;
  placedAt: number;
  status: 'pending' | 'won' | 'lost';
}
