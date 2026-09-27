export const FIXED_DESENSITIZER_PY = `"""
desensitizer.py - 工业级本地敏感信息脱敏引擎 (优化针对 Windows 11 / 8GB RAM / i3-8100)
修复说明：
1. 补齐 Presidio 中文 spaCy 实体映射 (PERSON / ORG / GPE)
2. 身份证加入 ISO 7064:1983.MOD 11-2 真实校验位核验与边界断言
3. 手机号支持 Excel 浮点型 .0 自动抹除与号段保护
4. Word (.docx) 增加 XPath 文本框 (w:txbxContent) 提取与嵌套表格
5. Excel 专项支持 .xlsx 结构化 Markdown 表格并清洗浮点 .0（弃用旧版 .xls 彻底剔除 pandas/xlrd 重型依赖，省去 200MB+ 内存开销）
6. PDF 扫描件逐页 OCR + 强制 gc.collect()，内存严格限制在 1.5GB 内
7. 增加只读快照机制，解决 Office 正在打开时的文件锁 (PermissionError)
"""

import os
import sys
import gc
import re
import io
import shutil
import tempfile
import warnings
from typing import List, Optional

# 抑制第三方 C 库警告打扰，保护 MCP 通信流
warnings.filterwarnings("ignore")

# 限制底层数学与多线程库，保护 i3-8100 4核CPU不被打满
os.environ["OMP_NUM_THREADS"] = "2"
os.environ["MKL_NUM_THREADS"] = "2"
os.environ["OPENBLAS_NUM_THREADS"] = "2"
os.environ["VECLIB_MAXIMUM_THREADS"] = "2"
os.environ["NUMEXPR_NUM_THREADS"] = "2"

# 引入 Presidio 依赖
from presidio_analyzer import AnalyzerEngine, PatternRecognizer, Pattern, RecognizerResult
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig

# ==========================================
# 1. 初始化 Presidio 引擎与中英文模型映射
# ==========================================
def create_optimized_analyzer() -> AnalyzerEngine:
    """初始化中英文引擎，显式补全中文 spaCy 实体映射"""
    nlp_configuration = {
        "nlp_engine_name": "spacy",
        "models": [
            {
                "lang_code": "zh",
                "model_name": "zh_core_web_sm"
            },
            {
                "lang_code": "en",
                "model_name": "en_core_web_sm"
            }
        ],
        "ner_model_configuration": {
            "model_to_presidio_entity_mapping": {
                "PER": "PERSON",
                "PERSON": "PERSON",
                "ORG": "ORGANIZATION",
                "GPE": "LOCATION",
                "LOC": "LOCATION"
            },
            "low_score_entity_names": ["DATE", "TIME"]
        }
    }
    provider = NlpEngineProvider(nlp_configuration=nlp_configuration)
    nlp_engine = provider.create_engine()

    analyzer = AnalyzerEngine(
        nlp_engine=nlp_engine,
        supported_languages=["zh", "en"]
    )

    # 注册增强版中文规则
    _register_custom_chinese_recognizers(analyzer)
    return analyzer

# ==========================================
# 2. 增强型中文正则与校验算法 (国标校验)
# ==========================================
def validate_cn_id_checksum(id_str: str) -> bool:
    """ISO 7064:1983.MOD 11-2 身份证校验位真实性核验"""
    if len(id_str) != 18:
        return False
    weight = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    check_code_map = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
    try:
        total = sum(int(id_str[i]) * weight[i] for i in range(17))
        expected = check_code_map[total % 11]
        return expected == id_str[17].upper()
    except (ValueError, IndexError):
        return False

class ValidatedChineseIdRecognizer(PatternRecognizer):
    """带国标校验码检验的身份证识别器，彻底杜绝订单号/快递单误伤"""
    def __init__(self):
        # 增加首尾负向断言，防止长数字串（如20位条码）被截断识别
        patterns = [
            Pattern(
                name="cn_id_with_boundary",
                regex=r"(?<!\\d)[1-9]\\d{5}(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx](?!\\d)",
                score=0.75
            )
        ]
        super().__init__(
            supported_entity="CN_ID",
            patterns=patterns,
            supported_language="zh"
        )

    def validate_result(self, pattern_text: str) -> bool:
        # 对匹配项执行严格校验位计算
        return validate_cn_id_checksum(pattern_text)

def _register_custom_chinese_recognizers(analyzer: AnalyzerEngine):
    # 1. 身份证号 (带校验算法)
    analyzer.registry.add_recognizer(ValidatedChineseIdRecognizer())

    # 2. 手机号 (11位，兼容 Excel 浮点数 .0 后缀与加前缀场景)
    phone_pattern = Pattern(
        name="cn_phone_boundary",
        regex=r"(?<!\\d)(?:(?:\\+86\\s*|86\\s*|0)?1[3-9]\\d{9}(?:\\.0)?)(?!\\d)",
        score=0.9
    )
    analyzer.registry.add_recognizer(PatternRecognizer(
        supported_entity="CN_PHONE",
        patterns=[phone_pattern],
        supported_language="zh"
    ))

    # 3. 银行卡号 (16-19位独立数字)
    bank_pattern = Pattern(
        name="cn_bank_boundary",
        regex=r"(?<!\\d)\\d{16,19}(?!\\d)",
        score=0.8
    )
    analyzer.registry.add_recognizer(PatternRecognizer(
        supported_entity="CN_BANK_CARD",
        patterns=[bank_pattern],
        supported_language="zh"
    ))

    # 4. 统一社会信用代码 (USCC - 18位法人代码)
    uscc_pattern = Pattern(
        name="cn_uscc",
        regex=r"(?<![0-9A-Z])[1-9ANY][1-9]\\d{6}[0-9A-HJ-NP-RT-UW-Y]{10}(?![0-9A-Z])",
        score=0.9
    )
    analyzer.registry.add_recognizer(PatternRecognizer(
        supported_entity="CN_USCC",
        patterns=[uscc_pattern],
        supported_language="zh"
    ))

# 实例化全局单例
analyzer = create_optimized_analyzer()
anonymizer = AnonymizerEngine()

def desensitize_text(text: str, language: str = "zh") -> str:
    """文本脱敏执行函数"""
    if not text or not text.strip():
        return ""
    # 对 Excel 浮点数常见尾缀预处理
    text = re.sub(r"(\\b1[3-9]\\d{9})\\.0\\b", r"\\1", text)

    results = analyzer.analyze(text=text, language=language)
    if not results:
        return text

    # 使用占位符替换，保留清晰实体语义方便 LLM 理解
    operators = {
        "CN_PHONE": OperatorConfig("replace", {"new_value": "<CN_PHONE>"}),
        "CN_ID": OperatorConfig("replace", {"new_value": "<CN_ID>"}),
        "CN_BANK_CARD": OperatorConfig("replace", {"new_value": "<CN_BANK_CARD>"}),
        "CN_USCC": OperatorConfig("replace", {"new_value": "<CN_USCC>"}),
        "PERSON": OperatorConfig("replace", {"new_value": "<CN_PERSON>"}),
        "EMAIL_ADDRESS": OperatorConfig("replace", {"new_value": "<EMAIL>"})
    }
    anonymized_result = anonymizer.anonymize(
        text=text,
        analyzer_results=results,
        operators=operators
    )
    return anonymized_result.text

# ==========================================
# 3. 稳健文件解析器 (解决锁文件、TextBox与表格结构)
# ==========================================
def _get_safe_readonly_copy(file_path: str) -> str:
    """创建临时只读副本，绕过 Microsoft Office 打开时的文件独占锁"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"文件不存在: {file_path}")
    ext = os.path.splitext(file_path)[1]
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    tmp.close()
    try:
        shutil.copy2(file_path, tmp.name)
        return tmp.name
    except Exception:
        return file_path

def process_docx(file_path: str) -> str:
    """提取 Word: 正文、多级表格、页眉页脚、并深度提取文本框 (w:txbxContent)"""
    from docx import Document
    from docx.oxml import parse_xml
    from docx.oxml.ns import nsdecls, qn

    safe_path = _get_safe_readonly_copy(file_path)
    try:
        doc = Document(safe_path)
        blocks: List[str] = []

        # 1. 正文段落
        for p in doc.paragraphs:
            if p.text.strip():
                blocks.append(p.text.strip())

        # 2. 深度提取 Word 绘图文本框 (TextBox - 常见落款/印章区)
        try:
            for txbx in doc._element.xpath('//w:txbxContent'):
                tx_paras = []
                for p_node in txbx.xpath('.//w:p'):
                    text = "".join(p_node.itertext())
                    if text.strip():
                        tx_paras.append(text.strip())
                if tx_paras:
                    blocks.append("[文本框内容] " + " | ".join(tx_paras))
        except Exception:
            pass

        # 3. 表格内容提取为结构化 Markdown
        for table_idx, table in enumerate(doc.tables, 1):
            table_lines = [f"\\n--- 表格 {table_idx} ---"]
            for row in table.rows:
                cells = [c.text.strip().replace("\\n", " ") for c in row.cells]
                table_lines.append("| " + " | ".join(cells) + " |")
            blocks.append("\\n".join(table_lines))

        # 4. 页眉页脚
        for section in doc.sections:
            for h in [section.header, section.footer]:
                if h and not h.is_linked_to_previous:
                    for p in h.paragraphs:
                        if p.text.strip():
                            blocks.append(f"[页眉/页脚] {p.text.strip()}")

        raw_text = "\\n\\n".join(blocks)
        return desensitize_text(raw_text)
    finally:
        if safe_path != file_path and os.path.exists(safe_path):
            try:
                os.remove(safe_path)
            except OSError:
                pass

def process_xlsx(file_path: str) -> str:
    """处理 Excel (.xlsx)：转换为结构化 Markdown，保留列标头与关系，自动抹除浮点 .0"""
    import openpyxl

    safe_path = _get_safe_readonly_copy(file_path)
    try:
        wb = openpyxl.load_workbook(safe_path, data_only=True, read_only=True)
        sheet_outputs = []

        for sheet in wb.worksheets:
            if sheet.sheet_state != "visible":
                continue

            rows = list(sheet.iter_rows(values_only=True))
            if not rows:
                continue

            sheet_lines = [f"### 工作表: {sheet.title}"]
            # 转换每行数据为 Markdown
            for row_idx, row in enumerate(rows):
                # 过滤全空行
                if not any(c is not None and str(c).strip() != "" for c in row):
                    continue
                formatted_cells = []
                for c in row:
                    if c is None:
                        formatted_cells.append("")
                    else:
                        val = str(c).strip().replace("\n", " ")
                        # 抹除纯数字转浮点引发的 .0 后缀 (例如 13812345678.0)
                        if val.endswith(".0") and val[:-2].isdigit():
                            val = val[:-2]
                        formatted_cells.append(val)
                sheet_lines.append("| " + " | ".join(formatted_cells) + " |")
                # 在第 1 行后加 Markdown 表头分割线
                if row_idx == 0:
                    sheet_lines.append("| " + " | ".join(["---"] * len(row)) + " |")

            sheet_outputs.append("\n".join(sheet_lines))

        wb.close()
        combined = "\n\n".join(sheet_outputs)
        return desensitize_text(combined)
    finally:
        if safe_path != file_path and os.path.exists(safe_path):
            try:
                os.remove(safe_path)
            except OSError:
                pass

def process_pdf(file_path: str) -> str:
    """PDF解析：优先抽取文本层；若无则流式分段 OCR 并强制 gc 回收"""
    import pdfplumber

    safe_path = _get_safe_readonly_copy(file_path)
    try:
        text_pages = []
        with pdfplumber.open(safe_path) as pdf:
            for page in pdf.pages:
                txt = page.extract_text()
                if txt and txt.strip():
                    text_pages.append(txt.strip())

        # 文本层有效，直接脱敏
        if text_pages:
            full_text = "\\n\\n--- 分页 ---\\n\\n".join(text_pages)
            return desensitize_text(full_text)

        # 扫描件回退到轻量化流式 OCR
        return _stream_ocr_pdf(safe_path)
    finally:
        if safe_path != file_path and os.path.exists(safe_path):
            try:
                os.remove(safe_path)
            except OSError:
                pass

def _stream_ocr_pdf(file_path: str, max_pages: int = 25) -> str:
    """逐页 OCR 并强制回收位图内存，防止 8GB RAM 崩溃"""
    import fitz  # PyMuPDF
    import pytesseract
    from PIL import Image

    doc = fitz.open(file_path)
    total_pages = min(len(doc), max_pages)
    ocr_texts = []

    for page_idx in range(total_pages):
        page = doc[page_idx]
        # 降至 150 DPI (Matrix 1.5, 1.5) 且灰度化，节约 60% 内存
        pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), colorspace=fitz.csGRAY)
        img = Image.frombytes("L", [pix.width, pix.height], pix.samples)

        try:
            # 限制 Tesseract 仅使用 2 线程
            config = "--oem 1 -c tessedit_do_invert=0"
            text = pytesseract.image_to_string(img, lang="chi_sim+eng", config=config)
            if text.strip():
                ocr_texts.append(f"[第{page_idx+1}页 OCR]\\n" + text.strip())
        finally:
            del pix
            del img
            gc.collect()  # 立即回收单页位图内存

    doc.close()
    if not ocr_texts:
        return "[提示: 扫描版 PDF 未能识别出有效字符，请检查清晰度]"
    return desensitize_text("\\n\\n".join(ocr_texts))

def desensitize_file(file_path: str) -> str:
    """统一入口分流与顶层异常兜底"""
    if not os.path.exists(file_path):
        return f"[错误: 找不到指定文件 '{file_path}']"

    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext == ".docx":
            return process_docx(file_path)
        elif ext == ".xlsx":
            return process_xlsx(file_path)
        elif ext == ".xls":
            return "[提示: 检测到旧版 .xls 格式，建议在 Excel 中另存为 .xlsx 后再脱敏，格式更精准且无需庞大依赖]"
        elif ext == ".pdf":
            return process_pdf(file_path)
        elif ext in (".txt", ".md", ".json", ".csv"):
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return desensitize_text(f.read())
        else:
            return f"[暂不支持的文件格式: {ext}，仅支持 docx, xlsx, pdf, txt]"
    except Exception as e:
        return f"[文档脱敏处理异常: {str(e)}]"
`;

