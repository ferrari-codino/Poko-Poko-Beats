import React from 'react';
import { Smartphone, Tablet, MonitorX, QrCode, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';

interface DeviceGateScreenProps {
  onBypass?: () => void;
  sharedUrl: string;
}

export const DeviceGateScreen: React.FC<DeviceGateScreenProps> = ({
  onBypass,
  sharedUrl,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/90 border-2 border-pink-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center space-y-4">
        {/* Device Restriction Header Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 p-0.5 shadow-xl flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center relative">
              <div className="flex items-center gap-1">
                <Smartphone className="w-8 h-8 text-pink-400 animate-pulse" />
                <Tablet className="w-6 h-6 text-amber-400" />
              </div>
              <div className="absolute -top-2 -right-2 p-1 bg-rose-500 rounded-full text-white shadow">
                <MonitorX className="w-4 h-4 stroke-[3]" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 font-bold text-[11px] uppercase tracking-wider inline-flex items-center gap-1 mb-2">
            <Sparkles className="w-3 h-3" />
            MOBILE & TABLET ONLY
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            スマホ・タブレット専用アプリ 📱
          </h1>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            『ポコポコ・ビーツ』は、タッチ操作によるリアルなドラム演奏体験を最適化するため、<strong className="text-pink-300">スマートフォン</strong> または <strong className="text-amber-300">タブレット端末</strong> 専用となっております。
          </p>
        </div>

        {/* Instructions Box */}
        <div className="w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2.5">
          <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4" />
            スマートフォン / タブレットでプレイする方法
          </div>
          <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>お手持ちのスマホまたはiPad等のブラウザでURLを開く</li>
            <li>またはPCブラウザの「開発者ツール（F12）」で<strong className="text-cyan-300">モバイル端末エミュレーション（端末モード）</strong>を有効にしてリロード</li>
          </ol>
        </div>

        {/* URL Copy Button */}
        <div className="w-full space-y-2">
          <div className="text-[11px] text-slate-400">アプリURLをコピーしてスマホへ送信:</div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
            <input
              type="text"
              readOnly
              value={sharedUrl}
              className="w-full bg-transparent text-[11px] font-mono text-pink-200 outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shrink-0 transition shadow"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'コピー済' : 'コピー'}</span>
            </button>
          </div>
        </div>

        {/* Development Bypass Button (if available) */}
        {onBypass && (
          <div className="w-full pt-2 border-t border-slate-800/80 flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={onBypass}
              className="text-[11px] text-slate-500 hover:text-slate-300 underline transition"
            >
              PC画面のまま開発・プレビューを継続する（開発者テスト用）
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
