import JSZip from 'jszip';
import { StampConfig } from '../types';
import {
  drawNumberingMachineStamp,
  drawDemoEngineeringPage,
  drawDemoLandscapeTablePage,
  computeStampCoordinates,
} from './stampRenderer';

export interface BatchProgress {
  current: number;
  total: number;
  percent: number;
  statusText: string;
}

/**
 * 将单张带有打码机印迹的图纸渲染为 Blob (JPEG)
 */
export async function renderSingleStampedPage(
  pageNumber: string,
  config: StampConfig,
  baseImage: HTMLImageElement | null,
  demoOrientation: 'portrait' | 'landscape'
): Promise<Blob> {
  const canvas = document.createElement('canvas');

  if (baseImage) {
    canvas.width = baseImage.naturalWidth || baseImage.width || 1200;
    canvas.height = baseImage.naturalHeight || baseImage.height || 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2d context');

    // 绘制原始底图
    ctx.drawImage(baseImage, 0, 0);

    const isLandscape = canvas.width > canvas.height;
    const coords = computeStampCoordinates(pageNumber, config, canvas.width, canvas.height);

    drawNumberingMachineStamp(
      ctx,
      pageNumber,
      coords.x,
      coords.y,
      config,
      canvas.width,
      canvas.height,
      `batch-${pageNumber}`,
      isLandscape,
      coords.textAlign
    );
  } else {
    // 官方演示样本
    if (demoOrientation === 'landscape') {
      drawDemoLandscapeTablePage(canvas, pageNumber, config, pageNumber);
    } else {
      drawDemoEngineeringPage(canvas, pageNumber, config);
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Failed to convert page ${pageNumber} to blob`));
      },
      'image/jpeg',
      0.95
    );
  });
}

/**
 * 批量加盖并生成 ZIP 压缩包下载
 */
export async function generateAndDownloadStampedZip({
  startPage,
  endPage,
  config,
  baseImageSrc,
  demoOrientation,
  multipleFiles,
  onProgress,
}: {
  startPage: number;
  endPage: number;
  config: StampConfig;
  baseImageSrc: string | null;
  demoOrientation: 'portrait' | 'landscape';
  multipleFiles?: File[];
  onProgress?: (progress: BatchProgress) => void;
}): Promise<void> {
  const zip = new JSZip();

  // 如果有底图图片URL，先预加载为 Image 对象
  let baseImg: HTMLImageElement | null = null;
  if (baseImageSrc) {
    baseImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('无法加载底图'));
      img.src = baseImageSrc;
    });
  }

  const totalPages = Math.max(1, endPage - startPage + 1);
  const padLength = endPage >= 1000 ? 4 : endPage >= 100 ? 3 : 2;

  // 如果用户提供了多张文件（多图批量加盖）
  if (multipleFiles && multipleFiles.length > 0) {
    const fileCount = multipleFiles.length;
    for (let i = 0; i < fileCount; i++) {
      const pageNum = startPage + i;
      const file = multipleFiles[i];

      onProgress?.({
        current: i + 1,
        total: fileCount,
        percent: Math.round(((i + 0.5) / fileCount) * 80),
        statusText: `正在为文件 ${file.name} 加盖第 ${pageNum} 页...`,
      });

      // 加载该单图
      const fileImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`无法加载图片 ${file.name}`));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error(`无法读取文件 ${file.name}`));
        reader.readAsDataURL(file);
      });

      const blob = await renderSingleStampedPage(
        String(pageNum),
        config,
        fileImg,
        demoOrientation
      );

      const baseNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const paddedNum = String(pageNum).padStart(padLength, '0');
      zip.file(`${paddedNum}_${baseNameWithoutExt}_已加盖.jpg`, blob);
    }
  } else {
    // 单图或模板连续加盖范围
    for (let i = 0; i < totalPages; i++) {
      const currentNum = startPage + i;
      const pageStr = String(currentNum);

      onProgress?.({
        current: i + 1,
        total: totalPages,
        percent: Math.round(((i + 0.5) / totalPages) * 80),
        statusText: `正在加盖第 ${currentNum} 页 (${i + 1}/${totalPages})...`,
      });

      const blob = await renderSingleStampedPage(
        pageStr,
        config,
        baseImg,
        demoOrientation
      );

      const padded = String(currentNum).padStart(padLength, '0');
      zip.file(`工程图纸_页码${padded}.jpg`, blob);
    }
  }

  onProgress?.({
    current: totalPages,
    total: totalPages,
    percent: 85,
    statusText: '正在压缩打包为 ZIP 文件...',
  });

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.({
        current: totalPages,
        total: totalPages,
        percent: Math.round(85 + (metadata.percent * 0.15)),
        statusText: `正在打包 ZIP (${Math.round(metadata.percent)}%)...`,
      });
    }
  );

  onProgress?.({
    current: totalPages,
    total: totalPages,
    percent: 100,
    statusText: '打包完成，正在启动下载...',
  });

  // 触发浏览器下载
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `工程图纸_批量加盖_第${startPage}至${endPage}页.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
