import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileCheck, Settings, Bell, TrendingUp } from 'lucide-react';
import { useSentimentStore } from '@/store/useSentimentStore';
import { useMemo } from 'react';

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const sentiments = useSentimentStore((s) => s.sentiments);
  const config = useSentimentStore((s) => s.config);

  const pendingCount = useMemo(() => {
    return sentiments.filter((s) => s.status === 'pending').length;
  }, [sentiments]);

  const navItems = [
    { path: '/dashboard', label: '舆情盯盘', icon: LayoutDashboard, badge: pendingCount },
    { path: '/disposal', label: '处置记录', icon: FileCheck },
    { path: '/settings', label: '设置', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">舆情盯盘台</h1>
              <p className="text-xs text-slate-400">{config.companyName} · {config.stockCode}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors relative ${
                  isActive
                    ? 'text-white bg-slate-800/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />
                )}
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-500">
            <p>上次更新：刚刚</p>
            <p className="mt-1">数据来源：{config.dataSources.length} 个渠道</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="text-sm text-slate-600">
            <span className="text-slate-400">今日</span>
            <span className="ml-2 font-medium">
              {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-medium">
                证代
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
