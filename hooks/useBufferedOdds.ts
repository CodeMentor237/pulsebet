import { useRef, useCallback, useEffect } from 'react';
import { OddsUpdate } from '../lib/types';

interface BufferedOddsOptions {
  flushIntervalMs?: number;
  onFlush: (updates: OddsUpdate[]) => void;
}

/**
 * useBufferedOdds — Smart Update Engine
 *
 * Core innovation: incoming odds updates are buffered, deduplicated by matchId+outcomeKey
 * (last-write-wins per key), then flushed in a single batch on an interval.
 *
 * This solves three real iGaming problems:
 * 1. Flicker — rapid successive updates to the same odds cell cause visual noise
 * 2. Out-of-order delivery — a slow UDP packet arriving late would show stale data
 * 3. Render bottleneck — 50 matches × 3 outcomes × 10 updates/second = 1500 renders/s
 *    → with buffering, it becomes 50 renders/s maximum
 */
export function useBufferedOdds({ flushIntervalMs = 200, onFlush }: BufferedOddsOptions) {
  // Buffer: keyed by `${matchId}-${outcomeKey}`, last-write-wins
  const buffer = useRef<Map<string, OddsUpdate>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const push = useCallback((update: OddsUpdate) => {
    const key = `${update.matchId}-${update.outcomeKey}`;
    const existing = buffer.current.get(key);
    // Only keep if newer timestamp (handles out-of-order delivery)
    if (!existing || update.timestamp >= existing.timestamp) {
      buffer.current.set(key, update);
    }
  }, []);

  const flush = useCallback(() => {
    if (buffer.current.size === 0) return;
    const updates = Array.from(buffer.current.values());
    buffer.current.clear();
    onFlush(updates);
  }, [onFlush]);

  useEffect(() => {
    intervalRef.current = setInterval(flush, flushIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [flush, flushIntervalMs]);

  const pushBatch = useCallback((updates: OddsUpdate[]) => {
    updates.forEach(push);
  }, [push]);

  return { push, pushBatch };
}
