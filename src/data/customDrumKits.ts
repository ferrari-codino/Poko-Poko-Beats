import { CustomDrumKit, ShellMaterial, DrumHeadStyle, HardwareFinish, CymbalFinish } from '../types';

export interface ShellMaterialOption {
  id: ShellMaterial;
  name: string;
  enName: string;
  description: string;
  texturePattern: string; // CSS background pattern or style
}

export interface ShellColorOption {
  id: string;
  name: string;
  hex: string;
  accent: string;
}

export interface HeadStyleOption {
  id: DrumHeadStyle;
  name: string;
  color: string;
  rimColor: string;
  description: string;
}

export interface HardwareOption {
  id: HardwareFinish;
  name: string;
  color: string;
  borderColor: string;
  highlight: string;
}

export interface CymbalFinishOption {
  id: CymbalFinish;
  name: string;
  gradient: string;
  borderColor: string;
  shineColor: string;
}

export const SHELL_MATERIALS: ShellMaterialOption[] = [
  {
    id: 'maple',
    name: 'プレミアム・メイプル',
    enName: 'North American Maple',
    description: '温かく豊かな中低域。あらゆるジャンルにマッチする最高峰ウッドシェル',
    texturePattern: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
  },
  {
    id: 'birch',
    name: 'クラシック・バーチ',
    enName: 'Hokkaido Birch',
    description: '明瞭なアタックと引き締まった低音。レコーディングスタジオ定番シェル',
    texturePattern: 'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, transparent 50%, rgba(255,255,255,0.08) 100%)',
  },
  {
    id: 'acrylic',
    name: 'クリスタル・アクリル',
    enName: 'Seamless Acrylic',
    description: '圧巻の透明感と鋭いパンチ。ステージ照明でドラマチックに輝くアクリル',
    texturePattern: 'linear-gradient(120deg, rgba(255,255,255,0.4) 0%, transparent 40%, rgba(255,255,255,0.2) 100%)',
  },
  {
    id: 'brass',
    name: 'ソリッド・ブラス',
    enName: 'Heavy Rolled Brass',
    description: '重厚な金属の倍音と圧倒的パワー。抜けの良いダイナミックな鳴り',
    texturePattern: 'linear-gradient(45deg, rgba(251,191,36,0.25) 0%, transparent 70%)',
  },
  {
    id: 'carbon',
    name: 'エアロ・カーボン',
    enName: 'Aero Carbon Fiber',
    description: '超軽量・高強度のカーボン複合材。レスポンスの速さと近代的な美しさ',
    texturePattern: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.3) 0, rgba(0,0,0,0.3) 2px, transparent 2px, transparent 4px)',
  },
];

export const SHELL_COLORS: ShellColorOption[] = [
  { id: 'sapphire', name: 'オーシャン・サファイア', hex: '#2563eb', accent: '#60a5fa' },
  { id: 'ruby', name: 'ルビー・スパークル', hex: '#e11d48', accent: '#fb7185' },
  { id: 'emerald', name: 'エメラルド・グリーン', hex: '#059669', accent: '#34d399' },
  { id: 'sunset', name: 'サンセット・アンバー', hex: '#d97706', accent: '#fbbf24' },
  { id: 'violet', name: 'コズミック・バイオレット', hex: '#7c3aed', accent: '#a78bfa' },
  { id: 'midnight', name: '漆黒ミッドナイト', hex: '#0f172a', accent: '#334155' },
  { id: 'pearl', name: 'アークティック・パール', hex: '#e2e8f0', accent: '#ffffff' },
  { id: 'sakura', name: 'サクラ・ピンクバースト', hex: '#ec4899', accent: '#f472b6' },
];

export const HEAD_STYLES: HeadStyleOption[] = [
  {
    id: 'coatedWhite',
    name: 'コーテッド・ホワイト',
    color: '#f8fafc',
    rimColor: '#94a3b8',
    description: '定番の白ヘッド。程よい倍音と柔らかな打感',
  },
  {
    id: 'clearEbony',
    name: 'クリア・エボニー（黒）',
    color: '#090d16',
    rimColor: '#475569',
    description: '漆黒の光沢。引き締まったアタックとモダンな低音',
  },
  {
    id: 'vintage',
    name: 'ヴィンテージ・本革風',
    color: '#fef3c7',
    rimColor: '#b45309',
    description: '温かみのあるカーフスキン調繊維。クラシカルな響き',
  },
  {
    id: 'hydraulicBlue',
    name: 'ハイドローリック・ブルー',
    color: '#0284c7',
    rimColor: '#0369a1',
    description: 'オイル封入の深海ブルー。不要な倍音を抑えた極太サウンド',
  },
  {
    id: 'goldFoil',
    name: 'ゴールド・マイラー',
    color: '#fde047',
    rimColor: '#ca8a04',
    description: 'ゴールドに煌めくステージ仕様。圧倒的な存在感',
  },
];

