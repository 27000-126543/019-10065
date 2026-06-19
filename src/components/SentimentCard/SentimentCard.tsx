import { useState } from 'react';
import { Clock, ExternalLink, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import type { SentimentItem } from '@/types';
import { LevelBadge } from '@/components/StatusBadge/LevelBadge';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { HeatIndicator } from '@/components/HeatIndicator/HeatIndicator';
import { sourceTypeLabels } from '@/data/mockSentiments';

interface SentimentCardProps {
  item: SentimentItem;
  onAction?: (id: string, status: 'replied' | 'verified' | 'ignored', note?: string) => void;
  showActions?: boolean;
}

export function SentimentCard({ item, onAction, showActions = false }: SentimentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const handleAction = (status: 'replied' | 'verified' | 'ignored') => {
    if (status === 'replied') {
      setShowNoteInput(true);
      setShowActionMenu(false);
    } else {
      onAction?.(item.id, status);
      setShowActionMenu(false);
    }
  };

  const handleSubmitNote = () => {
    if (noteText.trim()) {
      onAction?.(item.id, 'replied', noteText);
      setNoteText('');
      setShowNoteInput(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <LevelBadge level={item.level} size="sm" />
              <StatusBadge status={item.status} />
            </div>
            <h3 className="text-sm font-medium text-slate-900 leading-snug line-clamp-2 hover:text-blue-600 cursor-pointer">
              {item.title}
            </h3>
          </div>
          <div className="flex-shrink-0 w-28">
            <HeatIndicator value={item.heat} />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            {item.source}
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(item.publishTime)}
          </span>
          <span className="text-slate-300">|</span>
          <span>{sourceTypeLabels[item.sourceType]}</span>
        </div>

        {item.reasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.reasons.map((reason, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-100"
              >
                {reason}
              </span>
            ))}
          </div>
        )}

        {item.responseNote && (
          <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-100">
            <p className="text-xs font-medium text-green-700 mb-1">处置口径：</p>
            <p className="text-xs text-green-600">{item.responseNote}</p>
          </div>
        )}

        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-sm text-slate-600 leading-relaxed">{item.summary}</p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-xs text-blue-600 hover:text-blue-700"
            >
              查看原文 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {showNoteInput && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-700 mb-2">补充口径要点：</p>
            <textarea
              className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="请输入处置口径要点..."
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setShowNoteInput(false);
                  setNoteText('');
                }}
                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitNote}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                确认回复
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          {expanded ? (
            <>
              收起 <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              展开详情 <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>

        {showActions && item.status === 'pending' && (
          <div className="relative">
            <button
              onClick={() => setShowActionMenu(!showActionMenu)}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              标记处置
            </button>
            {showActionMenu && (
              <div className="absolute right-0 bottom-full mb-1 w-36 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-10">
                <button
                  onClick={() => handleAction('replied')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  已回复
                </button>
                <button
                  onClick={() => handleAction('verified')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  待核实
                </button>
                <button
                  onClick={() => handleAction('ignored')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  无需处理
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
