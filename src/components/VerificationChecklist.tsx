import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Copy, Check, Terminal, ShieldCheck, AlertCircle, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  command?: string;
  expectedOutput: string;
  tip?: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'check-tesseract',
    category: '环境与 OCR',
    title: 'Tesseract OCR Windows 命令行就绪',
    description: '确认已安装 Tesseract-OCR (包含 chi_sim 中文语言包) 且已添加至系统 PATH 环境变量。',
    command: 'tesseract --version',
    expectedOutput: '输出版本号为 5.2.0 或以上，且无 "command not found" 报错。',
    tip: '若报错，请检查 C:\\Program Files\\Tesseract-OCR 是否已加入用户或系统 PATH。'
  },
  {
    id: 'check-spacy-zh',
    category: 'NLP 模型',
    title: 'spaCy 中文模型 zh_core_web_sm 加载无报错',
    description: '确认在虚拟环境中成功下载并能够成功导入轻量级中文 NLP 模型。',
    command: 'python -c "import spacy; nlp = spacy.load(\'zh_core_web_sm\'); print(\'加载成功\')"',
    expectedOutput: '控制台直接输出 "加载成功"，无缺少模型或权限异常。',
    tip: '若提示找不到模型，请执行: python -m spacy download zh_core_web_sm'
  },
  {
    id: 'check-pii-text',
    category: '脱敏规则',
    title: '基础中文脱敏测试 (手机号 + 国标身份证 + 银行卡)',
    description: '对一段包含中文手机号、真实合法身份证号的测试文本调用 desensitize_text，确认敏感信息被替换为语义占位符。',
    command: 'python -c "from desensitizer import desensitize_text; print(desensitize_text(\'联系人张建国，手机13812345678，身份证110101198503072379\'))"',
    expectedOutput: '敏感文本被安全替换为: 联系人<CN_PERSON>，手机<CN_PHONE>，身份证<CN_ID>',
    tip: '检查占位符是否保留语义，方便大模型后续推理。'
  },
  {
    id: 'check-excel-xlsx',
    category: '文档解析',
    title: 'Excel (.xlsx) Markdown 结构化与浮点清洗',
    description: '测试包含数值手机号（openpyxl 默认带 .0）的 Excel 文档，确认表头被转换为 Markdown 且未发生 .0 漏检。',
    command: 'python -c "from desensitizer import desensitize_file; print(desensitize_file(\'test.xlsx\')[:300])"',
    expectedOutput: '输出带有 ### 工作表 与 | 标头 | 分隔线的 Markdown 表格，手机号无 .0 尾缀且被正确脱敏。',
    tip: '无需安装 pandas 与 xlrd，纯 openpyxl 解析更轻更快。'
  },
  {
    id: 'check-word-textbox',
    category: '文档解析',
    title: 'Word (.docx) 文本框 (w:txbxContent) 提取',
    description: '测试落款签署人放在浮动绘图文本框中的 Word 文档，确认 XPath 能够成功捕获文本框内容。',
    command: 'python -c "from desensitizer import process_docx; print(process_docx(\'test_contract.docx\'))"',
    expectedOutput: '包含 "[文本框落款区域] 授权签署人：<CN_PERSON>..." 字样，证明落款敏感信息未被遗漏。'
  },
  {
    id: 'check-pdf-ocr',
    category: 'OCR 回退',
    title: '无文本层扫描版 PDF 触发 150DPI 流式 OCR 回退',
    description: '对一份纯图片扫描版 PDF 调用脱敏函数，确认自动切入单页 OCR 流程且能解析出脱敏文本。',
    command: 'python -c "from desensitizer import process_pdf; print(process_pdf(\'scan_sample.pdf\')[:200])"',
    expectedOutput: '控制台打印出提取并脱敏后的单据文本，无 [OCR 未能提取到文本] 错误。'
  },
  {
    id: 'check-memory-limit',
    category: '内存安全',
    title: '8GB 内存峰值管控 (处理10页以上文档内存 ≤ 1.2GB)',
    description: '打开 Windows 任务管理器，在连续脱敏多页 Word 或扫描 PDF 时，观察 python.exe 进程的物理内存占用。',
    expectedOutput: '单页处理后位图被即时回收，Python 进程内存峰值稳定在 300MB ~ 800MB 之间，远低于 4GB 危险线。',
    tip: '单页即时 gc.collect() 保证了内存不会随页数线性泄漏。'
  },
  {
    id: 'check-workbuddy-mcp',
    category: 'WorkBuddy 联调',
    title: 'WorkBuddy 连接器管理中 presidio-desensitizer 状态为绿色',
    description: '在 ~/.workbuddy/mcp.json 中添加服务配置后重启 WorkBuddy，确认连接器列表中显示连接就绪。',
    expectedOutput: 'WorkBuddy 工具箱中出现 desensitize_document 工具，指示灯显示为绿色 (Connected)。',
    tip: '若显示红灯或断开，请检查 server.py 中 stdout 是否已隔离，并查看 stderr 日志。'
  },
  {
    id: 'check-e2e-prompt',
    category: '端到端测试',
    title: 'WorkBuddy 零泄露指令实测调用',
    description: '在 WorkBuddy 聊天框输入纯文本本地路径指令，测试工具是否被成功调度并返回脱敏总结。',
    expectedOutput: 'WorkBuddy 自动调用 desensitize_document，成功总结文档内容，且正文中的姓名、身份证、电话已被占位符替代。',
    tip: '严禁直接将原文件拖入输入框，必须以纯文本路径向大模型发送指令。'
  }
];

