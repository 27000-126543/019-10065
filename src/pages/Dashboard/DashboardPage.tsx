import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  BarChart3,
  MessageSquare,
  FileText,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useSentimentStore, useSentiments } from '@/store/useSentimentStore';
import { SentimentCard } from '@/components/SentimentCard/SentimentCard';
import type { SentimentLevel, DisposalStatus, SourceType } from '@/types';
import { sourceTypeLabels } from '@/data/mockSentiments';
import { exportToCSV } from '@/utils/exportCSV';

type TabType = 'all' | SentimentLevel;

export function DashboardPage() {
  const allSentiments = useSentiments();
  const updateSentimentStatus = useSentimentStore((s) => s.updateSentimentStatus);
  const config = useSentimentStore((s) => s.config);

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DisposalStatus | 'all'>('all');

  const stats = useMemo(() => {
    const all = allSentiments;
    return {
      total: all.length,
      regulatory: all.filter((s) => s.level === 'regulatory').length,
      stock: all.filter((s) => s.level === 'stock').length,
      investor: all.filter((s) => s.level === 'investor').length,
      general: all.filter((s) => s.level === 'general').length,
      replied: all.filter((s) => s.status === 'replied' || s.status === 'verified').length,
      pending: all.filter((s) => s.status === 'pending').length,
    };
  }, [allSentiments]);

  const tabs: { key: TabType; label: string; count: number; color: string }[] = [
    { key: 'all', label: '全部', count: stats.total, color: 'text-slate-600' },
    { key: 'regulatory', label: '监管敏感', count: stats.regulatory, color: 'text-red-600' },
    { key: 'stock', label: '股价联动', count: stats.stock, color: 'text-orange-600' },
    { key: 'investor', label: '投资者提问', count: stats.investor, color: 'text-blue-600' },
    { key: 'general', label: '普通讨论', count: stats.general, color: 'text-slate-500' },
  ];

  const filteredSentiments = useMemo(() => {
    let result = allSentiments;

    if (activeTab !== 'all') {
      result = result.filter((s) => s.level === activeTab);
    }

    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
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
          s.matchHits.some((h) => h.keyword.toLowerCase().includes(query))
      );
    }

    return result.sort((a, b) => {
      const levelOrder = { regulatory: 0, stock: 1, investor: 2, general: 3 };
      if (levelOrder[a.level] !== levelOrder[b.level]) {
        return levelOrder[a.level] - levelOrder[b.level];
      }
      return b.heat - a.heat;
    });
  }, [allSentiments, activeTab, searchQuery, sourceFilter, statusFilter]);

  const handleAction = (id: string, status: DisposalStatus, note?: string) => {
    updateSentimentStatus(id, status, note);
  };

  const handleExport = () => {
    const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '');
    const tabLabel = tabs.find((t) => t.key === activeTab)?.label || '全部';
    exportToCSV(filteredSentiments, `${config.companyName}_舆情盯盘_${tabLabel}_${dateStr}`);
  };

  const statCards = [
    {
      label: '今日舆情总数',
      value: stats.total,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '待处置',
      value: stats.pending,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: '已处置',
      value: stats.replied,
      icon: BarChart3,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: '投资者提问',
      value: stats.investor,
      icon: MessageSquare,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">舆情盯盘</h1>
          <p className="text-sm text-slate-500 mt-1">
            {config.companyName}（{config.stockCode}）· {config.industry} · 已配置
            {config.coreProducts.length} 个产品、{config.executives.length} 位董监高、
            {config.commonMisspellings.length} 个误写词
          </p>
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
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                    {card.value}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex items-center px-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? `${tab.color}`
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
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
            ))}
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索标题、内容或命中关键词..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DisposalStatus | 'all')}
                className="text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部状态</option>
                <option value="pending">待处置</option>
                <option value="replied">已回复</option>
                <option value="verified">待核实</option>
                <option value="ignored">无需处理</option>
              </select>
            </div>
          </div>
          {filteredSentiments.length > 0 && filteredSentiments.length !== allSentiments.length && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                共筛选出 <span className="font-medium text-slate-700">{filteredSentiments.length}</span> 条舆情
              </p>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="space-y-3">
            {filteredSentiments.length > 0 ? (
              filteredSentiments.map((item) => (
                <SentimentCard
                  key={item.id}
                  item={item}
                  onAction={handleAction}
                  showActions
                />
              ))
            ) : (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm text-slate-500">暂无符合条件的舆情</p>
                <p className="text-xs text-slate-400 mt-1">
                  请尝试调整筛选条件，或在设置页配置更多关键词
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
