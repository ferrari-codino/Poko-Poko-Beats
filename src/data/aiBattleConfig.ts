import { AILevel, AIBattleConfig, JudgmentType, MascotId } from '../types';

export interface AILevelProfile {
  level: AILevel;
  title: string;
  name: string;
  animal: string;
  avatarId: MascotId;
  color: string;
  description: string;
  failureRate: number; // Overall sub-optimal rate (~30% human defeat rate)
  judgmentProbabilities: {
    perfect: number;
    great: number;
    good: number;
    miss: number;
  };
}

export const AI_LEVEL_PROFILES: Record<AILevel, AILevelProfile> = {
  beginner: {
    level: 'beginner',
    title: '入門AI',
    name: 'ひよっこピップ',
    animal: 'ひよこ 🐥',
    avatarId: 'pip',
    color: '#10b981',
    description: 'リズムを覚え始めの可愛い練習相手。テンポが揺れて時々叩き損ねます。',
    failureRate: 0.35,
    judgmentProbabilities: {
      perfect: 0.32,
      great: 0.33,
      good: 0.18,
      miss: 0.17,
    },
  },
  intermediate: {
    level: 'intermediate',
    title: '中級AI',
    name: 'ビート・ポン吉',
    animal: 'タヌキ 🦝',
    avatarId: 'ponkichi',
    color: '#f59e0b',
    description: '基本ビートは安定していますが、速い連打やフィルインで時々ミスをします。',
    failureRate: 0.25,
    judgmentProbabilities: {
      perfect: 0.42,
      great: 0.33,
      good: 0.13,
      miss: 0.12,
    },
  },
  advanced: {
    level: 'advanced',
    title: '上級AI',
    name: 'グルーヴ・ルナ',
    animal: 'オオカミ 🐺',
    avatarId: 'luna',
    color: '#8b5cf6',
    description: 'タイトなドラミングで迫り来る手練れAI。油断すると追い抜かれます！',
    failureRate: 0.18,
    judgmentProbabilities: {
      perfect: 0.50,
      great: 0.32,
      good: 0.10,
      miss: 0.08,
    },
  },
  master: {
    level: 'master',
    title: '達人AI',
    name: 'マスター・ポコ太',
    animal: 'クマ 🐻',
    avatarId: 'pokota',
    color: '#e11d48',
    description: '最高峰のリズムマシン。人間との白熱したスコアデッドヒートを繰り広げます。',
    failureRate: 0.14,
    judgmentProbabilities: {
      perfect: 0.58,
      great: 0.28,
      good: 0.08,
      miss: 0.06,
    },
  },
};

/**
 * Roll an AI judgment based on its configured probabilities.
 */
export const rollAIJudgment = (level: AILevel): JudgmentType => {
  const profile = AI_LEVEL_PROFILES[level] || AI_LEVEL_PROFILES.intermediate;
  const rand = Math.random();
  const probs = profile.judgmentProbabilities;

  if (rand < probs.perfect) return 'PERFECT';
  if (rand < probs.perfect + probs.great) return 'GREAT';
  if (rand < probs.perfect + probs.great + probs.good) return 'GOOD';
  return 'MISS';
};
