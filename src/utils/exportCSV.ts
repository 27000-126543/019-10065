import type { SentimentItem } from '@/types';
import { sourceTypeLabels } from '@/data/mockSentiments';
import { matchTypeLabels } from '@/types';

const levelLabels: Record<string, string> = {
  regulatory: '监管敏感',
  stock: '股价联动',
  investor: '投资者提问',
  general: '普通讨论',
};

const statusLabels: Record<string, string> = {
  pending: '待处置',
  replied: '已回复',
  verified: '待核实',
  ignored: '无需处理',
};

function escapeCSV(value: string): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatTime(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('zh-CN');
  } catch {
    return iso;
  }
}

export function exportToCSV(items: SentimentItem[], filename: string) {
  const headers = [
    '分级',
    '状态',
    '标题',
    '摘要',
    '来源',
    '来源类型',
    '发布时间',
    '热度',
    '命中关键词类型',
    '命中关键词',
    '建议关注原因',
    '处置口径',
    '最近处置时间',
    '原文链接',
  ];

  const rows = items.map((item) => [
    levelLabels[item.level] || item.level,
    statusLabels[item.status] || item.status,
    item.title,
    item.summary,
    item.source,
    sourceTypeLabels[item.sourceType] || item.sourceType,
    formatTime(item.publishTime),
    item.heat,
    [...new Set(item.matchHits.map((h) => matchTypeLabels[h.type]))].join('、'),
    [...new Set(item.matchHits.map((h) => h.keyword))].join('、'),
    item.reasons.join('、'),
    item.responseNote || '',
    formatTime(item.responseTime || ''),
    item.url,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(','))
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
