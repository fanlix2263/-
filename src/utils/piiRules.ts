import { PiiDetectionResult, MaskingMode, CustomRegexRule } from '../types';

/**
 * 校验中华人民共和国二代居民身份证 (18位)
 * 符合 GB 11643-1999 标准及 ISO 7064:1983.MOD 11-2 校验位算法
 */
export function validateChineseIdCard(id: string): { isValid: boolean; message: string; birthDate?: string } {
  if (!/^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(id)) {
    return { isValid: false, message: '基本格式或年月日不合规' };
  }

  const birthYear = parseInt(id.substring(6, 10), 10);
  const birthMonth = parseInt(id.substring(10, 12), 10);
  const birthDay = parseInt(id.substring(12, 14), 10);
  const birth = new Date(birthYear, birthMonth - 1, birthDay);

  if (
    birth.getFullYear() !== birthYear ||
    birth.getMonth() + 1 !== birthMonth ||
    birth.getDate() !== birthDay ||
    birth > new Date() ||
    birthYear < 1900
  ) {
    return { isValid: false, message: '出生日期不存在或超范围' };
  }

  // 加权因子
  const weight = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  // 校验码映射
  const checkCodeMap = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(id[i], 10) * weight[i];
  }
  const mod = sum % 11;
  const expectedCheck = checkCodeMap[mod];
  const actualCheck = id[17].toUpperCase();

  if (expectedCheck !== actualCheck) {
    return {
      isValid: false,
      message: `校验位错误(末位应为${expectedCheck}，实际为${actualCheck})，可能是随机伪造号或订单号`,
      birthDate: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`
    };
  }

  return {
    isValid: true,
    message: '国标校验通过(符合MOD 11-2算法)',
    birthDate: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`
  };
}

/**
 * 校验银行卡号 (Luhn 模10算法)
 */
export function validateBankCard(cardNumber: string): { isValid: boolean; message: string } {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) {
    return { isValid: false, message: '卡号长度必须在16-19位' };
  }

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  const isValid = sum % 10 === 0;
  return {
    isValid,
    message: isValid ? 'Luhn算法校验通过' : 'Luhn校验失败(可能为序列号/发票编号)'
  };
}

/**
 * 简易哈希计算
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).substring(0, 8);
}

/**
 * 中文PII识别与多模式掩码处理引擎（支持内置国标规则 + 自定义扩展正则）
 */
