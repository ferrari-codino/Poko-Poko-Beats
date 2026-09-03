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

  // 5 Musician Pro Features State
  const [membraneWaves, setMembraneWaves] = useState<Record<string, number>>({});
  const [cymbalShimmers, setCymbalShimmers] = useState<Record<string, number>>({});
  const [subBassShockwave, setSubBassShockwave] = useState(false);
  const [isRimshotActive, setIsRimshotActive] = useState(false);
  const [isChokedActive, setIsChokedActive] = useState(false);
  const [leftStickStrike, setLeftStickStrike] = useState(false);
  const [rightStickStrike, setRightStickStrike] = useState(false);
  const [ambiencePreset, setAmbiencePresetState] = useState<'dead' | 'vintage' | 'arena'>('vintage');

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
  const spawnHitParticles = useCallback((part: DrumPartId, clientX?: number, clientY?: number, isRim?: boolean) => {
    const config = DRUM_PARTS[part];
    let originX = window.innerWidth / 2;
    let originY = window.innerHeight / 2;

    if (clientX && clientY && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      originX = clientX - rect.left;
      originY = clientY - rect.top;
    }

    const cuteEmojis = isRim ? ['💥', '⚡', '✨', '🔥', '⭐'] : ['⭐', '✨', '⚡', '💫', '🔥'];
    const count = isRim ? 12 : 7;
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = (isRim ? 4.5 : 3.0) + Math.random() * (isRim ? 6.0 : 4.5);
      const isEmoji = i === 0 || (isRim && i === 1);
      newParticles.push({
        id: Date.now() + Math.random() + i,
        x: originX,
        y: originY,
        color: isRim ? '#fbbf24' : config.color,
        emoji: isEmoji ? cuteEmojis[Math.floor(Math.random() * cuteEmojis.length)] : undefined,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: isEmoji ? 20 : 5 + Math.random() * (isRim ? 9 : 6),
        alpha: 1,
        rotation: Math.random() * 360,
      });
    }

    setParticles((prev) => [...prev.slice(-30), ...newParticles]);
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

  // Handle striking a drum pad (with authentic rimshot, choke & membrane physics)
  const handleHit = useCallback(
    (part: DrumPartId, e?: React.PointerEvent | React.TouchEvent | React.MouseEvent, forceRimshot?: boolean) => {
      // If part is locked in training curriculum, do not trigger
      if (!isPartUnlocked(part)) {
        return;
      }

      // Haptic feedback
      if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(forceRimshot ? 35 : 24);
        } catch {}
      }

      const now = performance.now();

      // Check for Snare Open Rimshot: forceRimshot OR click on top 28% hoop rim
      let isRim = false;
      if (part === 'snare') {
        if (forceRimshot) {
          isRim = true;
        } else if (e && 'currentTarget' in e && e.currentTarget) {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const clientY = 'clientY' in e ? e.clientY : 0;
          if (clientY > 0 && (clientY - rect.top) / rect.height < 0.28) {
            isRim = true;
          }
        }
      }

      // Play synthesized acoustic sound with real-time physics
      if (isRim) {
        drumSynth.playRimshot();
        setIsRimshotActive(true);
        setTimeout(() => setIsRimshotActive(false), 240);
      } else if (part === 'hihatClosed') {
        drumSynth.playHiHatClosed();
        setIsChokedActive(true);
        setTimeout(() => setIsChokedActive(false), 200);
      } else {
        drumSynth.playDrum(part);
      }

      // 5. Drumhead Bessel membrane wave ripple (for snare, toms, kick)
      const isDrumHead = part === 'snare' || part === 'kick' || part === 'tomHigh' || part === 'tomLow' || part === 'tomFloor';
      if (isDrumHead) {
        setMembraneWaves((prev) => ({ ...prev, [part]: Date.now() }));
      }

      // 5. Cymbal metallic lathe shimmer (for crash, ride, hihats)
      const isCymbalPart = part === 'crash' || part === 'ride' || part === 'hihatClosed' || part === 'hihatOpen';
      if (isCymbalPart) {
        setCymbalShimmers((prev) => ({ ...prev, [part]: Date.now() }));
      }

      // Virtual Drumsticks Dynamic Strike & Rebound Animation
      const isLeftHand = part === 'snare' || part === 'hihatClosed' || part === 'hihatOpen' || part === 'crash' || part === 'tomHigh';
      if (isLeftHand) {
        setLeftStickStrike(true);
        setTimeout(() => setLeftStickStrike(false), 180);
      } else {
        setRightStickStrike(true);
        setTimeout(() => setRightStickStrike(false), 180);
      }

      // Trigger realistic physical wobble for cymbals or head depression for drums
      setPressedParts((prev) => ({ ...prev, [part]: true }));
      const wobbleDeg = (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 8);
      setWobbleRotations((prev) => ({ ...prev, [part]: wobbleDeg }));

      if (part === 'kick') {
        setKickPulse(true);
        setSubBassShockwave(true);
        setTimeout(() => {
          setKickPulse(false);
          setSubBassShockwave(false);
        }, 180);
      }

      setTimeout(() => {
        setPressedParts((prev) => ({ ...prev, [part]: false }));
        setWobbleRotations((prev) => ({ ...prev, [part]: 0 }));
      }, 160);

      // Notify parent game loop (always notify 'snare' even if rimshot, so game scores it flawlessly)
      onDrumHit(part, now);

      // Particle sparkles
      let cx: number | undefined;
      let cy: number | undefined;
      if (e && 'clientX' in e && e.clientX) {
        cx = e.clientX;
        cy = e.clientY;
      }
      spawnHitParticles(part, cx, cy, isRim);
    },
    [hapticsEnabled, onDrumHit, isPartUnlocked, spawnHitParticles]
  );

  // Keyboard controls listener
  useEffect(() => {
    const keyMap: Record<string, { part: DrumPartId; rimshot?: boolean; choke?: boolean }> = {
      ' ': { part: 'kick' },
      b: { part: 'kick' },
      B: { part: 'kick' },
      s: { part: 'snare' },
      S: { part: 'snare' },
      d: { part: 'snare', rimshot: true }, // [D] or [R] triggers Authentic Open Rimshot!
      D: { part: 'snare', rimshot: true },
      r: { part: 'snare', rimshot: true },
      R: { part: 'snare', rimshot: true },
      h: { part: 'hihatClosed' },
      H: { part: 'hihatClosed' },
      j: { part: 'hihatClosed' },
      J: { part: 'hihatClosed' },
      p: { part: 'hihatClosed', choke: true }, // [P] triggers Hi-Hat Pedal Choke!
      P: { part: 'hihatClosed', choke: true },
      o: { part: 'hihatOpen' },
      O: { part: 'hihatOpen' },
      k: { part: 'hihatOpen' },
      K: { part: 'hihatOpen' },
      t: { part: 'tomHigh' },
      T: { part: 'tomHigh' },
      y: { part: 'tomLow' },
      Y: { part: 'tomLow' },
      f: { part: 'tomFloor' },
      F: { part: 'tomFloor' },
      g: { part: 'tomFloor' },
      G: { part: 'tomFloor' },
      c: { part: 'crash' },
      C: { part: 'crash' },
      v: { part: 'ride' },
      V: { part: 'ride' },
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.repeat) return;
      const entry = keyMap[ev.key];
      if (!entry) return;

      let part = entry.part;
      // In compact (toddler 4-pad) mode, redirect toms to snare, ride to crash, open-hat to closed-hat
      if (drumLayout === 'compact') {
        if (part === 'tomHigh' || part === 'tomLow' || part === 'tomFloor') part = 'snare';
        if (part === 'ride') part = 'crash';
        if (part === 'hihatOpen') part = 'hihatClosed';
      }

      handleHit(part, undefined, entry.rimshot);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleHit, drumLayout]);

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

    // Realistic physical strike deflection: cymbals tilt & wobble; drums compress slightly
    const cymbalTilt = isPressed ? 18 : 0;
    const drumCompress = isPressed ? 0.94 : 1.0;

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
          transform: `scale(${scaleFactor * drumCompress}) rotate(${wobble}deg) ${
            isCymbal ? `rotateX(${cymbalTilt}deg)` : ''
          }`,
          transformOrigin: isCymbal ? '50% 45%' : 'bottom center',
          filter: isPressed ? 'brightness(1.15)' : 'none',
          ...customStyle,
        }}
      >
        {/* CAST SHADOW ON DRUM MAT (床に落ちる立体的な影) */}
        <div
          className="absolute -bottom-3 inset-x-2 h-4 rounded-full bg-black/60 blur-md pointer-events-none -z-10 transition-opacity"
          style={{
            transform: 'rotateX(60deg) scale(1.1)',
            opacity: isPressed ? 0.9 : 0.6,
          }}
        />

        {/* READ-AHEAD "PREPARE" COUNTDOWN RING (先読みガイドオーラ) */}
        {isUnlocked && isPrepareActive && approach > 0 && approach < 1 && (
          <div
            className="absolute rounded-full pointer-events-none transition-all duration-75 z-40"
            style={{
              border: `3px solid ${config.color}`,
              width: `${100 + (1 - approach) * 110}%`,
              height: `${100 + (1 - approach) * 110}%`,
              opacity: Math.min(1, approach * 1.8),
              boxShadow: `0 0 16px ${config.glowColor}, inset 0 0 8px ${config.glowColor}`,
            }}
          >
            <span
              className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-mono tracking-tighter whitespace-nowrap shadow"
            >
              PREPARE!
            </span>
          </div>
        )}

        {/* 1. HI-HAT CHOKE POPUP BADGE */}
        {part === 'hihatClosed' && isChokedActive && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-pulse whitespace-nowrap">
            <div className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-black text-[9px] shadow-xl border border-cyan-400 flex items-center gap-1">
              <span>🦶</span>
              <span>CHOKE (消音)</span>
            </div>
          </div>
        )}

        {/* 3. SNARE TOP CHROME HOOP: OPEN RIMSHOT TARGET ZONE */}
        {isSnare && (
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleHit('snare', e, true);
            }}
            className="absolute -top-1.5 inset-x-2 h-5 rounded-t-full bg-gradient-to-b from-amber-300/40 via-white/20 to-transparent cursor-pointer z-40 hover:bg-amber-400/30 active:bg-amber-400/60 transition-colors flex items-center justify-center group/rim"
            title="オープン・リムショット打面 (フープ同時叩き)"
          >
            <span className="text-[7px] font-mono font-black text-amber-200/90 tracking-tighter bg-black/70 px-1 py-0.2 rounded border border-amber-400/40 opacity-75 group-hover/rim:opacity-100 transition-opacity">
              RIMSHOT [R/D]
            </span>
          </div>
        )}

        {/* 3. SNARE OPEN RIMSHOT CELEBRATION BADGE */}
        {isSnare && isRimshotActive && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce whitespace-nowrap">
            <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-amber-300 text-slate-950 font-black text-[9px] shadow-xl border border-amber-300 flex items-center gap-1">
              <span>💥</span>
              <span>OPEN RIMSHOT!</span>
            </div>
          </div>
        )}

        {/* 5. PHYSICAL DRUMHEAD BESSEL MEMBRANE VIBRATION */}
        {!isCymbal && membraneWaves[part] && (
          <div
            key={membraneWaves[part]}
            className="absolute inset-1.5 rounded-full border-2 border-white/80 pointer-events-none animate-membrane-ripple z-30"
          />
        )}

        {/* 5. PHYSICAL METALLIC CYMBAL LATHE SHIMMER */}
        {isCymbal && cymbalShimmers[part] && (
          <div
            key={cymbalShimmers[part]}
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-300/30 via-white/40 to-transparent pointer-events-none animate-cymbal-shimmer z-30"
          />
        )}

        {/* 5. SUB-BASS AIR PRESSURE SHOCKWAVE FROM KICK PORT HOLE */}
        {isKick && subBassShockwave && (
          <div className="absolute right-2 bottom-1 w-12 h-12 rounded-full border-2 border-cyan-400/90 pointer-events-none animate-kick-sub-shockwave z-40" />
        )}

        {/* HIT GLOW BURST HALO */}
        {isGlowing && isUnlocked && (
          <div
            className="absolute inset-[-10px] rounded-full animate-ping pointer-events-none z-30"
            style={{
              backgroundColor: config.glowColor,
              opacity: glowInfo.glowIntensity * 0.75,
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* AUTHENTIC 3D DRUM KIT PIECES (プロミュージシャンが唸る本物のドラム造形) */}
        {/* ========================================================================= */}

        {isCymbal ? (
          /* --- B20 BRONZE CYMBAL WITH LATHE RIDGES, BELL DOME, FELT & WINGNUT --- */
          <div
            className="relative w-full h-full rounded-full flex items-center justify-center transition-transform shadow-2xl"
            style={{
              transform: 'rotateX(25deg)',
              background: isGlowing
                ? `radial-gradient(circle at 38% 36%, #fffbeb 0%, #fef08a 20%, ${config.color} 55%, #b45309 85%, #78350f 100%)`
                : 'radial-gradient(circle at 38% 36%, #fef9c3 0%, #fde047 18%, #d97706 48%, #b45309 72%, #78350f 92%, #451a03 100%)',
              boxShadow: isGlowing
                ? `0 0 25px ${config.glowColor}, 0 14px 28px rgba(0,0,0,0.85), inset 0 2px 6px rgba(255,255,255,0.7)`
                : '0 12px 26px rgba(0,0,0,0.85), inset 0 2px 7px rgba(255,255,255,0.45), inset 0 -3px 8px rgba(0,0,0,0.6)',
              border: `2px solid ${isGlowing ? config.color : '#92400e'}`,
            }}
          >
            {/* Lathe Concentric Turning Ridges (旋盤削り出しの同心円状レイジング溝) */}
            <div className="absolute inset-1.5 rounded-full border border-amber-950/30 pointer-events-none" />
            <div className="absolute inset-3 rounded-full border border-amber-800/25 pointer-events-none" />
            <div className="absolute inset-5 rounded-full border border-amber-900/30 pointer-events-none" />
            <div className="absolute inset-7 rounded-full border border-amber-700/20 pointer-events-none" />

            {/* Hand-Hammered Dimple Texture (ハンドハンマリング槌目模様) */}
            <div
              className="absolute inset-2 rounded-full opacity-20 pointer-events-none bg-[radial-gradient(#451a03_1px,transparent_1px)]"
              style={{ backgroundSize: '7px 7px' }}
            />

            {/* Specular Radial Light Reflection (シンバルの金属放射光ハイライト) */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none opacity-25"
              style={{
                background: 'conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.8) 0deg, transparent 40deg, rgba(255,255,255,0.8) 90deg, transparent 130deg, rgba(255,255,255,0.8) 180deg, transparent 220deg, rgba(255,255,255,0.8) 270deg, transparent 310deg, rgba(255,255,255,0.8) 360deg)',
              }}
            />

            {/* Raised Bell (立体カップ / ドーム) */}
            <div
              className="relative w-[34%] h-[34%] rounded-full flex items-center justify-center border-2 border-amber-950 shadow-lg pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #fef08a 0%, #d97706 45%, #78350f 100%)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.6)',
              }}
            >
              {/* Black Cymbal Cushion Felt (シンバル保護フェルトワッシャー) */}
              <div className="w-[42%] h-[42%] rounded-full bg-slate-950 border border-slate-700 shadow-inner flex items-center justify-center">
                {/* Chrome Wingnut (蝶ネジ / クロームウィングボルト) */}
                <div className="relative w-3.5 h-1.5 bg-gradient-to-r from-slate-200 via-white to-slate-300 rounded shadow border border-slate-600 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                </div>
              </div>
            </div>

            {/* Hi-Hat Stand Dual Cymbals / Clutch Detail */}
            {part === 'hihatClosed' && (
              <div className="absolute -bottom-2 inset-x-4 h-2 bg-gradient-to-b from-amber-950 to-black rounded-b-full opacity-70 pointer-events-none" />
            )}

            {/* Stand Boom Tilter Arm below cymbal */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-2 h-5 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-500 rounded-b shadow-md pointer-events-none -z-10" />
          </div>
        ) : isKick ? (
          /* --- 22" BASS DRUM (WOOD HOOPS, CHROME CLAWS, SLAM PAD & KICK PEDAL) --- */
          <div
            className={`relative w-full h-full rounded-[30px] transition-all duration-75 flex flex-col items-center justify-between p-1.5 shadow-2xl ${
              kickPulse ? 'scale-[1.03]' : ''
            }`}
            style={{
              transform: 'rotateX(15deg)',
              background: '#090d16',
              boxShadow: isGlowing
                ? `0 0 35px ${config.glowColor}, 0 16px 36px rgba(0,0,0,0.9)`
                : '0 16px 36px rgba(0,0,0,0.95), inset 0 2px 8px rgba(255,255,255,0.2)',
              border: `3px solid ${isGlowing ? config.color : '#475569'}`,
            }}
          >
            {/* Outer Heavy Wood Hoop (ブラックラッカー＋インレイ帯) */}
            <div className="absolute inset-0.5 rounded-[28px] border-4 border-slate-900 pointer-events-none">
              <div className="w-full h-full rounded-[24px] border border-amber-500/30" />
            </div>

            {/* Chrome Tension Claws & T-Rod Bolts (テンションクロー金具) */}
            <div className="absolute -top-1.5 left-6 w-3.5 h-3 bg-gradient-to-b from-slate-100 to-slate-400 rounded-sm shadow-md border border-slate-500 pointer-events-none" />
            <div className="absolute -top-1.5 right-6 w-3.5 h-3 bg-gradient-to-b from-slate-100 to-slate-400 rounded-sm shadow-md border border-slate-500 pointer-events-none" />
            <div className="absolute -bottom-1.5 left-6 w-3.5 h-3 bg-gradient-to-b from-slate-100 to-slate-400 rounded-sm shadow-md border border-slate-500 pointer-events-none" />
            <div className="absolute -bottom-1.5 right-6 w-3.5 h-3 bg-gradient-to-b from-slate-100 to-slate-400 rounded-sm shadow-md border border-slate-500 pointer-events-none" />
            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3.5 bg-gradient-to-r from-slate-100 to-slate-400 rounded-sm shadow-md border border-slate-500 pointer-events-none" />
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3.5 bg-gradient-to-r from-slate-100 to-slate-400 rounded-sm shadow-md border border-slate-500 pointer-events-none" />

            {/* Deep Drum Cylinder Interior / Batter Head */}
            <div
              className="relative w-full h-full rounded-[24px] flex flex-col items-center justify-center overflow-hidden"
              style={{
                background: isGlowing
                  ? `radial-gradient(circle at 50% 50%, #334155 0%, #1e293b 50%, ${config.color} 90%, #020617 100%)`
                  : 'radial-gradient(circle at 50% 40%, #1e293b 0%, #0f172a 65%, #020617 100%)',
                boxShadow: 'inset 0 6px 18px rgba(0,0,0,0.8), inset 0 0 12px rgba(255,255,255,0.06)',
              }}
            >
              {/* Outer Head Muffle Ring (REMO Powerstroke / EVANS EMAD風ダンパーリング) */}
              <div className="absolute inset-2 rounded-[20px] border border-slate-600/30 pointer-events-none" />

              {/* Falam Slam / EQ Beater Impact Patch (ビーター保護パッチ) */}
              <div
                className="relative w-14 h-14 rounded-full border-2 border-slate-600 flex items-center justify-center shadow-inner pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, #334155 0%, #0f172a 75%)',
                  boxShadow: kickPulse ? `0 0 16px ${config.glowColor}` : 'none',
                }}
              >
                <div className="w-9 h-9 rounded-full border border-slate-500/50 bg-slate-900 flex items-center justify-center">
                  <span className="text-xs font-black text-slate-400">22"</span>
                </div>
              </div>

              {/* Front Microphone Port Hole on bottom right */}
              <div className="absolute right-3.5 bottom-2.5 w-7 h-7 rounded-full bg-slate-950 border-2 border-slate-700 shadow-inner flex items-center justify-center pointer-events-none">
                <div className="w-5 h-5 rounded-full bg-black border border-slate-800" />
              </div>
            </div>

            {/* REALISTIC 3D KICK PEDAL ASSEMBLY (手前に鎮座する本格フットペダル＆ビーター) */}
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-16 h-10 flex flex-col items-center pointer-events-none z-30">
              {/* Beater Shaft & White Felt Beater (打面に向かうビーター) */}
              <div
                className="flex flex-col items-center transition-transform duration-75"
                style={{
                  transform: kickPulse ? 'translateY(-6px) scaleY(0.92)' : 'translateY(0)',
                }}
              >
                {/* Felt Beater Head */}
                <div className="w-4 h-3 rounded bg-gradient-to-b from-white to-slate-200 border border-slate-400 shadow-md" />
                {/* Black Beater Steel Rod */}
                <div className="w-1 h-3.5 bg-slate-800 shadow" />
              </div>

              {/* Pedal Footboard (アルミ削り出し風フットボード＆ヒールプレート) */}
              <div className="w-12 h-5 rounded-t-lg bg-gradient-to-t from-slate-400 via-slate-200 to-slate-300 border border-slate-500 shadow-xl flex items-center justify-around px-1">
                <div className="w-0.5 h-3 bg-slate-600 rounded-full" />
                <div className="w-0.5 h-3 bg-slate-600 rounded-full" />
                <div className="w-0.5 h-3 bg-slate-600 rounded-full" />
              </div>
            </div>
          </div>
        ) : isSnare ? (
          /* --- 14" SNARE DRUM (DIE-CAST CHROME HOOP, COATED WHITE HEAD, MOONGEL, TENSION LUGS) --- */
          <div
            className="relative w-full h-full rounded-full transition-transform shadow-2xl flex items-center justify-center"
            style={{
              transform: 'rotateX(26deg)',
              background: isGlowing ? config.color : '#475569',
              boxShadow: isGlowing
                ? `0 0 30px ${config.glowColor}, 0 12px 28px rgba(0,0,0,0.85)`
                : '0 12px 28px rgba(0,0,0,0.85), inset 0 3px 6px rgba(255,255,255,0.7)',
              padding: '6px', // Thick Die-cast Chrome Rim
            }}
          >
            {/* 10 Chrome Tension Lugs around Hoop (ダイキャストリムの10本テンションボルト) */}
            {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
              <div
                key={deg}
                className="absolute w-2 h-2.5 bg-gradient-to-r from-slate-200 via-white to-slate-400 rounded-sm shadow border border-slate-500 pointer-events-none -z-10"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${deg}deg) translate(0, -${padScale === 'huge' ? 46 : 42}px)`,
                }}
              />
            ))}

            {/* Heavy Die-cast Chrome Hoop Rim (重厚なクロームフープの金属光沢) */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: '4px solid #cbd5e1',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.6)',
              }}
            />

            {/* Visible Drum Shell Cylinder Depth at bottom (手前に見える美しいウッドシェル) */}
            <div className="absolute -bottom-3 inset-x-3 h-4 bg-gradient-to-b from-amber-900 via-red-950 to-slate-950 rounded-b-full border-t border-slate-600 shadow-md pointer-events-none -z-20" />

            {/* Coated White Batter Head (コーテッドホワイト打面のざらつきと陰影) */}
            <div
              className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: isGlowing
                  ? `radial-gradient(circle at 45% 42%, #ffffff 0%, #f1f5f9 40%, ${config.color} 90%, #64748b 100%)`
                  : 'radial-gradient(circle at 45% 42%, #ffffff 0%, #f8fafc 45%, #e2e8f0 75%, #cbd5e1 100%)',
                boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.4), inset 0 -2px 6px rgba(0,0,0,0.2)',
              }}
            >
              {/* Coated Texture Surface Grain */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#475569_1px,transparent_1px)]"
                style={{ backgroundSize: '5px 5px' }}
              />

              {/* Overtone Control Ring / Remo CS Center Dot (打面中央のコントロールドット) */}
              <div className="w-[36%] h-[36%] rounded-full border border-slate-300/80 bg-slate-100/40 shadow-inner flex items-center justify-center pointer-events-none">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300/60" />
              </div>

              {/* Iconic MoonGel Damper Pad (ドラマー御用達！ブルーのムーンジェルミュート) */}
              <div className="absolute top-2 left-3 w-3 h-2 rounded bg-cyan-500/80 border border-cyan-300/90 shadow-sm pointer-events-none" />

              {/* Snare Strainer Throw-off lever on right edge */}
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-3.5 bg-gradient-to-r from-slate-200 to-slate-400 rounded-sm shadow pointer-events-none" />
            </div>

            {/* Snare Stand Basket Arms below */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3 h-4 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-500 rounded-b shadow pointer-events-none -z-20" />
          </div>
        ) : (
          /* --- TOM-TOMS & FLOOR TOM (CLEAR HEAD, PINSTRIPE, WOOD SHELL & LUGS) --- */
          <div
            className="relative w-full h-full rounded-full transition-transform shadow-2xl flex items-center justify-center"
            style={{
              transform: 'rotateX(26deg)',
              background: isGlowing ? config.color : '#334155',
              boxShadow: isGlowing
                ? `0 0 25px ${config.glowColor}, 0 10px 24px rgba(0,0,0,0.8)`
                : '0 10px 24px rgba(0,0,0,0.85), inset 0 2px 5px rgba(255,255,255,0.6)',
              padding: '5px', // Triple Flanged Chrome Rim
            }}
          >
            {/* Chrome Tension Lugs (テンションラグ金具) */}
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <div
                key={deg}
                className="absolute w-1.5 h-2 bg-gradient-to-r from-slate-200 via-white to-slate-400 rounded-sm shadow border border-slate-500 pointer-events-none -z-10"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${deg}deg) translate(0, -${isFloorTom ? 42 : 36}px)`,
                }}
              />
            ))}

            {/* Triple Flanged Chrome Rim (クロームリム) */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: '3px solid #94a3b8',
                boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.7), inset 0 -2px 3px rgba(0,0,0,0.6)',
              }}
            />

            {/* Cylinder Shell Depth at bottom (手前に見えるディープサファイア/メイプルシェル) */}
            <div
              className="absolute -bottom-3 inset-x-2 h-4 rounded-b-full border-t border-slate-600 shadow-md pointer-events-none -z-20"
              style={{
                background: 'linear-gradient(180deg, #1e3a8a 0%, #0f172a 60%, #020617 100%)',
              }}
            />

            {/* Clear Drum Head with Remo Pinstripe Ring (ピンストライプ入りのクリアヘッド) */}
            <div
              className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: isGlowing
                  ? `radial-gradient(circle at 45% 40%, #67e8f9 0%, #0284c7 45%, ${config.color} 85%, #0369a1 100%)`
                  : 'radial-gradient(circle at 45% 40%, #334155 0%, #1e293b 50%, #0f172a 80%, #020617 100%)',
                boxShadow: 'inset 0 5px 12px rgba(0,0,0,0.6), inset 0 -2px 6px rgba(0,0,0,0.4)',
              }}
            >
              {/* Outer Black Pinstripe Dampening Ring (ピンストライプリング) */}
              <div className="absolute inset-2 rounded-full border-2 border-black/50 pointer-events-none" />

              {/* Head Center Clear Reflection */}
              <div className="w-[32%] h-[32%] rounded-full border border-slate-500/30 bg-white/5 pointer-events-none" />
            </div>

            {/* Tom Holder L-Rod or Floor Tom Legs */}
            {isFloorTom ? (
              <>
                {/* 3 Chrome Floor Tom Legs (フロアタムの3本レッグ) */}
                <div className="absolute -left-2 top-2 w-1.5 h-6 bg-gradient-to-r from-slate-400 via-white to-slate-500 rounded shadow pointer-events-none -z-20 -rotate-12" />
                <div className="absolute -right-2 top-2 w-1.5 h-6 bg-gradient-to-r from-slate-400 via-white to-slate-500 rounded shadow pointer-events-none -z-20 rotate-12" />
              </>
            ) : (
              /* Mounted Tom Omni-Ball L-Rod Bracket */
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2 h-4 bg-gradient-to-r from-slate-400 via-white to-slate-500 rounded-b shadow pointer-events-none -z-20" />
            )}
          </div>
        )}

        {/* PAD LABEL & SHORT KEY HINT */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
          <span
            className="text-[11px] sm:text-xs font-black tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-center leading-tight"
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
              className="text-[8px] sm:text-[9px] font-black uppercase opacity-85 drop-shadow-sm leading-none mt-0.5"
              style={{
                color: isCymbal ? '#78350f' : isSnare ? '#334155' : '#94a3b8',
              }}
            >
              {config.shortName}
            </span>
          )}
          {showKeyHints && (
            <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-black/75 text-slate-100 border border-white/20 mt-0.5 shadow">
              {config.keyLabel.split(' / ')[0]}
            </span>
          )}
        </div>

        {/* LOCKED BADGE (for RPG Training curriculum) */}
        {!isUnlocked && (
          <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/75 z-30 pointer-events-none">
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
        className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0d121f] to-slate-950 rounded-3xl border-2 border-slate-800/80 shadow-2xl overflow-hidden"
        style={{
          transform: 'rotateX(14deg)',
          transformOrigin: 'bottom center',
        }}
      >
        {/* Heavy-Duty Non-Slip Studio Drum Rug (プロ用ドラムマットのテクスチャ) */}
        <div
          className="absolute inset-2 rounded-2xl border border-amber-900/30 opacity-30 bg-[radial-gradient(#f59e0b_1px,transparent_1px),radial-gradient(#94a3b8_1px,transparent_1px)]"
          style={{
            backgroundSize: '20px 20px, 10px 10px',
            backgroundPosition: '0 0, 5px 5px',
          }}
        />

        {/* Studio Lighting Overheads (ドラマーを照らす上部スポットライト) */}
        <div className="absolute -top-12 left-1/4 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 right-1/4 w-44 h-44 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-64 h-28 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* CHROME HARDWARE STANDS ON THE RUG (マット上に広がるスタンドの三脚・脚部) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40 -z-5"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hi-Hat Stand Tripod Base (Left) */}
          <line x1="22%" y1="65%" x2="16%" y2="82%" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="22%" y1="65%" x2="28%" y2="82%" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="22%" y1="65%" x2="22%" y2="52%" stroke="#cbd5e1" strokeWidth="4.5" strokeLinecap="round" />
          {/* Snare Basket Stand Center */}
          <line x1="50%" y1="68%" x2="43%" y2="86%" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="50%" y1="68%" x2="57%" y2="86%" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="50%" y1="68%" x2="50%" y2="56%" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
          {/* Floor Tom / Ride Stand (Right) */}
          <line x1="78%" y1="65%" x2="72%" y2="82%" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="78%" y1="65%" x2="84%" y2="82%" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="78%" y1="65%" x2="78%" y2="52%" stroke="#cbd5e1" strokeWidth="4.5" strokeLinecap="round" />
          {/* Double Tom Holder Post emerging from Kick */}
          <line x1="50%" y1="36%" x2="50%" y2="24%" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
          <circle cx="50%" cy="24%" r="4" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
        </svg>

        {/* Stage Perspective Depth Lines */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
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

      {/* 3. VIRTUAL HICKORY DRUMSTICKS WITH PHYSICAL STRIKE & REBOUND */}
      <div className="absolute inset-x-0 top-0 h-28 pointer-events-none z-35 overflow-visible">
        {/* Left Hand Stick (Hickory Maple Wood with Tapered Tip) */}
        <div
          className={`absolute left-[28%] sm:left-[32%] top-2 w-2 sm:w-2.5 h-20 sm:h-24 origin-top transition-transform duration-75 ${
            leftStickStrike ? 'animate-stick-strike' : ''
          }`}
          style={{
            transform: leftStickStrike ? undefined : 'rotate(-22deg)',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))',
          }}
        >
          <div className="w-full h-full bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 rounded-full border border-amber-400/40 relative">
            {/* Acorn Wood Tip */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-100 border border-amber-300 shadow-sm" />
            {/* Stick Shoulder Ring */}
            <div className="absolute bottom-6 inset-x-0 h-0.5 bg-amber-500/40" />
          </div>
        </div>

        {/* Right Hand Stick (Hickory Maple Wood with Tapered Tip) */}
        <div
          className={`absolute right-[28%] sm:right-[32%] top-2 w-2 sm:w-2.5 h-20 sm:h-24 origin-top transition-transform duration-75 ${
            rightStickStrike ? 'animate-stick-strike' : ''
          }`}
          style={{
            transform: rightStickStrike ? undefined : 'rotate(22deg)',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))',
          }}
        >
          <div className="w-full h-full bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 rounded-full border border-amber-400/40 relative">
            {/* Acorn Wood Tip */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-100 border border-amber-300 shadow-sm" />
            {/* Stick Shoulder Ring */}
            <div className="absolute bottom-6 inset-x-0 h-0.5 bg-amber-500/40" />
          </div>
        </div>
      </div>

      {/* 4. STUDIO ROOM AMBIENCE SELECTOR HUD */}
      <div className="absolute top-2 right-2 z-40 flex items-center gap-1 bg-slate-950/85 backdrop-blur-sm px-2 py-1 rounded-xl border border-slate-700/80 shadow-md">
        <span className="text-[9px] font-mono text-amber-400 font-black flex items-center gap-0.5 mr-0.5">
          <span>🎙️</span>
          <span className="hidden sm:inline">ROOM:</span>
        </span>
        {(['dead', 'vintage', 'arena'] as const).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAmbiencePresetState(preset);
              drumSynth.setAmbiencePreset(preset);
            }}
            className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-all ${
              ambiencePreset === preset
                ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={`スタジオ音響切り替え: ${preset}`}
          >
            {preset === 'dead' ? 'Dead' : preset === 'vintage' ? 'Vintage' : 'Arena'}
          </button>
        ))}
      </div>

      {/* 1. HI-HAT PEDAL CHOKE FOOTBOARD BUTTON */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          drumSynth.chokeHiHat();
          setIsChokedActive(true);
          setTimeout(() => setIsChokedActive(false), 220);
        }}
        className="absolute bottom-2 left-3 z-40 px-2 py-1 rounded-xl bg-slate-950/90 hover:bg-slate-800 active:scale-95 border border-cyan-500/50 text-cyan-300 text-[9px] font-black tracking-tight shadow-md flex items-center gap-1 transition"
        title="ハイハットの余韻を消音（チョーク・ペダル） [P]"
      >
        <span>🦶</span>
        <span>CHOKE [P]</span>
      </button>

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
