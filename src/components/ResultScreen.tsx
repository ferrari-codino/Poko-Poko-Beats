import React, { useState, useEffect } from 'react';
import { SongData, Difficulty, ScoreState, RhythmNote, PlayerSettings, MascotId, UserProfile, CourseState, RPGCoach } from '../types';
import { MascotCharacter } from './MascotCharacter';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ListOrdered, Sparkles, User, ArrowLeft, FastForward, CheckCircle2, Flame, Award, Lightbulb, ChevronRight, Home } from 'lucide-react';
import { saveLocalScore, saveLocalUser } from '../utils/storageFallback';
import { getRPGLevelConfig, recordLevelClear, getUnlockedPartsForLevel, getTierForLevel } from '../data/rpgCurriculum';
import { RPG_COACHES } from '../data/rpgCoaches';
import { DRUM_PARTS } from '../data/drumConfig';

interface ResultScreenProps {
  song: SongData;
  difficulty: Difficulty;
  scoreState: ScoreState;
  notes: RhythmNote[];
  settings: PlayerSettings;
  currentUser?: UserProfile | null;
  courseState?: CourseState | null;
  rpgLevel?: number | null;
  userLevel?: number;
  onUpdateUserBests?: (user: UserProfile) => void;
  onPlayAgain: () => void;
  onSelectSong: () => void;
  onViewLeaderboard: () => void;
  onOpenMyPage: () => void;
  onNextCourseSong?: () => void;
  onExitCourse?: () => void;
  onNextRPGLevel?: (nextLvl: number) => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  song,
  difficulty,
  scoreState,
  notes,
  settings,
  currentUser,
  courseState,
  rpgLevel,
  userLevel,
  onUpdateUserBests,
  onPlayAgain,
  onSelectSong,
  onViewLeaderboard,
  onOpenMyPage,
  onNextCourseSong,
  onExitCourse,
  onNextRPGLevel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<{ rankPosition?: number; isTop30?: boolean; isNewBest?: boolean } | null>(null);

  // RPG Level configuration & clearance evaluation
  const rpgConfig = rpgLevel ? getRPGLevelConfig(rpgLevel) : null;
  const currentTier = rpgLevel ? getTierForLevel(rpgLevel) : 'beginner';
  const coach: RPGCoach = RPG_COACHES[currentTier];
  const isRPGCleared = rpgConfig ? scoreState.score >= rpgConfig.clearMinScore || scoreState.accuracy >= 65 : false;

  useEffect(() => {
    if (rpgLevel && isRPGCleared) {
      recordLevelClear(rpgLevel, scoreState.score, rankInfo.rank, scoreState.accuracy);
    }
  }, [rpgLevel, isRPGCleared]);

  // Auto-advance countdown for course mode
  const [courseCountdown, setCourseCountdown] = useState<number>(4);
  const isCourseMode = Boolean(courseState && courseState.isActive);
  const isCourseFinished = isCourseMode && courseState ? courseState.currentIndex >= courseState.totalSongs : false;

