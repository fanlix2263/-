import { useState } from 'react';
import { StampConfig } from './types';
import { StampSettingsPanel } from './components/StampSettingsPanel';
import { DocumentViewer } from './components/DocumentViewer';
import { FontLearnedCard } from './components/FontLearnedCard';
import { Stamp, CheckCircle, FileCheck } from 'lucide-react';

const DEFAULT_STAMP_CONFIG: StampConfig = {
  fontSizeMm: 5.0, // 学习到的标准档案机械打码机 5.0mm
  fontFamily: 'Bodoni Moda',
  fontWeight: '800',
  inkColor: '#101010', // 经典高饱和黑色油墨
  inkBleed: 0.35, // 轻微纸张纤维晕墨
  inkPressure: 1.05, // 饱满下压力度
  stampJitter: true, // 真实手工下压微晃动仿真 (±1.5mm, ±0.7度)
  showMachineArtifacts: true, // 仿真机械字轮伴生微点/定位印迹
  positionMode: 'odd-right-even-left', // 默认情况1：单号在右下角，双号在左下角
  leftMarginPercent: 4.8, // 双号在左下角时的左边距 4.8%
  rightMarginPercent: 4.8, // 距右边缘 4.8% (与用户样本 1~6 页及 8~14 页右下角位置一致)
  bottomMarginPercent: 3.6, // 距底边缘 3.6%
  rotation: 0.2, // 微量自然倾角
  prefix: '',
  suffix: '',
  digitPadLength: 0, // 默认自动消零
};

export default function App() {
  const [stampConfig, setStampConfig] = useState<StampConfig>(DEFAULT_STAMP_CONFIG);
  const [pageNumber, setPageNumber] = useState<string>('14');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [demoOrientation, setDemoOrientation] = useState<'portrait' | 'landscape'>('landscape');

  const handleUploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUserImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetPreset = () => {
    setStampConfig(DEFAULT_STAMP_CONFIG);
    setPageNumber('14');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* 顶部主导航栏 */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
                <Stamp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 leading-tight">
                    档案打码机 · 工程文档页码加盖系统
                  </h1>
                  <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    合金字轮古典衬线体 (5.0mm)
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  复刻广西融安县水库工程文档右下角跳号机印迹，支持单张与批量加盖
                </p>
              </div>
            </div>

            {/* 快速状态指示 */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>当前加盖目标：</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-sm border border-slate-200">
                  页码 {pageNumber}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主工作区 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧控制栏与学习成果 (4 列) */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. 打码参数面板 */}
            <StampSettingsPanel
              config={stampConfig}
              onChange={setStampConfig}
              currentPageNumber={pageNumber}
              onPageNumberChange={setPageNumber}
              onResetToLearnedPreset={handleResetPreset}
              userImage={userImage}
              demoOrientation={demoOrientation}
            />

            {/* 2. 字体与字模学习成果卡片 */}
            <FontLearnedCard />

            {/* 3. 使用指引 */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-2 text-slate-600">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>操作指南</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-500">
                <li>
                  <strong>当前演示页</strong>：已自动根据工程图纸在对应角标打上页码（如单号在右下、双号在左下）。
                </li>
                <li>
                  <strong>批量加盖与 ZIP 导出</strong>：在左侧设置起始页码与结束页码（如 8 ~ 14 页），点击「批量加盖并下载 ZIP 压缩包」，即可一键批量渲染并打包下载全部图纸。
                </li>
                <li>
                  <strong>打码其他图片</strong>：点击右上角「上传其他图纸」或直接将您的 JPG/PNG 拖入画布，即可自动打上页码。
                </li>
                <li>
                  <strong>高清输出</strong>：点击「下载加盖高清图」可导出单张当前图纸，带手工机械油墨印迹的印刷级成果。
                </li>
              </ul>
            </div>
          </div>

          {/* 右侧大图预览与交互查看器 (8 列) */}
          <div className="lg:col-span-8 flex flex-col">
            <DocumentViewer
              config={stampConfig}
              onConfigChange={setStampConfig}
              pageNumber={pageNumber}
              onPageNumberChange={setPageNumber}
              userImage={userImage}
              onUploadImage={handleUploadImage}
              onClearCustomImage={() => setUserImage(null)}
              demoOrientation={demoOrientation}
              onToggleDemoOrientation={setDemoOrientation}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
