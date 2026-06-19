import { useState, useEffect } from 'react';
import { Save, Building2, Tag, Users, AlertTriangle, Database, Check } from 'lucide-react';
import { useSentimentStore } from '@/store/useSentimentStore';
import { TagInput } from '@/components/TagInput/TagInput';
import type { SourceType } from '@/types';

export function SettingsPage() {
  const config = useSentimentStore((s) => s.config);
  const setConfig = useSentimentStore((s) => s.setConfig);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState(config);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleSave = () => {
    setConfig(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleDataSource = (source: SourceType) => {
    const sources = formData.dataSources.includes(source)
      ? formData.dataSources.filter((s) => s !== source)
      : [...formData.dataSources, source];
    setFormData({ ...formData, dataSources: sources });
  };

  const dataSources: { type: SourceType; label: string; desc: string }[] = [
    { type: 'news', label: '新闻媒体', desc: '财经新闻、行业资讯网站' },
    { type: 'stockbar', label: '股吧论坛', desc: '东方财富、同花顺股吧等' },
    { type: 'social', label: '社交媒体', desc: '微博、知乎、雪球等' },
    { type: 'qa', label: '问答平台', desc: '互动易、上证e互动等' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">设置</h1>
          <p className="text-sm text-slate-500 mt-1">配置公司关键词和数据源，系统将按这些词汇聚合舆情信息</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              已保存
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              保存设置
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">公司基本信息</h2>
              <p className="text-xs text-slate-500">用于舆情匹配和展示</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                公司简称
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入公司简称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                股票代码
              </label>
              <input
                type="text"
                value={formData.stockCode}
                onChange={(e) => setFormData({ ...formData, stockCode: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入股票代码"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                所属行业
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入所属行业"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Tag className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">关键词配置</h2>
              <p className="text-xs text-slate-500">系统根据这些关键词聚合相关舆情</p>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                核心产品
              </label>
              <TagInput
                tags={formData.coreProducts}
                onChange={(tags) => setFormData({ ...formData, coreProducts: tags })}
                placeholder="输入产品名称后按回车添加"
              />
              <p className="text-xs text-slate-400 mt-1.5">公司主要产品或业务线名称</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  董监高姓名
                </span>
              </label>
              <TagInput
                tags={formData.executives}
                onChange={(tags) => setFormData({ ...formData, executives: tags })}
                placeholder="输入姓名后按回车添加"
              />
              <p className="text-xs text-slate-400 mt-1.5">董事、监事、高级管理人员姓名</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  常见误写词
                </span>
              </label>
              <TagInput
                tags={formData.commonMisspellings}
                onChange={(tags) => setFormData({ ...formData, commonMisspellings: tags })}
                placeholder="输入误写词后按回车添加"
              />
              <p className="text-xs text-slate-400 mt-1.5">公司名称的常见错别字或混淆名称，用于排除无关信息</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Database className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">数据源配置</h2>
              <p className="text-xs text-slate-500">选择需要监控的信息渠道</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            {dataSources.map((ds) => {
              const enabled = formData.dataSources.includes(ds.type);
              return (
                <button
                  key={ds.type}
                  onClick={() => toggleDataSource(ds.type)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    enabled
                      ? 'border-blue-200 bg-blue-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${enabled ? 'text-blue-700' : 'text-slate-700'}`}>
                      {ds.label}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      enabled ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                    }`}>
                      {enabled && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <p className={`text-xs mt-1 ${enabled ? 'text-blue-600' : 'text-slate-400'}`}>
                    {ds.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
