import type { SentimentLevel } from '@/types';

interface LevelBadgeProps {
  level: SentimentLevel;
  size?: 'sm' | 'md';
}

const levelConfig = {
  regulatory: { label: '监管敏感', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
  stock: { label: '股价联动', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-200' },
  investor: { label: '投资者提问', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  general: { label: '普通讨论', bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200' },
};

export function LevelBadge({ level, size = 'md' }: LevelBadgeProps) {
  const config = levelConfig[level];
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md ${config.bg} ${config.text} ${sizeClasses} font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
