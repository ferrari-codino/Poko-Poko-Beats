import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SongData, Difficulty, DrumPartId, RhythmNote, JudgmentType, ScoreState, JudgmentFeedback, PlayerSettings, RPGCoach } from '../types';
import { DrumSet } from './DrumSet';
import { MascotCharacter } from './MascotCharacter';
import { HitBurstEffect } from './HitBurstEffect';
import { DrumScoreLane } from './DrumScoreLane';
import { CoachInGameCheer } from './CoachInGameCheer';
import { RPG_COACHES } from '../data/rpgCoaches';
import { getTierForLevel, getUnlockedPartsForLevel, getRPGLevelConfig, generateRPGLevelNotes } from '../data/rpgCurriculum';
import { musicEngine } from '../audio/musicEngine';
import { drumSynth } from '../audio/drumSynth';
import { Pause, Play, RotateCcw, Volume2, Flame, Award, Music, Activity } from 'lucide-react';

interface GameScreenProps {
  song: SongData;
  difficulty: Difficulty;
  settings: PlayerSettings;
  rpgLevel?: number | null;
  userLevel?: number;
  onFinishGame: (finalScore: ScoreState, notes: RhythmNote[]) => void;
  onExit: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  song,
  difficulty,
  settings,
  rpgLevel,
  userLevel,
  onFinishGame,
  onExit,
}) => {
  const [notes, setNotes] = useState<RhythmNote[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [songProgress, setSongProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [feedbacks, setFeedbacks] = useState<JudgmentFeedback[]>([]);
  const [lastJudgment, setLastJudgment] = useState<JudgmentType | null>(null);

  // RPG Progression & Dedicated Coach
  const rpgConfig = rpgLevel ? getRPGLevelConfig(rpgLevel) : null;
  const tier = rpgLevel ? getTierForLevel(rpgLevel) : 'beginner';
  const coach: RPGCoach = RPG_COACHES[tier];
  const unlockedParts = rpgLevel ? getUnlockedPartsForLevel(rpgLevel) : undefined;

  // Active BPM and Preview approach window
  // Level 1: BPM 60, previewSeconds 1.50s (超親切設計)
  const activeBpm = rpgConfig ? rpgConfig.bpm : song.bpm;
  const approachWindow = rpgConfig ? rpgConfig.previewSeconds : (settings.approachSpeed || 0.45);

  const [activeGlows, setActiveGlows] = useState<Record<DrumPartId, { glowIntensity: number; approachProgress: number; noteId?: string }>>({
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

  const [scoreState, setScoreState] = useState<ScoreState>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
    totalNotes: song.difficulties[difficulty].notes.length,
    accuracy: 100,
    grooveGauge: 0,
    isFever: false,
  });

  // Reference to current active notes for the game loop
  const notesRef = useRef<RhythmNote[]>([]);
  const scoreStateRef = useRef<ScoreState>(scoreState);
  scoreStateRef.current = scoreState;

  // Initialize and start song
  useEffect(() => {
    let rawNotes: RhythmNote[] = [];
    if (rpgLevel && rpgConfig) {
      rawNotes = generateRPGLevelNotes(rpgLevel, rpgConfig, song).map((n) => ({
        ...n,
        hit: false,
        missed: false,
      }));
    } else {
      rawNotes = song.difficulties[difficulty].notes.map((n, idx) => ({
        ...n,
        id: `note-${idx}-${n.part}-${n.time.toFixed(3)}`,
        hit: false,
        missed: false,
      }));
    }

    notesRef.current = rawNotes;
    setNotes(rawNotes);
    setScoreState((prev) => ({
      ...prev,
      totalNotes: rawNotes.length,
    }));

    // Apply audio settings
    drumSynth.setVolumes(settings.masterVolume, settings.drumVolume);
    musicEngine.setBgmVolume(settings.musicVolume);

    // Prepare effective song with custom BPM and duration for RPG curriculum
    const effectiveSong: SongData = {
      ...song,
      bpm: activeBpm,
      duration: rpgLevel === 1 ? 26 : song.duration,
    };

    // Start playback
    musicEngine.startSong(
      effectiveSong,
      difficulty,
      (time, progress) => {
        setCurrentTime(time);
        setSongProgress(progress);
        updateNotesAndGlows(time);
      },
      () => {
        // Song completed
        handleSongComplete();
      },
      settings.audioOffsetMs / 1000
    );

    return () => {
      musicEngine.stop();
    };
  }, [song, difficulty, rpgLevel, activeBpm]);

  // Check for missed notes and update visual approach glow
  const updateNotesAndGlows = useCallback(
    (time: number) => {
      // Level 1 provides a very forgiving missThreshold so anyone clears on first try
      const missThreshold = rpgLevel === 1 ? 0.35 : (rpgLevel && rpgLevel <= 5 ? 0.25 : 0.14);
      const effectiveTime = time + settings.audioOffsetMs / 1000;

      const updatedGlows: Record<DrumPartId, { glowIntensity: number; approachProgress: number; noteId?: string }> = {
        kick: { glowIntensity: 0, approachProgress: 0 },
        snare: { glowIntensity: 0, approachProgress: 0 },
        hihatClosed: { glowIntensity: 0, approachProgress: 0 },
        hihatOpen: { glowIntensity: 0, approachProgress: 0 },
        tomHigh: { glowIntensity: 0, approachProgress: 0 },
        tomLow: { glowIntensity: 0, approachProgress: 0 },
        tomFloor: { glowIntensity: 0, approachProgress: 0 },
        crash: { glowIntensity: 0, approachProgress: 0 },
        ride: { glowIntensity: 0, approachProgress: 0 },
      };

      let hasMissed = false;
      const isCompact = settings.drumLayout === 'compact';
      const mapToCompact = (p: DrumPartId): DrumPartId => {
        if (isCompact) {
          if (p === 'tomHigh' || p === 'tomLow' || p === 'tomFloor') return 'snare';
          if (p === 'hihatOpen') return 'hihatClosed';
          if (p === 'ride') return 'crash';
        }
        return p;
      };

      notesRef.current.forEach((n) => {
        if (n.hit || n.missed) return;

        const effectivePart = mapToCompact(n.part);
        const timeDiff = n.time - effectiveTime;

        // Approaching note: show contracting ring according to approachWindow (e.g. 1.5s for Lv.1)
        if (timeDiff > 0 && timeDiff <= approachWindow) {
          const approach = 1 - timeDiff / approachWindow;
          if (approach > (updatedGlows[effectivePart]?.approachProgress || 0)) {
            updatedGlows[effectivePart] = {
              glowIntensity: approach * 0.4,
              approachProgress: approach,
              noteId: n.id,
            };
          }
        }

        // Active hit window (at beat): intense glowing light
        if (Math.abs(timeDiff) <= 0.09) {
          const intensity = 1 - Math.abs(timeDiff) / 0.09;
          updatedGlows[effectivePart] = {
            glowIntensity: Math.max(updatedGlows[effectivePart].glowIntensity, intensity),
            approachProgress: 1,
            noteId: n.id,
          };
        }

        // Note passed without being tapped: MISS
        if (timeDiff < -missThreshold) {
          n.missed = true;
          n.judgment = 'MISS';
          hasMissed = true;
          triggerFeedback('MISS', effectivePart, undefined);
        }
      });

      setActiveGlows(updatedGlows);

      if (hasMissed) {
        handleScoreUpdate('MISS', 0);
      }
    },
    [approachWindow, settings.audioOffsetMs, rpgLevel]
  );

  const triggerFeedback = (type: JudgmentType, part: DrumPartId, offsetMs?: number) => {
    let exclamation: string | undefined = undefined;
    const currentCombo = scoreStateRef.current.combo;
    const isFever = scoreStateRef.current.isFever;

    if (type === 'PERFECT') {
      if (isFever) {
        const feverPraise = ['FEVER RUSH! 🔥', 'ULTRA COOL! ⚡', 'RAINBOW BEAT! 🌈', 'MAX GROOVE! 👑'];
        exclamation = feverPraise[Math.floor(Math.random() * feverPraise.length)];
      } else if (currentCombo >= 25) {
        const godPraise = ['UNBELIEVABLE! 👑', 'PERFECT BEAT! 🌟', 'GODLIKE! 🔥', 'LEGENDARY! ✨'];
        exclamation = godPraise[Math.floor(Math.random() * godPraise.length)];
      } else if (currentCombo >= 10) {
        const highPraise = ['FANTASTIC! 💫', 'SUPERB! 🌟', 'AWESOME! 🔥', 'AMAZING! 💥'];
        exclamation = highPraise[Math.floor(Math.random() * highPraise.length)];
      } else {
        const normPraise = ['COOL! ✨', 'PERFECT! 🌟', 'NICE GROOVE! 🎵', 'GREAT BEAT! 🥁'];
        exclamation = normPraise[Math.floor(Math.random() * normPraise.length)];
      }
      drumSynth.playSparkleChime();
    } else if (type === 'GREAT') {
      const greatPraise = ['COOL! ✨', 'AWESOME! 🔥', 'GROOVY! 🎷', 'NICE HIT! 💥'];
      exclamation = greatPraise[Math.floor(Math.random() * greatPraise.length)];
    } else if (type === 'GOOD') {
      if (Math.random() > 0.5) {
        exclamation = 'GOOD! 🎶';
      }
    }

    setLastJudgment(type);

    const newFeedback: JudgmentFeedback = {
      id: `fb-${Date.now()}-${Math.random()}`,
      type,
      offsetMs,
      part,
      combo: scoreStateRef.current.combo,
      exclamation,
      isFever,
    };

    setFeedbacks((prev) => [...prev.slice(-3), newFeedback]);

    setTimeout(() => {
      setFeedbacks((prev) => prev.filter((f) => f.id !== newFeedback.id));
    }, 850);
  };

  const handleScoreUpdate = (judgment: JudgmentType, offsetMs: number) => {
    setScoreState((prev) => {
      const isMiss = judgment === 'MISS';
      const newCombo = isMiss ? 0 : prev.combo + 1;
      const newMaxCombo = Math.max(prev.maxCombo, newCombo);

      // Multipliers based on combo and fever
      const comboMultiplier = 1 + Math.min(2, Math.floor(newCombo / 15) * 0.25);
      const feverMultiplier = prev.isFever ? 1.5 : 1.0;

      // Base scores scaled to 1/10 (PERFECT: 100, GREAT: 70, GOOD: 40)
      let pts = 0;
      if (judgment === 'PERFECT') pts = 100 * comboMultiplier * feverMultiplier;
      else if (judgment === 'GREAT') pts = 70 * comboMultiplier * feverMultiplier;
      else if (judgment === 'GOOD') pts = 40 * feverMultiplier;

      const newPerfect = prev.perfect + (judgment === 'PERFECT' ? 1 : 0);
      const newGreat = prev.great + (judgment === 'GREAT' ? 1 : 0);
      const newGood = prev.good + (judgment === 'GOOD' ? 1 : 0);
      const newMiss = prev.miss + (judgment === 'MISS' ? 1 : 0);
      const processedNotes = newPerfect + newGreat + newGood + newMiss;

      // Accuracy calculation
      const accScore = (newPerfect * 100 + newGreat * 70 + newGood * 40) / Math.max(1, processedNotes);
      const accuracy = Math.min(100, Math.max(0, accScore));

      // Groove Gauge calculation
      const gaugeGain = isMiss ? -15 : judgment === 'PERFECT' ? 8 : 4;
      const newGauge = Math.max(0, Math.min(100, prev.grooveGauge + gaugeGain));
      const isFever = newGauge >= 100 || (prev.isFever && newGauge > 25);

      return {
        score: prev.score + Math.round(pts),
        combo: newCombo,
        maxCombo: newMaxCombo,
        perfect: newPerfect,
        great: newGreat,
        good: newGood,
        miss: newMiss,
        totalNotes: prev.totalNotes,
        accuracy: Number(accuracy.toFixed(1)),
        grooveGauge: newGauge,
        isFever,
      };
    });
  };

  // User drum hit event handler
  const handleDrumHit = useCallback(
    (part: DrumPartId, hitTime: number) => {
      const currentAudioTime = musicEngine.getCurrentTime() + settings.audioOffsetMs / 1000;

      // Generous hit detection window for beginners (Level 1: 0.35s)
      const hitTolerance = rpgLevel === 1 ? 0.35 : (rpgLevel && rpgLevel <= 5 ? 0.24 : 0.15);
      const isCompact = settings.drumLayout === 'compact';
      const isPartMatch = (notePart: DrumPartId, hitPart: DrumPartId) => {
        if (notePart === hitPart) return true;
        if (isCompact) {
          if (hitPart === 'snare' && (notePart === 'tomHigh' || notePart === 'tomLow' || notePart === 'tomFloor')) return true;
          if (hitPart === 'hihatClosed' && notePart === 'hihatOpen') return true;
          if (hitPart === 'crash' && notePart === 'ride') return true;
        }
        return false;
      };

      const candidateNotes = notesRef.current.filter(
        (n) => isPartMatch(n.part, part) && !n.hit && !n.missed && Math.abs(n.time - currentAudioTime) <= hitTolerance
      );

      if (candidateNotes.length > 0) {
        // Sort by closest time
        candidateNotes.sort((a, b) => Math.abs(a.time - currentAudioTime) - Math.abs(b.time - currentAudioTime));
        const targetNote = candidateNotes[0];

        const diffSec = currentAudioTime - targetNote.time;
        const diffMs = Math.round(diffSec * 1000);
        const absDiff = Math.abs(diffSec);

        let judgment: JudgmentType = 'MISS';
        if (rpgLevel === 1) {
          // Level 1: super friendly tolerance so first-time players always succeed!
          if (absDiff <= 0.18) {
            judgment = 'PERFECT';
          } else if (absDiff <= 0.28) {
            judgment = 'GREAT';
          } else {
            judgment = 'GOOD';
          }
        } else if (rpgLevel && rpgLevel <= 5) {
          if (absDiff <= 0.08) {
            judgment = 'PERFECT';
          } else if (absDiff <= 0.15) {
            judgment = 'GREAT';
          } else {
            judgment = 'GOOD';
          }
        } else {
          if (absDiff <= 0.045) {
            judgment = 'PERFECT';
          } else if (absDiff <= 0.09) {
            judgment = 'GREAT';
          } else if (absDiff <= 0.14) {
            judgment = 'GOOD';
          }
        }

        targetNote.hit = true;
        targetNote.judgment = judgment;
        targetNote.hitTimeDiff = diffMs;

        triggerFeedback(judgment, part, diffMs);
        handleScoreUpdate(judgment, diffMs);
      }
    },
    [settings.audioOffsetMs, rpgLevel]
  );

  const handleSongComplete = () => {
    musicEngine.stop();
    onFinishGame(scoreStateRef.current, notesRef.current);
  };

  const togglePause = () => {
    if (isPaused) {
      musicEngine.resume();
      setIsPaused(false);
    } else {
      musicEngine.pause();
      setIsPaused(true);
    }
  };

  const handleRestart = () => {
    musicEngine.stop();
    setIsPaused(false);
    setScoreState({
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfect: 0,
      great: 0,
      good: 0,
      miss: 0,
      totalNotes: song.difficulties[difficulty].notes.length,
      accuracy: 100,
      grooveGauge: 0,
      isFever: false,
    });
    const rawNotes = song.difficulties[difficulty].notes.map((n, idx) => ({
      ...n,
      id: `note-${idx}-${n.part}-${n.time.toFixed(3)}`,
      hit: false,
      missed: false,
    }));
    notesRef.current = rawNotes;
    setNotes(rawNotes);
    musicEngine.startSong(
      song,
      difficulty,
      (time, progress) => {
        setCurrentTime(time);
        setSongProgress(progress);
        updateNotesAndGlows(time);
      },
      handleSongComplete,
      settings.audioOffsetMs / 1000
    );
  };

  const getDifficultyBadgeColor = (diff: Difficulty) => {
    switch (diff) {
      case 'easy':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'normal':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'hard':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'master':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] flex flex-col justify-between p-2 sm:p-4 bg-slate-950 select-none">
      {/* TOP HUD BAR */}
      <div className="w-full max-w-lg mx-auto flex flex-col gap-1.5 z-20">
        {/* LEVEL STATUS ROW: USER LEVEL (ALWAYS DISPLAYED) & ACTIVE GAME LEVEL (DURING PLAY) */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-md">
          {/* USER LEVEL (常時表示) */}
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-400/60 text-xs font-black tracking-tight shadow-sm">
              <span className="text-sm">👑</span>
              <span>USER Lv.{userLevel ?? 1}</span>
            </span>
          </div>

          {/* GAME LEVEL (プレイ中表示) */}
          <div className="flex items-center gap-2">
            {rpgLevel ? (
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-pink-200 border border-pink-400/60 text-xs font-black tracking-tight shadow-sm animate-pulse">
                  <span className="text-xs">🎯</span>
                  <span>GAME Lv.{rpgLevel}</span>
                </span>
                <span className="hidden sm:inline text-[10px] text-slate-300 font-bold max-w-[130px] truncate">
                  {rpgConfig?.title.replace(/Lv\.\d+\s*/, '')}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black font-mono shadow">
                  光の予告: {approachWindow.toFixed(1)}秒前
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-black">
                  🎮 FREE PLAY
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                  光の予告: {approachWindow.toFixed(1)}秒前
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-800 shadow-xl">
          {/* Song Info & Tempo / Time Signature Badge */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base text-slate-100 truncate max-w-[140px] sm:max-w-[180px]">
                {song.title}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getDifficultyBadgeColor(
                  difficulty
                )}`}
              >
                {difficulty}
              </span>
            </div>
            {/* Required BPM & Time Signature Display */}
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-mono text-amber-400 font-bold">
                <Activity className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                {activeBpm} BPM
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
                拍子: {song.timeSignature}
              </span>
            </div>
          </div>

          {/* Score & Combo */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-medium text-slate-400">SCORE</div>
              <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-amber-400 leading-none">
                {scoreState.score.toLocaleString()}
              </div>
            </div>

            {/* Pause button */}
            <button
              id="pause-game-btn"
              onClick={togglePause}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 border border-slate-700 transition"
              aria-label="Pause Game"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SONG PROGRESS & GROOVE GAUGE */}
        <div className="grid grid-cols-2 gap-2">
          {/* Song Progress */}
          <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800/80 flex flex-col justify-center">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
              <span>TIME</span>
              <span>
                {Math.floor(currentTime)}s / {rpgLevel === 1 ? 26 : song.duration}s
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-100"
                style={{ width: `${songProgress * 100}%` }}
              />
            </div>
          </div>

          {/* Groove Gauge / Fever Meter */}
          <div
            className={`px-2.5 py-1.5 rounded-xl border flex flex-col justify-center transition-all ${
              scoreState.isFever
                ? 'bg-amber-950/60 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
                : 'bg-slate-900/80 border-slate-800/80'
            }`}
          >
            <div className="flex justify-between items-center text-[10px] font-bold mb-1">
              <span className={`flex items-center gap-1 ${scoreState.isFever ? 'text-amber-300' : 'text-slate-400'}`}>
                {scoreState.isFever && <Flame className="w-3 h-3 text-amber-400 animate-bounce" />}
                {scoreState.isFever ? 'FEVER x1.5!' : 'GROOVE GAUGE'}
              </span>
              <span className="font-mono text-slate-300">{scoreState.accuracy}% ACC</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  scoreState.isFever
                    ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-amber-300'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                }`}
                style={{ width: `${scoreState.grooveGauge}%` }}
              />
            </div>
          </div>
        </div>

        {/* AUTHENTIC SCROLLING DRUM SCORE LANE (五線譜ドラムレーン) */}
        <DrumScoreLane
          notes={notes}
          currentTime={currentTime}
          bpm={activeBpm}
          timeSignature={song.timeSignature}
          speedMultiplier={settings.scrollSpeed || 1.0}
          upcomingNotePart={
            notes.find((n) => !n.hit && !n.missed && n.time >= currentTime && n.time <= currentTime + approachWindow)?.part || null
          }
        />
      </div>

      {/* DEDICATED COACH ENCOURAGEMENT (画面右上でプレイヤーをやさしく励ます) */}
      <div className="absolute top-16 sm:top-20 right-2 sm:right-4 z-30">
        <CoachInGameCheer
          coach={coach}
          combo={scoreState.combo}
          isFever={scoreState.isFever}
          lastJudgmentType={lastJudgment}
          rpgLevel={rpgLevel ?? undefined}
        />
      </div>

      {/* CENTER STAGE: 3D-ANGLED DRUM SET & JUDGMENT DISPLAY */}
      <div className="relative flex-1 flex flex-col items-center justify-center my-1">
        {/* Flashy Judgment, Combo & English Exclamations Feedback */}
        <HitBurstEffect
          feedbacks={feedbacks}
          combo={scoreState.combo}
          isFever={scoreState.isFever}
        />

        {/* 3D Angled Real Drum Set */}
        <DrumSet
          onDrumHit={handleDrumHit}
          activeGlowingParts={activeGlows}
          showKeyHints={settings.showKeyHints}
          hapticsEnabled={settings.hapticsEnabled}
          drumLayout={settings.drumLayout || 'standard'}
          padScale={settings.padScale || 'normal'}
          unlockedParts={unlockedParts}
          prepareTargetPart={
            (() => {
              const nextNote = notes.find((n) => !n.hit && !n.missed && n.time >= currentTime && n.time <= currentTime + approachWindow);
              if (!nextNote) return null;
              if (settings.drumLayout === 'compact') {
                if (nextNote.part === 'tomHigh' || nextNote.part === 'tomLow' || nextNote.part === 'tomFloor') return 'snare';
                if (nextNote.part === 'hihatOpen') return 'hihatClosed';
                if (nextNote.part === 'ride') return 'crash';
              }
              return nextNote.part;
            })()
          }
        />
      </div>

      {/* BOTTOM FOOTER INFO */}
      <div className="w-full max-w-lg mx-auto flex items-center justify-between text-xs text-slate-500 px-2 py-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>光ったタイミングでタップ！</span>
        </div>
        <div className="font-mono text-slate-400">
          MAX COMBO: <span className="text-amber-400 font-bold">{scoreState.maxCombo}</span>
        </div>
      </div>

      {/* PAUSE MODAL OVERLAY */}
      {isPaused && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl">
            <h2 className="text-2xl font-black text-slate-100 mb-1">一時停止中</h2>
            <p className="text-xs text-slate-400 mb-6">{song.title} ({song.bpm} BPM / {song.timeSignature})</p>

            <div className="flex flex-col gap-3 w-full">
              <button
                id="resume-game-btn"
                onClick={togglePause}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-slate-950 font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 text-base transition"
              >
                <Play className="w-5 h-5 fill-current" />
                ゲームを再開
              </button>

              <button
                id="restart-game-btn"
                onClick={handleRestart}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-bold rounded-2xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition"
              >
                <RotateCcw className="w-4 h-4" />
                最初からやり直す
              </button>

              <button
                id="quit-game-btn"
                onClick={() => {
                  musicEngine.stop();
                  onExit();
                }}
                className="w-full py-2.5 px-4 text-slate-400 hover:text-rose-400 text-sm font-medium transition"
              >
                選曲メニューに戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
