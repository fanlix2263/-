import React from 'react';
import { ShieldCheck, Download, Code2, Cpu, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onQuickExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onQuickExport
}) => {
  const navItems = [
    { id: 'audit', label: '方案可行性审计', icon: AlertTriangle },
    { id: 'sandbox', label: '中文脱敏沙箱', icon: ShieldCheck },
    { id: 'hardware', label: '8GB 硬件负载测算', icon: Cpu },
    { id: 'parsers', label: '文档结构与盲区比对', icon: FileText },
    { id: 'checklist', label: '验证清单与自测', icon: CheckCircle2 },
    { id: 'code', label: '修复后生产代码', icon: Code2 },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-white block">
              WorkBuddy 本地脱敏架构审计实验室
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Clean Segmented / Tabs) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={onQuickExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm whitespace-nowrap font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出修复配置</span>
          </button>
        </div>
      </div>
    </header>
  );
};
