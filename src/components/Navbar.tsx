import React from 'react';
import { Palette, Image as ImageIcon, Bookmark, Download, Sparkles, RefreshCw } from 'lucide-react';
import { ColorItem } from '../types';

interface NavbarProps {
  activeTab: 'generator' | 'extractor' | 'library';
  setActiveTab: (tab: 'generator' | 'extractor' | 'library') => void;
  colors: ColorItem[];
  onOpenExport: () => void;
  onQuickGenerate: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  colors,
  onOpenExport,
  onQuickGenerate,
  savedCount,
}) => {
  return (
    <header
      id="main-app-header"
      className="w-full bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900 tracking-tight text-base sm:text-lg">
                ColorCraft
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md border border-stone-200">
                设计师配色工坊
              </span>
            </div>
            <p className="text-[11px] text-stone-400 hidden md:block">
              图片提取 · 调色板生成 · HEX/CSS 代码导出
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <nav id="navbar-tabs" className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200/80">
          <button
            id="tab-btn-generator"
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'generator'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>调色板生成器</span>
          </button>

          <button
            id="tab-btn-extractor"
            onClick={() => setActiveTab('extractor')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'extractor'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>图片取色提取</span>
          </button>

          <button
            id="tab-btn-library"
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'library'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>预设与收藏</span>
            {savedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">
                {savedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activeTab === 'generator' && (
            <button
              id="btn-nav-regenerate"
              onClick={onQuickGenerate}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
              title="随机重置未锁定色彩 (快捷键: 空格键)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重新生成 (空格)</span>
            </button>
          )}

          {/* Color Preview strip in navbar */}
          <div className="hidden lg:flex items-center -space-x-1 pl-1 pr-2">
            {colors.map((c) => (
              <div
                key={c.id}
                className="w-5 h-5 rounded-full border border-white shadow-xs"
                style={{ backgroundColor: c.hex }}
                title={`${c.hex} - ${c.name}`}
              />
            ))}
          </div>

          <button
            id="btn-nav-export"
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出代码</span>
          </button>
        </div>
      </div>
    </header>
  );
};