const STORAGE_KEY = 'workbuddy_desensitizer_checklist_state';

export const VerificationChecklist: React.FC = () => {
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedState));
    } catch {
      // ignore
    }
  }, [checkedState]);

  const toggleCheck = (id: string) => {
    setCheckedState(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyCommand = (command: string, id: string) => {
    navigator.clipboard.writeText(command);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkAll = () => {
    const allChecked: Record<string, boolean> = {};
    CHECKLIST_ITEMS.forEach(item => {
      allChecked[item.id] = true;
    });
    setCheckedState(allChecked);
  };

  const handleReset = () => {
    setCheckedState({});
  };

  const completedCount = CHECKLIST_ITEMS.filter(i => checkedState[i.id]).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const categories = ['all', ...Array.from(new Set(CHECKLIST_ITEMS.map(i => i.category)))];

  const filteredItems = filterCategory === 'all'
    ? CHECKLIST_ITEMS
    : CHECKLIST_ITEMS.filter(i => i.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* 头部面板与进度卡 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>方案第七部分: 逐项实测验收</span>
              <span aria-hidden="true">·</span>
              <span>Windows 11 / 8GB RAM 硬件基线</span>
              <span aria-hidden="true">·</span>
              <span>状态本地自动保存</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              本地脱敏环境部署与验收验证清单 (Verification Checklist)
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              严格按照方案第七章及优化标准建立的自测核验清单。点击每一项可在控制台执行对应测试指令，并勾选完成状态，确保各组件在 8GB 内存环境下稳定投产。
            </p>
          </div>

          {/* 进度计数与快捷操作 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shrink-0 min-w-[260px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">整体部署验收进度</span>
              <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                {completedCount} / {totalCount} ({progressPercent}%)
              </span>
            </div>

            {/* 进度条 */}
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                onClick={handleMarkAll}
                className="text-slate-400 hover:text-emerald-400 transition-colors"
              >
                全部勾选
              </button>
              <button
                onClick={handleReset}
                className="text-slate-400 hover:text-rose-400 transition-colors"
              >
                重置清单
              </button>
            </div>
          </div>
        </div>

        {/* 分类过滤器 (Segmented Control) */}
        <div className="mt-6 pt-4 border-t border-slate-800/70 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 mr-2">分类筛选:</span>
          {categories.map(cat => {
            const isSelected = filterCategory === cat;
            const count = cat === 'all'
              ? CHECKLIST_ITEMS.length
              : CHECKLIST_ITEMS.filter(i => i.category === cat).length;
            const completed = cat === 'all'
              ? completedCount
              : CHECKLIST_ITEMS.filter(i => i.category === cat && checkedState[i.id]).length;

            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  isSelected
                    ? 'bg-slate-800 text-emerald-400 font-medium border border-emerald-500/40'
                    : 'bg-slate-950 border border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{cat === 'all' ? '全部项目' : cat}</span>
                <span className="ml-1 text-[11px] font-mono text-slate-500 tabular-nums">
                  ({completed}/{count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 清单项目卡片列表 */}
      <div className="space-y-3">
        {filteredItems.map((item, index) => {
          const isDone = !!checkedState[item.id];

          return (
            <div
              key={item.id}
              className={`bg-slate-900 border rounded-xl p-5 transition-all ${
                isDone
                  ? 'border-emerald-500/40 bg-slate-900/60'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* 交互复选框按钮 */}
                <button
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  className="mt-0.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-full"
                  aria-label={isDone ? '标记为未完成' : '标记为已完成'}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 transition-colors" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400 transition-colors" />
                  )}
                </button>

                {/* 核心内容区 */}
                <div className="flex-1 space-y-2.5 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-500">
                        STEP 0{index + 1}
                      </span>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <span className="text-xs text-slate-400">
                        {item.category}
                      </span>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <h3 className={`text-sm font-semibold transition-colors ${
                        isDone ? 'text-emerald-300 line-through decoration-emerald-500/50' : 'text-slate-100'
                      }`}>
                        {item.title}
                      </h3>
                    </div>

                    <span className={`text-xs font-medium shrink-0 self-start sm:self-auto ${
                      isDone ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      {isDone ? '✓ 已验证通过' : '待验证'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>

                  {/* 命令行测试工具 */}
                  {item.command && (
                    <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-800/90 font-mono text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 overflow-x-auto text-slate-300 py-0.5">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="whitespace-nowrap select-all">{item.command}</span>
                      </div>
                      <button
                        onClick={() => handleCopyCommand(item.command!, item.id)}
                        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
                        title="复制执行指令"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">已复制</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>复制指令</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* 预期输出判定与建议 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
                      <span className="text-slate-400 font-semibold block mb-0.5">
                        预期验收标准:
                      </span>
                      <p className="text-slate-300 leading-relaxed font-sans">
                        {item.expectedOutput}
                      </p>
                    </div>

                    {item.tip && (
                      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
                        <span className="text-amber-400 font-semibold block mb-0.5">
                          调试排错小贴士:
                        </span>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          {item.tip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 验收通过后的通报 */}
      {completedCount === totalCount && (
        <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/50 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-200">
              恭喜！所有环境部署与脱敏测试项目均已全部验证通过
            </h3>
            <p className="text-xs text-emerald-300/80 mt-0.5 leading-relaxed">
              本地 MCP 服务已准备就绪，可以安全启动 WorkBuddy 并在日常工作中放心处理各类 Word、Excel 与 PDF 文档。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
