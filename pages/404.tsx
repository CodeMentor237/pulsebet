import Link from 'next/link';
import Head from 'next/head';

export default function Custom404() {
  return (
    <>
      <Head><title>404 — PulseBet</title></Head>
      <div className="min-h-screen grid-bg flex flex-col items-center justify-center px-4 text-center">
        <p className="font-display font-black text-[80px] text-white/8 leading-none select-none">404</p>
        <p className="font-display font-black text-2xl text-white tracking-wide mt-2">PAGE NOT FOUND</p>
        <p className="font-mono text-sm text-white/30 mt-2 mb-6">This match doesn't exist in our markets.</p>
        <Link href="/" className="font-display font-bold text-sm px-5 py-2.5 rounded-xl bg-volt text-pitch hover:bg-volt-glow transition-colors tracking-wider">
          BACK TO LOBBY
        </Link>
      </div>
    </>
  );
}
