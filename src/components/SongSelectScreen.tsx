import React from 'react';
import { SongData, Difficulty, UserProfile } from '../types';
import { SONGS } from '../data/songs';
import { MASCOTS } from '../data/mascots';
import { Play, Trophy, Activity, Clock, Sliders, Sparkles, Music2, Star, User, Heart, Github, Shield } from 'lucide-react';

interface SongSelectScreenProps {
  selectedSong: SongData;
  onSelectSong: (song: SongData) => void;
  selectedDifficulty: Difficulty;
  onSelectDifficulty: (diff: Difficulty) => void;
  onStartGame: () => void;
  onOpenLeaderboard: () => void;
  onOpenFreePlay: () => void;
  onOpenSettings: () => void;
  onOpenIdeas: () => void;
  currentUser?: UserProfile | null;
  onOpenMyPage: () => void;
  onOpenSwitchUser: () => void;
  onOpenGitHub?: () => void;
  onOpenAdmin?: () => void;
}

export const SongSelectScreen: React.FC<SongSelectScreenProps> = ({
  selectedSong,
  onSelectSong,
  selectedDifficulty,
  onSelectDifficulty,
  onStartGame,
  onOpenLeaderboard,
  onOpenFreePlay,
  onOpenSettings,
  onOpenIdeas,
  currentUser,
  onOpenMyPage,
  onOpenSwitchUser,
  onOpenGitHub,
  onOpenAdmin,
}) => {
  const currentDiffInfo = selectedSong.difficulties[selectedDifficulty];
  const mascot = MASCOTS[currentUser?.avatarId || 'pokota'] || MASCOTS.pokota;

  return (
    <div className="w-full max-w-xl mx-auto min-h-full flex flex-col justify-between p-3 sm:p-4 select-none animate-fade-in">
      {/* TOP HEADER */}
      <div className="flex items-center justify-between mb-2.5">
        {/* App Title & Mascot */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-rose-500 flex items-center justify-center text-2xl shadow-lg border-2 border-white/60">
            🥁
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg sm:text-xl font-black text-white leading-tight">
                Poko-Poko Beats
              </h1>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/40">
                Kids Edition
              </span>
            </div>
            <span className="text-[11px] text-amber-300 font-bold">
              ポコポコビーツ 🌟 ドラム音ゲー
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5">
          {onOpenAdmin && (
            <button
              id="open-admin-btn"
              type="button"
              onClick={onOpenAdmin}
              className="p-2 rounded-2xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 transition shadow-sm"
              aria-label="Admin Panel"
              title="開発者アクセス管理パネル"
            >
              <Shield className="w-4 h-4 text-pink-400" />
            </button>
          )}

          {onOpenGitHub && (
            <button
              id="open-github-btn"
              type="button"
              onClick={onOpenGitHub}
              className="p-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              aria-label="GitHub & App URLs"
              title="GitHub 連携 & URL 情報"
            >
              <Github className="w-4 h-4 text-white" />
            </button>
          )}

          <button
            id="open-ideas-btn"
            type="button"
            onClick={onOpenIdeas}
            className="px-2.5 py-1.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">面白さUP提案</span>
            <span className="sm:hidden">提案</span>
          </button>

          <button
            id="open-settings-btn"
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            aria-label="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* USER PROFILE & MASCOT BAR */}
      <div className="bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-slate-900/90 rounded-3xl p-2.5 sm:p-3 border border-pink-500/30 shadow-md mb-2.5 flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenMyPage}
          className="flex items-center gap-2.5 text-left group hover:opacity-90 transition-all"
        >
          <div className={`w-9 h-9 rounded-full ${mascot.avatarBg} border-2 border-white flex items-center justify-center text-lg shadow shrink-0`}>
            {mascot.emoji}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white group-hover:text-pink-300 transition-colors">
                {currentUser?.nickname || 'ゲストドラマー'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-900/80 text-amber-300 font-bold">
                マイページ ▷
              </span>
            </div>
            <div className="text-[10px] text-pink-200/80 truncate">
              相棒: {mascot.name} • 累計: {((currentUser?.totalScore || 0) / 10000).toFixed(1)}万点
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenSwitchUser}
          className="px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 transition"
        >
          切替
        </button>
      </div>

      {/* QUICK MODE BAR: Free Play & Ranking */}
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <button
          id="open-freeplay-btn"
          type="button"
          onClick={onOpenFreePlay}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-2xl border border-slate-800 shadow-sm transition"
        >
          <span className="text-base">🥁</span>
          フリー練習モード
        </button>

        <button
          id="open-ranking-btn"
          type="button"
          onClick={onOpenLeaderboard}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-amber-500/20 to-pink-500/20 hover:from-amber-500/30 text-amber-300 text-xs font-bold rounded-2xl border border-amber-500/40 shadow-sm transition"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          全国TOP30ランキング
        </button>
      </div>

      {/* SONG SELECTION LIST */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[250px] sm:max-h-[290px] mb-2.5 pr-1 custom-scrollbar">
        {SONGS.map((song) => {
          const isSelected = song.id === selectedSong.id;
          const isHardcore = song.bpm >= 200 || song.timeSignature.includes('8');

          return (
            <div
              id={`song-card-${song.id}`}
              key={song.id}
              onClick={() => onSelectSong(song)}
              className={`p-3 rounded-3xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-pink-400 shadow-[0_0_20px_rgba(244,114,182,0.2)] ring-2 ring-pink-400/40'
                  : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md text-sm border border-white/30"
                    style={{ backgroundColor: song.previewColor }}
                  >
                    <Music2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-white">{song.title}</span>
                      {isHardcore && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                          ⚡ 超絶高難易度
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{song.subtitle}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-mono text-xs text-amber-300 font-bold flex items-center gap-1">
                    <Activity className="w-3 h-3 text-amber-400" />
                    {song.bpm} BPM
                  </span>
                  <span className="font-mono text-[10px] text-cyan-300 font-bold bg-cyan-950/70 px-1.5 py-0.2 rounded border border-cyan-800/40">
                    {song.timeSignature}拍子 • {song.duration}s
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-pink-200/90 flex items-center justify-between">
                  <span>{song.description}</span>
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {song.duration}秒
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* DIFFICULTY SELECTOR & SONG START PANEL */}
      <div className="bg-slate-900/95 border-2 border-pink-400/30 rounded-3xl p-3 sm:p-4 shadow-2xl backdrop-blur-md">
        {/* Difficulty Tabs Header */}
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-xs font-black text-white flex items-center gap-1">
            <span>⭐</span> 難易度を選択
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: currentDiffInfo.starRating }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-[11px] text-slate-400 font-mono ml-1">
              ({currentDiffInfo.noteCount} ノーツ)
            </span>
          </div>
        </div>

        {/* Difficulty Buttons */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {(['easy', 'normal', 'hard', 'master'] as Difficulty[]).map((diff) => {
            const isDiffActive = selectedDifficulty === diff;
            const diffTheme =
              diff === 'easy'
                ? 'from-emerald-500 to-teal-500'
                : diff === 'normal'
                ? 'from-cyan-500 to-blue-500'
                : diff === 'hard'
                ? 'from-amber-500 to-orange-500'
                : 'from-purple-600 to-pink-600';

            return (
              <button
                id={`diff-btn-${diff}`}
                key={diff}
                type="button"
                onClick={() => onSelectDifficulty(diff)}
                className={`py-2 rounded-2xl text-xs font-black uppercase transition-all ${
                  isDiffActive
                    ? `bg-gradient-to-r ${diffTheme} text-white shadow-lg scale-102 ring-2 ring-white/40`
                    : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {diff}
              </button>
            );
          })}
        </div>

        {/* START BUTTON */}
        <button
          id="start-game-btn"
          type="button"
          onClick={onStartGame}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:opacity-95 active:scale-98 text-white font-black rounded-2xl shadow-xl shadow-pink-500/25 flex items-center justify-center gap-2 text-base transition-all"
        >
          <Play className="w-5 h-5 fill-current" />
          演奏スタート！🥁
        </button>
      </div>
    </div>
  );
};
