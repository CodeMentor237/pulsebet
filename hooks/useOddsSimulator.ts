import { useEffect, useRef, useCallback } from 'react';
import { Match, OddsUpdate, MatchStats, MatchEvent } from '../lib/types';
import { useLiveOddsStore } from '../store';

interface UseOddsSimulatorOptions {
  matches: Match[];
  enabled: boolean;
  onUpdate: (update: OddsUpdate) => void;
  intervalMs?: number;
}

const PLAYER_NAMES = [
  'V. Junior', 'J. Bellingham', 'R. Lewandowski', 'K. Mbappe', 'E. Haaland',
  'M. Salah', 'K. De Bruyne', 'L. Martinez', 'H. Kane', 'V. Osimhen',
  'B. Saka', 'P. Foden', 'R. Leao', 'Pedri', 'Gavi', 'Musiala', 'L. Modric', 'T. Kroos'
];

export function useOddsSimulator({ matches, enabled, onUpdate, intervalMs = 4500 }: UseOddsSimulatorOptions) {
  const { updateMatchState } = useLiveOddsStore();
  
  const priceState = useRef<Map<string, number>>(new Map());
  const momentumState = useRef<Map<string, number>>(new Map());
  const matchMeta = useRef<Map<string, { 
    minute: number; 
    score: { home: number; away: number };
    stats: MatchStats;
    events: MatchEvent[];
  }>>(new Map());

  // Initialize state
  useEffect(() => {
    matches.forEach(match => {
      // Initialize odds state
      match.bookmakers.forEach(bm => {
        bm.markets.forEach(mkt => {
          mkt.outcomes.forEach(o => {
            const key = `${match.id}-${o.name}`;
            if (!priceState.current.has(key)) {
              priceState.current.set(key, o.price);
              momentumState.current.set(key, 0);
            }
          });
        });
      });

      // Initialize live metadata
      const isLive = match.isLive || new Date(match.commence_time) < new Date();
      if (isLive && !matchMeta.current.has(match.id)) {
        const initialMin = Math.floor(Math.random() * 80) + 5;
        const initialScore = { 
          home: Math.random() > 0.4 ? Math.floor(Math.random() * 2) : 0, 
          away: Math.random() > 0.4 ? Math.floor(Math.random() * 2) : 0 
        };
        
        const stats: MatchStats = {
          possession: { home: 45 + Math.floor(Math.random() * 10), away: 0 },
          shotsOnTarget: { home: initialScore.home + Math.floor(Math.random() * 3), away: initialScore.away + Math.floor(Math.random() * 3) },
          shotsOffTarget: { home: Math.floor(Math.random() * 5), away: Math.floor(Math.random() * 5) },
          corners: { home: Math.floor(Math.random() * 6), away: Math.floor(Math.random() * 6) },
          fouls: { home: Math.floor(Math.random() * 8), away: Math.floor(Math.random() * 8) }
        };
        stats.possession.away = 100 - stats.possession.home;

        // Generate initial events based on score
        const events: MatchEvent[] = [];
        for (let i = 0; i < initialScore.home; i++) {
          events.push({
            id: `e-h-${i}-${match.id}`,
            type: 'goal',
            minute: Math.floor(Math.random() * initialMin),
            team: 'home',
            player: PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)],
            assist: Math.random() > 0.3 ? PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)] : undefined
          });
        }
        for (let i = 0; i < initialScore.away; i++) {
          events.push({
            id: `e-a-${i}-${match.id}`,
            type: 'goal',
            minute: Math.floor(Math.random() * initialMin),
            team: 'away',
            player: PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)],
            assist: Math.random() > 0.3 ? PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)] : undefined
          });
        }
        events.sort((a, b) => b.minute - a.minute);

        const meta = { minute: initialMin, score: initialScore, stats, events };
        matchMeta.current.set(match.id, meta);
        updateMatchState(match.id, meta);
      }
    });
  }, [matches, updateMatchState]);

  const simulateTick = useCallback(() => {
    if (!enabled || matches.length === 0) return;

    matches.forEach(match => {
      const isLive = match.isLive || new Date(match.commence_time) < new Date();
      if (!isLive) return;

      const meta = matchMeta.current.get(match.id);
      if (!meta) return;

      // 1. Progress Time
      if (Math.random() > 0.6) {
        meta.minute = Math.min(90, meta.minute + 1);
      }

      // 2. Random Match Events (Goals, Cards, Stats)
      const roll = Math.random();
      
      // Goal (0.4% chance)
      if (roll > 0.996 && meta.minute < 90) {
        const team = Math.random() > 0.5 ? 'home' : 'away';
        meta.score[team]++;
        const newEvent: MatchEvent = {
          id: `goal-${Date.now()}`,
          type: 'goal',
          minute: meta.minute,
          team,
          player: PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)],
          assist: Math.random() > 0.4 ? PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)] : undefined
        };
        meta.events = [newEvent, ...meta.events];
        meta.stats.shotsOnTarget[team]++;
        
        const eventText = `GOAL! ${team === 'home' ? match.home_team : match.away_team} scores! ${newEvent.player}${newEvent.assist ? ` (Asst: ${newEvent.assist})` : ''} (${meta.score.home}-${meta.score.away})`;
        updateMatchState(match.id, { ...meta, lastEvent: eventText });

        // Trigger major odds shift
        const bookmaker = match.bookmakers[0];
        if (bookmaker) {
          bookmaker.markets.find(m => m.key === 'h2h')?.outcomes.forEach(o => {
            const key = `${match.id}-${o.name}`;
            const currentPrice = priceState.current.get(key) ?? o.price;
            const shift = (Math.random() * 1.8 + 0.8) * (team === 'home' ? (o.name === match.home_team ? -1.2 : 0.8) : (o.name === match.away_team ? -1.2 : 0.8));
            const newPrice = Math.max(1.01, Math.min(60, currentPrice + shift));
            const roundedPrice = Math.round(newPrice * 20) / 20;
            priceState.current.set(key, roundedPrice);
            onUpdate({ matchId: match.id, outcomeKey: o.name, newPrice: roundedPrice, timestamp: Date.now() });
          });
        }
      } 
      // Yellow Card (1% chance)
      else if (roll > 0.99) {
        const team = Math.random() > 0.5 ? 'home' : 'away';
        const newEvent: MatchEvent = {
          id: `card-${Date.now()}`,
          type: 'card',
          cardType: 'yellow',
          minute: meta.minute,
          team,
          player: PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)]
        };
        meta.events = [newEvent, ...meta.events];
        meta.stats.fouls[team]++;
        
        const cardCount = meta.events.filter(e => e.type === 'card' && e.team === team).length;
        const cardText = `${newEvent.cardType === 'yellow' ? 'Yellow' : 'Red'} Card (${cardCount})`;
        updateMatchState(match.id, { 
          events: meta.events, 
          stats: { ...meta.stats }, 
          lastEvent: cardText 
        });
      }
      // Stat update: Shots/Corners/Possession (5% chance)
      else if (roll > 0.95) {
        const team = Math.random() > 0.5 ? 'home' : 'away';
        if (roll > 0.98) meta.stats.corners[team]++;
        else if (roll > 0.97) meta.stats.shotsOffTarget[team]++;
        else if (roll > 0.96) {
          meta.stats.possession.home = Math.max(30, Math.min(70, meta.stats.possession.home + (Math.random() > 0.5 ? 1 : -1)));
          meta.stats.possession.away = 100 - meta.stats.possession.home;
        }
        updateMatchState(match.id, { stats: { ...meta.stats }, minute: meta.minute });
      } else {
        updateMatchState(match.id, { minute: meta.minute });
      }
    });

    // 2. Normal Odds Fluctuations
    const matchCount = Math.min(matches.length, Math.floor(Math.random() * 2) + 1);
    const shuffled = [...matches].sort(() => Math.random() - 0.5).slice(0, matchCount);

    shuffled.forEach(match => {
      const isLive = match.isLive || new Date(match.commence_time) < new Date();
      const updateProbability = isLive ? 0.8 : 0.2;
      if (Math.random() > updateProbability) return;

      const bookmaker = match.bookmakers[0];
      if (!bookmaker) return;
      const h2h = bookmaker.markets.find(m => m.key === 'h2h');
      if (!h2h) return;

      const outcomesToUpdate = [...h2h.outcomes]
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 2) + 1);

      outcomesToUpdate.forEach(outcome => {
        const key = `${match.id}-${outcome.name}`;
        const currentPrice = priceState.current.get(key) ?? outcome.price;
        const currentMomentum = momentumState.current.get(key) ?? 0;

        const randomMove = (Math.random() - 0.5) * (isLive ? 0.25 : 0.08);
        const newMomentum = currentMomentum * 0.7 + randomMove * 0.3;
        const delta = newMomentum + randomMove;

        const newPrice = Math.max(1.05, Math.min(25.0, currentPrice + delta));
        const roundedPrice = Math.round(newPrice * 20) / 20;

        priceState.current.set(key, roundedPrice);
        momentumState.current.set(key, newMomentum);

        onUpdate({
          matchId: match.id,
          outcomeKey: outcome.name,
          newPrice: roundedPrice,
          timestamp: Date.now(),
        });
      });
    });
  }, [enabled, matches, onUpdate, updateMatchState]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(simulateTick, intervalMs);
    return () => clearInterval(interval);
  }, [simulateTick, enabled, intervalMs]);
}
