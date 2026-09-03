import React, { useState, useEffect } from 'react';
import {
  GameScreen as GameScreenType,
  SongData,
  Difficulty,
  ScoreState,
  RhythmNote,
  PlayerSettings,
  UserProfile,
  CourseState,
  DeviceMode,
  CustomDrumKit,
  RPGProgress,
} from './types';
import { SONGS } from './data/songs';
import { SongSelectScreen } from './components/SongSelectScreen';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { FreePlayScreen } from './components/FreePlayScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { IdeasScreen } from './components/IdeasScreen';
import { MyPageScreen } from './components/MyPageScreen';
import { AuthModal } from './components/AuthModal';
import { GitHubModal } from './components/GitHubModal';
import { CourseSelectModal } from './components/CourseSelectModal';
import { RPGCourseModal } from './components/RPGCourseModal';
import { ShowcaseModal } from './components/ShowcaseModal';
import { FeaturesPresentationModal } from './components/FeaturesPresentationModal';
import { MyDrumKitModal } from './components/MyDrumKitModal';
import { AdminLockScreen } from './components/AdminLockScreen';
import { AdminPanelScreen } from './components/AdminPanelScreen';
import { DeviceGateScreen } from './components/DeviceGateScreen';
import { drumSynth } from './audio/drumSynth';
import { getLocalUsers } from './utils/storageFallback';
import { loadRPGProgress, getRPGLevelConfig } from './data/rpgCurriculum';
import { detectInitialDeviceMode, savePreferredDeviceMode } from './utils/deviceDetector';
import { loadCustomKits, saveCustomKits } from './data/customDrumKits';
import { Smartphone, Tablet, Sliders, Swords, Sparkles } from 'lucide-react';

const DEV_APP_URL = 'https://ais-dev-52fgspwlg7gwz63oc3ec7m-668070792322.asia-east1.run.app';
const SHARED_APP_URL = 'https://ais-pre-52fgspwlg7gwz63oc3ec7m-668070792322.asia-east1.run.app';

const DEFAULT_SETTINGS: PlayerSettings = {
  audioOffsetMs: 0,
  masterVolume: 0.9,
  drumVolume: 0.95,
  musicVolume: 0.8,
  guideClickVolume: 0.4,
  showKeyHints: true,
  hapticsEnabled: true,
  approachSpeed: 0.45,
  playerName: 'ドラマー',
  drumLayout: 'standard',
  padScale: 'normal',
  avatarId: 'pokota',
};

