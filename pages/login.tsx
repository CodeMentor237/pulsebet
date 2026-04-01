import { useState, FormEvent } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import { useAuthStore } from '../store';

const Login: NextPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter a username and password.');
      return;
    }
    setLoading(true);
    const ok = await login(username, password);
    setLoading(false);
    if (ok) {
      router.push('/');
    } else {
      setError('Invalid credentials. Try any username + password.');
    }
  };

  return (
    <>
      <Head>
        <title>Login — PulseBet</title>
      </Head>
      <div className="min-h-screen grid-bg noise flex items-center justify-center px-4">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, #C8F135, transparent 70%)' }} />
        </div>

        <div className="relative w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-volt flex items-center justify-center">
                <span className="font-display font-black text-pitch text-lg leading-none">P</span>
              </div>
              <span className="font-display font-black text-white text-2xl tracking-wider">
                PULSE<span className="text-volt">BET</span>
              </span>
            </Link>
            <p className="font-mono text-xs text-white/30 mt-2">Sign in to place bets</p>
          </div>

          {/* Card */}
          <div className="glass rounded-2xl border border-white/10 p-6">
            <form onSubmit={handleSubmit} noValidate aria-label="Login form">
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block font-mono text-[10px] text-white/40 tracking-widest mb-1.5">
                    USERNAME
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Any username"
                    className={clsx(
                      'w-full bg-white/5 border rounded-lg px-4 py-3 font-body text-sm text-white',
                      'placeholder:text-white/20 outline-none transition-all',
                      'focus:border-volt/50 focus:bg-white/8',
                      error ? 'border-fire/50' : 'border-white/12'
                    )}
                    aria-required="true"
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block font-mono text-[10px] text-white/40 tracking-widest mb-1.5">
                    PASSWORD
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Any password"
                    className={clsx(
                      'w-full bg-white/5 border rounded-lg px-4 py-3 font-body text-sm text-white',
                      'placeholder:text-white/20 outline-none transition-all',
                      'focus:border-volt/50 focus:bg-white/8',
                      error ? 'border-fire/50' : 'border-white/12'
                    )}
                    aria-required="true"
                  />
                </div>

                {error && (
                  <p id="login-error" role="alert" className="font-mono text-xs text-fire">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={clsx(
                    'w-full py-3.5 rounded-xl font-display font-black text-base tracking-wider transition-all duration-200 mt-2',
                    loading
                      ? 'bg-volt/30 text-pitch/60 cursor-not-allowed'
                      : 'bg-volt text-pitch hover:bg-volt-glow volt-glow active:scale-[0.98]'
                  )}
                  aria-busy={loading}
                >
                  {loading ? 'SIGNING IN...' : 'SIGN IN'}
                </button>
              </div>
            </form>

            <div className="mt-5 pt-4 border-t border-white/8 text-center">
              <p className="font-mono text-[10px] text-white/25">
                Demo: enter any username + password to continue
              </p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="font-mono text-xs text-white/30 hover:text-volt transition-colors">
              ← Back to lobby
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
