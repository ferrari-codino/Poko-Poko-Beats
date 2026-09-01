import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DrumPartId, DrumLayoutType, PadScale } from '../types';
import { DRUM_PARTS } from '../data/drumConfig';
import { drumSynth } from '../audio/drumSynth';

interface DrumSetProps {
  onDrumHit: (part: DrumPartId, hitTimestamp: number) => void;
  activeGlowingParts: Record<DrumPartId, { glowIntensity: number; approachProgress: number; noteId?: string }>;
  showKeyHints?: boolean;
  hapticsEnabled?: boolean;
  isFreePlay?: boolean;
  drumLayout?: DrumLayoutType;
  padScale?: PadScale;
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
}) => {
  const [pressedParts, setPressedParts] = useState<Record<string, boolean>>({});
  // Timestamp when each part was last hit, used for decaying spring wobble animation
  const [lastHitTimes, setLastHitTimes] = useState<Record<string, number>>({});
  const [particles, setParticles] = useState<Particle[]>([]);
  const [stageVibrate, setStageVibrate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger cute star and sparkle particle effect when drum is hit
  const spawnHitParticles = useCallback((part: DrumPartId, clientX?: number, clientY?: number) => {
    const config = DRUM_PARTS[part];
    let originX = window.innerWidth / 2;
    let originY = window.innerHeight / 2;

    if (clientX && clientY && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      originX = clientX - rect.left;
      originY = clientY - rect.top;
    }

    const cuteEmojis = ['⭐', '✨', '🎵', '💫', '💖'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 7; i++) {
      const angle = (Math.PI * 2 * i) / 7 + (Math.random() - 0.5);
      const speed = 2.5 + Math.random() * 4.5;
      const isEmoji = i === 0;
      newParticles.push({
        id: Date.now() + Math.random() + i,
        x: originX,
        y: originY,
        color: config.color,
        emoji: isEmoji ? cuteEmojis[Math.floor(Math.random() * cuteEmojis.length)] : undefined,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: isEmoji ? 16 : 4 + Math.random() * 5,
        alpha: 1,
        rotation: Math.random() * 360,
      });
    }

    setParticles((prev) => [...prev.slice(-20), ...newParticles]);
  }, []);

  // Update particles animation loop
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15, // gravity
            rotation: p.rotation + 4,
            alpha: p.alpha - 0.07,
            size: p.size * 0.96,
          }))
          .filter((p) => p.alpha > 0.05)
      );
    }, 16);
    return () => clearInterval(interval);
  }, [particles.length]);

  const handleHit = useCallback(
    (part: DrumPartId, e?: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
      // Haptic feedback for mobile devices
      if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(22);
        } catch {}
      }

      // Play drum sound via Web Audio synth
      drumSynth.playDrum(part);

      const now = performance.now();

      // Trigger physical wobble & bounce
      setPressedParts((prev) => ({ ...prev, [part]: true }));
      setLastHitTimes((prev) => ({ ...prev, [part]: now }));

      // Subtle stage shake
      setStageVibrate(true);
      setTimeout(() => setStageVibrate(false), 120);

      setTimeout(() => {
        setPressedParts((prev) => ({ ...prev, [part]: false }));
      }, 140);

      // Notify parent game loop
      onDrumHit(part, now);

      // Spawn visual ripple particles
      let cx: number | undefined;
      let cy: number | undefined;
      if (e && 'clientX' in e && e.clientX) {
        cx = e.clientX;
        cy = e.clientY;
      }
      spawnHitParticles(part, cx, cy);
    },
    [hapticsEnabled, onDrumHit, spawnHitParticles]
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
      e: 'tomHigh',
      E: 'tomHigh',
      g: 'tomLow',
      G: 'tomLow',
      r: 'tomLow',
      R: 'tomLow',
      f: 'tomFloor',
      F: 'tomFloor',
      v: 'tomFloor',
      V: 'tomFloor',
      c: 'crash',
      C: 'crash',
      w: 'crash',
      W: 'crash',
      y: 'ride',
      Y: 'ride',
      u: 'ride',
      U: 'ride',
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const part = keyMap[e.key];
      if (part && !pressedParts[part]) {
        e.preventDefault();
        handleHit(part);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleHit, pressedParts]);

  // Scale multiplier for pad sizes
  const scaleMultiplier = padScale === 'huge' ? 1.25 : padScale === 'large' ? 1.12 : 1.0;

  // Helper to render individual drum component with physics wobble & spring bounce
  const renderDrumPad = (
    part: DrumPartId,
    customClass: string,
    widthClass: string,
    heightClass: string,
    isCymbal: boolean = false
  ) => {
    const config = DRUM_PARTS[part];
    const isPressed = !!pressedParts[part];
    const glowInfo = activeGlowingParts[part];
    const isGlowing = glowInfo && glowInfo.glowIntensity > 0;
    const approach = glowInfo?.approachProgress || 0;
    const hitTime = lastHitTimes[part] || 0;
    const isWobbling = performance.now() - hitTime < 280;

    // Dynamic wobble transform calculation
    let dynamicTransform = `scale(${scaleMultiplier})`;
    if (isPressed) {
      if (isCymbal) {
        dynamicTransform = `scale(${scaleMultiplier * 0.94}) rotate(${part === 'crash' ? '-14deg' : '14deg'}) translateY(3px)`;
      } else {
        dynamicTransform = `scale(${scaleMultiplier * 0.90}, ${scaleMultiplier * 1.08}) translateY(4px)`;
      }
    } else if (isWobbling) {
      if (isCymbal) {
        dynamicTransform = `scale(${scaleMultiplier * 1.02}) rotate(${part === 'crash' ? '6deg' : '-6deg'})`;
      } else {
        dynamicTransform = `scale(${scaleMultiplier * 1.05}, ${scaleMultiplier * 0.96}) translateY(-2px)`;
      }
    }

    return (
      <div
        id={`drum-pad-${part}`}
        key={part}
        onPointerDown={(e) => {
          e.preventDefault();
          handleHit(part, e);
        }}
        className={`relative select-none cursor-pointer flex flex-col items-center justify-center rounded-full transition-transform duration-75 ease-out shadow-lg ${customClass} ${widthClass} ${heightClass}`}
        style={{
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
          transform: dynamicTransform,
          boxShadow: isGlowing
            ? `0 0 28px 10px ${config.glowColor}, inset 0 0 16px ${config.glowColor}`
            : isPressed
            ? `0 0 22px 6px ${config.glowColor}`
            : isCymbal
            ? '0 6px 14px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)'
            : '0 8px 18px rgba(0,0,0,0.6), inset 0 2px 5px rgba(255,255,255,0.15)',
        }}
      >
        {/* Approaching timing target ring */}
        {approach > 0 && approach < 1 && (
          <div
            className="absolute rounded-full pointer-events-none transition-all"
            style={{
              border: `3.5px solid ${config.color}`,
              width: `${100 + (1 - approach) * 125}%`,
              height: `${100 + (1 - approach) * 125}%`,
              opacity: Math.min(1, approach * 1.6),
              boxShadow: `0 0 12px ${config.glowColor}`,
            }}
          />
        )}

        {/* Glow halo when beat hits */}
        {isGlowing && (
          <div
            className="absolute inset-0 rounded-full animate-ping pointer-events-none"
            style={{
              backgroundColor: config.glowColor,
              opacity: glowInfo.glowIntensity * 0.7,
            }}
          />
        )}

        {/* Cymbal / Drum Skin Outer Rim */}
        <div
          className={`absolute inset-0 rounded-full border-2 transition-colors duration-100 ${
            isCymbal ? 'border-amber-500/60' : 'border-slate-600'
          }`}
          style={{
            borderColor: isGlowing ? config.color : undefined,
            background: isCymbal
              ? isGlowing
                ? `radial-gradient(circle, ${config.bgActiveColor} 0%, #b45309 55%, #78350f 100%)`
                : 'radial-gradient(circle, #fef08a 0%, #f59e0b 45%, #b45309 85%, #78350f 100%)'
              : isGlowing
              ? `radial-gradient(circle, #1e293b 0%, ${config.borderColor} 70%, ${config.color} 100%)`
              : 'radial-gradient(circle, #334155 0%, #1e293b 70%, #0f172a 100%)',
          }}
        />

        {/* Center Bell for Cymbals / Head Rim for Drums */}
        {isCymbal ? (
          <div className="absolute w-1/3 h-1/3 rounded-full bg-amber-200 border border-amber-900/60 shadow-inner flex items-center justify-center pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-950" />
          </div>
        ) : (
          <div
            className="absolute inset-2 rounded-full border border-slate-500/40 flex items-center justify-center pointer-events-none"
            style={{
              borderColor: isGlowing ? config.color : undefined,
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="w-3.5 h-3.5 rounded-full transition-colors flex items-center justify-center text-[8px]"
              style={{
                backgroundColor: isGlowing ? config.color : '#475569',
              }}
            >
              {isGlowing ? '⭐' : ''}
            </div>
          </div>
        )}

        {/* Text Label */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center pointer-events-none px-1">
          <span
            className="text-[11px] sm:text-xs font-black tracking-wider uppercase drop-shadow-md"
            style={{ color: isCymbal ? '#451a03' : '#f8fafc' }}
          >
            {config.shortName}
          </span>
          {showKeyHints && (
            <span className="mt-0.5 text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-slate-200 border border-white/15">
              {config.keyLabel.split(' / ')[0]}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-lg aspect-square sm:aspect-[4/3] mx-auto flex items-center justify-center p-2 sm:p-4 select-none touch-none transition-transform duration-75 ${
        stageVibrate ? 'translate-y-0.5' : ''
      }`}
    >
      {/* Visual background kit stage with cute pop lighting */}
      <div className="absolute inset-0 bg-slate-950/85 rounded-3xl border-2 border-indigo-900/40 shadow-2xl backdrop-blur-sm overflow-hidden">
        {/* Subtle Drum Rug Grid Pattern */}
        <div
          className="absolute inset-0 opacity-15 bg-[radial-gradient(#818cf8_1.5px,transparent_1.5px)]"
          style={{ backgroundSize: '20px 20px' }}
        />
        {/* Colorful stage lights */}
        <div className="absolute -top-10 left-1/4 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 right-1/4 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-x-1/4 bottom-1/4 h-1/2 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Particle & Star Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-30">
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

      {/* DRUM LAYOUT RENDERER */}
      {drumLayout === 'compact' ? (
        // KIDS COMPACT 4-PAD LAYOUT (Crash, Hi-Hat, Snare, Huge Kick)
        <div className="relative w-full h-full max-w-md max-h-[460px] flex flex-col justify-between p-2">
          {/* Top Row: Crash & Hi-Hat */}
          <div className="flex items-center justify-between w-full h-[40%] px-2">
            {renderDrumPad('crash', 'rotate-[-8deg]', 'w-[45%] max-w-[140px]', 'aspect-square', true)}
            {renderDrumPad('hihatClosed', 'rotate-[8deg]', 'w-[45%] max-w-[140px]', 'aspect-square', true)}
          </div>
          {/* Middle Row: Snare */}
          <div className="flex items-center justify-center w-full h-[28%]">
            {renderDrumPad('snare', 'border-2 border-cyan-400/50', 'w-[55%] max-w-[160px]', 'aspect-square')}
          </div>
          {/* Bottom Row: Huge Bass Drum */}
          <div className="flex items-center justify-center w-full h-[32%] pb-1">
            {renderDrumPad('kick', 'border-4 border-amber-500 bg-slate-900', 'w-[85%] max-w-[280px] h-full max-h-[110px]', 'rounded-3xl')}
          </div>
        </div>
      ) : drumLayout === 'leftHanded' ? (
        // LEFT-HANDED MIRROR LAYOUT
        <div className="relative w-full h-full max-w-md max-h-[460px] flex flex-col justify-between p-1 sm:p-3">
          {/* Top Row: Ride (Left) | Toms | Crash (Right) */}
          <div className="flex items-center justify-between w-full h-[28%] px-1">
            {renderDrumPad('ride', 'self-start rotate-[-12deg]', 'w-[28%] max-w-[100px]', 'aspect-square', true)}
            <div className="flex items-center justify-center gap-2 sm:gap-3 w-[40%]">
              {renderDrumPad('tomLow', '', 'w-[48%] max-w-[72px]', 'aspect-square')}
              {renderDrumPad('tomHigh', '', 'w-[48%] max-w-[72px]', 'aspect-square')}
            </div>
            {renderDrumPad('crash', 'self-start rotate-[12deg]', 'w-[28%] max-w-[100px]', 'aspect-square', true)}
          </div>

          {/* Middle Row: Floor Tom (Left) | Snare (Center) | Hi-Hat (Right) */}
          <div className="flex items-center justify-between w-full h-[34%] px-1 my-auto">
            <div className="flex items-center justify-center w-[30%] max-w-[105px]">
              {renderDrumPad('tomFloor', '', 'w-full', 'aspect-square')}
            </div>
            <div className="flex items-center justify-center w-[38%] max-w-[130px]">
              {renderDrumPad('snare', 'border-2 border-cyan-500/40', 'w-full', 'aspect-square')}
            </div>
            <div className="flex flex-col items-center justify-center gap-1 w-[26%] max-w-[90px]">
              {renderDrumPad('hihatOpen', '', 'w-[75%] max-w-[65px]', 'aspect-square', true)}
              {renderDrumPad('hihatClosed', '', 'w-[95%] max-w-[85px]', 'aspect-square', true)}
            </div>
          </div>

          {/* Bottom Row: Bass Drum */}
          <div className="flex items-center justify-center w-full h-[32%] pb-1">
            <div className="w-[68%] max-w-[240px] h-full flex items-center justify-center">
              {renderDrumPad('kick', 'border-4 border-amber-500/50 bg-slate-900', 'w-full h-full max-h-[110px]', 'rounded-3xl')}
            </div>
          </div>
        </div>
      ) : drumLayout === 'wide' ? (
        // WIDE LAYOUT (3 Toms top row)
        <div className="relative w-full h-full max-w-md max-h-[460px] flex flex-col justify-between p-1 sm:p-2">
          {/* Top Row: Crash | High Tom | Low Tom | Floor Tom | Ride */}
          <div className="flex items-center justify-between w-full h-[30%] px-1">
            {renderDrumPad('crash', 'rotate-[-10deg]', 'w-[20%] max-w-[75px]', 'aspect-square', true)}
            {renderDrumPad('tomHigh', '', 'w-[18%] max-w-[65px]', 'aspect-square')}
            {renderDrumPad('tomLow', '', 'w-[18%] max-w-[65px]', 'aspect-square')}
            {renderDrumPad('tomFloor', '', 'w-[18%] max-w-[65px]', 'aspect-square')}
            {renderDrumPad('ride', 'rotate-[10deg]', 'w-[20%] max-w-[75px]', 'aspect-square', true)}
          </div>

          {/* Middle Row: Hi-Hat Open/Closed (Left) & Snare (Right) */}
          <div className="flex items-center justify-around w-full h-[35%] px-3">
            <div className="flex items-center gap-1.5 w-[42%] justify-center">
              {renderDrumPad('hihatOpen', '', 'w-[48%] max-w-[70px]', 'aspect-square', true)}
              {renderDrumPad('hihatClosed', '', 'w-[52%] max-w-[78px]', 'aspect-square', true)}
            </div>
            <div className="flex items-center justify-center w-[48%] max-w-[145px]">
              {renderDrumPad('snare', 'border-2 border-cyan-500/40', 'w-full', 'aspect-square')}
            </div>
          </div>

          {/* Bottom Row: Bass Drum */}
          <div className="flex items-center justify-center w-full h-[32%] pb-1">
            <div className="w-[75%] max-w-[260px] h-full flex items-center justify-center">
              {renderDrumPad('kick', 'border-4 border-amber-500/50 bg-slate-900', 'w-full h-full max-h-[110px]', 'rounded-3xl')}
            </div>
          </div>
        </div>
      ) : (
        // STANDARD RIGHT-HANDED LAYOUT
        <div className="relative w-full h-full max-w-md max-h-[460px] flex flex-col justify-between p-1 sm:p-3">
          {/* Top Row: Crash | High Tom & Low Tom | Ride */}
          <div className="flex items-center justify-between w-full h-[28%] px-1">
            {renderDrumPad('crash', 'self-start rotate-[-12deg]', 'w-[28%] max-w-[100px]', 'aspect-square', true)}
            <div className="flex items-center justify-center gap-2 sm:gap-3 w-[40%]">
              {renderDrumPad('tomHigh', '', 'w-[48%] max-w-[72px]', 'aspect-square')}
              {renderDrumPad('tomLow', '', 'w-[48%] max-w-[72px]', 'aspect-square')}
            </div>
            {renderDrumPad('ride', 'self-start rotate-[12deg]', 'w-[28%] max-w-[100px]', 'aspect-square', true)}
          </div>

          {/* Middle Row: Hi-Hat | Snare | Floor Tom */}
          <div className="flex items-center justify-between w-full h-[34%] px-1 my-auto">
            <div className="flex flex-col items-center justify-center gap-1 w-[26%] max-w-[90px]">
              {renderDrumPad('hihatOpen', '', 'w-[75%] max-w-[65px]', 'aspect-square', true)}
              {renderDrumPad('hihatClosed', '', 'w-[95%] max-w-[85px]', 'aspect-square', true)}
            </div>
            <div className="flex items-center justify-center w-[38%] max-w-[130px]">
              {renderDrumPad('snare', 'border-2 border-cyan-500/40', 'w-full', 'aspect-square')}
            </div>
            <div className="flex items-center justify-center w-[30%] max-w-[105px]">
              {renderDrumPad('tomFloor', '', 'w-full', 'aspect-square')}
            </div>
          </div>

          {/* Bottom Row: Bass Drum */}
          <div className="flex items-center justify-center w-full h-[32%] pb-1">
            <div className="w-[68%] max-w-[240px] h-full flex items-center justify-center">
              {renderDrumPad('kick', 'border-4 border-amber-500/50 bg-slate-900', 'w-full h-full max-h-[110px]', 'rounded-3xl')}
            </div>
          </div>
        </div>
      )}

      {isFreePlay && (
        <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] font-bold text-amber-300 bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1 shadow">
          <span>🥁</span> じゆう練習中
        </div>
      )}
    </div>
  );
};
