import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Pipette,
  Layers,
  Sparkles,
  ArrowRight,
  Sliders,
  Check,
  Copy,
  Plus,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { ColorItem, ExtractFilterMode } from '../types';
import { extractColorsFromImage, samplePixelColor } from '../utils/imageColorExtraction';
import { createColorItem, getReadableTextColor } from '../utils/colorMath';
import { PRESET_IMAGES } from '../data/presets';

interface ImageExtractorProps {
  onApplyPalette: (colors: ColorItem[]) => void;
  onAddSingleColor: (color: ColorItem) => void;
}

export const ImageExtractor: React.FC<ImageExtractorProps> = ({
  onApplyPalette,
  onAddSingleColor,
}) => {
  const [currentImageSrc, setCurrentImageSrc] = useState<string>(PRESET_IMAGES[0].src);
  const [colorCount, setColorCount] = useState<number>(6);
  const [filterMode, setFilterMode] = useState<ExtractFilterMode>('balanced');
  const [extractedColors, setExtractedColors] = useState<ColorItem[]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Eyedropper state
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);
  const [hoverColor, setHoverColor] = useState<{ hex: string; x: number; y: number } | null>(null);
  const [pickedColorToast, setPickedColorToast] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load image onto canvas and run extraction
  const processImage = useCallback(
    (src: string, count: number, mode: ExtractFilterMode) => {
      setIsExtracting(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;

      img.onload = async () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Keep aspect ratio
            const maxWidth = 800;
            const scale = Math.min(1, maxWidth / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
        }

        try {
          const rawColors = await extractColorsFromImage(img, count, mode);
          const colorItems = rawColors.map((r) =>
            createColorItem(r.hex, false, r.percentage)
          );
          setExtractedColors(colorItems);
        } catch (e) {
          console.error('Extraction error', e);
        } finally {
          setIsExtracting(false);
        }
      };
    },
    []
  );

  // Trigger re-extraction whenever image source, count, or filter mode changes
  useEffect(() => {
    processImage(currentImageSrc, colorCount, filterMode);
  }, [currentImageSrc, colorCount, filterMode, processImage]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCurrentImageSrc(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handler
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setCurrentImageSrc(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Canvas mouse move for pipette
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sampled = samplePixelColor(canvas, e.clientX, e.clientY);
    if (sampled) {
      const rect = canvas.getBoundingClientRect();
      setHoverColor({
        hex: sampled.hex,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Click canvas to sample color directly
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sampled = samplePixelColor(canvas, e.clientX, e.clientY);
    if (sampled) {
      const newColor = createColorItem(sampled.hex);
      onAddSingleColor(newColor);
      setPickedColorToast(sampled.hex);
      setTimeout(() => setPickedColorToast(null), 1800);
    }
  };

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  const filterOptions: { mode: ExtractFilterMode; label: string }[] = [
    { mode: 'balanced', label: '均衡' },
    { mode: 'vibrant', label: '鲜艳' },
    { mode: 'muted', label: '柔和' },
    { mode: 'deep', label: '深色' },
    { mode: 'light', label: '浅色' },
  ];

  return (
    <div id="image-extractor-module" className="space-y-6">
      {/* Top Banner / Upload Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-stone-100 text-stone-800">
                <Pipette className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-stone-900">
                图片色彩智能提取与吸管取色
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              通过智能 K-Means 聚类算法提炼主色调，亦可在画面中任意点击吸取专属色值。
            </p>
          </div>

          {/* Upload Button */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              id="btn-upload-image"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-300 w-full md:w-auto shadow-2xs"
            >
              <Upload className="w-4 h-4" />
              <span>上传自定义图片</span>
            </button>
          </div>
        </div>

        {/* Preset Sample Images */}
        <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-stone-400 whitespace-nowrap flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>示例图片:</span>
          </span>
          {PRESET_IMAGES.map((preset) => {
            const isSelected = currentImageSrc === preset.src;
            return (
              <button
                key={preset.id}
                id={`btn-preset-img-${preset.id}`}
                onClick={() => setCurrentImageSrc(preset.src)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs transition-all border whitespace-nowrap ${
                  isSelected
                    ? 'border-stone-900 bg-stone-900 text-white font-medium shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <img
                  src={preset.src}
                  alt={preset.title}
                  className="w-4 h-4 rounded object-cover"
                />
                <span>{preset.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace: Canvas and Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Canvas Frame */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
              <Pipette className="w-3.5 h-3.5 text-stone-600" />
              <span>交互画布（鼠标移上查看色号，点击吸取存入调色板）</span>
            </div>
            {pickedColorToast && (
              <span className="text-[11px] bg-stone-900 text-white px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>已吸取色值 {pickedColorToast}</span>
              </span>
            )}
          </div>

          <div
            id="canvas-container"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="relative rounded-xl overflow-hidden bg-stone-950 flex items-center justify-center group cursor-crosshair border border-stone-800 aspect-video"
            onMouseEnter={() => setIsHoveringCanvas(true)}
            onMouseLeave={() => {
              setIsHoveringCanvas(false);
              setHoverColor(null);
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseMove={handleCanvasMouseMove}
              onClick={handleCanvasClick}
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
            />

            {/* Magnifier / Loupe Tooltip on Hover */}
            {isHoveringCanvas && hoverColor && (
              <div
                className="pointer-events-none absolute z-20 flex items-center gap-2 bg-stone-900/90 backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/20 shadow-xl -translate-x-1/2 -translate-y-12 transition-all"
                style={{ left: hoverColor.x, top: hoverColor.y }}
              >
                <div
                  className="w-4 h-4 rounded-full border border-white shadow-2xs"
                  style={{ backgroundColor: hoverColor.hex }}
                />
                <span className="font-mono font-bold tracking-wider">{hoverColor.hex}</span>
                <span className="text-[10px] text-stone-300">点击吸取</span>
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-between text-[11px] text-stone-400">
            <span>支持拖拽本地图片放入此区域</span>
            <span>分辨率自适应高保真采样</span>
          </div>
        </div>

        {/* Right: Color Extraction Controls & Results */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Controls Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-stone-700" />
                <h3 className="text-sm font-bold text-stone-900">算法调优参数</h3>
              </div>
              <button
                id="btn-reset-extraction"
                onClick={() => processImage(currentImageSrc, colorCount, filterMode)}
                className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                title="重新采样"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Extraction count slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-stone-700">
                <span>提取色彩数量</span>
                <span className="font-mono font-bold">{colorCount} 色</span>
              </div>
              <input
                id="slider-color-count"
                type="range"
                min="3"
                max="10"
                value={colorCount}
                onChange={(e) => setColorCount(Number(e.target.value))}
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
              />
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>3色 (核心基调)</span>
                <span>10色 (丰富色域)</span>
              </div>
            </div>

            {/* Filter Mode Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700 block">
                偏好倾向模式
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.mode}
                    id={`btn-mode-${opt.mode}`}
                    onClick={() => setFilterMode(opt.mode)}
                    className={`py-1.5 text-xs rounded-lg font-medium transition-all ${
                      filterMode === opt.mode
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-stone-700" />
                  <h3 className="text-sm font-bold text-stone-900">
                    提取结果 ({extractedColors.length})
                  </h3>
                </div>
                <span className="text-[11px] text-stone-400">点击色块可快速复制色号</span>
              </div>

              {/* Proportion Bar */}
              <div className="space-y-1">
                <div className="text-[11px] text-stone-500 font-medium">画面色彩权重分布:</div>
                <div className="h-3 rounded-md overflow-hidden flex shadow-2xs border border-stone-200">
                  {extractedColors.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        backgroundColor: c.hex,
                        width: `${c.percentage || 100 / extractedColors.length}%`,
                      }}
                      title={`${c.hex}: 约 ${c.percentage}%`}
                      className="transition-all hover:opacity-90"
                    />
                  ))}
                </div>
              </div>

              {/* Swatch List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {extractedColors.map((c) => {
                  const textColor = getReadableTextColor(c.hex);
                  const isCopied = copiedHex === c.hex;

                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 rounded-xl border border-stone-200 hover:border-stone-400 transition-all bg-white group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg border border-black/10 shadow-2xs flex items-center justify-center"
                          style={{ backgroundColor: c.hex }}
                        />
                        <div>
                          <div className="text-xs font-mono font-bold text-stone-900">
                            {c.hex}
                          </div>
                          <div className="text-[10px] text-stone-500 truncate max-w-28">
                            {c.name}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          id={`copy-swatch-${c.hex.slice(1)}`}
                          onClick={() => handleCopy(c.hex)}
                          className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors"
                          title="复制 HEX"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            onAddSingleColor(c);
                            setPickedColorToast(c.hex);
                            setTimeout(() => setPickedColorToast(null), 1800);
                          }}
                          className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors"
                          title="添加到主调色板"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-3 border-t border-stone-100">
              <button
                id="btn-apply-extracted-palette"
                onClick={() => onApplyPalette(extractedColors)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
              >
                <span>将此套配色同步至调色板编辑器</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
