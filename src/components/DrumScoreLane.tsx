import React, { useMemo } from 'react';
import { RhythmNote, DrumPartId, SongData } from '../types';
import { DRUM_PARTS } from '../data/drumConfig';

interface DrumScoreLaneProps {
  notes: RhythmNote[];
  currentTime: number;
  bpm: number;
  timeSignature?: string;
  speedMultiplier?: number; // scroll speed
  upcomingNotePart?: DrumPartId | null;
}

// Notation vertical line position on a standard 5-line drum staff:
// 0: Crash / Ride (above top line)
// 1: Hi-Hat Open / Closed (top line / 4th space)
// 2: High Tom (4th line)
// 3: Low Tom (3rd line)
// 4: Snare (3rd space - center of staff)
// 5: Floor Tom (1st space)
// 6: Bass Drum (Kick) (below bottom line)
const PART_STAFF_POSITION: Record<DrumPartId, { row: number; symbol: string; label: string }> = {
  crash: { row: 0, symbol: '⨂', label: 'CR' },
  ride: { row: 0, symbol: '×', label: 'RD' },
  hihatOpen: { row: 1, symbol: '⊗', label: 'HHO' },
  hihatClosed: { row: 1, symbol: '×', label: 'HH' },
  tomHigh: { row: 2, symbol: '●', label: 'HT' },
  tomLow: { row: 3, symbol: '●', label: 'LT' },
  snare: { row: 4, symbol: '●', label: 'SN' },
  tomFloor: { row: 5, symbol: '●', label: 'FT' },
  kick: { row: 6, symbol: '●', label: 'BD' },
};

