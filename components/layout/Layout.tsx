import { ReactNode } from 'react';
import { Header } from './Header';
import { BetSlip } from '../ui/BetSlip';
import { BetHistory } from '../ui/BetHistory';
import { useBetSlipStore } from '../../store';

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  const { isOpen, isHistoryOpen, closeHistory } = useBetSlipStore();

  return (
    <div className="min-h-screen grid-bg noise relative">
      <Header />
      <div className="max-w-screen-xl mx-auto px-4 py-6 flex gap-6">
        <main className="flex-1 min-w-0" id="main-content">
          {children}
        </main>
        {/* Desktop bet slip — always visible on lg+ */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-20">
            <BetSlip />
          </div>
        </div>
      </div>
      {/* Mobile bet slip overlay */}
      <div className="lg:hidden">
        <BetSlip />
      </div>
      {/* Bet History Overlay */}
      <BetHistory isOpen={isHistoryOpen} onClose={closeHistory} />

      {/* Overlay backdrop on mobile when slip is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-pitch/60 z-20 lg:hidden"
          onClick={() => useBetSlipStore.getState().toggleSlip()}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
