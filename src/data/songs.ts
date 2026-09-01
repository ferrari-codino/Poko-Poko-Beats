import { SongData, DrumPartId, RhythmNote } from '../types';

// Helper to construct note patterns easily for 30s - 60s rich dynamic tracks
function generateChart(
  bpm: number,
  durationSec: number,
  timeSignature: string,
  difficulty: 'easy' | 'normal' | 'hard' | 'master',
  options?: {
    isOddMeter?: boolean;
    hasFastRolls?: boolean;
    hasRhythmChange?: boolean;
  }
): Omit<RhythmNote, 'id'>[] {
  const notes: Omit<RhythmNote, 'id'>[] = [];
  const beatSec = 60 / bpm;

  let baseBeatsPerMeasure = 4;
  if (timeSignature.startsWith('3')) baseBeatsPerMeasure = 3;
  else if (timeSignature.startsWith('5')) baseBeatsPerMeasure = 5;
  else if (timeSignature.startsWith('6')) baseBeatsPerMeasure = 6;
  else if (timeSignature.startsWith('7')) baseBeatsPerMeasure = 7;
  else if (timeSignature.startsWith('11')) baseBeatsPerMeasure = 11;

  const measureSec = beatSec * baseBeatsPerMeasure;
  const numMeasures = Math.floor((durationSec - 2.0) / measureSec);

  // Initial count-in offset: start first note at 1.0s
  const startOffset = 1.0;

  for (let m = 0; m < numMeasures; m++) {
    const mTime = startOffset + m * measureSec;
    // Section markers
    const isIntro = m < 2;
    const isChorus = (m >= 4 && m < 8) || (m >= 12 && m < 16);
    const isFillTransition = (m + 1) % 4 === 0;
    const isBridgeSolo = m >= 8 && m < 12;

    // First beat of measure (Crash / Kick accent)
    if (m === 0 || (isChorus && m % 2 === 0)) {
      notes.push({ part: 'crash', time: mTime, beat: m * baseBeatsPerMeasure });
      notes.push({ part: 'kick', time: mTime, beat: m * baseBeatsPerMeasure });
    } else {
      notes.push({ part: 'kick', time: mTime, beat: m * baseBeatsPerMeasure });
    }

    if (baseBeatsPerMeasure === 4) {
      if (difficulty === 'easy') {
        // Simple friendly kick on 1 & 3, snare on 2 & 4
        notes.push({ part: 'snare', time: mTime + beatSec, beat: m * 4 + 1 });
        notes.push({ part: 'kick', time: mTime + 2 * beatSec, beat: m * 4 + 2 });
        notes.push({ part: 'snare', time: mTime + 3 * beatSec, beat: m * 4 + 3 });

        if (isChorus) {
          notes.push({ part: 'hihatClosed', time: mTime + 0.5 * beatSec, beat: m * 4 + 0.5 });
          notes.push({ part: 'hihatClosed', time: mTime + 2.5 * beatSec, beat: m * 4 + 2.5 });
        }
      } else if (difficulty === 'normal') {
        // Kick on 1 & 3, Snare on 2 & 4, Hi-hat on 8ths
        for (let b = 0; b < 4; b++) {
          notes.push({ part: 'hihatClosed', time: mTime + b * beatSec, beat: m * 4 + b });
          notes.push({ part: 'hihatClosed', time: mTime + (b + 0.5) * beatSec, beat: m * 4 + b + 0.5 });
        }
        notes.push({ part: 'snare', time: mTime + beatSec, beat: m * 4 + 1 });
        notes.push({ part: 'kick', time: mTime + 2 * beatSec, beat: m * 4 + 2 });
        notes.push({ part: 'snare', time: mTime + 3 * beatSec, beat: m * 4 + 3 });

        if (isFillTransition) {
          notes.push({ part: 'tomHigh', time: mTime + 3.0 * beatSec, beat: m * 4 + 3 });
          notes.push({ part: 'tomLow', time: mTime + 3.5 * beatSec, beat: m * 4 + 3.5 });
        }
      } else if (difficulty === 'hard') {
        // 16th note rhythms, syncopated kicks, open hi-hat barks, fast tom rolls
        for (let b = 0; b < 4; b++) {
          const cymbalPart: DrumPartId = isChorus ? 'ride' : 'hihatClosed';
          notes.push({ part: cymbalPart, time: mTime + b * beatSec, beat: m * 4 + b });
          notes.push({ part: cymbalPart, time: mTime + (b + 0.5) * beatSec, beat: m * 4 + b + 0.5 });
        }
        notes.push({ part: 'snare', time: mTime + beatSec, beat: m * 4 + 1 });
        notes.push({ part: 'snare', time: mTime + 3 * beatSec, beat: m * 4 + 3 });

        // Syncopated kick groove
        notes.push({ part: 'kick', time: mTime + 1.75 * beatSec, beat: m * 4 + 1.75 });
        notes.push({ part: 'kick', time: mTime + 2.5 * beatSec, beat: m * 4 + 2.5 });

        if (isChorus) {
          notes.push({ part: 'hihatOpen', time: mTime + 1.5 * beatSec, beat: m * 4 + 1.5 });
        }

        if (isFillTransition || (options?.hasFastRolls && isBridgeSolo)) {
          // Energetic 16th drum roll across toms
          notes.push({ part: 'snare', time: mTime + 2.0 * beatSec, beat: m * 4 + 2.0 });
          notes.push({ part: 'tomHigh', time: mTime + 2.5 * beatSec, beat: m * 4 + 2.5 });
          notes.push({ part: 'tomLow', time: mTime + 3.0 * beatSec, beat: m * 4 + 3.0 });
          notes.push({ part: 'tomFloor', time: mTime + 3.5 * beatSec, beat: m * 4 + 3.5 });
          notes.push({ part: 'crash', time: mTime + 3.75 * beatSec, beat: m * 4 + 3.75 });
        }
      } else {
        // Master: Ultra dense double-bass kicks, polyrhythmic rides, flam accents, 32nd bursts
        for (let s = 0; s < 8; s++) {
          const partChoice: DrumPartId = isChorus ? (s % 2 === 0 ? 'ride' : 'crash') : 'hihatClosed';
          notes.push({ part: partChoice, time: mTime + s * 0.5 * beatSec, beat: m * 4 + s * 0.5 });
        }
        notes.push({ part: 'snare', time: mTime + beatSec, beat: m * 4 + 1 });
        notes.push({ part: 'snare', time: mTime + 3 * beatSec, beat: m * 4 + 3 });
        notes.push({ part: 'hihatOpen', time: mTime + 1.5 * beatSec, beat: m * 4 + 1.5 });
        notes.push({ part: 'kick', time: mTime + 0.75 * beatSec, beat: m * 4 + 0.75 });
        notes.push({ part: 'kick', time: mTime + 2.25 * beatSec, beat: m * 4 + 2.25 });
        notes.push({ part: 'kick', time: mTime + 2.75 * beatSec, beat: m * 4 + 2.75 });

        // Fast roll sections
        if (isFillTransition || isBridgeSolo) {
          notes.push({ part: 'snare', time: mTime + 2.0 * beatSec, beat: m * 4 + 2.0 });
          notes.push({ part: 'snare', time: mTime + 2.25 * beatSec, beat: m * 4 + 2.25 });
          notes.push({ part: 'tomHigh', time: mTime + 2.5 * beatSec, beat: m * 4 + 2.5 });
          notes.push({ part: 'tomHigh', time: mTime + 2.75 * beatSec, beat: m * 4 + 2.75 });
          notes.push({ part: 'tomLow', time: mTime + 3.0 * beatSec, beat: m * 4 + 3.0 });
          notes.push({ part: 'tomLow', time: mTime + 3.25 * beatSec, beat: m * 4 + 3.25 });
          notes.push({ part: 'tomFloor', time: mTime + 3.5 * beatSec, beat: m * 4 + 3.5 });
          notes.push({ part: 'tomFloor', time: mTime + 3.75 * beatSec, beat: m * 4 + 3.75 });
        }
      }
    } else if (baseBeatsPerMeasure === 3) {
      // 3/8 or 3/4 Waltz
      notes.push({ part: 'kick', time: mTime, beat: m * 3 });
      notes.push({ part: 'snare', time: mTime + beatSec, beat: m * 3 + 1 });
      notes.push({ part: 'snare', time: mTime + 2 * beatSec, beat: m * 3 + 2 });

      if (difficulty !== 'easy') {
        notes.push({ part: 'ride', time: mTime, beat: m * 3 });
        notes.push({ part: 'ride', time: mTime + beatSec, beat: m * 3 + 1 });
        notes.push({ part: 'ride', time: mTime + 2 * beatSec, beat: m * 3 + 2 });
      }

      if (difficulty === 'hard' || difficulty === 'master') {
        notes.push({ part: 'hihatClosed', time: mTime + 0.5 * beatSec, beat: m * 3 + 0.5 });
        notes.push({ part: 'hihatClosed', time: mTime + 1.5 * beatSec, beat: m * 3 + 1.5 });
        notes.push({ part: 'hihatOpen', time: mTime + 2.5 * beatSec, beat: m * 3 + 2.5 });

        if (isFillTransition) {
          notes.push({ part: 'tomHigh', time: mTime + beatSec, beat: m * 3 + 1 });
          notes.push({ part: 'tomLow', time: mTime + 1.5 * beatSec, beat: m * 3 + 1.5 });
          notes.push({ part: 'tomFloor', time: mTime + 2 * beatSec, beat: m * 3 + 2 });
        }
      }
    } else if (baseBeatsPerMeasure === 5) {
      // 5/8 Odd meter (3+2 or 2+3 feel)
      notes.push({ part: 'kick', time: mTime, beat: m * 5 });
      notes.push({ part: 'snare', time: mTime + 2 * beatSec, beat: m * 5 + 2 });
      notes.push({ part: 'kick', time: mTime + 3 * beatSec, beat: m * 5 + 3 });
      notes.push({ part: 'snare', time: mTime + 4 * beatSec, beat: m * 5 + 4 });

      if (difficulty !== 'easy') {
        for (let b = 0; b < 5; b++) {
          notes.push({ part: 'ride', time: mTime + b * beatSec, beat: m * 5 + b });
        }
      }

      if (difficulty === 'hard' || difficulty === 'master') {
        notes.push({ part: 'kick', time: mTime + 1.5 * beatSec, beat: m * 5 + 1.5 });
        notes.push({ part: 'tomHigh', time: mTime + 3.5 * beatSec, beat: m * 5 + 3.5 });
        if (isFillTransition) {
          notes.push({ part: 'tomLow', time: mTime + 4.0 * beatSec, beat: m * 5 + 4.0 });
          notes.push({ part: 'tomFloor', time: mTime + 4.5 * beatSec, beat: m * 5 + 4.5 });
          notes.push({ part: 'crash', time: mTime + 4.75 * beatSec, beat: m * 5 + 4.75 });
        }
      }
    } else if (baseBeatsPerMeasure === 6) {
      // 6/8 Latin samba / Afro groove
      notes.push({ part: 'kick', time: mTime, beat: m * 6 });
      notes.push({ part: 'snare', time: mTime + 3 * beatSec, beat: m * 6 + 3 });

      if (difficulty !== 'easy') {
        for (let b = 0; b < 6; b++) {
          notes.push({ part: 'hihatClosed', time: mTime + b * beatSec, beat: m * 6 + b });
        }
      }
      if (difficulty === 'hard' || difficulty === 'master') {
        notes.push({ part: 'kick', time: mTime + 1.5 * beatSec, beat: m * 6 + 1.5 });
        notes.push({ part: 'tomHigh', time: mTime + 2 * beatSec, beat: m * 6 + 2 });
        notes.push({ part: 'tomLow', time: mTime + 4 * beatSec, beat: m * 6 + 4 });
        notes.push({ part: 'kick', time: mTime + 4.5 * beatSec, beat: m * 6 + 4.5 });
        notes.push({ part: 'hihatOpen', time: mTime + 5.5 * beatSec, beat: m * 6 + 5.5 });
      }
    } else if (baseBeatsPerMeasure === 7) {
      // 7/8 Odd meter (2+2+3 or 3+2+2)
      notes.push({ part: 'kick', time: mTime, beat: m * 7 });
      notes.push({ part: 'snare', time: mTime + 2 * beatSec, beat: m * 7 + 2 });
      notes.push({ part: 'kick', time: mTime + 4 * beatSec, beat: m * 7 + 4 });
      notes.push({ part: 'snare', time: mTime + 5.5 * beatSec, beat: m * 7 + 5.5 });

      if (difficulty !== 'easy') {
        for (let b = 0; b < 7; b++) {
          notes.push({ part: 'ride', time: mTime + b * beatSec, beat: m * 7 + b });
        }
      }

      if (difficulty === 'hard' || difficulty === 'master') {
        notes.push({ part: 'hihatClosed', time: mTime + 1.0 * beatSec, beat: m * 7 + 1.0 });
        notes.push({ part: 'hihatClosed', time: mTime + 3.0 * beatSec, beat: m * 7 + 3.0 });
        notes.push({ part: 'tomHigh', time: mTime + 5.0 * beatSec, beat: m * 7 + 5.0 });
        notes.push({ part: 'tomFloor', time: mTime + 6.0 * beatSec, beat: m * 7 + 6.0 });
      }
    }
  }

  // Deduplicate and sort strictly by time
  const sorted = notes.sort((a, b) => a.time - b.time);
  return sorted;
}

