import { DrumPartConfig, DrumPartId } from '../types';

export const DRUM_PARTS: Record<DrumPartId, DrumPartConfig> = {
  kick: {
    id: 'kick',
    name: 'バスドラム (Kick)',
    shortName: 'KICK',
    keyLabel: 'Space / B',
    color: '#f59e0b', // Amber
    glowColor: 'rgba(245, 158, 11, 0.85)',
    borderColor: '#d97706',
    bgActiveColor: '#fbbf24',
    description: 'ドシンと響くリズムの土台！足元ペダルの重低音',
    size: 'xlarge',
  },
  snare: {
    id: 'snare',
    name: 'スネアドラム (Snare)',
    shortName: 'SNARE',
    keyLabel: 'S / D',
    color: '#06b6d4', // Cyan
    glowColor: 'rgba(6, 182, 212, 0.85)',
    borderColor: '#0891b2',
    bgActiveColor: '#22d3ee',
    description: 'スナッピーがシャープに響くドラムの花形',
    size: 'large',
  },
  hihatClosed: {
    id: 'hihatClosed',
    name: 'ハイハット・クローズ (Hi-Hat)',
    shortName: 'H-HAT',
    keyLabel: 'H / J',
    color: '#10b981', // Emerald
    glowColor: 'rgba(16, 185, 129, 0.85)',
    borderColor: '#059669',
    bgActiveColor: '#34d399',
    description: 'チッチッとタイトに刻むリズムの基準',
    size: 'medium',
  },
  hihatOpen: {
    id: 'hihatOpen',
    name: 'ハイハット・オープン (Open HH)',
    shortName: 'O-HAT',
    keyLabel: 'O / K',
    color: '#84cc16', // Lime
    glowColor: 'rgba(132, 204, 22, 0.85)',
    borderColor: '#65a30d',
    bgActiveColor: '#a3e635',
    description: 'シャーンと広がるアクセント用オープンハット',
    size: 'medium',
  },
  tomHigh: {
    id: 'tomHigh',
    name: 'ハイタム (High Tom)',
    shortName: 'HI-TOM',
    keyLabel: 'T / E',
    color: '#a855f7', // Purple
    glowColor: 'rgba(168, 85, 247, 0.85)',
    borderColor: '#9333ea',
    bgActiveColor: '#c084fc',
    description: 'ポコポコと高めに響くタムフィルインの開始音',
    size: 'medium',
  },
  tomLow: {
    id: 'tomLow',
    name: 'ロータム (Low Tom)',
    shortName: 'LOW-TOM',
    keyLabel: 'G / R',
    color: '#6366f1', // Indigo
    glowColor: 'rgba(99, 102, 241, 0.85)',
    borderColor: '#4f46e5',
    bgActiveColor: '#818cf8',
    description: '中低音のメロディックなタムタムサウンド',
    size: 'medium',
  },
  tomFloor: {
    id: 'tomFloor',
    name: 'フロアタム (Floor Tom)',
    shortName: 'FLOOR',
    keyLabel: 'F / V',
    color: '#ec4899', // Pink
    glowColor: 'rgba(236, 72, 153, 0.85)',
    borderColor: '#db2777',
    bgActiveColor: '#f472b6',
    description: '床置きの太く低い重厚タムサウンド',
    size: 'large',
  },
  crash: {
    id: 'crash',
    name: 'クラッシュシンバル (Crash)',
    shortName: 'CRASH',
    keyLabel: 'C / W',
    color: '#ef4444', // Red
    glowColor: 'rgba(239, 68, 68, 0.85)',
    borderColor: '#dc2626',
    bgActiveColor: '#f87171',
    description: '小節頭やサビ入りでバーンと炸裂するシンバル',
    size: 'large',
  },
  ride: {
    id: 'ride',
    name: 'ライドシンバル (Ride)',
    shortName: 'RIDE',
    keyLabel: 'Y / U',
    color: '#eab308', // Yellow
    glowColor: 'rgba(234, 179, 8, 0.85)',
    borderColor: '#ca8a04',
    bgActiveColor: '#facc15',
    description: 'チーンと澄んだカップ音と余韻のライドシンバル',
    size: 'large',
  },
};
