import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent leaderboard and user data storage
const DATA_DIR = path.join(process.cwd(), "data");
const SCORES_FILE = path.join(DATA_DIR, "scores.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const ADMIN_FILE = path.join(DATA_DIR, "admin.json");

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
  avatarId: string;
  pin?: string;
  isBlocked?: boolean;
  totalPlays: number;
  totalScore: number;
  starsCount: number;
  personalBests: Record<string, Record<string, UserPersonalBest>>; // songId -> difficulty -> record
  registeredAt: number;
  lastLoginAt: number;
}

export interface AdminConfig {
  adminPin: string;
  lastAccessAt: number;
  allowedHosts: string[];
}

export interface ScoreEntry {
  id: string;
  userId?: string;
  playerName: string;
  avatarId?: string;
  songId: string;
  songTitle: string;
  difficulty: string;
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

// Initial seed leaderboard data for exciting competition
const INITIAL_SEEDS: ScoreEntry[] = [
  {
    id: "seed-1",
    playerName: "🥁ポコ太マスター",
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
    timestamp: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: "seed-2",
    playerName: "ルナちゃん★",
    avatarId: "luna",
    songId: "cyber_thunder",
    songTitle: "Cyber Thunder",
    difficulty: "master",
    score: 98150,
    maxCombo: 192,
    accuracy: 98.1,
    perfectCount: 184,
    greatCount: 8,
    goodCount: 0,
    missCount: 0,
    rank: "S+",
    timestamp: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: "seed-3",
    playerName: "ポン吉ドラマー",
    avatarId: "ponkichi",
    songId: "hyper_galaxy",
    songTitle: "Hyper Beat Galaxy",
    difficulty: "master",
    score: 97500,
    maxCombo: 188,
    accuracy: 97.5,
    perfectCount: 175,
    greatCount: 13,
    goodCount: 0,
    missCount: 0,
    rank: "S+",
    timestamp: Date.now() - 1000 * 60 * 60 * 14,
  },
  {
    id: "seed-4",
    playerName: "パンジー★ビート",
    avatarId: "panzy",
    songId: "midnight_groove",
    songTitle: "Midnight Groove",
    difficulty: "normal",
    score: 96500,
    maxCombo: 98,
    accuracy: 96.5,
    perfectCount: 92,
    greatCount: 6,
    goodCount: 0,
    missCount: 0,
    rank: "S",
    timestamp: Date.now() - 1000 * 60 * 60 * 18,
  },
  {
    id: "seed-5",
    playerName: "ミャウにゃん",
    avatarId: "meow",
    songId: "waltz_3_8",
    songTitle: "Waltz in 3/8",
    difficulty: "hard",
    score: 95420,
    maxCombo: 110,
    accuracy: 95.4,
    perfectCount: 102,
    greatCount: 8,
    goodCount: 0,
    missCount: 0,
    rank: "S",
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: "seed-6",
    playerName: "ピップくん",
    avatarId: "pip",
    songId: "latin_carnival",
    songTitle: "Latin Carnival",
    difficulty: "master",
    score: 94800,
    maxCombo: 135,
    accuracy: 94.8,
    perfectCount: 125,
    greatCount: 10,
    goodCount: 0,
    missCount: 0,
    rank: "S",
    timestamp: Date.now() - 1000 * 60 * 60 * 36,
  },
];

function loadScores(): ScoreEntry[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SCORES_FILE)) {
      fs.writeFileSync(SCORES_FILE, JSON.stringify(INITIAL_SEEDS, null, 2));
      return INITIAL_SEEDS;
    }
    const data = fs.readFileSync(SCORES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to load scores:", err);
    return INITIAL_SEEDS;
  }
}

function saveScores(scores: ScoreEntry[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
  } catch (err) {
    console.error("Failed to save scores:", err);
  }
}

function loadUsers(): UserProfile[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      // Seed an initial user
      const defaultUsers: UserProfile[] = [
        {
          id: "user-taiki",
          nickname: "たいき君",
          avatarId: "pokota",
          pin: "",
          totalPlays: 12,
          totalScore: 980000,
          starsCount: 24,
          personalBests: {
            poko_pop: {
              hard: {
                score: 99420,
                rank: "S+",
                maxCombo: 148,
                accuracy: 99.4,
                timestamp: Date.now() - 1000 * 60 * 60 * 4,
              },
            },
          },
          registeredAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
          lastLoginAt: Date.now(),
        },
      ];
      fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
      return defaultUsers;
    }
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to load users:", err);
    return [];
  }
}

