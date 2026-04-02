import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BetSelection, Match, MatchStats, MatchEvent, PlacedBet } from '../lib/types';
import { useNotificationStore } from './notifications';
import { generateMatchPool, generateMatches } from '../lib/mockData';

// ─── Auth Store ────────────────────────────────────────────────────────────────
interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  token: string | null;
  balance: number;
  isAccountModalOpen: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  deposit: (amount: number) => void;
  withdraw: (amount: number) => boolean;
  toggleAccountModal: () => void;
  closeAccountModal: () => void;
}

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      username: null,
      token: null,
      balance: 1000,
      isAccountModalOpen: false,

      login: async (username, password) => {
        if (!username.trim() || !password.trim()) return false;
        await new Promise(r => setTimeout(r, 600));
        const fakeToken = btoa(`${username}:${Date.now()}`);
        set({ isAuthenticated: true, username, token: fakeToken });
        return true;
      },

      logout: () => set({ isAuthenticated: false, username: null, token: null, isAccountModalOpen: false }),
      
      deposit: (amount) => set(state => ({ balance: state.balance + amount })),
      
      withdraw: (amount) => {
        const current = get().balance;
        if (current < amount) return false;
        set({ balance: current - amount });
        return true;
      },

      toggleAccountModal: () => set(state => ({ 
        isAccountModalOpen: !state.isAccountModalOpen 
      })),

      closeAccountModal: () => set({ isAccountModalOpen: false }),
    }),
    {
      name: 'pulsebet-auth',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : dummyStorage)),
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated, 
        username: state.username, 
        token: state.token,
        balance: state.balance 
      }),
    }
  )
);

// ─── Bet Slip Store ────────────────────────────────────────────────────────────
interface BetSlipState {
  selections: BetSelection[];
  placedBets: PlacedBet[];
  stake: string;
  isOpen: boolean;
  isHistoryOpen: boolean;
  placingBet: boolean;
  betPlaced: boolean;

  addSelection: (sel: BetSelection) => void;
  removeSelection: (matchId: string, selection: string) => void;
  updateOdds: (matchId: string, selection: string, newOdds: number) => void;
  setStake: (stake: string) => void;
  toggleSlip: () => void;
  openSlip: () => void;
  toggleHistory: () => void;
  closeHistory: () => void;
  clearSlip: () => void;
  placeBet: () => Promise<void>;
  settleFinishedMatch: (matchId: string, match: Match, score: { home: number; away: number }) => void;
  hasSelection: (matchId: string, selection: string) => boolean;
  totalOdds: () => number;
  potentialPayout: () => number;
}

