import React, { useState, useEffect, useRef } from 'react';
import { drumSynth } from '../audio/drumSynth';
import {
  Sparkles,
  Trophy,
  Sliders,
  Swords,
  Music,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  Volume2,
  CheckCircle2,
  Layers,
  Smartphone,
  Tablet,
  Flame,
  Star,
  Award,
} from 'lucide-react';

interface FeaturesPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMyDrumSet?: () => void;
  onStartAIBattle?: () => void;
}

interface FeatureSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  color: string;
  gradient: string;
  icon: React.ReactNode;
  highlights: string[];
  drumSound: () => void;
  visualPreview: React.ReactNode;
}

export const FeaturesPresentationModal: React.FC<FeaturesPresentationModalProps> = ({
  isOpen,
  onClose,
  onOpenMyDrumSet,
  onStartAIBattle,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; color: string; size: number; delay: number }[]>([]);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate celebratory confetti particles
  useEffect(() => {
    if (isOpen) {
      const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#a855f7', '#fbbf24'];
      const particles = Array.from({ length: 45 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.floor(Math.random() * 8) + 4,
        delay: Math.random() * 1.5,
      }));
      setConfetti(particles);

      // Play introductory celebratory drum fanfare
      try {
        drumSynth.playDrum('crash');
        setTimeout(() => drumSynth.playDrum('snare'), 150);
        setTimeout(() => drumSynth.playDrum('crash'), 300);
      } catch (e) {
        // Audio might be waiting for user gesture
      }
    }
  }, [isOpen]);

  const slides: FeatureSlide[] = [
    {
      id: 'real-3d',
      badge: 'PRO 3D DRUMS',
      title: 'リアル3Dドラムセット & ステージ台座',
      subtitle: '本物のドラムの重量感と物理リバウンドを完全再現！',
      color: '#f59e0b',
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      icon: <Layers className="w-6 h-6 text-amber-400" />,
      highlights: [
        '厚みのあるプロ用ステージライザー台座とコーナー補強金具',
        'ダブルブレース頑丈三脚スタンド脚＆キック滑り止めストッパー',
        '叩くたびに震えるスネアの響き線と重低音の衝撃波エフェクト',
        'クラッシュ＆ライドシンバルの揺らぎと本物の金属倍音',
      ],
      drumSound: () => {
        drumSynth.playDrum('kick');
        setTimeout(() => drumSynth.playDrum('crash'), 100);
      },
      visualPreview: (
        <div className="relative w-full h-44 rounded-2xl bg-gradient-to-b from-slate-900 to-black border-2 border-amber-500/40 p-3 flex flex-col items-center justify-center overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] opacity-20 bg-[size:12px_12px]" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border-2 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center animate-bounce">
              <span className="text-2xl">🥁</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-amber-300">LIVE STAGE RISER</span>
              <span className="text-[10px] text-slate-300">重厚な木製台座＋三脚スタンド</span>
              <div className="flex gap-1 mt-1">
                <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">3D振動</span>
                <span className="text-[8px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.5 rounded">金属倍音</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'auto-device',
      badge: 'SMART DETECTION',
      title: '端末自動判定 ＆ 画面最適化',
      subtitle: 'スマホでもタブレットでも、無駄な余白ゼロの超迫力画面！',
      color: '#06b6d4',
      gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      icon: <Smartphone className="w-6 h-6 text-cyan-400" />,
      highlights: [
        'スマホとタブレットの画面サイズ・解像度を自動認識して瞬時に最適化',
        '無駄な余白を完全にカットし、ドラムセットが画面いっぱいに大きく表示',
        'スマホはタップしやすい親切配置、タブレットは大迫力のフルキット',
        '横画面・縦画面の向き変更にもスムーズに追従',
      ],
      drumSound: () => {
        drumSynth.playDrum('hihatClosed');
        setTimeout(() => drumSynth.playDrum('snare'), 120);
      },
      visualPreview: (
        <div className="relative w-full h-44 rounded-2xl bg-gradient-to-b from-slate-900 to-black border-2 border-cyan-500/40 p-3 flex items-center justify-around overflow-hidden shadow-2xl">
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-800/80 border border-cyan-500/30">
            <Smartphone className="w-7 h-7 text-cyan-400 mb-1 animate-pulse" />
            <span className="text-[10px] font-black text-cyan-200">スマホモード</span>
            <span className="text-[8px] text-slate-400">大判タップ最適化</span>
          </div>
          <div className="text-xl font-bold text-cyan-400">⚡</div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-800/80 border border-cyan-500/30">
            <Tablet className="w-7 h-7 text-cyan-400 mb-1 animate-pulse" />
            <span className="text-[10px] font-black text-cyan-200">タブレットモード</span>
            <span className="text-[8px] text-slate-400">大画面フルセット</span>
          </div>
        </div>
      ),
    },
    {
      id: 'my-drumset',
      badge: 'TABLET EXCLUSIVE',
      title: 'マイドラムセット登録（最大5台保存）',
      subtitle: '素材や色を自由にカスタム！自分だけの夢のドラムキット！',
      color: '#ec4899',
      gradient: 'from-pink-500/20 via-rose-500/10 to-transparent',
      icon: <Sliders className="w-6 h-6 text-pink-400" />,
      highlights: [
        '胴（シェル）の素材: ナチュラルメイプル、ピアノブラック、スパークル等',
        'ヘッド（打面）: ヴィンテージコーテッド、クリアエバンス、ブラックメッシュ',
        'ハードウェア: 光輝くクローム、精悍なブラックニッケル、絢爛なゴールド',
        'ニックネームを付けて最大5台まで保存可能！ワンタップで即座に切替',
      ],
      drumSound: () => {
        drumSynth.playDrum('snare');
        setTimeout(() => drumSynth.playDrum('tomHigh'), 100);
        setTimeout(() => drumSynth.playDrum('tomLow'), 200);
        setTimeout(() => drumSynth.playDrum('tomFloor'), 300);
      },
      visualPreview: (
        <div className="relative w-full h-44 rounded-2xl bg-gradient-to-b from-slate-900 to-black border-2 border-pink-500/40 p-3 flex flex-col justify-center overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-pink-300">マイドラムセット（5スロット保存）</span>
            <span className="text-[9px] bg-pink-500/30 text-pink-200 px-2 py-0.5 rounded-full font-bold">タブレット専用</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {['🔥 レッド', '💎 アクリル', '⚡ カーボン', '🌟 ゴールド', '👑 ロイヤル'].map((name, i) => (
              <div
                key={name}
                className={`flex flex-col items-center p-1.5 rounded-lg border text-center ${
                  i === 0 ? 'bg-pink-500/20 border-pink-400 text-pink-200 shadow-md' : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 mb-1 shadow-sm" />
                <span className="text-[8px] font-bold truncate w-full">{name}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'ai-battle',
      badge: 'TABLET EXCLUSIVE',
      title: '白熱のリアルタイム AI対戦モード',
      subtitle: '右側に小型AIドラムセットが出現！白熱のスコアデッドヒート！',
      color: '#8b5cf6',
      gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
      icon: <Swords className="w-6 h-6 text-purple-400" />,
      highlights: [
        'プレイヤーのドラムセットの右側にリアルタイムで叩く小型AIドラムセットが登場',
        '入門・中級・上級・達人の4段階のAI難易度を自由に変更可能',
        'AIには自然な人間的ゆらぎと失敗率（勝率約30%設計）を搭載し白熱バトルを実現',
        'リアルタイムでスコア差を表示！追いつけ追い越せのゲーム性',
      ],
      drumSound: () => {
        drumSynth.playDrum('kick');
        setTimeout(() => drumSynth.playDrum('snare'), 120);
        setTimeout(() => drumSynth.playDrum('crash'), 240);
      },
      visualPreview: (
        <div className="relative w-full h-44 rounded-2xl bg-gradient-to-b from-slate-900 to-black border-2 border-purple-500/40 p-3 flex items-center justify-between overflow-hidden shadow-2xl">
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[9px] font-bold text-amber-300">PLAYER</span>
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center my-1">
              <span className="text-xl">🥁</span>
            </div>
            <span className="text-xs font-mono font-black text-amber-300">12,400 pt</span>
          </div>
          <div className="px-2 flex flex-col items-center">
            <Swords className="w-6 h-6 text-rose-400 animate-pulse mb-0.5" />
            <span className="text-[8px] font-black bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded border border-rose-500/40">VS BATTLE</span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[9px] font-bold text-purple-300">AI DRUMMER</span>
            <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center my-1">
              <span className="text-xl">🤖</span>
            </div>
            <span className="text-xs font-mono font-black text-purple-300">11,200 pt</span>
          </div>
        </div>
      ),
    },
    {
      id: 'curriculum',
      badge: 'EASY TO LEARN',
      title: '1.5秒前の光の予告 ＆ 五線譜レーン',
      subtitle: 'リズムが苦手な方でも大丈夫！初心者からプロへステップアップ！',
      color: '#10b981',
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      icon: <Music className="w-6 h-6 text-emerald-400" />,
      highlights: [
        '音符が来る最大1.5秒前からドラムパッドが優しく光る「親切アプローチリング」',
        '音楽ゲーム感覚で直感的に叩ける本格五線譜スクロールレーン',
        'ミリ秒精度のグルーヴ診断（ジャスト / 突っ込み / タメ）でドラマーとしての腕前を可視化',
        '全50段階のRPGカリキュラムと個性あふれる4匹のマスコットコーチが応援',
      ],
      drumSound: () => {
        drumSynth.playDrum('hihatClosed');
        setTimeout(() => drumSynth.playDrum('hihatClosed'), 100);
        setTimeout(() => drumSynth.playDrum('snare'), 200);
      },
      visualPreview: (
        <div className="relative w-full h-44 rounded-2xl bg-gradient-to-b from-slate-900 to-black border-2 border-emerald-500/40 p-3 flex flex-col justify-center overflow-hidden shadow-2xl">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-emerald-300">リアルタイム五線譜レーン</span>
            <span className="text-[9px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-bold">光の予告</span>
          </div>
          <div className="w-full h-10 rounded-lg bg-slate-950 border border-slate-700 flex items-center px-3 relative overflow-hidden">
            <div className="absolute left-6 top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <div className="flex items-center gap-8 pl-12">
              <span className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-[9px] font-bold text-white shadow animate-ping">●</span>
              <span className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center text-[9px] font-bold text-black shadow">●</span>
              <span className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[9px] font-bold text-black shadow">●</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[9px] font-bold text-emerald-400">JUST 0ms ⭐ PERFECT</span>
          </div>
        </div>
      ),
    },
  ];

  const slide = slides[currentSlide];

  const nextSlide = () => {
    const nextIdx = (currentSlide + 1) % slides.length;
    setCurrentSlide(nextIdx);
    slides[nextIdx].drumSound();
  };

  const prevSlide = () => {
    const prevIdx = (currentSlide - 1 + slides.length) % slides.length;
    setCurrentSlide(prevIdx);
    slides[prevIdx].drumSound();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Dynamic Confetti & Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              width: `${c.size}px`,
              height: `${c.size}px`,
              backgroundColor: c.color,
              opacity: 0.6,
              boxShadow: `0 0 10px ${c.color}`,
              animationDuration: `${1.5 + c.delay}s`,
            }}
          />
        ))}
        {/* Stage Lighting Spotlight Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      </div>

      {/* Main Presentation Modal Window */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-950 border-2 border-amber-400/80 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.4)] overflow-hidden flex flex-col z-20 animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-300 to-cyan-300">
                  Poko-poko Beats
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-sm">
                  NEW SPECIAL FEATURES
                </span>
              </div>
              <p className="text-[11px] text-slate-400">感動と興奮が詰まった新次元のリズム体験</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Presentation Slide Body */}
        <div className="relative flex-1 p-4 sm:p-6 flex flex-col overflow-y-auto max-h-[72vh]">
          {/* Slide Indicator Dots */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => {
                  setCurrentSlide(idx);
                  slides[idx].drumSound();
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide
                    ? 'w-8 bg-gradient-to-r from-amber-400 to-pink-500 shadow-md shadow-amber-500/50'
                    : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                aria-label={`スライド ${idx + 1}`}
              />
            ))}
          </div>

          {/* Slide Title & Badge */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-sm"
              style={{
                borderColor: slide.color,
                color: slide.color,
                backgroundColor: `${slide.color}20`,
              }}
            >
              {slide.badge}
            </span>
            <span className="text-xs text-slate-400 font-bold">
              {currentSlide + 1} / {slides.length}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-2xl bg-slate-800 border border-slate-700 shadow-inner">
              {slide.icon}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight">
                {slide.title}
              </h2>
              <p className="text-xs text-amber-300/90 font-medium">
                {slide.subtitle}
              </p>
            </div>
          </div>

          {/* Visual Showcase Box */}
          <div className="my-3">
            {slide.visualPreview}
          </div>

          {/* Highlights List */}
          <div className="space-y-2 mt-2 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            {slide.highlights.map((text, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                <CheckCircle2
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: slide.color }}
                />
                <span className="leading-relaxed font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1 text-xs border border-slate-700 transition active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>前へ</span>
            </button>
            <button
              onClick={nextSlide}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1 text-xs border border-slate-700 transition active:scale-95"
            >
              <span>次へ</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Action Button tailored to current feature */}
          <div className="flex items-center gap-2">
            {slide.id === 'my-drumset' && onOpenMyDrumSet && (
              <button
                onClick={() => {
                  onClose();
                  onOpenMyDrumSet();
                }}
                className="py-2.5 px-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-black rounded-xl shadow-lg flex items-center gap-1.5 text-xs transition active:scale-95"
              >
                <Sliders className="w-4 h-4" />
                <span>マイドラムを今すぐ作る</span>
              </button>
            )}

            {slide.id === 'ai-battle' && onStartAIBattle && (
              <button
                onClick={() => {
                  onClose();
                  onStartAIBattle();
                }}
                className="py-2.5 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black rounded-xl shadow-lg flex items-center gap-1.5 text-xs transition active:scale-95"
              >
                <Swords className="w-4 h-4" />
                <span>AI対戦を今すぐ始める</span>
              </button>
            )}

            <button
              onClick={() => {
                drumSynth.playDrum('crash');
                onClose();
              }}
              className="py-2.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-1.5 text-xs transition active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>体験を始める</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
