import { DrumPartId, AmbiencePreset, CustomDrumKit, ShellMaterial, DrumHeadStyle, HardwareFinish, CymbalFinish } from '../types';

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

  // Crash Cymbal Choke tracking
  private activeCrashGain: GainNode | null = null;

  // Material & Pro Acoustic Customization State
  private activeCustomKit: CustomDrumKit | null = null;
  private moongelDamping: boolean = false; // Blue Moongel damper on snare & toms
  private sympatheticBuzzEnabled: boolean = true; // Realistic snare wire vibration when kick/toms are struck
  private lastSnareBuzzTime: number = 0;

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

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
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

  // ==========================================
  // PRO DRUMMER SETTINGS & ACCESSORS
  // ==========================================
  public setCustomKit(kit: CustomDrumKit | null) {
    this.activeCustomKit = kit;
  }

  public getCustomKit(): CustomDrumKit | null {
    return this.activeCustomKit;
  }

  public setMoongelDamping(enabled: boolean) {
    this.moongelDamping = enabled;
  }

  public isMoongelDamped(): boolean {
    return this.moongelDamping;
  }

  public setSympatheticBuzz(enabled: boolean) {
    this.sympatheticBuzzEnabled = enabled;
  }

  public isSympatheticBuzz(): boolean {
    return this.sympatheticBuzzEnabled;
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
        this.playTom(t, 220, 130, 0.22, 'tomHigh');
        break;
      case 'tomLow':
        this.playTom(t, 160, 95, 0.26, 'tomLow');
        break;
      case 'tomFloor':
        this.playTom(t, 110, 60, 0.32, 'tomFloor');
        break;
      case 'crash':
        this.playCrash(t);
        break;
      case 'ride':
        this.playRide(t);
        break;
    }
  }

  // ==========================================
  // 1. ACOUSTIC KICK SYNTHESIS (MATERIAL-AWARE)
  // ==========================================
  private playKick(t: number) {
    if (!this.ctx || !this.drumGain) return;

    const shell = this.activeCustomKit?.shellMaterial || 'maple';
    const head = this.activeCustomKit?.headStyle || 'coatedWhite';

    // Shell acoustics modifier
    let baseStartFreq = 140;
    let baseEndFreq = 38;
    let kickDecay = 0.35;
    let clickFreq = 320;
    let clickAmp = 0.6;
    let punchGain = 1.0;

    if (shell === 'birch') {
      baseStartFreq = 145;
      baseEndFreq = 34; // Deep sub punch
      kickDecay = 0.29; // Tight studio decay
      clickFreq = 480; // Sharp beater click
      clickAmp = 0.75;
      punchGain = 1.1;
    } else if (shell === 'acrylic') {
      baseStartFreq = 165;
      baseEndFreq = 32; // Massive sub drop
      kickDecay = 0.26; // Punchy & dry
      clickFreq = 520;
      clickAmp = 0.85;
      punchGain = 1.25;
    } else if (shell === 'brass') {
      baseStartFreq = 135;
      baseEndFreq = 42;
      kickDecay = 0.42; // Resonant sustain
      clickFreq = 620; // Metallic beater tap
      clickAmp = 0.65;
      punchGain = 1.05;
    } else if (shell === 'carbon') {
      baseStartFreq = 150;
      baseEndFreq = 30; // Ultra low-end sub
      kickDecay = 0.30;
      clickFreq = 680; // Modern hi-fi transient
      clickAmp = 0.9;
      punchGain = 1.2;
    }

    // Head damping modifier
    if (head === 'hydraulicBlue') {
      kickDecay *= 0.65; // Ultra-damped 70s fat thump
      punchGain *= 1.15;
    } else if (head === 'clearEbony') {
      clickAmp *= 1.25; // Plastic click attack
    } else if (head === 'vintage') {
      baseEndFreq *= 0.95; // Warm round fundamental
      kickDecay *= 1.1;
    }

    // Body sub-bass pitch drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseStartFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseEndFreq, t + 0.12);

    gain.gain.setValueAtTime(punchGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + kickDecay);

    osc.connect(gain);
    gain.connect(this.drumGain);

    osc.start(t);
    osc.stop(t + kickDecay + 0.01);

    // Beater transient click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(clickFreq, t);
    clickOsc.frequency.exponentialRampToValueAtTime(50, t + 0.02);

    clickGain.gain.setValueAtTime(clickAmp, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    clickOsc.connect(clickGain);
    clickGain.connect(this.drumGain);

    clickOsc.start(t);
    clickOsc.stop(t + 0.03);

    // PRO REALISM: Sympathetic Snare Wire Buzz triggered by heavy kick vibration!
    if (this.sympatheticBuzzEnabled) {
      this.triggerSympatheticSnareBuzz(t, 0.22);
    }
  }

  // ==========================================
  // 2. ACOUSTIC SNARE SYNTHESIS (MATERIAL-AWARE)
  // ==========================================
  private playSnare(t: number, velocity: number = 1.0) {
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;

    const shell = this.activeCustomKit?.shellMaterial || 'maple';
    const head = this.activeCustomKit?.headStyle || 'coatedWhite';

    // Acoustic parameters
    let bodyFreq = 195;
    let bodyDecay = 0.13;
    let noiseCutoff = 1200;
    let noiseDecay = 0.22;
    let bodyGainVal = 0.7 * velocity;
    let wireGainVal = 0.85 * velocity;
    let ringFreq = 0;
    let ringDecay = 0;

    if (shell === 'birch') {
      bodyFreq = 205;
      noiseCutoff = 1550; // Crisper, cutting wire snap
      noiseDecay = 0.18; // Focused recording decay
      bodyGainVal = 0.75 * velocity;
    } else if (shell === 'acrylic') {
      bodyFreq = 210;
      noiseCutoff = 1800; // Loud, aggressive snap
      bodyDecay = 0.11;
      noiseDecay = 0.16; // Short & dry
      bodyGainVal = 0.85 * velocity;
      wireGainVal = 0.95 * velocity;
    } else if (shell === 'brass') {
      bodyFreq = 190;
      noiseCutoff = 1350;
      bodyDecay = 0.16;
      noiseDecay = 0.26;
      ringFreq = 1260; // Metal shell harmonic ring
      ringDecay = 0.24;
    } else if (shell === 'carbon') {
      bodyFreq = 215;
      noiseCutoff = 2200; // Ultra-fast hi-fi snap
      bodyDecay = 0.10;
      noiseDecay = 0.17;
      bodyGainVal = 0.8 * velocity;
      wireGainVal = 1.0 * velocity;
    }

    // Head style modifier
    if (head === 'hydraulicBlue') {
      noiseCutoff = 900; // Muffled dark crack
      noiseDecay *= 0.6;
      bodyDecay *= 0.75;
      ringFreq = 0; // Completely kills shell ring
    } else if (head === 'clearEbony') {
      noiseCutoff += 400; // Bright slap
      bodyFreq += 10;
    } else if (head === 'vintage') {
      bodyFreq -= 12; // Deep, fat calfskin tone
      noiseCutoff = 1050;
    }

    // PRO REALISM: Moongel Damper (Blue Gel Patch on Snare Head)
    if (this.moongelDamping) {
      noiseDecay *= 0.55; // Kills unwanted ring immediately
      bodyDecay *= 0.65;
      ringFreq = 0; // Moongel absorbs high-frequency hoop ring
    }

    // 1. Tonal body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(bodyFreq, t);
    osc.frequency.exponentialRampToValueAtTime(bodyFreq * 0.46, t + bodyDecay * 0.7);

    oscGain.gain.setValueAtTime(bodyGainVal, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + bodyDecay);

    osc.connect(oscGain);
    oscGain.connect(this.drumGain);
    osc.start(t);
    osc.stop(t + bodyDecay + 0.01);

    // 2. Brass shell harmonic ring (if metal shell)
    if (ringFreq > 0) {
      const ringOsc = this.ctx.createOscillator();
      const rGain = this.ctx.createGain();
      ringOsc.type = 'sine';
      ringOsc.frequency.setValueAtTime(ringFreq, t);
      ringOsc.frequency.exponentialRampToValueAtTime(ringFreq * 0.98, t + ringDecay);

      rGain.gain.setValueAtTime(0.22 * velocity, t);
      rGain.gain.exponentialRampToValueAtTime(0.001, t + ringDecay);

      ringOsc.connect(rGain);
      rGain.connect(this.drumGain);
      ringOsc.start(t);
      ringOsc.stop(t + ringDecay + 0.01);
    }

    // 3. Snappy wire noise
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(noiseCutoff, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(wireGainVal, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + noiseDecay);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.drumGain);

    noiseSource.start(t);
    noiseSource.stop(t + noiseDecay + 0.01);
  }

  // ==========================================
  // 3. AUTHENTIC OPEN RIMSHOT
  // ==========================================
  public playRimshot(time?: number) {
    this.init();
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;
    const t = time !== undefined ? time : this.ctx.currentTime;

    const shell = this.activeCustomKit?.shellMaterial || 'maple';
    const hw = this.activeCustomKit?.hardwareFinish || 'chrome';

    let rimHarmonic = 560;
    let rimRingDecay = 0.12;
    if (hw === 'blackNickel') {
      rimHarmonic = 520;
      rimRingDecay = 0.09;
    } else if (hw === 'gold') {
      rimHarmonic = 610;
      rimRingDecay = 0.16;
    }

    if (shell === 'brass') {
      rimRingDecay += 0.06;
    }

    // Moongel control
    if (this.moongelDamping) {
      rimRingDecay *= 0.6;
    }

    // 1. Dual Harmonic Metal Hoop Ring (ダイキャストフープの高倍音共鳴)
    const rimOsc1 = this.ctx.createOscillator();
    const rimGain1 = this.ctx.createGain();
    rimOsc1.type = 'sine';
    rimOsc1.frequency.setValueAtTime(rimHarmonic, t);
    rimOsc1.frequency.exponentialRampToValueAtTime(rimHarmonic * 0.94, t + rimRingDecay);

    rimGain1.gain.setValueAtTime(0.95, t);
    rimGain1.gain.exponentialRampToValueAtTime(0.001, t + rimRingDecay);

    rimOsc1.connect(rimGain1);
    rimGain1.connect(this.drumGain);
    rimOsc1.start(t);
    rimOsc1.stop(t + rimRingDecay + 0.01);

    const rimOsc2 = this.ctx.createOscillator();
    const rimGain2 = this.ctx.createGain();
    rimOsc2.type = 'triangle';
    rimOsc2.frequency.setValueAtTime(rimHarmonic * 1.64, t);
    rimOsc2.frequency.exponentialRampToValueAtTime(rimHarmonic * 1.5, t + 0.07);

    rimGain2.gain.setValueAtTime(0.7, t);
    rimGain2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    rimOsc2.connect(rimGain2);
    rimGain2.connect(this.drumGain);
    rimOsc2.start(t);
    rimOsc2.stop(t + 0.09);

    // 2. Center Head Impact Punch
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(250, t);
    bodyOsc.frequency.exponentialRampToValueAtTime(95, t + 0.08);

    bodyGain.gain.setValueAtTime(0.95, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.drumGain);
    bodyOsc.start(t);
    bodyOsc.stop(t + 0.13);

    // 3. Piercing High Transient Crack
    const crackSource = this.ctx.createBufferSource();
    crackSource.buffer = this.noiseBuffer;

    const crackFilter = this.ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(3900, t);
    crackFilter.Q.setValueAtTime(4.0, t);

    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(1.15, t);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);

    crackSource.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.drumGain);

    crackSource.start(t);
    crackSource.stop(t + 0.20);
  }

  // ==========================================
  // 4. PRO REALISM: CLOSED RIMSHOT (CROSS-STICK)
  // ==========================================
  public playCrossStick(time?: number) {
    this.init();
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;
    const t = time !== undefined ? time : this.ctx.currentTime;

    // 1. High wooden click transient (Stick hitting die-cast hoop)
    const woodOsc = this.ctx.createOscillator();
    const woodGain = this.ctx.createGain();
    woodOsc.type = 'triangle';
    woodOsc.frequency.setValueAtTime(1850, t);
    woodOsc.frequency.exponentialRampToValueAtTime(750, t + 0.015);

    woodGain.gain.setValueAtTime(0.85, t);
    woodGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    woodOsc.connect(woodGain);
    woodGain.connect(this.drumGain);
    woodOsc.start(t);
    woodOsc.stop(t + 0.025);

    // 2. Hollow acoustic shell 'thock' resonance (胴鳴り)
    const shellOsc = this.ctx.createOscillator();
    const shellGain = this.ctx.createGain();
    shellOsc.type = 'sine';
    shellOsc.frequency.setValueAtTime(480, t);
    shellOsc.frequency.exponentialRampToValueAtTime(320, t + 0.045);

    shellGain.gain.setValueAtTime(0.65, t);
    shellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

    shellOsc.connect(shellGain);
    shellGain.connect(this.drumGain);
    shellOsc.start(t);
    shellOsc.stop(t + 0.06);

    // 3. Subtle metallic rim chime
    const chimeOsc = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(3200, t);

    chimeGain.gain.setValueAtTime(0.3, t);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(this.drumGain);
    chimeOsc.start(t);
    chimeOsc.stop(t + 0.035);
  }

  // ==========================================
  // 5. PRO REALISM: GHOST NOTE (DELICATE TAP)
  // ==========================================
  public playGhostNote(part: DrumPartId = 'snare', time?: number) {
    this.init();
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;
    const t = time !== undefined ? time : this.ctx.currentTime;

    if (part === 'snare') {
      this.playSnare(t, 0.28);
    } else {
      this.playDrum(part, t);
    }
  }

  // ==========================================
  // 6. PRO REALISM: SYMPATHETIC SNARE BUZZ
  // ==========================================
  public triggerSympatheticSnareBuzz(t: number, intensity: number = 0.2) {
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;
    // Debounce rapid re-triggering within 60ms
    if (t - this.lastSnareBuzzTime < 0.06) return;
    this.lastSnareBuzzTime = t;

    const buzzSource = this.ctx.createBufferSource();
    buzzSource.buffer = this.noiseBuffer;

    const buzzFilter = this.ctx.createBiquadFilter();
    buzzFilter.type = 'bandpass';
    buzzFilter.frequency.setValueAtTime(2400, t);
    buzzFilter.Q.setValueAtTime(2.5, t);

    const buzzGain = this.ctx.createGain();
    buzzGain.gain.setValueAtTime(intensity * 0.35, t);
    buzzGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

    buzzSource.connect(buzzFilter);
    buzzFilter.connect(buzzGain);
    buzzGain.connect(this.drumGain);

    buzzSource.start(t);
    buzzSource.stop(t + 0.15);
  }

  // ==========================================
  // 7. HI-HAT CHOKE & PEDAL DAMPENING
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

  // ==========================================
  // 8. PRO REALISM: CRASH CYMBAL CHOKE (HAND MUTE)
  // ==========================================
  public chokeCrash(time?: number) {
    this.init();
    if (!this.ctx || !this.drumGain) return;
    const t = time !== undefined ? time : this.ctx.currentTime;

    if (this.activeCrashGain) {
      try {
        this.activeCrashGain.gain.cancelScheduledValues(t);
        this.activeCrashGain.gain.setValueAtTime(this.activeCrashGain.gain.value, t);
        this.activeCrashGain.gain.linearRampToValueAtTime(0.0001, t + 0.018); // 18ms grab mute
      } catch {}
      this.activeCrashGain = null;
    }

    // Hand contact damping thud
    if (this.noiseBuffer) {
      const grabSource = this.ctx.createBufferSource();
      grabSource.buffer = this.noiseBuffer;

      const grabFilter = this.ctx.createBiquadFilter();
      grabFilter.type = 'bandpass';
      grabFilter.frequency.setValueAtTime(3200, t);
      grabFilter.Q.setValueAtTime(3.0, t);

      const grabGain = this.ctx.createGain();
      grabGain.gain.setValueAtTime(0.35, t);
      grabGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      grabSource.connect(grabFilter);
      grabFilter.connect(grabGain);
      grabGain.connect(this.drumGain);

      grabSource.start(t);
      grabSource.stop(t + 0.045);
    }
  }

  public playHiHatClosed(time?: number) {
    this.init();
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;
    const t = time !== undefined ? time : this.ctx.currentTime;

    // Real drum physics: hitting closed hat chokes any ringing open hat
    this.chokeHiHat(t);

    const cymbal = this.activeCustomKit?.cymbalFinish || 'brilliantGold';
    let freq = 8500;
    let decay = 0.05;
    if (cymbal === 'darkVintage') {
      freq = 7200;
      decay = 0.045;
    } else if (cymbal === 'platinum') {
      freq = 9800;
      decay = 0.055;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, t);
    filter.Q.setValueAtTime(3.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.72, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);

    source.start(t);
    source.stop(t + decay + 0.01);
  }

  public playHiHatOpen(time?: number) {
    this.init();
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;
    const t = time !== undefined ? time : this.ctx.currentTime;

    // Cancel prior open ring if retriggered
    this.chokeHiHat(t);

    const cymbal = this.activeCustomKit?.cymbalFinish || 'brilliantGold';
    let cutoff = 7000;
    let decay = 0.45;
    if (cymbal === 'darkVintage') {
      cutoff = 5600;
      decay = 0.38;
    } else if (cymbal === 'platinum') {
      cutoff = 8200;
      decay = 0.55;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(cutoff, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);

    this.activeHiHatOpenGain = gain;
    this.activeHiHatOpenTime = t;

    source.start(t);
    source.stop(t + decay + 0.02);
  }

  public playHiHatHalfOpen(time?: number) {
    this.init();
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;
    const t = time !== undefined ? time : this.ctx.currentTime;

    this.chokeHiHat(t);

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(7800, t);
    filter.Q.setValueAtTime(2.2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.78, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);

    this.activeHiHatOpenGain = gain;
    this.activeHiHatOpenTime = t;

    source.start(t);
    source.stop(t + 0.24);
  }

  // ==========================================
  // 9. ACOUSTIC TOM SYNTHESIS (MATERIAL-AWARE)
  // ==========================================
  private playTom(t: number, startFreq: number, endFreq: number, duration: number, part: DrumPartId = 'tomLow') {
    if (!this.ctx || !this.drumGain) return;

    const shell = this.activeCustomKit?.shellMaterial || 'maple';
    const head = this.activeCustomKit?.headStyle || 'coatedWhite';

    let actualDuration = duration;
    let sFreq = startFreq;
    let eFreq = endFreq;
    let punchGain = 0.88;

    if (shell === 'birch') {
      actualDuration *= 0.85; // Tight punchy decay
      sFreq *= 1.05; // Bright attack
      punchGain = 0.95;
    } else if (shell === 'acrylic') {
      actualDuration *= 0.72; // Dry and powerful
      punchGain = 1.05;
    } else if (shell === 'brass') {
      actualDuration *= 1.3; // Long resonant ring
      sFreq *= 1.08;
    } else if (shell === 'carbon') {
      actualDuration *= 0.88;
      sFreq *= 1.1;
      punchGain = 1.0;
    }

    if (head === 'hydraulicBlue') {
      actualDuration *= 0.65; // Extremely fat and short 70s tom
      punchGain *= 1.1;
    } else if (head === 'vintage') {
      actualDuration *= 1.15;
      sFreq *= 0.94;
    }

    // Moongel damping
    if (this.moongelDamping) {
      actualDuration *= 0.6;
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(sFreq, t);
    osc.frequency.exponentialRampToValueAtTime(eFreq, t + actualDuration * 0.7);

    gain.gain.setValueAtTime(punchGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + actualDuration);

    osc.connect(gain);
    gain.connect(this.drumGain);

    osc.start(t);
    osc.stop(t + actualDuration + 0.01);

    // Beater / stick head slap click
    if (this.noiseBuffer) {
      const slapSource = this.ctx.createBufferSource();
      slapSource.buffer = this.noiseBuffer;

      const slapFilter = this.ctx.createBiquadFilter();
      slapFilter.type = 'bandpass';
      slapFilter.frequency.setValueAtTime(sFreq * 4.2, t);
      slapFilter.Q.setValueAtTime(3.0, t);

      const slapGain = this.ctx.createGain();
      slapGain.gain.setValueAtTime(0.35, t);
      slapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      slapSource.connect(slapFilter);
      slapFilter.connect(slapGain);
      slapGain.connect(this.drumGain);

      slapSource.start(t);
      slapSource.stop(t + 0.03);
    }

    // Sympathetic buzz on toms
    if (this.sympatheticBuzzEnabled) {
      this.triggerSympatheticSnareBuzz(t, 0.16);
    }
  }

  // ==========================================
  // 10. ACOUSTIC CRASH SYNTHESIS (FINISH-AWARE)
  // ==========================================
  private playCrash(t: number) {
    if (!this.ctx || !this.drumGain || !this.noiseBuffer) return;

    const cymbal = this.activeCustomKit?.cymbalFinish || 'brilliantGold';
    let cutoff = 4500;
    let sustain = 1.25;
    let sparkleFreq = 9500;

    if (cymbal === 'brilliantGold') {
      cutoff = 5400; // Sparkling, bright modern crash
      sustain = 1.35;
      sparkleFreq = 11000;
    } else if (cymbal === 'traditionalBronze') {
      cutoff = 4200; // Organic, warm complex B20 wash
      sustain = 1.2;
      sparkleFreq = 8500;
    } else if (cymbal === 'darkVintage') {
      cutoff = 3500; // Smoky, low pitch, dry decay
      sustain = 0.95;
      sparkleFreq = 6800;
    } else if (cymbal === 'platinum') {
      cutoff = 6500; // Crystal ping and shimmering high-frequency sustain
      sustain = 1.55;
      sparkleFreq = 12500;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(cutoff, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.95, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + sustain);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);

    this.activeCrashGain = gain;

    source.start(t);
    source.stop(t + sustain + 0.02);

    // High shimmer harmonic
    const shimmerSource = this.ctx.createBufferSource();
    shimmerSource.buffer = this.noiseBuffer;

    const shimmerFilter = this.ctx.createBiquadFilter();
    shimmerFilter.type = 'bandpass';
    shimmerFilter.frequency.setValueAtTime(sparkleFreq, t);
    shimmerFilter.Q.setValueAtTime(3.5, t);

    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.45, t);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + sustain * 0.8);

    shimmerSource.connect(shimmerFilter);
    shimmerFilter.connect(shimmerGain);
    shimmerGain.connect(this.drumGain);

    shimmerSource.start(t);
    shimmerSource.stop(t + sustain * 0.82);
  }

  // ==========================================
  // 11. ACOUSTIC RIDE & PRO RIDE BELL (FINISH-AWARE)
  // ==========================================
  public playRide(t: number = this.ctx?.currentTime || 0) {
    this.init();
    if (!this.ctx || !this.drumGain) return;

    const cymbal = this.activeCustomKit?.cymbalFinish || 'brilliantGold';
    let pingFreq = 1450;
    let sustain = 0.62;
    if (cymbal === 'darkVintage') {
      pingFreq = 1280; // Dark dry ping
      sustain = 0.48;
    } else if (cymbal === 'platinum') {
      pingFreq = 1620; // Piercing clear ping
      sustain = 0.82;
    }

    // Bell ping
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pingFreq, t);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + sustain);

    osc.connect(gain);
    gain.connect(this.drumGain);

    osc.start(t);
    osc.stop(t + sustain + 0.01);

    // Metallic body wash noise
    if (this.noiseBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(7500, t);
      filter.Q.setValueAtTime(4, t);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.3, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + sustain * 0.7);

      source.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.drumGain);

      source.start(t);
      source.stop(t + sustain * 0.72);
    }
  }

  // PRO REALISM: Ride Cymbal Bell (Cup) - Piercing metallic accent
  public playRideBell(time?: number) {
    this.init();
    if (!this.ctx || !this.drumGain) return;
    const t = time !== undefined ? time : this.ctx.currentTime;

    const bell1 = this.ctx.createOscillator();
    const bGain1 = this.ctx.createGain();
    bell1.type = 'sine';
    bell1.frequency.setValueAtTime(1860, t); // Bell fundamental
    bell1.frequency.exponentialRampToValueAtTime(1840, t + 0.4);

    bGain1.gain.setValueAtTime(0.85, t);
    bGain1.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    bell1.connect(bGain1);
    bGain1.connect(this.drumGain);
    bell1.start(t);
    bell1.stop(t + 0.86);

    // High harmonic cup chime
    const bell2 = this.ctx.createOscillator();
    const bGain2 = this.ctx.createGain();
    bell2.type = 'triangle';
    bell2.frequency.setValueAtTime(3240, t);

    bGain2.gain.setValueAtTime(0.55, t);
    bGain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    bell2.connect(bGain2);
    bGain2.connect(this.drumGain);
    bell2.start(t);
    bell2.stop(t + 0.36);

    // Stick wood tip ping
    if (this.noiseBuffer) {
      const tipSource = this.ctx.createBufferSource();
      tipSource.buffer = this.noiseBuffer;
      const tipFilter = this.ctx.createBiquadFilter();
      tipFilter.type = 'bandpass';
      tipFilter.frequency.setValueAtTime(5400, t);
      tipFilter.Q.setValueAtTime(5.0, t);

      const tipGain = this.ctx.createGain();
      tipGain.gain.setValueAtTime(0.4, t);
      tipGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

      tipSource.connect(tipFilter);
      tipFilter.connect(tipGain);
      tipGain.connect(this.drumGain);

      tipSource.start(t);
      tipSource.stop(t + 0.025);
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
