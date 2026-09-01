import { UserProfile, LeaderboardEntry } from '../types';

const INITIAL_FALLBACK_SCORES: LeaderboardEntry[] = [
  {
    id: "seed_1",
    playerName: "🥁 ポコ田 達人",
    avatarId: "pokota",
    songId: "poko_pop",
    songTitle: "Poko-Poko Pop!",
    difficulty: "hard",
    score: 99420,
    maxCombo: 148,
    accuracy: 99.4,
    perfectCount: 145,
    greatCount: 3,
    goodCount: 0,
    missCount: 0,
    rank: "S+",
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: "seed_2",
    playerName: "⚡ サイバー・ビート",
    avatarId: "meow",
    songId: "cyber_thunder",
    difficulty: "master",
    songTitle: "Cyber Thunder",
    score: 98150,
    maxCombo: 192,
    accuracy: 98.1,
    perfectCount: 184,
    greatCount: 8,
    goodCount: 0,
    missCount: 0,
    rank: "S+",
    timestamp: Date.now() - 3600000 * 5,
  },
  {
    id: "seed_3",
    playerName: "🌟 リズム星人",
    avatarId: "luna",
    songId: "hyper_galaxy",
    difficulty: "master",
    songTitle: "Hyper Beat Galaxy",
    score: 97500,
    maxCombo: 188,
    accuracy: 97.5,
    perfectCount: 175,
    greatCount: 12,
    goodCount: 1,
    missCount: 0,
    rank: "S+",
    timestamp: Date.now() - 3600000 * 12,
  },
  {
    id: "seed_4",
    playerName: "🌙 ミッドナイト",
    avatarId: "ponkichi",
    songId: "midnight_groove",
    difficulty: "normal",
    songTitle: "Midnight Groove",
    score: 96500,
    maxCombo: 98,
    accuracy: 96.5,
    perfectCount: 92,
    greatCount: 6,
    goodCount: 0,
    missCount: 0,
    rank: "S",
    timestamp: Date.now() - 3600000 * 24,
  },
  {
    id: "seed_5",
    playerName: "💃 サンバの風",
    avatarId: "panzy",
    songId: "latin_carnival",
    difficulty: "master",
    songTitle: "Latin Carnival",
    score: 94800,
    maxCombo: 135,
    accuracy: 94.8,
    perfectCount: 125,
    greatCount: 10,
    goodCount: 0,
    missCount: 0,
    rank: "S",
    timestamp: Date.now() - 3600000 * 48,
  }
];

export const getLocalScores = (songId?: string, difficulty?: string): LeaderboardEntry[] => {
  try {
    const raw = localStorage.getItem('pokopoko_local_scores');
    let scores: LeaderboardEntry[] = raw ? JSON.parse(raw) : INITIAL_FALLBACK_SCORES;
    if (songId && songId !== 'all') {
      scores = scores.filter(s => s.songId === songId);
    }
    if (difficulty && difficulty !== 'all') {
      scores = scores.filter(s => s.difficulty === difficulty);
    }
    return scores.sort((a, b) => b.score - a.score);
  } catch {
    return INITIAL_FALLBACK_SCORES;
  }
};

export const saveLocalScore = (entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>): { rankPosition: number; isTop30: boolean } => {
  try {
    const raw = localStorage.getItem('pokopoko_local_scores');
    const scores: LeaderboardEntry[] = raw ? JSON.parse(raw) : [...INITIAL_FALLBACK_SCORES];
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
    };
    scores.push(newEntry);
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('pokopoko_local_scores', JSON.stringify(scores.slice(0, 100)));

    const matching = scores.filter(s => s.songId === entry.songId && s.difficulty === entry.difficulty);
    const rankPos = matching.findIndex(s => s.id === newEntry.id) + 1;
    return {
      rankPosition: rankPos > 0 ? rankPos : 1,
      isTop30: rankPos > 0 && rankPos <= 30,
    };
  } catch {
    return { rankPosition: 1, isTop30: true };
  }
};

export const getLocalUsers = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem('pokopoko_local_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalUser = (user: UserProfile): void => {
  try {
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem('pokopoko_local_users', JSON.stringify(users));
  } catch {
    // ignore
  }
};
