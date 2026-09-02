import React, { useState } from 'react';
import { RPGDifficultyTier, RPGProgress, RPGCoach } from '../types';
import { RPG_TIERS, getUnlockedPartsForLevel, getRPGLevelConfig } from '../data/rpgCurriculum';
import { RPG_COACHES } from '../data/rpgCoaches';
import { DRUM_PARTS } from '../data/drumConfig';
import { Trophy, CheckCircle2, ChevronRight, Sparkles, X, BookOpen, ShieldCheck } from 'lucide-react';

interface RPGCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  rpgProgress: RPGProgress;
  onStartLevel: (level: number) => void;
}

export const RPGCourseModal: React.FC<RPGCourseModalProps> = ({
  isOpen,
  onClose,
  rpgProgress,
  onStartLevel,
}) => {
  const [selectedTier, setSelectedTier] = useState<RPGDifficultyTier>(rpgProgress.activeTier || 'beginner');

  if (!isOpen) return null;

  const currentTierInfo = RPG_TIERS[selectedTier];
  const coach: RPGCoach = RPG_COACHES[selectedTier];

  // Calculate starting level for the selected course:
  // Rule: Player starts at the first level of that course (初級: 1, 中級: 21, 上級: 61).
  // If already cleared, starts at the next uncleared level!
  let startingLevel = currentTierInfo.minLevel;
  for (let lvl = currentTierInfo.minLevel; lvl <= currentTierInfo.maxLevel; lvl++) {
    if (!rpgProgress.clearedLevels[lvl]) {
      startingLevel = lvl;
      break;
    }
    // If all levels in tier are cleared, keep at maxLevel
    if (lvl === currentTierInfo.maxLevel) {
      startingLevel = currentTierInfo.maxLevel;
    }
  }

  const startingLevelConfig = getRPGLevelConfig(startingLevel);
  const unlockedParts = getUnlockedPartsForLevel(startingLevel);

  // Count cleared levels in this tier
  let clearedInTier = 0;
  for (let l = currentTierInfo.minLevel; l <= currentTierInfo.maxLevel; l++) {
    if (rpgProgress.clearedLevels[l]) clearedInTier++;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-slate-700 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Background glow */}
        <div
          className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-25"
          style={{ backgroundColor: coach.color }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-lg">
              🥁
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  ドラムRPG育成 ＆ レッスンコース
                </h2>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950">
                  PLAYER Lv.{rpgProgress.currentLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                本物のドラム訓練と同じく、最小限のパーツから段階的に解放！
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 COURSE TABS (初級・中級・上級) */}
        <div className="grid grid-cols-3 gap-2 my-3">
          {(['beginner', 'intermediate', 'advanced'] as RPGDifficultyTier[]).map((tierKey) => {
            const tInfo = RPG_TIERS[tierKey];
            const cCoach = RPG_COACHES[tierKey];
            const isSelected = selectedTier === tierKey;

            return (
              <button
                key={tierKey}
                onClick={() => setSelectedTier(tierKey)}
                className={`flex flex-col items-center p-2 rounded-2xl border transition-all text-center ${
                  isSelected
                    ? 'bg-slate-800/90 shadow-lg scale-102 ring-2'
                    : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/40 opacity-75'
                }`}
                style={{
                  borderColor: isSelected ? cCoach.color : undefined,
                  ringColor: isSelected ? cCoach.color : undefined,
                }}
              >
                <span className="text-2xl mb-1">{cCoach.emoji}</span>
                <span className="text-xs font-black text-white">{tInfo.title.split('（')[0]}</span>
                <span className="text-[9px] font-mono text-slate-400">
                  Lv.{tInfo.minLevel}〜{tInfo.maxLevel}
                </span>
              </button>
            );
          })}
        </div>

        {/* DEDICATED COACH BANNER */}
        <div
          className="p-3.5 rounded-2xl border mb-3 flex items-center gap-3 shadow-inner"
          style={{
            backgroundColor: `${coach.color}15`,
            borderColor: `${coach.color}50`,
          }}
        >
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${coach.avatarBg} border flex items-center justify-center text-3xl shadow flex-shrink-0`}
          >
            {coach.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-black text-sm text-white">{coach.name}</span>
              <span
                className="text-[9px] font-bold px-1.5 py-0.2 rounded"
                style={{ backgroundColor: `${coach.color}30`, color: coach.color }}
              >
                {coach.title}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug italic mb-1">
              "{coach.catchphrase}"
            </p>
            <div className="text-[10px] text-slate-400 flex items-center gap-2">
              <span>愛用楽器: <strong className="text-slate-200">{coach.instrument}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">進捗: {clearedInTier} / {currentTierInfo.maxLevel - currentTierInfo.minLevel + 1} 済</span>
            </div>
          </div>
        </div>

        {/* COURSE DETAILS & NEXT PLAY LEVEL */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 mb-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-300 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              次回の挑戦レッスン:
            </span>
            <span className="text-xs font-black font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              {startingLevelConfig.title}
            </span>
          </div>

          <div className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <div className="font-bold text-white mb-0.5">🎯 レッスン課題:</div>
            <div className="text-slate-300">{startingLevelConfig.focusLesson}</div>
          </div>

          {/* UNLOCKED DRUM PARTS IN THIS LEVEL */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
              <span>🥁 このレベルで使用するドラムパーツ ({unlockedParts.length}箇所):</span>
              <span className="text-[10px] text-amber-400 font-mono">初級は集中訓練のためパーツ限定！</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {unlockedParts.map((pid) => {
                const conf = DRUM_PARTS[pid];
                return (
                  <span
                    key={pid}
                    className="px-2 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 shadow-sm"
                    style={{
                      backgroundColor: `${conf.color}25`,
                      color: conf.color,
                      borderColor: `${conf.color}60`,
                    }}
                  >
                    <span>✓</span> {conf.name}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* START LEVEL BUTTON */}
        <div className="mt-auto pt-2 flex flex-col gap-2">
          <button
            onClick={() => {
              onStartLevel(startingLevel);
              onClose();
            }}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 active:scale-98 text-slate-950 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 text-base transition"
          >
            <Sparkles className="w-5 h-5 fill-current" />
            <span>{currentTierInfo.title.split('（')[0]}（Lv.{startingLevel}）をスタート！</span>
            <ChevronRight className="w-5 h-5" />
          </button>

          <p className="text-center text-[10px] text-slate-400">
            ※クリアするとプレイヤーレベルがクリアしたレベルに昇格し、次のレベルとパーツが解放されます！
          </p>
        </div>
      </div>
    </div>
  );
};
