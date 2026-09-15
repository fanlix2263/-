export interface DocumentPage {
  id: string;
  name: string;
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
  assignedPageNumber: number | string;
  orientation: 'portrait' | 'landscape';
  customX?: number;
  customY?: number;
  customAngle?: number;
}

export type PagePositionMode = 'odd-right-even-left' | 'all-bottom-right';

export interface StampConfig {
  fontSizeMm: number; // 默认 5.0 mm (与学习到的打码机字号一致)
  fontFamily: 'Bodoni Moda' | 'Playfair Display' | 'Times New Roman' | 'Cinzel';
  fontWeight: '600' | '700' | '800' | '900';
  inkColor: string; // 默认 '#101010' 档案油性墨
  inkBleed: number; // 0.0 ~ 1.0 (油墨微晕渗透度)
  inkPressure: number; // 0.7 ~ 1.3 (盖印下压力饱满度)
  stampJitter: boolean; // 是否启用手工敲章微小偏差（位置与轻微倾斜）
  showMachineArtifacts: boolean; // 是否仿真金属字轮相邻墨点/微小杂质
  positionMode: PagePositionMode; // 1. 单号右下角/双号左下角; 2. 全部右下角
  leftMarginPercent: number; // 双号在左下角时距左边缘百分比，默认 4.8%
  rightMarginPercent: number; // 距右边缘百分比，默认 4.8%
  bottomMarginPercent: number; // 距底边缘百分比
  rotation: number; // 基准旋转角度 (-5 ~ 5度)
  prefix: string; // 前缀（如无直接空）
  suffix: string; // 后缀
  digitPadLength: number; // 0 表示自动消零（正常8、14、125），若选 3 则补零为 008、014
}

export interface LearnedFontReport {
  fontName: string;
  category: string;
  matchedSpecs: string;
  physicalHeight: string;
  glyphDetails: {
    digit: string;
    description: string;
  }[];
}

