import React, { useState } from 'react';
import { SongData, Difficulty, CourseState, SongCategory } from '../types';
import { SONGS, SONG_CATEGORIES } from '../data/songs';
import { Trophy, Flame, Infinity as InfinityIcon, Shuffle, Disc3, X, Play, Check } from 'lucide-react';

interface CourseSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDifficulty: Difficulty;
  onStartCourse: (courseState: CourseState) => void;
}

export const CourseSelectModal: React.FC<CourseSelectModalProps> = ({
  isOpen,
  onClose,
  defaultDifficulty,
  onStartCourse,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<'3_songs' | '5_songs' | 'endless' | 'random' | 'genre'>('3_songs');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(defaultDifficulty);
  const [selectedGenre, setSelectedGenre] = useState<SongCategory>('J-POP');

  if (!isOpen) return null;

  // Helper to shuffle array
  const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const handleStart = () => {
    let queue: SongData[] = [];
    let title = '3曲連続チャレンジコース';
    let mode: CourseState['mode'] = '3_songs';
    let total = 3;

    if (selectedPreset === '3_songs') {
      title = '🔥 3曲連続チャレンジコース';
      mode = '3_songs';
      total = 3;
      queue = shuffle(SONGS).slice(0, 3);
    } else if (selectedPreset === '5_songs') {
      title = '👑 5曲マスターコース';
      mode = '5_songs';
      total = 5;
      queue = shuffle(SONGS).slice(0, 5);
    } else if (selectedPreset === 'endless') {
      title = '🌀 エンドレス継続コース';
      mode = 'endless';
      total = Infinity;
      queue = shuffle(SONGS);
    } else if (selectedPreset === 'random') {
      title = '🎲 100曲ランダムシャッフルコース';
      mode = '3_songs';
      total = 3;
      queue = shuffle(SONGS).slice(0, 3);
    } else if (selectedPreset === 'genre') {
      title = `🎵 ${selectedGenre} 連続特化コース`;
      mode = '3_songs';
      total = 3;
      const genreSongs = SONGS.filter((s) => s.category === selectedGenre);
      queue = shuffle(genreSongs.length >= 3 ? genreSongs : SONGS).slice(0, 3);
    }

    const newCourseState: CourseState = {
      isActive: true,
      courseTitle: title,
      mode,
      totalSongs: total,
      currentIndex: 1,
      difficulty: selectedDifficulty,
      songsQueue: queue,
      accumulatedScore: 0,
      maxCombo: 0,
      totalPerfect: 0,
      totalGreat: 0,
      totalGood: 0,
      totalMiss: 0,
      history: [],
    };

    onStartCourse(newCourseState);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border-2 border-pink-500/40 rounded-3xl p-4 sm:p-5 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-500 flex items-center justify-center text-xl shadow-md border border-white/40">
            🔄
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
              連続コースモード
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
                AUTO-ADVANCE
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              曲をクリアすると自動で次の曲へ連続で進行します！
            </p>
          </div>
        </div>

        {/* Preset Courses List */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-black text-slate-300 flex items-center gap-1 mb-1.5">
            <span>🏁</span> コースを選択
          </label>

          {/* 3 Songs Challenge */}
          <button
            type="button"
            onClick={() => setSelectedPreset('3_songs')}
            className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
              selectedPreset === '3_songs'
                ? 'bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-slate-900 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-white">3曲連続チャレンジコース</div>
                <div className="text-[10px] text-slate-400">
                  全100曲からバランス良く選出・累計ハイスコアを目指す！
                </div>
              </div>
            </div>
            {selectedPreset === '3_songs' && <Check className="w-4 h-4 text-amber-400" />}
          </button>

          {/* 5 Songs Master */}
          <button
            type="button"
            onClick={() => setSelectedPreset('5_songs')}
            className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
              selectedPreset === '5_songs'
                ? 'bg-gradient-to-r from-purple-500/20 via-rose-500/20 to-slate-900 border-rose-400 shadow-md ring-1 ring-rose-400/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-white">5曲マスターコース</div>
                <div className="text-[10px] text-slate-400">
                  持久力とテクニックが試される本格5曲連続ステージ！
                </div>
              </div>
            </div>
            {selectedPreset === '5_songs' && <Check className="w-4 h-4 text-rose-400" />}
          </button>

          {/* Endless Non-stop */}
          <button
            type="button"
            onClick={() => setSelectedPreset('endless')}
            className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
              selectedPreset === 'endless'
                ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-slate-900 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
                <InfinityIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-white">エンドレス継続コース</div>
                <div className="text-[10px] text-slate-400">
                  中断するまで次々と新しい曲へノンストップで突入！
                </div>
              </div>
            </div>
            {selectedPreset === 'endless' && <Check className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Random Surprise */}
          <button
            type="button"
            onClick={() => setSelectedPreset('random')}
            className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
              selectedPreset === 'random'
                ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-slate-900 border-emerald-400 shadow-md ring-1 ring-emerald-400/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                <Shuffle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-white">100曲ランダムシャッフルコース</div>
                <div className="text-[10px] text-slate-400">
                  何が出るかはお楽しみ！完全ランダム選曲で3曲挑戦！
                </div>
              </div>
            </div>
            {selectedPreset === 'random' && <Check className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Genre Focused */}
          <button
            type="button"
            onClick={() => setSelectedPreset('genre')}
            className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
              selectedPreset === 'genre'
                ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-slate-900 border-indigo-400 shadow-md ring-1 ring-indigo-400/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
                <Disc3 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-white">ジャンル特化コース (3曲)</div>
                <div className="text-[10px] text-slate-400">
                  お気に入りの音楽ジャンルから3曲連続セッション！
                </div>
              </div>
            </div>
            {selectedPreset === 'genre' && <Check className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>

        {/* Genre Selection Chips if Genre is selected */}
        {selectedPreset === 'genre' && (
          <div className="mb-4 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
              特化ジャンルを選択：
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SONG_CATEGORIES.filter((c) => c !== 'ALL').map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedGenre(cat as SongCategory)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                    selectedGenre === cat
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Selection */}
        <div className="mb-5">
          <label className="text-xs font-black text-slate-300 block mb-1.5">
            ⭐ コース難易度
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['easy', 'normal', 'hard', 'master'] as Difficulty[]).map((diff) => {
              const active = selectedDifficulty === diff;
              const theme =
                diff === 'easy'
                  ? 'bg-emerald-500 text-white'
                  : diff === 'normal'
                  ? 'bg-cyan-500 text-white'
                  : diff === 'hard'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-rose-500 text-white';

              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`py-2 rounded-xl text-xs font-black uppercase transition-all ${
                    active
                      ? `${theme} shadow-md scale-102 ring-2 ring-white/50`
                      : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleStart}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:opacity-95 active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-pink-500/25 transition-all"
        >
          <Play className="w-4 h-4 fill-current" />
          このコースで連続スタート！ 🚀
        </button>
      </div>
    </div>
  );
};
