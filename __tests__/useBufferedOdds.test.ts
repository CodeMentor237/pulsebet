/**
 * Tests for useBufferedOdds — the Smart Update Engine
 *
 * Validates:
 * 1. Updates are batched and flushed on interval (not immediately)
 * 2. Same key updates deduplicate (last-write-wins)
 * 3. Out-of-order timestamps are correctly handled (older updates dropped)
 * 4. Buffer clears after flush
 */

import { renderHook, act } from '@testing-library/react';
import { useBufferedOdds } from '../hooks/useBufferedOdds';
import { OddsUpdate } from '../lib/types';

describe('useBufferedOdds — Smart Update Engine', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('batches updates and flushes on interval', () => {
    const onFlush = jest.fn();

    const { result } = renderHook(() =>
      useBufferedOdds({ flushIntervalMs: 200, onFlush })
    );

    act(() => {
      result.current.push({ matchId: 'm1', outcomeKey: 'Arsenal', newPrice: 2.5, timestamp: 1000 });
      result.current.push({ matchId: 'm1', outcomeKey: 'Draw', newPrice: 3.2, timestamp: 1001 });
    });

    // Flush has NOT been called yet — buffering window still open
    expect(onFlush).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(200); });

    // Now it should have flushed once with both updates
    expect(onFlush).toHaveBeenCalledTimes(1);
    const flushed: OddsUpdate[] = onFlush.mock.calls[0][0];
    expect(flushed).toHaveLength(2);
    expect(flushed.map(u => u.outcomeKey)).toEqual(expect.arrayContaining(['Arsenal', 'Draw']));
  });

  test('deduplicates same key — last-write-wins', () => {
    const onFlush = jest.fn();
    const { result } = renderHook(() =>
      useBufferedOdds({ flushIntervalMs: 200, onFlush })
    );

    act(() => {
      // Three rapid updates for the same outcome
      result.current.push({ matchId: 'm1', outcomeKey: 'Liverpool', newPrice: 1.80, timestamp: 1000 });
      result.current.push({ matchId: 'm1', outcomeKey: 'Liverpool', newPrice: 1.85, timestamp: 1050 });
      result.current.push({ matchId: 'm1', outcomeKey: 'Liverpool', newPrice: 1.90, timestamp: 1100 });
    });

    act(() => { jest.advanceTimersByTime(200); });

    const flushed: OddsUpdate[] = onFlush.mock.calls[0][0];
    // Only ONE update for Liverpool should be flushed
    expect(flushed).toHaveLength(1);
    // It should be the LATEST price (1.90)
    expect(flushed[0].newPrice).toBe(1.90);
  });

  test('handles out-of-order delivery — older timestamps are dropped', () => {
    const onFlush = jest.fn();
    const { result } = renderHook(() =>
      useBufferedOdds({ flushIntervalMs: 200, onFlush })
    );

    act(() => {
      // Newer update arrives first (e.g. via different network path)
      result.current.push({ matchId: 'm2', outcomeKey: 'Chelsea', newPrice: 4.50, timestamp: 2000 });
      // Older update arrives late — should be IGNORED
      result.current.push({ matchId: 'm2', outcomeKey: 'Chelsea', newPrice: 4.10, timestamp: 1500 });
    });

    act(() => { jest.advanceTimersByTime(200); });

    const flushed: OddsUpdate[] = onFlush.mock.calls[0][0];
    expect(flushed).toHaveLength(1);
    // Should keep the NEWER price (4.50), not the late-arriving 4.10
    expect(flushed[0].newPrice).toBe(4.50);
  });

  test('buffer is empty after flush — no double-firing', () => {
    const onFlush = jest.fn();
    const { result } = renderHook(() =>
      useBufferedOdds({ flushIntervalMs: 200, onFlush })
    );

    act(() => {
      result.current.push({ matchId: 'm1', outcomeKey: 'Arsenal', newPrice: 2.5, timestamp: 1000 });
    });

    act(() => { jest.advanceTimersByTime(200); });
    expect(onFlush).toHaveBeenCalledTimes(1);

    // Second interval — buffer is empty, onFlush should NOT be called again
    act(() => { jest.advanceTimersByTime(200); });
    expect(onFlush).toHaveBeenCalledTimes(1);
  });

  test('pushBatch adds multiple updates at once', () => {
    const onFlush = jest.fn();
    const { result } = renderHook(() =>
      useBufferedOdds({ flushIntervalMs: 200, onFlush })
    );

    const updates: OddsUpdate[] = [
      { matchId: 'm1', outcomeKey: 'Arsenal', newPrice: 2.60, timestamp: 1000 },
      { matchId: 'm1', outcomeKey: 'Draw', newPrice: 3.40, timestamp: 1000 },
      { matchId: 'm2', outcomeKey: 'Chelsea', newPrice: 4.20, timestamp: 1000 },
    ];

    act(() => { result.current.pushBatch(updates); });
    act(() => { jest.advanceTimersByTime(200); });

    const flushed: OddsUpdate[] = onFlush.mock.calls[0][0];
    expect(flushed).toHaveLength(3);
  });
});
