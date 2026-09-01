import React, { useState } from 'react';
import { MascotId, UserProfile } from '../types';
import { MASCOTS } from '../data/mascots';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  existingUsers?: { id: string; nickname: string; avatarId: string; totalScore: number }[];
  isMandatory?: boolean; // When first starting the game
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  existingUsers = [],
  isMandatory = false,
}) => {
  const [tab, setTab] = useState<'register' | 'switch'>('register');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<MascotId>('pokota');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setErrorMessage('ニックネームを入力してください！(必須)');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          avatarId: selectedAvatar,
          pin: pin.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '登録に失敗しました');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message || '登録エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userId: string, userNickname: string) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, nickname: userNickname }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ログインに失敗しました');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'ログインエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-2 border-pink-400/40 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden">
        {/* Cute background bubbles */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-pink-500 text-3xl shadow-lg border-2 border-white mb-2">
            🥁
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
            {isMandatory ? 'ドラマー登録をしよう！' : 'プレイヤー切り替え'}
          </h2>
          <p className="text-xs text-pink-200/90 mt-1">
            ニックネームを登録して、ランキングやマイページで記録を残そう！
          </p>
        </div>

        {/* Tab Switcher (if there are existing accounts) */}
        {existingUsers.length > 0 && !isMandatory && (
          <div className="flex bg-slate-800/80 rounded-2xl p-1 mb-4 border border-slate-700/60">
            <button
              type="button"
              onClick={() => setTab('register')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'register'
                  ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ✨ あたらしく登録
            </button>
            <button
              type="button"
              onClick={() => setTab('switch')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'switch'
                  ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👥 プレイヤーを選ぶ
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs font-bold text-center">
            ⚠️ {errorMessage}
          </div>
        )}

        {tab === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Nickname Input (Required) */}
            <div>
              <label className="block text-xs font-bold text-pink-200 mb-1">
                ニックネーム <span className="text-rose-400">※必須 (16文字まで)</span>
              </label>
              <input
                type="text"
                maxLength={16}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例: たいき君、リズムマスター"
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/90 border border-pink-400/40 text-white placeholder-slate-400 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* Mascot Character Avatar Selection */}
            <div>
              <label className="block text-xs font-bold text-pink-200 mb-1.5">
                すきなキャラクターをえらんでね！
              </label>
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                {(Object.keys(MASCOTS) as MascotId[]).map((mId) => {
                  const m = MASCOTS[mId];
                  const isSelected = selectedAvatar === mId;
                  return (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => setSelectedAvatar(mId)}
                      className={`relative flex flex-col items-center justify-center p-1 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? 'border-pink-400 bg-pink-500/20 scale-105 shadow-md'
                          : 'border-slate-700/60 bg-slate-800/60 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-[9px] font-bold text-white mt-0.5 truncate w-full text-center">
                        {m.name}
                      </span>
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-pink-500 rounded-full text-white text-[8px] flex items-center justify-center">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 text-center text-xs text-amber-200/90 font-medium">
                {MASCOTS[selectedAvatar]?.description}
              </div>
            </div>

            {/* Optional PIN Code for kids */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                ひみつの暗証番号 (PIN / 任意)
              </label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="4ケタの数字 (なしでもOK)"
                className="w-full px-3 py-2 rounded-2xl bg-slate-800/70 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-black text-sm tracking-wide shadow-lg hover:opacity-95 active:scale-98 transition-all disabled:opacity-50"
            >
              {isLoading ? '登録中...' : '🥁 登録してドラムを始める！'}
            </button>
          </form>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <p className="text-xs text-slate-300 font-bold mb-2">
              保存されているプレイヤーから選択：
            </p>
            {existingUsers.map((u) => {
              const mascot = MASCOTS[(u.avatarId as MascotId) || 'pokota'] || MASCOTS.pokota;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.id, u.nickname)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-pink-400/60 hover:bg-slate-800 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${mascot.avatarBg} flex items-center justify-center text-lg border border-white/40`}>
                      {mascot.emoji}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white group-hover:text-pink-300 transition-colors">
                        {u.nickname}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        スコア: {u.totalScore.toLocaleString()}点
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-pink-400 font-bold px-2 py-1 rounded-xl bg-pink-500/10 group-hover:bg-pink-500 group-hover:text-white transition-all">
                    えらぶ →
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Cancel button if not mandatory */}
        {!isMandatory && onClose && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white font-bold underline"
            >
              とじる
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
