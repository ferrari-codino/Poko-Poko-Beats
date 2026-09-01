import React from 'react';
import { JudgmentFeedback } from '../types';

interface HitBurstEffectProps {
  feedbacks: JudgmentFeedback[];
  combo: number;
  isFever: boolean;
}

export const HitBurstEffect: React.FC<HitBurstEffectProps> = ({
  feedbacks,
  combo,
  isFever,
}) => {
  const latestFeedback = feedbacks[feedbacks.length - 1];

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col items-center justify-start pt-3 overflow-hidden">
      {/* Screen Edge Glow when in Fever or High Combo */}
      {isFever && (
        <div className="absolute inset-0 border-4 border-amber-400/50 shadow-[inset_0_0_30px_rgba(245,158,11,0.35)] rounded-3xl animate-pulse pointer-events-none" />
      )}
      {!isFever && combo >= 20 && (
        <div className="absolute inset-0 border-2 border-pink-500/30 shadow-[inset_0_0_20px_rgba(236,72,153,0.2)] rounded-3xl pointer-events-none" />
      )}

      {/* Main Combo Display */}
      {combo > 1 && (
        <div className="flex flex-col items-center select-none transform transition-transform duration-100 scale-100">
          <div className="relative flex items-center justify-center">
            {/* Combo Aura Glow */}
            <div
              className={`absolute -inset-2 rounded-full blur-lg opacity-60 ${
                isFever
                  ? 'bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 animate-spin'
                  : combo >= 30
                  ? 'bg-amber-400'
                  : combo >= 10
                  ? 'bg-pink-500'
                  : 'bg-cyan-500'
              }`}
            />

            <span
              className={`relative text-4xl sm:text-5xl font-black font-mono tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] ${
                isFever
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-amber-300 animate-pulse'
                  : combo >= 30
                  ? 'text-amber-300'
                  : combo >= 10
                  ? 'text-pink-300'
                  : 'text-cyan-300'
              }`}
            >
              {combo}
            </span>
          </div>

          <div className="flex items-center gap-1 -mt-1">
            <span
              className={`text-[10px] sm:text-xs font-black tracking-widest uppercase px-2 py-0.2 rounded-full shadow-md ${
                isFever
                  ? 'bg-gradient-to-r from-amber-500 to-pink-500 text-white animate-bounce'
                  : 'bg-slate-900/90 text-amber-400 border border-amber-400/40'
              }`}
            >
              {isFever ? '⚡ FEVER COMBO ⚡' : 'COMBO'}
            </span>
          </div>
        </div>
      )}

      {/* Judgment & English Praise Popups */}
      {latestFeedback && (
        <div
          key={latestFeedback.id}
          className="mt-2 flex flex-col items-center select-none animate-in zoom-in-75 fade-in duration-100"
        >
          {/* Flashy English Exclamation Pill (Cool!, Awesome!, Fantastic!, etc.) */}
          {latestFeedback.exclamation && (
            <div className="relative mb-1">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500 via-amber-400 to-cyan-400 blur-sm opacity-80 animate-pulse" />
              <div className="relative px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-pink-500 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl border-2 border-white flex items-center gap-1 scale-105 transform hover:scale-110 transition-transform">
                <span className="text-sm">✨</span>
                <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  {latestFeedback.exclamation}
                </span>
                <span className="text-sm">🔥</span>
              </div>
            </div>
          )}

          {/* Judgment Badge (PERFECT / GREAT / GOOD / MISS) */}
          <div className="flex items-center gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-black tracking-widest uppercase filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] ${
                latestFeedback.type === 'PERFECT'
                  ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-orange-400 drop-shadow-[0_0_14px_rgba(245,158,11,0.9)] scale-110'
                  : latestFeedback.type === 'GREAT'
                  ? 'text-transparent bg-clip-text bg-gradient-to-b from-cyan-100 via-cyan-300 to-blue-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                  : latestFeedback.type === 'GOOD'
                  ? 'text-emerald-300'
                  : 'text-rose-500 animate-shake'
              }`}
            >
              {latestFeedback.type}
            </span>
          </div>

          {/* Precision Offset Tag */}
          {latestFeedback.offsetMs !== undefined && latestFeedback.type !== 'MISS' && (
            <span
              className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full mt-0.5 shadow-sm border ${
                Math.abs(latestFeedback.offsetMs) < 20
                  ? 'text-amber-300 bg-amber-950/80 border-amber-500/50'
                  : latestFeedback.offsetMs < 0
                  ? 'text-cyan-300 bg-cyan-950/80 border-cyan-500/50'
                  : 'text-rose-300 bg-rose-950/80 border-rose-500/50'
              }`}
            >
              {Math.abs(latestFeedback.offsetMs) < 15
                ? '⭐ EXACT BEAT ⭐'
                : latestFeedback.offsetMs < 0
                ? `EARLY (${latestFeedback.offsetMs}ms)`
                : `LATE (+${latestFeedback.offsetMs}ms)`}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
