import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BetSelection, Match, MatchStats, MatchEvent, PlacedBet } from '../lib/types';
import { useNotificationStore } from './notifications';

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
  hasSelection: (matchId: string, selection: string) => boolean;
  totalOdds: () => number;
  potentialPayout: () => number;
}

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

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
        const { isAuthenticated, username, withdraw, deposit } = auth;
        
        if (!isAuthenticated || !username) return;

        const currentSelections = get().selections;
        if (currentSelections.length === 0) return;

        const stakeAmount = parseFloat(get().stake) || 0;

        // 1. Check & Deduct Balance
        if (!withdraw(stakeAmount)) {
          useNotificationStore.getState().notify("Insufficient funds in your wallet!", "error");
          return;
        }

        set({ placingBet: true });
        await new Promise(r => setTimeout(r, 1200));

        const odds = get().totalOdds();
        const status = Math.random() > 0.5 ? 'won' : 'lost';
        const payout = odds * stakeAmount;

        const newBet: PlacedBet = {
          id: `bet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          username,
          selections: [...currentSelections],
          stake: stakeAmount,
          totalOdds: odds,
          potentialPayout: payout,
          placedAt: Date.now(),
          status,
        };

        // 2. Credit Winnings if Won
        if (status === 'won') {
          deposit(payout);
          useNotificationStore.getState().notify(`Bet won! $${payout.toFixed(2)} added to balance`, "success");
        } else {
          useNotificationStore.getState().notify("Bet lost. Better luck next time!", "info");
        }

        set(state => ({ 
          placingBet: false, 
          betPlaced: true,
          placedBets: [newBet, ...state.placedBets],
        }));

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