export const useBetSlipStore = create<BetSlipState>()(
  persist(
    (set, get) => ({
      selections: [],
      placedBets: [],
      stake: '10',
      isOpen: false,
      isHistoryOpen: false,
      placingBet: false,
      betPlaced: false,

      addSelection: (sel) => {
        const matchStatus = useLiveOddsStore.getState().matchStates[sel.matchId]?.status;
        if (matchStatus === 'finished') {
          useNotificationStore.getState().notify("Cannot add selection: Match has finished.", "error");
          return;
        }

        const existing = get().selections.find(s => s.matchId === sel.matchId);
        if (existing) {
          set(state => ({
            selections: state.selections.map(s => s.matchId === sel.matchId ? sel : s),
            isOpen: true,
          }));
        } else {
          set(state => ({
            selections: [...state.selections, sel],
            isOpen: true,
          }));
        }
      },

      removeSelection: (matchId, selection) => {
        set(state => ({
          selections: state.selections.filter(s => !(s.matchId === matchId && s.selection === selection)),
        }));
      },

      updateOdds: (matchId, selection, newOdds) => {
        set(state => ({
          selections: state.selections.map(s =>
            s.matchId === matchId && s.selection === selection
              ? { ...s, odds: newOdds }
              : s
          ),
        }));
      },

      setStake: (stake) => set({ stake }),
      toggleSlip: () => set(state => ({ isOpen: !state.isOpen, isHistoryOpen: false })),
      openSlip: () => set({ isOpen: true, isHistoryOpen: false }),
      toggleHistory: () => set(state => ({ isHistoryOpen: !state.isHistoryOpen, isOpen: false })),
      closeHistory: () => set({ isHistoryOpen: false }),
      clearSlip: () => set({ selections: [], betPlaced: false }),
      
      placeBet: async () => {
        const auth = useAuthStore.getState();
        const { isAuthenticated, username, withdraw } = auth;
        
        if (!isAuthenticated || !username) return;

        const currentSelections = get().selections;
        if (currentSelections.length === 0) return;

        // 0. Final check: ensure no matches have finished while in slip
        const liveMatchStates = useLiveOddsStore.getState().matchStates;
        const finishedSelection = currentSelections.find(s => liveMatchStates[s.matchId]?.status === 'finished');
        if (finishedSelection) {
          useNotificationStore.getState().notify(`Cannot place bet: ${finishedSelection.matchTitle} has already finished.`, "error");
          return;
        }

        const stakeAmount = parseFloat(get().stake) || 0;

        // 1. Check & Deduct Balance
        if (!withdraw(stakeAmount)) {
          useNotificationStore.getState().notify("Insufficient funds in your wallet!", "error");
          return;
        }

        set({ placingBet: true });
        await new Promise(r => setTimeout(r, 1200));

        const odds = get().totalOdds();
        const payout = odds * stakeAmount;
        
        const selectionsStatus: Record<string, 'pending'|'won'|'lost'> = {};
        currentSelections.forEach(s => {
          selectionsStatus[`${s.matchId}-${s.selection}`] = 'pending';
        });

        const newBet: PlacedBet = {
          id: `bet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          username,
          selections: [...currentSelections],
          selectionsStatus,
          stake: stakeAmount,
          totalOdds: odds,
          potentialPayout: payout,
          placedAt: Date.now(),
          status: 'pending',
        };

        useNotificationStore.getState().notify("Bet placed successfully! Awaiting match results.", "success");

        set(state => ({ 
          placingBet: false, 
          betPlaced: true,
          placedBets: [newBet, ...state.placedBets],
        }));

        setTimeout(() => set({ betPlaced: false, selections: [], isOpen: false }), 3000);
      },

      settleFinishedMatch: (matchId, match, score) => {
        const { deposit } = useAuthStore.getState();
        let homeWon = false;
        let awayWon = false;
        let draw = false;

        if (score.home > score.away) homeWon = true;
        else if (score.away > score.home) awayWon = true;
        else draw = true;

        set(state => {
          const updatedBets = state.placedBets.map(bet => {
            if (bet.status !== 'pending') return bet;

            let updatedStatus = { ...bet.selectionsStatus };
            let modified = false;

            bet.selections.forEach(sel => {
              const key = `${sel.matchId}-${sel.selection}`;
              if (sel.matchId === matchId && updatedStatus[key] === 'pending') {
                modified = true;
                let won = false;
                if (sel.selection === match.home_team && homeWon) won = true;
                if (sel.selection === match.away_team && awayWon) won = true;
                if (sel.selection === 'Draw' && draw) won = true;

                updatedStatus[key] = won ? 'won' : 'lost';
              }
            });

            if (!modified) return bet;

            // Check if entire bet is settled
            const isLost = Object.values(updatedStatus).some(status => status === 'lost');
            const isPending = Object.values(updatedStatus).some(status => status === 'pending');
            
            let finalBetStatus: 'pending' | 'won' | 'lost' = 'pending';
            if (isLost) finalBetStatus = 'lost';
            else if (!isPending) finalBetStatus = 'won';

            if (finalBetStatus === 'won') {
              deposit(bet.potentialPayout);
              useNotificationStore.getState().notify(`Bet won! $${bet.potentialPayout.toFixed(2)} added to balance`, "success");
            } else if (finalBetStatus === 'lost') {
              useNotificationStore.getState().notify("A selection in your bet lost.", "info");
            }

            return {
              ...bet,
              selectionsStatus: updatedStatus,
              status: finalBetStatus,
            };
          });

          return { placedBets: updatedBets };
        });
      },

      hasSelection: (matchId, selection) =>
        get().selections.some(s => s.matchId === matchId && s.selection === selection),
      totalOdds: () => {
        const sels = get().selections;
        if (sels.length === 0) return 0;
        return sels.reduce((acc, s) => acc * s.odds, 1);
      },
      potentialPayout: () => (parseFloat(get().stake) || 0) * get().totalOdds(),
    }),
    {
      name: 'pulsebet-slip',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : dummyStorage)),
      partialize: (state) => ({ 
        selections: state.selections, 
        placedBets: state.placedBets,
        stake: state.stake 
      }),
    }
  )
);

// ─── Live Odds Store ────────────────────────────────────────────────────────────
interface OddsChangeRecord {
  price: number;
  previousPrice: number;
  trend: 'up' | 'down' | 'stable';
  changedAt: number;
}

interface MatchState {
  score: { home: number; away: number };
  minute: number;
  stats: MatchStats;
  events: MatchEvent[];
  lastEvent?: string;
  status?: 'upcoming' | 'live' | 'halftime' | 'finished';
  lastStatusUpdate?: number;
}

interface LiveOddsState {
  matches: Match[];
  oddsMap: Record<string, Record<string, OddsChangeRecord>>;
  matchStates: Record<string, MatchState>;
  simulationEnabled: boolean;

  setMatches: (matches: Match[]) => void;
  initializeSession: () => void;
  resetSimulation: () => void;
  refillPool: () => void;
  cleanupPool: () => void;
  applyUpdates: (updates: Array<{ matchId: string; outcomeKey: string; newPrice: number; timestamp: number }>) => void;
  updateMatchState: (matchId: string, state: Partial<MatchState>) => void;
  batchUpdateMatchStates: (updates: Record<string, Partial<MatchState>>) => void;
  toggleSimulation: () => void;
  getOdds: (matchId: string, outcomeName: string, fallback: number) => OddsChangeRecord | null;
}

export const useLiveOddsStore = create<LiveOddsState>()(
  persist(
    (set, get) => ({
      matches: [],
      oddsMap: {},
      matchStates: {},
      simulationEnabled: true,

      setMatches: (matches) => set({ matches }),
      
      initializeSession: () => {
        if (get().matches.length === 0) {
          const pool = generateMatchPool(20);
          set({ matches: pool });
        }
      },

      resetSimulation: () => {
        const pool = generateMatchPool(20);
        set({ matches: pool, matchStates: {}, oddsMap: {} });
        useNotificationStore.getState().notify("Simulation reset! New matches generated.", "info");
      },

      refillPool: () => {
        const state = get();
        const now = Date.now();
        const upcomingMatches = state.matches.filter(m => {
          const startTime = new Date(m.commence_time).getTime();
          return startTime > now;
        });

        if (upcomingMatches.length < 8) {
          // Find the furthest match start time to schedule after it
          const lastMatchTime = state.matches.length > 0 
            ? Math.max(...state.matches.map(m => new Date(m.commence_time).getTime()))
            : now;
          
          const nextStartOffset = Math.max(0, lastMatchTime - now);
          const newMatches = generateMatches(10, nextStartOffset + 10000, 300000); // 10 more matches staggered in the future
          
          set({ matches: [...state.matches, ...newMatches] });
          console.log(`[SIM] Refilled pool with ${newMatches.length} new matches starting in the future.`);
        }
      },

      cleanupPool: () => {
        const state = get();
        const now = Date.now();
        
        // Remove matches finished for more than 30 simulated minutes (30 seconds)
        const activeMatches = state.matches.filter(m => {
          const startTime = new Date(m.commence_time).getTime();
          const ftTime = startTime + 105000; // 90 mins play + 15 mins HT
          const isRecentlyFinished = now < ftTime + 30000; // 30s buffer (30 simulated mins)
          return isRecentlyFinished;
        });

        if (activeMatches.length < state.matches.length) {
          const removedCount = state.matches.length - activeMatches.length;
          // Clean up matchStates and oddsMap as well
          const newMatchStates = { ...state.matchStates };
          const newOddsMap = { ...state.oddsMap };
          
          const activeIds = new Set(activeMatches.map(m => m.id));
          Object.keys(newMatchStates).forEach(id => {
            if (!activeIds.has(id)) delete newMatchStates[id];
          });
          Object.keys(newOddsMap).forEach(id => {
            if (!activeIds.has(id)) delete newOddsMap[id];
          });

          set({ 
            matches: activeMatches,
            matchStates: newMatchStates,
            oddsMap: newOddsMap
          });
          console.log(`[SIM] Cleanup complete. Removed ${removedCount} stale matches.`);
        }
      },

      applyUpdates: (updates) => {
        set(state => {
          const newMap = { ...state.oddsMap };
          updates.forEach(({ matchId, outcomeKey, newPrice }) => {
            const existing = newMap[matchId]?.[outcomeKey];
            const prevPrice = existing?.price ?? newPrice;
            const trend = newPrice > prevPrice ? 'up' : newPrice < prevPrice ? 'down' : 'stable';

            newMap[matchId] = {
              ...(newMap[matchId] ?? {}),
              [outcomeKey]: {
                price: newPrice,
                previousPrice: prevPrice,
                trend,
                changedAt: Date.now(),
              },
            };
          });
          return { oddsMap: newMap };
        });

        const { selections, updateOdds } = useBetSlipStore.getState();
        updates.forEach(({ matchId, outcomeKey, newPrice }) => {
          const sel = selections.find(s => s.matchId === matchId && s.selection === outcomeKey);
          if (sel) updateOdds(matchId, outcomeKey, newPrice);
        });
      },

      updateMatchState: (matchId, newState) => {
        set(state => {
          const current = state.matchStates[matchId];
          return {
            matchStates: {
              ...state.matchStates,
              [matchId]: {
                ...(current ?? { 
                  score: { home: 0, away: 0 }, 
                  minute: 0,
                  events: [],
                  stats: {
                    possession: { home: 50, away: 50 },
                    shotsOnTarget: { home: 0, away: 0 },
                    shotsOffTarget: { home: 0, away: 0 },
                    corners: { home: 0, away: 0 },
                    fouls: { home: 0, away: 0 }
                  }
                }),
                ...newState,
              },
            },
          };
        });
      },

      batchUpdateMatchStates: (updates) => {
        set(state => {
          const newMatchStates = { ...state.matchStates };
          const defaultState = {
            score: { home: 0, away: 0 },
            minute: 0,
            events: [] as MatchEvent[],
            stats: {
              possession: { home: 50, away: 50 },
              shotsOnTarget: { home: 0, away: 0 },
              shotsOffTarget: { home: 0, away: 0 },
              corners: { home: 0, away: 0 },
              fouls: { home: 0, away: 0 },
            },
          };
          for (const matchId in updates) {
            const current = newMatchStates[matchId];
            newMatchStates[matchId] = {
              ...(current ?? defaultState),
              ...updates[matchId],
            };
          }
          return { matchStates: newMatchStates };
        });
      },

      toggleSimulation: () => set(state => ({ simulationEnabled: !state.simulationEnabled })),
      getOdds: (matchId, outcomeName, fallback) => get().oddsMap[matchId]?.[outcomeName] ?? null,
    }),
    {
      name: 'pulsebet-simulation',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? sessionStorage : dummyStorage)),
      partialize: (state) => ({ 
        matches: state.matches, 
        matchStates: state.matchStates,
        oddsMap: state.oddsMap,
        simulationEnabled: state.simulationEnabled 
      }),
    }
  )
);
