import React, { useEffect, useState } from 'react';
import { MascotId } from '../types';
import { MASCOTS } from '../data/mascots';

interface MascotCharacterProps {
  mascotId: MascotId;
  reaction?: 'idle' | 'good' | 'combo' | 'fever' | 'miss' | 'clear';
  combo?: number;
  isFever?: boolean;
  score?: number;
  className?: string;
  showSpeechBubble?: boolean;
}

export const MascotCharacter: React.FC<MascotCharacterProps> = ({
  mascotId,
  reaction = 'idle',
  combo = 0,
  isFever = false,
  className = '',
  showSpeechBubble = true,
}) => {
  const mascot = MASCOTS[mascotId] || MASCOTS.pokota;
  const [currentQuote, setCurrentQuote] = useState<string>('');
  const [bounceAnim, setBounceAnim] = useState<string>('animate-bounce-slow');

  // Update speech quote when reaction or combo milestones happen
  useEffect(() => {
    let quoteList = mascot.cheerQuotes.idle;

    if (reaction === 'clear') {
      quoteList = mascot.cheerQuotes.clear;
      setBounceAnim('animate-bounce');
    } else if (isFever || reaction === 'fever') {
      quoteList = mascot.cheerQuotes.fever;
      setBounceAnim('animate-ping-once');
    } else if (reaction === 'miss') {
      quoteList = mascot.cheerQuotes.miss;
      setBounceAnim('animate-wobble');
    } else if (combo > 0 && combo % 10 === 0) {
      quoteList = mascot.cheerQuotes.combo;
      setBounceAnim('animate-bounce');
    } else if (reaction === 'good') {
      quoteList = mascot.cheerQuotes.good;
      setBounceAnim('animate-pulse');
    } else {
      quoteList = mascot.cheerQuotes.idle;
      setBounceAnim('');
    }

    const randomQuote = quoteList[Math.floor(Math.random() * quoteList.length)] || quoteList[0];
    setCurrentQuote(randomQuote);

    const timer = setTimeout(() => {
      setBounceAnim('');
    }, 1200);

    return () => clearTimeout(timer);
  }, [reaction, isFever, Math.floor(combo / 10), mascot]);

  return (
    <div className={`flex items-center gap-2 select-none pointer-events-none ${className}`}>
      {/* Mascot Avatar Figure */}
      <div className="relative group">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${mascot.avatarBg} border-2 border-white shadow-md flex items-center justify-center text-2xl sm:text-3xl transition-transform duration-200 ${
            isFever ? 'scale-110 rotate-6 ring-4 ring-yellow-300' : ''
          } ${bounceAnim}`}
          style={{
            boxShadow: isFever ? `0 0 16px ${mascot.themeColor}` : undefined,
          }}
        >
          <span>{mascot.emoji}</span>

          {/* Little Star / Fever Hat */}
          {isFever && (
            <span className="absolute -top-2 -right-1 text-sm animate-spin">👑</span>
          )}
        </div>

        {/* Mascot Name Badge */}
        <div className="absolute -bottom-2 inset-x-0 flex justify-center">
          <span className="bg-slate-900/90 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white/20 whitespace-nowrap shadow">
            {mascot.name}
          </span>
        </div>
      </div>

      {/* Pop Bubble Speech Quote */}
      {showSpeechBubble && currentQuote && (
        <div className="relative max-w-[200px] sm:max-w-[240px] bg-white/95 text-slate-800 px-3 py-1.5 rounded-2xl rounded-tl-none shadow-lg border border-pink-200 text-xs font-bold leading-tight animate-fade-in">
          {/* Bubble tail */}
          <div className="absolute -left-1.5 top-2 w-2 h-2 bg-white rotate-45 border-l border-b border-pink-200" />
          <span className="relative z-10 text-[11px] sm:text-xs">
            {currentQuote}
          </span>
        </div>
      )}
    </div>
  );
};
