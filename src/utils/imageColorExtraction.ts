import { ExtractFilterMode, RgbColor } from '../types';
import { rgbToHex, rgbToHsl } from './colorMath';

interface ExtractedRawColor {
  r: number;
  g: number;
  b: number;
  hex: string;
  count: number;
  percentage: number;
}

// Extract dominant colors from an Image or Canvas using fast grid sampling & k-means clustering
export async function extractColorsFromImage(
  imageSource: HTMLImageElement,
  targetCount: number = 6,
  filterMode: ExtractFilterMode = 'balanced'
): Promise<ExtractedRawColor[]> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  // Downsample image for performance and clean clustering (e.g. max 140x140)
  const maxDim = 140;
  let width = imageSource.naturalWidth || imageSource.width || 300;
  let height = imageSource.naturalHeight || imageSource.height || 200;

  if (width > height) {
    if (width > maxDim) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    }
  } else {
    if (height > maxDim) {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(imageSource, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height).data;
  const pixels: RgbColor[] = [];
  const totalPixels = width * height;

  // Sample pixels, quantizing down slightly to bin similar colors
  for (let i = 0; i < imgData.length; i += 4) {
    const a = imgData[i + 3];
    if (a < 128) continue; // ignore transparent pixels

    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];

    const hsl = rgbToHsl(r, g, b);

    // Filter according to extraction mode if selected
    if (filterMode === 'vibrant') {
      if (hsl.s < 35 || hsl.l < 25 || hsl.l > 80) continue;
    } else if (filterMode === 'muted') {
      if (hsl.s > 45 || hsl.l < 30 || hsl.l > 85) continue;
    } else if (filterMode === 'deep') {
      if (hsl.l > 40) continue;
    } else if (filterMode === 'light') {
      if (hsl.l < 65) continue;
    }

    pixels.push({ r, g, b });
  }

  // Fallback if filter excluded too many pixels
  if (pixels.length < targetCount * 2) {
    pixels.length = 0;
    for (let i = 0; i < imgData.length; i += 4) {
      if (imgData[i + 3] >= 128) {
        pixels.push({ r: imgData[i], g: imgData[i + 1], b: imgData[i + 2] });
      }
    }
  }

  if (pixels.length === 0) return [];

  // Simple and fast K-Means algorithm
  const k = Math.min(targetCount, pixels.length);
  // Pick k initial centroids with good spread
  const centroids: RgbColor[] = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) {
    centroids.push({ ...pixels[i * step] });
  }

  const maxIterations = 10;
  const clusters: { sumR: number; sumG: number; sumB: number; count: number }[] = [];

  for (let iter = 0; iter < maxIterations; iter++) {
    clusters.length = 0;
    for (let i = 0; i < k; i++) {
      clusters.push({ sumR: 0, sumG: 0, sumB: 0, count: 0 });
    }

    // Assign pixels to closest centroid
    for (const p of pixels) {
      let minDist = Infinity;
      let closestIdx = 0;

      for (let c = 0; c < k; c++) {
        const dr = p.r - centroids[c].r;
        const dg = p.g - centroids[c].g;
        const db = p.b - centroids[c].b;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < minDist) {
          minDist = dist;
          closestIdx = c;
        }
      }

      clusters[closestIdx].sumR += p.r;
      clusters[closestIdx].sumG += p.g;
      clusters[closestIdx].sumB += p.b;
      clusters[closestIdx].count++;
    }

    // Update centroids
    let changed = false;
    for (let c = 0; c < k; c++) {
      if (clusters[c].count > 0) {
        const newR = Math.round(clusters[c].sumR / clusters[c].count);
        const newG = Math.round(clusters[c].sumG / clusters[c].count);
        const newB = Math.round(clusters[c].sumB / clusters[c].count);

        if (
          newR !== centroids[c].r ||
          newG !== centroids[c].g ||
          newB !== centroids[c].b
        ) {
          centroids[c] = { r: newR, g: newG, b: newB };
          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  // Calculate percentage and format result
  const rawResults: ExtractedRawColor[] = centroids.map((c, idx) => {
    const count = clusters[idx]?.count || 1;
    const percentage = Math.max(1, Math.round((count / pixels.length) * 100));
    return {
      r: c.r,
      g: c.g,
      b: c.b,
      hex: rgbToHex(c.r, c.g, c.b),
      count,
      percentage,
    };
  });

  // Sort by count descending so dominant colors come first
  rawResults.sort((a, b) => b.count - a.count);

  return rawResults;
}

// Sample exact pixel color from canvas at (x, y)
export function samplePixelColor(
  canvas: HTMLCanvasElement,
  x: number,
  y: number
): { hex: string; rgb: RgbColor } | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const canvasX = Math.floor((x - rect.left) * scaleX);
  const canvasY = Math.floor((y - rect.top) * scaleY);

  if (canvasX < 0 || canvasX >= canvas.width || canvasY < 0 || canvasY >= canvas.height) {
    return null;
  }

  try {
    const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    return {
      hex: rgbToHex(r, g, b),
      rgb: { r, g, b },
    };
  } catch {
    return null;
  }
}