export function analyzeAndDesensitizeText(
  text: string,
  mode: MaskingMode = 'placeholder',
  customRules: CustomRegexRule[] = []
): { sanitizedText: string; results: PiiDetectionResult[]; stats: Record<string, number> } {
  const results: PiiDetectionResult[] = [];
  const stats: Record<string, number> = {};

  // 1. 中文身份证号: 使用负向后瞻与前瞻避免匹配长数字串（订单号/条码）
  const idRegex = /(?<!\d)[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx](?!\d)/g;
  let match: RegExpExecArray | null;
  while ((match = idRegex.exec(text)) !== null) {
    const val = match[0];
    const validation = validateChineseIdCard(val);
    results.push({
      entityType: 'CN_ID',
      label: '身份证号',
      originalText: val,
      replacedText: '',
      startIndex: match.index,
      endIndex: match.index + val.length,
      confidence: validation.isValid ? 0.99 : 0.65,
      validationStatus: validation.isValid ? 'valid' : 'warning',
      validationMessage: validation.message
    });
  }

  // 2. 中国手机号: 11位，13x-19x，支持包含 Excel 浮点 .0 情况
  const phoneRegex = /(?<!\d)(?:(?:\+86\s*|86\s*|0)?1[3-9]\d{9}(?:\.0)?)(?!\d)/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    const val = match[0];
    // 排除已被包含在身份证中的情况
    const alreadyMatched = results.some(
      r => r.startIndex <= match!.index && r.endIndex >= match!.index + val.length
    );
    if (!alreadyMatched) {
      results.push({
        entityType: 'CN_PHONE',
        label: '手机号',
        originalText: val,
        replacedText: '',
        startIndex: match.index,
        endIndex: match.index + val.length,
        confidence: 0.92,
        validationStatus: 'valid',
        validationMessage: val.endsWith('.0') ? '检测到Excel浮点数尾缀(.0)，已自动修正适配' : '中国大陆11位手机号'
      });
    }
  }

  // 3. 银行卡号: 16-19位纯数字（前后无其他数字）
  const bankRegex = /(?<!\d)\d{16,19}(?!\d)/g;
  while ((match = bankRegex.exec(text)) !== null) {
    const val = match[0];
    const alreadyMatched = results.some(
      r => (match!.index >= r.startIndex && match!.index < r.endIndex) ||
           (match!.index + val.length > r.startIndex && match!.index + val.length <= r.endIndex)
    );
    if (!alreadyMatched) {
      const bankVal = validateBankCard(val);
      results.push({
        entityType: 'CN_BANK_CARD',
        label: '银行卡号',
        originalText: val,
        replacedText: '',
        startIndex: match.index,
        endIndex: match.index + val.length,
        confidence: bankVal.isValid ? 0.95 : 0.70,
        validationStatus: bankVal.isValid ? 'valid' : 'warning',
        validationMessage: bankVal.message
      });
    }
  }

  // 4. 统一社会信用代码 (USCC - 18位)
  const usccRegex = /(?<![0-9A-Z])[1-9ANY][1-9]\d{6}[0-9A-HJ-NP-RT-UW-Y]{10}(?![0-9A-Z])/g;
  while ((match = usccRegex.exec(text)) !== null) {
    const val = match[0];
    const alreadyMatched = results.some(
      r => match!.index >= r.startIndex && match!.index < r.endIndex
    );
    if (!alreadyMatched) {
      results.push({
        entityType: 'CN_USCC',
        label: '统一社会信用代码',
        originalText: val,
        replacedText: '',
        startIndex: match.index,
        endIndex: match.index + val.length,
        confidence: 0.88,
        validationStatus: 'valid',
        validationMessage: '企业法人代码规范'
      });
    }
  }

  // 5. 电子邮箱
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  while ((match = emailRegex.exec(text)) !== null) {
    const val = match[0];
    results.push({
      entityType: 'EMAIL_ADDRESS',
      label: '电子邮箱',
      originalText: val,
      replacedText: '',
      startIndex: match.index,
      endIndex: match.index + val.length,
      confidence: 0.95,
      validationStatus: 'valid',
      validationMessage: '标准电子邮箱格式'
    });
  }

  // 6. 中文人名 (针对中国合同与业务表单中的引导词与2-4字中文名)
  const nameContextRegex = /(?:法定代表人|授权代表|经办人|联系人|签署人|员工姓名|姓名|借款人|出借人|原告|被告|投保人|被保险人|收件人|开户人)[：:\s]{1,4}([\u4e00-\u9fa5]{2,4})(?=[，,。\s\n\r、；;])/g;
  while ((match = nameContextRegex.exec(text)) !== null) {
    const val = match[1];
    const start = match.index + match[0].indexOf(val);
    const alreadyMatched = results.some(
      r => start >= r.startIndex && start < r.endIndex
    );
    if (!alreadyMatched && !['甲方', '乙方', '丙方', '公司', '部门', '单位'].includes(val)) {
      results.push({
        entityType: 'CN_NAME',
        label: '中文姓名',
        originalText: val,
        replacedText: '',
        startIndex: start,
        endIndex: start + val.length,
        confidence: 0.89,
        validationStatus: 'valid',
        validationMessage: '基于合同上下文引导词精确捕获'
      });
    }
  }

  // 7. 详细住址识别 (省/市/区/路/号/栋/室)
  const addressRegex = /([\u4e00-\u9fa5]{2,6}(?:省|自治区|直辖市|市))?([\u4e00-\u9fa5]{2,6}(?:市|区|县|街道|镇))([\u4e00-\u9fa50-9A-Za-z-]{2,20}(?:路|街|道|巷|弄|号|栋|幢|单元|室))/g;
  while ((match = addressRegex.exec(text)) !== null) {
    const val = match[0];
    if (val.length >= 8) {
      results.push({
        entityType: 'CN_ADDRESS',
        label: '中国地址',
        originalText: val,
        replacedText: '',
        startIndex: match.index,
        endIndex: match.index + val.length,
        confidence: 0.84,
        validationStatus: 'valid',
        validationMessage: '包含行政区划与门牌详情的敏感地址'
      });
    }
  }

  // 8. 用户自定义正则识别规则 (如项目代号 PRJ-xxx, 敏感合同编号 CT-xxx, 内部工号等)
  if (customRules && customRules.length > 0) {
    for (const rule of customRules) {
      if (!rule.enabled || !rule.pattern.trim()) continue;
      try {
        let flags = rule.flags || 'g';
        if (!flags.includes('g')) flags += 'g';
        const userRegex = new RegExp(rule.pattern, flags);
        let userMatch: RegExpExecArray | null;
        while ((userMatch = userRegex.exec(text)) !== null) {
          const val = userMatch[0];
          if (!val) break; // 避免零长匹配陷入死循环
          const start = userMatch.index;
          const end = start + val.length;
          const alreadyMatched = results.some(
            r => (start >= r.startIndex && start < r.endIndex) ||
                 (end > r.startIndex && end <= r.endIndex) ||
                 (start <= r.startIndex && end >= r.endIndex)
          );
          if (!alreadyMatched) {
            results.push({
              entityType: rule.entityType.toUpperCase().replace(/\s+/g, '_') || 'CUSTOM_PII',
              label: rule.name || '自定义敏感项',
              originalText: val,
              replacedText: '',
              startIndex: start,
              endIndex: end,
              confidence: rule.score || 0.90,
              validationStatus: 'valid',
              validationMessage: `命中自定义规则: ${rule.name}`
            });
          }
        }
      } catch (err) {
        // 捕获可能的用户正则语法异常
        console.warn(`自定义正则解析跳过: ${rule.pattern}`, err);
      }
    }
  }

  // 按出现先后排序
  results.sort((a, b) => a.startIndex - b.startIndex);

  // 计数器用于生成 <CN_PHONE_1>, <CN_PHONE_2> 等
  const entityCounters: Record<string, number> = {};

  // 执行脱敏替换
  let lastIndex = 0;
  let sanitized = '';

  for (const item of results) {
    entityCounters[item.entityType] = (entityCounters[item.entityType] || 0) + 1;
    const indexNum = entityCounters[item.entityType];

    let replacement = '';
    switch (mode) {
      case 'placeholder':
        replacement = `<${item.entityType}_${indexNum}>`;
        break;
      case 'mask':
        if (item.entityType === 'CN_PHONE') {
          replacement = item.originalText.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
        } else if (item.entityType === 'CN_ID') {
          replacement = item.originalText.replace(/(\d{6})\d{8}(\w{4})/, '$1********$2');
        } else if (item.entityType === 'CN_BANK_CARD') {
          replacement = item.originalText.replace(/^(\d{4})\d+(\d{4})$/, '$1 **** **** $2');
        } else if (item.entityType === 'CN_NAME') {
          replacement = item.originalText[0] + '*'.repeat(item.originalText.length - 1);
        } else if (item.entityType === 'EMAIL_ADDRESS') {
          replacement = item.originalText.replace(/^(.)(.*)(@.*)$/, '$1***$3');
        } else {
          // 自定义规则或通用规则：保留首尾，中间掩码
          if (item.originalText.length > 4) {
            const keepStart = Math.min(2, Math.floor(item.originalText.length / 3));
            const keepEnd = Math.min(2, Math.floor(item.originalText.length / 3));
            const maskedLen = item.originalText.length - keepStart - keepEnd;
            replacement = item.originalText.substring(0, keepStart) + '*'.repeat(maskedLen) + item.originalText.substring(item.originalText.length - keepEnd);
          } else {
            replacement = '*'.repeat(item.originalText.length);
          }
        }
        break;
      case 'hash':
        replacement = `[HASH:${simpleHash(item.originalText)}]`;
        break;
      case 'synthetic':
        if (item.entityType === 'CN_PHONE') replacement = `1380000${String(indexNum).padStart(4, '0')}`;
        else if (item.entityType === 'CN_ID') replacement = `1101011990010100${String(indexNum).padStart(2, '0')}`;
        else if (item.entityType === 'CN_NAME') replacement = `[测试用户${indexNum}]`;
        else replacement = `[虚拟_${item.label}_${indexNum}]`;
        break;
    }

    item.replacedText = replacement;
    stats[item.label] = (stats[item.label] || 0) + 1;

    // 拼接字符串
    sanitized += text.substring(lastIndex, item.startIndex);
    sanitized += replacement;
    lastIndex = item.endIndex;
  }
  sanitized += text.substring(lastIndex);

  return {
    sanitizedText: sanitized,
    results,
    stats
  };
}
