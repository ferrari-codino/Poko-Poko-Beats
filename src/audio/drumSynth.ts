import { DrumPartId } from '../types';

class DrumSynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private drumGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  public init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.9;
      this.masterGain.connect(this.ctx.destination);

      this.drumGain = this.ctx.createGain();
      this.drumGain.gain.value = 0.95;
      this.drumGain.connect(this.masterGain);

      this.generateNoiseBuffer();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public setVolumes(master: number, drum: number) {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, master));
    if (this.drumGain) this.drumGain.gain.value = Math.max(0, Math.min(1, drum));
  }

  private generateNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public playDrum(part: DrumPartId, time?: number) {
    this.init();
    if (!this.ctx || !this.drumGain) return;
    const t = time !== undefined ? time : this.ctx.currentTime;

    switch (part) {
      case 'kick':
        this.playKick(t);
        break;
      case 'snare':
        this.playSnare(t);
        break;
      case 'hihatClosed':
        this.playHiHatClosed(t);
        break;
      case 'hihatOpen':
        this.playHiHatOpen(t);
        break;
      case 'tomHigh':
        this.playTom(t, 220, 130, 0.22);
        break;
      case 'tomLow':
        this.playTom(t, 160, 95, 0.26);
        break;
      case 'tomFloor':
        this.playTom(t, 110, 60, 0.32);
        break;
      case 'crash':
        this.playCrash(t);
        break;
      case 'ride':
        this.playRide(t);
        break;
    }
  }

  private playKick(t: number) {
    if (!this.ctx || !this.drumGain) return;

    // Body sub-bass pitch drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);

    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.drumGain);

    osc.start(t);
    osc.stop(t + 0.36);

    // Click transient
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(300, t);
    clickOsc.frequency.exponentialRampToValueAtTime(50, t + 0.02);

    clickGain.gain.setValueAtTime(0.6, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    clickOsc.connect(clickGain);
    clickGain.connect(this.drumGain);

    clickOsc.start(t);
    clickOsc.stop(t + 0.03);
  }

  private playSnare(t: number) {
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;

    // 1. Tonal body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(195, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.09);

    oscGain.gain.setValueAtTime(0.7, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.drumGain);
    osc.start(t);
    osc.stop(t + 0.13);

    // 2. Snappy wire noise
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1200, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.85, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.drumGain);

    noiseSource.start(t);
    noiseSource.stop(t + 0.23);
  }

  private playHiHatClosed(t: number) {
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(8500, t);
    filter.Q.setValueAtTime(3.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);

    source.start(t);
    source.stop(t + 0.06);
  }

  private playHiHatOpen(t: number) {
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);

    source.start(t);
    source.stop(t + 0.4);
  }

  private playTom(t: number, startFreq: number, endFreq: number, duration: number) {
    if (!this.ctx || !this.drumGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration * 0.7);

    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.drumGain);

    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  private playCrash(t: number) {
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;

    // Metallic shimmer
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4500, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.95, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);

    source.start(t);
    source.stop(t + 1.25);
  }

  private playRide(t: number) {
    if (!this.ctx || !this.drumGain) return;

    // Bell ping
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1450, t);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.drumGain);

    osc.start(t);
    osc.stop(t + 0.62);

    // Subtle metallic noise
    if (this.noiseBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(7500, t);
      filter.Q.setValueAtTime(4, t);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.3, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      source.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.drumGain);

      source.start(t);
      source.stop(t + 0.42);
    }
  }

  public playGuideClick(t: number, isAccent: boolean) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(isAccent ? 1400 : 900, t);

    gain.gain.setValueAtTime(isAccent ? 0.35 : 0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  public playSparkleChime(time?: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = time !== undefined ? time : this.ctx.currentTime;

    const notes = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.035);

      gain.gain.setValueAtTime(0.12, t + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.035 + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.035);
      osc.stop(t + idx * 0.035 + 0.2);
    });
  }
}

export const drumSynth = new DrumSynthEngine();
