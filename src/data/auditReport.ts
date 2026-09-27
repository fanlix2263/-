import { AuditIssue } from '../types';

export interface AuditCategory {
  title: string;
  score: number;
  status: 'pass' | 'warning' | 'fail';
  description: string;
}

export const AUDIT_CATEGORIES: AuditCategory[] = [
  {
    title: 'MCP 协议与通信稳定性',
    score: 45,
    status: 'fail',
    description: 'stdio 管道未做日志与输出流物理隔离；第三方库（fitz/tesseract/spacy）在 Windows 平台打印控制台信息会直接击穿 JSON-RPC 通信，致 WorkBuddy 静默超时断连。'
  },
  {
    title: '8GB RAM & i3-8100 硬件适配',
    score: 55,
    status: 'warning',
    description: 'Win11 基准系统 (3.8GB) + WorkBuddy Electron (1.8GB) 仅留约 2.4GB 可用。fitz 逐页生成 300DPI 图像 + tesseract 外部进程并发未分页回收，面临高危 OOM。'
  },
  {
    title: '文档解析与结构完整性',
    score: 50,
    status: 'fail',
    description: 'Excel 直接打平为一维列表丢弃行列对应关系；Word 漏掉 TextBox 签名框；Office 正在打开时的文件独占锁未做临时备份容错。'
  },
  {
    title: '中文 PII 识别精度与误报率',
    score: 60,
    status: 'warning',
    description: '身份证号未校验 ISO 7064 校验位导致订单/序列号严重误伤；手机号未兼容 Excel 浮点 .0 且缺乏前后数字断言边界；Presidio 对中文分词映射需显式适配。'
  },
  {
    title: '本地隐私与安全边界隔离',
    score: 90,
    status: 'pass',
    description: '方案在架构理念上正确：仅通过本地工具暴露 desensitize_document，将脱敏后文本传回 LLM，原始敏感文件留在本地物理磁盘，符合零信任隐私规范。'
  }
];

