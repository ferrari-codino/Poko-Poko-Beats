import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, SongData, Difficulty, MascotId } from '../types';
import { SONGS } from '../data/songs';
import { MASCOTS } from '../data/mascots';
import { Trophy, Medal, Crown, ArrowLeft, RefreshCw, Music, Sparkles } from 'lucide-react';
import { getLocalScores } from '../utils/storageFallback';

interface LeaderboardScreenProps {
  initialSongId?: string;
  initialDifficulty?: Difficulty | 'all';
  onBack: () => void;
  onSelectSongToPlay?: (song: SongData, diff: Difficulty) => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  initialSongId = 'all',
  initialDifficulty = 'all',
  onBack,
  onSelectSongToPlay,
}) => {
  const [selectedSongId, setSelectedSongId] = useState<string>(initialSongId);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(initialDifficulty);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSongId !== 'all') params.append('songId', selectedSongId);
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);

      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.leaderboard) {
          setEntries(data.leaderboard);
          return;
        }
      }
      // Fallback for static hosting (Vercel / GitHub Pages)
      setEntries(getLocalScores(selectedSongId, selectedDifficulty));
    } catch {
      // Fallback on network failure or static environment
      setEntries(getLocalScores(selectedSongId, selectedDifficulty));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedSongId, selectedDifficulty]);

  const getRankBadge = (rankIdx: number) => {
    if (rankIdx === 0) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-md">
          <Crown className="w-4 h-4 fill-amber-400" />
        </div>
      );
    }
    if (rankIdx === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-300/20 border-2 border-slate-300 flex items-center justify-center text-slate-200">
          <Medal className="w-4 h-4 fill-slate-300" />
        </div>
      );
    }
    if (rankIdx === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-700/20 border-2 border-amber-600 flex items-center justify-center text-amber-500">
          <Medal className="w-4 h-4 fill-amber-600" />
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-full bg-slate-800/90 flex items-center justify-center text-slate-400 font-black font-mono text-xs">
        {rankIdx + 1}
      </div>
    );
  };

  const getDiffBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'normal':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'hard':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'master':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto min-h-full flex flex-col p-3 sm:p-4 select-none animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <button
          id="back-to-menu-btn"
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </button>

        <div className="flex items-center gap-1.5 text-white font-black text-base sm:text-lg">
          <Trophy className="w-5 h-5 text-amber-400" />
          高得点ランキング TOP 30
        </div>

        <button
          id="refresh-leaderboard-btn"
          type="button"
          onClick={fetchLeaderboard}
          disabled={isLoading}
          className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-slate-900/85 p-3 rounded-3xl border border-slate-800 mb-3 space-y-2">
        {/* Song filter with Dropdown & Quick Scroll */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSongId}
            onChange={(e) => setSelectedSongId(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-pink-500 font-bold"
          >
            <option value="all">全楽曲 ({SONGS.length}曲) 総合ランキング</option>
            {SONGS.map((s, idx) => (
              <option key={s.id} value={s.id}>
                #{idx + 1} {s.title} ({s.category || s.genre})
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty filter */}
        <div className="flex items-center gap-1.5">
          {['all', 'easy', 'normal', 'hard', 'master'].map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setSelectedDifficulty(diff)}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold uppercase transition ${
                selectedDifficulty === diff
                  ? 'bg-white text-slate-950 font-black shadow'
                  : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {diff === 'all' ? '全難度' : diff}
            </button>
          ))}
        </div>
      </div>

      {/* LEADERBOARD LIST CONTAINER */}
      <div className="flex-1 overflow-y-auto max-h-[500px] space-y-2 pr-1 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-amber-400" />
            ランキングデータを読み込み中...
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 text-center text-slate-400 text-xs">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            該当するスコアデータがまだありません。
            <br />
            あなたが最初のハイスコアを刻みましょう！
          </div>
        ) : (
          entries.map((entry, idx) => {
            const mascot = MASCOTS[(entry.avatarId as MascotId) || 'pokota'] || MASCOTS.pokota;
            return (
              <div
                key={entry.id || idx}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all ${
                  idx === 0
                    ? 'bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : idx === 1
                    ? 'bg-slate-900/90 border-slate-300/30'
                    : idx === 2
                    ? 'bg-slate-900/90 border-amber-700/30'
                    : 'bg-slate-900/70 border-slate-800/70 hover:bg-slate-900'
                }`}
              >
                {/* Left: Rank & Avatar & Nickname */}
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  {getRankBadge(idx)}

                  {/* Cute Mascot Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full ${mascot.avatarBg} border border-white/60 flex items-center justify-center text-base shrink-0 shadow`}
                  >
                    {mascot.emoji}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs sm:text-sm text-white truncate max-w-[110px] sm:max-w-[150px]">
                        {entry.playerName}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md border ${getDiffBadge(
                          entry.difficulty
                        )}`}
                      >
                        {entry.difficulty}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <Music className="w-3 h-3 text-slate-500" />
                      {entry.songTitle}
                    </div>
                  </div>
                </div>

                {/* Right: Score & Stats */}
                <div className="text-right shrink-0">
                  <div className="font-black font-mono text-sm sm:text-base text-amber-400">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-end gap-1.5">
                    <span className="text-cyan-400">{entry.accuracy}%</span>
                    <span>•</span>
                    <span>{entry.maxCombo} Combo</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER STATS */}
      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>上位30名リアルタイム集計 (ニックネーム表示)</span>
        <span className="text-emerald-400 font-bold">● サーバー同期中</span>
      </div>
    </div>
  );
};
