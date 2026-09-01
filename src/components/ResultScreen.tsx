import React, { useState, useEffect } from 'react';
import { SongData, Difficulty, ScoreState, RhythmNote, PlayerSettings, MascotId, UserProfile } from '../types';
import { MascotCharacter } from './MascotCharacter';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ListOrdered, Sparkles, User, ArrowLeft } from 'lucide-react';
import { saveLocalScore, saveLocalUser } from '../utils/storageFallback';

interface ResultScreenProps {
  song: SongData;
  difficulty: Difficulty;
  scoreState: ScoreState;
  notes: RhythmNote[];
  settings: PlayerSettings;
  currentUser?: UserProfile | null;
  onUpdateUserBests?: (user: UserProfile) => void;
  onPlayAgain: () => void;
  onSelectSong: () => void;
  onViewLeaderboard: () => void;
  onOpenMyPage: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  song,
  difficulty,
  scoreState,
  notes,
  settings,
  currentUser,
  onUpdateUserBests,
  onPlayAgain,
  onSelectSong,
  onViewLeaderboard,
  onOpenMyPage,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<{ rankPosition?: number; isTop30?: boolean; isNewBest?: boolean } | null>(null);

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
    <div className="w-full max-w-lg mx-auto min-h-full flex flex-col justify-between p-3 sm:p-5 select-none animate-fade-in">
      {/* HEADER & MASCOT CHEER */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-xs font-black text-pink-300">
            <Sparkles className="w-3.5 h-3.5" />
            ステージクリア！🎉
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
      <div className="bg-slate-900/90 border-2 border-indigo-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md relative overflow-hidden my-3">
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
      </div>

      {/* ACTION BUTTONS */}
      <div className="space-y-2 mt-2">
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
            type="button"
            onClick={onSelectSong}
            className="py-2.5 px-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <ListOrdered className="w-3.5 h-3.5 text-cyan-400" />
            ほかの曲をえらぶ
          </button>
        </div>
      </div>
    </div>
  );
};
