import React, { useRef, useEffect, useState } from 'react';
import { StampConfig } from '../types';
import {
  drawNumberingMachineStamp,
  drawDemoEngineeringPage,
  drawDemoLandscapeTablePage,
  computeStampCoordinates,
  isPageEven,
} from '../utils/stampRenderer';
import {
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Upload,
  Eye,
  Check,
  Copy,
  Layers,
  FileText,
  RotateCcw,
  ArrowDownRight,
  ArrowDownLeft,
  BookOpen
} from 'lucide-react';

interface DocumentViewerProps {
  config: StampConfig;
  onConfigChange?: (newConfig: StampConfig) => void;
  pageNumber: string;
  onPageNumberChange: (val: string) => void;
  userImage: string | null;
  onUploadImage: (file: File) => void;
  onClearCustomImage: () => void;
  demoOrientation: 'portrait' | 'landscape';
  onToggleDemoOrientation: (ori: 'portrait' | 'landscape') => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  config,
  onConfigChange,
  pageNumber,
  onPageNumberChange,
  userImage,
  onUploadImage,
  onClearCustomImage,
  demoOrientation,
  onToggleDemoOrientation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [activeViewMode, setActiveViewMode] = useState<'stamped' | 'original'>('stamped');
  const [detectedIsLandscape, setDetectedIsLandscape] = useState<boolean>(false);

  const isEven = isPageEven(pageNumber);
  const isLeftCorner = config.positionMode === 'odd-right-even-left' && isEven;

