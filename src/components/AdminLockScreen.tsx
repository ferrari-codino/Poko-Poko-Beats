import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Lock, ArrowRight, ExternalLink, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdminLockScreenProps {
  onSuccessAuth: (pin: string) => void;
  sharedAppUrl: string;
}

export const AdminLockScreen: React.FC<AdminLockScreenProps> = ({
  onSuccessAuth,
  sharedAppUrl,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDefaultHint, setShowDefaultHint] = useState<boolean>(true);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) {
      setError('管理者PINコードを入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('pokopoko_admin_auth', 'true');
        sessionStorage.setItem('pokopoko_admin_pin', pin.trim());
        onSuccessAuth(pin.trim());
      } else {
        setError(data.error || 'PINコードが正しくありません');
      }
    } catch (err) {
      setError('サーバーとの通信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFillDefault = () => {
    setPin('admin1234');
    setError(null);
  };

  return (
    <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center p-4 select-none relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Glow ambient background lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-sm bg-slate-900/90 border-2 border-pink-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative z-10 flex flex-col items-center">
        {/* Shield Header Icon */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 p-0.5 shadow-lg flex items-center justify-center animate-pulse">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-pink-400" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 bg-amber-500 rounded-full text-slate-950 shadow-md">
            <Lock className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>

        <h1 className="text-lg sm:text-xl font-black text-white text-center tracking-tight">
          開発者アクセス認証 🛡️
        </h1>
        <p className="text-xs text-pink-200/90 text-center mt-1">
          Development Environment Access Gate
        </p>

        {/* Environmental Notice */}
        <div className="w-full mt-3.5 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            開発者用 URL (ais-dev) 保護中
          </div>
          <p className="text-slate-400 text-[10px]">
            このURLは管理者・開発者専用です。アプリおよびユーザー管理パネルを利用するには管理者PINを入力してください。
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="w-full mt-4 space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-pink-400" />
              管理者 PIN コード（パスコード）
            </label>
            <input
              id="admin-pin-input"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PINを入力（例: admin1234）"
              maxLength={16}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm tracking-widest focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition"
            />
          </div>

          {error && (
            <div className="p-2 rounded-xl bg-rose-950/70 border border-rose-500/50 flex items-center gap-1.5 text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            id="admin-auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-black text-xs shadow-lg hover:opacity-90 active:scale-98 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? (
              <span>認証中...</span>
            ) : (
              <>
                <span>管理者としてログイン</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Default PIN Helper Chip */}
        {showDefaultHint && (
          <div className="w-full mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              初期PIN: <code className="text-amber-300 font-mono">admin1234</code>
            </span>
            <button
              type="button"
              onClick={handleQuickFillDefault}
              className="text-[10px] font-bold text-pink-300 hover:text-pink-200 underline"
            >
              自動入力する
            </button>
          </div>
        )}

        {/* Shared URL Guide for general players */}
        <div className="w-full mt-3 pt-2 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 mb-1">
            一般プレイヤー・認証不要で遊ぶ場合:
          </p>
          <a
            href={sharedAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:text-cyan-200 bg-slate-950/80 px-3 py-1 rounded-xl border border-cyan-500/30 hover:border-cyan-400 transition"
          >
            <span>共有用 URL を開く (Shared App)</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