export const HARDWARE_FINISHES: HardwareOption[] = [
  {
    id: 'chrome',
    name: 'ミラー・クローム',
    color: '#cbd5e1',
    borderColor: '#94a3b8',
    highlight: '#ffffff',
  },
  {
    id: 'blackNickel',
    name: 'ブラック・ニッケル',
    color: '#1e293b',
    borderColor: '#475569',
    highlight: '#64748b',
  },
  {
    id: 'gold',
    name: '24Kブラス・ゴールド',
    color: '#f59e0b',
    borderColor: '#b45309',
    highlight: '#fde047',
  },
];

export const CYMBAL_FINISHES: CymbalFinishOption[] = [
  {
    id: 'brilliantGold',
    name: 'ブリリアント・ゴールド',
    gradient: 'radial-gradient(circle at 40% 40%, #fde047 0%, #d97706 70%, #92400e 100%)',
    borderColor: '#f59e0b',
    shineColor: '#fef08a',
  },
  {
    id: 'traditionalBronze',
    name: 'トラディショナル・B20ブロンズ',
    gradient: 'radial-gradient(circle at 40% 40%, #fcd34d 0%, #b45309 70%, #78350f 100%)',
    borderColor: '#d97706',
    shineColor: '#fef3c7',
  },
  {
    id: 'darkVintage',
    name: 'カスタム・ダークヴィンテージ',
    gradient: 'radial-gradient(circle at 40% 40%, #92400e 0%, #451a03 75%, #1c1917 100%)',
    borderColor: '#78350f',
    shineColor: '#b45309',
  },
  {
    id: 'platinum',
    name: 'プラチナム・シルバー',
    gradient: 'radial-gradient(circle at 40% 40%, #f1f5f9 0%, #94a3b8 70%, #475569 100%)',
    borderColor: '#cbd5e1',
    shineColor: '#ffffff',
  },
];

// 5 Initial Preset Custom Drum Kits
export const DEFAULT_CUSTOM_KITS: CustomDrumKit[] = [
  {
    id: 'kit-slot-1',
    name: 'My Studio Maple 🥁',
    shellMaterial: 'maple',
    shellColor: '#2563eb', // Ocean Sapphire
    headStyle: 'coatedWhite',
    hardwareFinish: 'chrome',
    cymbalFinish: 'brilliantGold',
    isDefault: true,
    createdAt: 1700000000000,
  },
  {
    id: 'kit-slot-2',
    name: 'Rock Beast Flare 🔥',
    shellMaterial: 'birch',
    shellColor: '#e11d48', // Ruby
    headStyle: 'clearEbony',
    hardwareFinish: 'blackNickel',
    cymbalFinish: 'darkVintage',
    isDefault: false,
    createdAt: 1700000001000,
  },
  {
    id: 'kit-slot-3',
    name: 'Crystal Cyber ⚡',
    shellMaterial: 'acrylic',
    shellColor: '#059669', // Emerald
    headStyle: 'goldFoil',
    hardwareFinish: 'gold',
    cymbalFinish: 'platinum',
    isDefault: false,
    createdAt: 1700000002000,
  },
  {
    id: 'kit-slot-4',
    name: 'Sakura Groove 🌸',
    shellMaterial: 'maple',
    shellColor: '#ec4899', // Sakura Pink
    headStyle: 'coatedWhite',
    hardwareFinish: 'chrome',
    cymbalFinish: 'brilliantGold',
    isDefault: false,
    createdAt: 1700000003000,
  },
  {
    id: 'kit-slot-5',
    name: 'Vintage Brass Soul 🎷',
    shellMaterial: 'brass',
    shellColor: '#d97706', // Sunset
    headStyle: 'vintage',
    hardwareFinish: 'gold',
    cymbalFinish: 'traditionalBronze',
    isDefault: false,
    createdAt: 1700000004000,
  },
];

export const loadCustomKits = (): CustomDrumKit[] => {
  try {
    const saved = localStorage.getItem('pokopoko_custom_kits');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_CUSTOM_KITS;
};

export const saveCustomKits = (kits: CustomDrumKit[]) => {
  try {
    localStorage.setItem('pokopoko_custom_kits', JSON.stringify(kits.slice(0, 5)));
  } catch {}
};
