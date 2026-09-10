import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { ColorItem } from '../types';
import {
  generateShadeScale,
  getContrastRatio,
  hexToRgb,
  getReadableTextColor,
} from '../utils/colorMath';

interface ColorDetailModalProps {
  color: ColorItem | null;
  onClose: () => void;
  onSelectTint?: (hex: string) => void;
}

export const ColorDetailModal: React.FC<ColorDetailModalProps> = ({
  color,
  onClose,
  onSelectTint,
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  if (!color) return null;

  const shades = generateShadeScale(color.hex);
  const rgb = hexToRgb(color.hex);
  const whiteRgb = { r: 255, g: 255, b: 255 };
  const blackRgb = { r: 17, g: 24, b: 39 };

  const contrastWhite = getContrastRatio(rgb, whiteRgb);
  const contrastBlack = getContrastRatio(rgb, blackRgb);

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  const getWcagBadge = (ratio: number) => {
    const isAAA = ratio >= 7;
    const isAA = ratio >= 4.5;
    const isAALarge = ratio >= 3;

    if (isAAA) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
          <ShieldCheck className="w-3 h-3" />
          WCAG AAA 通过 ({ratio.toFixed(2)}:1)
        </span>
      );
    }
    if (isAA) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
          <ShieldCheck className="w-3 h-3" />
          WCAG AA 通过 ({ratio.toFixed(2)}:1)
        </span>
      );
    }
    if (isAALarge) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
          <AlertCircle className="w-3 h-3" />
          仅大字号通过 ({ratio.toFixed(2)}:1)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
        <AlertCircle className="w-3 h-3" />
        不达标 ({ratio.toFixed(2)}:1)
      </span>
    );
  };

  const textColor = getReadableTextColor(color.hex);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <motion.div
        id="color-detail-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-stone-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Color Hero */}
        <div
          className="p-6 transition-colors flex flex-col justify-between h-44 relative"
          style={{ backgroundColor: color.hex }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-md backdrop-blur-md"
              style={{
                backgroundColor: textColor === '#FFFFFF' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.4)',
                color: textColor,
              }}
            >
              {color.name}
            </span>
            <button
              id="btn-close-color-detail"
              onClick={onClose}
              className="p-1.5 rounded-full transition-opacity hover:opacity-80"
              style={{
                backgroundColor: textColor === '#FFFFFF' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.4)',
                color: textColor,
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight" style={{ color: textColor }}>
                {color.hex}
              </h2>
              <p className="text-xs opacity-80" style={{ color: textColor }}>
                RGB({color.rgb.r}, {color.rgb.g}, {color.rgb.b}) · HSL({color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%)
              </p>
            </div>

            <button
              id="btn-copy-main-hex"
              onClick={() => handleCopy(color.hex)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all"
              style={{
                backgroundColor: textColor === '#FFFFFF' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)',
                color: textColor,
              }}
            >
              {copiedHex === color.hex ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHex === color.hex ? '已复制' : '复制 HEX'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* WCAG Contrast Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-900 tracking-wide uppercase">
              WCAG 可访问性对比度检测 (Web 2.1)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {/* White text on background */}
              <div
                className="p-3.5 rounded-xl flex flex-col justify-between h-24 border border-black/5"
                style={{ backgroundColor: color.hex, color: '#FFFFFF' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">白字预览</span>
                  <span className="text-[11px] font-mono opacity-90">{contrastWhite.toFixed(2)}:1</span>
                </div>
                <div>{getWcagBadge(contrastWhite)}</div>
              </div>

              {/* Dark text on background */}
              <div
                className="p-3.5 rounded-xl flex flex-col justify-between h-24 border border-black/5"
                style={{ backgroundColor: color.hex, color: '#111827' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">黑字预览</span>
                  <span className="text-[11px] font-mono opacity-90">{contrastBlack.toFixed(2)}:1</span>
                </div>
                <div>{getWcagBadge(contrastBlack)}</div>
              </div>
            </div>
          </div>

          {/* Tint & Shade Scale */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 tracking-wide uppercase">
                色彩梯队 (50-900 色阶梯)
              </h3>
              <span className="text-[11px] text-stone-400">点击色块复制对应色号</span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {shades.map((s) => {
                const shadeTextColor = getReadableTextColor(s.hex);
                const isSelected = s.hex.toUpperCase() === color.hex.toUpperCase();

                return (
                  <button
                    key={s.step}
                    id={`shade-btn-${s.step}`}
                    onClick={() => {
                      handleCopy(s.hex);
                      if (onSelectTint) onSelectTint(s.hex);
                    }}
                    className={`group relative flex flex-col items-center justify-between h-18 rounded-lg p-1 transition-transform hover:scale-105 ${
                      isSelected ? 'ring-2 ring-stone-900 ring-offset-1' : 'border border-black/5'
                    }`}
                    style={{ backgroundColor: s.hex }}
                    title={`权重 ${s.step}: ${s.hex}`}
                  >
                    <span
                      className="text-[10px] font-mono font-medium"
                      style={{ color: shadeTextColor }}
                    >
                      {s.step}
                    </span>

                    <span
                      className="text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: shadeTextColor }}
                    >
                      {copiedHex === s.hex ? '已复制' : s.hex.slice(1)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors"
          >
            完成
          </button>
        </div>
      </motion.div>
    </div>
  );
};
