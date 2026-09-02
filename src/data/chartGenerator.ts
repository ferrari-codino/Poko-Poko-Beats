import { SongData, DrumPartId, RhythmNote, Difficulty, SongCategory, SynthTheme } from '../types';

export function generateChart(
  bpm: number,
  durationSec: number,
  timeSignature: string = '4/4',
  difficulty: Difficulty,
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

export interface SongDefinition {
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  category: SongCategory;
  bpm: number;
  timeSignature?: string;
  duration?: number;
  colorTheme?: string;
  previewColor?: string;
  description: string;
  synthTheme: SynthTheme;
  hasRhythmShift?: boolean;
  ratings?: { easy?: number; normal?: number; hard?: number; master?: number };
}

export function createSong(def: SongDefinition): SongData {
  const timeSignature = def.timeSignature || '4/4';
  const duration = def.duration || 36;
  const bpm = def.bpm;

  const easyNotes = generateChart(bpm, duration, timeSignature, 'easy');
  const normalNotes = generateChart(bpm, duration, timeSignature, 'normal');
  const hardNotes = generateChart(bpm, duration, timeSignature, 'hard');
  const masterNotes = generateChart(bpm, duration, timeSignature, 'master');

  // Calculate default star ratings based on tempo and meter complexity if not explicitly provided
  const speedFactor = Math.min(3, Math.max(0, Math.floor((bpm - 100) / 40)));
  const meterFactor = timeSignature !== '4/4' ? 1 : 0;

  const easyStars = Math.min(5, Math.max(1, (def.ratings?.easy ?? (1 + meterFactor))));
  const normalStars = Math.min(7, Math.max(2, (def.ratings?.normal ?? (3 + speedFactor + meterFactor))));
  const hardStars = Math.min(9, Math.max(4, (def.ratings?.hard ?? (5 + speedFactor + meterFactor))));
  const masterStars = Math.min(10, Math.max(6, (def.ratings?.master ?? (7 + speedFactor + meterFactor))));

  return {
    id: def.id,
    title: def.title,
    subtitle: def.subtitle,
    genre: def.genre,
    category: def.category,
    bpm: def.bpm,
    timeSignature,
    duration,
    colorTheme: def.colorTheme || 'from-indigo-500 to-purple-600',
    previewColor: def.previewColor || '#6366f1',
    description: def.description,
    hasRhythmShift: def.hasRhythmShift ?? (timeSignature !== '4/4' || bpm >= 200),
    synthTheme: def.synthTheme,
    difficulties: {
      easy: {
        notes: easyNotes,
        starRating: easyStars,
        noteCount: easyNotes.length,
      },
      normal: {
        notes: normalNotes,
        starRating: normalStars,
        noteCount: normalNotes.length,
      },
      hard: {
        notes: hardNotes,
        starRating: hardStars,
        noteCount: hardNotes.length,
      },
      master: {
        notes: masterNotes,
        starRating: masterStars,
        noteCount: masterNotes.length,
      },
    },
  };
}
