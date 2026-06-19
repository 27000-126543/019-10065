import { useState } from 'react';
import { Clock, ExternalLink, MessageSquare, ChevronDown, ChevronUp, History, User, Calendar, Users, Building2 } from 'lucide-react';
import type { SentimentItem, DisposalStatus } from '@/types';
import { LevelBadge } from '@/components/StatusBadge/LevelBadge';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { HeatIndicator } from '@/components/HeatIndicator/HeatIndicator';
import { MatchHitsBadge } from '@/components/MatchHitsBadge/MatchHitsBadge';
import { sourceTypeLabels } from '@/data/mockSentiments';

interface SentimentCardProps {
  item: SentimentItem;
  onAction?: (id: string, status: DisposalStatus, note?: string) => void;
  showActions?: boolean;
}

const statusLabels: Record<DisposalStatus, string> = {
  pending: '待处置',
  replied: '已回复',
  verified: '待核实',
  ignored: '无需处理',
};

export function SentimentCard({ item, onAction, showActions = false }: SentimentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<DisposalStatus | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const formatTime = (isoString: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatFullTime = (isoString: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('zh-CN');
  };

  const openNoteInput = (status: DisposalStatus) => {
    setPendingStatus(status);
    setShowNoteInput(true);
    setShowActionMenu(false);
  };

  const handleQuickAction = (status: DisposalStatus) => {
    if (status === 'replied' || status === 'verified') {
      openNoteInput(status);
    } else {
      onAction?.(item.id, status);
      setShowActionMenu(false);
    }
  };

  const handleSubmitNote = () => {
    if (pendingStatus) {
      onAction?.(item.id, pendingStatus, noteText.trim() || undefined);
      setNoteText('');
      setShowNoteInput(false);
      setPendingStatus(null);
    }
  };

  const canContinueFlow = item.status === 'verified';

  return (
    <div className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <LevelBadge level={item.level} size="sm" />
              <StatusBadge status={item.status} />
              <MatchHitsBadge hits={item.matchHits} compact />
            </div>
            <h3 className="text-sm font-medium text-slate-900 leading-snug line-clamp-2 hover:text-blue-600 cursor-pointer">
              {item.title}
            </h3>
          </div>
          <div className="flex-shrink-0 w-28">
            <HeatIndicator value={item.heat} />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
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
          {item.responseTime && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-green-600">最近处置：{formatTime(item.responseTime)}</span>
            </>
          )}
        </div>

        {!expanded && item.reasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.reasons.slice(0, 3).map((reason, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-100"
              >
                {reason}
              </span>
            ))}
          </div>
        )}

        {expanded && (
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">内容摘要</p>
              <p className="text-sm text-slate-600 leading-relaxed">{item.summary}</p>
            </div>

            <MatchHitsBadge hits={item.matchHits} />

            {item.reasons.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">建议关注原因</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-100"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.assignment && item.assignment.department && (
              <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
                <p className="text-xs font-medium text-blue-700 mb-2">📋 会议安排</p>
                <div className="space-y-1 text-xs text-blue-600">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Building2 className="w-3 h-3" />
                    <span>责任部门：{item.assignment.department}</span>
                  </div>
                  {item.assignment.assignee && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Users className="w-3 h-3" />
                      <span>责任人：{item.assignment.assignee}</span>
                    </div>
                  )}
                  {item.assignment.deadline && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Calendar className="w-3 h-3" />
                      <span>截止时间：{formatFullTime(item.assignment.deadline)}</span>
                    </div>
                  )}
                  {item.assignment.note && (
                    <div className="pt-1 mt-1 border-t border-blue-100 text-blue-700/80">
                      备注：{item.assignment.note}
                    </div>
                  )}
                </div>
              </div>
            )}

            {item.responseNote && (
              <div className="p-3 bg-green-50 rounded-md border border-green-100">
                <p className="text-xs font-medium text-green-700 mb-1">最新处置口径：</p>
                <p className="text-xs text-green-600">{item.responseNote}</p>
              </div>
            )}

            {item.disposalHistory && item.disposalHistory.length > 0 && (
              <div>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  <History className="w-3.5 h-3.5" />
                  处置记录（{item.disposalHistory.length}条）
                  {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showHistory && (
                  <div className="mt-2 space-y-2 pl-4 border-l-2 border-slate-100">
                    {[...item.disposalHistory].reverse().map((record, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="flex items-center gap-2 text-slate-500">
                          <User className="w-3 h-3" />
                          <span>{record.operator}</span>
                          <span className="text-slate-300">·</span>
                          <span>{formatFullTime(record.timestamp)}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              record.status === 'replied'
                                ? 'bg-green-100 text-green-700'
                                : record.status === 'verified'
                                ? 'bg-purple-100 text-purple-700'
                                : record.status === 'ignored'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {statusLabels[record.status]}
                          </span>
                        </div>
                        {record.note && (
                          <p className="mt-1 text-slate-600 ml-5">口径：{record.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              查看原文 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {showNoteInput && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-700 mb-2">
              {pendingStatus === 'verified'
                ? '核实说明（待核实事项）：'
                : '补充口径要点（已回复）：'}
            </p>
            <textarea
              className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={
                pendingStatus === 'verified'
                  ? '请输入核实情况，例如"经核实，情况不属实"或"正在进一步了解"'
                  : '请输入回复口径要点...'
              }
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setShowNoteInput(false);
                  setNoteText('');
                  setPendingStatus(null);
                }}
                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitNote}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                确认{statusLabels[pendingStatus || 'replied']}
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

        <div className="flex items-center gap-2">
          {canContinueFlow && showActions && (
            <>
              <button
                onClick={() => openNoteInput('replied')}
                className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                核实完成·已回复
              </button>
              <button
                onClick={() => onAction?.(item.id, 'ignored')}
                className="text-xs px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
              >
                无需处理
              </button>
            </>
          )}

          {((showActions && item.status === 'pending') || (showActions && item.status === 'verified' && !canContinueFlow)) && (
            <div className="relative">
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                  item.status === 'verified'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                标记处置
              </button>
              {showActionMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowActionMenu(false)}
                  />
                  <div className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-20">
                    <button
                      onClick={() => handleQuickAction('replied')}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      已回复（补充口径）
                    </button>
                    <button
                      onClick={() => handleQuickAction('verified')}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      待核实（记录说明）
                    </button>
                    <button
                      onClick={() => handleQuickAction('ignored')}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      无需处理
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