export const DrumScoreLane: React.FC<DrumScoreLaneProps> = ({
  notes,
  currentTime,
  bpm,
  timeSignature = '4/4',
  speedMultiplier = 1.0,
  upcomingNotePart,
}) => {
  // Look-ahead window in seconds (e.g. show notes 2.5 seconds into the future)
  const windowSeconds = 2.4 / speedMultiplier;

  // Filter notes in current visible window: from slightly past (-0.2s) to ahead (+2.4s)
  const visibleNotes = useMemo(() => {
    return notes.filter((n) => {
      const diff = n.time - currentTime;
      return diff >= -0.25 && diff <= windowSeconds;
    });
  }, [notes, currentTime, windowSeconds]);

  // Identify next upcoming notes in next 0.8s for read-ahead preview HUD
  const nextNotes = useMemo(() => {
    const upcoming = notes
      .filter((n) => !n.hit && !n.missed && n.time >= currentTime && n.time <= currentTime + 0.85)
      .sort((a, b) => a.time - b.time);
    return upcoming.slice(0, 3);
  }, [notes, currentTime]);

  return (
    <div className="relative w-full max-w-lg mx-auto select-none">
      {/* HUD Bar above notation */}
      <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-slate-400 bg-slate-900/90 rounded-t-2xl border-t border-x border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 flex items-center gap-1 font-mono">
            <span>🎼</span> ドラム譜面（五線譜レーン）
          </span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-cyan-400">{bpm} BPM</span>
        </div>

        {/* Read-Ahead Assistant HUD: Next incoming beat */}
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-slate-500 text-[9px]">NEXT:</span>
          {nextNotes.length > 0 ? (
            <div className="flex items-center gap-1">
              {nextNotes.map((n, idx) => {
                const conf = DRUM_PARTS[n.part];
                return (
                  <span
                    key={n.id || idx}
                    className={`px-1.5 py-0.2 rounded text-[9px] font-black border animate-pulse ${
                      idx === 0
                        ? 'bg-amber-500/30 text-amber-200 border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {conf.shortName}
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-slate-600 text-[9px]">待機中</span>
          )}
        </div>
      </div>

      {/* Main Notation Lane Staff Canvas */}
      <div className="relative w-full h-24 sm:h-28 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-x border-slate-800 rounded-b-2xl overflow-hidden shadow-inner flex flex-col justify-center">
        {/* Subtle Drum Staff Clef & Lines (5 lines) */}
        <div className="absolute inset-0 flex flex-col justify-between py-3.5 px-0 pointer-events-none opacity-40">
          <div className="w-full h-[1px] bg-slate-600" />
          <div className="w-full h-[1px] bg-slate-600" />
          <div className="w-full h-[1px] bg-slate-600" />
          <div className="w-full h-[1px] bg-slate-600" />
          <div className="w-full h-[1px] bg-slate-600" />
        </div>

        {/* Percussion Clef Symbol 𝄢 / Drum clef bars on the left */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none z-10 opacity-70">
          <div className="w-1.5 h-14 bg-slate-400 rounded-sm" />
          <div className="w-1 h-14 bg-slate-500 rounded-sm" />
          <span className="text-xs font-black font-mono text-slate-400 ml-0.5">🥁</span>
        </div>

        {/* TARGET / STRIKE LINE (判定ライン) on left (~65px from left edge) */}
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center justify-between"
          style={{ left: '72px' }}
        >
          {/* Top Target Marker */}
          <div className="w-3 h-2 bg-amber-400 rounded-b shadow-[0_0_10px_#f59e0b] -translate-x-1/2" />

          {/* Glowing Vertical Hit Line */}
          <div className="w-[3px] h-full bg-gradient-to-b from-amber-400 via-pink-400 to-cyan-400 shadow-[0_0_12px_rgba(245,158,11,0.8)] opacity-90" />

          {/* Bottom Target Marker */}
          <div className="w-3 h-2 bg-amber-400 rounded-t shadow-[0_0_10px_#f59e0b] -translate-x-1/2" />
        </div>

        {/* Strike Zone Glow Aura */}
        <div
          className="absolute top-0 bottom-0 w-12 bg-gradient-to-r from-amber-500/15 via-pink-500/20 to-transparent pointer-events-none z-10"
          style={{ left: '50px' }}
        />

        {/* Flowing Notes Stream */}
        <div className="relative w-full h-full">
          {visibleNotes.map((note) => {
            const timeDiff = note.time - currentTime;
            // Strike line is at ~72px. The rest of width (from 72px to 100%) corresponds to windowSeconds.
            // When timeDiff === 0, position is exactly 72px.
            // When timeDiff === windowSeconds, position is ~100%.
            const progress = timeDiff / windowSeconds; // 0 to 1
            const leftPercent = 14 + progress * 82; // 14% corresponds to 72px

            const staffInfo = PART_STAFF_POSITION[note.part];
            const partConfig = DRUM_PARTS[note.part];
            // Row 0 (top) to 6 (bottom)
            const topPercent = 12 + staffInfo.row * 12.5;

            const isImminent = Math.abs(timeDiff) <= 0.08;
            const isReadAhead = timeDiff > 0 && timeDiff <= 0.45;

            return (
              <div
                key={note.id}
                className="absolute transition-transform duration-75 flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  opacity: note.hit ? 0 : note.missed ? 0.3 : 1,
                  filter: note.missed ? 'grayscale(100%)' : undefined,
                }}
              >
                {/* Note Head with Drum Symbol & Color */}
                <div
                  className={`relative flex items-center justify-center rounded-full font-black select-none transition-transform ${
                    isImminent
                      ? 'scale-125 shadow-[0_0_15px_#fff]'
                      : isReadAhead
                      ? 'scale-110 shadow-[0_0_10px_currentColor]'
                      : 'scale-100'
                  }`}
                  style={{
                    width: '26px',
                    height: '24px',
                    backgroundColor: partConfig.color,
                    color: note.part.includes('hihat') || note.part === 'crash' || note.part === 'ride' ? '#18181b' : '#ffffff',
                    boxShadow: `0 0 8px ${partConfig.glowColor}`,
                    border: '1.5px solid rgba(255,255,255,0.7)',
                  }}
                >
                  {/* Stem of the musical note */}
                  <div
                    className="absolute bottom-1/2 right-1 w-[2px] h-5 bg-slate-200 pointer-events-none"
                    style={{
                      transformOrigin: 'bottom',
                      backgroundColor: partConfig.color,
                    }}
                  />

                  {/* Drum notation symbol (x, circle-x, or solid note) */}
                  <span className="text-[12px] leading-none drop-shadow font-extrabold">
                    {staffInfo.symbol}
                  </span>
                </div>

                {/* Sub-label under note for absolute clarity (e.g. SN, BD, HH) */}
                <span
                  className="text-[8px] font-black font-mono tracking-tighter px-1 rounded-sm bg-black/75 mt-0.5 border border-white/20 whitespace-nowrap"
                  style={{ color: partConfig.color }}
                >
                  {staffInfo.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Guide label right bottom: 流れてくる音符に合わせて準備！ */}
        <div className="absolute right-2 bottom-1 pointer-events-none text-[9px] font-mono text-slate-500 bg-slate-950/70 px-1.5 py-0.2 rounded border border-slate-800">
          ▶ 判定線に重なる瞬間に叩く！
        </div>
      </div>
    </div>
  );
};
