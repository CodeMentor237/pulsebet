import { useState, useEffect, useRef } from 'react';
import { LatencyState } from '../lib/types';

/**
 * useLatency — simulates and tracks frontend latency metrics
 * In a real implementation, this would measure the round-trip time of
 * WebSocket heartbeat messages. Here we simulate realistic variance.
 */
export function useLatency(isActive: boolean = true): LatencyState {
  const [latency, setLatency] = useState<LatencyState>({
    ms: 42,
    status: 'good',
    lastUpdate: Date.now(),
  });

  const baseMs = useRef(38);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // Simulate realistic network jitter with occasional spikes
      const jitter = (Math.random() - 0.5) * 30;
      const spike = Math.random() < 0.05 ? Math.random() * 200 : 0; // 5% chance of spike
      const newMs = Math.max(12, Math.round(baseMs.current + jitter + spike));

      // Slowly drift base latency (simulates real network conditions)
      baseMs.current = Math.max(20, Math.min(120, baseMs.current + (Math.random() - 0.5) * 5));

      let status: LatencyState['status'] = 'good';
      if (newMs > 150) status = 'bad';
      else if (newMs > 80) status = 'warn';

      setLatency({ ms: newMs, status, lastUpdate: Date.now() });
    }, 1200);

    return () => clearInterval(interval);
  }, [isActive]);

  return latency;
}
