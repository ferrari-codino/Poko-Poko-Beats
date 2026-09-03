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
  type?: string;
  time: number; // time in seconds from song start
  beat?: number; // exact beat number (e.g. 1.0, 1.5, 2.0)
  hit?: boolean;
  missed?: boolean;
  judgment?: JudgmentType;
  hitTimeDiff?: number; // ms early (-) or late (+)
}

export type JudgmentType = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

export type AmbiencePreset = 'dead' | 'vintage' | 'arena';
export type GrooveTimingType = 'JUST' | 'RUSH' | 'LAYBACK' | 'just' | 'rush' | 'layback';

export interface JudgmentFeedback {
  id: string;
  type: JudgmentType;
  offsetMs?: number; // ms
  grooveType?: GrooveTimingType;
  part: DrumPartId;
  x?: number;
  y?: number;
  combo: number;
  exclamation?: string; // e.g. "COOL! ✨", "AWESOME! 🔥", "PERFECT! 🌟", "FANTASTIC! 💫"
  subText?: string;
  isFever?: boolean;
}

export type SynthTheme =
  | 'pop'
  | 'funk'
  | 'waltz'
  | 'cyber'
  | 'latin'
  | 'prog'
  | 'galaxy'
  | 'march'
  | 'rock'
  | 'jazz'
  | 'edm'
  | 'retro'
  | 'ballad'
  | 'metal'
  | 'traditional'
  | 'fusion';

export type SongCategory =
  | 'J-POP'
  | 'アニメ・ゲーム'
  | 'EDM・クラブ'
  | 'ロック'
  | 'ジャズ・ファンク'
  | 'クラシック・変拍子'
  | '和風・伝統'
  | 'ワールド・キッズ';

export interface SongData {
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  category?: SongCategory;
  bpm: number;
  timeSignature: string; // e.g. "4/4", "3/8", "6/8", "7/8", "5/8", "11/8"
  duration: number; // in seconds (30s to 60s)
  colorTheme: string;
  previewColor: string;
  description: string;
  hasRhythmShift?: boolean; // dynamic tempo / meter changes
  synthTheme: SynthTheme;
  difficulties: {
    [key in Difficulty]: {
      notes: Omit<RhythmNote, 'id'>[];
      starRating: number;
      noteCount: number;
    };
  };
}

export interface CourseState {
  isActive: boolean;
  courseTitle: string;
  mode: '3_songs' | '5_songs' | 'endless';
  totalSongs: number; // 3, 5, or Infinity
  currentIndex: number; // 1-based (e.g. 1 / 3)
  difficulty: Difficulty;
  songsQueue: SongData[];
  accumulatedScore: number;
  maxCombo: number;
  totalPerfect: number;
  totalGreat: number;
  totalGood: number;
  totalMiss: number;
  history: {
    song: SongData;
    score: ScoreState;
  }[];
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
  grooveStats?: {
    avgOffsetMs: number;
    rushCount: number;
    justCount: number;
    laybackCount: number;
    recentOffsets: number[];
  };
}

export type RPGDifficultyTier = 'beginner' | 'intermediate' | 'advanced';

export interface RPGLevelConfig {
  level: number; // 1 to 100
  tier: RPGDifficultyTier;
  title: string;
  focusLesson: string;
  unlockedParts: DrumPartId[];
  targetSongId: string;
  difficulty: Difficulty;
  clearMinScore: number;
  bpm: number; // Level-specific BPM (Level 1: 60 BPM, progressively increasing)
  previewSeconds: number; // Light approach countdown window (Level 1: 1.5s, progressively tightening)
  coachAdvice: {
    praise: string;
    technicalTip: string;
  };
}

export interface RPGProgress {
  currentLevel: number; // 1 to 100 (player's current standing)
  highestClearedLevel: number;
  clearedLevels: Record<number, { score: number; rank: string; accuracy: number; timestamp: number }>;
  activeTier: RPGDifficultyTier;
}

export interface RPGCoach {
  id: string;
  tier: RPGDifficultyTier;
  name: string;
  title: string;
  animal: string;
  emoji: string;
  avatarBg: string;
  color: string;
  instrument: string;
  catchphrase: string;
  cheerQuotes: {
    start: string[];
    onBeat: string[];
    combo: string[];
    fever: string[];
    miss: string[];
    finish: string[];
  };
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
  rpgProgress?: RPGProgress;
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
  ambiencePreset?: AmbiencePreset;
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