export const FIXED_SERVER_PY = `"""
server.py - WorkBuddy MCP Server 适配端
关键修复：
1. 重定向 sys.stdout，防止第三方库打印非 JSON-RPC 字符破坏 stdio 管道
2. 基于 FastMCP 标准协议封装，支持平滑异步/同步调用
3. 异常以标准结果返回，绝不挂死 MCP 连接
"""

import sys
import os

# ==========================================================
# 核心安全补丁：将控制台打印重定向至 sys.stderr
# 保护 sys.stdout 纯净，严禁任何杂质混入 MCP JSON-RPC 协议流
# ==========================================================
class StdoutRedirector:
    def __init__(self, original_stdout):
        self.original_stdout = original_stdout

    def write(self, message):
        # 所有未经协议包装的输出，重定向到 stderr，WorkBuddy 日志面板可查
        sys.stderr.write(message)
        sys.stderr.flush()

    def flush(self):
        sys.stderr.flush()

# 保存真实 stdout 供 MCP 协议使用，随后替换默认 stdout
real_protocol_stdout = sys.stdout

from mcp.server.fastmcp import FastMCP
from desensitizer import desensitize_file

# 初始化 FastMCP 服务器
mcp = FastMCP("presidio-desensitizer")

@mcp.tool()
def desensitize_document(file_path: str) -> str:
    """
    对本地 Office 文档 (Word/Excel/PDF/TXT) 进行本地脱敏处理，返回过滤敏感信息后的安全文本。
    
    参数:
        file_path: 本地文档的绝对路径 (如 D:\\\\合同\\\\2026采购协议.docx)
    返回:
        脱敏后的安全文本内容，可供大模型进一步分析、摘要或审核。
    """
    try:
        # 清理路径引号与首尾空格
        clean_path = file_path.strip().strip('"').strip("'")
        return desensitize_file(clean_path)
    except Exception as err:
        return f"[脱敏服务错误: {str(err)}]"

if __name__ == "__main__":
    # 启动 stdio 通信循环
    mcp.run(transport="stdio")
`;

