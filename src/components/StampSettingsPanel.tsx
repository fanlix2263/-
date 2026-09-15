import React, { useState, useRef } from 'react';
import { StampConfig } from '../types';
import {
  Sliders,
  Droplet,
  Move,
  Sparkles,
  RefreshCcw,
  ArrowDownRight,
  ArrowDownLeft,
  BookOpen,
  Download,
  Loader2,
  CheckCircle2,
  FolderArchive,
  Upload,
  Layers,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { isPageEven } from '../utils/stampRenderer';
import { generateAndDownloadStampedZip, BatchProgress } from '../utils/batchExporter';

export interface StampSettingsPanelProps {
  config: StampConfig;
  onChange: (newConfig: StampConfig) => void;
  currentPageNumber: string;
  onPageNumberChange: (val: string) => void;
  onResetToLearnedPreset: () => void;
  userImage?: string | null;
  demoOrientation?: 'portrait' | 'landscape';
}

export const StampSettingsPanel: React.FC<StampSettingsPanelProps> = ({
  config,
  onChange,
  currentPageNumber,
  onPageNumberChange,
  onResetToLearnedPreset,
  userImage,
  demoOrientation = 'landscape',
}) => {
  const update = <K extends keyof StampConfig>(key: K, value: StampConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  // 批量加盖状态
  const [startPage, setStartPage] = useState<number>(8);
  const [endPage, setEndPage] = useState<number>(14);
  const [batchMode, setBatchMode] = useState<'current-base' | 'multi-files'>('current-base');
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const multiFileInputRef = useRef<HTMLInputElement | null>(null);

  const isEven = isPageEven(currentPageNumber);
  const currentCorner =
    config.positionMode === 'odd-right-even-left'
      ? isEven
        ? '左下角 (双号)'
        : '右下角 (单号)'
      : '右下角 (全部)';

  // 统计批量范围单双号与总数
  const totalBatchPages = Math.max(0, endPage - startPage + 1);
  const evenPages: number[] = [];
  const oddPages: number[] = [];
  if (startPage <= endPage && endPage - startPage <= 200) {
    for (let p = startPage; p <= endPage; p++) {
      if (p % 2 === 0) evenPages.push(p);
      else oddPages.push(p);
    }
  }

  // 批量加盖并打包下载 Zip
  const handleStartBatchExport = async () => {
    if (isNaN(startPage) || isNaN(endPage)) {
      setExportError('请输入有效的起始和结束页码数值');
      return;
    }
    if (startPage < 1) {
      setExportError('起始页码必须大于等于 1');
      return;
    }
    if (startPage > endPage) {
      setExportError('起始页码不能大于结束页码');
      return;
    }
    if (totalBatchPages > 200) {
      setExportError('单次批量加盖建议不超过 200 页，以防止浏览器内存溢出');
      return;
    }
    if (batchMode === 'multi-files' && batchFiles.length === 0) {
      setExportError('请先选择需要批量加盖的本地图纸文件');
      return;
    }

    setExportError(null);
    setIsExportingZip(true);
    setExportSuccess(false);

    try {
      await generateAndDownloadStampedZip({
        startPage,
        endPage,
        config,
        baseImageSrc: userImage || null,
        demoOrientation,
        multipleFiles: batchMode === 'multi-files' ? batchFiles : undefined,
        onProgress: (p) => setProgress(p),
      });
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4500);
    } catch (err: any) {
      setExportError(err?.message || '批量导出失败，请重试');
    } finally {
      setIsExportingZip(false);
      setProgress(null);
    }
  };

  const handleMultipleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files);
      setBatchFiles(filesArr);
      // 自动设置结束页码为起始页码 + 文件数量 - 1
      setEndPage(startPage + filesArr.length - 1);
      setExportError(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">打码机参数设置</h2>
        </div>
        <button
          id="btn-reset-preset"
          onClick={onResetToLearnedPreset}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium hover:underline"
        >
          <RefreshCcw className="w-3 h-3" />
          恢复学习标准值
        </button>
      </div>

      {/* ⭐ 核心功能：页码位置规则 (单号右双号左 vs 全部右下角) */}
      <div className="space-y-2.5 bg-blue-50/50 border border-blue-200/80 p-3.5 rounded-xl">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-blue-950 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>页码加盖位置规则</span>
          </label>
          <span className="text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200 shadow-2xs">
            当前落位：{currentCorner}
          </span>
        </div>

        <div className="space-y-2 pt-1">
          {/* 模式 1 */}
          <button
            type="button"
            onClick={() => update('positionMode', 'odd-right-even-left')}
            className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex items-start gap-2.5 ${
              config.positionMode === 'odd-right-even-left'
                ? 'bg-white border-blue-600 shadow-xs ring-1 ring-blue-500'
                : 'bg-white/70 border-slate-200 hover:bg-white text-slate-700'
            }`}
          >
            <div className={`mt-0.5 p-1 rounded-md ${config.positionMode === 'odd-right-even-left' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>1. 单号在右下角，双号在左下角</span>
                {config.positionMode === 'odd-right-even-left' && (
                  <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">生效中</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                对开双面装订标准：奇数页在右下翻边，偶数页在左下翻边，装订线在内侧不被遮挡。
              </p>
            </div>
          </button>

          {/* 模式 2 */}
          <button
            type="button"
            onClick={() => update('positionMode', 'all-bottom-right')}
            className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex items-start gap-2.5 ${
              config.positionMode === 'all-bottom-right'
                ? 'bg-white border-blue-600 shadow-xs ring-1 ring-blue-500'
                : 'bg-white/70 border-slate-200 hover:bg-white text-slate-700'
            }`}
          >
            <div className={`mt-0.5 p-1 rounded-md ${config.positionMode === 'all-bottom-right' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>2. 所有的页码都在右下角</span>
                {config.positionMode === 'all-bottom-right' && (
                  <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">生效中</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                单面连续打印标准：所有页面无论单号还是双号，一律统一固定加盖在右下角。
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 1. 当前页码输入与消零模式 */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          加盖页码 (Target Page Number)
        </label>
        <div className="flex items-center gap-2">
          <input
            id="input-page-number"
            type="text"
            value={currentPageNumber}
            onChange={(e) => onPageNumberChange(e.target.value)}
            placeholder="例如: 8, 14, 128..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          <div className="flex items-center gap-1 text-xs text-slate-700 bg-slate-100 px-2.5 py-2 rounded-lg font-medium">
            {config.positionMode === 'odd-right-even-left' ? (
              isEven ? (
                <>
                  <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold text-blue-700">双号 · 左下</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold text-emerald-700">单号 · 右下</span>
                </>
              )
            ) : (
              <>
                <ArrowDownRight className="w-3.5 h-3.5 text-slate-700" />
                <span>全部右下</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-500">字轮消零模式 (Drop Cipher):</span>
          <select
            value={config.digitPadLength}
            onChange={(e) => update('digitPadLength', parseInt(e.target.value))}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700"
          >
            <option value="0">自动消零（正常8、14、125）</option>
            <option value="3">3位固定补零（如 008, 014）</option>
            <option value="4">4位固定补零（如 0008, 0014）</option>
          </select>
        </div>
      </div>

      {/* ⭐ 重点功能：批量加盖与 ZIP 打包下载 */}
      <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
          <div className="flex items-center gap-1.5">
            <FolderArchive className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-950">批量连续加盖与 ZIP 导出</span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/60">
            共 {totalBatchPages} 页
          </span>
        </div>

        {/* 起始与结束页码输入 */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              起始页码 (Start)
            </label>
            <input
              id="input-batch-start"
              type="number"
              min="1"
              value={startPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setStartPage(isNaN(val) ? 1 : val);
                setExportError(null);
              }}
              className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              placeholder="起始页码"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              结束页码 (End)
            </label>
            <input
              id="input-batch-end"
              type="number"
              min="1"
              value={endPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setEndPage(isNaN(val) ? 1 : val);
                setExportError(null);
              }}
              className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              placeholder="结束页码"
            />
          </div>
        </div>

        {/* 快速范围预设按钮 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-500 font-medium">常用范围：</span>
          {[
            { label: '8 ~ 14 (当前样本)', s: 8, e: 14 },
            { label: '1 ~ 6 (竖向方案)', s: 1, e: 6 },
            { label: '1 ~ 25 (全套方案)', s: 1, e: 25 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setStartPage(preset.s);
                setEndPage(preset.e);
                setExportError(null);
              }}
              className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-all ${
                startPage === preset.s && endPage === preset.e
                  ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* 单双号落位分布指示 */}
        <div className="bg-white/90 border border-emerald-100 rounded-lg p-2.5 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between text-slate-600 font-medium">
            <span>落位规则：</span>
            <span className="font-bold text-slate-800">
              {config.positionMode === 'odd-right-even-left' ? '单号在右下 · 双号在左下' : '全部页码在右下角'}
            </span>
          </div>

          {config.positionMode === 'odd-right-even-left' ? (
            <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[10px]">
              <div className="bg-blue-50/80 border border-blue-200/80 rounded p-1.5">
                <div className="text-blue-800 font-bold flex items-center gap-1">
                  <ArrowDownLeft className="w-3 h-3" />
                  <span>双号左下 ({evenPages.length}页)</span>
                </div>
                <div className="text-slate-500 truncate font-mono mt-0.5" title={evenPages.join(', ')}>
                  {evenPages.length > 0 ? evenPages.slice(0, 5).join(', ') + (evenPages.length > 5 ? '...' : '') : '无'}
                </div>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded p-1.5">
                <div className="text-emerald-800 font-bold flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" />
                  <span>单号右下 ({oddPages.length}页)</span>
                </div>
                <div className="text-slate-500 truncate font-mono mt-0.5" title={oddPages.join(', ')}>
                  {oddPages.length > 0 ? oddPages.slice(0, 5).join(', ') + (oddPages.length > 5 ? '...' : '') : '无'}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px] text-slate-600 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3 text-slate-700" />
              <span>所选第 {startPage} 至 {endPage} 页全部统一加盖于右下角</span>
            </div>
          )}
        </div>

        {/* 底图模式切换：单图模板连续打码 VS 上传多图 */}
        <div className="space-y-1.5">
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => {
                setBatchMode('current-base');
                setExportError(null);
              }}
              className={`flex-1 py-1 px-2 rounded-md transition-all flex items-center justify-center gap-1 ${
                batchMode === 'current-base'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
              <span>当前图纸/模板连续加盖</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBatchMode('multi-files');
                setExportError(null);
              }}
              className={`flex-1 py-1 px-2 rounded-md transition-all flex items-center justify-center gap-1 ${
                batchMode === 'multi-files'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3 text-blue-600" />
              <span>多文件顺序加盖</span>
            </button>
          </div>

          {/* 如果是多图模式，提供批量选择多张文件功能 */}
          {batchMode === 'multi-files' && (
            <div className="p-2.5 bg-white border border-dashed border-blue-300 rounded-lg text-center space-y-1.5">
              <input
                ref={multiFileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleMultipleFilesSelected}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => multiFileInputRef.current?.click()}
                className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>选择多张待加盖图纸 ({batchFiles.length} 个已选)</span>
              </button>
              {batchFiles.length > 0 ? (
                <div className="text-[10px] text-slate-500 truncate max-w-full">
                  已加载 {batchFiles.length} 张图纸，将自动对应至第 {startPage} ~ {endPage} 页
                </div>
              ) : (
                <p className="text-[10px] text-slate-400">
                  支持按 Ctrl/Shift 选多张图纸，将按顺序编号加盖
                </p>
              )}
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {exportError && (
          <div className="flex items-center gap-1.5 text-rose-600 text-xs bg-rose-50 border border-rose-200 p-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {/* 导出成功提示 */}
        {exportSuccess && (
          <div className="flex items-center gap-1.5 text-emerald-800 text-xs bg-emerald-100 border border-emerald-300 p-2 rounded-lg font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>已成功生成并启动 ZIP 下载！</span>
          </div>
        )}

        {/* 导出进度条 */}
        {isExportingZip && progress && (
          <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-emerald-200">
            <div className="flex justify-between items-center text-[11px] font-semibold text-emerald-950">
              <span className="truncate max-w-[200px]">{progress.statusText}</span>
              <span className="font-mono">{progress.percent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* 批量加盖并下载 ZIP 按钮 */}
        <button
          type="button"
          id="btn-batch-download-zip"
          onClick={handleStartBatchExport}
          disabled={isExportingZip}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 ${
            isExportingZip
              ? 'bg-emerald-300 text-white cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white hover:shadow-md'
          }`}
        >
          {isExportingZip ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>正在批量加盖并打包 ({progress?.percent || 0}%)...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>批量加盖并下载 ZIP 压缩包 (第{startPage}~{endPage}页)</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-slate-500 leading-tight text-center">
          生成的 Zip 包含全部处理后高清晰度图纸，每页独立仿真金属字轮机械油墨印迹。
        </p>
      </div>

      {/* 2. 字号物理尺寸 (mm) */}
      <div>
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
          <span>字号物理高度 (Font Size)</span>
          <span className="text-blue-600 font-mono">{config.fontSizeMm.toFixed(1)} mm (约20pt)</span>
        </div>
        <input
          id="slider-font-size"
          type="range"
          min="3.5"
          max="8.0"
          step="0.1"
          value={config.fontSizeMm}
          onChange={(e) => update('fontSizeMm', parseFloat(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
          <span>3.5mm (微型号)</span>
          <span className="font-semibold text-slate-600">5.0mm (档案机标配)</span>
          <span>8.0mm (特大号)</span>
        </div>
      </div>

      {/* 3. 字体与字形 */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          机械字模字体 (Typeface)
        </label>
        <select
          id="select-font-family"
          value={config.fontFamily}
          onChange={(e) => update('fontFamily', e.target.value as any)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="Bodoni Moda">Bodoni Moda (最接近合金字轮古典衬线体)</option>
          <option value="Playfair Display">Playfair Display (经典高对比衬线)</option>
          <option value="Times New Roman">Times New Roman (标准官方罗马体)</option>
          <option value="Cinzel">Cinzel (古典雕刻铭文风)</option>
        </select>
      </div>

      {/* 4. 印油质感与下压仿真 */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Droplet className="w-3.5 h-3.5 text-slate-600" />
          <span>印油质感与物理压印</span>
        </div>

        {/* 颜色选择 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">墨色类型:</span>
          <div className="flex gap-2">
            {[
              { label: '浓黑印油', color: '#111111' },
              { label: '碳素墨灰', color: '#262626' },
              { label: '复古微蓝墨', color: '#172554' },
              { label: '档案印泥红', color: '#991b1b' },
            ].map((c) => (
              <button
                key={c.color}
                onClick={() => update('inkColor', c.color)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border transition-all ${
                  config.inkColor === c.color
                    ? 'border-blue-600 bg-blue-50/50 font-bold text-slate-900 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/10"
                  style={{ backgroundColor: c.color }}
                />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 油墨微晕渗入 */}
        <div>
          <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
            <span>油墨微晕渗透 (Paper Bleed)</span>
            <span className="font-mono text-[11px]">{Math.round(config.inkBleed * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.inkBleed}
            onChange={(e) => update('inkBleed', parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* 盖印下压力度 */}
        <div>
          <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
            <span>盖印下压力度 (Impression Depth)</span>
            <span className="font-mono text-[11px]">{Math.round(config.inkPressure * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.6"
            max="1.4"
            step="0.05"
            value={config.inkPressure}
            onChange={(e) => update('inkPressure', parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>
      </div>

      {/* 5. 手工盖印真实感 (抖动 & 杂质) */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>手工盖印真实感模拟</span>
        </div>

        <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
          <div className="text-xs">
            <div className="font-semibold text-slate-800">手工敲击微晃动偏差</div>
            <div className="text-slate-500 text-[11px]">模拟每次人工敲码的微小位移(±1mm)与轻微倾斜</div>
          </div>
          <input
            type="checkbox"
            checked={config.stampJitter}
            onChange={(e) => update('stampJitter', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
          <div className="text-xs">
            <div className="font-semibold text-slate-800">字轮伴生微小墨斑/定位点</div>
            <div className="text-slate-500 text-[11px]">仿真金属字轮边缘受油墨沾附留下的微量压迹</div>
          </div>
          <input
            type="checkbox"
            checked={config.showMachineArtifacts}
            onChange={(e) => update('showMachineArtifacts', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
          />
        </label>
      </div>

      {/* 6. 位置微调 */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Move className="w-3.5 h-3.5 text-slate-600" />
          <span>页码落位边距微调</span>
        </div>

        {/* 距右边缘间距 */}
        <div>
          <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
            <span>
              距右边缘间距 {config.positionMode === 'odd-right-even-left' ? '(单号落位)' : '(全部页码)'}
            </span>
            <span className="font-mono text-[11px]">{config.rightMarginPercent.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="1.5"
            max="12.0"
            step="0.2"
            value={config.rightMarginPercent}
            onChange={(e) => update('rightMarginPercent', parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* 距左边缘间距 (当处于单号右双号左模式时显示) */}
        {config.positionMode === 'odd-right-even-left' && (
          <div>
            <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
              <span>距左边缘间距 (双号落位)</span>
              <span className="font-mono text-[11px]">{config.leftMarginPercent.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="12.0"
              step="0.2"
              value={config.leftMarginPercent}
              onChange={(e) => update('leftMarginPercent', parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        )}

        <div>
          <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
            <span>距底边缘间距</span>
            <span className="font-mono text-[11px]">{config.bottomMarginPercent.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="1.5"
            max="10.0"
            step="0.2"
            value={config.bottomMarginPercent}
            onChange={(e) => update('bottomMarginPercent', parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
