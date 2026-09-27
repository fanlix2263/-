import React, { useState } from 'react';
import { Header } from './components/Header';
import { AuditOverview } from './components/AuditOverview';
import { InteractiveSanitizer } from './components/InteractiveSanitizer';
import { HardwareStressCalculator } from './components/HardwareStressCalculator';
import { DocumentParserComparator } from './components/DocumentParserComparator';
import { VerificationChecklist } from './components/VerificationChecklist';
import { CodeExporter } from './components/CodeExporter';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('audit');

  const handleQuickExport = () => {
    setActiveTab('code');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar adhering to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickExport={handleQuickExport}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'audit' && (
          <AuditOverview
            onNavigateToCode={() => setActiveTab('code')}
            onNavigateToSandbox={() => setActiveTab('sandbox')}
          />
        )}

        {activeTab === 'sandbox' && <InteractiveSanitizer />}

        {activeTab === 'hardware' && <HardwareStressCalculator />}

        {activeTab === 'parsers' && <DocumentParserComparator />}

        {activeTab === 'checklist' && <VerificationChecklist />}

        {activeTab === 'code' && <CodeExporter />}
      </main>

      {/* Quiet Footer adhering to anti-slop rules */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>WorkBuddy 本地文档脱敏方案工程评估与仿真平台</span>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Windows 11 / i3-8100 / 8GB RAM 专项调优</span>
            <span aria-hidden="true">·</span>
            <span>Presidio + FastMCP + spaCy 中文增强架构</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
