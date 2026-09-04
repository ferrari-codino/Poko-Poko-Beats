import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SongData, Difficulty, UserProfile, SongCategory, DeviceMode } from '../types';
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
  Swords,
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
  onOpenShowcase?: () => void;
  onOpenMyDrumSet?: () => void;
  aiBattleEnabled?: boolean;
  onToggleAIBattle?: () => void;
  deviceMode?: DeviceMode;
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
  onOpenShowcase,
  onOpenMyDrumSet,
  aiBattleEnabled = false,
  onToggleAIBattle,
  deviceMode = 'smartphone',
}) => {
  const currentDiffInfo = selectedSong.difficulties[selectedDifficulty];
  const mascot = MASCOTS[currentUser?.avatarId || 'pokota'] || MASCOTS.pokota;
  const currentLevelConfig = getRPGLevelConfig(rpgLevel || 1);

  // Split Screen Modes: 'lesson' (初期値: レッスンモード) or 'songSelect' (曲と難易度を選択し演奏スタートするモード)
  const [activeScreenMode, setActiveScreenMode] = useState<'lesson' | 'songSelect'>('lesson');

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
    <div
      id="song-select-screen-container"
      className="w-full max-w-xl mx-auto h-full flex-1 min-h-0 flex flex-col justify-start overflow-y-auto overscroll-y-contain custom-scrollbar p-2.5 sm:p-4 pb-36 sm:pb-8 select-none animate-fade-in"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* TOP HEADER */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        {/* App Title & Mascot */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-rose-500 flex items-center justify-center text-xl shadow-lg border-2 border-white/60">
            🥁
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                Poko-Poko Beats
              </h1>
              <span className="text-[10px] font-mono font-black px-1.5 py-0.2 rounded-md bg-pink-500/25 text-pink-300 border border-pink-400/50 shadow-sm">
                v0.70
              </span>
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

          {/* Tablet Dedicated Feature 1: My Drum Kit Customizer Button */}
          {onOpenMyDrumSet && (
            <button
              id="song-select-my-drum-btn"
              type="button"
              onClick={onOpenMyDrumSet}
              className="hidden sm:flex px-2.5 py-1.5 rounded-2xl bg-pink-500/25 hover:bg-pink-500/35 text-pink-300 text-xs font-black border border-pink-400/50 items-center gap-1.5 transition shadow-sm"
              title="マイドラムセットの素材・色・ニックネームをカスタマイズ（最大5スロット登録）"
            >
              <span>🥁</span>
              <span>マイドラム</span>
              <span className="text-[9px] px-1 rounded bg-pink-400/20 text-pink-200 font-bold">5台</span>
            </button>
          )}

          {/* Tablet Dedicated Feature 2: AI Battle Mode Toggle Button (タブレットモード限定) */}
          {deviceMode === 'tablet' && onToggleAIBattle && (
            <button
              id="song-select-ai-battle-btn"
              type="button"
              onClick={onToggleAIBattle}
              className={`flex px-2.5 py-1.5 rounded-2xl text-xs font-black border items-center gap-1.5 transition shadow-sm ${
                aiBattleEnabled
                  ? 'bg-purple-500/30 text-purple-200 border-purple-400/60 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
              title="タブレット専用: AI対戦モードのON/OFF切り替え"
            >
              <Swords className={`w-3.5 h-3.5 ${aiBattleEnabled ? 'text-purple-300 animate-pulse' : 'text-slate-500'}`} />
              <span>AI対戦</span>
              <span className={`text-[9px] px-1 rounded font-bold ${aiBattleEnabled ? 'bg-purple-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {aiBattleEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {/* POKO-POKO BEATS SPECTACULAR FEATURES SHOWCASE BUTTON */}
          {onOpenShowcase && (
            <button
              id="open-showcase-btn"
              type="button"
              onClick={onOpenShowcase}
              className="px-2.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 hover:opacity-95 active:scale-95 text-slate-950 text-xs font-black border-2 border-white/70 flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse"
              title="Poko-poko Beats の神機能プレゼンテーション"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current text-slate-950" />
              <span>神機能紹介</span>
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

      {/* POKO-POKO BEATS SPECTACULAR SHOWCASE CALLOUT BANNER */}
      {onOpenShowcase && (
        <button
          type="button"
          onClick={onOpenShowcase}
          className="w-full mb-2 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border-2 border-amber-400/60 shadow-lg flex items-center justify-between group transition-all text-left relative overflow-hidden"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-pink-500 to-cyan-400 flex items-center justify-center text-xl shadow shrink-0 border border-white/60 group-hover:scale-105 transition-transform">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-amber-300">
                  プロドラマー唸る！神機能プレゼンテーション
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-[9px] uppercase tracking-wider animate-pulse shadow-sm">
                  NEW
                </span>
              </div>
              <p className="text-[10px] text-slate-300">
                ハイハット共鳴・グルーヴ診断・リムショット・部屋鳴り音響を体感 ➜
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black shadow transition shrink-0 flex items-center gap-1 group-hover:scale-105">
            <span>見る</span>
            <span>⚡</span>
          </div>
        </button>
      )}

      {/* SCREEN MODE SPLIT SWITCH (①レッスンモード [初期値] と 曲・難易度選択演奏モードの画面分割) */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-900/95 border-2 border-slate-800 shadow-lg mb-3 shrink-0">
        <button
          id="mode-tab-lesson-btn"
          type="button"
          onClick={() => setActiveScreenMode('lesson')}
          className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeScreenMode === 'lesson'
              ? 'bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 text-slate-950 shadow-lg shadow-pink-500/25 border-2 border-white/60 scale-[1.01]'
              : 'text-slate-400 hover:text-white bg-slate-950/50 border border-slate-800/80'
          }`}
        >
          <span className="text-base">🥁</span>
          <span>レッスンモード</span>
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold border ${
              activeScreenMode === 'lesson'
                ? 'bg-black/30 text-white border-black/20'
                : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
            }`}
          >
            初期値
          </span>
        </button>

        <button
          id="mode-tab-song-select-btn"
          type="button"
          onClick={() => setActiveScreenMode('songSelect')}
          className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeScreenMode === 'songSelect'
              ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/25 border-2 border-white/60 scale-[1.01]'
              : 'text-slate-400 hover:text-white bg-slate-950/50 border border-slate-800/80'
          }`}
        >
          <span className="text-base">🎵</span>
          <span>曲と難易度を選んで演奏</span>
        </button>
      </div>

      {activeScreenMode === 'lesson' ? (
        /* ========================================================
           SCREEN 1: LESSON MODE (ドラムレッスン・RPGステップアップモード)
           縦領域を圧迫せず、レッスン内容と開始ボタンがすぐ目の前で押せる！
           ======================================================== */
        <div className="flex-1 flex flex-col justify-start space-y-3 animate-fade-in pb-20 sm:pb-4">
          {/* Main Active Lesson Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-pink-950/80 via-purple-950/70 to-slate-900/90 border-2 border-pink-400/70 shadow-2xl relative overflow-hidden space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black shadow-md">
                <span>🔰</span>
                <span>ステップアップ ドラムレッスン</span>
              </div>
              <span className="text-xs font-mono font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-sm">
                👑 PLAYER Lv.{rpgLevel || 1}
              </span>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-rose-500 flex items-center justify-center text-3xl shadow-xl border-2 border-white shrink-0">
                🥁
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
                    {rpgLevel <= 20 ? '初級コース (基礎ビート編)' : rpgLevel <= 60 ? '中級コース (シンコペーション編)' : '上級コース (プロフィルイン編)'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white mt-1 leading-snug">
                  {currentLevelConfig?.title || `Level ${rpgLevel}: はじめのドン！`}
                </h2>
                <p className="text-xs text-amber-200/90 font-medium mt-1 leading-relaxed">
                  {rpgLevel === 1
                    ? '🎵 課題曲: はじめてのマーチ (ゆったりBPM 60・光ガイド1.5秒前・足だけで安心クリア！)'
                    : currentLevelConfig?.focusLesson}
                </p>
              </div>
            </div>

            {/* Clear Goal & Requirements */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-base">🎯</span>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">目標クリアスコア</div>
                  <div className="font-mono font-black text-amber-300">
                    {currentLevelConfig?.clearMinScore ? `${currentLevelConfig.clearMinScore.toLocaleString()} 点` : '20,000 点'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-base">⏱️</span>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">テンポ / 難易度</div>
                  <div className="font-mono font-black text-cyan-300">
                    BPM {currentLevelConfig?.bpm || 60}
                  </div>
                </div>
              </div>
            </div>

            {/* PRIMARY UNMISSABLE LESSON START BUTTON */}
            <button
              id="start-current-rpg-level-btn"
              type="button"
              onClick={() => {
                if (onStartRPGLevel) {
                  onStartRPGLevel(rpgLevel || 1);
                } else if (onOpenRPGModal) {
                  onOpenRPGModal();
                }
              }}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 active:scale-98 text-slate-950 font-black text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-2xl shadow-pink-500/40 border-2 border-white/80 transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current text-slate-950" />
              <span>
                {rpgLevel === 1 ? '🌟 今すぐ第1回レッスンを演奏スタート！' : `🌟 Lv.${rpgLevel} レッスンの演奏をスタート！`}
              </span>
            </button>

            {/* View Full Curriculum Stages Button */}
            {onOpenRPGModal && (
              <button
                id="open-rpg-curriculum-modal-btn"
                type="button"
                onClick={onOpenRPGModal}
                className="w-full py-2.5 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-pink-300 border border-slate-700/80 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>全100段階カリキュラム一覧・到達マップを見る ▷</span>
              </button>
            )}
          </div>

          {/* Secondary Utilities */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenFreePlay}
              className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-200">
                <span>🥁</span>
                <span>フリードラム練習</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">譜面なしで自由にビートを叩く</p>
            </button>

            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>全国ランキング</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">全国のハイスコアをチェック</p>
            </button>
          </div>

          {/* Mode Switch Helper Card */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-300">
              全100曲から好きな曲・難易度（EASY〜MASTER）を選んで演奏したい時はこちら！
            </p>
            <button
              id="switch-to-song-select-mode-btn"
              type="button"
              onClick={() => setActiveScreenMode('songSelect')}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs flex items-center justify-center gap-2 mx-auto transition-all shadow-md active:scale-98"
            >
              <Music2 className="w-4 h-4" />
              <span>🎵 曲・難易度選択モードへ移動する ➜</span>
            </button>
          </div>

          {/* Mobile floating quick lesson start bar */}
          <div className="fixed sm:hidden bottom-3 left-3 right-3 z-40 flex items-center justify-between gap-2 p-2.5 px-3.5 rounded-2xl bg-slate-950/95 border-2 border-pink-500/70 shadow-[0_0_24px_rgba(236,72,153,0.35)] backdrop-blur-xl">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white truncate max-w-[150px]">
                  Lv.{rpgLevel || 1} {currentLevelConfig?.title || 'はじめのドン！'}
                </span>
              </div>
              <div className="text-[9px] text-amber-300 font-mono flex items-center gap-1 mt-0.5">
                <span>⚡ BPM {currentLevelConfig?.bpm || 60}</span>
                <span>•</span>
                <span>レッスンモード</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onStartRPGLevel) {
                  onStartRPGLevel(rpgLevel || 1);
                } else if (onOpenRPGModal) {
                  onOpenRPGModal();
                }
              }}
              className="py-2.5 px-4 bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 active:scale-95 text-slate-950 font-black rounded-xl shadow-lg flex items-center gap-1.5 text-xs shrink-0 transition-transform"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>レッスン開始！🌟</span>
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================
           SCREEN 2: SONG & DIFFICULTY SELECT & PLAY START MODE
           全曲リスト & 難易度選択 & 演奏スタートボタン
           ======================================================== */
        <div className="flex-1 flex flex-col justify-start space-y-2 animate-fade-in pb-20 sm:pb-4">
          {/* MODE BUTTONS: Random, Course Mode, Free Play, Ranking */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-1 shrink-0">
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
            <div className="p-2 rounded-2xl bg-gradient-to-r from-pink-500/30 to-amber-500/30 border border-amber-400/60 text-center animate-bounce">
              <div className="text-[10px] text-amber-300 font-bold uppercase">ルーレット回転中... 🎲</div>
              <div className="text-sm font-black text-white truncate">{rouletteSongTitle}</div>
            </div>
          )}

          {/* SEARCH BAR & GENRE TABS */}
          <div className="space-y-1.5 mb-1 shrink-0">
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
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm scale-102 ring-1 ring-white/40'
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
            className="flex flex-col gap-1.5 overflow-y-auto max-h-[240px] sm:max-h-[300px] mb-2 pr-1 custom-scrollbar shrink-0"
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
                    onClick={() => {
                      onSelectSong(song);
                      setTimeout(() => {
                        const el = document.getElementById('difficulty-start-panel');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                      }, 60);
                    }}
                    className={`p-2.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.25)] ring-2 ring-cyan-400/40'
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
                          {song.timeSignature}拍子 • {song.duration}秒
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 text-[10px] text-cyan-200/90 flex items-center justify-between">
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
          <div
            id="difficulty-start-panel"
            className="bg-slate-900/95 border-2 border-cyan-400/40 rounded-3xl p-3 sm:p-3.5 shadow-2xl backdrop-blur-md shrink-0 mb-3"
          >
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
                className="col-span-4 py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:opacity-95 active:scale-98 text-white font-black rounded-2xl shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 text-sm sm:text-base transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                演奏スタート！🥁
              </button>

              <button
                type="button"
                onClick={() => handleRandomSelect(true)}
                className="col-span-1 py-3.5 px-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 active:scale-98 text-white font-black rounded-2xl shadow-lg flex flex-col items-center justify-center text-[10px] transition-all"
                title="曲をランダム決定して即スタート！"
              >
                <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>即ランダム</span>
              </button>
            </div>
          </div>

          {/* MOBILE FLOATING QUICK PLAY BAR: Always accessible on mobile so player can start instantly */}
          <div className="fixed sm:hidden bottom-3 left-3 right-3 z-40 flex items-center justify-between gap-2 p-2.5 px-3.5 rounded-2xl bg-slate-950/95 border-2 border-cyan-500/70 shadow-[0_0_24px_rgba(6,182,212,0.35)] backdrop-blur-xl">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white truncate max-w-[140px]">
                  {selectedSong.title}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-cyan-500/30 text-cyan-300 border border-cyan-400/50">
                  {selectedDifficulty}
                </span>
              </div>
              <div className="text-[9px] text-amber-300 font-mono flex items-center gap-1 mt-0.5">
                <span>⚡ {selectedSong.bpm} BPM</span>
                <span>•</span>
                <span>{selectedSong.duration}秒</span>
              </div>
            </div>

            <button
              id="mobile-sticky-start-btn"
              type="button"
              onClick={onStartGame}
              className="py-2.5 px-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 active:scale-95 text-white font-black rounded-xl shadow-lg flex items-center gap-1.5 text-xs shrink-0 transition-transform"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>演奏スタート！🥁</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