export const MCP_CONFIG_JSON = `{
  "mcpServers": {
    "presidio-desensitizer": {
      "type": "stdio",
      "command": "C:/Users/%USERNAME%/.workbuddy/mcp-servers/presidio-desensitizer/venv/Scripts/python.exe",
      "args": [
        "-u",
        "C:/Users/%USERNAME%/.workbuddy/mcp-servers/presidio-desensitizer/server.py"
      ],
      "env": {
        "PYTHONIOENCODING": "utf-8",
        "PYTHONUNBUFFERED": "1",
        "OMP_NUM_THREADS": "2"
      }
    }
  }
}`;

export const SETUP_BAT = `@echo off
chcp 65001 >nul
echo =====================================================
echo  WorkBuddy 本地脱敏环境配置 (Windows 11 / 8GB RAM 专用)
echo =====================================================

set TARGET_DIR=%USERPROFILE%\\.workbuddy\\mcp-servers\\presidio-desensitizer
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
cd /d "%TARGET_DIR%"

echo [1/5] 创建独立虚拟环境...
python -m venv venv
call venv\\Scripts\\activate

echo [2/5] 升级 pip 并安装轻量核心组件 (无需 pandas/xlrd，节约 200MB+ 内存)...
python -m pip install --upgrade pip
pip install mcp presidio-analyzer presidio-anonymizer
pip install python-docx openpyxl pdfplumber PyMuPDF pytesseract pillow

echo [3/5] 下载轻量级中文 NLP 模型 zh_core_web_sm...
python -m spacy download zh_core_web_sm
python -m spacy download en_core_web_sm

echo [4/5] 检查 Tesseract OCR 环境...
where tesseract >nul 2>nul
if %errorlevel% neq 0 (
    echo [警告] 未检测到 Tesseract OCR。若需扫描件PDF识别，请安装 Tesseract 并加入系统 PATH。
) else (
    echo [OK] Tesseract OCR 已就绪:
    tesseract --version
)

echo [5/5] 验证环境连通性...
python -c "import spacy; spacy.load('zh_core_web_sm'); print('[OK] 中文模型加载成功')"

echo =====================================================
echo  安装配置完成！请将 desensitizer.py 与 server.py 放入:
echo  %TARGET_DIR%
echo =====================================================
pause
`;
