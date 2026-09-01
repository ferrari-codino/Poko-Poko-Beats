import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { MASCOTS } from '../data/mascots';
import {
  Shield,
  Users,
  Trophy,
  KeyRound,
  UserX,
  UserCheck,
  Trash2,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Play,
  Lock,
  Globe,
  RefreshCw,
} from 'lucide-react';

interface AdminPanelScreenProps {
  adminPin: string;
  onBackToApp: () => void;
  onLogoutAdmin: () => void;
  devAppUrl: string;
  sharedAppUrl: string;
}

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({
  adminPin,
  onBackToApp,
  onLogoutAdmin,
  devAppUrl,
  sharedAppUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'scores' | 'security'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security Form
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);

  // System Stats
  const [systemInfo, setSystemInfo] = useState<any>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-pin': adminPin },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch('/api/admin/system-info', {
        headers: { 'x-admin-pin': adminPin },
      });
      if (res.ok) {
        const data = await res.json();
        setSystemInfo(data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchUsers();
    fetchSystemInfo();
  }, [adminPin]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleToggleBlock = async (user: UserProfile) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/toggle-block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', data.message);
        fetchUsers();
        fetchSystemInfo();
      } else {
        showToast('error', data.error || '操作に失敗しました');
      }
    } catch (err) {
      showToast('error', 'サーバー通信エラーが発生しました');
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!window.confirm(`プレイヤー「${user.nickname}」を完全に削除しますか？\n（スコア履歴も削除されます）`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin },
      });

      if (res.ok) {
        showToast('success', `「${user.nickname}」を削除しました`);
        fetchUsers();
        fetchSystemInfo();
      } else {
        showToast('error', '削除に失敗しました');
      }
    } catch (err) {
      showToast('error', 'サーバー通信エラーが発生しました');
    }
  };

  const handleResetScores = async (mode: 'seed' | 'clear') => {
    const confirmText =
      mode === 'clear'
        ? 'すべてのスコアランキング記録を全消去しますか？'
        : 'ランキングを初期サンプルデータにリセットしますか？';

    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetch('/api/admin/reset-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
        body: JSON.stringify({ mode }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', data.message);
        fetchSystemInfo();
      } else {
        showToast('error', data.error || 'リセットに失敗しました');
      }
    } catch (err) {
      showToast('error', 'サーバー通信エラーが発生しました');
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.trim().length < 4) {
      showToast('error', '新しいPINは4文字以上で入力してください');
      return;
    }
    if (newPin !== confirmPin) {
      showToast('error', '新しいPINと確認用PINが一致しません');
      return;
    }

    setIsChangingPin(true);
    try {
      const res = await fetch('/api/admin/change-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
        body: JSON.stringify({ newPin: newPin.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', '管理者PINを変更しました。再度ログインしてください。');
        sessionStorage.setItem('pokopoko_admin_pin', newPin.trim());
        setNewPin('');
        setConfirmPin('');
      } else {
        showToast('error', data.error || '変更に失敗しました');
      }
    } catch (err) {
      showToast('error', 'サーバー通信エラーが発生しました');
    } finally {
      setIsChangingPin(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.nickname.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'active') return matchesSearch && !u.isBlocked;
    if (filterStatus === 'blocked') return matchesSearch && u.isBlocked;
    return matchesSearch;
  });

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Top Header */}
      <header className="p-3.5 bg-slate-900/95 border-b border-pink-500/20 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-white shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
              開発者アクセス管理パネル 🛡️
            </h1>
            <p className="text-[10px] text-pink-200">
              Admin & User Access Control Panel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onBackToApp}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-amber-500 text-white font-bold text-xs shadow hover:opacity-90 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>ゲームを起動</span>
          </button>

          <button
            type="button"
            onClick={onLogoutAdmin}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition"
            title="管理セッションをロック"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`mx-3 mt-2 p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg animate-in slide-in-from-top-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/90 border border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/90 border border-rose-500/50 text-rose-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center px-3 pt-2 gap-1.5 shrink-0 border-b border-slate-800/80 bg-slate-900/50">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-t-xl transition ${
            activeTab === 'users'
              ? 'bg-slate-800 text-pink-300 border-t-2 border-pink-500 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>ユーザー管理 ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scores')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-t-xl transition ${
            activeTab === 'scores'
              ? 'bg-slate-800 text-amber-300 border-t-2 border-amber-500 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>スコア管理</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-t-xl transition ${
            activeTab === 'security'
              ? 'bg-slate-800 text-cyan-300 border-t-2 border-cyan-500 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>PIN設定 & システム</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* TAB 1: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            {/* Search & Filter Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ニックネームで検索..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-pink-500 transition"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e: any) => setFilterStatus(e.target.value)}
                className="px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-bold focus:outline-none"
              >
                <option value="all">全員表示</option>
                <option value="active">通常のみ</option>
                <option value="blocked">停止中のみ</option>
              </select>

              <button
                type="button"
                onClick={fetchUsers}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="更新"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Users List */}
            {isLoading ? (
              <div className="text-center py-8 text-xs text-slate-400">ユーザーデータを読込中...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                該当するユーザーが見つかりませんでした
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((u) => {
                  const mascot = MASCOTS[u.avatarId || 'pokota'] || MASCOTS.pokota;
                  return (
                    <div
                      key={u.id}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between gap-2.5 ${
                        u.isBlocked
                          ? 'bg-rose-950/20 border-rose-800/40 opacity-80'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow"
                          style={{ backgroundColor: `${mascot.themeColor}25` }}
                        >
                          {mascot.emoji}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white truncate">
                              {u.nickname}
                            </span>
                            {u.isBlocked && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                停止中
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>プレイ: {u.totalPlays || 0}回</span>
                            <span>★ {u.starsCount || 0}</span>
                            <span>総点: {(u.totalScore || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleBlock(u)}
                          className={`p-1.5 rounded-xl border font-bold text-[10px] flex items-center gap-1 transition ${
                            u.isBlocked
                              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900'
                              : 'bg-amber-950/80 border-amber-500/40 text-amber-300 hover:bg-amber-900'
                          }`}
                          title={u.isBlocked ? 'アカウント停止解除' : 'アカウント一時停止'}
                        >
                          {u.isBlocked ? (
                            <>
                              <UserCheck className="w-3 h-3" />
                              <span className="hidden sm:inline">解除</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" />
                              <span className="hidden sm:inline">停止</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
                          title="ユーザー削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SCORES & LEADERBOARD CONTROL */}
        {activeTab === 'scores' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <h3 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                ランキング＆スコア管理
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                全国ランキング（上位30名）のデータ管理や、テストプレイ後のスコアリセットを行えます。
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleResetScores('seed')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex flex-col items-center gap-1 transition"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>サンプルスコアに復元</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleResetScores('clear')}
                  className="p-2.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/50 text-xs font-bold text-rose-300 flex flex-col items-center gap-1 transition"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>全スコア記録を消去</span>
                </button>
              </div>
            </div>

            {/* Quick Stats overview */}
            {systemInfo && (
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs">
                <div className="font-bold text-slate-200">現在の統計:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>総登録プレイヤー: <strong className="text-white">{systemInfo.totalUsers}</strong> 人</div>
                  <div>有効プレイヤー: <strong className="text-emerald-300">{systemInfo.activeUsersCount}</strong> 人</div>
                  <div>停止プレイヤー: <strong className="text-rose-300">{systemInfo.blockedUsersCount}</strong> 人</div>
                  <div>総スコアエントリー: <strong className="text-amber-300">{systemInfo.totalScores}</strong> 件</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SECURITY PIN & SYSTEM INFO */}
        {activeTab === 'security' && (
          <div className="space-y-3">
            {/* Change Admin PIN Form */}
            <form onSubmit={handleChangePin} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                管理者 PIN コード（パスコード）の変更
              </h3>
              <p className="text-[10px] text-slate-400">
                開発者用URL（ais-dev）を開く際に要求される認証PINコードを変更します。
              </p>

              <div className="space-y-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">
                    新しい管理者 PIN
                  </label>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="新しいPIN（4文字以上）"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">
                    新しい管理者 PIN（確認）
                  </label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="確認のためもう一度入力"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPin}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-xs shadow hover:opacity-90 transition disabled:opacity-50"
                >
                  {isChangingPin ? '変更中...' : '管理者PINを更新する'}
                </button>
              </div>
            </form>

            {/* System Details */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-[11px]">
              <div className="font-black text-white flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-pink-400" />
                環境・接続情報
              </div>
              <div className="space-y-1 text-slate-300">
                <p>
                  開発者 URL: <code className="text-amber-300 font-mono text-[10px] break-all">{devAppUrl}</code>
                </p>
                <p>
                  共有用 URL: <code className="text-cyan-300 font-mono text-[10px] break-all">{sharedAppUrl}</code>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <footer className="p-3 border-t border-slate-800/80 bg-slate-900/70 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onBackToApp}
          className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ドラム選択画面へ戻る</span>
        </button>

        <span className="text-[10px] text-pink-300 font-mono font-bold">
          🛡️ Admin Mode Active
        </span>
      </footer>
    </div>
  );
};
