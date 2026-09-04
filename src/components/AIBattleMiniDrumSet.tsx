import React, { useEffect, useState } from 'react';
import { DrumPartId, AILevel, AIBattleState, JudgmentType } from '../types';
import { AI_LEVEL_PROFILES } from '../data/aiBattleConfig';
import { Bot, Trophy, Flame, AlertCircle } from 'lucide-react';

interface AIBattleMiniDrumSetProps {
  aiLevel: AILevel;
  aiState?: AIBattleState;
  playerScore?: number;
  playerCombo?: number;
  isFever?: boolean;
  // Alternative loose props for compatibility
  aiScore?: number;
  aiCombo?: number;
  aiAccuracy?: number;
  lastHitPart?: DrumPartId | null;
  lastJudgment?: JudgmentType | null;
  deviceMode?: 'mobile' | 'tablet' | 'desktop';
}

export const AIBattleMiniDrumSet: React.FC<AIBattleMiniDrumSetProps> = ({
  aiLevel,
  aiState,
  playerScore = 0,
  playerCombo = 0,
  isFever = false,
  aiScore,
  aiCombo,
  aiAccuracy,
  lastHitPart,
  lastJudgment,
}) => {
  const profile = AI_LEVEL_PROFILES[aiLevel] || AI_LEVEL_PROFILES.intermediate;
  
  const effectiveScore = aiState?.score ?? aiScore ?? 0;
  const effectiveCombo = aiState?.combo ?? aiCombo ?? 0;
  const effectiveAccuracy = aiState?.accuracy ?? aiAccuracy ?? 100;
  const effectivePart = aiState?.activePart ?? lastHitPart ?? null;
  const effectiveLastJudgment = aiState?.lastJudgment ?? lastJudgment ?? null;

  const scoreDiff = playerScore - effectiveScore;
  const isPlayerWinning = scoreDiff >= 0;

  // Active hit drum part feedback in mini drum set
  const activePart = effectivePart;

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-2 bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-2 border-indigo-500/40 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-md select-none">
      {/* BACKGROUND AMBIENT GLOW */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: profile.color }}
      />

      {/* TOP HEADER: AI PROFILE & SCORE COMPARISON */}
      <div className="w-full flex items-center justify-between gap-1 pb-1 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shadow border border-white/30 shrink-0"
            style={{ backgroundColor: profile.color }}
          >
            🤖
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-black text-white truncate max-w-[90px]">
                {profile.name}
              </span>
              <span
                className="text-[9px] px-1 py-0.2 rounded font-black text-slate-950 uppercase"
                style={{ backgroundColor: profile.color }}
              >
                {profile.title}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">
              AI精度: {effectiveAccuracy}%
            </span>
          </div>
        </div>

        {/* Real-time Win/Loss Lead Indicator */}
        <div
          className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-black border flex items-center gap-1 shadow-sm ${
            isPlayerWinning
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-300 animate-pulse'
          }`}
        >
          {isPlayerWinning ? (
            <>
              <Trophy className="w-3 h-3 text-emerald-400" />
              <span>+{scoreDiff.toLocaleString()}pt 優勢</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 text-rose-400" />
              <span>AIリード {Math.abs(scoreDiff).toLocaleString()}pt</span>
            </>
          )}
        </div>
      </div>

      {/* MINI DRUM SET VISUAL STAGE (AIの演奏に合わせてリアルタイム発光・打撃) */}
      <div className="relative w-full aspect-[4/3] max-h-[145px] my-auto flex flex-col justify-between p-1">
        {/* Stage Base Rug */}
        <div className="absolute inset-1 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner -z-0" />

        {/* AI Hit Judgment Floating Badge */}
        {effectiveLastJudgment && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-in fade-in zoom-in-90 duration-150">
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-black font-mono shadow border ${
                effectiveLastJudgment === 'PERFECT'
                  ? 'bg-amber-500/90 text-slate-950 border-amber-300'
                  : effectiveLastJudgment === 'GREAT'
                  ? 'bg-cyan-500/90 text-slate-950 border-cyan-300'
                  : effectiveLastJudgment === 'GOOD'
                  ? 'bg-emerald-500/90 text-slate-950 border-emerald-300'
                  : 'bg-rose-600/90 text-white border-rose-400'
              }`}
            >
              {effectiveLastJudgment === 'MISS' ? 'MISS 💦' : effectiveLastJudgment}
            </span>
          </div>
        )}

        {/* Mini Cymbals Row: Crash & Ride */}
        <div className="relative z-10 flex items-center justify-between px-2">
          {/* Crash */}
          <div
            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-[7px] font-black transition-all duration-100 ${
              activePart === 'crash'
                ? 'bg-amber-300 text-slate-950 scale-110 shadow-[0_0_12px_#f59e0b] border-white'
                : 'bg-amber-600/60 text-amber-200 border-amber-500/50'
            }`}
          >
            CRASH
          </div>

          {/* AI Virtual Drumsticks Indicator */}
          <div className="flex items-center gap-1 opacity-70">
            <div
              className={`w-1 h-5 rounded-full bg-slate-400 transition-transform ${
                activePart ? '-rotate-45 scale-110' : '-rotate-15'
              }`}
            />
            <div
              className={`w-1 h-5 rounded-full bg-slate-400 transition-transform ${
                activePart ? 'rotate-45 scale-110' : 'rotate-15'
              }`}
            />
          </div>

          {/* Ride */}
          <div
            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-[7px] font-black transition-all duration-100 ${
              activePart === 'ride'
                ? 'bg-amber-300 text-slate-950 scale-110 shadow-[0_0_12px_#f59e0b] border-white'
                : 'bg-amber-600/60 text-amber-200 border-amber-500/50'
            }`}
          >
            RIDE
          </div>
        </div>

        {/* Mini Toms Row */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          <div
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[6px] font-black transition-all duration-100 ${
              activePart === 'tomHigh'
                ? 'bg-purple-400 text-slate-950 scale-110 shadow-[0_0_10px_#a855f7] border-white'
                : 'bg-purple-950/80 text-purple-300 border-purple-500/40'
            }`}
          >
            TOM1
          </div>
          <div
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[6px] font-black transition-all duration-100 ${
              activePart === 'tomLow'
                ? 'bg-indigo-400 text-slate-950 scale-110 shadow-[0_0_10px_#6366f1] border-white'
                : 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
            }`}
          >
            TOM2
          </div>
        </div>

        {/* Mini Snare, Hi-hat, Kick row */}
        <div className="relative z-10 flex items-center justify-around px-1">
          {/* Hi-Hat */}
          <div
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[7px] font-black transition-all duration-100 ${
              activePart === 'hihatClosed' || activePart === 'hihatOpen'
                ? 'bg-emerald-300 text-slate-950 scale-110 shadow-[0_0_10px_#10b981] border-white'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
            }`}
          >
            H-HAT
          </div>

          {/* Snare */}
          <div
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-[8px] font-black transition-all duration-100 ${
              activePart === 'snare'
                ? 'bg-cyan-300 text-slate-950 scale-110 shadow-[0_0_14px_#06b6d4] border-white'
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
            }`}
          >
            SNARE
          </div>

          {/* Kick */}
          <div
            className={`w-11 h-9 rounded-xl border-2 flex items-center justify-center text-[8px] font-black transition-all duration-100 ${
              activePart === 'kick'
                ? 'bg-amber-400 text-slate-950 scale-105 shadow-[0_0_14px_#f59e0b] border-white'
                : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
            }`}
          >
            KICK
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER: AI SCORE & COMBO */}
      <div className="w-full flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] font-mono">
        <div className="flex items-center gap-1 text-slate-300">
          <span>AI SCORE:</span>
          <strong className="text-white font-bold">{effectiveScore.toLocaleString()}</strong>
        </div>
        <div className="flex items-center gap-1 text-amber-300 font-bold">
          <Flame className="w-3 h-3 text-amber-400" />
          <span>{effectiveCombo} COMBO</span>
        </div>
      </div>
    </div>
  );
};
