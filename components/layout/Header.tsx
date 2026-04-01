import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { LatencyIndicator } from '../ui/LatencyIndicator';
import { useBetSlipStore, useAuthStore, useLiveOddsStore } from '../../store';
import { useLatency } from '../../hooks/useLatency';

export function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const { selections, toggleSlip, isOpen: isSlipOpen } = useBetSlipStore();
  const { isAuthenticated, username, logout } = useAuthStore();
  const { simulationEnabled, toggleSimulation } = useLiveOddsStore();
  const latency = useLatency(simulationEnabled);

  const navItems = [
    { label: 'LOBBY', href: '/' },
    { label: 'LIVE', href: '/?filter=live' },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="sticky top-0 z-[60] glass border-b border-white/8">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-volt flex items-center justify-center">
            <span className="font-display font-black text-pitch text-base leading-none">P</span>
          </div>
          <span className="font-display font-black text-white text-lg tracking-wider">
            PULSE<span className="text-volt">BET</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'px-3 py-1.5 rounded-lg font-display font-bold text-xs tracking-wider transition-colors',
                router.asPath === item.href
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white hover:bg-white/6'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Right cluster */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          {simulationEnabled && <LatencyIndicator latency={latency} />}

          <button
            onClick={toggleSimulation}
            title={simulationEnabled ? 'Pause live simulation' : 'Resume live simulation'}
            className={clsx(
              'font-mono text-[10px] px-2 py-1 rounded-md border transition-all',
              simulationEnabled
                ? 'border-volt/40 text-volt bg-volt/10 hover:bg-volt/15'
                : 'border-white/15 text-white/30 hover:border-white/25'
            )}
          >
            {simulationEnabled ? '◉ SIM ON' : '◎ SIM OFF'}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-white/40">{username}</span>
              <button
                onClick={logout}
                className="font-mono text-[10px] text-white/30 hover:text-white transition-colors"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="font-display font-bold text-xs px-3 py-1.5 rounded-lg glass border border-white/15 text-white/70 hover:border-white/30 hover:text-white transition-all tracking-wider"
            >
              LOGIN
            </Link>
          )}

          <button
            onClick={toggleSlip}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-display font-bold text-xs tracking-wider transition-all duration-200',
              selections.length > 0
                ? 'bg-volt text-pitch hover:bg-volt-glow'
                : 'glass border border-white/15 text-white/60 hover:border-white/25'
            )}
          >
            {selections.length > 0 && (
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black bg-pitch text-volt">
                {selections.length}
              </span>
            )}
            SLIP
          </button>
        </div>

        {/* Mobile Header Elements */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          {simulationEnabled && <LatencyIndicator latency={latency} />}
          
          <button
            onClick={toggleMenu}
            className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-lg glass border border-white/10"
            aria-label="Toggle mobile menu"
          >
            <motion.div 
              animate={{ rotate: isMenuOpen ? 45 : 0, y: isMenuOpen ? 6 : 0 }}
              className="w-5 h-0.5 bg-white/70 rounded-full" 
            />
            <motion.div 
              animate={{ opacity: isMenuOpen ? 0 : 1 }}
              className="w-5 h-0.5 bg-white/70 rounded-full" 
            />
            <motion.div 
              animate={{ rotate: isMenuOpen ? -45 : 0, y: isMenuOpen ? -6 : 0 }}
              className="w-5 h-0.5 bg-white/70 rounded-full" 
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-14 left-0 right-0 glass border-b border-white/12 md:hidden overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-4 bg-pitch/95 backdrop-blur-xl">
              {/* Nav Links */}
              <div className="flex flex-col gap-1">
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={clsx(
                      'px-4 py-3 rounded-xl font-display font-bold text-base tracking-widest transition-colors',
                      router.asPath === item.href
                        ? 'bg-volt/10 text-volt border border-volt/20'
                        : 'text-white/50 border border-transparent'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="h-px bg-white/5 -mx-4" />

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {/* Simulation Toggle */}
                <button
                  onClick={() => { toggleSimulation(); setIsMenuOpen(false); }}
                  className={clsx(
                    'flex items-center justify-between px-4 py-3 rounded-xl border font-mono text-xs tracking-wider transition-all',
                    simulationEnabled
                      ? 'border-volt/30 bg-volt/5 text-volt'
                      : 'border-white/10 text-white/30'
                  )}
                >
                  <span>LIVE SIMULATION</span>
                  <span>{simulationEnabled ? 'ON' : 'OFF'}</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  {/* Auth Button */}
                  {isAuthenticated ? (
                    <button
                      onClick={() => { logout(); setIsMenuOpen(false); }}
                      className="flex flex-col items-center justify-center p-4 rounded-xl glass border border-white/10"
                    >
                      <span className="font-mono text-[10px] text-white/30 mb-1">{username}</span>
                      <span className="font-display font-bold text-sm text-white/80">LOGOUT</span>
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center p-4 rounded-xl glass border border-white/10 font-display font-bold text-sm text-white/80"
                    >
                      LOGIN
                    </Link>
                  )}

                  {/* Slip Button */}
                  <button
                    onClick={() => { toggleSlip(); setIsMenuOpen(false); }}
                    className={clsx(
                      'flex flex-col items-center justify-center p-4 rounded-xl font-display font-bold transition-all',
                      selections.length > 0
                        ? 'bg-volt text-pitch'
                        : 'glass border border-white/10 text-white/40'
                    )}
                  >
                    {selections.length > 0 && (
                      <span className="text-pitch font-black text-lg leading-none mb-1">
                        {selections.length}
                      </span>
                    )}
                    <span className="text-sm">BET SLIP</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
