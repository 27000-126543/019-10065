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
} from 'lucide-react';
import { useSentimentStore } from '@/store/useSentimentStore';
import { SentimentCard } from '@/components/SentimentCard/SentimentCard';
import { generateBriefing } from '@/utils/briefing';
import type { DisposalStatus } from '@/types';

type TabType = 'pending' | 'replied' | 'verified' | 'ignored';
type BriefingPeriod = 'morning' | 'noon' | 'close';

export function DisposalPage() {
  const sentiments = useSentimentStore((s) => s.sentiments);
  const config = useSentimentStore((s) => s.config);
  const updateSentimentStatus = useSentimentStore((s) => s.updateSentimentStatus);

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [briefingPeriod, setBriefingPeriod] = useState<BriefingPeriod>('morning');
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const all = sentiments;
    return {
      total: all.length,
      replied: all.filter((s) => s.status === 'replied' || s.status === 'verified').length,
      pending: all.filter((s) => s.status === 'pending').length,
    };
  }, [sentiments]);

  const tabs: { key: TabType; label: string; count: number; icon: typeof Clock }[] = [
    { key: 'pending', label: '待处置', count: sentiments.filter((s) => s.status === 'pending').length, icon: Clock },
    { key: 'replied', label: '已回复', count: sentiments.filter((s) => s.status === 'replied').length, icon: CheckCircle },
    { key: 'verified', label: '待核实', count: sentiments.filter((s) => s.status === 'verified').length, icon: AlertCircle },
    { key: 'ignored', label: '无需处理', count: sentiments.filter((s) => s.status === 'ignored').length, icon: SkipForward },
  ];

  const filteredSentiments = useMemo(() => {
    return sentiments
      .filter((s) => s.status === activeTab)
      .sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime());
  }, [sentiments, activeTab]);

  const briefingContent = useMemo(() => {
    const today = new Date().toLocaleDateString('zh-CN');
    return generateBriefing(sentiments, briefingPeriod, config.companyName, today);
  }, [sentiments, briefingPeriod, config.companyName]);

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

  const periodTabs = [
    { key: 'morning' as const, label: '开盘前', icon: Sun, desc: '08:30 简报' },
    { key: 'noon' as const, label: '午间', icon: Sunset, desc: '12:00 简报' },
    { key: 'close' as const, label: '收盘后', icon: Moon, desc: '15:30 简报' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">处置记录</h1>
        <p className="text-sm text-slate-500 mt-1">管理舆情处置状态，生成早会简报</p>
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
                          ? 'text-blue-600'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        activeTab === tab.key
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-slate-50 text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                      {activeTab === tab.key && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 max-h-[calc(100vh-280px)] overflow-y-auto">
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

        <div className="col-span-1">
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

            <div className="p-4 max-h-[320px] overflow-y-auto">
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
                {briefingContent}
              </pre>
            </div>

            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex gap-2">
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

            <div className="px-4 py-3 border-t border-slate-100">
              <h3 className="text-xs font-medium text-slate-500 mb-3">今日处置统计</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">舆情总数</span>
                  <span className="font-medium text-slate-900">{stats.total}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">已处置</span>
                  <span className="font-medium text-green-600">{stats.replied}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">处置率</span>
                  <span className="font-medium text-blue-600">
                    {stats.total > 0 ? Math.round((stats.replied / stats.total) * 100) : 0}%
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
