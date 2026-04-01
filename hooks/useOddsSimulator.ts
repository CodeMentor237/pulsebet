import { useEffect, useRef, useCallback } from 'react';
import { OddsUpdate, MatchStats, MatchEvent } from '../lib/types';
import { useLiveOddsStore, useBetSlipStore } from '../store';

interface UseOddsSimulatorOptions {
  enabled: boolean;
  onUpdate: (update: OddsUpdate) => void;
  intervalMs?: number;
}

const PLAYER_NAMES = [
  'V. Junior', 'J. Bellingham', 'R. Lewandowski', 'K. Mbappe', 'E. Haaland',
  'M. Salah', 'K. De Bruyne', 'L. Martinez', 'H. Kane', 'V. Osimhen',
  'B. Saka', 'P. Foden', 'R. Leao', 'Pedri', 'Gavi', 'Musiala', 'L. Modric', 'T. Kroos'
];

export function useOddsSimulator({ enabled, onUpdate, intervalMs = 1000 }: UseOddsSimulatorOptions) {
  const { 
    matches, matchStates, updateMatchState, initializeSession, 
    refillPool, cleanupPool 
  } = useLiveOddsStore();
  
  const priceState = useRef<Map<string, number>>(new Map());
  const momentumState = useRef<Map<string, number>>(new Map());

  // Initialize session matches if empty
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  const simulateTick = useCallback(() => {
    if (!enabled || matches.length === 0) return;

    const now = Date.now();

    matches.forEach(match => {
      const startTime = new Date(match.commence_time).getTime();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      
      const meta = useLiveOddsStore.getState().matchStates[match.id] || {
        score: { home: 0, away: 0 },
        minute: 0,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          shotsOffTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          fouls: { home: 0, away: 0 }
        },
        status: 'upcoming'
      };

      let newStatus: 'upcoming' | 'live' | 'halftime' | 'finished' = 'upcoming';
      let displayMinute = 0;

      if (elapsedSeconds < 0) {
        newStatus = 'upcoming';
        displayMinute = 0;
      } else if (elapsedSeconds < 45) {
        newStatus = 'live';
        displayMinute = elapsedSeconds + 1;
      } else if (elapsedSeconds < 60) {
        newStatus = 'halftime';
        displayMinute = 45;
      } else if (elapsedSeconds < 105) {
        newStatus = 'live';
        displayMinute = elapsedSeconds - 15 + 1;
      } else {
        newStatus = 'finished';
        displayMinute = 90;
      }

      // If status changed to finished, settle bets
      if (newStatus === 'finished' && meta.status !== 'finished') {
        useBetSlipStore.getState().settleFinishedMatch(match.id, match, meta.score);
      }

      // If upcoming, just update status and exit
      if (newStatus === 'upcoming') {
        if (meta.status !== 'upcoming') updateMatchState(match.id, { status: 'upcoming', minute: 0 });
        return;
      }

      // Only process event rolls if the minute has progressed
      const hasMinuteProgressed = displayMinute > meta.minute;
      
      if (hasMinuteProgressed && newStatus !== 'finished' && newStatus !== 'halftime') {
        const roll = Math.random();
        const score = { ...meta.score };
        let events = [...meta.events];
        const stats = { ...meta.stats };
        let lastEvent = meta.lastEvent;
        let didScore = false;
        let eventTeam: 'home' | 'away' | null = null;

        // Goal (1.2% chance per minute)
        if (roll > 0.988) {
          eventTeam = Math.random() > 0.5 ? 'home' : 'away';
          score[eventTeam]++;
          const newEvent: MatchEvent = {
            id: `goal-${now}-${match.id}`,
            type: 'goal',
            minute: displayMinute,
            team: eventTeam,
            player: PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)],
            assist: Math.random() > 0.4 ? PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)] : undefined
          };
          events = [newEvent, ...events];
          stats.shotsOnTarget[eventTeam]++;
          lastEvent = `GOAL! ${eventTeam === 'home' ? match.home_team : match.away_team} scores! (${score.home}-${score.away})`;
          didScore = true;
        } 
        // Card (2% chance)
        else if (roll > 0.968) {
          const team = Math.random() > 0.5 ? 'home' : 'away';
          stats.fouls[team]++;
          if (Math.random() > 0.8) {
             const newEvent: MatchEvent = {
               id: `card-${now}-${match.id}`,
               type: 'card',
               cardType: 'yellow',
               minute: displayMinute,
               team,
               player: PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)]
             };
             events = [newEvent, ...events];
             lastEvent = `Yellow Card - ${newEvent.player}`;
          }
        }
        // General stats
        else if (roll > 0.8) {
          const team = Math.random() > 0.5 ? 'home' : 'away';
          if (roll > 0.95) stats.corners[team]++;
          else if (roll > 0.9) stats.shotsOffTarget[team]++;
          stats.possession.home = Math.max(30, Math.min(70, stats.possession.home + (Math.random() > 0.5 ? 1 : -1)));
          stats.possession.away = 100 - stats.possession.home;
        }

        updateMatchState(match.id, {
          status: newStatus,
          minute: displayMinute,
          score,
          events,
          stats,
          lastEvent
        });

        // Trigger major odds shift if goal
        if (didScore && eventTeam) {
          const bookmaker = match.bookmakers[0];
          if (bookmaker) {
            bookmaker.markets.find(m => m.key === 'h2h')?.outcomes.forEach(o => {
              const key = `${match.id}-${o.name}`;
              const currentPrice = priceState.current.get(key) ?? o.price;
              const shift = (Math.random() * 1.5 + 0.5) * (eventTeam === 'home' ? (o.name === match.home_team ? -0.8 : 0.6) : (o.name === match.away_team ? -0.8 : 0.6));
              const newPrice = Math.max(1.01, Math.min(100, currentPrice + shift));
              const roundedPrice = Math.round(newPrice * 20) / 20;
              priceState.current.set(key, roundedPrice);
              onUpdate({ matchId: match.id, outcomeKey: o.name, newPrice: roundedPrice, timestamp: now });
            });
          }
        }
      } else {
        // Just update status and minute if no event roll needed
        updateMatchState(match.id, { status: newStatus, minute: displayMinute });
      }
    });

    // 2. Normal Odds Fluctuations
    const liveMatches = matches.filter(m => {
       const s = useLiveOddsStore.getState().matchStates[m.id]?.status;
       return s === 'live' || s === 'halftime';
    });
    
    if (liveMatches.length > 0) {
      const shuffled = [...liveMatches].sort(() => Math.random() - 0.5).slice(0, 2);
      shuffled.forEach(match => {
        if (Math.random() > 0.4) return;
        const bookmaker = match.bookmakers[0];
        if (!bookmaker) return;
        const h2h = bookmaker.markets.find(m => m.key === 'h2h');
        if (!h2h) return;

        h2h.outcomes.forEach(outcome => {
          const key = `${match.id}-${outcome.name}`;
          const currentPrice = priceState.current.get(key) ?? outcome.price;
          const randomMove = (Math.random() - 0.5) * 0.1;
          const newPrice = Math.max(1.05, Math.min(50.0, currentPrice + randomMove));
          const roundedPrice = Math.round(newPrice * 20) / 20;
          priceState.current.set(key, roundedPrice);
          onUpdate({ matchId: match.id, outcomeKey: outcome.name, newPrice: roundedPrice, timestamp: now });
        });
      });
    }

    // 3. Pool Maintenance: Refill and Cleanup
    refillPool();
    cleanupPool();

  }, [enabled, matches, onUpdate, updateMatchState, refillPool, cleanupPool]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(simulateTick, intervalMs);
    return () => clearInterval(interval);
  }, [simulateTick, enabled, intervalMs]);
}
