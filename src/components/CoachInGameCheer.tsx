import React, { useState, useEffect } from 'react';
import { RPGCoach } from '../types';

interface CoachInGameCheerProps {
  coach: RPGCoach;
  combo: number;
  isFever: boolean;
  lastJudgmentType?: 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS' | null;
  rpgLevel?: number;
}

export const CoachInGameCheer: React.FC<CoachInGameCheerProps> = ({
  coach,
  combo,
  isFever,
  lastJudgmentType,
  rpgLevel,
}) => {
  const [currentQuote, setCurrentQuote] = useState<string>(coach.cheerQuotes.start[0]);
  const [quoteKey, setQuoteKey] = useState<number>(0);
  const [isTalking, setIsTalking] = useState<boolean>(true);

  // Pick quotes reactively based on rhythm gameplay events
  useEffect(() => {
    let chosen = '';

    if (lastJudgmentType === 'MISS') {
      const misses = coach.cheerQuotes.miss;
      chosen = misses[Math.floor(Math.random() * misses.length)];
    } else if (isFever) {
      const fevers = coach.cheerQuotes.fever;
      chosen = fevers[Math.floor(Math.random() * fevers.length)];
    } else if (combo > 0 && combo % 15 === 0) {
      const combos = coach.cheerQuotes.combo;
      chosen = combos[Math.floor(Math.random() * combos.length)];
    } else if (lastJudgmentType === 'PERFECT' && Math.random() < 0.25) {
      const onBeats = coach.cheerQuotes.onBeat;
      chosen = onBeats[Math.floor(Math.random() * onBeats.length)];
    }

    if (chosen && chosen !== currentQuote) {
      setCurrentQuote(chosen);
      setQuoteKey((prev) => prev + 1);
      setIsTalking(true);
      const timer = setTimeout(() => setIsTalking(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [combo, isFever, lastJudgmentType, coach]);

  return (
    <div className="flex items-start gap-2 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-slate-800 shadow-xl max-w-[210px] sm:max-w-[260px] z-30 pointer-events-none">
      {/* Coach Animated Avatar */}
      <div className="relative flex-shrink-0 flex flex-col items-center">
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${coach.avatarBg} border flex items-center justify-center text-xl sm:text-2xl shadow-md transition-transform ${
            isFever ? 'animate-bounce' : isTalking ? 'scale-105' : 'scale-100'
          }`}
        >
          <span>{coach.emoji}</span>
        </div>
        {rpgLevel && (
          <span className="text-[8px] font-mono font-black text-amber-300 bg-black/80 px-1 rounded -mt-1 border border-amber-500/40">
            Lv.{rpgLevel}
          </span>
        )}
      </div>

      {/* Coach Info & Speech Bubble */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-[10px] font-black text-white truncate" style={{ color: coach.color }}>
            {coach.name}
          </span>
          <span className="text-[8px] font-medium text-slate-400 bg-slate-800 px-1 py-0.2 rounded whitespace-nowrap">
            専属コーチ
          </span>
        </div>

        {/* Dynamic Encouraging Speech Bubble */}
        <div
          key={quoteKey}
          className="relative bg-slate-950/80 rounded-xl p-1.5 border border-slate-700/80 text-[10px] text-slate-200 leading-snug animate-fadeIn shadow-inner"
        >
          {/* Arrow pointing to avatar */}
          <div className="absolute -left-1 top-2 w-1.5 h-1.5 bg-slate-950 border-l border-t border-slate-700/80 -rotate-45" />
          <p className="line-clamp-2">{currentQuote}</p>
        </div>
      </div>
    </div>
  );
};
