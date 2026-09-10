import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Download, FileCode, FileText } from 'lucide-react';
import { ColorItem, ExportFormat } from '../types';
import { generateExportCode, generateSvgPalette } from '../utils/colorMath';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors: ColorItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, colors }) => {
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('hex');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentCode = generateExportCode(colors, activeFormat);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadFile = () => {
    let filename = `palette-${Date.now()}`;
    let mimeType = 'text/plain';

    switch (activeFormat) {
      case 'css':
        filename += '.css';
        mimeType = 'text/css';
        break;
      case 'scss':
        filename += '.scss';
        mimeType = 'text/x-scss';
        break;
      case 'tailwind':
        filename += '-tailwind.js';
        mimeType = 'application/javascript';
        break;
      case 'json':
        filename += '.json';
        mimeType = 'application/json';
        break;
      case 'hex':
      default:
        filename += '.txt';
        mimeType = 'text/plain';
        break;
    }

    const blob = new Blob([currentCode], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSvg = () => {
    const svgContent = generateSvgPalette(colors, 'Designer Color Palette');
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `palette-swatch-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formats: { key: ExportFormat; label: string; desc: string }[] = [
    { key: 'hex', label: 'HEX 色值', desc: '纯色号与色彩注释' },
    { key: 'css', label: 'CSS 变量', desc: ':root { --color-... }' },
    { key: 'tailwind', label: 'Tailwind 配置', desc: 'tailwind.config.js 主题' },
    { key: 'scss', label: 'SCSS 变量', desc: '$primary, $secondary' },
    { key: 'json', label: 'JSON 数据', desc: '包含 HEX / RGB / HSL' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
        <motion.div
          id="export-code-modal"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-stone-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-stone-100 text-stone-800">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">导出色彩代码</h3>
                <p className="text-xs text-stone-500">支持一键复制或直接导出为代码文件</p>
              </div>
            </div>
            <button
              id="btn-close-export-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Palette Preview Bar */}
          <div className="px-6 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-stone-500">当前色彩 ({colors.length}色)</span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {colors.map((c) => (
                <div key={c.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-stone-200 text-[11px] font-mono shadow-2xs">
                  <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                  <span className="font-semibold text-stone-800">{c.hex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Format Tabs */}
          <div className="px-6 pt-4 flex gap-2 overflow-x-auto border-b border-stone-200 pb-2">
            {formats.map((f) => (
              <button
                key={f.key}
                id={`format-tab-${f.key}`}
                onClick={() => setActiveFormat(f.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeFormat === f.key
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Code Body */}
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            <div className="relative group">
              <pre className="bg-stone-900 text-stone-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed max-h-72 border border-stone-800 selection:bg-stone-700">
                <code>{currentCode}</code>
              </pre>

              <button
                id="btn-copy-code"
                onClick={handleCopy}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition-colors border border-stone-700 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">已复制到剪贴板</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制代码</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                id="btn-download-svg-swatch"
                onClick={handleDownloadSvg}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors shadow-2xs"
                title="导出矢量色卡，可直接拖入 Figma / Sketch / Photoshop"
              >
                <Download className="w-3.5 h-3.5 text-stone-600" />
                <span>下载 SVG 色卡 (Figma可用)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-download-code-file"
                onClick={handleDownloadFile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-stone-600" />
                <span>下载代码文件</span>
              </button>

              <button
                id="btn-confirm-copy"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已复制成功' : '一键复制当前代码'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