  // 渲染主逻辑
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (userImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = userImage;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const isLand = img.width > img.height;
        setDetectedIsLandscape(isLand);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 绘制用户原始图片
        ctx.drawImage(img, 0, 0);

        // 如果处于加盖模式，打上页码
        if (activeViewMode === 'stamped') {
          const coords = computeStampCoordinates(pageNumber, config, img.width, img.height);

          drawNumberingMachineStamp(
            ctx,
            pageNumber,
            coords.x,
            coords.y,
            config,
            img.width,
            img.height,
            `user-${pageNumber}`,
            isLand,
            coords.textAlign
          );
        }
      };
    } else {
      // 官方样本模式
      const isLand = demoOrientation === 'landscape';
      setDetectedIsLandscape(isLand);

      if (isLand) {
        // 横向表格 (表5-1 原材料方案表，第8~14页样本)
        drawDemoLandscapeTablePage(
          canvas,
          activeViewMode === 'stamped' ? pageNumber : '',
          config,
          '12'
        );
      } else {
        // 竖向文档 (检测方案第5页样本)
        drawDemoEngineeringPage(
          canvas,
          activeViewMode === 'stamped' ? pageNumber : '',
          config
        );
      }
    }
  }, [config, pageNumber, userImage, activeViewMode, demoOrientation]);

  // 处理文件拖拽与上传
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onUploadImage(file);
      }
    }
  };

  // 下载当前加盖后的全分辨率大图
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsExporting(true);

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `工程图纸_${detectedIsLandscape ? '横向' : '竖向'}_页码${pageNumber}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export image', err);
    } finally {
      setTimeout(() => setIsExporting(false), 600);
    }
  };

  // 复制到剪贴板
  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col h-full">
      {/* 顶部控制工具栏 */}
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* 位置规则快捷切换 (单号右双号左 vs 全部右下角) */}
          {onConfigChange && (
            <div className="flex items-center bg-slate-200/90 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                id="btn-mode-odd-even"
                onClick={() => onConfigChange({ ...config, positionMode: 'odd-right-even-left' })}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  config.positionMode === 'odd-right-even-left'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="单号（奇数）在右下角，双号（偶数）在左下角"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" />
                <span>单号右下 · 双号左下</span>
              </button>
              <button
                type="button"
                id="btn-mode-all-right"
                onClick={() => onConfigChange({ ...config, positionMode: 'all-bottom-right' })}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  config.positionMode === 'all-bottom-right'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="所有页码一律在右下角"
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-slate-600" />
                <span>全部右下角</span>
              </button>
            </div>
          )}

          {/* 横竖向内置模板切换 */}
          {!userImage && (
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => onToggleDemoOrientation('landscape')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  demoOrientation === 'landscape'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                横向表格 (表5-1 / 页码8~14)
              </button>
              <button
                onClick={() => onToggleDemoOrientation('portrait')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  demoOrientation === 'portrait'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                竖向文档 (方案正文 / 页码25)
              </button>
            </div>
          )}

          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              id="btn-view-stamped"
              onClick={() => setActiveViewMode('stamped')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeViewMode === 'stamped'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              加盖预览
            </button>
            <button
              id="btn-view-original"
              onClick={() => setActiveViewMode('original')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeViewMode === 'original'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              原图对比
            </button>
          </div>

          {userImage && (
            <button
              id="btn-clear-image"
              onClick={onClearCustomImage}
              className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-rose-50 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              恢复工程样本
            </button>
          )}
        </div>

        {/* 缩放与下载操作 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-1 py-0.5 shadow-2xs">
            <button
              id="btn-zoom-out"
              onClick={() => setZoomLevel((z) => Math.max(0.3, z - 0.15))}
              className="p-1 hover:bg-slate-100 text-slate-600 rounded-md"
              title="缩小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-slate-700 min-w-[3.5rem] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              id="btn-zoom-in"
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.15))}
              className="p-1 hover:bg-slate-100 text-slate-600 rounded-md"
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              id="btn-zoom-reset"
              onClick={() => setZoomLevel(detectedIsLandscape ? 0.75 : 0.85)}
              className="p-1 hover:bg-slate-100 text-slate-600 rounded-md ml-1"
              title="适应窗口"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            id="btn-copy-image"
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '已复制' : '复制图像'}
          </button>

          <button
            id="btn-download-image"
            onClick={handleDownload}
            disabled={isExporting}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? '导出中...' : '下载加盖高清图'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onUploadImage(e.target.files[0]);
              }
            }}
          />
          <button
            id="btn-upload-trigger"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            上传其他图纸
          </button>
        </div>
      </div>

      {/* 快捷测试单双号与位数栏 */}
      <div className="px-4 py-2 bg-blue-50/40 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-600 font-semibold flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            测试单双号与落位：
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: '8 (双/左)', val: '8', isEven: true },
              { label: '9 (单/右)', val: '9', isEven: false },
              { label: '13 (单/右)', val: '13', isEven: false },
              { label: '14 (双/左)', val: '14', isEven: true },
              { label: '25 (单/右)', val: '25', isEven: false },
              { label: '26 (双/左)', val: '26', isEven: true },
              { label: '128 (双/左)', val: '128', isEven: true },
              { label: '129 (单/右)', val: '129', isEven: false },
              { label: '1024 (双/左)', val: '1024', isEven: true },
            ].map((p) => {
              const active = pageNumber === p.val;
              return (
                <button
                  key={p.val}
                  onClick={() => onPageNumberChange(p.val)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all flex items-center gap-1 ${
                    active
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p.isEven ? (
                    <ArrowDownLeft className={`w-3 h-3 ${active ? 'text-white' : 'text-blue-600'}`} />
                  ) : (
                    <ArrowDownRight className={`w-3 h-3 ${active ? 'text-white' : 'text-emerald-600'}`} />
                  )}
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-500">
            加盖判定：
          </span>
          <span
            className={`font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
              isLeftCorner
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {isLeftCorner ? (
              <>
                <ArrowDownLeft className="w-3.5 h-3.5" />
                双号 ➜ 左下角
              </>
            ) : (
              <>
                <ArrowDownRight className="w-3.5 h-3.5" />
                {config.positionMode === 'odd-right-even-left' ? '单号 ➜ 右下角' : '固定 ➜ 右下角'}
              </>
            )}
          </span>
        </div>
      </div>

      {/* 画布预览容器 */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex-1 bg-slate-200/70 p-6 overflow-auto flex items-center justify-center min-h-[540px] relative select-none"
      >
        <div
          className="transition-transform duration-100 ease-out origin-top shadow-xl rounded-sm overflow-hidden bg-white"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <canvas ref={canvasRef} className="block max-w-none" />
        </div>

        {/* 提示浮窗 */}
        <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur-xs text-white text-[11px] px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          <span>
            {userImage
              ? `自定义图纸 (${detectedIsLandscape ? '横向' : '竖向'})`
              : detectedIsLandscape
              ? '广西融安水库工程 表5-1 检测方案表 (横向样本)'
              : '广西融安水库工程 监理平行检测方案 (竖向样本)'}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-emerald-300 font-bold">加盖页码: {pageNumber}</span>
          <span className="text-slate-400">|</span>
          <span className="text-amber-300 font-mono font-semibold">
            {isLeftCorner ? '【落位：左下角 (双号)】' : '【落位：右下角】'}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-blue-300 font-mono">字高 5.0mm 物理严格等比</span>
        </div>
      </div>
    </div>
  );
};