export default function App() {
  const [screen, setScreen] = useState<GameScreenType>('select');
  const [selectedSong, setSelectedSong] = useState<SongData>(SONGS[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
  const [lastScoreState, setLastScoreState] = useState<ScoreState | null>(null);
  const [lastPlayedNotes, setLastPlayedNotes] = useState<RhythmNote[]>([]);

  // User Authentication & Profile
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState<boolean>(false);
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState<boolean>(false);
  const [courseState, setCourseState] = useState<CourseState | null>(null);
  const [existingUsers, setExistingUsers] = useState<any[]>([]);

  // RPG Curriculum & Level Progression
  const [isRPGModalOpen, setIsRPGModalOpen] = useState<boolean>(false);
  const [activeRPGLevel, setActiveRPGLevel] = useState<number | null>(null);
  const [rpgProgress, setRpgProgress] = useState<RPGProgress>(() => loadRPGProgress());

  // Developer Environment & Admin Gate
  const isDevEnvironment =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('ais-dev') ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.port === '3000');

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('pokopoko_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [adminPin, setAdminPin] = useState<string>(() => {
    try {
      return sessionStorage.getItem('pokopoko_admin_pin') || 'admin1234';
    } catch {
      return 'admin1234';
    }
  });

  // Mobile / Tablet device restriction detection
  const [isBypassDeviceGate, setIsBypassDeviceGate] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('pokopoko_bypass_device_gate') === 'true';
    } catch {
      return false;
    }
  });

  const [isMobileOrTablet, setIsMobileOrTablet] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
    const isIPadOS = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileScreen = window.innerWidth <= 1024;
    return isMobileUA || isIPadOS || (hasTouch && isMobileScreen);
  });

  // Device Mode: 'smartphone' vs 'tablet' (自動判定 ＆ 手動切り替え)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => detectInitialDeviceMode());

  // Tablet-specific Feature 1: My Drum Kits (5 slots, nicknames, materials, colors)
  const [customKits, setCustomKits] = useState<CustomDrumKit[]>(() => loadCustomKits());
  const [activeKitId, setActiveKitId] = useState<string>(() => {
    const kits = loadCustomKits();
    const defaultKit = kits.find((k) => k.isDefault);
    return defaultKit ? defaultKit.id : kits[0]?.id || 'kit-slot-1';
  });
  const [isMyDrumKitModalOpen, setIsMyDrumKitModalOpen] = useState<boolean>(false);

  // Tablet-specific Feature 2: AI Battle Mode (ON/OFF)
  const [aiBattleEnabled, setAiBattleEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('pokopoko_ai_battle_enabled');
      if (saved !== null) return saved === 'true';
    } catch {}
    // Default to true when in tablet mode, false in smartphone mode
    return detectInitialDeviceMode() === 'tablet';
  });

  // Spectacular Features Presentation Modal
  const [isFeaturesPresentationOpen, setIsFeaturesPresentationOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent || '';
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
      const isIPadOS = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileScreen = window.innerWidth <= 1024;
      setIsMobileOrTablet(isMobileUA || isIPadOS || (hasTouch && isMobileScreen));

      // Auto-detect smartphone vs tablet mode on resize/orientation change if no manual override
      try {
        const manualOverride = localStorage.getItem('pokopoko_preferred_device_mode');
        if (!manualOverride) {
          const autoMode = detectInitialDeviceMode();
          setDeviceMode(autoMode);
        }
      } catch {}
    };

    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  const toggleDeviceMode = (mode?: DeviceMode) => {
    const newMode = mode || (deviceMode === 'smartphone' ? 'tablet' : 'smartphone');
    setDeviceMode(newMode);
    savePreferredDeviceMode(newMode);
    if (newMode === 'tablet' && !aiBattleEnabled) {
      setAiBattleEnabled(true);
    }
  };

  // Load user settings from localStorage if available
  const [settings, setSettings] = useState<PlayerSettings>(() => {
    try {
      const saved = localStorage.getItem('pokopoko_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  // Fetch or restore current user on mount
  useEffect(() => {
    const initUser = async () => {
      try {
        const savedUserId = localStorage.getItem('pokopoko_user_id');
        if (savedUserId) {
          try {
            const res = await fetch(`/api/user/${savedUserId}`);
            if (res.ok) {
              const data = await res.json();
              if (data.user) {
                setCurrentUser(data.user);
                setSettings((s) => ({
                  ...s,
                  playerName: data.user.nickname,
                  avatarId: data.user.avatarId || s.avatarId,
                  currentUserId: data.user.id,
                }));
                return;
              }
            }
          } catch {
            // ignore network error
          }

          // Fallback to local storage for user profile
          const localUsers = getLocalUsers();
          const localUser = localUsers.find(u => u.id === savedUserId);
          if (localUser) {
            setCurrentUser(localUser);
            setSettings((s) => ({
              ...s,
              playerName: localUser.nickname,
              avatarId: localUser.avatarId || s.avatarId,
              currentUserId: localUser.id,
            }));
            return;
          }
        }

        // Check if any users exist
        try {
          const usersRes = await fetch('/api/users');
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            if (usersData.users && usersData.users.length > 0) {
              setExistingUsers(usersData.users);
              return;
            }
          }
        } catch {
          // ignore network error
        }

        const localUsers = getLocalUsers();
        if (localUsers.length > 0) {
          setExistingUsers(localUsers);
        }
      } catch (err) {
        console.error('Failed to restore user:', err);
      }
    };

    initUser();
  }, []);

  const updateSettings = (newSettings: PlayerSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('pokopoko_settings', JSON.stringify(newSettings));
    } catch {}
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    try {
      localStorage.setItem('pokopoko_user_id', user.id);
    } catch {}

    const updated = {
      ...settings,
      playerName: user.nickname,
      avatarId: user.avatarId || 'pokota',
      currentUserId: user.id,
    };
    setSettings(updated);
    try {
      localStorage.setItem('pokopoko_settings', JSON.stringify(updated));
    } catch {}
  };

  // Pre-initialize and resume Web Audio AudioContext on any user interaction
  useEffect(() => {
    const unlockAudio = () => {
      drumSynth.init();
      const ctx = drumSynth.getContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    };

    const eventTypes = ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown', 'click'];
    eventTypes.forEach((ev) => {
      window.addEventListener(ev, unlockAudio, { passive: true });
    });

    return () => {
      eventTypes.forEach((ev) => {
        window.removeEventListener(ev, unlockAudio);
      });
    };
  }, []);

  const handleStartGame = () => {
    setActiveRPGLevel(null);
    setCourseState(null);
    drumSynth.init();
    setScreen('game');
  };

  const handleStartCourse = (newCourse: CourseState) => {
    setActiveRPGLevel(null);
    setCourseState(newCourse);
    setIsCourseModalOpen(false);
    if (newCourse.songsQueue.length > 0) {
      setSelectedSong(newCourse.songsQueue[0]);
    }
    setSelectedDifficulty(newCourse.difficulty);
    drumSynth.init();
    setScreen('game');
  };

  const handleStartRPGLevel = (level: number) => {
    const config = getRPGLevelConfig(level);
    const targetSong = SONGS.find((s) => s.id === config.targetSongId) || SONGS[0];
    setSelectedSong(targetSong);
    setSelectedDifficulty(config.difficulty);
    setActiveRPGLevel(level);
    setCourseState(null);
    setIsRPGModalOpen(false);
    drumSynth.init();
    setScreen('game');
  };

  const handleNextCourseSong = () => {
    if (!courseState) return;
    const nextIndex = courseState.currentIndex + 1;
    let nextSong: SongData;

    if (nextIndex <= courseState.songsQueue.length) {
      nextSong = courseState.songsQueue[nextIndex - 1];
    } else {
      nextSong = SONGS[Math.floor(Math.random() * SONGS.length)];
    }

    setCourseState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentIndex: nextIndex,
      };
    });

    setSelectedSong(nextSong);
    setSelectedDifficulty(courseState.difficulty);
    drumSynth.init();
    setScreen('game');
  };

  const handleExitCourse = () => {
    setCourseState(null);
    setScreen('select');
  };

  const handleFinishGame = (finalScore: ScoreState, notes: RhythmNote[]) => {
    if (courseState && courseState.isActive) {
      setCourseState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          accumulatedScore: prev.accumulatedScore + finalScore.score,
          maxCombo: Math.max(prev.maxCombo, finalScore.maxCombo),
          totalPerfect: prev.totalPerfect + finalScore.perfect,
          totalGreat: prev.totalGreat + finalScore.great,
          totalGood: prev.totalGood + finalScore.good,
          totalMiss: prev.totalMiss + finalScore.miss,
          history: [...prev.history, { song: selectedSong, score: finalScore }],
        };
      });
    }
    setLastScoreState(finalScore);
    setLastPlayedNotes(notes);
    setScreen('result');
  };

  const activeKit = customKits.find((k) => k.id === activeKitId) || customKits[0];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 text-slate-100 flex flex-col items-center justify-center p-0 sm:p-2 overflow-hidden font-sans">
      {/* Cute Floating Decorative Background Dots */}
      <div className="fixed top-12 left-12 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-12 right-12 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP FLOATING DEVICE MODE & TABLET FUNCTION BAR (端末最適化 ＆ タブレット専用機能バー) */}
      <div className="w-full max-w-6xl px-2 py-1 flex items-center justify-between z-30 text-xs">
        {/* Device Mode Detection & Toggle Pill */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleDeviceMode()}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border transition-all shadow-md active:scale-95 ${
              deviceMode === 'tablet'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-400/50 shadow-cyan-500/20'
                : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-400/50 shadow-emerald-500/20'
            }`}
            title="クリックでスマホモード/タブレットモードを手動切り替え"
          >
            {deviceMode === 'tablet' ? (
              <>
                <Tablet className="w-3.5 h-3.5 text-cyan-400" />
                <span>タブレットモード</span>
                <span className="text-[9px] px-1 rounded bg-cyan-400/20 text-cyan-200">画面最大化</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>スマホモード</span>
                <span className="text-[9px] px-1 rounded bg-emerald-400/20 text-emerald-200">片手最適化</span>
              </>
            )}
          </button>

          {/* Quick Toggle switch button */}
          <button
            type="button"
            onClick={() => toggleDeviceMode()}
            className="text-[10px] text-slate-400 hover:text-slate-200 underline decoration-slate-600 transition"
          >
            切替
          </button>
        </div>

        {/* Action Controls: Presentation Button & Tablet Exclusive Quick Actions */}
        <div className="flex items-center gap-1.5">
          {/* Spectacular Features Presentation Button (派手な演出の機能紹介ボタン) */}
          <button
            id="header-features-presentation-btn"
            type="button"
            onClick={() => setIsFeaturesPresentationOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 hover:opacity-90 active:scale-95 text-slate-950 text-[11px] font-black shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-white/60 transition"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current animate-spin" style={{ animationDuration: '3s' }} />
            <span>神機能プレゼン</span>
          </button>

          {/* Tablet Exclusive: My Drum Kit Customization Button */}
          {deviceMode === 'tablet' && (
            <button
              id="open-my-drum-kit-btn"
              type="button"
              onClick={() => setIsMyDrumKitModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-400/50 text-[11px] font-black shadow-sm transition active:scale-95"
              title="タブレット専用: マイドラムセットの素材・色・ニックネーム設定（5台保存）"
            >
              <Sliders className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline">マイドラムセット</span>
              <span className="text-[9px] px-1 rounded bg-pink-400/20 text-pink-200">5スロット</span>
            </button>
          )}

          {/* Tablet Exclusive: AI Battle Mode Toggle */}
          {deviceMode === 'tablet' && (
            <button
              id="toggle-ai-battle-btn"
              type="button"
              onClick={() => {
                const next = !aiBattleEnabled;
                setAiBattleEnabled(next);
                try {
                  localStorage.setItem('pokopoko_ai_battle_enabled', String(next));
                } catch {}
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border transition active:scale-95 ${
                aiBattleEnabled
                  ? 'bg-purple-500/30 text-purple-200 border-purple-400/60 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700'
              }`}
              title="タブレット専用: AI対戦モード切替"
            >
              <Swords className={`w-3.5 h-3.5 ${aiBattleEnabled ? 'text-purple-300 animate-pulse' : 'text-slate-500'}`} />
              <span>AI対戦</span>
              <span className={`text-[9px] px-1 rounded ${aiBattleEnabled ? 'bg-purple-400 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>
                {aiBattleEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Screen-Optimized Responsive Container Framing (無駄な余白を発生させない最適化) */}
      <main
        className={`w-full ${
          deviceMode === 'smartphone'
            ? 'max-w-xl h-screen sm:h-[95vh] sm:max-h-[880px]'
            : 'max-w-6xl h-screen sm:h-[96vh] sm:max-h-[940px]'
        } bg-slate-950/95 sm:rounded-[36px] sm:border-2 sm:border-pink-500/30 shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-xl transition-all duration-300`}
      >
        {/* Device Restriction Check for Smartphone & Tablet Only */}
        {!isMobileOrTablet && !isBypassDeviceGate ? (
          <DeviceGateScreen
            sharedUrl={SHARED_APP_URL}
            onBypass={() => {
              setIsBypassDeviceGate(true);
              sessionStorage.setItem('pokopoko_bypass_device_gate', 'true');
            }}
          />
        ) : isDevEnvironment && !isAdminAuthenticated ? (
          <AdminLockScreen
            onSuccessAuth={(pin) => {
              setIsAdminAuthenticated(true);
              setAdminPin(pin);
            }}
            sharedAppUrl={SHARED_APP_URL}
          />
        ) : screen === 'admin' ? (
          <AdminPanelScreen
            adminPin={adminPin}
            onBackToApp={() => setScreen('select')}
            onLogoutAdmin={() => {
              sessionStorage.removeItem('pokopoko_admin_auth');
              setIsAdminAuthenticated(false);
              setScreen('select');
            }}
            devAppUrl={DEV_APP_URL}
            sharedAppUrl={SHARED_APP_URL}
          />
        ) : screen === 'select' ? (
          <SongSelectScreen
            selectedSong={selectedSong}
            onSelectSong={setSelectedSong}
            selectedDifficulty={selectedDifficulty}
            onSelectDifficulty={setSelectedDifficulty}
            onStartGame={handleStartGame}
            onOpenLeaderboard={() => setScreen('leaderboard')}
            onOpenFreePlay={() => setScreen('freeplay')}
            onOpenSettings={() => setScreen('calibration')}
            onOpenIdeas={() => setScreen('ideas')}
            currentUser={currentUser}
            onOpenMyPage={() => setScreen('mypage')}
            onOpenSwitchUser={() => setIsAuthModalOpen(true)}
            onOpenGitHub={() => setIsGitHubModalOpen(true)}
            onOpenAdmin={() => setScreen('admin')}
            onOpenCourseModal={() => setIsCourseModalOpen(true)}
            onOpenShowcase={() => setIsFeaturesPresentationOpen(true)}
            onOpenMyDrumSet={() => setIsMyDrumKitModalOpen(true)}
            aiBattleEnabled={aiBattleEnabled}
            onToggleAIBattle={() => {
              const next = !aiBattleEnabled;
              setAiBattleEnabled(next);
              try {
                localStorage.setItem('pokopoko_ai_battle_enabled', String(next));
              } catch {}
            }}
            onOpenRPGModal={() => {
              setRpgProgress(loadRPGProgress());
              setIsRPGModalOpen(true);
            }}
            onStartRPGLevel={handleStartRPGLevel}
            rpgLevel={rpgProgress.currentLevel}
            onStartRandomGame={() => {
              setActiveRPGLevel(null);
              const randomSong = SONGS[Math.floor(Math.random() * SONGS.length)];
              setSelectedSong(randomSong);
              drumSynth.init();
              setScreen('game');
            }}
          />
        ) : null}

        {screen === 'game' && (
          <GameScreen
            song={selectedSong}
            difficulty={selectedDifficulty}
            settings={settings}
            rpgLevel={activeRPGLevel}
            userLevel={rpgProgress.currentLevel}
            deviceMode={deviceMode}
            customKit={activeKit}
            aiBattleEnabled={aiBattleEnabled}
            onFinishGame={handleFinishGame}
            onExit={() => {
              setCourseState(null);
              setScreen('select');
            }}
          />
        )}

        {screen === 'result' && lastScoreState && (
          <ResultScreen
            song={selectedSong}
            difficulty={selectedDifficulty}
            scoreState={lastScoreState}
            notes={lastPlayedNotes}
            settings={settings}
            currentUser={currentUser}
            courseState={courseState}
            rpgLevel={activeRPGLevel}
            userLevel={rpgProgress.currentLevel}
            onUpdateUserBests={(updatedUser) => setCurrentUser(updatedUser)}
            onPlayAgain={handleStartGame}
            onSelectSong={() => {
              setCourseState(null);
              setScreen('select');
            }}
            onViewLeaderboard={() => setScreen('leaderboard')}
            onOpenMyPage={() => setScreen('mypage')}
            onNextCourseSong={handleNextCourseSong}
            onExitCourse={handleExitCourse}
            onNextRPGLevel={(nextLvl) => {
              setRpgProgress(loadRPGProgress());
              handleStartRPGLevel(nextLvl);
            }}
          />
        )}

        {screen === 'mypage' && currentUser && (
          <MyPageScreen
            user={currentUser}
            userLevel={rpgProgress.currentLevel}
            onBackToMenu={() => setScreen('select')}
            onOpenSwitchUser={() => setIsAuthModalOpen(true)}
            onSelectSongToPlay={(song, diff) => {
              setSelectedSong(song);
              setSelectedDifficulty(diff);
              setScreen('select');
            }}
          />
        )}

        {screen === 'leaderboard' && (
          <LeaderboardScreen
            initialSongId={selectedSong.id}
            initialDifficulty={selectedDifficulty}
            onBack={() => setScreen('select')}
          />
        )}

        {screen === 'freeplay' && (
          <FreePlayScreen settings={settings} onBack={() => setScreen('select')} />
        )}

        {screen === 'calibration' && (
          <SettingsScreen
            settings={settings}
            onSaveSettings={updateSettings}
            onBack={() => setScreen('select')}
            deviceMode={deviceMode}
            onToggleDeviceMode={toggleDeviceMode}
            onOpenMyDrumSet={() => setIsMyDrumKitModalOpen(true)}
            aiBattleEnabled={aiBattleEnabled}
            onToggleAIBattle={() => {
              const next = !aiBattleEnabled;
              setAiBattleEnabled(next);
              try {
                localStorage.setItem('pokopoko_ai_battle_enabled', String(next));
              } catch {}
            }}
            onOpenFeaturesPresentation={() => setIsFeaturesPresentationOpen(true)}
          />
        )}

        {screen === 'ideas' && <IdeasScreen onBack={() => setScreen('select')} />}

        {/* User Auth / Nickname Registration Modal */}
        <AuthModal
          isOpen={isAuthModalOpen || (!currentUser && existingUsers.length === 0 && screen === 'select')}
          isMandatory={!currentUser && existingUsers.length === 0}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          existingUsers={existingUsers}
        />

        {/* GitHub Integration & App URLs Modal */}
        <GitHubModal
          isOpen={isGitHubModalOpen}
          onClose={() => setIsGitHubModalOpen(false)}
        />

        {/* Course Mode Selector Modal */}
        <CourseSelectModal
          isOpen={isCourseModalOpen}
          onClose={() => setIsCourseModalOpen(false)}
          defaultDifficulty={selectedDifficulty}
          onStartCourse={handleStartCourse}
        />

        {/* RPG Progression & Training Course Modal */}
        <RPGCourseModal
          isOpen={isRPGModalOpen}
          onClose={() => {
            setRpgProgress(loadRPGProgress());
            setIsRPGModalOpen(false);
          }}
          rpgProgress={rpgProgress}
          onStartLevel={handleStartRPGLevel}
        />

        {/* Poko-poko Beats Spectacular Showcase Presentation Modal */}
        <ShowcaseModal
          isOpen={isShowcaseModalOpen}
          onClose={() => setIsShowcaseModalOpen(false)}
          onStartPlaying={() => {
            setIsShowcaseModalOpen(false);
            setScreen('select');
          }}
        />

        {/* Poko-poko Beats 感動の派手な新機能プレゼンテーションモーダル */}
        <FeaturesPresentationModal
          isOpen={isFeaturesPresentationOpen}
          onClose={() => setIsFeaturesPresentationOpen(false)}
          onOpenMyDrumSet={() => setIsMyDrumKitModalOpen(true)}
          onStartAIBattle={() => {
            setAiBattleEnabled(true);
            setDeviceMode('tablet');
            savePreferredDeviceMode('tablet');
          }}
        />

        {/* タブレット専用: マイドラムセットカスタマイズモーダル（5スロット保存） */}
        <MyDrumKitModal
          isOpen={isMyDrumKitModalOpen}
          onClose={() => setIsMyDrumKitModalOpen(false)}
          customKits={customKits}
          activeKitId={activeKitId}
          onSelectKit={(kitId) => setActiveKitId(kitId)}
          onUpdateKits={(kits) => {
            setCustomKits(kits);
            saveCustomKits(kits);
          }}
        />
      </main>
    </div>
  );
}
