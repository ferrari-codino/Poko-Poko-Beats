import React from 'react';
import { ArrowLeft, Sparkles, Flame, Mic, Bot, Share2, HelpCircle, Layers, Radio, Music } from 'lucide-react';

interface IdeasScreenProps {
  onBack: () => void;
}

export const IdeasScreen: React.FC<IdeasScreenProps> = ({ onBack }) => {
  const ideas = [
    {
      icon: <Flame className="w-5 h-5 text-amber-400" />,
      title: '1. 連打ロール (Drum Roll) & 同時押し (Flam / Crash)',
      badge: 'ゲーム性の深化',
      description:
        'スネアやタムの高速連打ゾーン（ロール）や、両手で同時に叩く「クラッシュ＋バスドラム」の同時押しを導入。光の輪が回転しながら迫る演出で、本物のドラマーのようなダイナミックな爽快感を生み出します。',
    },
    {
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      title: '2. ドラム音色キットの着せ替え (Skins & Sound Kits)',
      badge: 'カスタマイズ性',
      description:
        'スタンダードなロックドラム以外に、「808 Trap/HipHop」「重厚ヘヴィメタル」「和太鼓＆パーカッション」「ピコピコ8-bit チップチューン」など、スキンとシンセ音色を切り替え可能にし、楽曲ごとの没入感を高めます。',
    },
    {
      icon: <Bot className="w-5 h-5 text-purple-400" />,
      title: '3. AIビート自動生成 (Gemini AI Music Engine)',
      badge: '無限のコンテンツ',
      description:
        'ユーザーが「夏祭りの盆踊り風」「激しいヘヴィロック」「夜カフェのジャズ」とキーワードを入力すると、AIが即座にドラムパターン・メロディ・ノーツ譜面を自動生成して無限に遊べるモードを追加。',
    },
    {
      icon: <Radio className="w-5 h-5 text-emerald-400" />,
      title: '4. リアルタイム・ドラムバトル (1vs1 遠隔セッション)',
      badge: 'マルチプレイ対戦',
      description:
        '2人のプレイヤーが同じ楽曲でスコアを競い合うリアルタイム対戦。相手のコンボやフィーバーがリアルタイムにエフェクトとして飛び交うPvP機能。',
    },
    {
      icon: <Music className="w-5 h-5 text-rose-400" />,
      title: '5. リズムコーチ＆ドラム基礎練習モード',
      badge: '実用的な上達',
      description:
        '「裏拍の取り方」「8ビートの基本」「16分音符のゴーストノート」など、本物のドラムレッスンとして学べる知育・上達カリキュラム。',
    },
  ];

  const questions = [
    {
      q: 'Q1. 音源・楽曲の追加方式について',
      desc: '現在はWeb Audio APIによる高速シンセ音源ですが、MP3やWAVなどの実音源ファイルのアップロード機能や、YouTubeリンク連動などをご希望でしょうか？',
    },
    {
      q: 'Q2. ドラムセットのレイアウト変更について',
      desc: '利き手（左利きドラマー対応）や、パーツの個数（シンプルな4ピース構成 / 豪華なツータム構成）の自由配置カスタマイズ機能は必要でしょうか？',
    },
    {
      q: 'Q3. ユーザー認証・ログインについて',
      desc: '現在は名前入力によるランキング登録ですが、GoogleログインやFirebase Authによるマイページ・プレイ履歴詳細保存に対応しますか？',
    },
  ];

  return (
    <div className="w-full max-w-lg mx-auto min-h-full flex flex-col justify-between p-3 sm:p-4 select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </button>

        <div className="flex items-center gap-1.5 font-black text-slate-100 text-base">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Poko-Poko Beats 面白さUP提案
        </div>

        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {/* PROPOSALS SECTION */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            ゲームをさらに面白くする5つの拡張アイデア
          </div>

          {ideas.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 shadow-sm space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                    {item.icon}
                  </div>
                  <h3 className="font-black text-xs sm:text-sm text-slate-100">{item.title}</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-1">{item.description}</p>
            </div>
          ))}
        </div>

        {/* QUESTIONS & CLARIFICATIONS SECTION */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            開発における確認事項・ご質問
          </div>

          {questions.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950/70 border border-cyan-950/60 rounded-2xl p-3 space-y-1"
            >
              <div className="font-bold text-xs text-cyan-300">{item.q}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onBack}
        className="w-full mt-3 py-3 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black rounded-2xl shadow-lg text-xs sm:text-sm transition"
      >
        楽曲選択に戻って遊ぶ
      </button>
    </div>
  );
};
