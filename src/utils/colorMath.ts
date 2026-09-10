import { RgbColor, HslColor, HarmonyMode, ColorItem, ExportFormat } from '../types';

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

// Convert HEX to RGB
export function hexToRgb(hex: string): RgbColor {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleaned, 16);
  if (isNaN(num)) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert RGB to HEX
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = clamp(Math.round(n), 0, 255);
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): HslColor {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Convert HSL to RGB
export function hslToRgb(h: number, s: number, l: number): RgbColor {
  h = ((h % 360) + 360) % 360;
  const sNorm = clamp(s, 0, 100) / 100;
  const lNorm = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h >= 0 && h < 60) {
    rPrime = c;
    gPrime = x;
    bPrime = 0;
  } else if (h >= 60 && h < 120) {
    rPrime = x;
    gPrime = c;
    bPrime = 0;
  } else if (h >= 120 && h < 180) {
    rPrime = 0;
    gPrime = c;
    bPrime = x;
  } else if (h >= 180 && h < 240) {
    rPrime = 0;
    gPrime = x;
    bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x;
    gPrime = 0;
    bPrime = c;
  } else {
    rPrime = c;
    gPrime = 0;
    bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}

// Calculate relative luminance for WCAG contrast
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate WCAG contrast ratio between two RGB colors (returns 1:1 up to 21:1)
export function getContrastRatio(rgb1: RgbColor, rgb2: RgbColor): number {
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Determine best readable text color on a given background (#FFFFFF or #1E293B)
export function getReadableTextColor(hex: string): string {
  const rgb = hexToRgb(hex);
  const whiteContrast = getContrastRatio(rgb, { r: 255, g: 255, b: 255 });
  const blackContrast = getContrastRatio(rgb, { r: 17, g: 24, b: 39 });
  return whiteContrast >= blackContrast ? '#FFFFFF' : '#111827';
}

// Generate full shade/tint scale (50, 100, 200, ... 900)
export function generateShadeScale(hex: string): { step: number; hex: string }[] {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  return steps.map((step) => {
    let targetL: number;
    let targetS = hsl.s;

    if (step === 500) {
      targetL = hsl.l;
    } else if (step < 500) {
      // Tints (lighter)
      const ratio = (500 - step) / 500;
      targetL = hsl.l + (96 - hsl.l) * ratio;
      targetS = Math.max(10, hsl.s * (1 - ratio * 0.4));
    } else {
      // Shades (darker)
      const ratio = (step - 500) / 400;
      targetL = hsl.l - (hsl.l - 12) * ratio;
      targetS = Math.min(100, hsl.s * (1 + ratio * 0.15));
    }

    const resRgb = hslToRgb(hsl.h, targetS, targetL);
    return {
      step,
      hex: rgbToHex(resRgb.r, resRgb.g, resRgb.b),
    };
  });
}

// Designer-friendly closest color namer
const COLOR_NAMES: { hex: string; name: string }[] = [
  { hex: '#000000', name: '极夜黑 (Pure Black)' },
  { hex: '#1E293B', name: '曜石板岩 (Slate Navy)' },
  { hex: '#334155', name: '深灰石 (Deep Slate)' },
  { hex: '#64748B', name: '雾蓝灰 (Cool Steel)' },
  { hex: '#94A3B8', name: '青石灰 (Light Slate)' },
  { hex: '#CBD5E1', name: '浅云白 (Silver Cloud)' },
  { hex: '#F1F5F9', name: '素白雪 (Frost White)' },
  { hex: '#FFFFFF', name: '纯净白 (Pure White)' },

  { hex: '#EF4444', name: '烈焰绯红 (Vibrant Crimson)' },
  { hex: '#DC2626', name: '朱红 (Ruby Red)' },
  { hex: '#B91C1C', name: '胭脂深红 (Garnet Red)' },
  { hex: '#F87171', name: '珊瑚粉红 (Coral Coral)' },
  { hex: '#FCA5A5', name: '浅樱粉 (Sakura Petal)' },

  { hex: '#F97316', name: '暮光暖橙 (Tangerine Orange)' },
  { hex: '#EA580C', name: '焦糖柿红 (Burnt Orange)' },
  { hex: '#FB923C', name: '杏黄暖阳 (Apricot Glow)' },
  { hex: '#FED7AA', name: '奶香蜜桃 (Peach Cream)' },

  { hex: '#F59E0B', name: '琉璃琥珀 (Amber Gold)' },
  { hex: '#D97706', name: '复古赭石 (Ochre Bronze)' },
  { hex: '#FBBF24', name: '明朗晨光 (Sunflower)' },
  { hex: '#FEF08A', name: '淡柠檬黄 (Lemon Chiffon)' },

  { hex: '#10B981', name: '翡翠碧玉 (Emerald Jade)' },
  { hex: '#059669', name: '松针深绿 (Pine Green)' },
  { hex: '#34D399', name: '青柠薄荷 (Mint Frost)' },
  { hex: '#84CC16', name: '嫩草春绿 (Fresh Lime)' },
  { hex: '#65A30D', name: '橄榄林荫 (Olive Grove)' },
  { hex: '#14B8A6', name: '青黛碧海 (Teal Cyan)' },
  { hex: '#0D9488', name: '深海碧青 (Deep Aqua)' },

  { hex: '#06B6D4', name: '天水苍青 (Cyan Azure)' },
  { hex: '#0EA5E9', name: '晴空湛蓝 (Sky Blue)' },
  { hex: '#3B82F6', name: '克莱因钴蓝 (Cobalt Blue)' },
  { hex: '#2563EB', name: '皇家蓝 (Royal Blue)' },
  { hex: '#1D4ED8', name: '深海群青 (Ultramarine)' },

  { hex: '#6366F1', name: '靛蓝夜幕 (Indigo Violet)' },
  { hex: '#4F46E5', name: '鸢尾深蓝 (Iris Purple)' },
  { hex: '#8B5CF6', name: '薰衣草紫 (Violet Amethyst)' },
  { hex: '#7C3AED', name: '幻影幽紫 (Deep Orchid)' },
  { hex: '#A855F7', name: '霓虹洋紫 (Electric Purple)' },

  { hex: '#D946EF', name: '荧光品红 (Magenta Pop)' },
  { hex: '#EC4899', name: '摩登蔷薇 (Rose Pink)' },
  { hex: '#DB2777', name: '热烈山茶 (Berry Rose)' },
  { hex: '#F43F5E', name: '西瓜红 (Watermelon)' },

  { hex: '#78350F', name: '浓缩摩卡 (Mocha Coffee)' },
  { hex: '#92400E', name: '暖褐原木 (Warm Chestnut)' },
  { hex: '#D97706', name: '落日赤陶 (Terracotta)' },
  { hex: '#D4D4D8', name: '雅灰石材 (Neutral Gray)' },
];

export function getClosestColorName(hex: string): string {
  const target = hexToRgb(hex);
  let minDistance = Infinity;
  let closestName = '定制色调';

  for (const item of COLOR_NAMES) {
    const ref = hexToRgb(item.hex);
    // Weighted Euclidean distance (human eye is more sensitive to green, then red, then blue)
    const dr = target.r - ref.r;
    const dg = target.g - ref.g;
    const db = target.b - ref.b;
    const dist = Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);

    if (dist < minDistance) {
      minDistance = dist;
      closestName = item.name;
    }
  }

  return closestName;
}

// Generate harmonious colors based on a base hue
export function generateHarmonyPalette(
  baseHex: string,
  mode: HarmonyMode,
  count: number = 5
): string[] {
  const baseRgb = hexToRgb(baseHex);
  const baseHsl = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);
  const colors: string[] = [];

  switch (mode) {
    case 'complementary': {
      // Base + Complementary (180 deg) + variations in lightness/saturation
      const compHue = (baseHsl.h + 180) % 360;
      colors.push(baseHex);
      colors.push(rgbToHex(...Object.values(hslToRgb(compHue, baseHsl.s, baseHsl.l)) as [number, number, number]));
      colors.push(rgbToHex(...Object.values(hslToRgb(baseHsl.h, Math.max(20, baseHsl.s - 25), Math.min(90, baseHsl.l + 30))) as [number, number, number]));
      colors.push(rgbToHex(...Object.values(hslToRgb(compHue, Math.max(20, baseHsl.s - 20), Math.max(15, baseHsl.l - 25))) as [number, number, number]));
      colors.push(rgbToHex(...Object.values(hslToRgb(baseHsl.h, Math.min(95, baseHsl.s + 10), Math.max(20, baseHsl.l - 20))) as [number, number, number]));
      break;
    }
    case 'analogous': {
      // Adjacent hues on the color wheel (e.g. -40, -20, 0, +20, +40)
      const step = 25;
      const start = -(Math.floor(count / 2) * step);
      for (let i = 0; i < count; i++) {
        const h = (baseHsl.h + start + i * step + 360) % 360;
        const l = clamp(baseHsl.l + (i % 2 === 0 ? -6 : 6), 25, 85);
        const rgb = hslToRgb(h, baseHsl.s, l);
        colors.push(rgbToHex(rgb.r, rgb.g, rgb.b));
      }
      break;
    }
    case 'triadic': {
      // 3 equidistant points on the color wheel (0, 120, 240)
      const h1 = baseHsl.h;
      const h2 = (baseHsl.h + 120) % 360;
      const h3 = (baseHsl.h + 240) % 360;
      colors.push(baseHex);
      colors.push(rgbToHex(...Object.values(hslToRgb(h2, baseHsl.s, baseHsl.l)) as [number, number, number]));
      colors.push(rgbToHex(...Object.values(hslToRgb(h3, baseHsl.s, baseHsl.l)) as [number, number, number]));
      colors.push(rgbToHex(...Object.values(hslToRgb(h1, Math.max(20, baseHsl.s - 30), 85)) as [number, number, number]));
      colors.push(rgbToHex(...Object.values(hslToRgb(h2, baseHsl.s, 22)) as [number, number, number]));
      break;
    }
    case 'tetradic': {
      // 4 points (rectangle/square: 0, 90, 180, 270)
      const hues = [0, 90, 180, 270].map((deg) => (baseHsl.h + deg) % 360);
      colors.push(baseHex);
      colors.push(rgbToHex(...Object.values(hslToRgb(hues[1], baseHsl.s, baseHsl.l)) as [number, number, number]));
      colors.push(rgbToHex(...Object.values(hslToRgb(hues[2], baseHsl.s, baseHsl.l)) as [number, number, number]));
      colors.push(rgbToHex(...Object.values(hslToRgb(hues[3], baseHsl.s, baseHsl.l)) as [number, number, number]));
      colors.push(rgbToHex(...Object.values(hslToRgb(baseHsl.h, 25, 92)) as [number, number, number]));
      break;
    }
    case 'monochromatic': {
      // Same hue, ranging from light pastel to rich dark shade
      const lSteps = [90, 75, 55, 38, 20];
      lSteps.forEach((lVal, idx) => {
        const sVal = idx === 0 ? Math.max(15, baseHsl.s - 35) : baseHsl.s;
        const rgb = hslToRgb(baseHsl.h, sVal, lVal);
        colors.push(rgbToHex(rgb.r, rgb.g, rgb.b));
      });
      break;
    }
    case 'split-complementary': {
      // Base + 150 deg + 210 deg
      const hSplit1 = (baseHsl.h + 150) % 360;
      const hSplit2 = (baseHsl.h + 210) % 360;
      colors.push(baseHex);
      colors.push(rgbToHex(...Object.values(hslToRgb(hSplit1, baseHsl.s, baseHsl.l)) as [number, number, number]));
      colors.push(rgbToHex(...Object.values(hslToRgb(hSplit2, baseHsl.s, baseHsl.l)) as [number, number, number]));
      colors.push(rgbToHex(...Object.values(hslToRgb(hSplit1, Math.max(20, baseHsl.s - 25), 88)) as [number, number, number]));
      colors.push(rgbToHex(...Object.values(hslToRgb(baseHsl.h, baseHsl.s, 22)) as [number, number, number]));
      break;
    }
    case 'random':
    default: {
      // Create a curated aesthetically pleasing designer random palette
      const randomHue = Math.floor(Math.random() * 360);
      const harmonyOffsets = [0, 30, 60, 180, 210];
      for (let i = 0; i < count; i++) {
        const offset = harmonyOffsets[i % harmonyOffsets.length] + Math.floor(Math.random() * 20 - 10);
        const h = (randomHue + offset + 360) % 360;
        const s = Math.floor(Math.random() * 45 + 45); // 45-90%
        const l = Math.floor(Math.random() * 55 + 25); // 25-80%
        const rgb = hslToRgb(h, s, l);
        colors.push(rgbToHex(rgb.r, rgb.g, rgb.b));
      }
      break;
    }
  }

  return colors.slice(0, count);
}

// Generate random pleasant color
export function getRandomPleasantHex(): string {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * 40 + 50); // 50-90%
  const l = Math.floor(Math.random() * 40 + 35); // 35-75%
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

// Create complete ColorItem from hex
export function createColorItem(hex: string, locked: boolean = false, percentage?: number): ColorItem {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const name = getClosestColorName(hex);
  return {
    id: 'c-' + Math.random().toString(36).substring(2, 9),
    hex: hex.toUpperCase(),
    rgb,
    hsl,
    locked,
    name,
    percentage,
  };
}

// Format export codes
export function generateExportCode(colors: ColorItem[], format: ExportFormat): string {
  switch (format) {
    case 'hex':
      return colors.map((c, i) => `${c.hex}  /* ${c.name} */`).join('\n');

    case 'css':
      return `:root {
  /* Designer Color Palette generated by ColorCraft */
${colors
  .map((c, i) => {
    const varName = i === 0 ? 'primary' : i === 1 ? 'secondary' : i === 2 ? 'accent' : `palette-${i + 1}`;
    return `  --color-${varName}: ${c.hex}; /* ${c.name} */`;
  })
  .join('\n')}
}`;

    case 'tailwind':
      return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        palette: {
${colors
  .map((c, i) => {
    const key = i === 0 ? 'primary' : i === 1 ? 'secondary' : i === 2 ? 'accent' : `${i + 1}`;
    return `          ${key}: '${c.hex}', // ${c.name}`;
  })
  .join('\n')}
        },
      },
    },
  },
};`;

    case 'scss':
      return `// SCSS Variables
