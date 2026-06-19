import type { DisposalStatus } from '@/types';

interface StatusBadgeProps {
  status: DisposalStatus;
}

const statusConfig = {
  pending: { label: '待处置', bg: 'bg-amber-50', text: 'text-amber-700', icon: '●' },
  replied: { label: '已回复', bg: 'bg-green-50', text: 'text-green-700', icon: '✓' },
  verified: { label: '待核实', bg: 'bg-purple-50', text: 'text-purple-700', icon: '!' },
  ignored: { label: '无需处理', bg: 'bg-slate-100', text: 'text-slate-500', icon: '—' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md ${config.bg} ${config.text} font-medium`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
