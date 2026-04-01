/**
 * Tests for useBetSlipStore — Zustand bet slip state management
 *
 * Validates:
 * 1. Adding selections (accumulator)
 * 2. Same-match replacement (only one outcome per match)
 * 3. Removing selections
 * 4. Total odds calculation
 * 5. Potential payout calculation
 * 6. Clearing the slip
 * 7. Live odds updates propagate to slip
 */

import { act } from '@testing-library/react';
import { useBetSlipStore, useAuthStore } from '../store';
import { BetSelection } from '../lib/types';

// Reset store between tests
beforeEach(() => {
  act(() => {
    useBetSlipStore.setState({
      selections: [],
      placedBets: [],
      stake: '10',
      isOpen: false,
      isHistoryOpen: false,
      placingBet: false,
      betPlaced: false,
    });
  });
});

const makeSelection = (overrides: Partial<BetSelection> = {}): BetSelection => ({
  matchId: 'match_1',
  matchTitle: 'Arsenal vs Chelsea',
  market: 'Match Result',
  selection: 'Arsenal',
  odds: 2.50,
  addedAt: Date.now(),
  ...overrides,
});

describe('useBetSlipStore — Bet Slip', () => {

  test('adds a selection', () => {
    const sel = makeSelection();
    act(() => useBetSlipStore.getState().addSelection(sel));

    const { selections } = useBetSlipStore.getState();
    expect(selections).toHaveLength(1);
    expect(selections[0].selection).toBe('Arsenal');
    expect(selections[0].odds).toBe(2.50);
  });

  test('opens slip when selection is added', () => {
    act(() => useBetSlipStore.getState().addSelection(makeSelection()));
    expect(useBetSlipStore.getState().isOpen).toBe(true);
  });

  test('replaces selection for same match (only one outcome per match)', () => {
    const home = makeSelection({ selection: 'Arsenal', odds: 2.50 });
    const away = makeSelection({ selection: 'Chelsea', odds: 4.20 });

    act(() => useBetSlipStore.getState().addSelection(home));
    act(() => useBetSlipStore.getState().addSelection(away));

    const { selections } = useBetSlipStore.getState();
    expect(selections).toHaveLength(1);
    expect(selections[0].selection).toBe('Chelsea');
    expect(selections[0].odds).toBe(4.20);
  });

  test('accumulates selections from different matches', () => {
    const sel1 = makeSelection({ matchId: 'match_1', selection: 'Arsenal', odds: 2.50 });
    const sel2 = makeSelection({ matchId: 'match_2', matchTitle: 'Liverpool vs Man City', selection: 'Liverpool', odds: 1.85 });

    act(() => useBetSlipStore.getState().addSelection(sel1));
    act(() => useBetSlipStore.getState().addSelection(sel2));

    expect(useBetSlipStore.getState().selections).toHaveLength(2);
  });

  test('removes a selection by matchId + selection', () => {
    const sel1 = makeSelection({ matchId: 'match_1', selection: 'Arsenal' });
    const sel2 = makeSelection({ matchId: 'match_2', selection: 'Liverpool' });

    act(() => {
      useBetSlipStore.getState().addSelection(sel1);
      useBetSlipStore.getState().addSelection(sel2);
    });

    act(() => useBetSlipStore.getState().removeSelection('match_1', 'Arsenal'));

    const { selections } = useBetSlipStore.getState();
    expect(selections).toHaveLength(1);
    expect(selections[0].selection).toBe('Liverpool');
  });

  test('calculates total accumulator odds correctly', () => {
    const sel1 = makeSelection({ matchId: 'match_1', odds: 2.00 });
    const sel2 = makeSelection({ matchId: 'match_2', odds: 3.00 });
    const sel3 = makeSelection({ matchId: 'match_3', odds: 1.50 });

    act(() => {
      useBetSlipStore.getState().addSelection(sel1);
      useBetSlipStore.getState().addSelection(sel2);
      useBetSlipStore.getState().addSelection(sel3);
    });

    const total = useBetSlipStore.getState().totalOdds();
    // 2.00 * 3.00 * 1.50 = 9.00
    expect(total).toBeCloseTo(9.00, 5);
  });

  test('returns 0 totalOdds when slip is empty', () => {
    expect(useBetSlipStore.getState().totalOdds()).toBe(0);
  });

  test('calculates potential payout (stake × total odds)', () => {
    act(() => {
      useBetSlipStore.getState().addSelection(makeSelection({ matchId: 'match_1', odds: 2.00 }));
      useBetSlipStore.getState().addSelection(makeSelection({ matchId: 'match_2', odds: 2.50 }));
      useBetSlipStore.getState().setStake('20');
    });

    const payout = useBetSlipStore.getState().potentialPayout();
    // 20 * (2.00 * 2.50) = 20 * 5.00 = 100
    expect(payout).toBeCloseTo(100, 5);
  });

  test('clears all selections and resets state', () => {
    act(() => {
      useBetSlipStore.getState().addSelection(makeSelection({ matchId: 'match_1' }));
      useBetSlipStore.getState().addSelection(makeSelection({ matchId: 'match_2' }));
      useBetSlipStore.getState().clearSlip();
    });

    const { selections, betPlaced } = useBetSlipStore.getState();
    expect(selections).toHaveLength(0);
    expect(betPlaced).toBe(false);
  });

  test('updateOdds reflects live price changes in the slip', () => {
    act(() => useBetSlipStore.getState().addSelection(makeSelection({ odds: 2.50 })));
    act(() => useBetSlipStore.getState().updateOdds('match_1', 'Arsenal', 2.75));

    const { selections } = useBetSlipStore.getState();
    expect(selections[0].odds).toBe(2.75);
  });

  test('hasSelection correctly identifies selected outcomes', () => {
    act(() => useBetSlipStore.getState().addSelection(makeSelection({
      matchId: 'match_1', selection: 'Arsenal'
    })));

    const store = useBetSlipStore.getState();
    expect(store.hasSelection('match_1', 'Arsenal')).toBe(true);
    expect(store.hasSelection('match_1', 'Chelsea')).toBe(false);
    expect(store.hasSelection('match_2', 'Arsenal')).toBe(false);
  });

  test('placeBet adds a bet to history when authenticated', async () => {
    // Mock authentication
    act(() => {
      useAuthStore.setState({ isAuthenticated: true, username: 'testuser' });
      useBetSlipStore.getState().addSelection(makeSelection({ odds: 2.0 }));
      useBetSlipStore.getState().setStake('50');
    });

    await act(async () => {
      await useBetSlipStore.getState().placeBet();
    });

    const { placedBets, selections } = useBetSlipStore.getState();
    expect(placedBets).toHaveLength(1);
    expect(placedBets[0].username).toBe('testuser');
    expect(placedBets[0].stake).toBe(50);
    expect(placedBets[0].potentialPayout).toBe(100);
    // Selections should be cleared after placeBet (it happens in a setTimeout in the implementation, 
    // but the store state 'selections' is cleared after 3s. 
    // In our implementation, we add to placedBets IMMEDIATELY after 1.2s delay).
  });
});
