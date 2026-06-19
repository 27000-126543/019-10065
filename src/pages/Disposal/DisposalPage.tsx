import { useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  SkipForward,
  Copy,
  Download,
  Sun,
  Sunset,
  Moon,
  Check,
  RefreshCw,
  Search,
  Filter,
  Building2,
  Users,
  Calendar,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Save,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useSentimentStore, useSentiments } from '@/store/useSentimentStore';
import { SentimentCard } from '@/components/SentimentCard/SentimentCard';
import { generateBriefing } from '@/utils/briefing';
import type { DisposalStatus, SentimentLevel, SourceType, SentimentItem } from '@/types';
import { sourceTypeLabels } from '@/data/mockSentiments';
import { matchTypeLabels } from '@/types';
import { exportToCSV } from '@/utils/exportCSV';

type TabType = 'pending' | 'replied' | 'verified' | 'ignored';
type BriefingPeriod = 'morning' | 'noon' | 'close';

function getDeadlineDefault(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 16);
}

export function DisposalPage() {
  const sentiments = useSentiments();
  const config = useSentimentStore((s) => s.config);
  const updateSentimentStatus = useSentimentStore((s) => s.updateSentimentStatus);
  const setAssignment = useSentimentStore((s) => s.setAssignment);
  const clearAssignment = useSentimentStore((s) => s.clearAssignment);

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [briefingPeriod, setBriefingPeriod] = useState<BriefingPeriod>('morning');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<SentimentLevel | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceType | 'all'>('all');
  const [expandedAssignments, setExpandedAssignments] = useState<Record<string, boolean>>({});

  const stats = useMemo(() => {
    const all = sentiments;
    return {
      total: all.length,
      replied: all.filter((s) => s.status === 'replied').length,
      ignored: all.filter((s) => s.status === 'ignored').length,
      verified: all.filter((s) => s.status === 'verified').length,
      pending: all.filter((s) => s.status === 'pending').length,
    };
  }, [sentiments]);

  const tabs: { key: TabType; label: string; count: number; icon: typeof Clock; color: string }[] = [
    { key: 'pending', label: '待处置', count: stats.pending, icon: AlertTriangle, color: 'text-red-600' },
    { key: 'verified', label: '待核实', count: stats.verified, icon: AlertCircle, color: 'text-purple-600' },
    { key: 'replied', label: '已回复', count: stats.replied, icon: CheckCircle2, color: 'text-green-600' },
    { key: 'ignored', label: '无需处理', count: stats.ignored, icon: SkipForward, color: 'text-slate-500' },
  ];

  const filteredSentiments = useMemo(() => {
    let result = sentiments.filter((s) => s.status === activeTab);

    if (levelFilter !== 'all') {
      result = result.filter((s) => s.level === levelFilter);
    }

    if (sourceFilter !== 'all') {
      result = result.filter((s) => s.sourceType === sourceFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.summary.toLowerCase().includes(query) ||
          s.matchHits.some((h) => h.keyword.toLowerCase().includes(query)) ||
          (s.responseNote && s.responseNote.toLowerCase().includes(query)) ||
          (s.assignment?.department && s.assignment.department.toLowerCase().includes(query))
      );
    }

    return result.sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime());
  }, [sentiments, activeTab, searchQuery, levelFilter, sourceFilter]);

  const briefingContent = useMemo(() => {
    const today = new Date().toLocaleDateString('zh-CN');
    return generateBriefing({
      sentiments,
      period: briefingPeriod,
      companyName: config.companyName,
      date: today,
    });
  }, [sentiments, briefingPeriod, config.companyName]);

  const assignmentTargets = useMemo<SentimentItem[]>(() => {
    if (briefingPeriod === 'morning') {
      return [
        ...sentiments.filter((s) => s.level === 'regulatory'),
        ...sentiments.filter((s) => s.level === 'stock'),
        ...sentiments.filter((s) => s.status === 'verified'),
      ].filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i);
    }
    if (briefingPeriod === 'noon') {
      return sentiments.filter((s) => s.level === 'investor' || s.level === 'regulatory' || s.level === 'stock');
    }
    return sentiments.filter((s) => s.status === 'pending' || s.status === 'verified');
  }, [sentiments, briefingPeriod]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(briefingContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleAction = (id: string, status: 'replied' | 'verified' | 'ignored', note?: string) => {
    updateSentimentStatus(id, status, note);
  };

  const handleExport = () => {
    const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '');
    const tabLabel = tabs.find((t) => t.key === activeTab)?.label || '全部';
    exportToCSV(filteredSentiments, `${config.companyName}_处置记录_${tabLabel}_${dateStr}`);
  };

  const toggleAssignmentExpand = (id: string) => {
    setExpandedAssignments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAssignmentChange = (
    id: string,
    patch: { department?: string; assignee?: string; deadline?: string; note?: string }
  ) => {
    const existing = sentiments.find((s) => s.id === id)?.assignment;
    const merged = {
      department: existing?.department ?? '',
      assignee: existing?.assignee ?? '',
      deadline: existing?.deadline ?? '',
      note: existing?.note ?? '',
      ...patch,
    };
    if (!merged.department && !merged.assignee && !merged.deadline && !merged.note) {
      clearAssignment(id);
      return;
    }
    setAssignment(id, merged);
  };

  const periodTabs = [
    { key: 'morning' as const, label: '开盘前', icon: Sun, desc: '08:30 简报' },
    { key: 'noon' as const, label: '午间', icon: Sunset, desc: '12:00 简报' },
    { key: 'close' as const, label: '收盘后', icon: Moon, desc: '15:30 简报' },
  ];

  const levelLabels: Record<string, string> = {
    all: '全部分级',
    regulatory: '监管敏感',
    stock: '股价联动',
    investor: '投资者提问',
    general: '普通讨论',
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">处置记录</h1>
          <p className="text-sm text-slate-500 mt-1">管理舆情处置状态，分配责任部门，生成早会简报</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {}}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">舆情总数</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">待处置</p>
              <p className="text-2xl font-bold text-red-600 mt-1 tabular-nums">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">待核实</p>
              <p className="text-2xl font-bold text-purple-600 mt-1 tabular-nums">{stats.verified}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">已完成（回复+无需）</p>
              <p className="text-2xl font-bold text-green-600 mt-1 tabular-nums">
                {stats.replied + stats.ignored}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200">
              <div className="flex items-center px-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.key
                          ? tab.color
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        activeTab === tab.key
                          ? 'bg-slate-100'
                          : 'bg-slate-50 text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                      {activeTab === tab.key && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-current" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 relative min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索标题、内容、命中词、处置口径或部门..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value as SentimentLevel | 'all')}
                    className="text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(levelLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value as SourceType | 'all')}
                    className="text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">全部来源</option>
                    {Object.entries(sourceTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {filteredSentiments.length > 0 && filteredSentiments.length !== tabs.find(t => t.key === activeTab)?.count && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    共筛选出 <span className="font-medium text-slate-700">{filteredSentiments.length}</span> 条舆情
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 max-h-[calc(100vh-560px)] overflow-y-auto">
              {filteredSentiments.length > 0 ? (
                <div className="space-y-3">
                  {filteredSentiments.map((item) => (
                    <SentimentCard
                      key={item.id}
                      item={item}
                      onAction={handleAction}
                      showActions={activeTab === 'pending' || activeTab === 'verified'}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-500">暂无{tabs.find(t => t.key === activeTab)?.label}的舆情</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden sticky top-6">
            <div className="px-4 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h2 className="text-sm font-semibold text-slate-900">早会简报</h2>
                </div>
                <button
                  onClick={() => {}}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors"
                  title="重新生成"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex gap-1">
                {periodTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = briefingPeriod === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setBriefingPeriod(tab.key)}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{tab.label}</span>
                      <span className={`text-xs ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                        {tab.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 max-h-[280px] overflow-y-auto border-b border-slate-100">
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
                {briefingContent}
              </pre>
            </div>

            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex gap-2">
              <button
                onClick={handleCopy}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    复制简报
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([briefingContent], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${config.companyName}_舆情简报_${new Date().toLocaleDateString('zh-CN')}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
            </div>

            <div>
              <div className="px-4 py-3 border-b border-slate-100 bg-blue-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-semibold text-blue-900">📋 会议纪要 · 任务分配</h3>
                  </div>
                  <span className="text-[10px] text-blue-600">
                    共 {assignmentTargets.length} 项
                  </span>
                </div>
                <p className="text-[11px] text-blue-700/70 mt-1">
                  给重点舆情分配责任部门、跟进人、截止时间，保存后在处置记录和盯盘页可见
                </p>
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {assignmentTargets.length > 0 ? (
                  assignmentTargets.map((item) => {
                    const expanded = expandedAssignments[item.id] || !!item.assignment?.department;
                    const assignment = item.assignment;
                    return (
                      <div key={item.id} className="border-b border-slate-100 last:border-b-0">
                        <button
                          onClick={() => toggleAssignmentExpand(item.id)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  item.level === 'regulatory' ? 'bg-red-500' :
                                  item.level === 'stock' ? 'bg-orange-500' :
                                  item.level === 'investor' ? 'bg-blue-500' : 'bg-slate-400'
                                }`} />
                                <span className="text-[10px] text-slate-400 uppercase">
                                  {matchTypeLabels[item.matchHits[0]?.type] || '命中'}
                                </span>
                                <span className="text-[10px] text-slate-300">·</span>
                                <span className={`text-[10px] font-medium ${
                                  item.status === 'pending' ? 'text-red-600' :
                                  item.status === 'verified' ? 'text-purple-600' :
                                  item.status === 'replied' ? 'text-green-600' : 'text-slate-400'
                                }`}>
                                  {item.status === 'pending' ? '待处置' :
                                   item.status === 'verified' ? '待核实' :
                                   item.status === 'replied' ? '已回复' : '无需处理'}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-slate-700 line-clamp-1 leading-snug">
                                {item.title}
                              </p>
                              {assignment?.department && (
                                <p className="text-[11px] text-blue-600 mt-1 truncate">
                                  ▸ {assignment.department}
                                  {assignment.deadline && ` · 截止 ${formatDateShort(assignment.deadline)}`}
                                </p>
                              )}
                            </div>
                            {expanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </button>
                        {expanded && (
                          <div className="px-4 pb-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                                  <Building2 className="w-3 h-3" />
                                  责任部门
                                </label>
                                <input
                                  type="text"
                                  value={assignment?.department || ''}
                                  onChange={(e) => handleAssignmentChange(item.id, { department: e.target.value })}
                                  placeholder="如：证券部、法务部..."
                                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                                  <Users className="w-3 h-3" />
                                  责任人
                                </label>
                                <input
                                  type="text"
                                  value={assignment?.assignee || ''}
                                  onChange={(e) => handleAssignmentChange(item.id, { assignee: e.target.value })}
                                  placeholder="姓名或代号"
                                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                                <Calendar className="w-3 h-3" />
                                跟进截止时间
                              </label>
                              <input
                                type="datetime-local"
                                value={assignment?.deadline || ''}
                                onChange={(e) => handleAssignmentChange(item.id, { deadline: e.target.value })}
                                placeholder="选择截止时间"
                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                                <StickyNote className="w-3 h-3" />
                                跟进备注
                              </label>
                              <textarea
                                value={assignment?.note || ''}
                                onChange={(e) => handleAssignmentChange(item.id, { note: e.target.value })}
                                placeholder="跟进要点或注意事项..."
                                rows={2}
                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none"
                              />
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <p className="text-[10px] text-green-600 flex items-center gap-1">
                                {assignment?.department ? (
                                  <><Save className="w-3 h-3" /> 已自动保存</>
                                ) : (
                                  <span className="text-slate-400">填写部门信息后自动保存</span>
                                )}
                              </p>
                              {assignment?.department && (
                                <button
                                  onClick={() => clearAssignment(item.id)}
                                  className="text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-0.5 rounded transition-colors"
                                >
                                  清空
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs text-slate-400">当前时段暂无需分配任务的重点舆情</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-3 border-t border-slate-100">
              <h3 className="text-xs font-medium text-slate-500 mb-3">今日处置统计</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">舆情总数</span>
                  <span className="font-medium text-slate-900">{stats.total}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">已完成（回复+无需）</span>
                  <span className="font-medium text-green-600">{stats.replied + stats.ignored}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-600">待核实</span>
                  <span className="font-medium text-purple-600">{stats.verified}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600">待处置</span>
                  <span className="font-medium text-red-600">{stats.pending}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-100">
                  <span className="text-slate-600">处置完成率</span>
                  <span className="font-medium text-blue-600">
                    {stats.total > 0 ? Math.round(((stats.replied + stats.ignored) / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDateShort(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}
