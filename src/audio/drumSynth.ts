import { DrumPartId, AmbiencePreset } from '../types';

class DrumSynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private drumGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Ambience Simulation Routing
  private directGain: GainNode | null = null;
  private ambienceConvolver: ConvolverNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private ambienceGain: GainNode | null = null;
  private currentAmbience: AmbiencePreset = 'vintage';

  // Hi-Hat Choke tracking
  private activeHiHatOpenGain: GainNode | null = null;
  private activeHiHatOpenTime: number = 0;

  public init() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.9;
      this.masterGain.connect(this.ctx.destination);

      // Drum master summing node
      this.drumGain = this.ctx.createGain();
      this.drumGain.gain.value = 0.95;

      // Direct Dry Mic Path
      this.directGain = this.ctx.createGain();
      this.directGain.gain.value = 1.0;
      this.drumGain.connect(this.directGain);
      this.directGain.connect(this.masterGain);

      // Studio Room Ambience Send Path
      try {
        this.ambienceConvolver = this.ctx.createConvolver();
        this.ambienceFilter = this.ctx.createBiquadFilter();
        this.ambienceFilter.type = 'lowpass';
        this.ambienceFilter.frequency.value = 6500;

        this.ambienceGain = this.ctx.createGain();
        this.ambienceGain.gain.value = 0.28; // Default to Vintage Room

        this.drumGain.connect(this.ambienceConvolver);
        this.ambienceConvolver.connect(this.ambienceFilter);
        this.ambienceFilter.connect(this.ambienceGain);
        this.ambienceGain.connect(this.masterGain);

        this.updateAmbienceImpulse();
      } catch (e) {
        console.warn('Convolver not supported in this environment', e);
      }

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

  // ==========================================
  // 4. STUDIO ROOM AMBIENCE SIMULATOR
  // ==========================================
  public setAmbiencePreset(preset: AmbiencePreset) {
    this.currentAmbience = preset;
    this.init();
    this.updateAmbienceImpulse();
  }

  public getAmbiencePreset(): AmbiencePreset {
    return this.currentAmbience;
  }

  private updateAmbienceImpulse() {
    if (!this.ctx || !this.ambienceConvolver || !this.ambienceGain || !this.directGain) return;

    if (this.currentAmbience === 'dead') {
      // Dead Studio: Tight 70s close mic, zero bleed, high punch
      this.directGain.gain.value = 1.05;
      this.ambienceGain.gain.value = 0.0;
      return;
    }

    if (this.currentAmbience === 'vintage') {
      // Vintage Room: Abbey Road / Led Zeppelin style warm analog room mic reflections
      this.directGain.gain.value = 0.95;
      this.ambienceGain.gain.value = 0.32;
      if (this.ambienceFilter) this.ambienceFilter.frequency.value = 5200;
      this.ambienceConvolver.buffer = this.buildRoomImpulse(0.42, 3.8, 18);
    } else if (this.currentAmbience === 'arena') {
      // Live Arena: Epic stadium concert gated reverberation
      this.directGain.gain.value = 0.88;
      this.ambienceGain.gain.value = 0.55;
      if (this.ambienceFilter) this.ambienceFilter.frequency.value = 9000;
      this.ambienceConvolver.buffer = this.buildRoomImpulse(1.6, 1.8, 45);
    }
  }

  // Procedural Room Impulse Response Generator
  private buildRoomImpulse(durationSec: number, decayRate: number, earlyReflections: number): AudioBuffer {
    if (!this.ctx) return {} as AudioBuffer;
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * durationSec);
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      // Exponential room decay
      const decay = Math.exp(-n * decayRate);
      // Diffuse noise reflections
      const noiseL = (Math.random() * 2 - 1) * decay;
      const noiseR = (Math.random() * 2 - 1) * decay;
      left[i] = noiseL;
      right[i] = noiseR;
    }

    // Discrete early reflections (wall bounces)
    for (let r = 0; r < earlyReflections; r++) {
      const tapIndex = Math.floor((Math.pow(r / earlyReflections, 1.3) * 0.18 + Math.random() * 0.02) * rate);
      if (tapIndex < length) {
        const amp = (0.7 - (r / earlyReflections) * 0.5) * (Math.random() > 0.5 ? 1 : -1);
        left[tapIndex] += amp;
        right[tapIndex] += amp * (Math.random() * 0.6 + 0.7);
      }
    }

    return impulse;
  }

  // Connects an audio node through a stereo panner into drumGain
  private connectWithPan(sourceGain: GainNode, panVal: number) {
    if (!this.ctx || !this.drumGain) return;
    try {
      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, panVal));
        sourceGain.connect(panner);
        panner.connect(this.drumGain);
        return;
      }
    } catch {}
    sourceGain.connect(this.drumGain);
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

  // ==========================================
  // 3. AUTHENTIC OPEN RIMSHOT
  // ==========================================
  public playRimshot(time?: number) {
    this.init();
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;
    const t = time !== undefined ? time : this.ctx.currentTime;

    // 1. Dual Harmonic Metal Hoop Ring (ダイキャストフープの高倍音共鳴)
    const rimOsc1 = this.ctx.createOscillator();
    const rimGain1 = this.ctx.createGain();
    rimOsc1.type = 'sine';
    rimOsc1.frequency.setValueAtTime(560, t); // Metallic fundamental
    rimOsc1.frequency.exponentialRampToValueAtTime(530, t + 0.08);

    rimGain1.gain.setValueAtTime(0.9, t);
    rimGain1.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    rimOsc1.connect(rimGain1);
    rimGain1.connect(this.drumGain);
    rimOsc1.start(t);
    rimOsc1.stop(t + 0.1);

    const rimOsc2 = this.ctx.createOscillator();
    const rimGain2 = this.ctx.createGain();
    rimOsc2.type = 'triangle';
    rimOsc2.frequency.setValueAtTime(920, t); // Metallic upper harmonic chime
    rimOsc2.frequency.exponentialRampToValueAtTime(840, t + 0.06);

    rimGain2.gain.setValueAtTime(0.65, t);
    rimGain2.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    rimOsc2.connect(rimGain2);
    rimGain2.connect(this.drumGain);
    rimOsc2.start(t);
    rimOsc2.stop(t + 0.08);

    // 2. Coated Center Head Impact Punch
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(240, t);
    bodyOsc.frequency.exponentialRampToValueAtTime(95, t + 0.07);

    bodyGain.gain.setValueAtTime(0.9, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.drumGain);
    bodyOsc.start(t);
    bodyOsc.stop(t + 0.12);

    // 3. Piercing High Transient Crack
    const crackSource = this.ctx.createBufferSource();
    crackSource.buffer = this.noiseBuffer;

    const crackFilter = this.ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(3800, t);
    crackFilter.Q.setValueAtTime(4.0, t);

    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(1.1, t);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    crackSource.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.drumGain);

    crackSource.start(t);
    crackSource.stop(t + 0.19);
  }

  // ==========================================
  // 1. HI-HAT CHOKE & PEDAL DAMPENING
  // ==========================================
  public chokeHiHat(time?: number) {
    this.init();
    if (!this.ctx || !this.drumGain) return;
    const t = time !== undefined ? time : this.ctx.currentTime;

    // Instantly mute any currently ringing open hi-hat (Choke action)
    if (this.activeHiHatOpenGain) {
      try {
        this.activeHiHatOpenGain.gain.cancelScheduledValues(t);
        this.activeHiHatOpenGain.gain.setValueAtTime(this.activeHiHatOpenGain.gain.value, t);
        this.activeHiHatOpenGain.gain.linearRampToValueAtTime(0.0001, t + 0.016);
      } catch {}
      this.activeHiHatOpenGain = null;
    }

    // Foot Pedal "Chick" Mechanical Sound
    if (this.noiseBuffer) {
      const pedalSource = this.ctx.createBufferSource();
      pedalSource.buffer = this.noiseBuffer;

      const pedalFilter = this.ctx.createBiquadFilter();
      pedalFilter.type = 'bandpass';
      pedalFilter.frequency.setValueAtTime(6200, t);
      pedalFilter.Q.setValueAtTime(4.5, t);

      const pedalGain = this.ctx.createGain();
      pedalGain.gain.setValueAtTime(0.45, t);
      pedalGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      pedalSource.connect(pedalFilter);
      pedalFilter.connect(pedalGain);
      pedalGain.connect(this.drumGain);

      pedalSource.start(t);
      pedalSource.stop(t + 0.04);
    }
  }

  public playHiHatClosed(time?: number) {
    this.init();
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;
    const t = time !== undefined ? time : this.ctx.currentTime;

    // Real drum physics: hitting closed hat chokes any ringing open hat
    this.chokeHiHat(t);

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(8500, t);
    filter.Q.setValueAtTime(3.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.72, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);

    source.start(t);
    source.stop(t + 0.06);
  }

  public playHiHatOpen(time?: number) {
    this.init();
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;
    const t = time !== undefined ? time : this.ctx.currentTime;

    // Cancel prior open ring if retriggered
    this.chokeHiHat(t);

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);

    this.activeHiHatOpenGain = gain;
    this.activeHiHatOpenTime = t;

    source.start(t);
    source.stop(t + 0.48);
  }

  public playHiHatHalfOpen(time?: number) {
    this.init();
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;
    const t = time !== undefined ? time : this.ctx.currentTime;

    this.chokeHiHat(t);

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    // Half-open sizzle frequency
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(7800, t);
    filter.Q.setValueAtTime(2.2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.78, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22); // Medium sizzle decay

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);

    this.activeHiHatOpenGain = gain;
    this.activeHiHatOpenTime = t;

    source.start(t);
    source.stop(t + 0.24);
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
