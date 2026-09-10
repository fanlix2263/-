import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Heart, Share2, Bell, Compass } from 'lucide-react';
import { ColorItem } from '../types';
import { getReadableTextColor } from '../utils/colorMath';

interface MockupPreviewProps {
  colors: ColorItem[];
}

export const MockupPreview: React.FC<MockupPreviewProps> = ({ colors }) => {
  // Ensure we have fallback colors
  const primary = colors[0]?.hex || '#4F46E5';
  const secondary = colors[1]?.hex || '#06B6D4';
  const accent = colors[2]?.hex || '#10B981';
  const darkNeutral = colors[3]?.hex || '#1E293B';
  const lightNeutral = colors[4]?.hex || '#F8FAFC';

  const primaryTextColor = getReadableTextColor(primary);
  const secondaryTextColor = getReadableTextColor(secondary);
  const accentTextColor = getReadableTextColor(accent);

  return (
    <div id="mockup-preview-section" className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-stone-100 text-stone-800">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-stone-900">
              实时设计场景预览 (UI & Brand Mockup)
            </h3>
          </div>
          <p className="text-xs text-stone-500">
            即时检验当前调色板在现代 Web 界面、移动应用与品牌卡片中的视觉效果。
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-stone-400">
          <span>动态主色:</span>
          <div className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: primary }} />
          <span>次色:</span>
          <div className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: secondary }} />
          <span>强调色:</span>
          <div className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: accent }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mockup 1: Modern SaaS / App Card */}
        <div className="border border-stone-200 rounded-2xl p-5 space-y-4 bg-white shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                style={{ backgroundColor: `${secondary}20`, color: secondary }}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>精选产品方案</span>
              </span>
              <span className="text-xs font-mono text-stone-400">UI 组件展示</span>
            </div>

            <h4 className="text-lg font-bold text-stone-900">
              智能设计分析套件
            </h4>

            <p className="text-xs text-stone-600 leading-relaxed">
              根据您的色彩和弦，自动构建高对比度视觉层次与无障碍设计标准。
            </p>

            {/* Micro stats */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-stone-400">匹配舒适度</div>
                <div className="text-sm font-bold font-mono text-stone-900">98.4%</div>
              </div>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: secondary }}
              >
                <Compass className="w-4 h-4" style={{ color: secondaryTextColor }} />
              </div>
            </div>
          </div>

          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold shadow-xs transition-opacity hover:opacity-95"
            style={{ backgroundColor: primary, color: primaryTextColor }}
          >
            <span>立即体验产品</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mockup 2: Mobile App Interface Card */}
        <div
          className="border border-stone-800 rounded-2xl p-5 text-white shadow-md flex flex-col justify-between relative overflow-hidden"
          style={{ backgroundColor: darkNeutral }}
        >
          {/* Subtle accent glow */}
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-25 pointer-events-none"
            style={{ backgroundColor: primary }}
          />

          <div className="space-y-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: primary, color: primaryTextColor }}
                >
                  CC
                </div>
                <span className="text-xs font-semibold">深色模式氛围</span>
              </div>
              <Bell className="w-4 h-4 text-stone-400" />
            </div>

            <div className="space-y-1">
              <div className="text-xs opacity-75">当前设计系统指标</div>
              <div className="text-2xl font-black tracking-tight" style={{ color: secondary }}>
                7:1 高对比度
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="px-2.5 py-1 rounded-md text-[11px] font-medium"
                style={{ backgroundColor: `${accent}30`, color: accent }}
              >
                强调标签
              </div>
              <div className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/10 text-white">
                次要标签
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs z-10">
            <span className="opacity-70">色彩和谐感知</span>
            <span
              className="font-semibold flex items-center gap-1"
              style={{ color: accent }}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>最佳视觉动线</span>
            </span>
          </div>
        </div>

        {/* Mockup 3: Branding & Poster Badge */}
        <div className="border border-stone-200 rounded-2xl p-5 bg-stone-50 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
              Brand Swatches Palette
            </div>

            {/* Visual Color Blocks */}
            <div className="grid grid-cols-5 gap-1.5 h-20 rounded-xl overflow-hidden shadow-2xs border border-stone-200">
              {colors.slice(0, 5).map((c, i) => (
                <div
                  key={c.id || i}
                  style={{ backgroundColor: c.hex }}
                  className="h-full flex items-end p-1 transition-transform hover:scale-105"
                  title={c.hex}
                >
                  <span
                    className="text-[9px] font-mono font-bold"
                    style={{ color: getReadableTextColor(c.hex) }}
                  >
                    {c.hex.slice(1, 4)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <h5 className="text-sm font-bold text-stone-900">
                视觉风格指南 (Style Guide)
              </h5>
              <p className="text-xs text-stone-500">
                适合品牌视觉规范手册、移动端界面库或网站设计系统。
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
            <span className="font-mono text-[11px]">{colors.length} 色和弦系列</span>
            <div className="flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-stone-400" />
              <span>设计就绪</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
