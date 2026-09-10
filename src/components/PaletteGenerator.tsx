import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  RefreshCw,
  Copy,
  Check,
  Eye,
  Trash2,
  Plus,
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  Compass,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { ColorItem, HarmonyMode } from '../types';
import {
  getReadableTextColor,
  generateHarmonyPalette,
  createColorItem,
  getRandomPleasantHex,
  hslToRgb,
  rgbToHex,
} from '../utils/colorMath';

interface PaletteGeneratorProps {
  colors: ColorItem[];
  setColors: React.Dispatch<React.SetStateAction<ColorItem[]>>;
  onInspectColor: (color: ColorItem) => void;
  onSavePalette: () => void;
  onOpenExport: () => void;
}

export const PaletteGenerator: React.FC<PaletteGeneratorProps> = ({
  colors,
  setColors,
  onInspectColor,
  onSavePalette,
  onOpenExport,
}) => {
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>('random');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingHexId, setEditingHexId] = useState<string | null>(null);
  const [tempHex, setTempHex] = useState<string>('');

  // Spacebar keyboard shortcut to regenerate unlocked colors
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        regenerateUnlocked();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [colors, harmonyMode]);

  // Regenerate unlocked colors
  const regenerateUnlocked = () => {
    if (harmonyMode === 'random') {
      setColors((prev) =>
        prev.map((c) => (c.locked ? c : createColorItem(getRandomPleasantHex(), false)))
      );
    } else {
      // Find anchor color (first locked, or first color)
      const base = colors.find((c) => c.locked) || colors[0];
      const newHexes = generateHarmonyPalette(base.hex, harmonyMode, colors.length);
      setColors((prev) =>
        prev.map((c, i) => (c.locked ? c : createColorItem(newHexes[i] || getRandomPleasantHex(), false)))
      );
    }
  };

  // Toggle lock
  const toggleLock = (id: string) => {
    setColors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, locked: !c.locked } : c))
    );
  };

  // Copy hex
  const handleCopyHex = (id: string, hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Move color position
  const moveColor = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= colors.length) return;
    setColors((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  // Remove color
  const removeColor = (id: string) => {
    if (colors.length <= 2) return;
    setColors((prev) => prev.filter((c) => c.id !== id));
  };

  // Add color
  const addColor = () => {
    if (colors.length >= 10) return;
    const newHex = getRandomPleasantHex();
    setColors((prev) => [...prev, createColorItem(newHex, false)]);
  };

  // Update color hex directly
  const handleHexChange = (id: string, newHex: string) => {
    if (/^#?[0-9A-Fa-f]{6}$/.test(newHex)) {
      const formatted = newHex.startsWith('#') ? newHex : `#${newHex}`;
      setColors((prev) =>
        prev.map((c) => (c.id === id ? createColorItem(formatted, c.locked) : c))
      );
    }
  };

  // Apply harmony mode immediately
  const handleHarmonyChange = (mode: HarmonyMode) => {
    setHarmonyMode(mode);
    if (mode === 'random') {
      return;
    }
    const anchor = colors.find((c) => c.locked) || colors[0];
    const newHexes = generateHarmonyPalette(anchor.hex, mode, colors.length);
    setColors((prev) =>
      prev.map((c, i) => (c.locked ? c : createColorItem(newHexes[i] || c.hex, false)))
    );
  };

  const harmonyOptions: { key: HarmonyMode; label: string; desc: string }[] = [
    { key: 'random', label: '随机和弦', desc: '美学灵感随心刷新' },
    { key: 'analogous', label: '类似色', desc: '邻近色相，自然柔和' },
    { key: 'complementary', label: '互补色', desc: '180°对冲，张力鲜明' },
    { key: 'triadic', label: '三合色', desc: '等边三角，均衡丰富' },
    { key: 'tetradic', label: '四角色', desc: '双重补色，层次丰富' },
    { key: 'monochromatic', label: '同色系', desc: '明度梯度，统一高级' },
    { key: 'split-complementary', label: '分裂互补', desc: '高对比兼具柔韧' },
  ];

  return (
    <div id="palette-generator-module" className="space-y-6">
      {/* Action Toolbar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Harmony Mode Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 mr-1">
            <Compass className="w-4 h-4 text-stone-900" />
            <span>和弦理论:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {harmonyOptions.map((opt) => (
              <button
                key={opt.key}
                id={`btn-harmony-${opt.key}`}
                onClick={() => handleHarmonyChange(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  harmonyMode === opt.key
                    ? 'bg-stone-900 text-white shadow-xs font-semibold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
                title={opt.desc}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            id="btn-save-palette"
            onClick={onSavePalette}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
            title="收藏到本地调色板库"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>收藏当前方案</span>
          </button>

          <button
            id="btn-generator-spacebar"
            onClick={regenerateUnlocked}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>重新生成 (空格)</span>
          </button>
        </div>
      </div>

      {/* Main Palette Strip Canvas */}
      <div
        id="palette-strip-container"
        className="bg-white border border-stone-200 rounded-2xl p-3 sm:p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-flow-col lg:auto-cols-fr gap-3 min-h-[380px]">
          {colors.map((color, index) => {
            const textColor = getReadableTextColor(color.hex);
            const isCopied = copiedId === color.id;

            return (
              <div
                key={color.id}
                id={`swatch-col-${color.id}`}
                className="relative rounded-xl overflow-hidden transition-all duration-300 flex flex-col justify-between p-4 group min-h-[320px] shadow-xs border border-black/5"
                style={{ backgroundColor: color.hex }}
              >
                {/* Top Action Bar */}
                <div className="flex items-center justify-between z-10">
                  {/* Position reorder buttons */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {index > 0 && (
                      <button
                        onClick={() => moveColor(index, 'left')}
                        className="p-1 rounded-md transition-colors"
                        style={{
                          backgroundColor:
                            textColor === '#FFFFFF' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.4)',
                          color: textColor,
                        }}
                        title="向左移动"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    )}
                    {index < colors.length - 1 && (
                      <button
                        onClick={() => moveColor(index, 'right')}
                        className="p-1 rounded-md transition-colors"
                        style={{
                          backgroundColor:
                            textColor === '#FFFFFF' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.4)',
                          color: textColor,
                        }}
                        title="向右移动"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Lock / Remove Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`btn-lock-${color.id}`}
                      onClick={() => toggleLock(color.id)}
                      className={`p-1.5 rounded-lg transition-all shadow-xs ${
                        color.locked ? 'ring-2 ring-white/50' : ''
                      }`}
                      style={{
                        backgroundColor:
                          color.locked
                            ? textColor === '#FFFFFF'
                              ? 'rgba(0,0,0,0.6)'
                              : 'rgba(255,255,255,0.8)'
                            : textColor === '#FFFFFF'
                            ? 'rgba(0,0,0,0.25)'
                            : 'rgba(255,255,255,0.4)',
                        color: textColor,
                      }}
                      title={color.locked ? '已锁定 (重新生成时保留此色)' : '未锁定 (点击锁定)'}
                    >
                      {color.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    {colors.length > 2 && (
                      <button
                        onClick={() => removeColor(color.id)}
                        className="p-1.5 rounded-lg opacity-40 hover:opacity-100 transition-all"
                        style={{
                          backgroundColor:
                            textColor === '#FFFFFF' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.4)',
                          color: textColor,
                        }}
                        title="移除此色"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Center Quick Interaction: Eyedropper & Detail trigger */}
                <div className="flex items-center justify-center my-auto opacity-0 group-hover:opacity-100 transition-opacity z-10 gap-2">
                  <button
                    id={`btn-inspect-${color.id}`}
                    onClick={() => onInspectColor(color)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md shadow-sm transition-transform hover:scale-105"
                    style={{
                      backgroundColor:
                        textColor === '#FFFFFF' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)',
                      color: textColor,
                    }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>详细色阶 & WCAG</span>
                  </button>

                  {/* Native Color Picker button */}
                  <label
                    className="p-1.5 rounded-lg cursor-pointer backdrop-blur-md shadow-sm transition-transform hover:scale-105"
                    style={{
                      backgroundColor:
                        textColor === '#FFFFFF' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)',
                      color: textColor,
                    }}
                    title="手动调色"
                  >
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => handleHexChange(color.id, e.target.value)}
                      className="w-0 h-0 opacity-0 absolute"
                    />
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </label>
                </div>

                {/* Bottom Metadata & Copy */}
                <div
                  className="z-10 rounded-xl p-3 backdrop-blur-md space-y-1.5"
                  style={{
                    backgroundColor:
                      textColor === '#FFFFFF' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
                    color: textColor,
                  }}
                >
                  <div className="flex items-center justify-between">
                    {/* Editable Hex */}
                    {editingHexId === color.id ? (
                      <input
                        type="text"
                        value={tempHex}
                        autoFocus
                        onChange={(e) => setTempHex(e.target.value)}
                        onBlur={() => {
                          handleHexChange(color.id, tempHex);
                          setEditingHexId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleHexChange(color.id, tempHex);
                            setEditingHexId(null);
                          }
                        }}
                        className="w-20 px-1 py-0.5 text-xs font-mono font-bold bg-white text-stone-900 rounded outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingHexId(color.id);
                          setTempHex(color.hex);
                        }}
                        className="font-mono font-black text-sm tracking-wide text-left hover:underline"
                        title="点击直接修改 HEX"
                      >
                        {color.hex}
                      </button>
                    )}

                    <button
                      id={`btn-copy-hex-${color.id}`}
                      onClick={() => handleCopyHex(color.id, color.hex)}
                      className="p-1 rounded-md transition-transform hover:scale-110"
                      title="复制 HEX"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="text-[11px] font-medium truncate opacity-90">
                    {color.name}
                  </div>

                  <div className="text-[10px] font-mono opacity-75 flex justify-between">
                    <span>RGB {color.rgb.r}, {color.rgb.g}, {color.rgb.b}</span>
                    <span>{color.hsl.h}°</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Color Card */}
          {colors.length < 8 && (
            <button
              id="btn-add-color-swatch"
              onClick={addColor}
              className="rounded-xl border-2 border-dashed border-stone-200 hover:border-stone-400 p-4 flex flex-col items-center justify-center gap-2 text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-all min-h-[320px]"
            >
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">添加颜色</span>
              <span className="text-[10px] text-stone-400">最多支持 8-10 色</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
