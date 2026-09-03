import React, { useState, useEffect, useRef } from 'react';
import { DrumPartId, PlayerSettings, DrumLayoutType } from '../types';
import { DrumSet } from './DrumSet';
import { drumSynth } from '../audio/drumSynth';
import { ArrowLeft, Play, Square, CircleDot, Volume2, RotateCcw, Activity, Layout } from 'lucide-react';

interface FreePlayScreenProps {
  settings: PlayerSettings;
  onBack: () => void;
}

interface RecordedHit {
  part: DrumPartId;
  time: number; // relative ms from record start
}

export const FreePlayScreen: React.FC<FreePlayScreenProps> = ({ settings, onBack }) => {
  const [bpm, setBpm] = useState<number>(120);
  const [isMetronomePlaying, setIsMetronomePlaying] = useState<boolean>(false);
  const [timeSignature, setTimeSignature] = useState<string>('4/4');
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [currentLayout, setCurrentLayout] = useState<DrumLayoutType>(settings.drumLayout || 'standard');

  // Recording & Loop playback
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlayingLoop, setIsPlayingLoop] = useState<boolean>(false);
  const [recordedHits, setRecordedHits] = useState<RecordedHit[]>([]);
  const recordStartTimeRef = useRef<number>(0);
  const loopTimeoutIdsRef = useRef<number[]>([]);

  // Glowing parts for visual response
  const [activeGlows, setActiveGlows] = useState<Record<DrumPartId, { glowIntensity: number; approachProgress: number }>>({
    kick: { glowIntensity: 0, approachProgress: 0 },
    snare: { glowIntensity: 0, approachProgress: 0 },
    hihatClosed: { glowIntensity: 0, approachProgress: 0 },
    hihatOpen: { glowIntensity: 0, approachProgress: 0 },
    tomHigh: { glowIntensity: 0, approachProgress: 0 },
    tomLow: { glowIntensity: 0, approachProgress: 0 },
    tomFloor: { glowIntensity: 0, approachProgress: 0 },
    crash: { glowIntensity: 0, approachProgress: 0 },
    ride: { glowIntensity: 0, approachProgress: 0 },
  });

  // Metronome tick loop
  useEffect(() => {
    if (!isMetronomePlaying) {
      setCurrentBeat(0);
      return;
    }

    const intervalMs = (60 / bpm) * 1000;
    const beatsInMeasure = timeSignature.startsWith('3') ? 3 : timeSignature.startsWith('6') ? 6 : timeSignature.startsWith('7') ? 7 : 4;

    const timer = setInterval(() => {
      setCurrentBeat((prev) => {
        const next = (prev + 1) % beatsInMeasure;
        const isAccent = next === 0;
        const ctx = drumSynth.getContext();
        if (ctx) {
          drumSynth.playGuideClick(ctx.currentTime, isAccent);
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isMetronomePlaying, bpm, timeSignature]);

  const handleDrumHit = (part: DrumPartId, hitTimestamp: number) => {
    // Record hit if recording
    if (isRecording) {
      const elapsed = performance.now() - recordStartTimeRef.current;
      setRecordedHits((prev) => [...prev, { part, time: elapsed }]);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setRecordedHits([]);
      setIsPlayingLoop(false);
      clearLoop();
      recordStartTimeRef.current = performance.now();
      setIsRecording(true);
    }
  };

  const clearLoop = () => {
    loopTimeoutIdsRef.current.forEach((id) => clearTimeout(id));
    loopTimeoutIdsRef.current = [];
  };

  const toggleLoopPlayback = () => {
    if (isPlayingLoop) {
      setIsPlayingLoop(false);
      clearLoop();
    } else {
      if (recordedHits.length === 0) return;
      setIsPlayingLoop(true);
      playRecordedLoop();
    }
  };

  const playRecordedLoop = () => {
    clearLoop();
    if (recordedHits.length === 0) return;

    const maxTime = Math.max(...recordedHits.map((h) => h.time)) + 500;

    recordedHits.forEach((hit) => {
      const tid = window.setTimeout(() => {
        drumSynth.playDrum(hit.part);
        setActiveGlows((prev) => ({
          ...prev,
          [hit.part]: { glowIntensity: 1, approachProgress: 1 },
        }));
        setTimeout(() => {
          setActiveGlows((prev) => ({
            ...prev,
            [hit.part]: { glowIntensity: 0, approachProgress: 0 },
          }));
        }, 120);
      }, hit.time);
      loopTimeoutIdsRef.current.push(tid);
    });

    // Schedule next loop iteration
    const loopTid = window.setTimeout(() => {
      playRecordedLoop();
    }, maxTime);
    loopTimeoutIdsRef.current.push(loopTid);
  };

  return (
    <div className="w-full max-w-lg mx-auto min-h-full flex flex-col justify-between p-3 sm:p-4 select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <button
          id="freeplay-back-btn"
          onClick={() => {
            clearLoop();
            setIsMetronomePlaying(false);
            onBack();
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </button>

        <div className="flex items-center gap-1.5 font-black text-slate-100 text-sm sm:text-base">
          <span>🥁</span>
          フリー練習＆メトロノーム
        </div>

        <div className="w-12" />
      </div>

      {/* METRONOME & CONTROLS TOOLBAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-2 shadow-md space-y-2.5">
        {/* Metronome Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              id="toggle-metronome-btn"
              onClick={() => setIsMetronomePlaying(!isMetronomePlaying)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                isMetronomePlaying
                  ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${isMetronomePlaying ? 'animate-spin' : ''}`} />
              {isMetronomePlaying ? 'メトロノーム停止' : 'メトロノーム開始'}
            </button>

            {/* Time signature select */}
            <select
              value={timeSignature}
              onChange={(e) => setTimeSignature(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs font-mono font-bold px-2 py-1.5 rounded-xl border border-slate-700"
            >
              <option value="4/4">4/4 拍子</option>
              <option value="3/8">3/8 拍子</option>
              <option value="6/8">6/8 拍子</option>
              <option value="7/8">7/8 拍子</option>
            </select>
          </div>

          {/* BPM Slider & Value */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-amber-400 min-w-[55px] text-right">
              {bpm} BPM
            </span>
            <input
              type="range"
              min={60}
              max={220}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-20 accent-amber-500"
            />
          </div>
        </div>

        {/* Record & Loop Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleRecording}
              className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5" />
              {isRecording ? '録音中 (タップで停止)' : 'ビートを録音'}
            </button>

            {recordedHits.length > 0 && (
              <button
                onClick={toggleLoopPlayback}
                className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition ${
                  isPlayingLoop
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isPlayingLoop ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                {isPlayingLoop ? 'ループ停止' : `再生 (${recordedHits.length}打)`}
              </button>
            )}
          </div>

          {recordedHits.length > 0 && (
            <button
              onClick={() => {
                clearLoop();
                setRecordedHits([]);
                setIsPlayingLoop(false);
              }}
              className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              クリア
            </button>
          )}
        </div>
      </div>

      {/* LAYOUT SELECTOR & DRUM SET */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1.5 w-full">
        {/* Quick layout toggle */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setCurrentLayout('standard')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              currentLayout === 'standard'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>🥁</span>
            <span>8パッド (標準)</span>
          </button>
          <button
            onClick={() => setCurrentLayout('compact')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              currentLayout === 'compact'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>⭐</span>
            <span>幼児用4パッド (実機配置)</span>
          </button>
          <button
            onClick={() => setCurrentLayout('leftHanded')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              currentLayout === 'leftHanded'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>🖐️</span>
            <span>左利き</span>
          </button>
        </div>

        <DrumSet
          onDrumHit={handleDrumHit}
          activeGlowingParts={activeGlows}
          showKeyHints={settings.showKeyHints}
          hapticsEnabled={settings.hapticsEnabled}
          isFreePlay={true}
          drumLayout={currentLayout}
          padScale={settings.padScale || 'normal'}
        />
      </div>

      {/* FOOTER TIP */}
      <div className="text-center text-[11px] text-slate-400 py-1 space-x-1">
        <span className="text-amber-400 font-bold">✨プロドラム奏法対応:</span>
        <span>オープンリムショット [D/R]</span>
        <span>・</span>
        <span>クロススティック [X]</span>
        <span>・</span>
        <span>ライドベル [U]</span>
        <span>・</span>
        <span>クラッシュ消音 [Z]</span>
        <span>・</span>
        <span>ハイハット消音 [P]</span>
        <span>・</span>
        <span>Moongelミュート [GEL]</span>
      </div>
    </div>
  );
};
