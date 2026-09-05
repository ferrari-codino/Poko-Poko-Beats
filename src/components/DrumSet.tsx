import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DrumPartId, DrumLayoutType, PadScale, CustomDrumKit, DeviceMode } from '../types';
import { DRUM_PARTS } from '../data/drumConfig';
import { drumSynth } from '../audio/drumSynth';
import { SHELL_MATERIALS, HEAD_STYLES, HARDWARE_FINISHES, CYMBAL_FINISHES } from '../data/customDrumKits';
import { Lock, Sliders, Volume2, Info, X, Sparkles } from 'lucide-react';

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
  customKit?: CustomDrumKit;
  deviceMode?: DeviceMode;
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
  customKit,
  deviceMode = 'tablet',
}) => {
  const activeCustomKit = customKit;
  const currentMaterial = SHELL_MATERIALS.find((m) => m.id === activeCustomKit?.shellMaterial) || SHELL_MATERIALS[0];
  const currentHead = HEAD_STYLES.find((h) => h.id === activeCustomKit?.headStyle) || HEAD_STYLES[0];
  const currentHw = HARDWARE_FINISHES.find((h) => h.id === activeCustomKit?.hardwareFinish) || HARDWARE_FINISHES[0];
  const currentCymbal = CYMBAL_FINISHES.find((c) => c.id === activeCustomKit?.cymbalFinish) || CYMBAL_FINISHES[0];
  const shellColor = activeCustomKit?.shellColor || '#2563eb';

  // Synchronize Active Kit with Audio Engine for dynamic acoustic material synthesis
  useEffect(() => {
    if (activeCustomKit) {
      drumSynth.setCustomKit(activeCustomKit);
    }
  }, [activeCustomKit]);

  const [pressedParts, setPressedParts] = useState<Record<string, boolean>>({});
  const [wobbleRotations, setWobbleRotations] = useState<Record<string, number>>({});
  const [particles, setParticles] = useState<Particle[]>([]);
  const [kickPulse, setKickPulse] = useState(false);

  // Pro Drummer Realism States
  const [membraneWaves, setMembraneWaves] = useState<Record<string, number>>({});
  const [cymbalShimmers, setCymbalShimmers] = useState<Record<string, number>>({});
  const [subBassShockwave, setSubBassShockwave] = useState(false);
  const [isRimshotActive, setIsRimshotActive] = useState(false);
  const [isCrossStickActive, setIsCrossStickActive] = useState(false);
  const [isRideBellActive, setIsRideBellActive] = useState(false);
  const [isCrashChokedActive, setIsCrashChokedActive] = useState(false);
  const [isChokedActive, setIsChokedActive] = useState(false);
  const [leftStickStrike, setLeftStickStrike] = useState(false);
  const [rightStickStrike, setRightStickStrike] = useState(false);
  const [ambiencePreset, setAmbiencePresetState] = useState<'dead' | 'vintage' | 'arena'>('vintage');

  // Pro Acoustic Effects: Moongel Damper & Sympathetic Snare Wire Buzz
  const [moongelEnabled, setMoongelEnabled] = useState(false);
  const [sympatheticBuzzEnabled, setSympatheticBuzzEnabled] = useState(true);
  const [snappyBuzzActive, setSnappyBuzzActive] = useState(false);
  const [proTuningOpen, setProTuningOpen] = useState(false);

  const toggleMoongel = useCallback(() => {
    setMoongelEnabled((prev) => {
      const next = !prev;
      drumSynth.setMoongelDamping(next);
      return next;
    });
  }, []);

  const toggleSympatheticBuzz = useCallback(() => {
    setSympatheticBuzzEnabled((prev) => {
      const next = !prev;
      drumSynth.setSympatheticBuzz(next);
      return next;
    });
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastHitTimeRef = useRef<Record<string, number>>({});

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

  // Handle striking a drum pad (with authentic rimshot, cross-stick, ride bell, choke & membrane physics)
  const handleHit = useCallback(
    (
      part: DrumPartId,
      e?: React.PointerEvent | React.TouchEvent | React.MouseEvent,
      options?: { forceRimshot?: boolean; forceCrossStick?: boolean; forceRideBell?: boolean; forceChoke?: boolean }
    ) => {
      const forceRimshot = options?.forceRimshot;
      const forceCrossStick = options?.forceCrossStick;
      const forceRideBell = options?.forceRideBell;
      const forceChoke = options?.forceChoke;

      // Crash Choke Hand Mute action
      if (part === 'crash' && forceChoke) {
        drumSynth.chokeCrash();
        setIsCrashChokedActive(true);
        setTimeout(() => setIsCrashChokedActive(false), 240);
        return;
      }

      // Haptic feedback
      if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(forceRimshot ? 35 : forceCrossStick ? 18 : 24);
        } catch {}
      }

      const now = performance.now();

      // Check for Snare Open Rimshot vs Cross-Stick
      let isRim = false;
      let isCross = false;
      if (part === 'snare') {
        if (forceCrossStick) {
          isCross = true;
        } else if (forceRimshot) {
          isRim = true;
        } else if (e && 'currentTarget' in e && e.currentTarget) {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const clientY = 'clientY' in e ? e.clientY : 0;
          const clientX = 'clientX' in e ? e.clientX : 0;
          if (clientY > 0) {
            const relY = (clientY - rect.top) / rect.height;
            const relX = (clientX - rect.left) / rect.width;
            if (relY < 0.28) {
              isRim = true; // Top hoop rimshot
            } else if (relY > 0.65 && relX < 0.35) {
              isCross = true; // Bottom-left cross-stick wood hoop position
            }
          }
        }
      }

      // Check for Ride Bell: forceRideBell OR click within center 32% bell dome
      let isRideBell = false;
      if (part === 'ride') {
        if (forceRideBell) {
          isRideBell = true;
        } else if (e && 'currentTarget' in e && e.currentTarget) {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const clientY = 'clientY' in e ? e.clientY : 0;
          const clientX = 'clientX' in e ? e.clientX : 0;
          if (clientX > 0 && clientY > 0) {
            const dx = clientX - (rect.left + rect.width / 2);
            const dy = clientY - (rect.top + rect.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < rect.width * 0.18) {
              isRideBell = true;
            }
          }
        }
      }

      // Play synthesized acoustic sound with material & pro physics
      if (isCross) {
        drumSynth.playCrossStick();
        setIsCrossStickActive(true);
        setTimeout(() => setIsCrossStickActive(false), 200);
      } else if (isRim) {
        drumSynth.playRimshot();
        setIsRimshotActive(true);
        setTimeout(() => setIsRimshotActive(false), 240);
      } else if (part === 'hihatClosed') {
        drumSynth.playHiHatClosed();
        setIsChokedActive(true);
        setTimeout(() => setIsChokedActive(false), 200);
      } else {
        // Standard full-kit parts including ride cymbal always play realistic acoustic sound
        drumSynth.playDrum(part);
      }

      // Sympathetic Snare Buzz visualization on kick & toms
      if (part === 'kick' || part === 'tomHigh' || part === 'tomLow' || part === 'tomFloor') {
        if (sympatheticBuzzEnabled) {
          setSnappyBuzzActive(true);
          setTimeout(() => setSnappyBuzzActive(false), 160);
        }
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

      // Notify parent game loop (always notify 'snare' even if rimshot or cross-stick, so game scores it flawlessly)
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
    [hapticsEnabled, onDrumHit, isPartUnlocked, spawnHitParticles, sympatheticBuzzEnabled]
  );

  // Keyboard controls listener
  useEffect(() => {
    const keyMap: Record<string, { part: DrumPartId; rimshot?: boolean; crossStick?: boolean; rideBell?: boolean; choke?: boolean }> = {
      ' ': { part: 'kick' },
      b: { part: 'kick' },
      B: { part: 'kick' },
      s: { part: 'snare' },
      S: { part: 'snare' },
      d: { part: 'snare', rimshot: true }, // [D] or [R] triggers Authentic Open Rimshot!
      D: { part: 'snare', rimshot: true },
      r: { part: 'snare', rimshot: true },
      R: { part: 'snare', rimshot: true },
      x: { part: 'snare', crossStick: true }, // [X] triggers Cross-Stick!
      X: { part: 'snare', crossStick: true },
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
      z: { part: 'crash', choke: true }, // [Z] triggers Crash Cymbal Choke (Hand Mute)!
      Z: { part: 'crash', choke: true },
      v: { part: 'ride' },
      V: { part: 'ride' },
      u: { part: 'ride' }, // [U] and [V] both trigger full authentic Ride Cymbal!
      U: { part: 'ride' },
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

      if (entry.choke && part === 'crash') {
        handleHit('crash', undefined, { forceChoke: true });
      } else if (entry.choke) {
        drumSynth.chokeHiHat();
        setIsChokedActive(true);
        setTimeout(() => setIsChokedActive(false), 200);
      } else if (entry.crossStick) {
        handleHit('snare', undefined, { forceCrossStick: true });
      } else if (entry.rimshot) {
        handleHit('snare', undefined, { forceRimshot: true });
      } else if (entry.rideBell) {
        handleHit('ride', undefined, { forceRideBell: true });
      } else {
        handleHit(part);
      }
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

    const triggerPadHit = (
      e?: React.PointerEvent | React.TouchEvent | React.MouseEvent,
      options?: { forceRimshot?: boolean; forceCrossStick?: boolean; forceRideBell?: boolean; forceChoke?: boolean }
    ) => {
      const now = Date.now();
      const last = lastHitTimeRef.current[part] || 0;
      if (now - last < 30) return;
      lastHitTimeRef.current[part] = now;
      handleHit(part, e, options);
    };

    return (
      <div
        key={part}
        id={`drum-pad-${part}`}
        onPointerDown={(e) => {
          e.preventDefault();
          triggerPadHit(e);
        }}
        className={`group relative flex items-center justify-center cursor-pointer select-none touch-none transition-all duration-75 ${
          !isUnlocked ? 'brightness-90' : ''
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
              e.preventDefault();
              e.stopPropagation();
              triggerPadHit(e, { forceRimshot: true });
            }}
            className="absolute -top-1.5 inset-x-2 h-5 rounded-t-full bg-gradient-to-b from-amber-300/40 via-white/20 to-transparent cursor-pointer z-40 hover:bg-amber-400/30 active:bg-amber-400/60 transition-colors flex items-center justify-center group/rim"
            title="オープン・リムショット打面 (フープ同時叩き)"
          >
            <span className="text-[7px] font-mono font-black text-amber-200/90 tracking-tighter bg-black/70 px-1 py-0.2 rounded border border-amber-400/40 opacity-75 group-hover/rim:opacity-100 transition-opacity">
              RIMSHOT [R/D]
            </span>
          </div>
        )}

        {/* SNARE CROSS-STICK HOTSPOT (左下リム・スティック叩き) */}
        {isSnare && isUnlocked && (
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              triggerPadHit(e, { forceCrossStick: true });
            }}
            className="absolute -bottom-1 left-1.5 w-10 h-5 rounded-bl-full bg-gradient-to-tr from-amber-700/60 via-amber-900/40 to-transparent cursor-pointer z-40 hover:brightness-125 active:brightness-150 transition-all flex items-center justify-center group/stick"
            title="クロススティック / クローズドリムショット [X]"
          >
            <span className="text-[7px] font-mono font-black text-amber-200/90 tracking-tighter bg-black/80 px-1 py-0.2 rounded border border-amber-600/40 opacity-75 group-hover/stick:opacity-100 transition-opacity">
              STICK [X]
            </span>
          </div>
        )}

        {/* CRASH CHOKE BUTTON (手動シンバル掴み消音) */}
        {part === 'crash' && isUnlocked && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleHit('crash', e, { forceChoke: true });
            }}
            className="absolute -top-3 -right-2 px-1.5 py-0.5 rounded-md bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/50 shadow-lg text-[8px] font-bold z-40 flex items-center gap-0.5 active:scale-95 transition-all cursor-pointer"
            title="クラッシュシンバルを手で掴んで消音 [Z]"
          >
            <span>✋</span>
            <span>CHOKE [Z]</span>
          </button>
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

        {/* 3. SNARE CROSS-STICK CELEBRATION BADGE */}
        {isSnare && isCrossStickActive && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce whitespace-nowrap">
            <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 text-slate-950 font-black text-[9px] shadow-xl border border-amber-300 flex items-center gap-1">
              <span>🪵</span>
              <span>CROSS-STICK!</span>
            </div>
          </div>
        )}

        {/* 3. RIDE BELL CELEBRATION BADGE */}
        {part === 'ride' && isRideBellActive && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce whitespace-nowrap">
            <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 text-slate-950 font-black text-[9px] shadow-xl border border-amber-200 flex items-center gap-1">
              <span>🔔</span>
              <span>RIDE BELL!</span>
            </div>
          </div>
        )}

        {/* 3. CRASH CHOKED CELEBRATION BADGE */}
        {part === 'crash' && isCrashChokedActive && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce whitespace-nowrap">
            <div className="px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 font-black text-[9px] shadow-xl border border-cyan-400/50 flex items-center gap-1">
              <span>✋</span>
              <span>CHOKED!</span>
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
          /* --- B20 BRONZE / CUSTOM FINISH CYMBAL WITH LATHE RIDGES, BELL DOME, FELT & WINGNUT --- */
          <div
            className="relative w-full h-full rounded-full flex items-center justify-center transition-transform shadow-2xl bg-slate-950"
            style={{
              transform: 'rotateX(25deg)',
              background: isGlowing
                ? `radial-gradient(circle at 38% 36%, #fffbeb 0%, #fef08a 20%, ${config.color} 55%, #b45309 85%, #78350f 100%)`
                : currentCymbal.gradient,
              boxShadow: isGlowing
                ? `0 0 25px ${config.glowColor}, 0 14px 28px rgba(0,0,0,0.85), inset 0 2px 6px rgba(255,255,255,0.7)`
                : `0 12px 26px rgba(0,0,0,0.85), inset 0 2px 7px ${currentCymbal.shineColor}, inset 0 -3px 8px rgba(0,0,0,0.6)`,
              border: `2px solid ${isGlowing ? config.color : currentCymbal.borderColor}`,
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

            {/* Raised Center Cup / Dome (シンバル中央の立体カップ) */}
            <div
              className="relative w-[34%] h-[34%] rounded-full flex items-center justify-center border-2 shadow-lg pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #fef08a 0%, #d97706 45%, #78350f 100%)',
                borderColor: currentCymbal.borderColor,
                boxShadow: '0 4px 10px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.6)',
              }}
            >
              {/* Black Cymbal Cushion Felt (シンバル保護フェルトワッシャー) */}
              <div className="w-[42%] h-[42%] rounded-full bg-slate-950 border border-slate-700 shadow-inner flex items-center justify-center pointer-events-none">
                {/* Custom Finish Wingnut (蝶ネジ / ウィングボルト) */}
                <div
                  className="relative w-3.5 h-1.5 rounded shadow border flex items-center justify-center"
                  style={{ backgroundColor: currentHw.color, borderColor: currentHw.borderColor }}
                >
                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                </div>
              </div>
            </div>

            {/* Hi-Hat Stand Dual Cymbals / Clutch Detail */}
            {part === 'hihatClosed' && (
              <div className="absolute -bottom-2 inset-x-4 h-2 bg-gradient-to-b from-amber-950 to-black rounded-b-full opacity-70 pointer-events-none" />
            )}

            {/* Stand Boom Tilter Arm below cymbal */}
            <div
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-2 h-5 rounded-b shadow-md pointer-events-none -z-10"
              style={{ backgroundColor: currentHw.color }}
            />
          </div>
        ) : isKick ? (
          /* --- 22" BASS DRUM (WOOD HOOPS, CUSTOM CLAWS, SLAM PAD & KICK PEDAL) --- */
          <div
            className={`relative w-full h-full rounded-[30px] transition-all duration-75 flex flex-col items-center justify-between p-1.5 shadow-2xl ${
              kickPulse ? 'scale-[1.03]' : ''
            }`}
            style={{
              transform: 'rotateX(15deg)',
              backgroundColor: shellColor,
              backgroundImage: currentMaterial.texturePattern,
              boxShadow: isGlowing
                ? `0 0 35px ${config.glowColor}, 0 16px 36px rgba(0,0,0,0.9)`
                : '0 16px 36px rgba(0,0,0,0.95), inset 0 2px 8px rgba(255,255,255,0.2)',
              border: `3px solid ${isGlowing ? config.color : currentHw.color}`,
            }}
          >
            {/* Outer Heavy Wood Hoop (ブラックラッカー＋カスタムインレイ帯) */}
            <div className="absolute inset-0.5 rounded-[28px] border-4 border-slate-900 pointer-events-none">
              <div
                className="w-full h-full rounded-[24px] border"
                style={{ borderColor: `${shellColor}88` }}
              />
            </div>

            {/* Custom Tension Claws & T-Rod Bolts (テンションクロー金具) */}
            <div
              className="absolute -top-1.5 left-6 w-3.5 h-3 rounded-sm shadow-md border pointer-events-none"
              style={{ backgroundColor: currentHw.color, borderColor: currentHw.borderColor }}
            />
            <div
              className="absolute -top-1.5 right-6 w-3.5 h-3 rounded-sm shadow-md border pointer-events-none"
              style={{ backgroundColor: currentHw.color, borderColor: currentHw.borderColor }}
            />
            <div
              className="absolute -bottom-1.5 left-6 w-3.5 h-3 rounded-sm shadow-md border pointer-events-none"
              style={{ backgroundColor: currentHw.color, borderColor: currentHw.borderColor }}
            />
            <div
              className="absolute -bottom-1.5 right-6 w-3.5 h-3 rounded-sm shadow-md border pointer-events-none"
              style={{ backgroundColor: currentHw.color, borderColor: currentHw.borderColor }}
            />
            <div
              className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3.5 rounded-sm shadow-md border pointer-events-none"
              style={{ backgroundColor: currentHw.color, borderColor: currentHw.borderColor }}
            />
            <div
              className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3.5 rounded-sm shadow-md border pointer-events-none"
              style={{ backgroundColor: currentHw.color, borderColor: currentHw.borderColor }}
            />

            {/* Deep Drum Cylinder Interior / Batter Head */}
            <div
              className="relative w-full h-full rounded-[24px] flex flex-col items-center justify-center overflow-hidden"
              style={{
                background: isGlowing
                  ? `radial-gradient(circle at 50% 50%, #334155 0%, #1e293b 50%, ${config.color} 90%, #020617 100%)`
                  : `radial-gradient(circle at 50% 40%, ${currentHead.color} 0%, #0f172a 75%, #020617 100%)`,
                boxShadow: 'inset 0 6px 18px rgba(0,0,0,0.8), inset 0 0 12px rgba(255,255,255,0.06)',
              }}
            >
              {/* Outer Head Muffle Ring */}
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
              <div
                className="w-12 h-5 rounded-t-lg border shadow-xl flex items-center justify-around px-1"
                style={{
                  background: `linear-gradient(to top, ${currentHw.color}, ${currentHw.highlight})`,
                  borderColor: currentHw.borderColor,
                }}
              >
                <div className="w-0.5 h-3 bg-slate-700 rounded-full" />
                <div className="w-0.5 h-3 bg-slate-700 rounded-full" />
                <div className="w-0.5 h-3 bg-slate-700 rounded-full" />
              </div>
            </div>
          </div>
        ) : isSnare ? (
          /* --- 14" SNARE DRUM (DIE-CAST HOOP, COATED WHITE HEAD, MOONGEL, TENSION LUGS) --- */
          <div
            className="relative w-full h-full rounded-full transition-transform shadow-2xl flex items-center justify-center"
            style={{
              transform: 'rotateX(26deg)',
              background: isGlowing ? config.color : currentHw.color,
              boxShadow: isGlowing
                ? `0 0 30px ${config.glowColor}, 0 12px 28px rgba(0,0,0,0.85)`
                : '0 12px 28px rgba(0,0,0,0.85), inset 0 3px 6px rgba(255,255,255,0.7)',
              padding: '6px', // Thick Die-cast Chrome/Gold Rim
            }}
          >
            {/* 10 Chrome Tension Lugs around Hoop (ダイキャストリムの10本テンションボルト) */}
            {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
              <div
                key={deg}
                className="absolute w-2 h-2.5 rounded-sm shadow border pointer-events-none -z-10"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${deg}deg) translate(0, -${padScale === 'huge' ? 46 : 42}px)`,
                  backgroundColor: currentHw.color,
                  borderColor: currentHw.borderColor,
                }}
              />
            ))}

            {/* Heavy Die-cast Chrome Hoop Rim (重厚なクロームフープの金属光沢) */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: `4px solid ${currentHw.color}`,
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.6)',
              }}
            />

            {/* Visible Drum Shell Cylinder Depth at bottom (手前に見える美しいウッドシェル) */}
            <div
              className="absolute -bottom-3 inset-x-3 h-4 rounded-b-full border-t border-slate-600 shadow-md pointer-events-none -z-20"
              style={{
                backgroundColor: shellColor,
                backgroundImage: currentMaterial.texturePattern,
              }}
            />

            {/* Coated White / Custom Batter Head (打面のざらつきと陰影) */}
            <div
              className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: isGlowing
                  ? `radial-gradient(circle at 45% 42%, #ffffff 0%, ${currentHead.color} 40%, ${config.color} 90%, #64748b 100%)`
                  : `radial-gradient(circle at 45% 42%, #ffffff 0%, ${currentHead.color} 55%, ${currentHead.rimColor} 100%)`,
                boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.4), inset 0 -2px 6px rgba(0,0,0,0.2)',
              }}
            >
              {/* Coated Texture Surface Grain */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#475569_1px,transparent_1px)]"
                style={{ backgroundSize: '5px 5px' }}
              />

              {/* Overtone Control Ring / Center Dot */}
              <div className="w-[36%] h-[36%] rounded-full border border-slate-400/60 bg-slate-100/30 shadow-inner flex items-center justify-center pointer-events-none">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400/60" />
              </div>

              {/* Iconic MoonGel Damper Pad (ドラマー御用達！ブルーのムーンジェルミュート - クリックで着脱可能！) */}
              <div
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleMoongel();
                }}
                className={`absolute top-2 left-3 rounded transition-all cursor-pointer pointer-events-auto z-30 flex items-center justify-center ${
                  moongelEnabled
                    ? 'w-3.5 h-2.5 bg-cyan-400/90 border border-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.85)] scale-110'
                    : 'w-3 h-2 border border-dashed border-cyan-400/40 bg-cyan-950/30 hover:border-cyan-300'
                }`}
                title={`Moongel ダンパー: ${moongelEnabled ? '装着中 (倍音タイトカット・クリックで外す)' : '未装着 (クリックで貼る)'}`}
              >
                {!moongelEnabled && (
                  <span className="text-[5px] text-cyan-300 font-mono block -mt-0.5 leading-none opacity-80">+gel</span>
                )}
              </div>

              {/* Snare Strainer Throw-off lever on right edge (キックやタム打撃時にスナッピーがジジッと共鳴！) */}
              <div
                className={`absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-3.5 rounded-sm shadow pointer-events-none transition-all duration-75 ${
                  snappyBuzzActive ? 'scale-125 translate-x-0.5 bg-amber-400 shadow-[0_0_8px_#fbbf24]' : ''
                }`}
                style={{ backgroundColor: snappyBuzzActive ? '#fbbf24' : currentHw.color }}
              >
                {snappyBuzzActive && (
                  <span className="absolute -top-3 -right-2 text-[8px] animate-ping font-bold text-amber-300">⚡</span>
                )}
              </div>
            </div>

            {/* Snare Stand Basket Arms below */}
            <div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3 h-4 rounded-b shadow pointer-events-none -z-20"
              style={{ backgroundColor: currentHw.color }}
            />
          </div>
        ) : (
          /* --- TOM-TOMS & FLOOR TOM (CLEAR HEAD, PINSTRIPE, WOOD SHELL & LUGS) --- */
          <div
            className="relative w-full h-full rounded-full transition-transform shadow-2xl flex items-center justify-center"
            style={{
              transform: 'rotateX(26deg)',
              background: isGlowing ? config.color : currentHw.color,
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
                className="absolute w-1.5 h-2 rounded-sm shadow border pointer-events-none -z-10"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${deg}deg) translate(0, -${isFloorTom ? 42 : 36}px)`,
                  backgroundColor: currentHw.color,
                  borderColor: currentHw.borderColor,
                }}
              />
            ))}

            {/* Triple Flanged Rim */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: `3px solid ${currentHw.color}`,
                boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.7), inset 0 -2px 3px rgba(0,0,0,0.6)',
              }}
            />

            {/* Cylinder Shell Depth at bottom (手前に見えるカスタムシェル) */}
            <div
              className="absolute -bottom-3 inset-x-2 h-4 rounded-b-full border-t border-slate-600 shadow-md pointer-events-none -z-20"
              style={{
                backgroundColor: shellColor,
                backgroundImage: currentMaterial.texturePattern,
              }}
            />

            {/* Selected Drum Head with Dampening Ring */}
            <div
              className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: isGlowing
                  ? `radial-gradient(circle at 45% 40%, #ffffff 0%, ${currentHead.color} 45%, ${config.color} 85%, #0369a1 100%)`
                  : `radial-gradient(circle at 45% 40%, #ffffff 0%, ${currentHead.color} 50%, ${currentHead.rimColor} 100%)`,
                boxShadow: 'inset 0 5px 12px rgba(0,0,0,0.6), inset 0 -2px 6px rgba(0,0,0,0.4)',
              }}
            >
              {/* Outer Dampening Ring */}
              <div className="absolute inset-2 rounded-full border-2 border-black/40 pointer-events-none" />

              {/* Head Center Clear Reflection */}
              <div className="w-[32%] h-[32%] rounded-full border border-slate-500/30 bg-white/5 pointer-events-none" />

              {/* Tom Moongel Patch when active */}
              {moongelEnabled && (
                <div
                  className="absolute top-2 left-3 w-3 h-2 rounded bg-cyan-400/85 border border-cyan-200 shadow-[0_0_6px_rgba(34,211,238,0.7)] pointer-events-none"
                  title="Moongel装着中"
                />
              )}
            </div>

            {/* Tom Holder L-Rod or Floor Tom Legs */}
            {isFloorTom ? (
              <>
                {/* 3 Chrome Floor Tom Legs (フロアタムの3本レッグ) */}
                <div
                  className="absolute -left-2 top-2 w-1.5 h-6 rounded shadow pointer-events-none -z-20 -rotate-12"
                  style={{ backgroundColor: currentHw.color }}
                />
                <div
                  className="absolute -right-2 top-2 w-1.5 h-6 rounded shadow pointer-events-none -z-20 rotate-12"
                  style={{ backgroundColor: currentHw.color }}
                />
              </>
            ) : (
              /* Mounted Tom Omni-Ball L-Rod Bracket */
              <div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2 h-4 rounded-b shadow pointer-events-none -z-20"
                style={{ backgroundColor: currentHw.color }}
              />
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
      className={`relative w-full ${
        deviceMode === 'smartphone'
          ? 'max-w-2xl h-full min-h-[380px] sm:min-h-[420px]'
          : 'max-w-5xl h-full min-h-[440px] sm:min-h-[520px]'
      } mx-auto flex items-center justify-center p-0.5 sm:p-2 select-none touch-none`}
      style={{
        perspective: '1000px', // Authentic deep 3D perspective
      }}
    >
      {/* ========================================================================= */}
      {/* 3D DRUM STAGE RISER PLATFORM & PROFESSIONAL DRUM MAT (超リアルなドラム台座) */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 rounded-3xl overflow-hidden transition-transform duration-75 ${
          kickPulse ? 'scale-[1.006]' : ''
        }`}
        style={{
          transform: 'rotateX(13deg)',
          transformOrigin: 'bottom center',
          background: 'linear-gradient(180deg, #0f172a 0%, #070a12 50%, #020617 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255,255,255,0.08), inset 0 2px 10px rgba(255,255,255,0.12)',
        }}
      >
        {/* Stage Riser Hardwood / Carbon Beveled Frame Border (ステージ台座の厚みと面取りフレーム) */}
        <div className="absolute inset-0 rounded-3xl border-[6px] border-slate-800/90 pointer-events-none shadow-2xl">
          {/* Metallic Corner Protection Brackets (四隅の頑丈なスチールコーナー補強金具とリベット) */}
          <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-amber-400/70 rounded-tl-xl pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shadow-sm m-0.5" />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-amber-400/70 rounded-tr-xl pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shadow-sm m-0.5 ml-auto" />
          </div>
          <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-amber-400/70 rounded-bl-xl pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shadow-sm m-0.5 mt-auto" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-amber-400/70 rounded-br-xl pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shadow-sm m-0.5 ml-auto mt-auto" />
          </div>
        </div>

        {/* Heavy-Duty Non-Slip Studio Drum Rug (プロ用防音ドラムマットのテクスチャとステッチ織り) */}
        <div
          className="absolute inset-3 rounded-2xl border-2 border-amber-500/30 opacity-40 bg-[radial-gradient(#f59e0b_1.2px,transparent_1.2px),radial-gradient(#94a3b8_1.2px,transparent_1.2px)]"
          style={{
            backgroundSize: '16px 16px, 8px 8px',
            backgroundPosition: '0 0, 4px 4px',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.85)',
          }}
        />

        {/* Outer Stitched Edge Border (ドラムマット外周の刺繍トリムライン) */}
        <div className="absolute inset-5 rounded-xl border border-dashed border-amber-400/25 pointer-events-none" />

        {/* Studio Lighting Overheads (ドラマーを照らす上部スポットライト) */}
        <div className="absolute -top-14 left-1/4 w-52 h-52 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-14 right-1/4 w-52 h-52 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-80 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Bass Drum Front Rubber Anchor Stop Block (バスドラム前滑り防止ストッパーブロック) */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-32 h-3 rounded-md bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-600/80 shadow-lg flex items-center justify-around px-2 pointer-events-none z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />
          <span className="text-[7px] font-mono tracking-widest text-slate-400 font-bold uppercase">DRUM ANCHOR</span>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />
        </div>

        {/* ========================================================================= */}
        {/* CHROME / CUSTOM FINISH HARDWARE STANDS & LEGS ON THE RUG (リアルな足・スタンド) */}
        {/* ========================================================================= */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none -z-5"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: 0.85 }}
        >
          {/* Hi-Hat Stand Legs (Left) */}
          <g>
            {/* Left Tripod Leg with Rubber Foot */}
            <line x1="20%" y1="62%" x2="13%" y2="82%" stroke={currentHw.color} strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="13%" cy="82%" r="4" fill="#0f172a" stroke={currentHw.color} strokeWidth="1.5" />
            {/* Right Tripod Leg with Rubber Foot */}
            <line x1="20%" y1="62%" x2="27%" y2="82%" stroke={currentHw.color} strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="27%" cy="82%" r="4" fill="#0f172a" stroke={currentHw.color} strokeWidth="1.5" />
            {/* Center Pull Rod & Base Casting */}
            <line x1="20%" y1="62%" x2="20%" y2="48%" stroke={currentHw.highlight} strokeWidth="6" strokeLinecap="round" />
            <rect x="18.5%" y="60%" width="3%" height="5%" rx="2" fill="#1e293b" stroke={currentHw.borderColor} strokeWidth="1.5" />
            {/* Hi-Hat Pedal Linkage Frame */}
            <line x1="20%" y1="78%" x2="20%" y2="86%" stroke={currentHw.color} strokeWidth="4" />
          </g>

          {/* Snare Basket Stand Center */}
          <g>
            {/* Left Double-braced Leg */}
            <line x1="50%" y1="65%" x2="41%" y2="85%" stroke={currentHw.color} strokeWidth="5" strokeLinecap="round" />
            <line x1="48%" y1="68%" x2="42%" y2="83%" stroke={currentHw.highlight} strokeWidth="2.5" />
            <circle cx="41%" cy="85%" r="4.5" fill="#0f172a" stroke={currentHw.color} strokeWidth="1.5" />
            {/* Right Double-braced Leg */}
            <line x1="50%" y1="65%" x2="59%" y2="85%" stroke={currentHw.color} strokeWidth="5" strokeLinecap="round" />
            <line x1="52%" y1="68%" x2="58%" y2="83%" stroke={currentHw.highlight} strokeWidth="2.5" />
            <circle cx="59%" cy="85%" r="4.5" fill="#0f172a" stroke={currentHw.color} strokeWidth="1.5" />
            {/* Main Center Heavy Pipe */}
            <line x1="50%" y1="65%" x2="50%" y2="52%" stroke={currentHw.highlight} strokeWidth="7" strokeLinecap="round" />
            <circle cx="50%" cy="63%" r="5" fill="#1e293b" stroke={currentHw.borderColor} strokeWidth="2" />
          </g>

          {/* Crash Cymbal Stand (Far Left Boom Arm) */}
          <g>
            <line x1="16%" y1="42%" x2="16%" y2="28%" stroke={currentHw.color} strokeWidth="5" strokeLinecap="round" />
            <line x1="16%" y1="28%" x2="22%" y2="18%" stroke={currentHw.highlight} strokeWidth="4" strokeLinecap="round" />
            <circle cx="16%" cy="28%" r="4" fill="#334155" stroke={currentHw.color} strokeWidth="1.5" />
          </g>

          {/* Ride Cymbal / Floor Tom Stand (Right) */}
          <g>
            {/* Left Tripod Leg with Rubber Foot */}
            <line x1="80%" y1="62%" x2="73%" y2="82%" stroke={currentHw.color} strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="73%" cy="82%" r="4" fill="#0f172a" stroke={currentHw.color} strokeWidth="1.5" />
            {/* Right Tripod Leg with Rubber Foot */}
            <line x1="80%" y1="62%" x2="87%" y2="82%" stroke={currentHw.color} strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="87%" cy="82%" r="4" fill="#0f172a" stroke={currentHw.color} strokeWidth="1.5" />
            {/* Main Stand Tube & Boom Arm to Ride */}
            <line x1="80%" y1="62%" x2="80%" y2="35%" stroke={currentHw.highlight} strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="80%" cy="35%" r="4.5" fill="#334155" stroke={currentHw.borderColor} strokeWidth="1.5" />
            <line x1="80%" y1="35%" x2="85%" y2="22%" stroke={currentHw.highlight} strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* Bass Drum Heavy-duty Spurs (バスドラムの左右から踏ん張る頑丈なスパー脚＆スパイク) */}
          <g>
            {/* Left Kick Spur Leg */}
            <line x1="43%" y1="60%" x2="35%" y2="76%" stroke={currentHw.highlight} strokeWidth="6" strokeLinecap="round" />
            <polygon points="34%,76% 36%,76% 35%,80%" fill={currentHw.color} stroke="#0f172a" strokeWidth="1" />
            {/* Right Kick Spur Leg */}
            <line x1="57%" y1="60%" x2="65%" y2="76%" stroke={currentHw.highlight} strokeWidth="6" strokeLinecap="round" />
            <polygon points="64%,76% 66%,76% 65%,80%" fill={currentHw.color} stroke="#0f172a" strokeWidth="1" />
          </g>

          {/* Double Tom Holder Post emerging from Kick to High/Low Toms */}
          <g>
            <line x1="50%" y1="42%" x2="50%" y2="24%" stroke={currentHw.highlight} strokeWidth="8" strokeLinecap="round" />
            {/* Omni-ball Joint Clamps */}
            <circle cx="47%" cy="24%" r="4.5" fill={currentHw.color} stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="53%" cy="24%" r="4.5" fill={currentHw.color} stroke="#0f172a" strokeWidth="1.5" />
            <line x1="47%" y1="24%" x2="42%" y2="28%" stroke={currentHw.highlight} strokeWidth="4.5" strokeLinecap="round" />
            <line x1="53%" y1="24%" x2="58%" y2="28%" stroke={currentHw.highlight} strokeWidth="4.5" strokeLinecap="round" />
          </g>
        </svg>

        {/* Stage Perspective Depth Glow Line */}
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
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

      {/* PRO ACOUSTIC CONTROLS & TECHNIQUE HUD (Top-Left) */}
      <div className="absolute top-2 left-2 z-40 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-sm px-2 py-1 rounded-xl border border-slate-700/80 shadow-md">
        {/* Moongel Damper Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMoongel();
          }}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-all ${
            moongelEnabled
              ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_8px_rgba(34,211,238,0.7)]'
              : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800 border border-slate-700/60'
          }`}
          title="Moongel ミュートダンパー着脱 (倍音をタイトに引き締め)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm" />
          <span>GEL {moongelEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* Sympathetic Snare Wire Buzz Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSympatheticBuzz();
          }}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-all ${
            sympatheticBuzzEnabled
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
          title="スネアスナッピー共鳴 (キック・タム打撃時のスナッピー共振音)"
        >
          <span>⚡</span>
          <span className="hidden sm:inline">BUZZ</span>
        </button>

        {/* Pro Tech Details Modal Trigger */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setProTuningOpen((prev) => !prev);
          }}
          className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-amber-300 hover:bg-slate-800 flex items-center gap-0.5"
          title="プロ奏法ショートカットとアコースティック設定"
        >
          <Sliders className="w-3 h-3 text-amber-400" />
          <span className="hidden sm:inline font-mono">PRO TECH</span>
        </button>
      </div>

      {/* PRO TECHNIQUES & ACOUSTIC SOUND DETAILS MODAL */}
      {proTuningOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-2 sm:inset-x-8 top-12 max-h-[85%] overflow-y-auto z-50 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-amber-500/40 p-4 shadow-2xl text-slate-200 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  本格アコースティックドラム奏法 & 物理音響
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  Real Drummer Physics Engine & Key Shortcuts
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setProTuningOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] mb-3">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <span>💥</span> オープン・リムショット
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-200 font-mono text-[9px] border border-amber-500/30">
                  D / R
                </kbd>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                スネアのヘッドとフープ（枠）を同時に強打する鋭いアタック音。スネアの上部リムをクリックしても発音できます。
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <span>🪵</span> クローズド・リムショット / クロススティック
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-200 font-mono text-[9px] border border-amber-500/30">
                  X
                </kbd>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                ボサノバやバラードで多用される、スティックをヘッドに乗せてリムをカツカツ叩く木質アコースティック打音。スネア左下の [STICK] エリアでも操作可能。
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <span>🟡</span> ライドシンバル (Ride Cymbal)
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-200 font-mono text-[9px] border border-amber-500/30">
                  V / U
                </kbd>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                8パッド配置の右手側王道シンバル。広がりある豊かなサステインと澄んだ美しい響きを奏でます。
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <span>✋</span> クラッシュシンバル・ハンドチョーク
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-200 font-mono text-[9px] border border-amber-500/30">
                  Z
                </kbd>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                シンバルの縁を手でギュッと掴んで余韻を一瞬で断ち切るキメ技（ミュート奏法）。クラッシュ右上の [CHOKE] ボタンでも即時発動。
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <span>🦶</span> ハイハット・ペダルチョーク
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-200 font-mono text-[9px] border border-amber-500/30">
                  P
                </kbd>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                オープンハイハットの余韻をフットペダルを踏み込んで「チッ」と瞬時にミュートする実機ペダル動作。
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 flex items-center gap-1">
                  <span>🟦</span> Moongel ダンパー (ジェルミュート)
                </span>
                <button
                  type="button"
                  onClick={toggleMoongel}
                  className="px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-200 text-[9px] font-bold border border-cyan-400/50"
                >
                  {moongelEnabled ? '装着中 (ON)' : '取り外す (OFF)'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                ドラマー必須のブルーのシリコン粘着ジェルパッド。打面の不要な倍音とリング音を吸収し、レコーディングスタジオのように引き締まったタイトサウンドにします。
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-950/30 to-slate-950/80 border border-amber-500/20 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">⚡</span>
              <span className="text-slate-300">
                <strong className="text-amber-300">スネア共鳴（シンパセティック・バズ）:</strong> バスドラムやタムを叩いた空気振動で、スネア裏のスナッピー線が微小にジジッと震えるアコースティック現象を忠実にシミュレート。
              </span>
            </div>
            <button
              type="button"
              onClick={toggleSympatheticBuzz}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${
                sympatheticBuzzEnabled
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {sympatheticBuzzEnabled ? '有効 (ON)' : '無効 (OFF)'}
            </button>
          </div>
        </div>
      )}

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
