import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useBetSlipStore } from '../../store';
import { useNotificationStore } from '../../store/notifications';
import clsx from 'clsx';

export const AccountModal: React.FC = () => {
  const { 
    isAccountModalOpen, 
    closeAccountModal, 
    username, 
    balance, 
    deposit, 
    withdraw 
  } = useAuthStore();
  
  const { placedBets } = useBetSlipStore();
  
  const [activeTab, setActiveTab] = useState<'wallet' | 'profile'>('wallet');
  const [amount, setAmount] = useState<string>('');
  const { notify } = useNotificationStore();

  const userBets = placedBets.filter(b => b.username === username);
  const totalWon = userBets.filter(b => b.status === 'won').length;
  const totalLost = userBets.filter(b => b.status === 'lost').length;

  const handleDeposit = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      notify('Enter a valid amount', 'error');
      return;
    }
    deposit(val);
    notify(`Successfully deposited $${val.toFixed(2)}`, 'success');
    setAmount('');
  };

  const handleWithdraw = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      notify('Enter a valid amount', 'error');
      return;
    }
    if (withdraw(val)) {
      notify(`Successfully withdrew $${val.toFixed(2)}`, 'success', 3000);
      setAmount('');
    } else {
      notify('Insufficient funds', 'error');
    }
  };

  if (!isAccountModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAccountModal}
          className="absolute inset-0 bg-pitch/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-xl font-display font-black text-white tracking-widest uppercase">
              Account Management
            </h2>
            <button
              onClick={closeAccountModal}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setActiveTab('wallet')}
              className={clsx(
                "flex-1 py-4 font-display font-bold text-xs tracking-widest transition-all relative",
                activeTab === 'wallet' ? "text-volt" : "text-white/40 hover:text-white"
              )}
            >
              WALLET
              {activeTab === 'wallet' && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-volt" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={clsx(
                "flex-1 py-4 font-display font-bold text-xs tracking-widest transition-all relative",
                activeTab === 'profile' ? "text-volt" : "text-white/40 hover:text-white"
              )}
            >
              PROFILE
              {activeTab === 'profile' && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-volt" />
              )}
            </button>
          </div>

          <div className="p-8 flex-1">
            {activeTab === 'wallet' ? (
              <div className="space-y-6">
                {/* Balance Display */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 text-center">
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Current Balance</p>
                  <p className="text-5xl font-display font-black text-white">
                    <span className="text-volt font-sans mr-1">$</span>
                    {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Input Section */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1 mb-2 block">
                      Transaction Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-8 pr-4 text-white font-bold focus:border-volt/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Quick Select */}
                  <div className="flex gap-2">
                    {[10, 50, 100, 500].map(val => (
                      <button
                        key={val}
                        onClick={() => setAmount(val.toString())}
                        className="flex-1 py-2 bg-white/5 border border-white/5 rounded-lg text-xs font-bold text-zinc-400 hover:bg-white/10 hover:text-white transition-all uppercase"
                      >
                        +${val}
                      </button>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={handleDeposit}
                      className="flex-1 py-4 bg-emerald-500 text-pitch font-display font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.2)] active:scale-95"
                    >
                      DEPOSIT
                    </button>
                    <button
                      onClick={handleWithdraw}
                      className="flex-1 py-4 border-2 border-zinc-700 text-white font-display font-black rounded-2xl hover:border-white transition-all active:scale-95"
                    >
                      WITHDRAW
                    </button>
                  </div>

                  {/* Removed txStatus block since we use global notifications now */}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* User Header */}
                <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="w-16 h-16 rounded-full bg-volt flex items-center justify-center text-pitch text-2xl font-black">
                    {username?.[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-black text-white leading-none">{username}</h3>
                    <p className="text-xs text-zinc-400 mt-2">Verified PulseBet Citizen</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Total Bets</p>
                    <p className="text-2xl font-bold text-white">{userBets.length}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Win Rate</p>
                    <p className="text-2xl font-bold text-white">
                      {userBets.length > 0 ? Math.round((totalWon / userBets.length) * 100) : 0}%
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 border-emerald-500/10">
                    <p className="text-[10px] text-emerald-500/50 uppercase font-black tracking-widest mb-1">Bets Won</p>
                    <p className="text-2xl font-bold text-emerald-400">{totalWon}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 border-rose-500/10">
                    <p className="text-[10px] text-rose-500/50 uppercase font-black tracking-widest mb-1">Bets Lost</p>
                    <p className="text-2xl font-bold text-rose-400">{totalLost}</p>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-[10px] text-zinc-600 text-center uppercase tracking-[0.2em] font-black">
                    Account Secured with Pulse-Guard™
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
