export type DrumPartId =
  | 'kick'
  | 'snare'
  | 'hihatClosed'
  | 'hihatOpen'
  | 'tomHigh'
  | 'tomLow'
  | 'tomFloor'
  | 'crash'
  | 'ride';

export interface DrumPartConfig {
  id: DrumPartId;
  name: string;
  shortName: string;
  keyLabel: string; // for keyboard fallback
  color: string;
  glowColor: string;
  borderColor: string;
  bgActiveColor: string;
  description: string;
  size: 'small' | 'medium' | 'large' | 'xlarge';
}

export type Difficulty = 'easy' | 'normal' | 'hard' | 'master';

export type MascotId = 'pokota' | 'luna' | 'ponkichi' | 'panzy' | 'meow' | 'pip';

export interface MascotConfig {
  id: MascotId;
  name: string;
  characterTitle: string;
  animal: string;
  emoji: string;
  avatarBg: string;
  themeColor: string;
  description: string;
  cheerQuotes: {
    idle: string[];
    good: string[];
    combo: string[];
    fever: string[];
    miss: string[];
    clear: string[];
  };
}

export type DrumLayoutType = 'standard' | 'leftHanded' | 'compact' | 'wide';
export type PadScale = 'normal' | 'large' | 'huge';

export interface RhythmNote {
  id: string;
  part: DrumPartId;
  time: number; // time in seconds from song start
  beat: number; // exact beat number (e.g. 1.0, 1.5, 2.0)
  hit?: boolean;
  missed?: boolean;
  judgment?: JudgmentType;
  hitTimeDiff?: number; // ms early (-) or late (+)
}

export type JudgmentType = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

export interface JudgmentFeedback {
  id: string;
  type: JudgmentType;
  offsetMs?: number; // ms
  part: DrumPartId;
  x?: number;
  y?: number;
  combo: number;
  exclamation?: string; // e.g. "COOL! ✨", "AWESOME! 🔥", "PERFECT! 🌟", "FANTASTIC! 💫"
  subText?: string;
  isFever?: boolean;
}

export interface SongData {
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  bpm: number;
  timeSignature: string; // e.g. "4/4", "3/8", "6/8", "7/8", "5/8", "11/8"
  duration: number; // in seconds (30s to 60s)
  colorTheme: string;
  previewColor: string;
  description: string;
  hasRhythmShift?: boolean; // dynamic tempo / meter changes
  synthTheme: 'pop' | 'funk' | 'waltz' | 'cyber' | 'latin' | 'prog' | 'galaxy' | 'march';
  difficulties: {
    [key in Difficulty]: {
      notes: Omit<RhythmNote, 'id'>[];
      starRating: number;
      noteCount: number;
    };
  };
}

export interface ScoreState {
  score: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
  totalNotes: number;
  accuracy: number;
  grooveGauge: number; // 0 to 100
  isFever: boolean;
}

export interface UserPersonalBest {
  score: number;
  rank: string;
  maxCombo: number;
  accuracy: number;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatarId: MascotId;
  pin?: string;
  isBlocked?: boolean;
  totalPlays: number;
  totalScore: number;
  starsCount: number;
  personalBests: Record<string, Record<string, UserPersonalBest>>; // songId -> difficulty -> record
  registeredAt: number;
  lastLoginAt: number;
}

export interface LeaderboardEntry {
  id: string;
  userId?: string;
  playerName: string;
  avatarId?: MascotId;
  songId: string;
  songTitle: string;
  difficulty: Difficulty;
  score: number;
  maxCombo: number;
  accuracy: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  rank: string;
  timestamp: number;
}

export interface PlayerSettings {
  audioOffsetMs: number; // latency calibration (-100 to 100ms)
  masterVolume: number; // 0 to 1
  drumVolume: number; // 0 to 1
  musicVolume: number; // 0 to 1
  guideClickVolume: number; // 0 to 1
  showKeyHints: boolean;
  hapticsEnabled: boolean;
  approachSpeed: number; // speed of visual glow/ring approach (0.3s to 1.0s)
  playerName: string;
  avatarId: MascotId;
  currentUserId?: string;
  drumLayout: DrumLayoutType;
  padScale: PadScale;
}

export type GameScreen =
  | 'menu'
  | 'select'
  | 'game'
  | 'result'
  | 'leaderboard'
  | 'freeplay'
  | 'calibration'
  | 'mypage'
  | 'ideas'
  | 'admin';

