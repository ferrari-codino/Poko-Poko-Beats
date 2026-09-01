import React, { useState, useEffect } from 'react';
import { GameScreen as GameScreenType, SongData, Difficulty, ScoreState, RhythmNote, PlayerSettings, UserProfile } from './types';
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
import { AdminLockScreen } from './components/AdminLockScreen';
import { AdminPanelScreen } from './components/AdminPanelScreen';
import { drumSynth } from './audio/drumSynth';

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
  const [existingUsers, setExistingUsers] = useState<any[]>([]);

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
        }

        // Check if any users exist
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.users && usersData.users.length > 0) {
            setExistingUsers(usersData.users);
          }
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
    drumSynth.init();
    setScreen('game');
  };

  const handleFinishGame = (finalScore: ScoreState, notes: RhythmNote[]) => {
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
        {/* Dynamic Screen View */}
        {isDevEnvironment && !isAdminAuthenticated ? (
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
          />
        ) : null}

        {screen === 'game' && (
          <GameScreen
            song={selectedSong}
            difficulty={selectedDifficulty}
            settings={settings}
            onFinishGame={handleFinishGame}
            onExit={() => setScreen('select')}
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
            onUpdateUserBests={(updatedUser) => setCurrentUser(updatedUser)}
            onPlayAgain={handleStartGame}
            onSelectSong={() => setScreen('select')}
            onViewLeaderboard={() => setScreen('leaderboard')}
            onOpenMyPage={() => setScreen('mypage')}
          />
        )}

        {screen === 'mypage' && currentUser && (
          <MyPageScreen
            user={currentUser}
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
      </main>
    </div>
  );
}