function saveUsers(users: UserProfile[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Failed to save users:", err);
  }
}

function loadAdminConfig(): AdminConfig {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ADMIN_FILE)) {
      const initial: AdminConfig = {
        adminPin: "admin1234",
        lastAccessAt: Date.now(),
        allowedHosts: ["*"],
      };
      fs.writeFileSync(ADMIN_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(ADMIN_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return { adminPin: "admin1234", lastAccessAt: Date.now(), allowedHosts: ["*"] };
  }
}

function saveAdminConfig(cfg: AdminConfig) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(cfg, null, 2));
  } catch (err) {
    console.error("Failed to save admin config:", err);
  }
}

// In-memory cache
let scoreDatabase: ScoreEntry[] = loadScores();
let userDatabase: UserProfile[] = loadUsers();
let adminConfig: AdminConfig = loadAdminConfig();

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    totalRecords: scoreDatabase.length,
    totalUsers: userDatabase.length,
  });
});

// GET /api/users - List all registered user profiles
app.get("/api/users", (req, res) => {
  const publicUsers = userDatabase.map((u) => ({
    id: u.id,
    nickname: u.nickname,
    avatarId: u.avatarId,
    totalPlays: u.totalPlays,
    totalScore: u.totalScore,
    starsCount: u.starsCount,
    hasPin: !!u.pin,
  }));
  res.json({ users: publicUsers });
});

// POST /api/auth/register - Register a new player with required nickname
app.post("/api/auth/register", (req, res) => {
  const { nickname, avatarId, pin } = req.body;

  if (!nickname || typeof nickname !== "string" || !nickname.trim()) {
    res.status(400).json({ error: "ニックネームを入力してください (必須です)" });
    return;
  }

  const cleanNickname = nickname.trim().substring(0, 16);
  const cleanAvatar = avatarId || "pokota";
  const cleanPin = pin ? String(pin).trim().substring(0, 6) : "";

  // Check if nickname already exists
  const existing = userDatabase.find(
    (u) => u.nickname.toLowerCase() === cleanNickname.toLowerCase()
  );

  if (existing) {
    if (existing.isBlocked) {
      res.status(403).json({ error: "このアカウントは管理者によりアクセス停止されています" });
      return;
    }
    // Return existing user if no PIN or if matched
    existing.lastLoginAt = Date.now();
    saveUsers(userDatabase);
    res.json({ success: true, user: existing, isNew: false });
    return;
  }

  const newUser: UserProfile = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    nickname: cleanNickname,
    avatarId: cleanAvatar,
    pin: cleanPin,
    totalPlays: 0,
    totalScore: 0,
    starsCount: 0,
    personalBests: {},
    registeredAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  userDatabase.push(newUser);
  saveUsers(userDatabase);

  res.json({ success: true, user: newUser, isNew: true });
});

// POST /api/auth/login - Login with user ID or nickname
app.post("/api/auth/login", (req, res) => {
  const { userId, nickname, pin } = req.body;

  let user: UserProfile | undefined;
  if (userId) {
    user = userDatabase.find((u) => u.id === userId);
  } else if (nickname) {
    user = userDatabase.find(
      (u) => u.nickname.toLowerCase() === String(nickname).trim().toLowerCase()
    );
  }

  if (!user) {
    res.status(404).json({ error: "プレイヤーが見つかりませんでした" });
    return;
  }

  if (user.isBlocked) {
    res.status(403).json({ error: "このアカウントは管理者によりアクセス停止されています" });
    return;
  }

  if (user.pin && pin && user.pin !== String(pin).trim()) {
    res.status(401).json({ error: "暗証番号(PIN)が一致しません" });
    return;
  }

  user.lastLoginAt = Date.now();
  saveUsers(userDatabase);

  res.json({ success: true, user });
});

// GET /api/user/:id - Fetch user profile and personal bests
app.get("/api/user/:id", (req, res) => {
  const user = userDatabase.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: "プレイヤーが見つかりませんでした" });
    return;
  }
  res.json({ user });
});

