import React, { useState } from 'react';
import { UserProfile, Difficulty, SongData } from '../types';
import { MASCOTS } from '../data/mascots';
import { SONGS } from '../data/songs';
import { Search } from 'lucide-react';

interface MyPageScreenProps {
  user: UserProfile;
  onBackToMenu: () => void;
  onOpenSwitchUser: () => void;
  onSelectSongToPlay: (song: SongData, difficulty: Difficulty) => void;
}

export const MyPageScreen: React.FC<MyPageScreenProps> = ({
  user,
  onBackToMenu,
  onOpenSwitchUser,
  onSelectSongToPlay,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlayedOnly, setFilterPlayedOnly] = useState(false);

  const mascot = MASCOTS[user.avatarId] || MASCOTS.pokota;

  // Calculate total cleared difficulties and best ranks
  let totalClears = 0;
  let sPlusCount = 0;
  if (user.personalBests) {
    Object.values(user.personalBests).forEach((songDiffs) => {
      Object.values(songDiffs).forEach((best) => {
        totalClears++;
        if (best.rank === 'S+') sPlusCount++;
      });
    });
  }

  // Calculate Drummer Grade based on total score and clears
  let drummerGrade = '見習いドラマー 🥁';
  let gradeBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  if (sPlusCount >= 5 || (user.totalScore > 5000000)) {
    drummerGrade = '伝説のドラム神 👑';
    gradeBadgeColor = 'bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-950 font-black border-yellow-300';
  } else if (totalClears >= 10 || (user.totalScore > 2000000)) {
    drummerGrade = 'マスタードラマー 🔥';
    gradeBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  } else if (totalClears >= 4 || (user.totalScore > 500000)) {
    drummerGrade = '一人前ドラマー 🌟';
    gradeBadgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full p-3 sm:p-5 overflow-y-auto animate-fade-in">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-bold hover:text-white hover:bg-slate-700 transition-all"
        >
          ← メインメニューへ
        </button>

        <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
          <span>🏠</span> マイページ & 自己ベスト
        </h1>

        <button
          type="button"
          onClick={onOpenSwitchUser}
          className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-bold hover:bg-pink-500 hover:text-white transition-all shadow"
        >
          👥 プレイヤー切替
        </button>
      </div>

      {/* User Profile Card */}
      <div className="relative rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-indigo-900/90 via-slate-900 to-purple-950/90 border-2 border-indigo-500/30 shadow-xl overflow-hidden mb-6">
        {/* Background ambient accents */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className={`w-20 h-20 rounded-full ${mascot.avatarBg} border-4 border-white shadow-xl flex items-center justify-center text-4xl animate-pulse-slow`}>
              {mascot.emoji}
            </div>
            <div className="absolute -bottom-1.5 inset-x-0 flex justify-center">
              <span className="bg-slate-950 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-400/40 shadow">
                相棒: {mascot.name}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {user.nickname}
              </h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${gradeBadgeColor}`}>
                {drummerGrade}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium mb-3">
              {mascot.description}
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-950/60 rounded-2xl p-2 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-bold">プレイ回数</div>
                <div className="text-base sm:text-lg font-black text-amber-400">
                  {user.totalPlays || 0} <span className="text-[10px] font-normal text-slate-400">回</span>
                </div>
              </div>
              <div className="bg-slate-950/60 rounded-2xl p-2 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-bold">累計スコア</div>
                <div className="text-base sm:text-lg font-black text-cyan-400">
                  {((user.totalScore || 0) / 10000).toFixed(1)} <span className="text-[10px] font-normal text-slate-400">万点</span>
                </div>
              </div>
              <div className="bg-slate-950/60 rounded-2xl p-2 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-bold">S+ ランク数</div>
                <div className="text-base sm:text-lg font-black text-pink-400">
                  {sPlusCount} <span className="text-[10px] font-normal text-slate-400">曲</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Bests by Song */}
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
          <span>🏆</span> 楽曲別 自己ベスト記録
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">
          タップしてすぐに遊べるよ！
        </span>
      </div>

      {/* Filter and Search Bar for MyPage */}
      <div className="mb-3 space-y-1.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="記録を検索 (曲名・ジャンル...)"
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilterPlayedOnly(!filterPlayedOnly)}
            className={`px-2.5 py-1 rounded-lg font-bold border transition ${
              filterPlayedOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {filterPlayedOnly ? '✓ プレイ済み曲のみ表示' : '全100曲を表示中'}
          </button>
        </div>
      </div>

      <div className="space-y-3 pb-8">
        {SONGS.filter((song) => {
          const songBests = user.personalBests?.[song.id];
          const hasPlayed = songBests && Object.keys(songBests).length > 0;
          if (filterPlayedOnly && !hasPlayed) return false;
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (
              song.title.toLowerCase().includes(q) ||
              song.subtitle.toLowerCase().includes(q) ||
              (song.category && song.category.toLowerCase().includes(q))
            );
          }
          return true;
        }).map((song) => {
          const songBests = user.personalBests?.[song.id] || {};
          const difficulties: Difficulty[] = ['easy', 'normal', 'hard', 'master'];

          return (
            <div
              key={song.id}
              className="bg-slate-900/90 rounded-3xl p-3 sm:p-4 border border-slate-800 shadow-md hover:border-slate-700 transition-all"
            >
              {/* Song Header */}
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full shadow"
                    style={{ backgroundColor: song.previewColor }}
                  />
                  <div>
                    <div className="text-sm font-black text-white">{song.title}</div>
                    <div className="text-[10px] text-slate-400">
                      BPM {song.bpm} • {song.timeSignature}拍子 • {song.duration}秒
                    </div>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {song.genre}
                </span>
              </div>

              {/* Difficulty Badges & Records */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {difficulties.map((diff) => {
                  const record = songBests[diff];
                  const diffColor =
                    diff === 'easy'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : diff === 'normal'
                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                      : diff === 'hard'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-400';

                  const diffLabel =
                    diff === 'easy'
                      ? 'EASY'
                      : diff === 'normal'
                      ? 'NORMAL'
                      : diff === 'hard'
                      ? 'HARD'
                      : 'MASTER';

                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => onSelectSongToPlay(song, diff)}
                      className={`flex flex-col items-center justify-between p-2 rounded-2xl border transition-all text-center hover:scale-102 active:scale-98 ${
                        record
                          ? `${diffColor} hover:brightness-110 shadow-sm`
                          : 'border-slate-800 bg-slate-950/40 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full text-[10px] font-black uppercase mb-1">
                        <span>{diffLabel}</span>
                        {record && (
                          <span className="px-1.5 py-0.2 rounded-md bg-slate-900 text-yellow-300 font-bold">
                            {record.rank}
                          </span>
                        )}
                      </div>

                      {record ? (
                        <div className="w-full">
                          <div className="text-xs font-black text-white">
                            {record.score.toLocaleString()}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            コンボ {record.maxCombo} • {record.accuracy.toFixed(1)}%
                          </div>
                        </div>
                      ) : (
                        <div className="py-2 text-[10px] text-slate-500 font-medium">
                          未プレイ ▷
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
