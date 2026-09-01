import { SongData, Difficulty, RhythmNote } from '../types';
import { drumSynth } from './drumSynth';

interface ScheduledNote {
  note: RhythmNote;
  scheduledTime: number;
}

class MusicEngine {
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private isPaused: boolean = false;
  private currentSong: SongData | null = null;
  private currentDifficulty: Difficulty = 'normal';
  private scheduledNotes: ScheduledNote[] = [];
  private synthNodes: { stop: () => void }[] = [];
  private animationFrameId: number | null = null;
  private onTimeUpdateCallback: ((time: number, progress: number) => void) | null = null;
  private onSongEndCallback: (() => void) | null = null;
  private bgmGain: GainNode | null = null;

  public init() {
    drumSynth.init();
    const ctx = drumSynth.getContext();
    if (ctx && !this.bgmGain) {
      this.bgmGain = ctx.createGain();
      this.bgmGain.gain.value = 0.8;
      this.bgmGain.connect(ctx.destination);
    }
  }

  public setBgmVolume(val: number) {
    if (this.bgmGain) {
      this.bgmGain.gain.value = Math.max(0, Math.min(1, val));
    }
  }

  public startSong(
    song: SongData,
    difficulty: Difficulty,
    onTimeUpdate: (time: number, progress: number) => void,
    onSongEnd: () => void,
    offsetSeconds: number = 0
  ) {
    this.init();
    const ctx = drumSynth.getContext();
    if (!ctx) return;

    this.stop();

    this.currentSong = song;
    this.currentDifficulty = difficulty;
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onSongEndCallback = onSongEnd;
    this.isPlaying = true;
    this.isPaused = false;

    // Start with a small lookahead buffer (0.15s) for audio pipeline stabilization
    const startAudioTime = ctx.currentTime + 0.15;
    this.startTime = startAudioTime;

    // Schedule backing music track
    this.scheduleBackingTrack(song, startAudioTime);

    // Schedule guide clicks & drum notes for the song
    const notes = song.difficulties[difficulty].notes.map((n, i) => ({
      ...n,
      id: `note-${i}-${n.part}-${n.time}`,
      hit: false,
      missed: false,
    }));

    this.scheduledNotes = notes.map((n) => ({
      note: n,
      scheduledTime: n.time,
    }));

    this.startTickLoop(song.duration);
  }

  public getCurrentTime(): number {
    const ctx = drumSynth.getContext();
    if (!ctx || !this.isPlaying) return 0;
    if (this.isPaused) return this.pauseTime;
    const elapsed = ctx.currentTime - this.startTime;
    return Math.max(0, elapsed);
  }

  public pause() {
    if (!this.isPlaying || this.isPaused) return;
    this.isPaused = true;
    this.pauseTime = this.getCurrentTime();
    this.clearAllSynths();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resume() {
    if (!this.isPlaying || !this.isPaused || !this.currentSong) return;
    const ctx = drumSynth.getContext();
    if (!ctx) return;

    this.isPaused = false;
    this.startTime = ctx.currentTime - this.pauseTime;
    
    // Reschedule remaining backing track from current time
    this.scheduleBackingTrack(this.currentSong, this.startTime, this.pauseTime);
    this.startTickLoop(this.currentSong.duration);
  }

  public stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.clearAllSynths();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.scheduledNotes = [];
    this.currentSong = null;
  }