// POST /api/user/:id/bests - Update personal best and stats
app.post("/api/user/:id/bests", (req, res) => {
  const user = userDatabase.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: "プレイヤーが見つかりませんでした" });
    return;
  }

  const { songId, difficulty, score, rank, maxCombo, accuracy, earnedStars } = req.body;

  user.totalPlays = (user.totalPlays || 0) + 1;
  user.totalScore = (user.totalScore || 0) + Math.round(score || 0);

  if (earnedStars && typeof earnedStars === "number") {
    user.starsCount = (user.starsCount || 0) + earnedStars;
  }

  if (!user.personalBests) {
    user.personalBests = {};
  }
  if (!user.personalBests[songId]) {
    user.personalBests[songId] = {};
  }

  const currentBest = user.personalBests[songId][difficulty];
  let isNewBest = false;

  if (!currentBest || score > currentBest.score) {
    user.personalBests[songId][difficulty] = {
      score: Math.round(score),
      rank: rank || "C",
      maxCombo: Number(maxCombo) || 0,
      accuracy: Number(accuracy) || 0,
      timestamp: Date.now(),
    };
    isNewBest = true;
  }

  saveUsers(userDatabase);
  res.json({ success: true, user, isNewBest });
});

// GET /api/leaderboard - Top 30 scores with nickname and avatar
app.get("/api/leaderboard", (req, res) => {
  const { songId, difficulty } = req.query;

  let filtered = [...scoreDatabase];

  if (songId && typeof songId === "string" && songId !== "all") {
    filtered = filtered.filter((s) => s.songId === songId);
  }
  if (difficulty && typeof difficulty === "string" && difficulty !== "all") {
    filtered = filtered.filter((s) => s.difficulty === difficulty);
  }

  // Sort descending by score, then accuracy, then timestamp desc
  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return b.timestamp - a.timestamp;
  });

  // Limit to top 30 as requested in requirements
  const top30 = filtered.slice(0, 30);

  res.json({
    total: filtered.length,
    leaderboard: top30,
  });
});

