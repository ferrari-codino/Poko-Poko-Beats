import React, { useState, useEffect } from 'react';
import { GameScreen as GameScreenType, SongData, Difficulty, ScoreState, RhythmNote, PlayerSettings, UserProfile, CourseState } from './types';
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
import { AdminLockScreen } from './components/AdminLockScreen';
import { AdminPanelScreen } from './components/AdminPanelScreen';
import { DeviceGateScreen } from './components/DeviceGateScreen';
import { drumSynth } from './audio/drumSynth';
import { getLocalUsers } from './utils/storageFallback';
import { loadRPGProgress, getRPGLevelConfig } from './data/rpgCurriculum';
import { RPGProgress } from './types';

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

  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent || '';
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
      const isIPadOS = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileScreen = window.innerWidth <= 1024;
      setIsMobileOrTablet(isMobileUA || isIPadOS || (hasTouch && isMobileScreen));
    };

    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

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

  // Pre-initialize audio context on first interaction
  useEffect(() => {
    const handleFirstUserTouch = () => {
      drumSynth.init();
      window.removeEventListener('pointerdown', handleFirstUserTouch);
      window.removeEventListener('keydown', handleFirstUserTouch);
    };

    window.addEventListener('pointerdown', handleFirstUserTouch, { once: true });
    window.addEventListener('keydown', handleFirstUserTouch, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstUserTouch);
      window.removeEventListener('keydown', handleFirstUserTouch);
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

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 text-slate-100 flex items-center justify-center p-0 sm:p-4 overflow-hidden font-sans">
      {/* Cute Floating Decorative Background Dots */}
      <div className="fixed top-12 left-12 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-12 right-12 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Mobile container framing */}
      <main className="w-full max-w-md h-screen sm:h-[94vh] sm:max-h-[860px] bg-slate-950/95 sm:rounded-[36px] sm:border-2 sm:border-pink-500/30 shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-xl">
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
      </main>
    </div>
  );
}