  useEffect(() => {
    if (!isCourseMode || isCourseFinished || !onNextCourseSong) return;

    setCourseCountdown(4);
    const interval = setInterval(() => {
      setCourseCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onNextCourseSong();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCourseMode, isCourseFinished, onNextCourseSong, courseState?.currentIndex]);

  // Determine Rank based on score & accuracy
  const calculateRank = (): { rank: string; color: string; bg: string } => {
    const acc = scoreState.accuracy;
    if (acc >= 98 && scoreState.miss === 0) {
      return { rank: 'S+', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/50' };
    }
    if (acc >= 94) {
      return { rank: 'S', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/40' };
    }
    if (acc >= 85) {
      return { rank: 'A', color: 'text-cyan-300', bg: 'bg-cyan-500/20 border-cyan-500/40' };
    }
    if (acc >= 70) {
      return { rank: 'B', color: 'text-emerald-300', bg: 'bg-emerald-500/20 border-emerald-500/40' };
    }
    return { rank: 'C', color: 'text-slate-400', bg: 'bg-slate-800/40 border-slate-700' };
  };

  const rankInfo = calculateRank();

  // Fire confetti on high scores
  useEffect(() => {
    if (scoreState.accuracy >= 75) {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#f59e0b', '#ec4899', '#06b6d4', '#10b981', '#a855f7'],
      });
    }
  }, [scoreState.accuracy]);

  // Auto-submit score to server and sync user personal bests
  useEffect(() => {
    let isCancelled = false;

    const autoSave = async () => {
      setIsSubmitting(true);
      try {
        let isSavedOnServer = false;
        let rankPos = 1;
        let isTop30 = true;

        // 1. Submit to Leaderboard (Server or local fallback)
        try {
          const res = await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser?.id,
              playerName: currentUser?.nickname || settings.playerName || '名無しドラマー',
              avatarId: currentUser?.avatarId || settings.avatarId || 'pokota',
              songId: song.id,
              songTitle: song.title,
              difficulty,
              score: scoreState.score,
              maxCombo: scoreState.maxCombo,
              accuracy: scoreState.accuracy,
              perfectCount: scoreState.perfect,
              greatCount: scoreState.great,
              goodCount: scoreState.good,
              missCount: scoreState.miss,
              rank: rankInfo.rank,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              isSavedOnServer = true;
              rankPos = data.rankPosition;
              isTop30 = data.isTop30;
            }
          }
        } catch {
          // ignore network error
        }

        if (!isSavedOnServer) {
          const localRes = saveLocalScore({
            userId: currentUser?.id,
            playerName: currentUser?.nickname || settings.playerName || '名無しドラマー',
            avatarId: currentUser?.avatarId || settings.avatarId || 'pokota',
            songId: song.id,
            songTitle: song.title,
            difficulty,
            score: scoreState.score,
            maxCombo: scoreState.maxCombo,
            accuracy: scoreState.accuracy,
            perfectCount: scoreState.perfect,
            greatCount: scoreState.great,
            goodCount: scoreState.good,
            missCount: scoreState.miss,
            rank: rankInfo.rank,
          });
          rankPos = localRes.rankPosition;
          isTop30 = localRes.isTop30;
        }

        // 2. Update User Personal Best if logged in
        let isNewBest = false;
        if (currentUser?.id) {
          let updatedUser: UserProfile | null = null;
          try {
            const userRes = await fetch(`/api/user/${currentUser.id}/bests`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                songId: song.id,
                difficulty,
                score: scoreState.score,
                rank: rankInfo.rank,
                maxCombo: scoreState.maxCombo,
                accuracy: scoreState.accuracy,
                earnedStars: rankInfo.rank === 'S+' ? 3 : rankInfo.rank === 'S' ? 2 : 1,
              }),
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              updatedUser = userData.user;
              isNewBest = userData.isNewBest;
            }
          } catch {
            // ignore network error
          }

          if (!updatedUser) {
            // Local personal best calculation
            const prevPb = currentUser.personalBests?.[song.id]?.[difficulty];
            if (!prevPb || scoreState.score > prevPb.score) {
              isNewBest = true;
              const newPb = {
                score: scoreState.score,
                rank: rankInfo.rank,
                maxCombo: scoreState.maxCombo,
                accuracy: scoreState.accuracy,
                timestamp: Date.now(),
              };
              updatedUser = {
                ...currentUser,
                totalPlays: (currentUser.totalPlays || 0) + 1,
                totalScore: (currentUser.totalScore || 0) + scoreState.score,
                starsCount: (currentUser.starsCount || 0) + (rankInfo.rank === 'S+' ? 3 : rankInfo.rank === 'S' ? 2 : 1),
                personalBests: {
                  ...currentUser.personalBests,
                  [song.id]: {
                    ...(currentUser.personalBests?.[song.id] || {}),
                    [difficulty]: newPb,
                  },
                },
              };
              saveLocalUser(updatedUser);
            }
          }

          if (updatedUser && onUpdateUserBests) {
            onUpdateUserBests(updatedUser);
          }
        }

        if (!isCancelled) {
          setSubmitResult({
            rankPosition: rankPos,
            isTop30,
            isNewBest,
          });
        }
      } catch (err) {
        console.error('Failed to submit score:', err);
      } finally {
        if (!isCancelled) setIsSubmitting(false);
      }
    };

