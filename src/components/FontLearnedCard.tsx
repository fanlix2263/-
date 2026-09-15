import React, { useState } from 'react';
import { Award, CheckCircle2, Compass, Ruler } from 'lucide-react';

export const FontLearnedCard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'digits' | 'multidigit' | 'orientation'>('multidigit');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">8~14 样本学习与三四位数推算</h3>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          横向+多位数已解析
        </span>
      </div>

      {/* 选项卡切换 */}
      <div className="flex bg-slate-100 p-1 rounded-lg gap-1 text-xs">
        <button
          onClick={() => setActiveTab('multidigit')}
          className={`flex-1 py-1.5 px-2 rounded-md font-medium transition-all ${
            activeTab === 'multidigit'
              ? 'bg-white text-blue-700 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          两位/三位/四位推算
        </button>
        <button
          onClick={() => setActiveTab('digits')}
          className={`flex-1 py-1.5 px-2 rounded-md font-medium transition-all ${
            activeTab === 'digits'
              ? 'bg-white text-blue-700 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          8~14字形全解
        </button>
        <button
          onClick={() => setActiveTab('orientation')}
          className={`flex-1 py-1.5 px-2 rounded-md font-medium transition-all ${
            activeTab === 'orientation'
              ? 'bg-white text-blue-700 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          横向 vs 竖向规则
        </button>
      </div>

      {/* 选项卡 1：多位数（2位、3位、4位）物理推算 */}
      {activeTab === 'multidigit' && (
        <div className="space-y-3 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Ruler className="w-3.5 h-3.5 text-blue-600" />
              <span>跳号机字轮物理约束与推算模型</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              根据机械金属打码机结构，每个数位都是一个独立的金属字轮（并列轴心旋转），因此：
            </p>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white border border-slate-200 p-2 rounded-md">
                <span className="text-[10px] text-slate-400 block">字高 (Height)</span>
                <span className="font-bold text-slate-800 text-xs">恒定 5.0 mm</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">无论几位均不变</span>
              </div>
              <div className="bg-white border border-slate-200 p-2 rounded-md">
                <span className="text-[10px] text-slate-400 block">轮位间距 (Pitch)</span>
                <span className="font-bold text-slate-800 text-xs">固定 3.5 mm</span>
                <span className="text-[10px] text-blue-600 block mt-0.5">严格等宽物理排布</span>
              </div>
              <div className="bg-white border border-slate-200 p-2 rounded-md">
                <span className="text-[10px] text-slate-400 block">消零机制 (Drop 0)</span>
                <span className="font-bold text-slate-800 text-xs">高位下沉隐藏</span>
                <span className="text-[10px] text-amber-600 block mt-0.5">印 8 而不印 0008</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-slate-700 block text-[11px]">不同位数印迹推算表现：</span>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden text-[11px]">
              <div className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                <div>
                  <span className="font-bold text-slate-900">1位数 (8, 9)</span>
                  <span className="text-slate-500 ml-2">总印迹宽约 3.0~3.2 mm</span>
                </div>
                <span className="font-serif font-bold text-base px-2 py-0.5 bg-slate-100 rounded text-slate-900">8</span>
              </div>
              <div className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                <div>
                  <span className="font-bold text-slate-900">2位数 (10, 14, 25)</span>
                  <span className="text-slate-500 ml-2">总印迹宽约 6.8~7.2 mm</span>
                </div>
                <span className="font-serif font-bold text-base px-2 py-0.5 bg-slate-100 rounded text-slate-900">14</span>
              </div>
              <div className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                <div>
                  <span className="font-bold text-slate-900">3位数 (125, 268)</span>
                  <span className="text-slate-500 ml-2">总印迹宽约 10.5~11.0 mm</span>
                </div>
                <span className="font-serif font-bold text-base px-2 py-0.5 bg-slate-100 rounded text-slate-900">125</span>
              </div>
              <div className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                <div>
                  <span className="font-bold text-slate-900">4位数 (1024, 2048)</span>
                  <span className="text-slate-500 ml-2">总印迹宽约 14.5~15.0 mm</span>
                </div>
                <span className="font-serif font-bold text-base px-2 py-0.5 bg-slate-100 rounded text-slate-900">1024</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              * 右边缘锚定：多位数打码时，以个位数为基准向左顺向延伸，右侧与图纸边缘留白保持 20~35mm 安全距离，绝不超出图框。
            </p>
          </div>
        </div>
      )}

      {/* 选项卡 2：8~14 字形全解 */}
      {activeTab === 'digits' && (
        <div className="space-y-2.5 text-xs">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="border border-slate-200 rounded-md p-2 bg-slate-50">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                <span className="font-serif font-bold text-sm bg-slate-900 text-white w-5 h-5 rounded flex items-center justify-center">8</span>
                <span>数字 8 (第8页)</span>
              </div>
              <p className="text-slate-600">上下双闭合圆环，上环略小于下环，腰部内收明显，古典罗马对称粗细轴。</p>
            </div>

            <div className="border border-slate-200 rounded-md p-2 bg-slate-50">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                <span className="font-serif font-bold text-sm bg-slate-900 text-white w-5 h-5 rounded flex items-center justify-center">9</span>
                <span>数字 9 (第9页)</span>
              </div>
              <p className="text-slate-600">上部正圆封闭碗部，下尾呈利落优雅弧度顺滑下延，与 6 呈 180° 字模倒置对应关系。</p>
            </div>

            <div className="border border-slate-200 rounded-md p-2 bg-slate-50">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                <span className="font-serif font-bold text-sm bg-slate-900 text-white w-5 h-5 rounded flex items-center justify-center">0</span>
                <span>数字 0 (见于 10)</span>
              </div>
              <p className="text-slate-600">竖直长圆柱状超椭圆，两侧竖弧明显加厚，顶部和底部过渡极薄。</p>
            </div>

            <div className="border border-slate-200 rounded-md p-2 bg-slate-50">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                <span className="font-serif font-bold text-sm bg-slate-900 text-white w-5 h-5 rounded flex items-center justify-center">1</span>
                <span>数字 1 (见于 10~14)</span>
              </div>
              <p className="text-slate-600">顶端朝左下倾斜的锋利尖旗衬线，底部刚直平坦的双侧基座横衬线，主干厚实直挺。</p>
            </div>

            <div className="border border-slate-200 rounded-md p-2 bg-slate-50">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                <span className="font-serif font-bold text-sm bg-slate-900 text-white w-5 h-5 rounded flex items-center justify-center">3</span>
                <span>数字 3 (见于 13)</span>
              </div>
              <p className="text-slate-600">上弧略小平展，中央腰喙向左尖锐内指，下圆弧饱满并带水滴状末端。</p>
            </div>

            <div className="border border-slate-200 rounded-md p-2 bg-slate-50">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                <span className="font-serif font-bold text-sm bg-slate-900 text-white w-5 h-5 rounded flex items-center justify-center">4</span>
                <span>数字 4 (见于 14)</span>
              </div>
              <p className="text-slate-600">开放式顶部（Open-top 4），横笔向右贯穿延伸，竖向主干底部带衬线。</p>
            </div>
          </div>
        </div>
      )}

      {/* 选项卡 3：横向 vs 竖向页面排布规则 */}
      {activeTab === 'orientation' && (
        <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-950">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>横竖向自适应加盖准则</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-blue-900">
              <li>
                <strong>正向阅读优先</strong>：横向图纸（如水利检测表 5-1）在装订和阅览时均保持横版视角，打码机依然依照<strong>读者视角的右下角</strong>水平正向盖印。
              </li>
              <li>
                <strong>物理比例换算</strong>：竖向以 297mm 高度为 5mm 锚定；横向以 210mm 短边高度为 5mm 锚定，保证打印出来在实物图纸上均为绝对 5mm 大小。
              </li>
              <li>
                <strong>自动方向感知</strong>：系统检测到上传图片宽大于高时，自动切换至横向加盖模式。
              </li>
              <li>
                <strong>单双号装订落位规则</strong>：
                <br />
                • <strong>情况 1（单号右下，双号左下）</strong>：适应工程文件对开双面胶装/线装。翻阅时，奇数单号在右侧切口下角，偶数双号在左侧切口下角，脊背装订线在中间绝不遮挡页码。
                <br />
                • <strong>情况 2（全部右下角）</strong>：适应常规单面打印或逐页归档，整齐划一。
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
