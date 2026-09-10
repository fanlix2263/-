import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Sparkles,
  Trash2,
  ArrowUpRight,
  Copy,
  Check,
  Download,
  Layers,
  Tag,
  Plus,
  X,
  Filter,
} from 'lucide-react';
import { SavedPalette, ColorItem } from '../types';
import { PRESET_PALETTES } from '../data/presets';
import { createColorItem } from '../utils/colorMath';

interface SavedPalettesViewProps {
  savedPalettes: SavedPalette[];
  onLoadPalette: (colors: ColorItem[]) => void;
  onDeleteSaved: (id: string) => void;
  onOpenExportWithColors: (colors: ColorItem[]) => void;
  onUpdateTags?: (id: string, tags: string[]) => void;
}

const COMMON_TAG_SUGGESTIONS = ['科技', '暖色', '极简', '自然', '复古', '冷色', '暗黑', '活力'];

export const SavedPalettesView: React.FC<SavedPalettesViewProps> = ({
  savedPalettes,
  onLoadPalette,
  onDeleteSaved,
  onOpenExportWithColors,
  onUpdateTags,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('全部');
  const [editingPaletteId, setEditingPaletteId] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState<string>('');

  const handleCopyPaletteHex = (id: string, colors: string[]) => {
    navigator.clipboard.writeText(colors.join(', '));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Compute all unique tags present across saved palettes
  const availableTags = useMemo(() => {
    const tagCountMap: Record<string, number> = {};
    savedPalettes.forEach((p) => {
      (p.tags || []).forEach((t) => {
        const trimmed = t.trim();
        if (trimmed) {
          tagCountMap[trimmed] = (tagCountMap[trimmed] || 0) + 1;
        }
      });
    });
    return tagCountMap;
  }, [savedPalettes]);

  // Filtered palettes based on selectedTag
  const filteredPalettes = useMemo(() => {
    if (selectedTag === '全部') {
      return savedPalettes;
    }
    return savedPalettes.filter((p) => p.tags && p.tags.includes(selectedTag));
  }, [savedPalettes, selectedTag]);

  // Handle toggling or adding a tag to a palette
  const handleToggleTag = (palette: SavedPalette, tag: string) => {
    if (!onUpdateTags) return;
    const currentTags = palette.tags || [];
    let updatedTags: string[];
    if (currentTags.includes(tag)) {
      updatedTags = currentTags.filter((t) => t !== tag);
    } else {
      updatedTags = [...currentTags, tag];
    }
    onUpdateTags(palette.id, updatedTags);
  };

  // Handle adding custom typed tag
  const handleAddCustomTag = (palette: SavedPalette) => {
    const trimmed = customTagInput.trim();
    if (!trimmed || !onUpdateTags) return;
    const currentTags = palette.tags || [];
    if (!currentTags.includes(trimmed)) {
      onUpdateTags(palette.id, [...currentTags, trimmed]);
    }
    setCustomTagInput('');
  };

  // Handle removing a specific tag
  const handleRemoveTag = (palette: SavedPalette, tagToRemove: string) => {
    if (!onUpdateTags) return;
    const currentTags = palette.tags || [];
    const updatedTags = currentTags.filter((t) => t !== tagToRemove);
    onUpdateTags(palette.id, updatedTags);
  };

  return (
    <div id="palettes-library-view" className="space-y-8">
      {/* Section 1: User Saved Palettes */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-stone-100 text-stone-800">
              <Bookmark className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-stone-900">
              我的收藏配色 ({savedPalettes.length})
            </h3>
          </div>
          <span className="text-xs text-stone-400">支持给调色板打上标签并快速筛选</span>
        </div>

        {/* Tag Filter Bar */}
        {savedPalettes.length > 0 && (
          <div
            id="saved-palettes-tag-filters"
            className="flex flex-wrap items-center gap-1.5 p-2 bg-white border border-stone-200 rounded-xl shadow-2xs"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 pl-1.5 pr-1">
              <Filter className="w-3.5 h-3.5 text-stone-600" />
              <span>按标签筛选:</span>
            </div>

            {/* "全部" tag */}
            <button
              id="tag-filter-all"
              onClick={() => setSelectedTag('全部')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedTag === '全部'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              <span>全部</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedTag === '全部' ? 'bg-white/20 text-white' : 'bg-stone-200/80 text-stone-600'
              }`}>
                {savedPalettes.length}
              </span>
            </button>

            {/* Dynamic available tags */}
            {Object.entries(availableTags).map(([tag, count]) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  id={`tag-filter-${tag}`}
                  onClick={() => setSelectedTag(tag)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                  }`}
                >
                  <span>#{tag}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-stone-200/80 text-stone-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {/* If no tags created yet, show prompt */}
            {Object.keys(availableTags).length === 0 && (
              <span className="text-xs text-stone-400 pl-2">
                点击下方调色板卡片上的「+ 标签」即可添加分类标签
              </span>
            )}
          </div>
        )}

        {/* Empty State */}
        {savedPalettes.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-2 shadow-xs">
            <Layers className="w-8 h-8 mx-auto text-stone-300" />
            <p className="text-sm font-medium text-stone-700">暂无收藏的调色板</p>
            <p className="text-xs text-stone-400">
              在调色板生成器或图片提取页面点击「收藏当前方案」，即可在此打标签与分类管理。
            </p>
          </div>
        ) : filteredPalettes.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-3 shadow-xs">
            <Tag className="w-8 h-8 mx-auto text-stone-300" />
            <p className="text-sm font-medium text-stone-700">
              未找到包含标签「#{selectedTag}」的调色板
            </p>
            <button
              onClick={() => setSelectedTag('全部')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
            >
              <span>查看全部调色板</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPalettes.map((item) => {
              const isEditingTags = editingPaletteId === item.id;

              return (
                <div
                  key={item.id}
                  id={`saved-palette-${item.id}`}
                  className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs hover:border-stone-400 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-stone-900 truncate">
                        {item.name}
                      </h4>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Swatches Bar */}
                    <div className="flex h-12 rounded-xl overflow-hidden shadow-2xs border border-black/5">
                      {item.colors.map((hex, idx) => (
                        <div
                          key={idx}
                          style={{ backgroundColor: hex }}
                          className="flex-1 transition-transform hover:scale-105"
                          title={hex}
                        />
                      ))}
                    </div>

                    {/* Hex list preview */}
                    <div className="text-[11px] font-mono text-stone-500 truncate">
                      {item.colors.join('  ')}
                    </div>

                    {/* Tags Display */}
                    <div className="pt-1 flex flex-wrap items-center gap-1.5 min-h-[26px]">
                      {item.tags && item.tags.length > 0 ? (
                        item.tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium transition-all ${
                              selectedTag === tag
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/60'
                            }`}
                            title={`筛选包含 #${tag} 的配色`}
                          >
                            <span>#{tag}</span>
                          </button>
                        ))
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">暂无标签</span>
                      )}

                      <button
                        id={`btn-edit-tags-${item.id}`}
                        onClick={() => {
                          setEditingPaletteId(isEditingTags ? null : item.id);
                          setCustomTagInput('');
                        }}
                        className={`text-[11px] px-2 py-0.5 rounded-md border transition-all flex items-center gap-1 ${
                          isEditingTags
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'text-stone-500 hover:text-stone-900 border-dashed border-stone-300 hover:border-stone-400 bg-stone-50'
                        }`}
                        title="编辑或添加标签"
                      >
                        <Tag className="w-3 h-3" />
                        <span>{isEditingTags ? '收起' : item.tags && item.tags.length > 0 ? '管理标签' : '+ 标签'}</span>
                      </button>
                    </div>

                    {/* Inline Tag Editor Panel */}
                    {isEditingTags && (
                      <div className="mt-2 p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2.5 text-xs animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-[11px] font-medium text-stone-700">
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-stone-600" />
                            <span>推荐快捷标签 (点击增删):</span>
                          </div>
                          <button
                            onClick={() => setEditingPaletteId(null)}
                            className="text-stone-400 hover:text-stone-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Common tag quick toggles */}
                        <div className="flex flex-wrap gap-1">
                          {COMMON_TAG_SUGGESTIONS.map((sug) => {
                            const hasTag = item.tags?.includes(sug);
                            return (
                              <button
                                key={sug}
                                onClick={() => handleToggleTag(item, sug)}
                                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                                  hasTag
                                    ? 'bg-stone-900 text-white font-semibold'
                                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                                }`}
                              >
                                {hasTag ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                                <span>{sug}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Custom tag input */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            placeholder="自定义新标签名称..."
                            value={customTagInput}
                            onChange={(e) => setCustomTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomTag(item);
                              }
                            }}
                            className="flex-1 px-2.5 py-1 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400"
                          />
                          <button
                            onClick={() => handleAddCustomTag(item)}
                            className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            添加
                          </button>
                        </div>

                        {/* Current selected tags with remove X */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-1 items-center border-t border-stone-200/60">
                            <span className="text-[10px] text-stone-400 mr-1">已打标签:</span>
                            {item.tags.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center gap-1 text-[10px] bg-stone-200/80 text-stone-800 px-1.5 py-0.5 rounded"
                              >
                                <span>#{t}</span>
                                <button
                                  onClick={() => handleRemoveTag(item, t)}
                                  className="text-stone-400 hover:text-stone-700"
                                  title={`移除 #${t}`}
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyPaletteHex(item.id, item.colors)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                        title="复制所有 HEX 色值"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          onOpenExportWithColors(item.colors.map((c) => createColorItem(c)))
                        }
                        className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                        title="导出 CSS / Tailwind 代码"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSaved(item.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="删除此收藏"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => onLoadPalette(item.colors.map((c) => createColorItem(c)))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                    >
                      <span>载入画布</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Designer Curated Presets */}
      <div className="space-y-4 pt-4 border-t border-stone-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-stone-100 text-stone-800">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-stone-900">
              经典设计大师调色板预设
            </h3>
          </div>
          <span className="text-xs text-stone-400">涵盖极简、SaaS、东方枯山水与包豪斯等主流美学</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESET_PALETTES.map((preset) => (
            <div
              key={preset.id}
              id={`preset-card-${preset.id}`}
              className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs hover:border-stone-400 transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md">
                    {preset.category}
                  </span>
                  <span className="text-xs font-mono text-stone-400">
                    {preset.colors.length} 色
                  </span>
                </div>

                <h4 className="text-sm font-bold text-stone-900">
                  {preset.name}
                </h4>

                <p className="text-xs text-stone-500 line-clamp-2">
                  {preset.description}
                </p>

                {/* Swatches Bar */}
                <div className="flex h-10 rounded-xl overflow-hidden shadow-2xs border border-black/5 mt-1">
                  {preset.colors.map((hex, idx) => (
                    <div
                      key={idx}
                      style={{ backgroundColor: hex }}
                      className="flex-1 transition-transform hover:scale-105"
                      title={hex}
                    />
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() =>
                    onOpenExportWithColors(preset.colors.map((c) => createColorItem(c)))
                  }
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                  title="直接导出此预设代码"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() =>
                    onLoadPalette(preset.colors.map((c) => createColorItem(c)))
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-2xs"
                >
                  <span>使用此方案</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
