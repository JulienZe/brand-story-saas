'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Palette, Image, Share2, Sparkles, Download, Copy, CheckCircle,
  RefreshCw, Loader2, Wand2, Layout, Type, Layers
} from 'lucide-react';

interface HistoryItem {
  id: string;
  productName: string;
  productDesc: string;
  result: any;
  template: string | null;
}

const COLOR_PALETTES: Record<string, { name: string; colors: string[]; desc: string }> = {
  tech: { name: '科技蓝', colors: ['#667eea', '#764ba2', '#5a72d8', '#8b6fbf', '#9b8fd4', '#b8a8e8'], desc: '创新、智能、未来感' },
  lifestyle: { name: '生活暖', colors: ['#f6d365', '#fda085', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'], desc: '温暖、自然、亲和' },
  health: { name: '健康绿', colors: ['#11998e', '#38ef7d', '#56ab2f', '#a8e063', '#43e97b', '#38f9d7'], desc: '活力、健康、生机' },
  education: { name: '教育紫', colors: ['#6B4C8A', '#8B6AAF', '#A888CF', '#C4A8E3', '#D8C4F0', '#EDE0F7'], desc: '智慧、深度、创新' },
  finance: { name: '金融金', colors: ['#f7971e', '#ffd200', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'], desc: '稳重、价值、尊贵' },
  travel: { name: '旅行蓝', colors: ['#4facfe', '#00f2fe', '#667eea', '#764ba2', '#43e97b', '#38f9d7'], desc: '开阔、自由、探索' },
};

const POSTER_TEMPLATES = [
  { id: 'minimal', name: '极简风格', desc: '大量留白，突出核心信息', icon: Layout },
  { id: 'story', name: '故事叙事', desc: '图文结合，沉浸式阅读', icon: Type },
  { id: 'brand', name: '品牌展示', desc: 'Logo+标语，强化品牌记忆', icon: Layers },
];

const SOCIAL_SIZES = [
  { id: 'wechat_cover', name: '微信封面', width: 900, height: 383 },
  { id: 'xiaohongshu', name: '小红书', width: 1080, height: 1440 },
  { id: 'wechat_article', name: '公众号头图', width: 900, height: 500 },
  { id: 'weibo', name: '微博配图', width: 1080, height: 1080 },
  { id: 'douyin', name: '抖音封面', width: 1080, height: 1920 },
];

export default function VisualAssetsPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedStory, setSelectedStory] = useState<HistoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<'palette' | 'poster' | 'social'>('palette');
  const [selectedPalette, setSelectedPalette] = useState<string>('tech');
  const [selectedPoster, setSelectedPoster] = useState<string>('minimal');
  const [selectedSocial, setSelectedSocial] = useState<string>('wechat_cover');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [posterText, setPosterText] = useState('');
  const [posterSubtitle, setPosterSubtitle] = useState('');

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('brand-story-history') || '[]');
      setHistory(data);
      if (data.length > 0) {
        setSelectedStory(data[0]);
        setPosterText(data[0].productName);
        setPosterSubtitle(data[0].result?.productValue?.coreValue || data[0].productDesc?.slice(0, 50) || '');
      }
    } catch {}
  }, []);

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleExportPalette = () => {
    const palette = COLOR_PALETTES[selectedPalette];
    const css = `:root {\n${palette.colors.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n')}\n}`;
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPalette}-palette.css`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGeneratePoster = useCallback(() => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  }, []);

  const handleDownloadCanvas = () => {
    const canvas = document.createElement('canvas');
    const size = SOCIAL_SIZES.find(s => s.id === selectedSocial) || SOCIAL_SIZES[0];
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = COLOR_PALETTES[selectedPalette];
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, palette.colors[0]);
    gradient.addColorStop(0.5, palette.colors[1]);
    gradient.addColorStop(1, palette.colors[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 200 + 50,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    const titleSize = Math.max(32, Math.floor(canvas.width / 20));
    ctx.font = `bold ${titleSize}px sans-serif`;
    ctx.fillText(posterText || '品牌故事', canvas.width / 2, canvas.height * 0.4);

    const subSize = Math.max(16, Math.floor(canvas.width / 35));
    ctx.font = `${subSize}px sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(posterSubtitle || 'AI 驱动的品牌故事', canvas.width / 2, canvas.height * 0.4 + titleSize + 16);

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${posterText || 'brand'}-${size.name}.png`;
    a.click();
  };

  const palette = COLOR_PALETTES[selectedPalette];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg shadow-[#667eea]/25 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-white/10 to-transparent" />
          <Palette className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">品牌视觉资产</h1>
          <p className="text-gray-500 text-sm mt-0.5">基于品牌故事生成视觉设计素材</p>
        </div>
      </div>

      {selectedStory && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-[#667eea]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">当前品牌：{selectedStory.productName}</p>
            <p className="text-xs text-gray-400 truncate">{selectedStory.productDesc}</p>
          </div>
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-[#f6f6f6] outline-none focus:ring-2 focus:ring-[#667eea]/20 focus:border-[#667eea]"
            value={selectedStory.id}
            onChange={(e) => {
              const s = history.find(h => h.id === e.target.value);
              if (s) {
                setSelectedStory(s);
                setPosterText(s.productName);
                setPosterSubtitle(s.result?.productValue?.coreValue || s.productDesc?.slice(0, 50) || '');
              }
            }}
          >
            {history.map(h => (
              <option key={h.id} value={h.id}>{h.productName}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-gray-100/80 rounded-xl p-1">
        {[
          { key: 'palette' as const, label: '品牌色板', icon: Palette },
          { key: 'poster' as const, label: '海报生成', icon: Image },
          { key: 'social' as const, label: '社交图卡', icon: Share2 },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TabIcon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'palette' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">选择色板风格</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(COLOR_PALETTES).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPalette(key)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPalette === key ? 'border-[#667eea] shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex gap-1 mb-3">
                    {p.colors.slice(0, 4).map((c, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <p className="font-medium text-sm text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.desc}</p>
                  {selectedPalette === key && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">色板预览</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPalette}>
                  <Download className="w-3.5 h-3.5 mr-1" /> 导出CSS
                </Button>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              {palette.colors.map((color, i) => (
                <button
                  key={i}
                  className="flex-1 group relative"
                  onClick={() => handleCopyColor(color)}
                >
                  <div
                    className="h-24 rounded-xl transition-transform duration-200 group-hover:scale-105 shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <div className="mt-2 text-center">
                    <p className="text-xs font-mono text-gray-700">{color}</p>
                    <p className="text-[10px] text-gray-400">色阶 {i + 1}</p>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 rounded-lg px-2 py-1">
                      {copied ? <CheckCircle className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-gray-100" style={{ backgroundColor: palette.colors[0] }}>
                <p className="text-white/60 text-xs mb-1">主色背景</p>
                <p className="text-white font-semibold text-lg">{selectedStory?.productName || '品牌名称'}</p>
                <p className="text-white/70 text-sm mt-1">{posterSubtitle || '品牌标语'}</p>
              </div>
              <div className="p-5 rounded-xl border border-gray-100 bg-white">
                <div className="flex gap-2 mb-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.colors[0] }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.colors[2] }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.colors[4] }} />
                </div>
                <p className="text-gray-900 font-semibold text-lg">{selectedStory?.productName || '品牌名称'}</p>
                <p className="text-gray-500 text-sm mt-1">{posterSubtitle || '品牌标语'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'poster' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">选择海报模板</h3>
            <div className="grid grid-cols-3 gap-3">
              {POSTER_TEMPLATES.map((tpl) => {
                const TplIcon = tpl.icon;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedPoster(tpl.id)}
                    className={`p-5 rounded-xl border-2 text-center transition-all ${
                      selectedPoster === tpl.id ? 'border-[#667eea] bg-gradient-to-br from-[#667eea]/[0.03] to-[#764ba2]/[0.03]' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <TplIcon className={`w-8 h-8 mx-auto mb-2 ${selectedPoster === tpl.id ? 'text-[#667eea]' : 'text-gray-400'}`} />
                    <p className="font-medium text-sm text-gray-900">{tpl.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{tpl.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">海报内容</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">主标题</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#667eea]/20 focus:border-[#667eea] outline-none transition bg-[#f6f6f6]"
                  value={posterText}
                  onChange={(e) => setPosterText(e.target.value)}
                  placeholder="输入主标题"
                  maxLength={30}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">副标题</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#667eea]/20 focus:border-[#667eea] outline-none transition bg-[#f6f6f6]"
                  value={posterSubtitle}
                  onChange={(e) => setPosterSubtitle(e.target.value)}
                  placeholder="输入副标题或品牌标语"
                  maxLength={60}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">海报预览</h3>
              <Button
                className="bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5a72d8] hover:to-[#6a4192] text-white shadow-lg shadow-[#667eea]/25"
                size="sm"
                onClick={handleGeneratePoster}
                disabled={generating}
              >
                {generating ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> 生成中...</> : <><Wand2 className="w-3.5 h-3.5 mr-1" /> 生成海报</>}
              </Button>
            </div>
            <div className="p-6 flex justify-center">
              <div
                className="relative overflow-hidden shadow-xl rounded-lg"
                style={{
                  width: '360px',
                  height: selectedPoster === 'story' ? '480px' : selectedPoster === 'brand' ? '360px' : '480px',
                  background: `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[2]})`,
                }}
              >
                <div className="absolute inset-0">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: `${120 + i * 60}px`,
                        height: `${120 + i * 60}px`,
                        top: `${20 + i * 30}%`,
                        right: `${-20 + i * 10}%`,
                        backgroundColor: `rgba(255,255,255,${0.03 + i * 0.02})`,
                      }}
                    />
                  ))}
                </div>

                <div className="relative h-full flex flex-col justify-between p-8">
                  {selectedPoster === 'minimal' && (
                    <>
                      <div />
                      <div>
                        <p className="text-white/50 text-xs tracking-widest mb-3 uppercase">Brand Story</p>
                        <h2 className="text-white text-3xl font-bold leading-tight mb-3">{posterText || '品牌名称'}</h2>
                        <p className="text-white/70 text-sm leading-relaxed">{posterSubtitle || '品牌标语'}</p>
                      </div>
                      <div className="flex gap-2">
                        {palette.colors.slice(0, 4).map((c, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-white/30" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </>
                  )}

                  {selectedPoster === 'story' && (
                    <>
                      <div className="flex gap-2">
                        {palette.colors.slice(0, 3).map((c, i) => (
                          <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <div>
                        <h2 className="text-white text-2xl font-bold leading-tight mb-4">{posterText || '品牌名称'}</h2>
                        <div className="w-12 h-0.5 bg-white/30 mb-4" />
                        <p className="text-white/70 text-sm leading-relaxed">
                          {selectedStory?.result?.brandStory?.content?.split('\n').filter((l: string) => l.trim()).slice(0, 3).join(' ').slice(0, 120) || '品牌故事内容预览...'}
                        </p>
                      </div>
                      <p className="text-white/40 text-xs">AI 品牌故事创作</p>
                    </>
                  )}

                  {selectedPoster === 'brand' && (
                    <>
                      <div />
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-2xl bg-white/10 mx-auto mb-6 flex items-center justify-center border border-white/20">
                          <span className="text-white text-3xl font-bold">{(posterText || 'B')[0]}</span>
                        </div>
                        <h2 className="text-white text-2xl font-bold mb-2">{posterText || '品牌名称'}</h2>
                        <p className="text-white/60 text-sm">{posterSubtitle || '品牌标语'}</p>
                      </div>
                      <div className="flex justify-center gap-4">
                        {palette.colors.slice(0, 5).map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'social' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">选择社交平台尺寸</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {SOCIAL_SIZES.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSocial(size.id)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    selectedSocial === size.id ? 'border-[#667eea] bg-gradient-to-br from-[#667eea]/[0.03] to-[#764ba2]/[0.03]' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-sm text-gray-900">{size.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{size.width}×{size.height}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">图卡内容</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">标题</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#667eea]/20 focus:border-[#667eea] outline-none transition bg-[#f6f6f6]"
                  value={posterText}
                  onChange={(e) => setPosterText(e.target.value)}
                  maxLength={30}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">副标题</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#667eea]/20 focus:border-[#667eea] outline-none transition bg-[#f6f6f6]"
                  value={posterSubtitle}
                  onChange={(e) => setPosterSubtitle(e.target.value)}
                  maxLength={60}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                图卡预览 — {SOCIAL_SIZES.find(s => s.id === selectedSocial)?.name}
              </h3>
              <Button
                className="bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5a72d8] hover:to-[#6a4192] text-white shadow-lg shadow-[#667eea]/25"
                size="sm"
                onClick={handleDownloadCanvas}
              >
                <Download className="w-3.5 h-3.5 mr-1" /> 下载图片
              </Button>
            </div>
            <div className="p-6 flex justify-center">
              <div
                className="relative overflow-hidden shadow-xl rounded-lg"
                style={{
                  width: '320px',
                  height: `${Math.round(320 * (SOCIAL_SIZES.find(s => s.id === selectedSocial)?.height || 383) / (SOCIAL_SIZES.find(s => s.id === selectedSocial)?.width || 900))}px`,
                  background: `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[2]}, ${palette.colors[4]})`,
                }}
              >
                <div className="absolute inset-0">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: `${80 + i * 40}px`,
                        height: `${80 + i * 40}px`,
                        top: `${10 + i * 20}%`,
                        left: `${-10 + i * 15}%`,
                        backgroundColor: `rgba(255,255,255,${0.02 + i * 0.015})`,
                      }}
                    />
                  ))}
                </div>
                <div className="relative h-full flex flex-col justify-center items-center p-6 text-center">
                  <p className="text-white/40 text-xs tracking-widest mb-4 uppercase">Brand Story</p>
                  <h2 className="text-white text-xl font-bold leading-tight mb-2">{posterText || '品牌名称'}</h2>
                  <div className="w-8 h-0.5 bg-white/30 my-3" />
                  <p className="text-white/70 text-xs leading-relaxed">{posterSubtitle || '品牌标语'}</p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-4 text-center">
              <p className="text-xs text-gray-400">
                实际尺寸：{SOCIAL_SIZES.find(s => s.id === selectedSocial)?.width}×{SOCIAL_SIZES.find(s => s.id === selectedSocial)?.height}px
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
