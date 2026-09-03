import React, { useEffect, useState } from 'react';
import { X, Sparkles, Volume2, Flame, Activity, Disc, Layers, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import { drumSynth } from '../audio/drumSynth';
import { AmbiencePreset } from '../types';

interface ShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPlaying?: () => void;
}

export const ShowcaseModal: React.FC<ShowcaseModalProps> = ({
  isOpen,
  onClose,
  onStartPlaying,
}) => {
  const [activeAmbience, setActiveAmbience] = useState<AmbiencePreset>('vintage');
  const [activeTab, setActiveTab] = useState<'all' | 'sound' | 'visual'>('all');
  const [demoStatus, setDemoStatus] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    // 1. Dazzling Confetti Fanfare
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.4 },
        colors: ['#f59e0b', '#ec4899', '#06b6d4', '#10b981', '#ffffff'],
      });
    } catch {}

    // 2. Audio Chime Fanfare using Web Audio API
    try {
      drumSynth.init();
      const ctx = drumSynth.getContext();
      if (ctx) {
        const t = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + i * 0.08);
          gain.gain.setValueAtTime(0.2, t + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t + i * 0.08);
          osc.stop(t + i * 0.08 + 0.45);
        });
      }
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestHiHatChoke = () => {
    drumSynth.init();
    drumSynth.playHiHatOpen();
    setDemoStatus('🔔 オープンハイハット発声中...');
    setTimeout(() => {
      drumSynth.chokeHiHat();
      setDemoStatus('🦶 クローズ/ペダルで瞬時チョーク！（消音）');
      setTimeout(() => setDemoStatus(''), 1800);
    }, 450);
  };

  const handleTestRimshot = () => {
    drumSynth.init();
    drumSynth.playRimshot();
    setDemoStatus('💥 金属フープ共鳴＋打面ヘッドの炸裂リムショット！');
    setTimeout(() => setDemoStatus(''), 1800);
  };

  const handleSetAmbience = (preset: AmbiencePreset) => {
    setActiveAmbience(preset);
    drumSynth.setAmbiencePreset(preset);
    drumSynth.playDrum('snare');
    setDemoStatus(`🎙️ 空間リバーブを [${preset === 'dead' ? '70s Dead Studio' : preset === 'vintage' ? 'Abbey Road Vintage Room' : 'Live Concert Arena'}] に変更！`);
    setTimeout(() => setDemoStatus(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-slate-950 border-2 border-amber-400/60 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.35)] flex flex-col overflow-hidden">
        {/* TOP GLOW ACCENT */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 animate-pulse" />

        {/* HEADER */}
        <div className="p-4 sm:p-5 pb-3 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 text-[10px] sm:text-xs font-black tracking-wider uppercase flex items-center gap-1 shadow-md">
                <Sparkles className="w-3 h-3" />
                PROFESSIONAL UPGRADE
              </span>
              <span className="text-[10px] text-amber-300/90 font-bold bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                ミュージシャン唸る新次元ドラム
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>🥁</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-300 to-cyan-300">
                Poko-poko Beats の神機能
              </span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              親しみやすさはそのままに、プロドラマーや音響エンジニアが驚くリアルな音響・打感・物理エンジンを完全実装！
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition shrink-0"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DEMO STATUS FLOATING BANNER */}
        {demoStatus && (
          <div className="bg-amber-400 text-slate-950 px-4 py-1 text-xs font-black text-center animate-bounce shadow-md flex items-center justify-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            <span>{demoStatus}</span>
          </div>
        )}

        {/* SCROLLABLE SHOWCASE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {/* INTERACTIVE SOUND TEST BAR */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 p-3.5 rounded-2xl border border-cyan-500/30 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                その場で試せる！リアル打面テスト
              </span>
              <span className="text-[10px] text-slate-400">タップして音と挙動を体感</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={handleTestHiHatChoke}
                className="px-2.5 py-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-500/50 text-cyan-200 text-xs font-bold flex flex-col items-center gap-0.5 active:scale-95 transition shadow-sm"
              >
                <span className="text-sm">🔔 ➜ 🦶</span>
                <span>ハイハット・チョーク</span>
                <span className="text-[9px] text-cyan-400/80">余韻の瞬時消音</span>
              </button>

              <button
                onClick={handleTestRimshot}
                className="px-2.5 py-2 rounded-xl bg-amber-950/70 hover:bg-amber-900/90 border border-amber-500/50 text-amber-200 text-xs font-bold flex flex-col items-center gap-0.5 active:scale-95 transition shadow-sm"
              >
                <span className="text-sm">💥</span>
                <span>オープン・リムショット</span>
                <span className="text-[9px] text-amber-400/80">金属フープ高倍音</span>
              </button>

              <button
                onClick={() => {
                  drumSynth.init();
                  drumSynth.playDrum('kick');
                }}
                className="px-2.5 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900/90 border border-rose-500/50 text-rose-200 text-xs font-bold flex flex-col items-center gap-0.5 active:scale-95 transition shadow-sm"
              >
                <span className="text-sm">🥁</span>
                <span>バスドラム (Kick)</span>
                <span className="text-[9px] text-rose-400/80">重低音サブベース衝撃波</span>
              </button>

              <button
                onClick={() => {
                  drumSynth.init();
                  drumSynth.playDrum('crash');
                }}
                className="px-2.5 py-2 rounded-xl bg-yellow-950/70 hover:bg-yellow-900/90 border border-yellow-500/50 text-yellow-200 text-xs font-bold flex flex-col items-center gap-0.5 active:scale-95 transition shadow-sm"
              >
                <span className="text-sm">✨</span>
                <span>クラッシュ・シンバル</span>
                <span className="text-[9px] text-yellow-400/80">金属シマー振動</span>
              </button>
            </div>
          </div>

          {/* 5 MAJOR PROFESSIONAL FEATURES */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              実装された5大ミュージシャン仕様
            </h3>

            {/* Feature 1 */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-3.5 transition">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg shrink-0 border border-cyan-500/40">
                  🔔
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-slate-100">
                      1. リアルハイハット共鳴＆オープン/クローズ・チョーク
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      音響物理
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    本物のドラム同様、オープンハイハットの余韻が響いている最中にクローズを叩く、またはペダルを踏むと、物理的な制動（チョーク）がかかり瞬時に消音！踏み込み時の機械的ペダル「チッ」音も完全再現。
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-3.5 transition">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg shrink-0 border border-amber-500/40">
                  🎯
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-slate-100">
                      2. プロ愛用グルーヴ・アナライザー (Rush / Pocket / Layback)
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      音楽理論
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    判定をミリ秒（±ms）単位で瞬時解析。「前ノリ (Rush: ロックなドライブ感)」「ジャスト (Pocket: 黄金のグルーヴ)」「後ノリ (Layback: ソウル・ファンクの深いタメ)」を可視化。難易度は変えずに、プロ視点のノリ診断を楽しめます。
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-pink-500/50 rounded-2xl p-3.5 transition">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-lg shrink-0 border border-pink-500/40">
                  💥
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-slate-100">
                      3. 炸裂オープン・リムショット＆打面スティック軌道
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold">
                      打撃倍音
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    スネア上部のフープをクリック（またはキーボード[R]）すると、金属フープの共鳴高倍音（560Hz/920Hz）と打面中央のアタックが同時発音！金色スパークの火花エフェクトとウッドスティックの跳ね返りが連動します。
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-3.5 transition">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg shrink-0 border border-indigo-500/40">
                  🎙️
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-slate-100">
                      4. スタジオ・ルーム・アンビエンス・シミュレータ
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                      音響空間
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed mb-2">
                    70年代風ドライな密閉ブース、アビイ・ロード風の温かいスタジオ反射音、スタジアム・アリーナの大規模リバーブをリアルタイム切り替え！
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSetAmbience('dead')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        activeAmbience === 'dead'
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      🎙️ 70s Dead (超タイト)
                    </button>
                    <button
                      onClick={() => handleSetAmbience('vintage')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        activeAmbience === 'vintage'
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      📻 Vintage Room (温かい部屋鳴り)
                    </button>
                    <button
                      onClick={() => handleSetAmbience('arena')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        activeAmbience === 'arena'
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      🏟️ Live Arena (大空間リバーブ)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-3.5 transition">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg shrink-0 border border-emerald-500/40">
                  🌊
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-slate-100">
                      5. ドラムヘッド・ベッセル膜振動＆シンバル物理シマー
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      視覚ダイナミクス
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    打面を叩いた瞬間に同心円状に広がるベッセル関数膜振動波、シンバル打撃時の3D回転傾き＆レイジング溝の金属シマー振動、バスドラムの空気抜き穴から噴き出す重低音サブベース衝撃波をリアルタイム描画！
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ALL CORE ADVANTAGES GRID */}
          <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-slate-800/80 space-y-2">
            <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Poko-poko Beats の充実した基本性能
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span>🌟</span>
                <span>100曲ドラムRPGスクール</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span>🎼</span>
                <span>正統派5線譜ドラムレーン</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span>🥁</span>
                <span>立体3Dリアルドラムセット</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span>⏱️</span>
                <span>ミリ秒レイテンシー校正</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span>🏆</span>
                <span>全100曲全国ランキング</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span>🐱</span>
                <span>3匹の専属ドラムコーチ</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTION */}
        <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-900 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition"
          >
            閉じる
          </button>

          <button
            onClick={() => {
              onClose();
              if (onStartPlaying) onStartPlaying();
            }}
            className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg border-2 border-white/60 hover:opacity-95 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>今すぐ新機能でプレイする！</span>
          </button>
        </div>
      </div>
    </div>
  );
};
