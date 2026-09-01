import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Github, Globe, Sparkles, X, Terminal, Share2 } from 'lucide-react';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const urls = {
    devUrl: 'https://ais-dev-52fgspwlg7gwz63oc3ec7m-668070792322.asia-east1.run.app',
    sharedUrl: 'https://ais-pre-52fgspwlg7gwz63oc3ec7m-668070792322.asia-east1.run.app',
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-2 border-pink-400/40 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-white/20 flex items-center justify-center text-white shadow-lg">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                GitHub 連携 & URL 情報 🌐
              </h2>
              <p className="text-[11px] text-pink-200">
                Poko-Poko Beats アプリケーション接続情報
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* URLs Section */}
        <div className="mt-4 space-y-3">
          {/* 1. Development App URL */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                開発者用 URL（Development App URL）
              </span>
              <button
                type="button"
                onClick={() => handleCopy('dev', urls.devUrl)}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 px-2 py-0.5 rounded-lg transition"
              >
                {copiedKey === 'dev' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'dev' ? 'コピー完了' : 'コピー'}
              </button>
            </div>
            <a
              href={urls.devUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-cyan-300 hover:underline break-all block flex items-center gap-1"
            >
              {urls.devUrl}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>

          {/* 2. Shared / Preview App URL */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-pink-300 flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-pink-400" />
                共有／プレビュー用 URL（Shared App URL）
              </span>
              <button
                type="button"
                onClick={() => handleCopy('shared', urls.sharedUrl)}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 px-2 py-0.5 rounded-lg transition"
              >
                {copiedKey === 'shared' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'shared' ? 'コピー完了' : 'コピー'}
              </button>
            </div>
            <a
              href={urls.sharedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-pink-300 hover:underline break-all block flex items-center gap-1"
            >
              {urls.sharedUrl}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>

          {/* 3. GitHub Integration Guide */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-3.5 rounded-2xl border border-indigo-500/40 space-y-2">
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-white" />
              <span className="text-xs font-black text-white">
                公式 GitHub 連携 & 公開手順
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Google AI Studio では、右上の <strong className="text-white">「Settings」メニュー</strong> または <strong className="text-pink-300">「Export to GitHub」</strong> から直接あなたの GitHub アカウントにリポジトリを作成・プッシュして同期連携することができます。
            </p>

            <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                <Terminal className="w-3 h-3" />
                GitHub ➔ Vercel 公開ステップ（完全無料・Cookie不要）：
              </div>
              <ol className="text-[10px] text-slate-300 space-y-1 list-decimal list-inside">
                <li>画面右上の <span className="font-bold text-white">⚙️ Settings</span> ➔ <span className="font-bold text-pink-300">「Export to GitHub」</span> でリポジトリを作成</li>
                <li><a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline font-bold">vercel.com/new</a> にアクセス（GitHubで無料ログイン）</li>
                <li>作成したリポジトリを選択して「Deploy」ボタンを押すだけ（設定不要で即座にURL発行）</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-amber-500 text-white font-black text-xs shadow-lg hover:opacity-95 transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
