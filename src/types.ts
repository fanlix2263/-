export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export interface ColorItem {
  id: string;
  hex: string;
  rgb: RgbColor;
  hsl: HslColor;
  locked: boolean;
  name: string;
  percentage?: number;
}

export type HarmonyMode =
  | 'random'
  | 'analogous'
  | 'complementary'
  | 'triadic'
  | 'tetradic'
  | 'monochromatic'
  | 'split-complementary';

export type ExtractFilterMode = 'balanced' | 'vibrant' | 'muted' | 'deep' | 'light';

export type ExportFormat = 'hex' | 'css' | 'tailwind' | 'scss' | 'json';

export interface SavedPalette {
  id: string;
  name: string;
  colors: string[]; // hex codes
  createdAt: number;
  source: 'image' | 'generator' | 'preset';
  tags?: string[];
}
