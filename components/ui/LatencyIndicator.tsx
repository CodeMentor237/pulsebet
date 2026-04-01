import { LatencyState } from '../../lib/types';
import clsx from 'clsx';

interface Props {
  latency: LatencyState;
}

export function LatencyIndicator({ latency }: Props) {
  const colors = {
    good: { dot: 'bg-volt', text: 'text-volt', bar: 'bg-volt' },
    warn: { dot: 'bg-yellow-400', text: 'text-yellow-400', bar: 'bg-yellow-400' },
    bad: { dot: 'bg-fire', text: 'text-fire', bar: 'bg-fire' },
  };
  const c = colors[latency.status];

  return (
    <div className="flex items-center gap-2 select-none">
      <div className={clsx('live-dot', {
        'bg-volt': latency.status === 'good',
        'bg-yellow-400 shadow-yellow-400/60': latency.status === 'warn',
        'bg-fire shadow-fire/60': latency.status === 'bad',
      })} style={{ boxShadow: latency.status === 'good' ? '0 0 6px rgba(200,241,53,0.8)' : undefined }} />
      <span className={clsx('font-mono text-xs font-medium', c.text)}>
        {latency.ms}ms
      </span>
      <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={clsx('latency-bar', c.bar)}
          style={{ width: `${Math.min(100, (latency.ms / 300) * 100)}%` }}
        />
      </div>
    </div>
  );
}
