import React, { useState } from 'react';
import { CustomRegexRule } from '../types';
import { Plus, Trash2, Check, Copy, Code2, AlertCircle, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

interface CustomRegexManagerProps {
  customRules: CustomRegexRule[];
  onAddRule: (rule: CustomRegexRule) => void;
  onToggleRule: (id: string) => void;
  onDeleteRule: (id: string) => void;
  onResetDefaultRules: () => void;
}

export const CustomRegexManager: React.FC<CustomRegexManagerProps> = ({
  customRules,
  onAddRule,
  onToggleRule,
  onDeleteRule,
  onResetDefaultRules
}) => {
  // 新建表单状态
  const [isAdding, setIsAdding] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEntityType, setFormEntityType] = useState('');
  const [formPattern, setFormPattern] = useState('');
  const [formScore, setFormScore] = useState(0.90);
  const [formDescription, setFormDescription] = useState('');
  const [testSample, setTestSample] = useState('');
  const [regexError, setRegexError] = useState<string | null>(null);

  // Python 代码导出弹窗
  const [showPythonExport, setShowPythonExport] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);

  // 实时校验正则表达式语法与测试样本
  const testMatchResult = React.useMemo(() => {
    if (!formPattern.trim()) {
      setRegexError(null);
      return null;
    }
    try {
      const reg = new RegExp(formPattern, 'g');
      setRegexError(null);
      if (!testSample.trim()) return null;
      const matches = testSample.match(reg);
      return {
        matched: !!matches,
        count: matches ? matches.length : 0,
        samples: matches || []
      };
    } catch (err: any) {
      setRegexError(err.message || '正则表达式语法错误');
      return null;
    }
  }, [formPattern, testSample]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEntityType.trim() || !formPattern.trim()) return;
    if (regexError) return;

    const newRule: CustomRegexRule = {
      id: `custom_${Date.now()}`,
      name: formName.trim(),
      entityType: formEntityType.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
      pattern: formPattern.trim(),
      score: formScore,
      enabled: true,
      description: formDescription.trim(),
      exampleMatch: testSample.trim()
    };

    onAddRule(newRule);
    // 重置表单
    setFormName('');
    setFormEntityType('');
    setFormPattern('');
    setFormDescription('');
    setTestSample('');
    setIsAdding(false);
  };

  // 生成 Python Presidio 注册代码
  const pythonCode = React.useMemo(() => {
    const activeRules = customRules.filter(r => r.enabled);
    if (activeRules.length === 0) return '# 当前未启用任何自定义正则规则';

    return `# ==========================================================
# 复制以下代码至 desensitizer.py 的 _register_custom_chinese_recognizers 函数中:
# ==========================================================
from presidio_analyzer import PatternRecognizer, Pattern

def register_user_custom_patterns(analyzer):
${activeRules.map(r => `    # 规则: ${r.name} (${r.description || '无备注'})
    pattern_${r.entityType.toLowerCase()} = Pattern(
        name="${r.entityType.toLowerCase()}_pattern",
        regex=r"${r.pattern.replace(/\\/g, '\\\\')}",
        score=${r.score.toFixed(2)}
    )
    analyzer.registry.add_recognizer(PatternRecognizer(
        supported_entity="${r.entityType}",
        patterns=[pattern_${r.entityType.toLowerCase()}],
        supported_language="zh"
    ))
`).join('\n')}
    # 在 create_optimized_analyzer() 中调用:
    # register_user_custom_patterns(analyzer)`;
  }, [customRules]);

  const handleCopyPython = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopiedPython(true);
    setTimeout(() => setCopiedPython(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
      {/* 标题栏与快捷操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            自定义 PII 正则识别规则配置中心
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            在此添加企业内部特定的识别模式（如项目代号、内部工号、业务合同号），系统将在脱敏时自动识别并占位
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPythonExport(!showPythonExport)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-sky-400" />
            <span>导出 Python 注册代码</span>
          </button>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建自定义规则</span>
            </button>
          )}
        </div>
      </div>

      {/* 新增规则展开表单 */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-950 rounded-lg border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-semibold text-emerald-400">配置新正则识别模式</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              取消
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                规则名称 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="例如: 内部研发项目代号"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                实体占位标识 (ENTITY_TYPE) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="例如: PROJECT_CODE"
                value={formEntityType}
                onChange={(e) => setFormEntityType(e.target.value.toUpperCase())}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                将生成如 &lt;{formEntityType.trim().toUpperCase() || 'PROJECT_CODE'}_1&gt;
              </span>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                置信度权重: <span className="text-emerald-400 font-mono">{formScore.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={formScore}
                onChange={(e) => setFormScore(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">
                  正则表达式 (Pattern) <span className="text-rose-400">*</span>
                </label>
                {regexError && (
                  <span className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {regexError}
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="例如: PRJ-[A-Z]{3,6}-\d{4,8}"
                value={formPattern}
                onChange={(e) => setFormPattern(e.target.value)}
                className={`w-full bg-slate-900 border rounded px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none ${
                  regexError ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                }`}
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                建议前后使用前后断言或严格前缀，避免误判常规英文单词
              </span>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                即时测试样本 (用于现场验证正则是否命中)
              </label>
              <input
                type="text"
                placeholder="例如输入: 启动 PRJ-ANTIGRAV-202603 项目会议"
                value={testSample}
                onChange={(e) => setTestSample(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
              {testMatchResult && (
                <div className="mt-1 text-[11px] flex items-center gap-1.5">
                  {testMatchResult.matched ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      验证通过！成功命中 {testMatchResult.count} 处: [{testMatchResult.samples.join(', ')}]
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      未匹配到样本，请调整正则模式
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-500">
              提示: 保存后沙箱与批处理将立即生效
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs rounded bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={!!regexError || !formPattern.trim() || !formName.trim()}
                className="px-4 py-1.5 text-xs rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition-colors disabled:opacity-50"
              >
                保存并启用规则
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 规则清单列表 */}
      <div className="space-y-2">
        {customRules.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
            暂未添加自定义正则识别规则。点击右上角“新建自定义规则”或恢复默认预设。
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-medium w-16">状态</th>
                  <th className="py-2.5 px-3 font-medium">规则名称</th>
                  <th className="py-2.5 px-3 font-medium">实体标签</th>
                  <th className="py-2.5 px-3 font-medium">正则表达式 (Pattern)</th>
                  <th className="py-2.5 px-3 font-medium">置信度</th>
                  <th className="py-2.5 px-3 font-medium text-right w-16">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {customRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => onToggleRule(rule.id)}
                        className={`text-xs px-2 py-0.5 rounded font-mono transition-colors ${
                          rule.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                        title="点击启用/停用"
                      >
                        {rule.enabled ? '已启用' : '已停用'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-200">
                      {rule.name}
                      {rule.description && (
                        <span className="text-[10px] text-slate-500 block">{rule.description}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400">
                      &lt;{rule.entityType}&gt;
                    </td>
                    <td className="py-2.5 px-3 font-mono text-sky-300 select-all">
                      {rule.pattern}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 tabular-nums">
                      {(rule.score * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="删除该规则"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 底部功能条 */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>当前共加载 {customRules.length} 条自定义规则（生效中 {customRules.filter(r => r.enabled).length} 条）</span>
        <button
          onClick={onResetDefaultRules}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          恢复官方推荐预设规则
        </button>
      </div>

      {/* Python 导出抽屉 */}
      {showPythonExport && (
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-sky-400" />
              本地 Python Presidio PatternRecognizer 适配代码
            </span>
            <button
              onClick={handleCopyPython}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {copiedPython ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedPython ? '已复制代码' : '复制 Python 代码'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
            {pythonCode}
          </pre>
        </div>
      )}
    </div>
  );
};
