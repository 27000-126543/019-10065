import { Target } from 'lucide-react';
import type { MatchHit } from '@/types';
import { matchTypeLabels, matchTypeColors } from '@/types';

interface MatchHitsBadgeProps {
  hits: MatchHit[];
  compact?: boolean;
}

export function MatchHitsBadge({ hits, compact = false }: MatchHitsBadgeProps) {
  const uniqueTypes = [...new Map(hits.map((h) => [h.type, h])).values()];

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Target className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-500">
          命中{uniqueTypes.length}类关键词
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Target className="w-3.5 h-3.5" />
        命中解释
      </div>
      <div className="flex flex-wrap gap-1.5">
        {uniqueTypes.map((hit, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${matchTypeColors[hit.type]}`}
          >
            {matchTypeLabels[hit.type]}
            <span className="opacity-75">「{hit.keyword}」</span>
          </span>
        ))}
      </div>
    </div>
  );
}