export const SONGS: SongData[] = [
  {
    id: 'poko_pop',
    title: 'Poko-Poko Pop!',
    subtitle: 'ポコポコ・ポップ！',
    genre: 'J-POP / Energetic',
    bpm: 132,
    timeSignature: '4/4',
    duration: 36,
    colorTheme: 'from-amber-400 to-rose-500',
    previewColor: '#f59e0b',
    description: '弾むような明るいビート！初心者から上級者までノリノリで叩ける王道ポップス。',
    synthTheme: 'pop',
    difficulties: {
      easy: {
        notes: generateChart(132, 36, '4/4', 'easy'),
        starRating: 1,
        noteCount: generateChart(132, 36, '4/4', 'easy').length,
      },
      normal: {
        notes: generateChart(132, 36, '4/4', 'normal'),
        starRating: 2,
        noteCount: generateChart(132, 36, '4/4', 'normal').length,
      },
      hard: {
        notes: generateChart(132, 36, '4/4', 'hard'),
        starRating: 3,
        noteCount: generateChart(132, 36, '4/4', 'hard').length,
      },
      master: {
        notes: generateChart(132, 36, '4/4', 'master'),
        starRating: 5,
        noteCount: generateChart(132, 36, '4/4', 'master').length,
      },
    },
  },
  {
    id: 'hyper_galaxy',
    title: 'Hyper Beat Galaxy',
    subtitle: '超銀河ドラムバトル (変拍子 5/8 ⇄ 7/8)',
    genre: 'Odd-Meter Rush / BPM225',
    bpm: 225,
    timeSignature: '5/8',
    duration: 42,
    colorTheme: 'from-purple-500 via-pink-500 to-yellow-400',
    previewColor: '#d946ef',
    hasRhythmShift: true,
    description: '【超難関】BPM225の超高速空間！5/8拍子と7/8拍子が目まぐるしく変化する超絶ドラム！',
    synthTheme: 'galaxy',
    difficulties: {
      easy: {
        notes: generateChart(225, 42, '5/8', 'easy', { isOddMeter: true }),
        starRating: 3,
        noteCount: generateChart(225, 42, '5/8', 'easy', { isOddMeter: true }).length,
      },
      normal: {
        notes: generateChart(225, 42, '5/8', 'normal', { isOddMeter: true }),
        starRating: 5,
        noteCount: generateChart(225, 42, '5/8', 'normal', { isOddMeter: true }).length,
      },
      hard: {
        notes: generateChart(225, 42, '5/8', 'hard', { isOddMeter: true, hasFastRolls: true, hasRhythmChange: true }),
        starRating: 7,
        noteCount: generateChart(225, 42, '5/8', 'hard', { isOddMeter: true, hasFastRolls: true, hasRhythmChange: true }).length,
      },
      master: {
        notes: generateChart(225, 42, '5/8', 'master', { isOddMeter: true, hasFastRolls: true, hasRhythmChange: true }),
        starRating: 9,
        noteCount: generateChart(225, 42, '5/8', 'master', { isOddMeter: true, hasFastRolls: true, hasRhythmChange: true }).length,
      },
    },
  },
  {
    id: 'cyber_thunder',
    title: 'Cyber Thunder 210',
    subtitle: '超速BPM210 電脳ドラムンベース',
    genre: 'Drum & Bass / Ultra Fast',
    bpm: 210,
    timeSignature: '4/4',
    duration: 40,
    colorTheme: 'from-cyan-400 to-blue-600',
    previewColor: '#06b6d4',
    hasRhythmShift: true,
    description: 'BPM210の光速ドラム！怒涛の16分バスドラム連打と激しいタムロールを叩き込め！',
    synthTheme: 'cyber',
    difficulties: {
      easy: {
        notes: generateChart(210, 40, '4/4', 'easy'),
        starRating: 2,
        noteCount: generateChart(210, 40, '4/4', 'easy').length,
      },
      normal: {
        notes: generateChart(210, 40, '4/4', 'normal'),
        starRating: 4,
        noteCount: generateChart(210, 40, '4/4', 'normal').length,
      },
      hard: {
        notes: generateChart(210, 40, '4/4', 'hard', { hasFastRolls: true }),
        starRating: 6,
        noteCount: generateChart(210, 40, '4/4', 'hard', { hasFastRolls: true }).length,
      },
      master: {
        notes: generateChart(210, 40, '4/4', 'master', { hasFastRolls: true }),
        starRating: 8,
        noteCount: generateChart(210, 40, '4/4', 'master', { hasFastRolls: true }).length,
      },
    },
  },
  {
    id: 'choco_march',
    title: 'Choco Berry March',
    subtitle: 'チョコベリー・マーチ (4/4 ⇄ 3/4)',
    genre: 'Cute March / Kids Pop',
    bpm: 124,
    timeSignature: '4/4',
    duration: 35,
    colorTheme: 'from-pink-400 to-rose-400',
    previewColor: '#f472b6',
    description: 'お菓子たちがパレードで行進するかわいいマーチ！途中で3拍子にチェンジするよ♪',
    synthTheme: 'march',
    difficulties: {
      easy: {
        notes: generateChart(124, 35, '4/4', 'easy'),
        starRating: 1,
        noteCount: generateChart(124, 35, '4/4', 'easy').length,
      },
      normal: {
        notes: generateChart(124, 35, '4/4', 'normal'),
        starRating: 3,
        noteCount: generateChart(124, 35, '4/4', 'normal').length,
      },
      hard: {
        notes: generateChart(124, 35, '4/4', 'hard'),
        starRating: 4,
        noteCount: generateChart(124, 35, '4/4', 'hard').length,
      },
      master: {
        notes: generateChart(124, 35, '4/4', 'master'),
        starRating: 6,
        noteCount: generateChart(124, 35, '4/4', 'master').length,
      },
    },
  },
  {
    id: 'midnight_groove',
    title: 'Midnight Groove',
    subtitle: '真夜中のファンク',
    genre: 'Funk / Nu-Disco',
    bpm: 110,
    timeSignature: '4/4',
    duration: 38,
    colorTheme: 'from-indigo-500 to-purple-600',
    previewColor: '#818cf8',
    description: 'キレのあるハイハットとゴーストノートが心地よい16ビート・ファンク。',
    synthTheme: 'funk',
    difficulties: {
      easy: {
        notes: generateChart(110, 38, '4/4', 'easy'),
        starRating: 1,
        noteCount: generateChart(110, 38, '4/4', 'easy').length,
      },
      normal: {
        notes: generateChart(110, 38, '4/4', 'normal'),
        starRating: 3,
        noteCount: generateChart(110, 38, '4/4', 'normal').length,
      },
      hard: {
        notes: generateChart(110, 38, '4/4', 'hard'),
        starRating: 4,
        noteCount: generateChart(110, 38, '4/4', 'hard').length,
      },
      master: {
        notes: generateChart(110, 38, '4/4', 'master'),
        starRating: 6,
        noteCount: generateChart(110, 38, '4/4', 'master').length,
      },
    },
  },
  {
    id: 'waltz_3_8',
    title: 'Waltz in 3/8',
    subtitle: '踊る三拍子のワルツ',
    genre: 'Acoustic / 3拍子',
    bpm: 168,
    timeSignature: '3/8',
    duration: 36,
    colorTheme: 'from-emerald-400 to-teal-500',
    previewColor: '#10b981',
    description: '軽やかな3/8拍子リズム。ズン・チャッ・チャッのリズムを美しく刻もう！',
    synthTheme: 'waltz',
    difficulties: {
      easy: {
        notes: generateChart(168, 36, '3/8', 'easy'),
        starRating: 2,
        noteCount: generateChart(168, 36, '3/8', 'easy').length,
      },
      normal: {
        notes: generateChart(168, 36, '3/8', 'normal'),
        starRating: 3,
        noteCount: generateChart(168, 36, '3/8', 'normal').length,
      },
      hard: {
        notes: generateChart(168, 36, '3/8', 'hard'),
        starRating: 5,
        noteCount: generateChart(168, 36, '3/8', 'hard').length,
      },
      master: {
        notes: generateChart(168, 36, '3/8', 'master'),
        starRating: 7,
        noteCount: generateChart(168, 36, '3/8', 'master').length,
      },
    },
  },
  {
    id: 'latin_carnival',
    title: 'Latin Carnival',
    subtitle: '情熱のサンバ＆6/8',
    genre: 'Latin Samba / 6/8',
    bpm: 144,
    timeSignature: '6/8',
    duration: 38,
    colorTheme: 'from-orange-400 to-red-500',
    previewColor: '#f97316',
    description: '熱気あふれる6/8拍子カーニバル！タムの乱れ打ちとラテンパーカッションの饗宴。',
    synthTheme: 'latin',
    difficulties: {
      easy: {
        notes: generateChart(144, 38, '6/8', 'easy'),
        starRating: 2,
        noteCount: generateChart(144, 38, '6/8', 'easy').length,
      },
      normal: {
        notes: generateChart(144, 38, '6/8', 'normal'),
        starRating: 4,
        noteCount: generateChart(144, 38, '6/8', 'normal').length,
      },
      hard: {
        notes: generateChart(144, 38, '6/8', 'hard'),
        starRating: 6,
        noteCount: generateChart(144, 38, '6/8', 'hard').length,
      },
      master: {
        notes: generateChart(144, 38, '6/8', 'master'),
        starRating: 8,
        noteCount: generateChart(144, 38, '6/8', 'master').length,
      },
    },
  },
  {
    id: 'odd_metre',
    title: 'Odd Metre Drive',
    subtitle: '変拍子 7/8 プログ・ドライブ',
    genre: 'Prog Rock / 7/8拍子',
    bpm: 175,
    timeSignature: '7/8',
    duration: 38,
    colorTheme: 'from-fuchsia-500 to-pink-600',
    previewColor: '#d946ef',
    hasRhythmShift: true,
    description: 'トリッキーな7/8拍子！1小節7拍の変則リズムを完璧に捉えよう。',
    synthTheme: 'prog',
    difficulties: {
      easy: {
        notes: generateChart(175, 38, '7/8', 'easy'),
        starRating: 3,
        noteCount: generateChart(175, 38, '7/8', 'easy').length,
      },
      normal: {
        notes: generateChart(175, 38, '7/8', 'normal'),
        starRating: 5,
        noteCount: generateChart(175, 38, '7/8', 'normal').length,
      },
      hard: {
        notes: generateChart(175, 38, '7/8', 'hard'),
        starRating: 7,
        noteCount: generateChart(175, 38, '7/8', 'hard').length,
      },
      master: {
        notes: generateChart(175, 38, '7/8', 'master'),
        starRating: 9,
        noteCount: generateChart(175, 38, '7/8', 'master').length,
      },
    },
  },
];
