import React, { useState } from 'react';
import { HARDWARE_BENCHMARK } from '../data/auditReport';
import { Cpu, AlertTriangle, ShieldCheck, Zap, Info } from 'lucide-react';

export const HardwareStressCalculator: React.FC = () => {
  const [pdfPages, setPdfPages] = useState<number>(15);
  const [dpiSetting, setDpiSetting] = useState<number>(150); // 150 vs 300
  const [useStreamGC, setUseStreamGC] = useState<boolean>(true);
  const [threadLimit, setThreadLimit] = useState<number>(2);

  // 测算模型
  // 1. 基准系统常驻内存: 3.6GB (Win11) + 1.5GB (WorkBuddy) + 1.2GB (Browser) = 6.3GB
  const baselineUsedGB = 6.3;

  // 2. Python 进程启动基准 (Presidio + spaCy zh_sm + spacy en_sm): 约 0.45GB
  const pythonBaseGB = 0.45;

  // 3. OCR 内存计算
  // A4 @ 300 DPI: 2480 x 3508 x 3 bytes ~ 26MB per uncompressed bitmap page
  // A4 @ 150 DPI: 1240 x 1754 x 1 byte (grayscale) ~ 2.2MB per page
  const bitmapPerPageMB = dpiSetting === 300 ? 32 : 3.5;
  // 若未启用流式 GC，每页保留在内存中
  const accumulatedBitmapGB = useStreamGC
    ? (bitmapPerPageMB / 1024) * 1.5 // 仅当前页与处理缓冲区
    : (bitmapPerPageMB * pdfPages) / 1024;

  // Tesseract 进程内存 (LSTM 汉字库加载): 单个进程约 0.35GB
  const tesseractEngineGB = 0.35;

  const totalPeakMemoryGB = baselineUsedGB + pythonBaseGB + accumulatedBitmapGB + tesseractEngineGB;
  const freeRamGB = Math.max(0, 8.0 - totalPeakMemoryGB);
  const memoryUsagePercent = Math.min(100, (totalPeakMemoryGB / 8.0) * 100);

  const isOOMRisk = totalPeakMemoryGB > 7.6;
  const isSevereThrashing = totalPeakMemoryGB > 8.0;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sky-400" />
              Windows 11 / i3-8100 / 8GB RAM 真实硬件负载测算器
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              推演在运行 WorkBuddy 的同时，本地调用 Python + Presidio + Tesseract OCR 处理复杂文档时的物理内存与CPU承载力
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-400">硬件配置: i3-8100 (4C/4T @ 3.6GHz) · 8GB DDR4</span>
          </div>
        </div>

        {/* 动态调节滑块与开关 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 p-4 bg-slate-950/70 rounded-lg border border-slate-800">
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">
              待处理 PDF 扫描件页数: <span className="text-emerald-400 font-mono tabular-nums">{pdfPages} 页</span>
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={pdfPages}
              onChange={(e) => setPdfPages(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>1 页 (发票)</span>
              <span>30 页 (合同)</span>
              <span>100 页 (年报)</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">
              OCR 渲染采样率 (DPI): <span className="text-sky-400 font-mono">{dpiSetting} DPI</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => setDpiSetting(150)}
                className={`py-1 text-xs rounded border transition-colors ${
                  dpiSetting === 150
                    ? 'bg-slate-800 border-sky-500/60 text-sky-300 font-medium'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                150 (推荐优化)
              </button>
              <button
                onClick={() => setDpiSetting(300)}
                className={`py-1 text-xs rounded border transition-colors ${
                  dpiSetting === 300
                    ? 'bg-slate-800 border-rose-500/60 text-rose-300 font-medium'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                300 (原方案)
              </button>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">原方案300DPI位图达32MB/页</div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">
              单页流式处理 + 强制 GC 回收:
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => setUseStreamGC(true)}
                className={`py-1 text-xs rounded border transition-colors ${
                  useStreamGC
                    ? 'bg-slate-800 border-emerald-500/60 text-emerald-300 font-medium'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                启用 (修复版)
              </button>
              <button
                onClick={() => setUseStreamGC(false)}
                className={`py-1 text-xs rounded border transition-colors ${
                  !useStreamGC
                    ? 'bg-slate-800 border-rose-500/60 text-rose-300 font-medium'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                关闭 (原方案)
              </button>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">关闭时所有页面位图常驻内存</div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">
              CPU 线程上限 (OMP_THREADS):
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => setThreadLimit(2)}
                className={`py-1 text-xs rounded border transition-colors ${
                  threadLimit === 2
                    ? 'bg-slate-800 border-emerald-500/60 text-emerald-300 font-medium'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                2 线程 (稳定)
              </button>
              <button
                onClick={() => setThreadLimit(4)}
                className={`py-1 text-xs rounded border transition-colors ${
                  threadLimit === 4
                    ? 'bg-slate-800 border-amber-500/60 text-amber-300 font-medium'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                4 线程 (打满CPU)
              </button>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">避免桌面UI操作被OCR卡死</div>
          </div>
        </div>

        {/* 内存条可视化 */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">8GB 物理内存实时分配模拟</span>
            <span className="font-mono tabular-nums text-slate-400">
              峰值预计占用: <strong className={isSevereThrashing ? 'text-rose-400' : isOOMRisk ? 'text-amber-400' : 'text-emerald-400'}>
                {totalPeakMemoryGB.toFixed(2)} GB
              </strong> / 8.00 GB ({memoryUsagePercent.toFixed(1)}%)
            </span>
          </div>

          {/* 进度条 */}
          <div className="h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
            <div style={{ width: '45%' }} className="bg-slate-600 h-full" title="Win11 系统 3.6GB" />
            <div style={{ width: '18.7%' }} className="bg-sky-600 h-full" title="WorkBuddy Electron 1.5GB" />
            <div style={{ width: '15%' }} className="bg-amber-600 h-full" title="日常浏览器/后台 1.2GB" />
            <div
              style={{ width: `${Math.min(21.3, ((pythonBaseGB + accumulatedBitmapGB + tesseractEngineGB) / 8.0) * 100)}%` }}
              className={`h-full ${isSevereThrashing ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
              title="脱敏+OCR引擎占用"
            />
          </div>

          {/* 图例 */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" /> Win11系统 (3.6G)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" /> WorkBuddy (1.5G)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" /> 浏览器日常 (1.2G)
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isSevereThrashing ? 'bg-rose-500' : 'bg-emerald-500'} inline-block`} />
              Python脱敏+OCR ({(pythonBaseGB + accumulatedBitmapGB + tesseractEngineGB).toFixed(2)}G)
            </span>
          </div>
        </div>

        {/* 预警与建议 */}
        <div className="mt-6">
          {isSevereThrashing ? (
            <div className="p-4 rounded-lg bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-rose-200">
                  严重警报: 物理内存已突破 8GB 极限（预计峰值 {totalPeakMemoryGB.toFixed(2)}GB）！
                </strong>
                <p className="mt-1 leading-relaxed">
                  在未启用流式 GC 或采用 300DPI 渲染多页 PDF 时，Windows 会被迫把系统内存刷入 C 盘虚拟内存（Pagefile）。i3-8100 + 普通固态硬盘会出现持续数分钟的鼠标指针卡死、WorkBuddy 崩溃或抛出 MemoryError。
                  <strong>请务必采纳修复版代码中的“流式分单页 OCR + 150DPI 灰度降采样 + gc.collect()”策略。</strong>
                </p>
              </div>
            </div>
          ) : isOOMRisk ? (
            <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-amber-200">
                  注意：内存水位偏高，剩余安全缓冲区仅 {freeRamGB.toFixed(2)}GB
                </strong>
                <p className="mt-1 leading-relaxed">
                  建议关闭后台闲置的 Chrome/Edge 标签页，并确保 Tesseract 线程数锁死在 2，给 WorkBuddy 主进程留出充足响应余量。
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-emerald-200">
                  状态优良：当前负载在 8GB RAM 安全预算内（剩余可用约 {freeRamGB.toFixed(2)}GB）
                </strong>
                <p className="mt-1 leading-relaxed">
                  通过 150 DPI 灰度化与单页即时 gc.collect()，即使处理 50 页以上的扫描文件，内存也能稳定横盘在 0.8GB - 1.2GB 之间，不会随页数增加发生线性泄漏。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
