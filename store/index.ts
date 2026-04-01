import { create } from 'zustand';
import { BetSelection, Match, MatchStats, MatchEvent } from '../lib/types';

// ─── Auth Store ────────────────────────────────────────────────────────────────
interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  username: null,
  token: null,

  login: async (username, password) => {
    if (!username.trim() || !password.trim()) return false;
    await new Promise(r => setTimeout(r, 600));
    const fakeToken = btoa(`${username}:${Date.now()}`);
    set({ isAuthenticated: true, username, token: fakeToken });
    return true;
  },

  logout: () => set({ isAuthenticated: false, username: null, token: null }),
}));

// ─── Bet Slip Store ────────────────────────────────────────────────────────────
interface BetSlipState {
  selections: BetSelection[];
  stake: string;
  isOpen: boolean;
  placingBet: boolean;
  betPlaced: boolean;

  addSelection: (sel: BetSelection) => void;
  removeSelection: (matchId: string, selection: string) => void;
  updateOdds: (matchId: string, selection: string, newOdds: number) => void;
  setStake: (stake: string) => void;
  toggleSlip: () => void;
  openSlip: () => void;
  clearSlip: () => void;
  placeBet: () => Promise<void>;
  hasSelection: (matchId: string, selection: string) => boolean;
  totalOdds: () => number;
  potentialPayout: () => number;
}

export const useBetSlipStore = create<BetSlipState>((set, get) => ({
  selections: [],
  stake: '10',
  isOpen: false,
  placingBet: false,
  betPlaced: false,

  addSelection: (sel) => {
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
  toggleSlip: () => set(state => ({ isOpen: !state.isOpen })),
  openSlip: () => set({ isOpen: true }),
  clearSlip: () => set({ selections: [], betPlaced: false }),
  placeBet: async () => {
    set({ placingBet: true });
    await new Promise(r => setTimeout(r, 1200));
    set({ placingBet: false, betPlaced: true });
    setTimeout(() => set({ betPlaced: false, selections: [], isOpen: false }), 3000);
  },
  hasSelection: (matchId, selection) =>
    get().selections.some(s => s.matchId === matchId && s.selection === selection),
  totalOdds: () => {
    const sels = get().selections;
    if (sels.length === 0) return 0;
    return sels.reduce((acc, s) => acc * s.odds, 1);
  },
  potentialPayout: () => (parseFloat(get().stake) || 0) * get().totalOdds(),
}));

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
}

interface LiveOddsState {
  oddsMap: Record<string, Record<string, OddsChangeRecord>>;
  matchStates: Record<string, MatchState>;
  simulationEnabled: boolean;

  applyUpdates: (updates: Array<{ matchId: string; outcomeKey: string; newPrice: number; timestamp: number }>) => void;
  updateMatchState: (matchId: string, state: Partial<MatchState>) => void;
  toggleSimulation: () => void;
  getOdds: (matchId: string, outcomeName: string, fallback: number) => OddsChangeRecord | null;
}

export const useLiveOddsStore = create<LiveOddsState>((set, get) => ({
  oddsMap: {},
  matchStates: {},
  simulationEnabled: true,

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
      // If we are trying to initialize with randoms but we already have state, skip
      if (!current && !newState.score && !newState.minute) {
          // This case might not happen with current simulator logic but good for safety
      }

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

  toggleSimulation: () => set(state => ({ simulationEnabled: !state.simulationEnabled })),
  getOdds: (matchId, outcomeName, fallback) => get().oddsMap[matchId]?.[outcomeName] ?? null,
}));