${colors
  .map((c, i) => {
    const varName = i === 0 ? 'primary' : i === 1 ? 'secondary' : i === 2 ? 'accent' : `color-${i + 1}`;
    return `$${varName}: ${c.hex}; // ${c.name}`;
  })
  .join('\n')}`;

    case 'json':
      return JSON.stringify(
        {
          paletteName: 'Designer Palette',
          exportedAt: new Date().toISOString(),
          colors: colors.map((c, i) => ({
            index: i + 1,
            name: c.name,
            hex: c.hex,
            rgb: `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`,
            hsl: `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`,
          })),
        },
        null,
        2
      );
  }
}

// Generate SVG swatch card
export function generateSvgPalette(colors: ColorItem[], paletteName: string = 'Color Palette'): string {
  const swatchWidth = 100;
  const swatchHeight = 140;
  const totalWidth = colors.length * swatchWidth + 40;
  const totalHeight = swatchHeight + 80;

  const rects = colors
    .map((c, i) => {
      const x = 20 + i * swatchWidth;
      const textColor = getReadableTextColor(c.hex);
      return `
    <g transform="translate(${x}, 40)">
      <rect width="${swatchWidth - 4}" height="${swatchHeight}" rx="8" fill="${c.hex}" />
      <text x="10" y="${swatchHeight - 28}" fill="${textColor}" font-family="system-ui, sans-serif" font-weight="700" font-size="12">${c.hex}</text>
      <text x="10" y="${swatchHeight - 12}" fill="${textColor}" font-family="system-ui, sans-serif" font-size="10" opacity="0.85">${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}</text>
    </g>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
  <rect width="100%" height="100%" fill="#FAFAFA" rx="12" />
  <text x="20" y="26" fill="#18181B" font-family="system-ui, sans-serif" font-weight="600" font-size="14">${paletteName}</text>
  ${rects}
</svg>`;
}
