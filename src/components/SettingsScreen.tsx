import React, { useState, useEffect } from 'react';
import { PlayerSettings, DrumLayoutType, PadScale, MascotId } from '../types';
import { drumSynth } from '../audio/drumSynth';
import { MASCOTS } from '../data/mascots';
import { ArrowLeft, Volume2, Sliders, Smartphone, Keyboard, Check, Layout, Sparkles } from 'lucide-react';

interface SettingsScreenProps {
  settings: PlayerSettings;
  onSaveSettings: (newSettings: PlayerSettings) => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onSaveSettings,
  onBack,
}) => {
  const [current, setCurrent] = useState<PlayerSettings>({ ...settings });
  const [calibBeat, setCalibBeat] = useState<number>(0);

  // Calibration metronome tick
  useEffect(() => {
    const interval = setInterval(() => {
      setCalibBeat((prev) => {
        const next = (prev + 1) % 4;
        const ctx = drumSynth.getContext();
        if (ctx) {
          drumSynth.playGuideClick(ctx.currentTime, next === 0);
        }
        return next;
      });
    }, 500); // 120 BPM

    return () => clearInterval(interval);
  }, []);

  const handleCalibrationTap = () => {
    const now = performance.now();
    const periodMs = 500;
    const remainder = now % periodMs;
    const diff = remainder > periodMs / 2 ? remainder - periodMs : remainder;

    setCurrent((c) => ({
      ...c,
      audioOffsetMs: Math.max(-100, Math.min(100, Math.round(-diff))),
    }));

    drumSynth.playDrum('snare');
  };

  const handleSave = () => {
    onSaveSettings(current);
    onBack();
  };

  const layoutOptions: { id: DrumLayoutType; title: string; desc: string; icon: string }[] = [
    { id: 'standard', title: '右利き (標準8パッド)', desc: 'ハイハットが左、フロアタムが右の王道ドラムセット配置', icon: '🥁' },
    { id: 'compact', title: 'かんたん4パッド (幼児・キッズ向け)', desc: '実際のドラムセットと同じ配置！左上クラッシュ・左ハット・中央スネア・下キックの特大パッド', icon: '⭐' },
    { id: 'leftHanded', title: '左利き (ミラー反転)', desc: '左利きの方に最適！ハイハットが右、フロアタムが左', icon: '🖐️' },
    { id: 'wide', title: 'ワイド配置', desc: 'タム3つが上部に綺麗に並んだ広々レイアウト', icon: '⚡' },
  ];

  const scaleOptions: { id: PadScale; title: string; desc: string }[] = [
    { id: 'normal', title: '標準 (100%)', desc: '画面バランス重視' },
    { id: 'large', title: '大きめ (112%)', desc: '押しやすさUP' },
    { id: 'huge', title: '特大 (125%)', desc: 'スマホ画面で叩きやすい！' },
  ];

  return (
    <div className="w-full max-w-xl mx-auto min-h-full flex flex-col justify-between p-3 sm:p-4 select-none animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </button>

        <div className="flex items-center gap-1.5 font-black text-white text-sm sm:text-base">
          <Sliders className="w-4 h-4 text-pink-400" />
          ドラム配置カスタマイズ & 各種設定
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-pink-500 to-amber-500 hover:opacity-95 text-white text-xs font-black transition shadow"
        >
          <Check className="w-4 h-4" />
          保存
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {/* DRUM LAYOUT CUSTOMIZATION (Q2) */}
        <div className="bg-slate-900/90 p-4 rounded-3xl border border-pink-500/30 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-black text-pink-300 mb-2">
            <Layout className="w-4 h-4 text-pink-400" />
            <span>🥁 ドラム配置のカスタマイズ (利き手・かんたんモード)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {layoutOptions.map((opt) => {
              const isSelected = current.drumLayout === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCurrent({ ...current, drumLayout: opt.id })}
                  className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-pink-400 bg-pink-500/20 shadow-md ring-1 ring-pink-400'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl mt-0.5">{opt.icon}</span>
                  <div>
                    <div className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {opt.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                      {opt.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* PAD SIZE SCALE */}
          <div className="pt-2 border-t border-slate-800">
            <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
              ドラムパッドの大きさ (押しやすさ)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {scaleOptions.map((sc) => {
                const isSelected = current.padScale === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setCurrent({ ...current, padScale: sc.id })}
                    className={`py-2 px-2 rounded-xl text-center border transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{sc.title}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* MASCOT PARTNER CUSTOMIZATION */}
        <div className="bg-slate-900/90 p-4 rounded-3xl border border-indigo-500/30 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-black text-indigo-300 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>一緒に応援してくれる相棒キャラクター</span>
          </div>

          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {(Object.keys(MASCOTS) as MascotId[]).map((mId) => {
              const m = MASCOTS[mId];
              const isSelected = current.avatarId === mId;
              return (
                <button
                  key={mId}
                  type="button"
                  onClick={() => setCurrent({ ...current, avatarId: mId })}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-500/20 shadow scale-105 ring-1 ring-indigo-400'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[9px] font-bold text-white mt-0.5 truncate w-full text-center">
                    {m.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TIMING CALIBRATION */}
        <div className="bg-slate-900/90 p-4 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs font-bold text-slate-200">タイミング調整 (レイテンシー補正)</div>
              <div className="text-[10px] text-slate-400">
                音がズレて聴こえる場合はタップテストまたはスライダーで調整
              </div>
            </div>
            <span className="font-mono text-xs font-black text-amber-400 bg-slate-950 px-2 py-0.5 rounded-xl border border-slate-800">
              {current.audioOffsetMs > 0 ? `+${current.audioOffsetMs}` : current.audioOffsetMs} ms
            </span>
          </div>

          {/* Interactive Tap Calibration Test */}
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-center mb-3">
            <div className="flex justify-center items-center gap-2 mb-2">
              {[0, 1, 2, 3].map((b) => (
                <div
                  key={b}
                  className={`w-3 h-3 rounded-full transition-all ${
                    calibBeat === b ? 'bg-amber-400 scale-125 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleCalibrationTap}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-amber-300 text-xs font-bold rounded-xl border border-slate-700 shadow-sm transition"
            >
              メトロノームに合わせてここをタップ (自動補正)
            </button>
          </div>

          <input
            type="range"
            min={-100}
            max={100}
            step={5}
            value={current.audioOffsetMs}
            onChange={(e) => setCurrent({ ...current, audioOffsetMs: Number(e.target.value) })}
            className="w-full accent-amber-500"
          />
        </div>

        {/* 4. ROOM AMBIENCE SIMULATOR PRESET */}
        <div className="bg-slate-900/90 p-4 rounded-3xl border border-indigo-500/30 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>🎙️ スタジオ音響ルーム・シミュレータ (空間リバーブ)</span>
            </div>
            <span className="text-[10px] text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
              プロ仕様
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'dead', title: '70s Dead', desc: '超タイトな密閉ブース', icon: '🎙️' },
              { id: 'vintage', title: 'Vintage Room', desc: '温かいスタジオ初期反射音', icon: '📻' },
              { id: 'arena', title: 'Live Arena', desc: 'スタジアム級の壮大リバーブ', icon: '🏟️' },
            ].map((p) => {
              const isSelected = (current.ambiencePreset || 'vintage') === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    const preset = p.id as any;
                    setCurrent({ ...current, ambiencePreset: preset });
                    drumSynth.setAmbiencePreset(preset);
                    drumSynth.playDrum('snare');
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-500/20 shadow-md ring-1 ring-indigo-400'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-lg">{p.icon}</span>
                    <span className="text-xs font-black text-white">{p.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">{p.desc}</span>
                  {isSelected && (
                    <span className="text-[9px] font-bold text-indigo-300 mt-2 flex items-center gap-1">
                      <Check className="w-3 h-3" /> 選択中 (試聴発音)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* VOLUME MIXER */}
        <div className="bg-slate-900/90 p-4 rounded-3xl border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            音量バランス
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>マスター音量</span>
              <span className="font-mono text-slate-400">{Math.round(current.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={current.masterVolume}
              onChange={(e) => setCurrent({ ...current, masterVolume: Number(e.target.value) })}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>ドラム打撃音</span>
              <span className="font-mono text-slate-400">{Math.round(current.drumVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={current.drumVolume}
              onChange={(e) => setCurrent({ ...current, drumVolume: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>伴奏BGM音量</span>
              <span className="font-mono text-slate-400">{Math.round(current.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={current.musicVolume}
              onChange={(e) => setCurrent({ ...current, musicVolume: Number(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        {/* INPUT & HAPTICS */}
        <div className="bg-slate-900/90 p-4 rounded-3xl border border-slate-800 space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Keyboard className="w-4 h-4 text-slate-400" />
              <span>キーボード割り当てガイドを表示 (PC用)</span>
            </div>
            <input
              type="checkbox"
              checked={current.showKeyHints}
              onChange={(e) => setCurrent({ ...current, showKeyHints: e.target.checked })}
              className="w-4 h-4 accent-pink-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Smartphone className="w-4 h-4 text-slate-400" />
              <span>スマホ振動フィードバック (Haptics)</span>
            </div>
            <input
              type="checkbox"
              checked={current.hapticsEnabled}
              onChange={(e) => setCurrent({ ...current, hapticsEnabled: e.target.checked })}
              className="w-4 h-4 accent-pink-500 rounded"
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="w-full mt-3 py-3.5 bg-gradient-to-r from-pink-500 to-amber-500 hover:opacity-95 active:scale-98 text-white font-black rounded-2xl shadow-lg text-sm transition"
      >
        設定を保存して戻る
      </button>
    </div>
  );
};