// POST /api/scores - Submit a new play score with required nickname
app.post("/api/scores", (req, res) => {
  const {
    userId,
    playerName,
    avatarId,
    songId,
    songTitle,
    difficulty,
    score,
    maxCombo,
    accuracy,
    perfectCount,
    greatCount,
    goodCount,
    missCount,
    rank,
  } = req.body;

  if (typeof score !== "number" || !songId) {
    res.status(400).json({ error: "Invalid score payload" });
    return;
  }

  const cleanName =
    playerName && typeof playerName === "string" && playerName.trim()
      ? playerName.trim().substring(0, 16)
      : "名無しドラマー";

  const newEntry: ScoreEntry = {
    id: `score-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: userId || undefined,
    playerName: cleanName,
    avatarId: avatarId || "pokota",
    songId: String(songId),
    songTitle: songTitle || "Drum Song",
    difficulty: difficulty || "normal",
    score: Math.round(score),
    maxCombo: Number(maxCombo) || 0,
    accuracy: Number(accuracy) || 0,
    perfectCount: Number(perfectCount) || 0,
    greatCount: Number(greatCount) || 0,
    goodCount: Number(goodCount) || 0,
    missCount: Number(missCount) || 0,
    rank: rank || "C",
    timestamp: Date.now(),
  };

  scoreDatabase.push(newEntry);
  saveScores(scoreDatabase);

  // Compute rank in this category
  const filtered = scoreDatabase
    .filter((s) => s.songId === newEntry.songId && s.difficulty === newEntry.difficulty)
    .sort((a, b) => b.score - a.score);

  const rankPosition = filtered.findIndex((s) => s.id === newEntry.id) + 1;

  res.json({
    success: true,
    entry: newEntry,
    rankPosition,
    totalInLeaderboard: filtered.length,
    isTop30: rankPosition <= 30,
  });
});

// GET /api/stats - High level statistics
app.get("/api/stats", (req, res) => {
  const totalPlays = scoreDatabase.length;
  const highScores = scoreDatabase.reduce((max, s) => Math.max(max, s.score), 0);

  res.json({
    totalPlays,
    highScores,
    totalUsers: userDatabase.length,
    latestPlays: scoreDatabase.slice(-5).reverse(),
  });
});

// === DEVELOPER ACCESS MANAGEMENT & ADMIN API ENDPOINTS ===

// Middleware helper to verify admin pin in header or body
function isAdminAuthorized(req: express.Request): boolean {
  const headerPin = req.headers["x-admin-pin"];
  const bodyPin = req.body?.adminPin;
  const provided = String(headerPin || bodyPin || "").trim();
  return provided === adminConfig.adminPin;
}

// POST /api/admin/verify - Verify Admin PIN
app.post("/api/admin/verify", (req, res) => {
  const { pin } = req.body;
  if (!pin || String(pin).trim() !== adminConfig.adminPin) {
    res.status(401).json({ success: false, error: "管理者PINコードが正しくありません" });
    return;
  }

  adminConfig.lastAccessAt = Date.now();
  saveAdminConfig(adminConfig);

  res.json({
    success: true,
    message: "認証に成功しました",
    token: `adm-token-${Date.now()}`,
  });
});

// POST /api/admin/change-pin - Update Admin PIN
app.post("/api/admin/change-pin", (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ error: "管理者権限が必要です" });
    return;
  }

  const { newPin } = req.body;
  if (!newPin || String(newPin).trim().length < 4) {
    res.status(400).json({ error: "新しいPINは4文字以上で指定してください" });
    return;
  }

  adminConfig.adminPin = String(newPin).trim();
  adminConfig.lastAccessAt = Date.now();
  saveAdminConfig(adminConfig);

  res.json({ success: true, message: "管理者PINを変更しました" });
});

// GET /api/admin/users - Get all users with full control details
app.get("/api/admin/users", (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ error: "管理者権限が必要です" });
    return;
  }

  res.json({
    users: userDatabase,
    total: userDatabase.length,
  });
});

// POST /api/admin/users/:id/toggle-block - Suspend or reactivate a player
app.post("/api/admin/users/:id/toggle-block", (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ error: "管理者権限が必要です" });
    return;
  }

  const user = userDatabase.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: "ユーザーが見つかりません" });
    return;
  }

  user.isBlocked = !user.isBlocked;
  saveUsers(userDatabase);

  res.json({
    success: true,
    user,
    message: user.isBlocked ? "アカウントを一時停止しました" : "アカウントの停止を解除しました",
  });
});

// DELETE /api/admin/users/:id - Delete a user
app.delete("/api/admin/users/:id", (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ error: "管理者権限が必要です" });
    return;
  }

  const idx = userDatabase.findIndex((u) => u.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "ユーザーが見つかりません" });
    return;
  }

  const deleted = userDatabase.splice(idx, 1)[0];
  saveUsers(userDatabase);

  // Also remove scores for this user
  scoreDatabase = scoreDatabase.filter((s) => s.userId !== req.params.id);
  saveScores(scoreDatabase);

  res.json({ success: true, deletedUser: deleted });
});

// POST /api/admin/reset-scores - Reset or clear leaderboard records
app.post("/api/admin/reset-scores", (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ error: "管理者権限が必要です" });
    return;
  }

  const { mode } = req.body; // 'seed' | 'clear'
  if (mode === "clear") {
    scoreDatabase = [];
  } else {
    scoreDatabase = [...INITIAL_SEEDS];
  }
  saveScores(scoreDatabase);

  res.json({
    success: true,
    message: mode === "clear" ? "スコア記録をすべて消去しました" : "スコア記録を初期サンプルに戻しました",
    count: scoreDatabase.length,
  });
});

// GET /api/admin/system-info - High-level system info for admin
app.get("/api/admin/system-info", (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ error: "管理者権限が必要です" });
    return;
  }

  res.json({
    environment: process.env.NODE_ENV || "development",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: Date.now(),
    totalUsers: userDatabase.length,
    activeUsersCount: userDatabase.filter((u) => !u.isBlocked).length,
    blockedUsersCount: userDatabase.filter((u) => u.isBlocked).length,
    totalScores: scoreDatabase.length,
    adminLastAccessAt: adminConfig.lastAccessAt,
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Poko-Poko Beats] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

