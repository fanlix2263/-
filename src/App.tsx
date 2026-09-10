/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Sparkles, AlertCircle } from 'lucide-react';
import { ColorItem, SavedPalette } from './types';
import { createColorItem, getRandomPleasantHex } from './utils/colorMath';
import { Navbar } from './components/Navbar';
import { PaletteGenerator } from './components/PaletteGenerator';
import { ImageExtractor } from './components/ImageExtractor';
import { MockupPreview } from './components/MockupPreview';
import { ExportModal } from './components/ExportModal';
import { ColorDetailModal } from './components/ColorDetailModal';
import { SavedPalettesView } from './components/SavedPalettesModal';

const INITIAL_HEXES = ['#4F46E5', '#06B6D4', '#10B981', '#1E293B', '#F8FAFC'];
const STORAGE_KEY = 'colorcraft_saved_palettes_v1';

const DEFAULT_SEEDED_PALETTES: SavedPalette[] = [
  {
    id: 'seed-tech',
    name: '未来矩阵科技蓝',
    colors: ['#0F172A', '#0284C7', '#38BDF8', '#818CF8', '#F8FAFC'],
    createdAt: Date.now() - 3600000 * 24 * 3,
    source: 'generator',
    tags: ['科技', '暗黑'],
  },
  {
    id: 'seed-warm',
    name: '托斯卡纳落日暖陶',
    colors: ['#78350F', '#B45309', '#F59E0B', '#FDE68A', '#FFFBEB'],
    createdAt: Date.now() - 3600000 * 24 * 2,
    source: 'generator',
    tags: ['暖色', '自然'],
  },
  {
    id: 'seed-minimal',
    name: '北欧高冷极简灰',
    colors: ['#18181B', '#52525B', '#A1A1AA', '#E4E4E7', '#FAFAFA'],
    createdAt: Date.now() - 3600000 * 24 * 1,
    source: 'generator',
    tags: ['极简', '冷色'],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'extractor' | 'library'>('generator');
  const [colors, setColors] = useState<ColorItem[]>(() =>
    INITIAL_HEXES.map((hex) => createColorItem(hex, false))
  );

  // Saved palettes in localStorage
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SEEDED_PALETTES;
  });

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportTargetColors, setExportTargetColors] = useState<ColorItem[]>(colors);
  const [inspectedColor, setInspectedColor] = useState<ColorItem | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Sync saved palettes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPalettes));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [savedPalettes]);

  // Handle saving current palette
  const handleSavePalette = () => {
    const newSaved: SavedPalette = {
      id: 'palette-' + Date.now(),
      name: `配色方案 ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      colors: colors.map((c) => c.hex),
      createdAt: Date.now(),
      source: 'generator',
      tags: [],
    };
    setSavedPalettes((prev) => [newSaved, ...prev]);
    showToast('已收藏调色板！可前往「预设与收藏」打上标签分类。');
  };

  // Handle deleting saved palette
  const handleDeleteSaved = (id: string) => {
    setSavedPalettes((prev) => prev.filter((p) => p.id !== id));
    showToast('已移除该调色板。');
  };

  // Handle updating tags for a saved palette
  const handleUpdatePaletteTags = (id: string, tags: string[]) => {
    setSavedPalettes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, tags } : p))
    );
    showToast('已更新调色板标签！');
  };

  // Handle loading palette into workbench
  const handleLoadPalette = (newColors: ColorItem[]) => {
    setColors(newColors);
    setActiveTab('generator');
    showToast('已载入调色板至编辑器！');
  };

  // Handle applying extracted colors from image
  const handleApplyExtractedPalette = (extractedColors: ColorItem[]) => {
    setColors(extractedColors);
    setActiveTab('generator');
    showToast(`已成功同步 ${extractedColors.length} 种提取色至调色板编辑器！`);
  };

  // Handle adding a single color picked from image
  const handleAddSingleColor = (color: ColorItem) => {
    setColors((prev) => {
      if (prev.length >= 10) {
        return [...prev.slice(1), color];
      }
      return [...prev, color];
    });
    showToast(`已吸取 ${color.hex} 并加入调色板！`);
  };

  // Open export with custom colors (e.g. from preset)
  const handleOpenExportWithColors = (target: ColorItem[]) => {
    setExportTargetColors(target);
    setIsExportOpen(true);
  };

  // Open export with current colors
  const handleOpenExportCurrent = () => {
    setExportTargetColors(colors);
    setIsExportOpen(true);
  };

  // Quick spacebar/generate trigger from navbar
  const handleQuickGenerate = () => {
    setColors((prev) =>
      prev.map((c) => (c.locked ? c : createColorItem(getRandomPleasantHex(), false)))
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between selection:bg-stone-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        colors={colors}
        onOpenExport={handleOpenExportCurrent}
        onQuickGenerate={handleQuickGenerate}
        savedCount={savedPalettes.length}
      />

      {/* Main Workspace Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-8">
        {/* Animated Tab Views */}
        <AnimatePresence mode="wait">
          {activeTab === 'generator' && (
            <motion.div
              key="generator-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Palette Generator Strip & Controls */}
              <PaletteGenerator
                colors={colors}
                setColors={setColors}
                onInspectColor={(c) => setInspectedColor(c)}
                onSavePalette={handleSavePalette}
                onOpenExport={handleOpenExportCurrent}
              />

              {/* Real-time Designer Mockup Preview */}
              <MockupPreview colors={colors} />
            </motion.div>
          )}

          {activeTab === 'extractor' && (
            <motion.div
              key="extractor-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <ImageExtractor
                onApplyPalette={handleApplyExtractedPalette}
                onAddSingleColor={handleAddSingleColor}
              />
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div
              key="library-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <SavedPalettesView
                savedPalettes={savedPalettes}
                onLoadPalette={handleLoadPalette}
                onDeleteSaved={handleDeleteSaved}
                onOpenExportWithColors={handleOpenExportWithColors}
                onUpdateTags={handleUpdatePaletteTags}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        id="app-footer"
        className="w-full bg-white border-t border-stone-200 py-6 mt-12 text-xs text-stone-500"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">ColorCraft Studio</span>
            <span>·</span>
            <span>专业设计师色彩提取与调色板生成系统</span>
          </div>

          <div className="flex items-center gap-4 text-stone-400 text-[11px]">
            <span>按空格键随时刷新调色板</span>
            <span>·</span>
            <span>支持 HEX / CSS 变量 / Tailwind / SCSS / SVG 导出</span>
          </div>
        </div>
      </footer>

      {/* Modals & Slide-outs */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        colors={exportTargetColors}
      />

      <ColorDetailModal
        color={inspectedColor}
        onClose={() => setInspectedColor(null)}
        onSelectTint={(tintHex) => {
          if (inspectedColor) {
            setColors((prev) =>
              prev.map((c) => (c.id === inspectedColor.id ? createColorItem(tintHex, c.locked) : c))
            );
            setInspectedColor((prev) => (prev ? createColorItem(tintHex, prev.locked) : null));
          }
        }}
      />

      {/* Floating Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-xs font-medium rounded-xl shadow-xl border border-stone-800"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