  private clearAllSynths() {
    this.synthNodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        // Ignore already stopped nodes
      }
    });
    this.synthNodes = [];
  }

  private startTickLoop(duration: number) {
    const tick = () => {
      if (!this.isPlaying || this.isPaused) return;

      const currentTime = this.getCurrentTime();
      const progress = Math.min(1, currentTime / duration);

      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(currentTime, progress);
      }

      if (currentTime >= duration + 0.5) {
        this.isPlaying = false;
        if (this.onSongEndCallback) {
          this.onSongEndCallback();
        }
        return;
      }

      this.animationFrameId = requestAnimationFrame(tick);
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  // Generates procedurally rich musical backing tracks matching song genre and tempo!
  private scheduleBackingTrack(song: SongData, audioStartTime: number, startOffset: number = 0) {
    const ctx = drumSynth.getContext();
    if (!ctx || !this.bgmGain) return;

    const bpm = song.bpm;
    const beatSec = 60 / bpm;
    const totalDuration = song.duration;

    // Musical chord progression bases by theme
    const progressions: Record<string, { chords: number[][]; bassline: number[]; melody: number[] }> = {
      pop: {
        // C - G - Am - F progression (frequencies in Hz)
        chords: [
          [261.63, 329.63, 392.00], // C
          [196.00, 246.94, 293.66], // G
          [220.00, 261.63, 329.63], // Am
          [174.61, 220.00, 261.63], // F
        ],
        bassline: [65.41, 49.00, 55.00, 43.65],
        melody: [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 392.00],
      },
      funk: {
        // Em9 - A13 groove
        chords: [
          [164.81, 196.00, 246.94, 293.66, 329.63], // Em7/9
          [174.61, 220.00, 261.63, 329.63], // Fmaj7
          [164.81, 196.00, 246.94, 293.66], // Em7
          [220.00, 277.18, 329.63, 392.00], // A7
        ],
        bassline: [41.20, 43.65, 41.20, 55.00],
        melody: [329.63, 392.00, 440.00, 493.88, 587.33, 493.88, 440.00, 392.00],
      },
      waltz: {
        // 3/8 playful waltz (A minor / D minor / E7)
        chords: [
          [220.00, 261.63, 329.63], // Am
          [293.66, 349.23, 440.00], // Dm
          [164.81, 207.65, 246.94], // E
          [220.00, 261.63, 329.63], // Am
        ],
        bassline: [55.00, 73.42, 41.20, 55.00],
        melody: [440.00, 523.25, 659.25, 587.33, 523.25, 440.00],
      },
      cyber: {
        // Fast energetic synthwave / D&B (F#m - D - E - C#m)
        chords: [
          [185.00, 220.00, 277.18], // F#m
          [146.83, 185.00, 220.00], // D
          [164.81, 207.65, 246.94], // E
          [138.59, 174.61, 207.65], // C#m
        ],
        bassline: [46.25, 36.71, 41.20, 34.65],
        melody: [740.00, 880.00, 1108.73, 987.77, 880.00, 740.00, 659.25, 554.37],
      },
      latin: {
        // 6/8 Latin samba / Afro-Cuban groove (Gm - Cm - D7)
        chords: [
          [196.00, 233.08, 293.66], // Gm
          [261.63, 311.13, 392.00], // Cm
          [293.66, 369.99, 440.00], // D7
          [196.00, 233.08, 293.66], // Gm
        ],
        bassline: [49.00, 65.41, 73.42, 49.00],
        melody: [392.00, 466.16, 587.33, 523.25, 466.16, 392.00],
      },
      prog: {
        // 7/8 Odd meter prog rock (B minor modal)
        chords: [
          [246.94, 293.66, 369.99], // Bm
          [220.00, 277.18, 329.63], // A
          [196.00, 246.94, 293.66], // G
          [185.00, 233.08, 277.18], // F#
        ],
        bassline: [61.74, 55.00, 49.00, 46.25],
        melody: [493.88, 554.37, 587.33, 739.99, 659.25, 587.33, 493.88],
      },
      galaxy: {
        // Fast 5/8 space rush (D minor / Bb / C / A7)
        chords: [
          [293.66, 349.23, 440.00], // Dm
          [233.08, 293.66, 349.23], // Bb
          [261.63, 329.63, 392.00], // C
          [220.00, 277.18, 329.63], // A
        ],
        bassline: [73.42, 58.27, 65.41, 55.00],
        melody: [587.33, 698.46, 880.00, 783.99, 698.46, 880.00, 1046.50, 880.00],
      },
      march: {
        // Cheerful kids march (G major - C - D - G)
        chords: [
          [196.00, 246.94, 293.66], // G
          [261.63, 329.63, 392.00], // C
          [293.66, 369.99, 440.00], // D
          [196.00, 246.94, 293.66], // G
        ],
        bassline: [49.00, 65.41, 73.42, 49.00],
        melody: [392.00, 493.88, 587.33, 659.25, 587.33, 493.88, 392.00, 293.66],
      },
    };

    const theme = progressions[song.synthTheme] || progressions.pop;
    const beatsPerMeasure = song.timeSignature.startsWith('3') ? 3 : song.timeSignature.startsWith('6') ? 6 : song.timeSignature.startsWith('7') ? 7 : 4;
    const measureDuration = beatSec * beatsPerMeasure;
    const numMeasures = Math.ceil(totalDuration / measureDuration) + 1;

    for (let m = 0; m < numMeasures; m++) {
      const measureStartTime = m * measureDuration;
      if (measureStartTime + measureDuration < startOffset) continue;

      const chordIndex = m % theme.chords.length;
      const currentChord = theme.chords[chordIndex];
      const rootBass = theme.bassline[chordIndex];

      // Schedule Bassline
      const bassTimes = beatsPerMeasure === 3
        ? [0, 1 * beatSec, 2 * beatSec]
        : beatsPerMeasure === 6
        ? [0, 1.5 * beatSec, 3 * beatSec, 4.5 * beatSec]
        : beatsPerMeasure === 7
        ? [0, 2 * beatSec, 4 * beatSec, 5.5 * beatSec]
        : [0, 0.75 * beatSec, 1.5 * beatSec, 2.5 * beatSec, 3.25 * beatSec];

      bassTimes.forEach((bOffset) => {
        const noteSongTime = measureStartTime + bOffset;
        if (noteSongTime < startOffset || noteSongTime >= totalDuration) return;
        const targetCtxTime = audioStartTime + noteSongTime;

        this.synthesizeSynthBass(targetCtxTime, rootBass, beatSec * 0.7);
      });

      // Schedule Polyphonic Chord Stabs
      const chordTimes = beatsPerMeasure === 3
        ? [0, beatSec, 2 * beatSec]
        : beatsPerMeasure === 6
        ? [0, 3 * beatSec]
        : beatsPerMeasure === 7
        ? [0, 2 * beatSec, 4 * beatSec]
        : [0.5 * beatSec, 1.5 * beatSec, 2.5 * beatSec, 3.5 * beatSec];

      chordTimes.forEach((cOffset) => {
        const noteSongTime = measureStartTime + cOffset;
        if (noteSongTime < startOffset || noteSongTime >= totalDuration) return;
        const targetCtxTime = audioStartTime + noteSongTime;

        currentChord.forEach((freq) => {
          this.synthesizeChordTone(targetCtxTime, freq, beatSec * 0.45);
        });
      });

      // Schedule Synth Melody Arpeggio
      const melodySubdivisions = beatsPerMeasure === 3 ? 3 : beatsPerMeasure === 6 ? 6 : beatsPerMeasure === 7 ? 7 : 8;
      const subDuration = measureDuration / melodySubdivisions;

      for (let s = 0; s < melodySubdivisions; s++) {
        const noteSongTime = measureStartTime + s * subDuration;
        if (noteSongTime < startOffset || noteSongTime >= totalDuration) continue;
        const targetCtxTime = audioStartTime + noteSongTime;

        const melodyFreq = theme.melody[(m * melodySubdivisions + s) % theme.melody.length];
        this.synthesizeLeadNote(targetCtxTime, melodyFreq, subDuration * 0.6);
      }
    }
  }

  private synthesizeSynthBass(targetTime: number, freq: number, duration: number) {
    const ctx = drumSynth.getContext();
    if (!ctx || !this.bgmGain) return;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, targetTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, targetTime);
    filter.frequency.exponentialRampToValueAtTime(120, targetTime + duration);

    gain.gain.setValueAtTime(0.35, targetTime);
    gain.gain.exponentialRampToValueAtTime(0.001, targetTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(targetTime);
    osc.stop(targetTime + duration + 0.05);

    this.synthNodes.push({
      stop: () => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      },
    });
  }

  private synthesizeChordTone(targetTime: number, freq: number, duration: number) {
    const ctx = drumSynth.getContext();
    if (!ctx || !this.bgmGain) return;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, targetTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, targetTime);

    gain.gain.setValueAtTime(0.18, targetTime);
    gain.gain.exponentialRampToValueAtTime(0.001, targetTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(targetTime);
    osc.stop(targetTime + duration + 0.05);

    this.synthNodes.push({
      stop: () => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      },
    });
  }

  private synthesizeLeadNote(targetTime: number, freq: number, duration: number) {
    const ctx = drumSynth.getContext();
    if (!ctx || !this.bgmGain) return;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, targetTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.5, targetTime);
    filter.Q.value = 1.2;

    gain.gain.setValueAtTime(0.12, targetTime);
    gain.gain.exponentialRampToValueAtTime(0.001, targetTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(targetTime);
    osc.stop(targetTime + duration + 0.05);

    this.synthNodes.push({
      stop: () => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      },
    });
  }
}

export const musicEngine = new MusicEngine();
