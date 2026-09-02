import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SongData, Difficulty, UserProfile, SongCategory } from '../types';
import { SONGS, SONG_CATEGORIES } from '../data/songs';
import { MASCOTS } from '../data/mascots';
import { getRPGLevelConfig } from '../data/rpgCurriculum';
import {
  Play,
  Trophy,
  Activity,
  Clock,
  Sliders,
  Sparkles,
  Music2,
  Star,
  Shuffle,
  Zap,
  Flame,
  Search,
  Github,
  Shield,
  Layers,
} from 'lucide-react';

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
  onOpenCourseModal: () => void;
  onStartRandomGame?: () => void;
  onOpenRPGModal?: () => void;
  onStartRPGLevel?: (level: number) => void;
  rpgLevel?: number;
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
  onOpenCourseModal,
  onStartRandomGame,
  onOpenRPGModal,
  onStartRPGLevel,
  rpgLevel = 1,
}) => {
  const currentDiffInfo = selectedSong.difficulties[selectedDifficulty];
  const mascot = MASCOTS[currentUser?.avatarId || 'pokota'] || MASCOTS.pokota;
  const currentLevelConfig = getRPGLevelConfig(rpgLevel || 1);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | SongCategory>('ALL');
  const [isRouletteRolling, setIsRouletteRolling] = useState(false);
  const [rouletteSongTitle, setRouletteSongTitle] = useState('');

  const songListRef = useRef<HTMLDivElement>(null);

  // Filter songs by category and search
  const filteredSongs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return SONGS.filter((song) => {
      const matchesCat =
        selectedCategory === 'ALL' || song.category === selectedCategory;
      if (!matchesCat) return false;

      if (!query) return true;
      return (
        song.title.toLowerCase().includes(query) ||
        song.subtitle.toLowerCase().includes(query) ||
        song.genre.toLowerCase().includes(query) ||
        (song.category && song.category.toLowerCase().includes(query)) ||
        song.bpm.toString().includes(query)
      );
    });
  }, [selectedCategory, searchQuery]);

  // Roulette Random Song Picker
  const handleRandomSelect = (immediateStart = false) => {
    if (isRouletteRolling) return;
    const pool = filteredSongs.length > 0 ? filteredSongs : SONGS;
    if (pool.length === 0) return;

    setIsRouletteRolling(true);
    let counter = 0;
    const intervalTime = 60;
    const totalSteps = 10;

    const timer = setInterval(() => {
      counter++;
      const tempSong = pool[Math.floor(Math.random() * pool.length)];
      setRouletteSongTitle(tempSong.title);

      if (counter >= totalSteps) {
        clearInterval(timer);
        const finalSong = pool[Math.floor(Math.random() * pool.length)];
        onSelectSong(finalSong);
        setRouletteSongTitle(finalSong.title);
        setIsRouletteRolling(false);

        // Scroll selected card into view
        setTimeout(() => {
          const el = document.getElementById(`song-card-${finalSong.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 50);

        if (immediateStart) {
          setTimeout(() => {
            onStartGame();
          }, 200);
        }
      }
    }, intervalTime);
  };

  return (
    <div className="w-full max-w-xl mx-auto min-h-full flex flex-col justify-between p-2.5 sm:p-4 select-none animate-fade-in">
      {/* TOP HEADER */}
      <div className="flex items-center justify-between mb-2">
        {/* App Title & Mascot */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-rose-500 flex items-center justify-center text-xl shadow-lg border-2 border-white/60">
            🥁
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                Poko-Poko Beats
              </h1>
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 font-black border border-amber-400/50 shadow-sm">
                <span>👑</span>
                <span>USER Lv.{rpgLevel || 1}</span>
              </span>
            </div>
            <span className="text-[10px] text-amber-300 font-bold">
              全100曲 🌟 ドラム音ゲー
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1">
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
            className="px-2 py-1.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1 transition shadow-sm"
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
      <div className="bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-slate-900/90 rounded-2xl p-2 sm:p-2.5 border border-pink-500/30 shadow-md mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenMyPage}
          className="flex items-center gap-2 text-left group hover:opacity-90 transition-all"
        >
          <div className={`w-8 h-8 rounded-full ${mascot.avatarBg} border-2 border-white flex items-center justify-center text-base shadow shrink-0`}>
            {mascot.emoji}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white group-hover:text-pink-300 transition-colors">
                {currentUser?.nickname || 'ゲストドラマー'}
              </span>
              <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/25 text-amber-300 font-black border border-amber-400/50 shadow-sm">
                <span>👑</span>
                <span>USER Lv.{rpgLevel || 1}</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-900/80 text-amber-300 font-bold">
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
          className="px-2 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition"
        >
          切替
        </button>
      </div>

      {/* RPG TRAINING & COACH PROMOTION BANNER (プレイヤーを初級レッスンへ惹きつける誘導カード) */}
      {onOpenRPGModal && (
        <div className="w-full mb-2.5 p-3 rounded-2xl bg-gradient-to-r from-pink-950/70 via-purple-950/60 to-slate-900/80 border-2 border-pink-400/60 shadow-[0_0_20px_rgba(244,114,182,0.15)] relative overflow-hidden group">
          {/* Subtle Glow Accents */}
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Top Recommendation Badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black tracking-wide shadow-sm animate-pulse">
              <span>🔰</span>
              <span>おすすめ！ ゼロから上達ステップアップ</span>
            </div>
            <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
              👑 PLAYER Lv.{rpgLevel}
            </span>
          </div>

          {/* Card Body: Level Info & Lesson Goals */}
          <div className="flex items-start gap-3 mb-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-rose-500 flex items-center justify-center text-2xl shadow-lg border-2 border-white/60 shrink-0">
              🥁
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight">
                  ドラムレッスン（ステップアップ）
                </h2>
                <span className="text-[10px] text-pink-300 font-bold bg-pink-500/20 px-1.5 py-0.2 rounded border border-pink-500/30">
                  {rpgLevel <= 20 ? '初級コース' : rpgLevel <= 60 ? '中級コース' : '上級コース'}
                </span>
              </div>
              <div className="text-[11px] font-black text-amber-300 mt-0.5 truncate">
                {currentLevelConfig?.title || `Level ${rpgLevel}: はじめのドン！`}
              </div>
              <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
                {rpgLevel === 1
                  ? '🎵 課題曲: はじめてのマーチ (ゆったりBPM 60・光ガイド1.5秒前・足だけで安心クリア！)'
                  : currentLevelConfig?.focusLesson}
              </p>
            </div>
          </div>

          {/* Action Buttons: Direct Start & Curriculum Overview */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-pink-500/20">
            {/* Direct Level 1 / Current Level Start Button */}
            <button
              id="start-current-rpg-level-btn"
              type="button"
              onClick={() => {
                if (onStartRPGLevel) {
                  onStartRPGLevel(rpgLevel || 1);
                } else {
                  onOpenRPGModal();
                }
              }}
              className="py-2 px-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-black text-xs shadow-md border border-pink-300/50 flex items-center justify-center gap-1.5 transition-all active:scale-95 group/btn"
            >
              <Play className="w-3.5 h-3.5 fill-current text-white group-hover/btn:scale-110 transition-transform" />
              <span>
                {rpgLevel === 1 ? '▶ 今すぐLv.1をスタート！' : `▶ Lv.${rpgLevel} レッスン開始`}
              </span>
            </button>

            {/* View Full Curriculum Modal Button */}
            <button
              id="open-rpg-curriculum-modal-btn"
              type="button"
              onClick={onOpenRPGModal}
              className="py-2 px-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-pink-300 font-bold text-xs border border-slate-700/80 flex items-center justify-center gap-1 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>全100段階カリキュラム ▷</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE BUTTONS: Course Mode, Random, Free Play, Ranking */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
        {/* 1. おまかせ (RANDOM) BUTTON */}
        <button
          id="random-song-btn"
          type="button"
          onClick={() => handleRandomSelect(false)}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-2xl font-black text-xs border shadow-sm transition-all active:scale-95 ${
            isRouletteRolling
              ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 animate-pulse border-white'
              : 'bg-gradient-to-r from-pink-500/25 to-rose-500/25 text-pink-300 hover:from-pink-500/35 hover:to-rose-500/35 border-pink-500/40'
          }`}
          title="ランダムで曲を決定します"
        >
          <Shuffle className={`w-3.5 h-3.5 ${isRouletteRolling ? 'animate-spin' : ''}`} />
          <span>おまかせ (RANDOM)</span>
        </button>

        {/* 2. 連続コースモード BUTTON */}
        <button
          id="open-course-mode-btn"
          type="button"
          onClick={onOpenCourseModal}
          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-2xl bg-gradient-to-r from-amber-500/25 to-yellow-500/25 hover:from-amber-500/35 text-amber-300 font-black text-xs border border-amber-500/40 shadow-sm transition-all active:scale-95"
          title="クリア後、自動で次の曲に連続で進むコースモード"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>連続コースモード</span>
        </button>

        {/* 3. フリー練習モード BUTTON */}
        <button
          id="open-freeplay-btn"
          type="button"
          onClick={onOpenFreePlay}
          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-2xl border border-slate-800 shadow-sm transition active:scale-95"
        >
          <span>🥁</span>
          <span>フリー練習</span>
        </button>

        {/* 4. 全国TOP30ランキング BUTTON */}
        <button
          id="open-ranking-btn"
          type="button"
          onClick={onOpenLeaderboard}
          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-2xl border border-slate-800 shadow-sm transition active:scale-95"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>全国ランキング</span>
        </button>
      </div>

      {/* ROULETTE BANNER IF ROLLING */}
      {isRouletteRolling && (
        <div className="mb-2 p-2 rounded-2xl bg-gradient-to-r from-pink-500/30 to-amber-500/30 border border-amber-400/60 text-center animate-bounce">
          <div className="text-[10px] text-amber-300 font-bold uppercase">ルーレット回転中... 🎲</div>
          <div className="text-sm font-black text-white truncate">{rouletteSongTitle}</div>
        </div>
      )}

      {/* SEARCH BAR & GENRE TABS */}
      <div className="space-y-1.5 mb-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="全100曲から検索 (曲名・ジャンル・BPM...)"
            className="w-full pl-8 pr-7 py-1.5 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Genre Category Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {SONG_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm scale-102 ring-1 ring-white/40'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat === 'ALL' ? `全曲 (${SONGS.length})` : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* SONG SELECTION LIST */}
      <div
        ref={songListRef}
        className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[220px] sm:max-h-[260px] mb-2 pr-1 custom-scrollbar"
      >
        {filteredSongs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            該当する楽曲が見つかりませんでした。
          </div>
        ) : (
          filteredSongs.map((song) => {
            const isSelected = song.id === selectedSong.id;
            const isHardcore = song.bpm >= 200 || song.timeSignature.includes('8');

            return (
              <div
                id={`song-card-${song.id}`}
                key={song.id}
                onClick={() => onSelectSong(song)}
                className={`p-2.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-pink-400 shadow-[0_0_16px_rgba(244,114,182,0.25)] ring-2 ring-pink-400/40'
                    : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-xs border border-white/30 shrink-0"
                      style={{ backgroundColor: song.previewColor }}
                    >
                      <Music2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs sm:text-sm text-white truncate">
                          {song.title}
                        </span>
                        {song.id === 'baby-march' && (
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-pink-500/30 text-pink-300 border border-pink-400/50 font-black shrink-0 animate-pulse flex items-center gap-0.5">
                            <span>🔰</span>
                            <span>レッスンLv.1 対象曲</span>
                          </span>
                        )}
                        {song.category && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium shrink-0">
                            {song.category}
                          </span>
                        )}
                        {isHardcore && (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold shrink-0">
                            ⚡超絶
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{song.subtitle}</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-0.5 shrink-0 ml-2">
                    <span className="font-mono text-[11px] text-amber-300 font-bold flex items-center gap-0.5">
                      <Activity className="w-3 h-3 text-amber-400" />
                      {song.bpm} BPM
                    </span>
                    <span className="font-mono text-[9px] text-cyan-300 font-bold bg-cyan-950/70 px-1.5 py-0.2 rounded border border-cyan-800/40">
                      {song.timeSignature}拍子 • {song.duration}s
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 text-[10px] text-pink-200/90 flex items-center justify-between">
                    <span className="truncate pr-2">{song.description}</span>
                    <span className="text-slate-400 font-mono flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {song.duration}秒
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* DIFFICULTY SELECTOR & SONG START PANEL */}
      <div className="bg-slate-900/95 border-2 border-pink-400/30 rounded-3xl p-3 sm:p-3.5 shadow-2xl backdrop-blur-md">
        {/* Difficulty Tabs Header */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-black text-white flex items-center gap-1">
            <span>⭐</span> 難易度を選択
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: currentDiffInfo.starRating }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-[10px] text-slate-400 font-mono ml-1">
              ({currentDiffInfo.noteCount} ノーツ)
            </span>
          </div>
        </div>

        {/* Difficulty Buttons */}
        <div className="grid grid-cols-4 gap-1.5 mb-2.5">
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
                className={`py-1.5 rounded-2xl text-[11px] font-black uppercase transition-all ${
                  isDiffActive
                    ? `bg-gradient-to-r ${diffTheme} text-white shadow-md scale-102 ring-2 ring-white/40`
                    : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {diff}
              </button>
            );
          })}
        </div>

        {/* DUAL START BUTTONS: Normal Play & Random Quick Start */}
        <div className="grid grid-cols-5 gap-2">
          <button
            id="start-game-btn"
            type="button"
            onClick={onStartGame}
            className="col-span-4 py-3 px-4 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:opacity-95 active:scale-98 text-white font-black rounded-2xl shadow-xl shadow-pink-500/25 flex items-center justify-center gap-2 text-sm sm:text-base transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            演奏スタート！🥁
          </button>

          <button
            type="button"
            onClick={() => handleRandomSelect(true)}
            className="col-span-1 py-3 px-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 active:scale-98 text-white font-black rounded-2xl shadow-lg flex flex-col items-center justify-center text-[10px] transition-all"
            title="曲をランダム決定して即スタート！"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>即ランダム</span>
          </button>
        </div>
      </div>
    </div>
  );
};
