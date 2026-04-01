import type { AppProps } from 'next/app';
import { SimulationProvider } from '../components/SimulationProvider';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SimulationProvider>
      <Component {...pageProps} />
    </SimulationProvider>
  );
}
