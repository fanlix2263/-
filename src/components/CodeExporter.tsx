import React, { useState } from 'react';
import { FIXED_DESENSITIZER_PY, FIXED_SERVER_PY, MCP_CONFIG_JSON, SETUP_BAT } from '../data/fixedCodeSnippets';
import { Copy, Check, Download, FileCode, CheckCircle2 } from 'lucide-react';

export const CodeExporter: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'desensitizer' | 'server' | 'mcp' | 'bat'>('desensitizer');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileMap = {
    desensitizer: {
      name: 'desensitizer.py',
      label: '脱敏核心引擎 (desensitizer.py)',
      content: FIXED_DESENSITIZER_PY,
      lang: 'python',
      description: '彻底修复了国标身份证校验、Word文本框提取、Excel Markdown转换、PDF内存回收与Office文件锁。'
    },
    server: {
      name: 'server.py',
      label: 'MCP 服务端适配 (server.py)',
      content: FIXED_SERVER_PY,
      lang: 'python',
      description: '强制重定向 stdout 防止第三方库打印日志污染 stdio 导致 WorkBuddy 静默断连，基于 FastMCP 架构。'
    },
    mcp: {
      name: 'mcp.json',
      label: 'WorkBuddy 配置文件 (mcp.json)',
      content: MCP_CONFIG_JSON,
      lang: 'json',
      description: '配置在 ~/.workbuddy/mcp.json 中，设置 UTF-8 编码与 OMP_NUM_THREADS 线程保护。'
    },
    bat: {
      name: 'setup_env.bat',
      label: '一键环境安装脚本 (setup_env.bat)',
      content: SETUP_BAT,
      lang: 'bat',
      description: '针对 Win11 8GB RAM 自动创建 Python 独立虚拟环境并安装轻量化模型。'
    }
  };

  const current = fileMap[activeFile];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadAll = () => {
    Object.values(fileMap).forEach(f => {
      handleDownload(f.name, f.content);
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">生产级修复套件源码与一键部署包</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              已将所有发现的 4 处语法/通信阻断 Bug 与 3 处内存风险完全修复，可直接放入 Windows 运行
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>打包下载全部 4 个文件</span>
            </button>
          </div>
        </div>

        {/* 文件切换 Tab */}
        <div className="flex flex-wrap items-center gap-2 mt-5 border-b border-slate-800 pb-3">
          {(Object.keys(fileMap) as Array<keyof typeof fileMap>).map((key) => {
            const f = fileMap[key];
            const isActive = activeFile === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFile(key)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors ${
                  isActive
                    ? 'bg-slate-800 border-emerald-500/50 text-emerald-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-slate-500" />
                <span>{f.name}</span>
              </button>
            );
          })}
        </div>

        {/* 当前文件说明 */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <p className="text-slate-400">{current.description}</p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleCopy(current.content, current.name)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-mono"
            >
              {copiedKey === current.name ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedKey === current.name ? '已复制' : '复制代码'}</span>
            </button>
            <button
              onClick={() => handleDownload(current.name, current.content)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-mono"
            >
              <Download className="w-3.5 h-3.5" />
              <span>保存文件</span>
            </button>
          </div>
        </div>

        {/* 代码展示区 */}
        <div className="mt-3 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-4 max-h-[600px] overflow-auto">
            <pre className="text-xs font-mono text-slate-300 whitespace-pre leading-relaxed select-all">
              {current.content}
            </pre>
          </div>
        </div>
      </div>

      {/* 最佳操作引导 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-semibold text-white">WorkBuddy 防泄露提示词最佳实践指南</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          确保用户在向 WorkBuddy 下达指令时，绝不把文件直接拖拽进输入框（因为拖拽进输入框会先被前端分块喂给 LLM）。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono mt-3">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-rose-950/60 space-y-1">
            <span className="text-rose-400 font-semibold block">❌ 危险操作 (会造成原始敏感信息直通大模型)：</span>
            <p className="text-slate-400 font-sans leading-relaxed">
              把 <code className="text-slate-300">合同.docx</code> 鼠标拖入 WorkBuddy 聊天框，或者输入 “帮我总结这份合同”，让 WorkBuddy 默认文件插件去读。
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-950/60 space-y-1">
            <span className="text-emerald-400 font-semibold block">✅ 安全规范操作 (原始文档 100% 物理留存本地)：</span>
            <p className="text-slate-300 font-sans leading-relaxed">
              输入：<code className="text-emerald-300">请使用本地脱敏工具处理 D:\合同\采购协议.docx，然后总结其中的违约条款与交付周期。</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
