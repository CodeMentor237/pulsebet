import { memo } from 'react';
import { Match } from '../../lib/types';
import { MatchCard } from './MatchCard';

interface Props {
  liveMatches: Match[];
}

export const FeaturedLive = memo(function FeaturedLive({ liveMatches }: Props) {
  if (liveMatches.length === 0) return null;

  // Take up to 2 live matches for the featured section
  const featured = liveMatches.slice(0, 2);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="live-dot" />
        <h2 className="font-display font-black text-xl text-white tracking-widest uppercase">
          Featured Live
        </h2>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {featured.map(match => (
          <MatchCard key={`featured-${match.id}`} match={match} />
        ))}
      </div>
    </div>
  );
});
