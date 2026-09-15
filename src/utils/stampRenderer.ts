import { StampConfig } from '../types';

/**
 * 伪随机生成器（基于字符串种子，确保同一页面的抖动固定可复现）
 */
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function () {
    h = Math.imul(h ^ (h >>> 15), 2246822519) | 0;
    h = (h ^ (h >>> 13)) | 0;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * 判断页码是否为双号 (偶数)
 */
export function isPageEven(rawText: string | number): boolean {
  const match = String(rawText).match(/\d+/g);
  if (!match || match.length === 0) return false;
  const lastNumStr = match[match.length - 1];
  const lastDigit = parseInt(lastNumStr.slice(-1), 10);
  return lastDigit % 2 === 0;
}

/**
 * 计算页码在页面中的实际坐标及文字对齐方式
 * 规则 1: 单号在右下角，双号在左下角 (odd-right-even-left)
 * 规则 2: 所有的页码都在右下角 (all-bottom-right)
 */
export function computeStampCoordinates(
  rawText: string | number,
  config: StampConfig,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; textAlign: CanvasTextAlign; isLeft: boolean } {
  const even = isPageEven(rawText);
  const isLeft = config.positionMode === 'odd-right-even-left' && even;

  const y = canvasHeight - canvasHeight * (config.bottomMarginPercent / 100);

  if (isLeft) {
    // 双号在左下角：以左边距为基准，向右排布
    const x = canvasWidth * (config.leftMarginPercent / 100);
    return { x, y, textAlign: 'left', isLeft: true };
  } else {
    // 单号（或全部右下角模式）：以右边距为基准，向左排布
    const x = canvasWidth - canvasWidth * (config.rightMarginPercent / 100);
    return { x, y, textAlign: 'right', isLeft: false };
  }
}

/**
 * 绘制高保真机械手动打码机页码
 * @param isLandscape 页面是否为横向
 * @param alignOverride 覆盖文字对齐方式 ('left' 或 'right')
 */
export function drawNumberingMachineStamp(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  targetX: number,
  targetY: number,
  config: StampConfig,
  _canvasWidth: number,
  canvasHeight: number,
  seedKey: string = 'stamp-seed',
  isLandscape: boolean = false,
  alignOverride?: CanvasTextAlign
) {
  const rng = seededRandom(seedKey);

  // 处理补零 / 自动消零 (Drop Cipher)
  let text = String(rawText);
  if (config.digitPadLength > 0 && /^\d+$/.test(text)) {
    text = text.padStart(config.digitPadLength, '0');
  }

  // 1. 计算字号像素高度
  // A4 标准物理尺寸：210mm × 297mm
  // 竖向时高度为 297mm，横向时高度为 210mm
  const physicalHeightMm = isLandscape ? 210 : 297;
  const calculatedPixelSize = (config.fontSizeMm / physicalHeightMm) * canvasHeight;
  const fontSize = Math.max(16, Math.round(calculatedPixelSize));

  // 2. 手工打码轻微抖动仿真 (位置微小偏移与微小角度倾斜)
  let posX = targetX;
  let posY = targetY;
  let angleDeg = config.rotation;

  if (config.stampJitter) {
    // 位置偏移在 -1.5mm ~ +1.5mm 之间浮动
    const jitterFactor = (3 / physicalHeightMm) * canvasHeight;
    const jitterX = (rng() - 0.5) * jitterFactor;
    const jitterY = (rng() - 0.5) * jitterFactor;
    // 角度偏移在 -0.7度 ~ +0.7度 之间
    const jitterAngle = (rng() - 0.5) * 1.4;

    posX += jitterX;
    posY += jitterY;
    angleDeg += jitterAngle;
  }

  const angleRad = (angleDeg * Math.PI) / 180;

  ctx.save();
  ctx.translate(posX, posY);
  ctx.rotate(angleRad);

  // 3. 字体设置：采用具有饱满脚衬线与旗衬线的罗马衬线体 (Bodoni / Playfair / Times)
  ctx.font = `${config.fontWeight} ${fontSize}px "${config.fontFamily}", "Bodoni Moda", "Playfair Display", "Times New Roman", "Times", serif`;
  
  // 确定对齐方式：若未传参，根据位置模式和单双号自动判断
  const finalAlign: CanvasTextAlign =
    alignOverride ||
    (config.positionMode === 'odd-right-even-left' && isPageEven(rawText) ? 'left' : 'right');
  ctx.textAlign = finalAlign;
  ctx.textBaseline = 'alphabetic';

  // 4. 油墨印压仿真渲染 (多层渲染模拟印油下压渗入纸张效果)
  const baseColor = config.inkColor;

  // 第一层：极微弱的油墨边缘微晕/渗墨 (Ink Feathering & Bleed)
  if (config.inkBleed > 0) {
    ctx.save();
    ctx.filter = `blur(${Math.max(0.6, fontSize * 0.02 * config.inkBleed)}px)`;
    ctx.fillStyle = baseColor;
    ctx.globalAlpha = 0.25 * config.inkBleed;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  // 第二层：油墨主压印层 (饱满清晰，略带高饱和黑)
  ctx.save();
  ctx.fillStyle = baseColor;
  ctx.globalAlpha = Math.min(1.0, 0.92 * config.inkPressure);
  ctx.fillText(text, 0, 0);
  ctx.restore();

  // 第三层：机械金属字轮边缘加压强化（字轮下压时边缘微重、中干锐利）
  ctx.save();
  ctx.lineWidth = Math.max(0.5, fontSize * 0.012);
  ctx.strokeStyle = baseColor;
  ctx.globalAlpha = 0.45 * config.inkPressure;
  ctx.strokeText(text, 0, 0);
  ctx.restore();

  // 5. 仿真机械打码机的金属字轮附带杂质与定位小黑点
  if (config.showMachineArtifacts) {
    ctx.save();
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;

    const hasSpeck = rng() > 0.4;
    if (hasSpeck) {
      // 如果文字右对齐，小点在左侧；若左对齐，小点在右侧
      const speckX =
        finalAlign === 'left'
          ? textWidth + (rng() * 12 + 6)
          : -textWidth - (rng() * 12 + 6);
      const speckY = (rng() - 0.5) * fontSize * 0.4;
      const speckRadius = Math.max(0.8, fontSize * 0.015 * (rng() * 0.8 + 0.5));

      ctx.fillStyle = baseColor;
      ctx.globalAlpha = 0.35 + rng() * 0.35;
      ctx.beginPath();
      ctx.arc(speckX, speckY, speckRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 绘制用户上传的示范工程文档页面 (竖向：广西融安水库工程监理平行检测方案 第5页内容)
 */
export function drawDemoEngineeringPage(
  canvas: HTMLCanvasElement,
  stampedNumber: string = '25',
  config: StampConfig
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = 1240;
  const h = 1754; // A4 竖向
  canvas.width = w;
  canvas.height = h;

  // 纸张底色
  ctx.fillStyle = '#fdfdfd';
  ctx.fillRect(0, 0, w, h);

  // 顶部眉线与页眉文字
  const marginX = 140;
  ctx.fillStyle = '#1e293b';
  ctx.font = '16px "STSong", "Songti SC", "SimSun", serif';
  ctx.textAlign = 'center';
  ctx.fillText('广西融安县泗维河中型水库除险加固工程监理平行检测方案', w / 2, 88);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(marginX, 102);
  ctx.lineTo(w - marginX, 102);
  ctx.stroke();

  // 章节主标题: 5、主要检测内容
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px "STHeiti", "SimHei", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('5、主要检测内容', marginX, 150);

  // 正文内容
  ctx.font = '20px/1.8 "STFangsong", "FangSong", "SimSun", serif';
  ctx.fillStyle = '#1e293b';

  const paragraphs = [
    '    根据业主、监理单位提供的部分设计图纸及技术要求，原材料、中间产',
    '品及现场检测检验主要有：水泥、细骨料、粗骨料、土工常规检测、块石、',
    '雷诺护垫、钢筋、止水铜片、膨润土、混凝土试块、砂浆试块、压实度、充',
    '填灌浆、帷幕灌浆、金属结构类检测等。初步统计检测内容见表 5-1《原材料、',
    '中间产品及现场检测主要检验项目和数量检测方案表》。'
  ];

  let lineY = 205;
  for (const line of paragraphs) {
    ctx.fillText(line, marginX, lineY);
    lineY += 46;
  }

  // 底部页脚分隔线
  const footerLineY = h - 120;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(marginX, footerLineY);
  ctx.lineTo(w - marginX, footerLineY);
  ctx.stroke();

  // 底部正中央印刷页码 "5"
  ctx.font = '17px "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#334155';
  ctx.fillText('5', w / 2, footerLineY + 28);

  // 加盖打码机页码 (支持：单号右下角/双号左下角，或全部右下角)
  if (stampedNumber) {
    const coords = computeStampCoordinates(stampedNumber, config, w, h);

    drawNumberingMachineStamp(
      ctx,
      stampedNumber,
      coords.x,
      coords.y,
      config,
      w,
      h,
      `portrait-${stampedNumber}`,
      false,
      coords.textAlign
    );
  }
}

/**
 * 绘制用户最新上传的示范工程横向表格页面 (横向：表5-1 原材料、中间产品及现场检测方案表，对应页码 8~14)
 */
export function drawDemoLandscapeTablePage(
  canvas: HTMLCanvasElement,
  stampedNumber: string = '14',
  config: StampConfig,
  centerPrintedPage: string = '12'
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = 1754; // A4 横向宽
  const h = 1240; // A4 横向高
  canvas.width = w;
  canvas.height = h;

  // 1. 纸张底色
  ctx.fillStyle = '#fdfdfd';
  ctx.fillRect(0, 0, w, h);

  // 2. 表格主标题
  const marginX = 110;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px "STSong", "Songti SC", "SimSun", serif';
  ctx.textAlign = 'center';
  ctx.fillText('表 5-1 原材料、中间产品及现场检测主要检验项目和数量检测方案表', w / 2, 115);

  // 3. 绘制表格框架
  const tableTop = 140;
  const tableBottom = h - 140;
  const tableLeft = marginX;
  const tableRight = w - marginX;
  const tableWidth = tableRight - tableLeft;

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.4;

  // 表格大外框
  ctx.strokeRect(tableLeft, tableTop, tableWidth, tableBottom - tableTop);

  // 表头分割线
  const headerHeight = 65;
  ctx.beginPath();
  ctx.moveTo(tableLeft, tableTop + headerHeight);
  ctx.lineTo(tableRight, tableTop + headerHeight);
  ctx.stroke();

  // 列定义与宽度分配
  const cols = [
    { title: '序号', width: 80 },
    { title: '检测部位', width: 180 },
    { title: '计量单位', width: 90 },
    { title: '工程量', width: 110 },
    { title: '检测内容', width: 260 },
    { title: '检测频率', width: 480 },
    { title: '单位', width: 80 },
    { title: '计划检测数量', width: 110 },
    { title: '备注', width: tableWidth - (80 + 180 + 90 + 110 + 260 + 480 + 80 + 110) },
  ];

  let curX = tableLeft;
  ctx.lineWidth = 1.0;
  ctx.font = 'bold 15px "SimSun", "Songti SC", serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1e293b';

  cols.forEach((col, idx) => {
    // 绘制表头文字
    ctx.fillText(col.title, curX + col.width / 2, tableTop + 38);
    curX += col.width;

    // 绘制列分割竖线
    if (idx < cols.length - 1) {
      ctx.beginPath();
      ctx.moveTo(curX, tableTop);
      ctx.lineTo(curX, tableBottom);
      ctx.stroke();
    }
  });

  // 绘制几行示意数据
  const rowCount = 7;
  const rowHeight = (tableBottom - (tableTop + headerHeight)) / rowCount;
  for (let r = 1; r < rowCount; r++) {
    const rowY = tableTop + headerHeight + r * rowHeight;
    ctx.beginPath();
    ctx.moveTo(tableLeft, rowY);
    ctx.lineTo(tableRight, rowY);
    ctx.stroke();
  }

  // 示意行文字
  ctx.font = '14px "SimSun", serif';
  ctx.textAlign = 'center';
  const sampleRows = [
    { no: '4.3', part: '溢洪道工作闸门', unit: '座', qty: '5', item: '钢板厚度', freq: '现场随机抽检 2 座', planUnit: '点', planQty: '10' },
    { no: '4.4', part: '溢洪道检修闸门', unit: '座', qty: '1', item: '焊缝内部质量检测', freq: '现场随机抽检', planUnit: 'm', planQty: '10' },
    { no: '4.5', part: '溢洪道检修闸门', unit: '座', qty: '1', item: '涂层厚度检测', freq: '现场随机抽检', planUnit: '点', planQty: '5' },
    { no: '4.6', part: '溢洪道检修闸门', unit: '座', qty: '1', item: '钢板厚度', freq: '现场随机抽检', planUnit: '点', planQty: '5' },
  ];

  sampleRows.forEach((row, idx) => {
    const centerY = tableTop + headerHeight + idx * rowHeight + rowHeight / 2 + 5;
    let cellX = tableLeft;
    ctx.fillText(row.no, cellX + cols[0].width / 2, centerY);
    cellX += cols[0].width;
    ctx.fillText(row.part, cellX + cols[1].width / 2, centerY);
    cellX += cols[1].width;
    ctx.fillText(row.unit, cellX + cols[2].width / 2, centerY);
    cellX += cols[2].width;
    ctx.fillText(row.qty, cellX + cols[3].width / 2, centerY);
    cellX += cols[3].width;
    ctx.fillText(row.item, cellX + cols[4].width / 2, centerY);
    cellX += cols[4].width;
    ctx.fillText(row.freq, cellX + cols[5].width / 2, centerY);
    cellX += cols[5].width;
    ctx.fillText(row.planUnit, cellX + cols[6].width / 2, centerY);
    cellX += cols[6].width;
    ctx.fillText(row.planQty, cellX + cols[7].width / 2, centerY);
  });

  // 表格底部附注
  ctx.textAlign = 'left';
  ctx.font = '14px "SimSun", serif';
  ctx.fillText('注：1、检验批不足检验批批量数时，按一个检验批进行检验。', tableLeft, tableBottom + 26);
  ctx.fillText('    2、此表为初步方案表，按施工过程中实际发生的工作内容按规范要求进行送检。', tableLeft, tableBottom + 50);

  // 底部页码印刷线与中央原排版页码（如 "12"）
  const footerLineY = h - 60;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(marginX, footerLineY);
  ctx.lineTo(w - marginX, footerLineY);
  ctx.stroke();

  ctx.font = '16px "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText(centerPrintedPage, w / 2, footerLineY + 24);

  // 加盖机械打码机页码 (支持：单号右下角/双号左下角，或全部右下角)
  if (stampedNumber) {
    const coords = computeStampCoordinates(stampedNumber, config, w, h);

    drawNumberingMachineStamp(
      ctx,
      stampedNumber,
      coords.x,
      coords.y,
      config,
      w,
      h,
      `landscape-${stampedNumber}`,
      true,
      coords.textAlign
    );
  }
}
