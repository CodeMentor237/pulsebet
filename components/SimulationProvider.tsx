import { ReactNode, useCallback } from 'react';
import { useBufferedOdds } from '../hooks/useBufferedOdds';
import { useOddsSimulator } from '../hooks/useOddsSimulator';
import { useLiveOddsStore } from '../store';
import { MOCK_MATCHES } from '../lib/mockData';
import { OddsUpdate } from '../lib/types';

interface Props {
  children: ReactNode;
}

/**
 * SimulationProvider — the "heartbeat" of the application.
 *
 * Centralizing the simulation here ensures that all matches progress in sync,
 * regardless of which page the user is viewing. It prevents "alternate realities"
 * from forming when navigating between the home screen and detail pages.
 */
export function SimulationProvider({ children }: Props) {
  const { applyUpdates, simulationEnabled } = useLiveOddsStore();

  const handleFlush = useCallback((updates: OddsUpdate[]) => {
    applyUpdates(updates);
  }, [applyUpdates]);

  const { pushBatch } = useBufferedOdds({
    flushIntervalMs: 500,
    onFlush: handleFlush,
  });

  // Background simulation for all mock matches
  useOddsSimulator({
    enabled: simulationEnabled,
    onUpdate: (update) => pushBatch([update]),
    intervalMs: 2000, // 2 real seconds = 1 match minute
  });

  return <>{children}</>;
}