    autoSave();

    return () => {
      isCancelled = true;
    };
  }, [song.id, difficulty]);

  return (
    <div className="w-full max-w-lg mx-auto h-full flex flex-col select-none animate-fade-in overflow-hidden relative">
      {/* SCROLLABLE CONTENT BODY */}
      <div
        className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 space-y-3 custom-scrollbar overscroll-contain"
        style={{ touchAction: 'pan-y' }}
      >
        {/* HEADER & MASCOT CHEER */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-xs font-black text-amber-300 shadow-sm">
                <span>👑</span>
                <span>USER Lv.{userLevel ?? (rpgLevel || 1)}</span>
              </span>

              {rpgLevel ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/50 text-xs font-black text-pink-300 shadow-sm">
                  <span>🎯</span>
                  <span>GAME Lv.{rpgLevel}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-xs font-black text-cyan-300">
                  <span>🎮</span>
                  <span>FREE PLAY</span>
                </span>
              )}
            </div>

            {submitResult?.isNewBest && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black animate-bounce shadow">
                ⭐ 自己ベスト更新！
              </div>
            )}
          </div>

          {/* Mascot cheer banner */}
          <div className="my-2 flex justify-center">
            <MascotCharacter
              mascotId={currentUser?.avatarId || settings.avatarId || 'pokota'}
              reaction="clear"
              combo={scoreState.maxCombo}
              showSpeechBubble={true}
            />
          </div>

          <div className="text-center mt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white">{song.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {difficulty.toUpperCase()} • BPM {song.bpm} • {song.timeSignature}拍子
            </p>

            {/* Flashy English Praise Badge */}
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/30 via-pink-500/30 to-cyan-500/30 border border-pink-400/50 shadow-md">
              <span className="text-xs">✨</span>
              <span className="text-xs font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300">
                {rankInfo.rank === 'S+'
                  ? '👑 PERFECT MASTER DRUMMER! 🌟'
                  : rankInfo.rank === 'S'
                  ? '🔥 AWESOME GROOVE & BEATS! ⚡'
                  : rankInfo.rank === 'A'
                  ? '✨ COOL DRUM PERFORMANCE! 💫'
                  : rankInfo.rank === 'B'
                  ? '🎵 NICE BEAT & RHYTHM! 🎈'
                  : '🥁 GOOD TRY! KEEP ROCKING! 🍀'}
              </span>
              <span className="text-xs">🔥</span>
            </div>
          </div>
        </div>

        {/* SCORE & RANK CARD */}
        <div className="bg-slate-900/90 border-2 border-indigo-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md relative overflow-hidden my-1">
          {/* Glow effect */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 tracking-wider">TOTAL SCORE</span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-amber-400 tracking-tight">
                {scoreState.score.toLocaleString()}
              </span>
              <span className="text-[11px] text-pink-300 font-bold mt-0.5">
                プレイヤー: {currentUser?.nickname || settings.playerName || '名無しドラマー'}
              </span>
            </div>

            {/* Rank Badge */}
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex flex-col items-center justify-center shadow-lg ${rankInfo.bg}`}
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase">RANK</span>
              <span className={`text-2xl sm:text-3xl font-black font-mono ${rankInfo.color}`}>
                {rankInfo.rank}
              </span>
            </div>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center">
            <div className="bg-slate-950/60 p-2 rounded-2xl border border-slate-800/50">
              <div className="text-[10px] text-slate-400 font-bold">正確度</div>
              <div className="text-base sm:text-lg font-black font-mono text-cyan-400">
                {scoreState.accuracy}%
              </div>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-2xl border border-slate-800/50">
              <div className="text-[10px] text-slate-400 font-bold">MAX COMBO</div>
              <div className="text-base sm:text-lg font-black font-mono text-amber-400">
                {scoreState.maxCombo}
              </div>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-2xl border border-slate-800/50">
              <div className="text-[10px] text-slate-400 font-bold">順位</div>
              <div className="text-base sm:text-lg font-black font-mono text-pink-400">
                {submitResult?.rankPosition ? `${submitResult.rankPosition}位` : '集計中...'}
              </div>
            </div>
          </div>

          {/* DETAILED HIT BREAKDOWN */}
          <div className="grid grid-cols-4 gap-1.5 mt-2.5 text-center text-xs">
            <div className="bg-slate-950/40 py-1.5 px-1 rounded-xl border border-amber-500/20">
              <div className="text-[9px] text-amber-400 font-bold">PERFECT</div>
              <div className="font-mono font-bold text-white text-sm">{scoreState.perfect}</div>
            </div>
            <div className="bg-slate-950/40 py-1.5 px-1 rounded-xl border border-cyan-500/20">
              <div className="text-[9px] text-cyan-400 font-bold">GREAT</div>
              <div className="font-mono font-bold text-white text-sm">{scoreState.great}</div>
            </div>
            <div className="bg-slate-950/40 py-1.5 px-1 rounded-xl border border-emerald-500/20">
              <div className="text-[9px] text-emerald-400 font-bold">GOOD</div>
              <div className="font-mono font-bold text-white text-sm">{scoreState.good}</div>
            </div>
            <div className="bg-slate-950/40 py-1.5 px-1 rounded-xl border border-rose-500/20">
              <div className="text-[9px] text-rose-400 font-bold">MISS</div>
              <div className="font-mono font-bold text-white text-sm">{scoreState.miss}</div>
            </div>
          </div>

          {/* 2. GROOVE TIMING ANALYZER (プロ・ミュージシャン視点のノリ診断: 前ノリ・ジャスト・後ノリ) */}
          {(() => {
            const hitNotes = notes.filter((n) => n.hit && n.hitTimeDiff !== undefined);
            const totalHits = Math.max(1, hitNotes.length);
            const rush = hitNotes.filter((n) => n.hitTimeDiff! < -14).length;
            const pocket = hitNotes.filter((n) => Math.abs(n.hitTimeDiff!) <= 14).length;
            const layback = hitNotes.filter((n) => n.hitTimeDiff! > 14).length;

            const rushPct = Math.round((rush / totalHits) * 100);
            const pocketPct = Math.round((pocket / totalHits) * 100);
            const laybackPct = Math.round((layback / totalHits) * 100);

            const sumOffset = hitNotes.reduce((acc, n) => acc + n.hitTimeDiff!, 0);
            const avgOffset = hitNotes.length > 0 ? Math.round(sumOffset / hitNotes.length) : 0;

            const dominant =
              pocketPct >= rushPct && pocketPct >= laybackPct
                ? 'pocket'
                : rushPct > laybackPct
                ? 'rush'
                : 'layback';

            return (
              <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-slate-950/80 via-slate-900/90 to-slate-950/80 border border-amber-500/30 shadow-inner space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🎯</span>
                    <span className="text-xs font-black text-amber-300">グルーヴ・アナライザー (Timing Feel)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    平均ズレ: <strong className={avgOffset > 0 ? 'text-cyan-400' : avgOffset < 0 ? 'text-pink-400' : 'text-amber-400'}>
                      {avgOffset > 0 ? `+${avgOffset}` : avgOffset}ms
                    </strong>
                  </span>
                </div>

                {/* Timing Distribution Bar */}
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                  <div
                    style={{ width: `${rushPct}%` }}
                    className="bg-pink-500 hover:opacity-90 transition-all relative group"
                    title={`前ノリ (Rush): ${rushPct}%`}
                  />
                  <div
                    style={{ width: `${pocketPct}%` }}
                    className="bg-amber-400 hover:opacity-90 transition-all relative group"
                    title={`ジャスト (Pocket): ${pocketPct}%`}
                  />
                  <div
                    style={{ width: `${laybackPct}%` }}
                    className="bg-cyan-500 hover:opacity-90 transition-all relative group"
                    title={`後ノリ (Layback): ${laybackPct}%`}
                  />
                </div>

                {/* Legend Badges */}
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono pt-0.5">
                  <span className="flex items-center gap-1 text-pink-400">
                    <span className="w-2 h-2 rounded-full bg-pink-500" />
                    前ノリ(Rush) {rushPct}%
                  </span>
                  <span className="flex items-center gap-1 text-amber-300 font-black">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    ジャスト(Pocket) {pocketPct}%
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    後ノリ(Layback) {laybackPct}%
                  </span>
                </div>

                {/* Musician Diagnostic Evaluation */}
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] leading-relaxed">
                  {dominant === 'pocket' && (
                    <p className="text-amber-200">
                      🎯 <strong>黄金ポケット・マスター！</strong> レコーディングスタジオ級の驚異的な安定感。楽曲の軸を一切揺らさない極上ビートです。
                    </p>
                  )}
                  {dominant === 'rush' && (
                    <p className="text-pink-200">
                      ⏩ <strong>ドライブ感あふれる前ノリ！</strong> ロックやパンクを猛烈に前へと引っ張る、スリリングで疾走感あふれるエネルギッシュなノリです。
                    </p>
                  )}
                  {dominant === 'layback' && (
                    <p className="text-cyan-200">
                      ⏪ <strong>深いタメのレイドバック！</strong> ネオソウルやファンク特有の心地よい後ノリ。楽曲に大人びたスウィング感と重厚さを与えています。
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* DEDICATED COACH LESSON REVIEW CARD (専属動物コーチのレッスン講評＆技術的アドバイス) */}
        {rpgConfig && (
          <div className="bg-slate-900/95 border-2 border-pink-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md relative overflow-hidden my-2">
            {/* Header with Coach info */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${coach.avatarBg} border flex items-center justify-center text-2xl shadow-md flex-shrink-0`}
              >
                {coach.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white" style={{ color: coach.color }}>
                    {coach.name} のレッスン講評
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Lv.{rpgLevel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">課題: {rpgConfig.title}</p>
              </div>
            </div>

            {/* 1. やさしいコメント (Kind praise) */}
            <div className="mt-3 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-2">
              <span className="text-base flex-shrink-0">💬</span>
              <div>
                <div className="text-[10px] font-bold text-pink-300 mb-0.5">やさしい励ましコメント:</div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {rpgConfig.coachAdvice.praise}
                </p>
              </div>
            </div>

            {/* 2. ドラムに関する技術的コメント（ミュージシャン視点） */}
            <div className="mt-2.5 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
              <span className="text-base flex-shrink-0">🎯</span>
              <div>
                <div className="text-[10px] font-bold text-amber-300 mb-0.5">技術的なドラムアドバイス:</div>
                <p className="text-xs text-amber-100/90 leading-relaxed">
                  {rpgConfig.coachAdvice.technicalTip}
                </p>
              </div>
            </div>

            {/* Level Clearance Status & Promotion Fanfare */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
              <div>
                {isRPGCleared ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs sm:text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>レッスン課題クリア！ 昇格達成！</span>
                  </div>
                ) : (
                  <div className="text-xs text-amber-300 font-bold">
                    惜しい！あと少しでクリア！再挑戦してみよう！
                  </div>
                )}
              </div>

              {isRPGCleared && onNextRPGLevel && (
                <button
                  type="button"
                  onClick={() => onNextRPGLevel((rpgLevel || 1) + 1)}
                  className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md hover:opacity-90 active:scale-95 transition"
                >
                  <span>次のLv.{(rpgLevel || 1) + 1}へ！</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* COURSE MODE PROGRESS OR FINISHED BANNER */}
        {isCourseMode && courseState && (
          <div className={`p-3 rounded-2xl border my-2 text-center transition-all ${
            isCourseFinished
              ? 'bg-gradient-to-r from-amber-500/25 via-pink-500/25 to-purple-500/25 border-amber-400 shadow-lg'
              : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400/50 shadow-md'
          }`}>
            {isCourseFinished ? (
              <div>
                <div className="flex items-center justify-center gap-1 text-amber-300 font-black text-sm sm:text-base">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>🏆 {courseState.courseTitle} 完全制覇！</span>
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  全{courseState.totalSongs}曲完奏！ 累積ハイスコア: <strong className="text-amber-400 font-mono text-sm">{courseState.accumulatedScore.toLocaleString()}</strong> 点
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-xs font-black text-white mb-1">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <Flame className="w-4 h-4 text-cyan-400" />
                    {courseState.courseTitle}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200 text-[10px] font-mono">
                    第 {courseState.currentIndex} / {courseState.totalSongs === Infinity ? '∞' : courseState.totalSongs} 曲 クリア！
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-300 bg-slate-950/60 py-1 px-2.5 rounded-xl border border-slate-800">
                  <span className="animate-pulse">⏩</span>
                  <span>{courseCountdown}秒後に自動で次の曲へ進みます...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom spacer for smooth scrolling */}
        <div className="h-2" />
      </div>

      {/* STICKY BOTTOM ACTION BAR (画面下部に常時表示・固定配置され絶対に押せるボトムバー) */}
      <div className="shrink-0 p-3 sm:p-4 bg-slate-950/95 border-t border-slate-800/90 shadow-[0_-8px_25px_rgba(0,0,0,0.6)] backdrop-blur-xl z-20 space-y-2">
        {rpgLevel ? (
          /* レッスンモード専用アクション */
          <div className="space-y-2">
            {isRPGCleared && onNextRPGLevel ? (
              <button
                id="next-rpg-level-btn"
                type="button"
                onClick={() => onNextRPGLevel((rpgLevel || 1) + 1)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-pink-500/25 active:scale-98 transition-all"
              >
                <Sparkles className="w-4 h-4 fill-current text-slate-950" />
                <span>🌟 次のレッスン（Lv.{(rpgLevel || 1) + 1}）へ進む！</span>
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </button>
            ) : (
              <button
                id="retry-rpg-level-btn"
                type="button"
                onClick={onPlayAgain}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-98 transition-all"
              >
                <RotateCcw className="w-4 h-4 stroke-[3]" />
                <span>🔄 もう一度挑戦する！</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              {isRPGCleared && (
                <button
                  type="button"
                  onClick={onPlayAgain}
                  className="py-2.5 px-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>もう一度練習</span>
                </button>
              )}

              <button
                id="result-return-home-btn"
                type="button"
                onClick={onSelectSong}
                className={`py-2.5 px-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98 ${
                  !isRPGCleared ? 'col-span-2' : ''
                }`}
              >
                <Home className="w-4 h-4 text-white" />
                <span>初画面に戻る (レッスンモード)</span>
              </button>
            </div>
          </div>
        ) : isCourseMode && !isCourseFinished ? (
          /* コースモード進行中 */
          <div className="space-y-2">
            <button
              type="button"
              onClick={onNextCourseSong}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 hover:opacity-95 active:scale-98 transition-all"
            >
              <FastForward className="w-4 h-4 fill-current" />
              今すぐ次の曲へ進む！ (第{(courseState?.currentIndex || 1) + 1}曲へ)
            </button>

            <button
              type="button"
              onClick={onExitCourse || onSelectSong}
              className="w-full py-2.5 px-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
            >
              <ListOrdered className="w-3.5 h-3.5 text-slate-400" />
              コースを中断して選曲へ戻る
            </button>
          </div>
        ) : isCourseMode && isCourseFinished ? (
          /* コース完走 */
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onPlayAgain}
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg hover:opacity-95 active:scale-98 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              もう一度コース挑戦
            </button>

            <button
              type="button"
              onClick={onExitCourse || onSelectSong}
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg hover:opacity-95 active:scale-98 transition-all"
            >
              <ListOrdered className="w-4 h-4" />
              選曲画面へ戻る
            </button>
          </div>
        ) : (
          /* フリープレイ通常時 */
          <>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onPlayAgain}
                className="py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg hover:opacity-95 active:scale-98 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                もう一回あそぶ
              </button>

              <button
                type="button"
                onClick={onViewLeaderboard}
                className="py-3 px-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg hover:opacity-95 active:scale-98 transition-all"
              >
                <Trophy className="w-4 h-4" />
                ランキングを見る
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenMyPage}
                className="py-2.5 px-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <User className="w-3.5 h-3.5 text-pink-400" />
                マイページ
              </button>

              <button
                id="result-freeplay-return-home-btn"
                type="button"
                onClick={onSelectSong}
                className="py-2.5 px-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Home className="w-3.5 h-3.5 text-cyan-400" />
                初画面へ戻る
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