export const CRITICAL_AUDIT_ISSUES: AuditIssue[] = [
  {
    id: 'ISSUE-01',
    severity: 'critical',
    title: 'MCP stdio 管道污染：任何 print/warning 将导致 WorkBuddy 永久断连',
    location: 'server.py & desensitizer.py 根作用域',
    originalCodeSnippet: `from mcp.server import Server, stdio
from desensitizer import desensitize_file
app = Server("presidio-desensitizer")

@app.tool()
def desensitize_document(file_path: str) -> str:
    return desensitize_file(file_path)

if __name__ == "__main__":
    stdio.run(app)`,
    issueAnalysis:
      'MCP stdio 传输机制使用标准输出 stdout 进行严格的 JSON-RPC 协议消息收发。而在 Windows 环境下，python-docx、fitz (PyMuPDF)、pytesseract、spacy 在导入或遇到非标准字体、损坏流时，底层 C++ 库会自动向 stdout 打印警告与进度信息（例如 libpng warning, font missing）。只要有一字节非 JSON 内容混入 stdout，WorkBuddy 的 MCP 客户端解析器就会立即抛出 JSONRPCParseError 并彻底断开连接。此外，FastMCP 是目前 mcp 库官方推荐且具备更好异步与异常封装的方式。',
    consequence: 'WorkBuddy 界面报 "Server disconnected" 或 "Failed to parse tool response"，导致工具完全不可用。',
    fixedSolution:
      '必须在 Python 入口强制重定向 sys.stdout 为 stderr（或仅让 MCP 消息接管专用通信流），所有日志与三方库输出统一路由到 sys.stderr；使用 FastMCP 封装，并加入顶层 try-except 确保任何文件读取异常都以标准字符串返回而非挂起进程。',
    tags: ['MCP协议', 'stdio污染', 'JSON-RPC断连']
  },
  {
    id: 'ISSUE-02',
    severity: 'critical',
    title: 'Excel 表格降维打击：打平为一维文本致 LLM 丧失行列表头理解能力',
    location: 'desensitizer.py -> process_xlsx()',
    originalCodeSnippet: `for sheet in wb.worksheets:
    for row in sheet.iter_rows(values_only=True):
        for cell in row:
            if cell is not None:
                all_text.append(str(cell))
return desensitize_text("\\n".join(all_text))`,
    issueAnalysis:
      '原方案将 Excel 单元格逐个串成单一字符串数组。举例：表头是 [姓名, 身份证, 工资]，第二行是 [张三, 110101..., 15000]，打平后变成 "姓名\\n身份证\\n工资\\n张三\\n110101...\\n15000"。WorkBuddy 的 LLM 在拿到这份脱敏文本后，根本无法知道某行数据属于哪个字段！另外，openpyxl 默认读取纯数值手机号为 float 类型（如 13812345678.0）或者日期对象 datetime(2023, 1, 1, 0, 0)，原正则 r"1[3-9]\\d{9}" 会直接漏检带 .0 的手机号。',
    consequence: 'LLM 收到混乱的一维乱序字符串无法执行总结或提取；带小数点的手机号完全漏脱敏，造成隐私泄露。',
    fixedSolution:
      '改用结构化 Markdown 表格形式保留 Sheet 名称、列标头与行坐标（如 | 姓名 | 手机 | ... |）；在读取单元格时自动将科学计数法与浮点数后缀（如 13800000000.0）转换为整数字符串。',
    tags: ['Excel结构丢失', '浮点数漏检', 'Markdown保留']
  },
  {
    id: 'ISSUE-03',
    severity: 'critical',
    title: 'Word 关键敏感区域盲区：完全遗漏文本框 (TextBox) 与嵌套表格',
    location: 'desensitizer.py -> process_docx()',
    originalCodeSnippet: `doc = Document(file_path)
parts = [p.text for p in doc.paragraphs]
for table in doc.tables:
    for row in table.rows:
        for cell in row.cells:
            parts.append(cell.text)
# 页眉页脚...`,
    issueAnalysis:
      '在中国式企业合同、财务凭证、公文模板中，落款签名、骑缝章、公章说明以及法定代表人信息，经常被放置在“文本框”（Word Drawing / Shape TextBox，对应底层 XML: w:txbxContent）中。python-docx 的 doc.paragraphs 和 doc.tables 原生 API 根本不遍历文本框内容！此外，表格内嵌套的子表格也不会被顶层 doc.tables 捕获。',
    consequence: '合同落款文本框中的法人身份证、银行账号、私人联系方式全数漏检，直接传给外部。',
    fixedSolution:
      '通过 XPath 深度解析 doc._element 的 //w:txbxContent//w:p 节点，递归提取所有文本框中的段落与文字；同时递归处理嵌套表格。',
    tags: ['Word漏洞', 'TextBox漏检', '合同签名区']
  },
  {
    id: 'ISSUE-04',
    severity: 'high',
    title: '8GB 内存峰值风暴：PDF 扫描件多页 OCR 缺乏流式回收触发 OOM',
    location: 'desensitizer.py -> _ocr_pdf()',
    originalCodeSnippet: `doc = fitz.open(file_path)
all_text = []
for page_num in range(len(doc)):
    page = doc[page_num]
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    text = pytesseract.image_to_string(img, lang="chi_sim+eng")
    if text.strip():
        all_text.append(text)`,
    issueAnalysis:
      '用户硬件为 i3-8100 (4核4线程) + 8GB RAM。Win11 闲置占用 3.8GB，WorkBuddy 占用约 1.8GB，可用内存仅剩约 2.4GB。在 PyMuPDF 中，Matrix(2, 2) 将 A4 页面渲染为约 2480x3508 像素的无压缩位图（每页 ~35MB）。在循环中未显式释放 pix 对象和 img 对象，Python 的引用计数与垃圾回收延迟会导致内存急剧堆积。此外，pytesseract 每次调用启动外部 tesseract.exe（多线程 LSTM 引擎），若同时处理 20 页以上扫描版 PDF，物理内存直接打满触发 Windows 虚拟内存疯狂分页交换（Thrashing），电脑极度卡顿甚至崩溃。',
    consequence: '扫描版 PDF 稍微超过 10-20 页，系统极易假死，WorkBuddy MCP 客户端超时报错。',
    fixedSolution:
      '1. 逐页处理，单页处理完毕后立即 del pix, img 并显式触发 gc.collect()；\\n2. 对图片做单通道灰度降采样转码；\\n3. 限制 Tesseract 单进程线程数为 2 (OMP_THREAD_LIMIT=2)，避免打死 i3-8100 四核。',
    tags: ['8GB内存雪崩', 'OOM卡死', 'GC垃圾回收', 'Tesseract优化']
  },
  {
    id: 'ISSUE-05',
    severity: 'high',
    title: '身份证号伪正则：无国标 ISO 7064 校验位算法导致严重误伤与漏报',
    location: 'desensitizer.py -> id_recognizer',
    originalCodeSnippet: `patterns=[Pattern(name="cn_id", regex=r"[1-9]\\d{5}(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]", score=0.9)]`,
    issueAnalysis:
      '1. 正则首尾没有边界断言：如果在一段长数字中（例如 20 位快递单号、19 位银行交易流水号、条形码），该正则会把中间切片出的 18 位数字错误当成身份证脱敏，破坏正常业务数据。\\n2. 缺少 GB 11643-1999 规定的 ISO 7064:1983.MOD 11-2 校验位算法。中国二代身份证最后一位是前面 17 位的加权模 11 校验码。缺乏校验算法时，任意伪造的 18 位数字都会被高置信度识别；而在严格合规场景下，无法区分真实身份证与虚构编号。',
    consequence: '订单号、快递单号被大面积误伤脱敏成 <CN_ID_x>，导致 LLM 理解失真；而带前后符号的号码又容易漏检。',
    fixedSolution:
      '增加前后断言 (?<!\\d) 与 (?!\\d)；在 Presidio 中继承 CustomRecognizer 或使用 validator 函数执行 MOD 11-2 真实校验位核验。',
    tags: ['ISO 7064', '校验位算法', '边界断言', '误报率控制']
  },
  {
    id: 'ISSUE-06',
    severity: 'medium',
    title: 'Windows 文件独占锁冲突：用户在 Office 中打开文件时直接抛 PermissionError',
    location: 'desensitizer.py -> 各 process_* 函数',
    originalCodeSnippet: `doc = Document(file_path)
wb = load_workbook(file_path, data_only=True)
doc = fitz.open(file_path)`,
    issueAnalysis:
      '在真实工作流中，用户通常正在使用 Microsoft Word 或 Excel 查阅文档，然后让 WorkBuddy“帮我总结打开的这份合同”。在 Windows 操作系统中，Office 软件打开文件时会加底层读写共享锁（并在同目录生成 ~$合同.docx 临时文件）。Python 试图以独占或普通读方式打开时，极易直接爆出 [Errno 13] Permission denied，导致脱敏失败。',
    consequence: '用户正在编辑或查看的文件无法脱敏，必须手动关闭 Office 软件才能调用。',
    fixedSolution:
      '编写只读安全拷贝函数 safe_read_bytes：先尝试只读打开，若遇到 PermissionError 则自动通过 Windows API 或带共享标志的临时副本（tempfile）进行安全快照读取。',
    tags: ['Windows文件锁', 'PermissionError', 'Office冲突']
  },
  {
    id: 'ISSUE-07',
    severity: 'medium',
    title: 'Presidio 中文 NLP 引擎与实体映射配置缺漏',
    location: 'desensitizer.py -> 3.1 初始化配置',
    originalCodeSnippet: `configuration = {
    "nlp_engine_name": "spacy",
    "models": [
        {"lang_code": "zh", "model_name": "zh_core_web_sm"},
        {"lang_code": "en", "model_name": "en_core_web_sm"}
    ]
}`,
    issueAnalysis:
      'Presidio 的 SpaCyNlpEngine 默认只定义了英文实体的 mapping（例如 PERSON -> PERSON, ORG -> ORGANIZATION）。当载入 zh_core_web_sm 时，spaCy 吐出的中文标注集如果未在 Presidio 的 ner_strength_node / entity_mapping 中注册，Presidio 会直接丢弃 spaCy 识别出的人名、地名与机构名，导致人名识别形同虚设！',
    consequence: '虽然安装并加载了 80MB 的中文模型，但实际上只有正则识别器在工作，人名识别率几乎为 0。',
    fixedSolution:
      '必须在 configuration 中补齐 ner_model_configuration 以及针对 "zh" 的 label_to_pii 实体映射表，将 PERSON、ORG、GPE 明确绑定到 Presidio 实体类别。',
    tags: ['Presidio配置', 'spaCy实体映射', '中文NER修复']
  }
];

export const HARDWARE_BENCHMARK = {
  cpu: 'Intel Core i3-8100 (4 Cores / 4 Threads @ 3.60GHz)',
  ramTotal: '8.0 GB DDR4',
  os: 'Windows 11 64-bit',
  memoryBreakdown: [
    { name: 'Windows 11 系统核心与驱动', sizeGB: 3.6, color: '#64748b' },
    { name: 'WorkBuddy 客户端 (Electron)', sizeGB: 1.5, color: '#3b82f6' },
    { name: 'Chrome/Edge 浏览器与日常驻留', sizeGB: 1.2, color: '#f59e0b' },
    { name: '系统预留安全缓冲区', sizeGB: 0.5, color: '#06b6d4' },
    { name: '可用物理内存上限 (给脱敏引擎)', sizeGB: 1.2, color: '#10b981' }
  ]
};
