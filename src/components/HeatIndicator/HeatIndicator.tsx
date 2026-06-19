interface HeatIndicatorProps {
  value: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function HeatIndicator({ value, showLabel = true, size = 'md' }: HeatIndicatorProps) {
  const getColor = (v: number) => {
    if (v >= 80) return 'bg-red-500';
    if (v >= 60) return 'bg-orange-500';
    if (v >= 40) return 'bg-amber-500';
    return 'bg-slate-300';
  };

  const getTextColor = (v: number) => {
    if (v >= 80) return 'text-red-600';
    if (v >= 60) return 'text-orange-600';
    if (v >= 40) return 'text-amber-600';
    return 'text-slate-500';
  };

  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className={`text-xs font-semibold ${getTextColor(value)} tabular-nums min-w-[32px]`}>
          {value}
        </span>
      )}
      <div className={`flex-1 ${size === 'sm' ? 'w-16' : 'w-24'} ${barHeight} bg-slate-100 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${getColor(value)} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
