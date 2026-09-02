import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DrumPartId, DrumLayoutType, PadScale } from '../types';
import { DRUM_PARTS } from '../data/drumConfig';
import { drumSynth } from '../audio/drumSynth';
import { Lock } from 'lucide-react';

interface DrumSetProps {
  onDrumHit: (part: DrumPartId, hitTimestamp: number) => void;
  activeGlowingParts: Record<DrumPartId, { glowIntensity: number; approachProgress: number; noteId?: string }>;
  showKeyHints?: boolean;
  hapticsEnabled?: boolean;
  isFreePlay?: boolean;
  drumLayout?: DrumLayoutType;
  padScale?: PadScale;
  unlockedParts?: DrumPartId[];
  prepareTargetPart?: DrumPartId | null;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  emoji?: string;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rotation: number;
}

export const DrumSet: React.FC<DrumSetProps> = ({
  onDrumHit,
  activeGlowingParts,
  showKeyHints = true,
  hapticsEnabled = true,
  isFreePlay = false,
  drumLayout = 'standard',
  padScale = 'normal',
  unlockedParts,
  prepareTargetPart,
}) => {
  const [pressedParts, setPressedParts] = useState<Record<string, boolean>>({});
  const [wobbleRotations, setWobbleRotations] = useState<Record<string, number>>({});
  const [particles, setParticles] = useState<Particle[]>([]);
  const [kickPulse, setKickPulse] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if a part is unlocked in current RPG/training session
  const isPartUnlocked = useCallback(
    (part: DrumPartId) => {
      if (!unlockedParts) return true;
      return unlockedParts.includes(part);
    },
    [unlockedParts]
  );

  // Spawn visual sparkle particles when drum is struck
  const spawnHitParticles = useCallback((part: DrumPartId, clientX?: number, clientY?: number) => {
    const config = DRUM_PARTS[part];
    let originX = window.innerWidth / 2;
    let originY = window.innerHeight / 2;

    if (clientX && clientY && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      originX = clientX - rect.left;
      originY = clientY - rect.top;
    }

    const cuteEmojis = ['⭐', '✨', '⚡', '💫', '🔥'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 7; i++) {
      const angle = (Math.PI * 2 * i) / 7 + (Math.random() - 0.5);
      const speed = 3.0 + Math.random() * 4.5;
      const isEmoji = i === 0;
      newParticles.push({
        id: Date.now() + Math.random() + i,
        x: originX,
        y: originY,
        color: config.color,
        emoji: isEmoji ? cuteEmojis[Math.floor(Math.random() * cuteEmojis.length)] : undefined,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: isEmoji ? 18 : 5 + Math.random() * 6,
        alpha: 1,
        rotation: Math.random() * 360,
      });
    }

    setParticles((prev) => [...prev.slice(-25), ...newParticles]);
  }, []);

  // Particle physics update loop
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.16, // gravity
            rotation: p.rotation + 4,
            alpha: p.alpha - 0.065,
            size: p.size * 0.96,
          }))
          .filter((p) => p.alpha > 0.05)
      );
    }, 16);
    return () => clearInterval(interval);
  }, [particles.length]);

  // Handle striking a drum pad
  const handleHit = useCallback(
    (part: DrumPartId, e?: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
      // If part is locked in training curriculum, do not trigger
      if (!isPartUnlocked(part)) {
        return;
      }

      // Haptic feedback
      if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(24);
        } catch {}
      }

      // Play synthesized acoustic sound
      drumSynth.playDrum(part);

      const now = performance.now();

      // Trigger realistic physical wobble for cymbals or head depression for drums
      setPressedParts((prev) => ({ ...prev, [part]: true }));
      const wobbleDeg = (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 8);
      setWobbleRotations((prev) => ({ ...prev, [part]: wobbleDeg }));

      if (part === 'kick') {
        setKickPulse(true);
        setTimeout(() => setKickPulse(false), 140);
      }

      setTimeout(() => {
        setPressedParts((prev) => ({ ...prev, [part]: false }));
        setWobbleRotations((prev) => ({ ...prev, [part]: 0 }));
      }, 160);

      // Notify parent game loop
      onDrumHit(part, now);

      // Particle sparkles
      let cx: number | undefined;
      let cy: number | undefined;
      if (e && 'clientX' in e && e.clientX) {
        cx = e.clientX;
        cy = e.clientY;
      }
      spawnHitParticles(part, cx, cy);
    },
    [hapticsEnabled, onDrumHit, isPartUnlocked, spawnHitParticles]
  );

  // Keyboard controls listener
  useEffect(() => {
    const keyMap: Record<string, DrumPartId> = {
      ' ': 'kick',
      b: 'kick',
      B: 'kick',
      s: 'snare',
      S: 'snare',
      d: 'snare',
      D: 'snare',
      h: 'hihatClosed',
      H: 'hihatClosed',
      j: 'hihatClosed',
      J: 'hihatClosed',
      o: 'hihatOpen',
      O: 'hihatOpen',
      k: 'hihatOpen',
      K: 'hihatOpen',
      t: 'tomHigh',
      T: 'tomHigh',
      y: 'tomLow',
      Y: 'tomLow',
      f: 'tomFloor',
      F: 'tomFloor',
      g: 'tomFloor',
      G: 'tomFloor',
      c: 'crash',
      C: 'crash',
      r: 'ride',
      R: 'ride',
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.repeat) return;
      let part = keyMap[ev.key];
      // In compact (toddler 4-pad) mode, redirect toms to snare, ride to crash, open-hat to closed-hat
      if (drumLayout === 'compact' && part) {
        if (part === 'tomHigh' || part === 'tomLow' || part === 'tomFloor') part = 'snare';
        if (part === 'ride') part = 'crash';
        if (part === 'hihatOpen') part = 'hihatClosed';
      }
      if (part) {
        handleHit(part);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleHit]);

  // Helper to render 3D-angled drum or cymbal pad
  const render3DPad = (
    part: DrumPartId,
    customClass: string = '',
    customStyle?: React.CSSProperties
  ) => {
    const config = DRUM_PARTS[part];
    const glowInfo = activeGlowingParts[part] || { glowIntensity: 0, approachProgress: 0 };
    const isPressed = !!pressedParts[part];
    const wobble = wobbleRotations[part] || 0;
    const isUnlocked = isPartUnlocked(part);
    const isCymbal = part === 'crash' || part === 'ride' || part === 'hihatClosed' || part === 'hihatOpen';
    const isKick = part === 'kick';
    const isSnare = part === 'snare';
    const isFloorTom = part === 'tomFloor';
    const isTom = part === 'tomHigh' || part === 'tomLow';

    const approach = glowInfo.approachProgress;
    const isGlowing = glowInfo.glowIntensity > 0.05;
    const isPrepareActive = (approach > 0 && approach < 1) || prepareTargetPart === part;

    // Pad scale adjustment
    const baseScale = padScale === 'huge' ? 1.12 : padScale === 'large' ? 1.06 : 1.0;
    const compactScaleMultiplier = drumLayout === 'compact' ? 1.08 : 1.0;
    const scaleFactor = baseScale * compactScaleMultiplier;

    return (
      <div
        key={part}
        id={`drum-pad-${part}`}
        onPointerDown={(e) => {
          e.preventDefault();
          handleHit(part, e);
        }}
        className={`group relative flex items-center justify-center cursor-pointer select-none touch-none transition-all duration-75 ${
          !isUnlocked ? 'opacity-35 grayscale pointer-events-none' : ''
        } ${customClass}`}
        style={{
          transform: `scale(${isPressed ? scaleFactor * 0.94 : scaleFactor}) rotate(${wobble}deg)`,
          transformOrigin: isCymbal ? 'center' : 'bottom center',
          ...customStyle,
        }}
      >
        {/* READ-AHEAD "PREPARE" COUNTDOWN RING (先読みガイドオーラ) */}
        {isUnlocked && isPrepareActive && approach > 0 && approach < 1 && (
          <div
            className="absolute rounded-full pointer-events-none transition-all duration-75"
            style={{
              border: `3px solid ${config.color}`,
              width: `${100 + (1 - approach) * 110}%`,
              height: `${100 + (1 - approach) * 110}%`,
              opacity: Math.min(1, approach * 1.8),
              boxShadow: `0 0 16px ${config.glowColor}, inset 0 0 8px ${config.glowColor}`,
            }}
          >
            {/* Small PREPARE tag over drum pad */}
            <span
              className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-mono tracking-tighter whitespace-nowrap shadow"
            >
              PREPARE!
            </span>
          </div>
        )}

        {/* HIT GLOW BURST HALO */}
        {isGlowing && isUnlocked && (
          <div
            className="absolute inset-[-8px] rounded-full animate-ping pointer-events-none"
            style={{
              backgroundColor: config.glowColor,
              opacity: glowInfo.glowIntensity * 0.75,
            }}
          />
        )}

        {/* 3D CYLINDER SHELL DEPTH & HARDWARE */}
        {/* Render realistic 3D angled Drum / Cymbal Body */}
        {isCymbal ? (
          // REALISTIC HAMMERED BRONZE CYMBAL (斜めに傾いたブームシンバル)
          <div
            className="relative w-full h-full rounded-full flex items-center justify-center border-2 transition-transform shadow-2xl"
            style={{
              borderColor: isGlowing ? config.color : '#b45309',
              background: isGlowing
                ? `radial-gradient(circle at 35% 35%, #fef08a 0%, ${config.color} 50%, #92400e 100%)`
                : 'radial-gradient(circle at 35% 35%, #fde047 0%, #d97706 45%, #92400e 80%, #713f12 100%)',
              boxShadow: isGlowing
                ? `0 0 20px ${config.glowColor}, 0 8px 24px rgba(0,0,0,0.6)`
                : '0 8px 20px rgba(0,0,0,0.6), inset 0 2px 5px rgba(255,255,255,0.4)',
              transform: 'rotateX(20deg)',
            }}
          >
            {/* Concentric Lathe Grooves (レイジングライン) */}
            <div className="absolute inset-2 rounded-full border border-amber-800/40 pointer-events-none" />
            <div className="absolute inset-4 rounded-full border border-amber-900/30 pointer-events-none" />

            {/* Cymbal Center Raised Bell Cup (カップ) */}
            <div className="w-1/3 h-1/3 rounded-full bg-gradient-to-br from-amber-200 to-amber-700 border border-amber-950 shadow-md flex items-center justify-center pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-950 shadow-inner" />
            </div>

            {/* Cymbal Tilter & Boom Stand Arm under cymbal */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-2 h-4 bg-gradient-to-r from-slate-400 to-slate-600 rounded-b shadow pointer-events-none z-[-1]" />
          </div>
        ) : isKick ? (
          // REALISTIC 22" BASS DRUM (大きな円筒シェルとフロントヘッド、フットペダル)
          <div
            className={`relative w-full h-full rounded-3xl border-4 transition-all duration-75 flex flex-col items-center justify-between p-2 shadow-2xl ${
              kickPulse ? 'scale-105' : ''
            }`}
            style={{
              borderColor: isGlowing ? config.color : '#e2e8f0',
              background: isGlowing
                ? `radial-gradient(circle at 50% 50%, #334155 0%, #0f172a 70%, ${config.color} 100%)`
                : 'radial-gradient(circle at 50% 40%, #1e293b 0%, #0f172a 60%, #020617 100%)',
              boxShadow: isGlowing
                ? `0 0 28px ${config.glowColor}, inset 0 0 20px ${config.glowColor}`
                : '0 12px 28px rgba(0,0,0,0.8), inset 0 3px 10px rgba(255,255,255,0.1)',
            }}
          >
            {/* Chrome Tension Claws on Kick Hoop (テンションボルト) */}
            <div className="absolute -top-1 left-4 w-3 h-2 bg-slate-300 rounded shadow pointer-events-none" />
            <div className="absolute -top-1 right-4 w-3 h-2 bg-slate-300 rounded shadow pointer-events-none" />
            <div className="absolute -bottom-1 left-4 w-3 h-2 bg-slate-300 rounded shadow pointer-events-none" />
            <div className="absolute -bottom-1 right-4 w-3 h-2 bg-slate-300 rounded shadow pointer-events-none" />

            {/* Front Head Port Hole (マイク穴) */}
            <div className="absolute right-4 bottom-3 w-7 h-7 rounded-full bg-slate-950 border border-slate-700 shadow-inner flex items-center justify-center pointer-events-none">
              <div className="w-5 h-5 rounded-full bg-black" />
            </div>

            {/* Drum Center Logo / Beater Impact Area */}
            <div className="my-auto flex flex-col items-center justify-center pointer-events-none">
              <div
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors"
                style={{
                  borderColor: isGlowing ? config.color : '#475569',
                  backgroundColor: isGlowing ? `${config.glowColor}40` : 'rgba(15,23,42,0.6)',
                }}
              >
                <span className="text-sm">🥁</span>
              </div>
            </div>

            {/* Chrome Kick Pedal Beater Footplate in front */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-10 h-6 bg-gradient-to-t from-slate-400 to-slate-200 rounded-t-lg border border-slate-500 shadow-md flex items-center justify-center pointer-events-none z-10">
              <div className="w-1 h-3 bg-slate-700 rounded-full" />
            </div>
          </div>
        ) : (
          // REALISTIC TOMS & SNARE (立体シェル・スチールフープ・ホワイトコーテッドヘッド)
          <div
            className="relative w-full h-full rounded-full border-4 transition-transform shadow-2xl flex items-center justify-center"
            style={{
              borderColor: isGlowing ? config.color : isSnare ? '#94a3b8' : '#64748b',
              background: isSnare
                ? isGlowing
                  ? `radial-gradient(circle at 40% 40%, #ffffff 0%, #f1f5f9 60%, ${config.color} 100%)`
                  : 'radial-gradient(circle at 40% 40%, #ffffff 0%, #e2e8f0 70%, #cbd5e1 100%)'
                : isGlowing
                ? `radial-gradient(circle at 40% 40%, #38bdf8 0%, #0284c7 60%, #0369a1 100%)`
                : 'radial-gradient(circle at 40% 40%, #1e293b 0%, #0f172a 75%, #020617 100%)',
              boxShadow: isGlowing
                ? `0 0 20px ${config.glowColor}, 0 8px 20px rgba(0,0,0,0.6)`
                : '0 8px 18px rgba(0,0,0,0.6), inset 0 2px 6px rgba(255,255,255,0.3)',
              transform: 'rotateX(22deg)',
            }}
          >
            {/* Chrome Hoop Rim & Tension Lugs (フープとラグ) */}
            <div className="absolute inset-1 rounded-full border border-slate-400/40 pointer-events-none" />

            {/* Snare specific Buzz Ring / Muffle Ring */}
            {isSnare && (
              <div className="absolute inset-2.5 rounded-full border border-slate-300/60 pointer-events-none shadow-inner flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-300/40" />
              </div>
            )}

            {/* Floor Tom Legs or Tom Lugs */}
            {isFloorTom && (
              <>
                <div className="absolute -left-1 top-2 w-1.5 h-4 bg-slate-300 rounded pointer-events-none" />
                <div className="absolute -right-1 top-2 w-1.5 h-4 bg-slate-300 rounded pointer-events-none" />
              </>
            )}
          </div>
        )}

        {/* PAD LABEL & SHORT KEY HINT */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
          <span
            className="text-[11px] sm:text-xs font-black tracking-wider uppercase drop-shadow-md text-center leading-tight"
            style={{
              color: isCymbal
                ? '#451a03'
                : isSnare
                ? '#0f172a'
                : '#f8fafc',
            }}
          >
            {drumLayout === 'compact' ? (
              part === 'crash' ? 'クラッシュ' :
              part === 'hihatClosed' ? 'ハイハット' :
              part === 'snare' ? 'スネア' :
              part === 'kick' ? 'バスドラム' : config.shortName
            ) : (
              config.shortName
            )}
          </span>
          {drumLayout === 'compact' && (
            <span
              className="text-[8px] sm:text-[9px] font-black uppercase opacity-75 drop-shadow-sm leading-none"
              style={{
                color: isCymbal ? '#78350f' : isSnare ? '#475569' : '#94a3b8',
              }}
            >
              {config.shortName}
            </span>
          )}
          {showKeyHints && (
            <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-black/60 text-slate-100 border border-white/20 mt-0.5">
              {config.keyLabel.split(' / ')[0]}
            </span>
          )}
        </div>

        {/* LOCKED BADGE (for RPG Training curriculum) */}
        {!isUnlocked && (
          <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/70 z-30 pointer-events-none">
            <Lock className="w-4 h-4 text-slate-400 mb-0.5" />
            <span className="text-[9px] font-bold text-slate-300 bg-slate-900/90 px-1.5 py-0.2 rounded border border-slate-700">
              未解放
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-lg aspect-[4/3] sm:aspect-[16/11] mx-auto flex items-center justify-center p-1 sm:p-3 select-none touch-none"
      style={{
        perspective: '900px', // Authentic 3D depth
      }}
    >
      {/* 3D DRUM STAGE CARPET & METALLIC LIGHTING */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden"
        style={{
          transform: 'rotateX(12deg)',
          transformOrigin: 'bottom center',
        }}
      >
        {/* Drum Rug Texture */}
        <div
          className="absolute inset-0 opacity-10 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)]"
          style={{ backgroundSize: '16px 16px' }}
        />
        {/* Stage Spotlights */}
        <div className="absolute -top-8 left-1/4 w-36 h-36 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-8 right-1/4 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-24 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* HIT SPARKLE PARTICLES OVERLAY */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-40">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute flex items-center justify-center"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.alpha,
              transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
            }}
          >
            {p.emoji ? (
              <span style={{ fontSize: `${p.size}px` }}>{p.emoji}</span>
            ) : (
              <div
                className="w-full h-full rounded-full"
                style={{
                  backgroundColor: p.color,
                  boxShadow: `0 0 8px ${p.color}`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* AUTHENTIC DRUM KIT ARRANGEMENTS ACCORDING TO USER SETTING */}
      {drumLayout === 'compact' ? (
        /* 幼児・キッズ向け 4パッド実機配置 (左上クラッシュ・左ハット・中央スネア・下キック) */
        <div
          className="relative w-full h-full flex flex-col justify-between p-1 sm:p-2.5 z-10"
          style={{
            transform: 'rotateX(18deg)',
            transformOrigin: 'bottom center',
          }}
        >
          {/* TOP ROW: Crash Cymbal (Top-Left on high stand) & Real Kit Kids Guide Badge (Right) */}
          <div className="flex items-center justify-between w-full h-[32%] px-2">
            {/* Crash Cymbal (Top-Left elevated boom cymbal) */}
            <div className="w-[38%] max-w-[135px] aspect-square flex items-center justify-center">
              {render3DPad('crash', 'w-full h-full')}
            </div>

            {/* Kids layout guide badge */}
            <div className="flex flex-col items-end justify-center pointer-events-none pr-1">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-400/50 text-amber-300 shadow-md">
                <span className="text-sm">⭐</span>
                <span className="text-xs font-black tracking-tight">幼児用4パッド (実機配置)</span>
              </div>
              <span className="text-[10px] text-slate-300 font-bold mt-1 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800">
                実際のドラムセットと同じ配置 🥁
              </span>
            </div>
          </div>

          {/* MIDDLE ROW: Hi-Hat (Left side) & Snare Drum (Center/Front) */}
          <div className="flex items-center justify-between w-full h-[36%] px-2 my-auto">
            {/* Hi-Hat (Left position, hi-hat stand) */}
            <div className="w-[44%] max-w-[155px] aspect-square flex items-center justify-center">
              {render3DPad('hihatClosed', 'w-full h-full')}
            </div>

            {/* Snare Drum (Directly in front between knees) */}
            <div className="w-[48%] max-w-[170px] aspect-square flex items-center justify-center">
              {render3DPad('snare', 'w-full h-full')}
            </div>
          </div>

          {/* BOTTOM ROW: Bass Drum / Kick (Bottom Center on floor) */}
          <div className="flex items-center justify-center w-full h-[32%] pb-1">
            <div className="w-[84%] max-w-[320px] h-full flex items-center justify-center">
              {render3DPad('kick', 'w-full h-full max-h-[112px]')}
            </div>
          </div>
        </div>
      ) : drumLayout === 'leftHanded' ? (
        /* LEFT-HANDED MIRRORED KIT */
        <div
          className="relative w-full h-full flex flex-col justify-between p-1 sm:p-2 z-10"
          style={{
            transform: 'rotateX(18deg)',
            transformOrigin: 'bottom center',
          }}
        >
          {/* TOP ROW: Ride (Left) | Toms (Center) | Crash (Right) */}
          <div className="flex items-center justify-between w-full h-[32%] px-1">
            <div className="w-[28%] max-w-[105px] aspect-square flex items-center justify-center">
              {render3DPad('ride', 'w-full h-full')}
            </div>
            <div className="flex items-center justify-center gap-2 sm:gap-3 w-[40%] h-full">
              <div className="w-[48%] max-w-[78px] aspect-square">
                {render3DPad('tomLow', 'w-full h-full')}
              </div>
              <div className="w-[46%] max-w-[75px] aspect-square">
                {render3DPad('tomHigh', 'w-full h-full')}
              </div>
            </div>
            <div className="w-[28%] max-w-[105px] aspect-square flex items-center justify-center">
              {render3DPad('crash', 'w-full h-full')}
            </div>
          </div>

          {/* MIDDLE ROW: Floor Tom (Left) | Snare (Center) | Hi-Hat (Right) */}
          <div className="flex items-center justify-between w-full h-[36%] px-1 my-auto">
            <div className="w-[30%] max-w-[110px] aspect-square flex items-center justify-center">
              {render3DPad('tomFloor', 'w-full h-full')}
            </div>
            <div className="w-[40%] max-w-[140px] aspect-square flex items-center justify-center">
              {render3DPad('snare', 'w-full h-full')}
            </div>
            <div className="flex flex-col items-center justify-center gap-1 w-[26%] max-w-[90px] h-full">
              <div className="w-[80%] max-w-[65px] aspect-square">
                {render3DPad('hihatOpen', 'w-full h-full')}
              </div>
              <div className="w-[98%] max-w-[85px] aspect-square">
                {render3DPad('hihatClosed', 'w-full h-full')}
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: Kick (Center) */}
          <div className="flex items-center justify-center w-full h-[32%] pb-1">
            <div className="w-[72%] max-w-[270px] h-full flex items-center justify-center">
              {render3DPad('kick', 'w-full h-full max-h-[105px]')}
            </div>
          </div>
        </div>
      ) : drumLayout === 'wide' ? (
        /* WIDE ARRANGEMENT */
        <div
          className="relative w-full h-full flex flex-col justify-between p-1 sm:p-2 z-10"
          style={{
            transform: 'rotateX(18deg)',
            transformOrigin: 'bottom center',
          }}
        >
          {/* TOP ROW: Crash | High Tom | Low Tom | Floor Tom | Ride */}
          <div className="flex items-center justify-between w-full h-[32%] px-0.5 gap-1">
            <div className="w-[19%] aspect-square flex items-center justify-center">
              {render3DPad('crash', 'w-full h-full')}
            </div>
            <div className="w-[18%] aspect-square">
              {render3DPad('tomHigh', 'w-full h-full')}
            </div>
            <div className="w-[18%] aspect-square">
              {render3DPad('tomLow', 'w-full h-full')}
            </div>
            <div className="w-[21%] aspect-square">
              {render3DPad('tomFloor', 'w-full h-full')}
            </div>
            <div className="w-[19%] aspect-square flex items-center justify-center">
              {render3DPad('ride', 'w-full h-full')}
            </div>
          </div>

          {/* MIDDLE ROW: Hi-Hat & Snare */}
          <div className="flex items-center justify-around w-full h-[36%] px-3 my-auto">
            <div className="flex items-center justify-center gap-2 w-[44%] h-full">
              <div className="w-[45%] aspect-square">
                {render3DPad('hihatOpen', 'w-full h-full')}
              </div>
              <div className="w-[50%] aspect-square">
                {render3DPad('hihatClosed', 'w-full h-full')}
              </div>
            </div>
            <div className="w-[42%] max-w-[145px] aspect-square flex items-center justify-center">
              {render3DPad('snare', 'w-full h-full')}
            </div>
          </div>

          {/* BOTTOM ROW: Kick */}
          <div className="flex items-center justify-center w-full h-[32%] pb-1">
            <div className="w-[72%] max-w-[270px] h-full flex items-center justify-center">
              {render3DPad('kick', 'w-full h-full max-h-[105px]')}
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD 8-PIECE REAL DRUM KIT ARRANGEMENT (プロドラマー視点レイアウト) */
        <div
          className="relative w-full h-full flex flex-col justify-between p-1 sm:p-2 z-10"
          style={{
            transform: 'rotateX(18deg)',
            transformOrigin: 'bottom center',
          }}
        >
          {/* TOP ROW: Crash Cymbal (Left) | High Tom & Low Tom (Center) | Ride Cymbal (Right) */}
          <div className="flex items-center justify-between w-full h-[32%] px-1">
            <div className="w-[28%] max-w-[105px] aspect-square flex items-center justify-center">
              {render3DPad('crash', 'w-full h-full')}
            </div>
            <div className="flex items-center justify-center gap-2 sm:gap-3 w-[40%] h-full">
              <div className="w-[46%] max-w-[75px] aspect-square">
                {render3DPad('tomHigh', 'w-full h-full')}
              </div>
              <div className="w-[48%] max-w-[78px] aspect-square">
                {render3DPad('tomLow', 'w-full h-full')}
              </div>
            </div>
            <div className="w-[28%] max-w-[105px] aspect-square flex items-center justify-center">
              {render3DPad('ride', 'w-full h-full')}
            </div>
          </div>

          {/* MIDDLE ROW: Hi-Hat Open/Closed (Left) | Snare (Center-Left) | Floor Tom (Right) */}
          <div className="flex items-center justify-between w-full h-[36%] px-1 my-auto">
            <div className="flex flex-col items-center justify-center gap-1 w-[26%] max-w-[90px] h-full">
              <div className="w-[80%] max-w-[65px] aspect-square">
                {render3DPad('hihatOpen', 'w-full h-full')}
              </div>
              <div className="w-[98%] max-w-[85px] aspect-square">
                {render3DPad('hihatClosed', 'w-full h-full')}
              </div>
            </div>
            <div className="w-[40%] max-w-[140px] aspect-square flex items-center justify-center">
              {render3DPad('snare', 'w-full h-full')}
            </div>
            <div className="w-[30%] max-w-[110px] aspect-square flex items-center justify-center">
              {render3DPad('tomFloor', 'w-full h-full')}
            </div>
          </div>

          {/* BOTTOM ROW: 22" Bass Drum (Center bottom with pedal) */}
          <div className="flex items-center justify-center w-full h-[32%] pb-1">
            <div className="w-[72%] max-w-[270px] h-full flex items-center justify-center">
              {render3DPad('kick', 'w-full h-full max-h-[105px]')}
            </div>
          </div>
        </div>
      )}

      {isFreePlay && (
        <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] font-bold text-amber-300 bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1 shadow z-30">
          <span>🥁</span> 3Dスタジオ練習中
        </div>
      )}
    </div>
  );
};
