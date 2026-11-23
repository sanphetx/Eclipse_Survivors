import { GameScreenState, WeaponId } from './types';

export interface MusicState {
  screenState: GameScreenState | string;
  elapsedSeconds: number;
  hasBoss?: boolean;
  isNight?: boolean;
  realmTier?: number;
}

export interface SkillHitSoundOpts {
  isCrit?: boolean;
  isKill?: boolean;
  isBoss?: boolean;
  weaponId?: WeaponId | null;
  damage?: number;
  combo?: number;
}

const MODAL_PAUSED_STATES = new Set<string>([
  'PAUSED',
  'LEVEL_UP_CHEST',
  'BOSS_CHEST',
  'ARTIFACT_CHEST',
  'CLASS_EVOLUTION',
  'SIN_CONTRACT',
  'MAP_INTERACTION',
]);

// D minor pentatonic for crystal pickups & hit combo chimes
const PENTATONIC_D = [587.33, 698.46, 783.99, 880.0, 1046.5, 1174.66, 1396.91, 1567.98, 1760.0];

const BGM_TRACK_URL = '/bgm/The_Labyrinth_s_Final_Move.mp3';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private masterVolume = 1;
  private bgmVolume = 1;
  private sfxVolume = 1;

  // Master buses
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private sfxGain: GainNode | null = null;
  private chronoGain: GainNode | null = null;
  private sfxFilter: BiquadFilterNode | null = null;
  private bgmGain: GainNode | null = null;
  private bgmFilter: BiquadFilterNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbSendGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private timeStopMuffled = false;

  // OGG SFX buffer cache & throttles
  private oggBuffers = new Map<string, AudioBuffer>();
  private oggLoadingStarted = false;
  private lastOggPlayTime = new Map<string, number>();

  // SFX throttles & streaks
  private lastGemTime = 0;
  private gemStreak = 0;
  private lastHitTime = 0;
  private lastSkillHitTime = 0;
  private lastCritHitTime = 0;
  private lastKillTime = 0;
  private lastThrowTime = 0;
  private lastMagicTime = 0;
  private lastKnightBladeTime = 0;

  // MP3 BGM playback state
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmMediaSource: MediaElementAudioSourceNode | null = null;
  private bgmDirectFallback = false;
  private isMusicRunning = false;
  private currentIntensity = 0.2;
  private musicState: MusicState = {
    screenState: 'TITLE_MENU',
    elapsedSeconds: 0,
    hasBoss: false,
    isNight: false,
    realmTier: 0,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        if (!this.muted) {
          this.ensureContext();
          if (this.shouldPlayMusic() && !this.isMusicRunning) {
            this.startSequencer();
          }
        }
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyBusVolumes(0.03);
    if (muted) {
      this.stopSequencer(false);
    } else if (this.shouldPlayMusic() && this.ctx) {
      this.startSequencer();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  setVolumes(volumes: { masterVolume?: number; bgmVolume?: number; sfxVolume?: number }) {
    if (typeof volumes.masterVolume === 'number' && Number.isFinite(volumes.masterVolume)) {
      this.masterVolume = Math.max(0, Math.min(1, volumes.masterVolume));
    }
    if (typeof volumes.bgmVolume === 'number' && Number.isFinite(volumes.bgmVolume)) {
      this.bgmVolume = Math.max(0, Math.min(1, volumes.bgmVolume));
    }
    if (typeof volumes.sfxVolume === 'number' && Number.isFinite(volumes.sfxVolume)) {
      this.sfxVolume = Math.max(0, Math.min(1, volumes.sfxVolume));
    }
    this.applyBusVolumes(0.03);
  }

  getVolumes(): { masterVolume: number; bgmVolume: number; sfxVolume: number } {
    return {
      masterVolume: this.masterVolume,
      bgmVolume: this.bgmVolume,
      sfxVolume: this.sfxVolume,
    };
  }

  private applyBusVolumes(timeConstant = 0.04) {
    const isMenu = this.musicState.screenState === 'TITLE_MENU';
    const isModal = MODAL_PAUSED_STATES.has(this.musicState.screenState);
    const isEnded =
      this.musicState.screenState === 'GAME_OVER' || this.musicState.screenState === 'VICTORY';
    const targetBgm =
      isEnded || this.muted
        ? 0.0001
        : this.getTargetBgmVolume(isMenu, isModal, this.timeStopMuffled);

    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.masterGain) {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setTargetAtTime(
          this.muted ? 0 : this.masterVolume,
          now,
          timeConstant
        );
      }
      if (this.sfxGain) {
        const sfxBase = this.timeStopMuffled ? 0.65 : 0.92;
        this.sfxGain.gain.cancelScheduledValues(now);
        this.sfxGain.gain.setTargetAtTime(sfxBase * this.sfxVolume, now, timeConstant);
      }
      if (this.chronoGain) {
        this.chronoGain.gain.cancelScheduledValues(now);
        this.chronoGain.gain.setTargetAtTime(this.sfxVolume, now, timeConstant);
      }
      if (this.reverbSendGain) {
        this.reverbSendGain.gain.cancelScheduledValues(now);
        this.reverbSendGain.gain.setTargetAtTime(0.24 * this.sfxVolume, now, timeConstant);
      }
      if (this.bgmGain) {
        this.bgmGain.gain.cancelScheduledValues(now);
        this.bgmGain.gain.setTargetAtTime(targetBgm, now, timeConstant);
      }
    }

    if (this.bgmAudio && this.bgmDirectFallback) {
      this.bgmAudio.muted = this.muted;
      this.bgmAudio.volume = Math.max(0, Math.min(1, targetBgm * this.masterVolume));
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.setupAudioGraph(this.ctx);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx
        .resume()
        .then(() => {
          if (this.shouldPlayMusic() && !this.isMusicRunning) {
            this.startSequencer();
          }
        })
        .catch(() => {});
    }
    return this.ctx;
  }

  private setupAudioGraph(ctx: AudioContext) {
    // Master Compressor -> Master Gain -> Destination
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-14, ctx.currentTime);
    this.compressor.knee.setValueAtTime(18, ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.004, ctx.currentTime);
    this.compressor.release.setValueAtTime(0.16, ctx.currentTime);

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, ctx.currentTime);

    this.compressor.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);

    // Dedicated SFX Bus with Dynamic Lowpass (muffles during Global Time Stop)
    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.setValueAtTime(
      (this.timeStopMuffled ? 0.65 : 0.92) * this.sfxVolume,
      ctx.currentTime
    );
    this.sfxFilter = ctx.createBiquadFilter();
    this.sfxFilter.type = 'lowpass';
    this.sfxFilter.frequency.setValueAtTime(this.timeStopMuffled ? 950 : 18000, ctx.currentTime);
    this.sfxFilter.Q.setValueAtTime(0.7, ctx.currentTime);
    this.sfxGain.connect(this.sfxFilter);
    this.sfxFilter.connect(this.compressor);

    // Dedicated Chrono Bus (bypasses Time Stop lowpass while respecting SFX volume)
    this.chronoGain = ctx.createGain();
    this.chronoGain.gain.setValueAtTime(this.sfxVolume, ctx.currentTime);
    this.chronoGain.connect(this.compressor);

    // Dedicated BGM Bus with Dynamic Lowpass (muffles nicely during modal pauses!)
    this.bgmFilter = ctx.createBiquadFilter();
    this.bgmFilter.type = 'lowpass';
    this.bgmFilter.frequency.setValueAtTime(14000, ctx.currentTime);
    this.bgmFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.24 * this.bgmVolume, ctx.currentTime);

    this.bgmFilter.connect(this.bgmGain);
    this.bgmGain.connect(this.compressor);

    // Synthesized Dark-Hall Convolver Reverb for lush modern spatial depth
    this.reverbNode = ctx.createConvolver();
    const irLen = Math.floor(ctx.sampleRate * 0.95);
    const irBuf = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = irBuf.getChannelData(ch);
      let prev = 0;
      for (let i = 0; i < irLen; i++) {
        const decay = Math.pow(1 - i / irLen, 2.7);
        const white = Math.random() * 2 - 1;
        // Soft lowpass on IR tail so reverb sounds warm, never metallic
        prev = prev * 0.62 + white * 0.38;
        data[i] = prev * decay;
      }
    }
    this.reverbNode.buffer = irBuf;

    this.reverbSendGain = ctx.createGain();
    this.reverbSendGain.gain.setValueAtTime(0.24 * this.sfxVolume, ctx.currentTime);
    this.reverbNode.connect(this.reverbSendGain);
    this.reverbSendGain.connect(this.compressor);

    // Reusable 1.5s Stereo Noise Buffer
    const nLen = Math.floor(ctx.sampleRate * 1.5);
    this.noiseBuffer = ctx.createBuffer(2, nLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = this.noiseBuffer.getChannelData(ch);
      for (let i = 0; i < nLen; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    this.preloadOggSfx(ctx);
    this.ensureBgmAudio(ctx);
  }

  private ensureBgmAudio(ctx: AudioContext) {
    if (typeof Audio === 'undefined' || !this.bgmFilter) return;
    if (!this.bgmAudio) {
      const audio = new Audio(BGM_TRACK_URL);
      audio.loop = true;
      audio.preload = 'auto';
      this.bgmAudio = audio;
      try {
        this.bgmMediaSource = ctx.createMediaElementSource(audio);
        this.bgmMediaSource.connect(this.bgmFilter);
        this.bgmDirectFallback = false;
      } catch {
        this.bgmDirectFallback = true;
        audio.muted = this.muted;
        audio.volume = Math.max(0, Math.min(1, 0.28 * this.bgmVolume * this.masterVolume));
      }
    }
  }

  private preloadOggSfx(ctx: AudioContext) {
    if (this.oggLoadingStarted || typeof fetch === 'undefined') return;
    this.oggLoadingStarted = true;
    const keys = [
      'blade_draw',
      'coins',
      'crit_shatter',
      'golem_slam',
      'heavy_chop',
      'holy_bell',
      'parry_clang_1',
      'parry_clang_2',
      'shield_block',
      'slash_1',
      'slash_2',
      'taunt_gong',
    ];
    for (const key of keys) {
      fetch(`/sfx/${key}.ogg`)
        .then((res) => (res.ok ? res.arrayBuffer() : null))
        .then((buf) => (buf ? ctx.decodeAudioData(buf) : null))
        .then((decoded) => {
          if (decoded) this.oggBuffers.set(key, decoded);
        })
        .catch(() => {});
    }
  }

  private playOggSfx(
    key: string,
    opts: { volume?: number; pitchMin?: number; pitchMax?: number; throttleMs?: number } = {}
  ): boolean {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return false;
    const buf = this.oggBuffers.get(key);
    if (!buf) return false;

    const nowMs = performance.now();
    const throttleMs = opts.throttleMs ?? 45;
    const last = this.lastOggPlayTime.get(key) ?? 0;
    if (nowMs - last < throttleMs) return true;
    this.lastOggPlayTime.set(key, nowMs);

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const pMin = opts.pitchMin ?? 0.95;
    const pMax = opts.pitchMax ?? 1.05;
    src.playbackRate.value = pMin + Math.random() * (pMax - pMin);

    const g = ctx.createGain();
    g.gain.setValueAtTime(opts.volume ?? 0.5, ctx.currentTime);
    src.connect(g);
    g.connect(this.sfxGain);
    src.start(ctx.currentTime);
    return true;
  }

  /**
   * Modern filtered tone helper with ADSR envelope, filter sweep, and optional reverb send.
   */
  private playVoice(opts: {
    freq: number;
    endFreq?: number;
    duration: number;
    type?: OscillatorType;
    volume: number;
    delay?: number;
    attack?: number;
    filterFreq?: number;
    filterEndFreq?: number;
    filterType?: BiquadFilterType;
    filterQ?: number;
    detune?: number;
    reverbSend?: number;
    bus?: 'sfx' | 'bgm' | 'chrono';
  }) {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || !this.bgmFilter || !this.compressor || !this.chronoGain) return;

    const now = ctx.currentTime + (opts.delay ?? 0);
    const dur = Math.max(0.02, opts.duration);
    const attack = Math.min(dur * 0.45, opts.attack ?? 0.008);

    const osc = ctx.createOscillator();
    osc.type = opts.type ?? 'triangle';
    osc.frequency.setValueAtTime(Math.max(20, opts.freq), now);
    if (opts.endFreq && opts.endFreq !== opts.freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.endFreq), now + dur);
    }
    if (opts.detune) {
      osc.detune.setValueAtTime(opts.detune, now);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(Math.max(0.0002, opts.volume), now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    let lastNode: AudioNode = osc;
    if (opts.filterFreq) {
      const filter = ctx.createBiquadFilter();
      filter.type = opts.filterType ?? 'lowpass';
      filter.frequency.setValueAtTime(Math.max(40, opts.filterFreq), now);
      if (opts.filterEndFreq && opts.filterEndFreq !== opts.filterFreq) {
        filter.frequency.exponentialRampToValueAtTime(Math.max(40, opts.filterEndFreq), now + dur);
      }
      if (opts.filterQ) {
        filter.Q.setValueAtTime(opts.filterQ, now);
      }
      lastNode.connect(filter);
      lastNode = filter;
    }

    lastNode.connect(gain);

    const dest =
      opts.bus === 'bgm' ? this.bgmFilter : opts.bus === 'chrono' ? this.chronoGain : this.sfxGain;
    gain.connect(dest);

    if (opts.reverbSend && opts.reverbSend > 0 && this.reverbNode) {
      const rSend = ctx.createGain();
      rSend.gain.setValueAtTime(opts.reverbSend, now);
      gain.connect(rSend);
      rSend.connect(this.reverbNode);
    }

    osc.start(now);
    osc.stop(now + dur + 0.03);
  }

  /**
   * Filtered noise burst helper for crisp tactile hits, slashes, whooshes, thunder & drums.
   */
  private playNoise(opts: {
    duration: number;
    volume: number;
    delay?: number;
    attack?: number;
    filterType?: BiquadFilterType;
    filterFreq: number;
    filterEndFreq?: number;
    filterQ?: number;
    reverbSend?: number;
    bus?: 'sfx' | 'bgm' | 'chrono';
  }) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer || !this.sfxGain || !this.bgmFilter || !this.compressor || !this.chronoGain) return;

    const now = ctx.currentTime + (opts.delay ?? 0);
    const dur = Math.max(0.015, opts.duration);
    const attack = Math.min(dur * 0.35, opts.attack ?? 0.003);

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    // Start at random offset so repeated hits never phase identically
    const offset = Math.random() * Math.max(0.1, this.noiseBuffer.duration - dur - 0.05);

    const filter = ctx.createBiquadFilter();
    filter.type = opts.filterType ?? 'bandpass';
    filter.frequency.setValueAtTime(Math.max(40, opts.filterFreq), now);
    if (opts.filterEndFreq && opts.filterEndFreq !== opts.filterFreq) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, opts.filterEndFreq), now + dur);
    }
    filter.Q.setValueAtTime(opts.filterQ ?? 1.2, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(Math.max(0.0002, opts.volume), now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(filter);
    filter.connect(gain);

    const dest =
      opts.bus === 'bgm' ? this.bgmFilter : opts.bus === 'chrono' ? this.chronoGain : this.sfxGain;
    gain.connect(dest);

    if (opts.reverbSend && opts.reverbSend > 0 && this.reverbNode) {
      const rSend = ctx.createGain();
      rSend.gain.setValueAtTime(opts.reverbSend, now);
      gain.connect(rSend);
      rSend.connect(this.reverbNode);
    }

    src.start(now, offset, dur + 0.02);
  }

  // =========================================================================
  // BACKGROUND MUSIC SYSTEM (The_Labyrinth_s_Final_Move.mp3 + Dynamic Filter)
  // =========================================================================

  private shouldPlayMusic(): boolean {
    if (this.muted) return false;
    const st = this.musicState.screenState;
    return st !== 'GAME_OVER' && st !== 'VICTORY';
  }

  private getTargetBgmVolume(isMenu: boolean, isModal: boolean, timeStopMuffled: boolean): number {
    const base = isMenu
      ? 0.24
      : isModal
        ? 0.16
        : (0.34 + this.currentIntensity * 0.08) * (timeStopMuffled ? 0.72 : 1);
    return base * this.bgmVolume;
  }

  updateMusic(state: MusicState) {
    this.musicState = state;
    const isMenu = state.screenState === 'TITLE_MENU';
    const isModal = MODAL_PAUSED_STATES.has(state.screenState);
    const isEnded = state.screenState === 'GAME_OVER' || state.screenState === 'VICTORY';

    if (isEnded || this.muted) {
      if (this.bgmGain && this.ctx) {
        this.bgmGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
      }
      this.stopSequencer(isEnded);
      return;
    }

    if (isMenu) {
      this.currentIntensity = 0.14;
    } else {
      const progress = Math.max(0, Math.min(1, state.elapsedSeconds / 1500));
      const bossInt = state.hasBoss ? 0.2 : 0;
      const nightInt = state.isNight ? 0.05 : 0;
      this.currentIntensity = Math.max(
        0.18,
        Math.min(1, 0.18 + progress * 0.72 + bossInt + nightInt)
      );
    }

    const targetVol = this.getTargetBgmVolume(isMenu, isModal, this.timeStopMuffled);

    if (this.ctx && this.bgmGain && this.bgmFilter) {
      const now = this.ctx.currentTime;
      const baseCut = isMenu ? 5200 : isModal ? 680 : 14000;
      const targetCut = !isMenu && this.timeStopMuffled ? Math.min(baseCut, 450) : baseCut;
      this.bgmGain.gain.setTargetAtTime(targetVol, now, 0.18);
      this.bgmFilter.frequency.setTargetAtTime(targetCut, now, 0.14);
    }
    if (this.bgmAudio && this.bgmDirectFallback) {
      this.bgmAudio.muted = this.muted;
      this.bgmAudio.volume = Math.max(0, Math.min(1, targetVol * this.masterVolume));
    }

    if (this.ctx && this.ctx.state === 'running' && !this.isMusicRunning && this.shouldPlayMusic()) {
      this.startSequencer();
    }
  }

  stopMusic() {
    this.stopSequencer(true);
  }

  setTimeStopMuffled(active: boolean) {
    if (this.timeStopMuffled === active) return;
    this.timeStopMuffled = active;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.sfxFilter) {
      this.sfxFilter.frequency.setTargetAtTime(active ? 950 : 18000, now, 0.08);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime((active ? 0.65 : 0.92) * this.sfxVolume, now, 0.08);
    }
    if (this.bgmFilter && this.bgmGain) {
      const isMenu = this.musicState.screenState === 'TITLE_MENU';
      const isModal = MODAL_PAUSED_STATES.has(this.musicState.screenState);
      const baseCut = isMenu ? 5200 : isModal ? 680 : 14000;
      const targetCut = !isMenu && active ? Math.min(baseCut, 450) : baseCut;
      const targetVol = this.muted ? 0.0001 : this.getTargetBgmVolume(isMenu, isModal, active);
      this.bgmFilter.frequency.setTargetAtTime(targetCut, now, 0.08);
      this.bgmGain.gain.setTargetAtTime(targetVol, now, 0.08);
      if (this.bgmAudio && this.bgmDirectFallback) {
        this.bgmAudio.muted = this.muted;
        this.bgmAudio.volume = Math.max(0, Math.min(1, targetVol * this.masterVolume));
      }
    }
  }

  private startSequencer() {
    if (this.isMusicRunning || this.muted) return;
    if (!this.ctx || this.ctx.state !== 'running') return;
    this.ensureBgmAudio(this.ctx);
    if (!this.bgmAudio) return;
    this.isMusicRunning = true;
    const audio = this.bgmAudio;
    audio
      .play()
      .then(() => {
        if (!this.isMusicRunning || this.muted || !this.shouldPlayMusic()) {
          audio.pause();
        }
      })
      .catch(() => {
        this.isMusicRunning = false;
      });
  }

  private stopSequencer(resetPosition = false) {
    this.isMusicRunning = false;
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      if (resetPosition) {
        try {
          this.bgmAudio.currentTime = 0;
        } catch {
          // Ignore seek errors before metadata is loaded
        }
      }
    }
  }

  // =========================================================================
  // JUICY SKILL HIT & MODERN ACTION-RPG SOUND EFFECTS
  // =========================================================================

  /**
   * Satisfying ("ฟิน") layered impact sound whenever a weapon or skill hits an enemy!
   * Includes smart polyphony throttling so massive AoE packs sound punchy, not noisy.
   */
  playSkillHit(opts: SkillHitSoundOpts = {}) {
    const now = performance.now();
    const isBig = Boolean(opts.isCrit || opts.isKill || (opts.damage ?? 0) >= 60);

    if (isBig) {
      if (now - this.lastCritHitTime < 52) return;
      this.lastCritHitTime = now;
    } else {
      if (now - this.lastSkillHitTime < 42) return;
      this.lastSkillHitTime = now;
    }

    const jitter = 0.94 + Math.random() * 0.13;
    const comboStep = Math.min(8, Math.floor((opts.combo ?? 0) / 18));
    const w = opts.weaponId;

    const isSlash = w === 'katana' || w === 'dagger' || w === 'axe' || w === null;
    const isHeavy = w === 'mace' || w === 'chain' || w === 'shield' || w === 'totem' || w === 'cat';

    // Layer 1: Warm Sub-Punch Body (tactile weight)
    this.playVoice({
      freq: (isBig ? 175 : isHeavy ? 130 : 148) * jitter,
      endFreq: isBig ? 38 : 48,
      duration: isBig ? 0.095 : 0.065,
      type: 'sine',
      volume: isBig ? 0.13 : 0.078,
      attack: 0.002,
    });

    // Layer 2: Crisp Filtered Transient Snap (slash / crunch / pop)
    this.playNoise({
      duration: isBig ? 0.055 : 0.032,
      volume: isBig ? 0.09 : 0.052,
      filterType: 'bandpass',
      filterFreq: (isSlash ? 3100 : isHeavy ? 1050 : 2100) * jitter,
      filterEndFreq: isSlash ? 1400 : 650,
      filterQ: isSlash ? 1.7 : 1.1,
      reverbSend: isBig ? 0.18 : 0.06,
    });

    // Layer 3: Satisfying Critical / Heavy Crystalline Impact Accent
    if (opts.isCrit || (opts.damage ?? 0) >= 65) {
      const sparkleFreq = PENTATONIC_D[comboStep % PENTATONIC_D.length] * (opts.isCrit ? 1.5 : 1);
      this.playVoice({
        freq: sparkleFreq,
        endFreq: sparkleFreq * 1.12,
        duration: 0.12,
        type: 'triangle',
        volume: opts.isCrit ? 0.072 : 0.045,
        attack: 0.003,
        filterFreq: 4200,
        reverbSend: 0.28,
      });
    }
  }

  playGemPickup() {
    const now = performance.now();
    if (now - this.lastGemTime < 45) return;
    if (now - this.lastGemTime < 380) {
      this.gemStreak = Math.min(PENTATONIC_D.length - 1, this.gemStreak + 1);
    } else {
      this.gemStreak = 0;
    }
    this.lastGemTime = now;
    const freq = PENTATONIC_D[this.gemStreak];
    // Warm crystal harp pluck + soft octave shimmer
    this.playVoice({
      freq,
      endFreq: freq * 1.01,
      duration: 0.11,
      type: 'sine',
      volume: 0.055,
      attack: 0.003,
      reverbSend: 0.24,
    });
    this.playVoice({
      freq: freq * 2,
      duration: 0.07,
      type: 'sine',
      volume: 0.022,
      attack: 0.002,
      reverbSend: 0.25,
    });
  }

  playCoinPickup() {
    if (this.playOggSfx('coins', { volume: 0.42, pitchMin: 0.96, pitchMax: 1.08, throttleMs: 65 })) {
      return;
    }
    // Crisp modern metallic coin chime fallback while OGG loads
    this.playVoice({
      freq: 1318.51,
      duration: 0.12,
      type: 'sine',
      volume: 0.065,
      attack: 0.002,
      reverbSend: 0.22,
    });
    this.playVoice({
      freq: 1975.53,
      duration: 0.15,
      type: 'sine',
      volume: 0.05,
      delay: 0.04,
      attack: 0.002,
      reverbSend: 0.28,
    });
  }

  playWeaponThrow() {
    const now = performance.now();
    if (now - this.lastThrowTime < 55) return;
    this.lastThrowTime = now;
    // Soft modern airy whoosh instead of triangle boop
    this.playNoise({
      duration: 0.085,
      volume: 0.036,
      filterType: 'bandpass',
      filterFreq: 1200 + Math.random() * 250,
      filterEndFreq: 420,
      filterQ: 1.5,
      reverbSend: 0.08,
    });
    this.playVoice({
      freq: 260,
      endFreq: 140,
      duration: 0.075,
      type: 'sine',
      volume: 0.022,
      attack: 0.006,
    });
  }

  playMagicCast() {
    const now = performance.now();
    if (now - this.lastMagicTime < 65) return;
    this.lastMagicTime = now;
    // Lush arcane shimmer + soft airy cast
    const base = 440 * (0.96 + Math.random() * 0.08);
    this.playVoice({
      freq: base,
      endFreq: base * 1.5,
      duration: 0.16,
      type: 'triangle',
      volume: 0.042,
      attack: 0.012,
      filterFreq: 2400,
      reverbSend: 0.32,
    });
    this.playVoice({
      freq: base * 1.5,
      endFreq: base * 2,
      duration: 0.14,
      type: 'sine',
      volume: 0.03,
      delay: 0.02,
      attack: 0.01,
      reverbSend: 0.35,
    });
    this.playNoise({
      duration: 0.12,
      volume: 0.025,
      filterType: 'bandpass',
      filterFreq: 1600,
      filterEndFreq: 3200,
      filterQ: 2.2,
      reverbSend: 0.2,
    });
  }

  playLightning() {
    // Modern thunder crack: crisp electric snap + rolling low-end thunder + sub boom
    this.playNoise({
      duration: 0.06,
      volume: 0.085,
      filterType: 'highpass',
      filterFreq: 2200,
      reverbSend: 0.25,
    });
    this.playNoise({
      duration: 0.28,
      volume: 0.075,
      delay: 0.015,
      filterType: 'lowpass',
      filterFreq: 680,
      filterEndFreq: 140,
      reverbSend: 0.35,
    });
    this.playVoice({
      freq: 145,
      endFreq: 36,
      duration: 0.2,
      type: 'sine',
      volume: 0.11,
      attack: 0.003,
    });
  }

  playShieldBlock() {
    if (this.playOggSfx('shield_block', { volume: 0.58, pitchMin: 0.94, pitchMax: 1.06, throttleMs: 70 })) {
      return;
    }
    // Resonant steel-arcane deflection clang fallback
    this.playVoice({
      freq: 620,
      endFreq: 480,
      duration: 0.12,
      type: 'triangle',
      volume: 0.065,
      attack: 0.002,
      filterFreq: 2200,
      reverbSend: 0.25,
    });
    this.playVoice({
      freq: 1420,
      endFreq: 1180,
      duration: 0.09,
      type: 'sine',
      volume: 0.04,
      attack: 0.001,
      reverbSend: 0.28,
    });
  }

  playPlayerHit() {
    const now = performance.now();
    if (now - this.lastHitTime < 120) return;
    this.lastHitTime = now;
    // Heavy visceral impact thud (no raw sawtooth buzzer)
    this.playVoice({
      freq: 120,
      endFreq: 34,
      duration: 0.18,
      type: 'sine',
      volume: 0.16,
      attack: 0.003,
    });
    this.playVoice({
      freq: 185,
      endFreq: 62,
      duration: 0.14,
      type: 'triangle',
      volume: 0.09,
      attack: 0.002,
      filterFreq: 520,
    });
    this.playNoise({
      duration: 0.11,
      volume: 0.085,
      filterType: 'lowpass',
      filterFreq: 750,
      filterEndFreq: 180,
    });
  }

  playEnemyKill(isBoss = false) {
    if (isBoss) {
      // Massive cinematic boss shatter & victory resonance
      this.playVoice({
        freq: 140,
        endFreq: 32,
        duration: 0.6,
        type: 'sine',
        volume: 0.2,
        attack: 0.005,
      });
      this.playNoise({
        duration: 0.45,
        volume: 0.11,
        filterType: 'lowpass',
        filterFreq: 950,
        filterEndFreq: 150,
        reverbSend: 0.4,
      });
      [293.66, 440, 587.33, 880].forEach((f, idx) => {
        this.playVoice({
          freq: f,
          duration: 0.45,
          type: 'triangle',
          volume: 0.08,
          delay: 0.06 + idx * 0.065,
          attack: 0.015,
          filterFreq: 2800,
          reverbSend: 0.35,
        });
      });
      return;
    }

    const now = performance.now();
    if (now - this.lastKillTime < 45) return;
    this.lastKillTime = now;
    // Clean, subtle pop + airy dissolve
    this.playVoice({
      freq: 220,
      endFreq: 75,
      duration: 0.07,
      type: 'sine',
      volume: 0.045,
      attack: 0.002,
    });
    this.playNoise({
      duration: 0.055,
      volume: 0.028,
      filterType: 'bandpass',
      filterFreq: 1800,
      filterEndFreq: 900,
      reverbSend: 0.12,
    });
  }

  playEvolution() {
    // Celebratory convergence burst for Weapon Evolution / 3-Element Fusion
    this.playVoice({
      freq: 130,
      endFreq: 48,
      duration: 0.25,
      type: 'sine',
      volume: 0.14,
      attack: 0.004,
    });
    [440, 587.33, 783.99, 1046.5, 1396.91].forEach((n, idx) => {
      this.playVoice({
        freq: n,
        endFreq: n * 1.01,
        duration: 0.36,
        type: idx % 2 === 0 ? 'triangle' : 'sine',
        volume: 0.07,
        delay: idx * 0.045,
        attack: 0.01,
        filterFreq: 3800,
        reverbSend: 0.38,
      });
    });
    this.playNoise({
      duration: 0.24,
      volume: 0.045,
      filterType: 'bandpass',
      filterFreq: 900,
      filterEndFreq: 4800,
      filterQ: 1.8,
      reverbSend: 0.3,
    });
  }

  playLevelUp() {
    const notes = [587.33, 698.46, 880.0, 1174.66];
    notes.forEach((n, idx) => {
      this.playVoice({
        freq: n,
        duration: 0.28,
        type: 'triangle',
        volume: 0.075,
        delay: idx * 0.06,
        attack: 0.008,
        filterFreq: 3600,
        reverbSend: 0.32,
      });
      this.playVoice({
        freq: n * 2,
        duration: 0.22,
        type: 'sine',
        volume: 0.03,
        delay: idx * 0.06,
        attack: 0.005,
        reverbSend: 0.35,
      });
    });
  }

  playBossChest() {
    const notes = [293.66, 440.0, 587.33, 739.99, 880.0, 1174.66];
    this.playVoice({
      freq: 146.83,
      duration: 0.55,
      type: 'sine',
      volume: 0.12,
      attack: 0.01,
    });
    notes.forEach((n, idx) => {
      this.playVoice({
        freq: n,
        endFreq: n * 1.008,
        duration: 0.34,
        type: 'triangle',
        volume: 0.075,
        delay: idx * 0.065,
        attack: 0.01,
        filterFreq: 4200,
        reverbSend: 0.36,
      });
    });
  }

  playComboMilestone(tier: number) {
    const base = 440 * Math.pow(1.059463, Math.min(12, tier * 2));
    [1, 1.25, 1.5, 2].forEach((m, idx) => {
      this.playVoice({
        freq: base * m,
        duration: 0.2,
        type: idx === 3 ? 'sine' : 'triangle',
        volume: 0.06,
        delay: idx * 0.042,
        attack: 0.005,
        filterFreq: 3800,
        reverbSend: 0.3,
      });
    });
  }

  playComboBreak() {
    // Smooth warm muffled downward fade (no harsh 8-bit square wave)
    this.playVoice({
      freq: 330,
      endFreq: 130,
      duration: 0.24,
      type: 'triangle',
      volume: 0.065,
      attack: 0.01,
      filterFreq: 680,
      filterEndFreq: 220,
      reverbSend: 0.22,
    });
  }

  playBossWarning() {
    // Deep cinematic dark war-horn / sub-braaam swell
    [0, 0.36].forEach((d, idx) => {
      const f = idx === 0 ? 110 : 98;
      this.playVoice({
        freq: f,
        endFreq: f * 0.92,
        duration: 0.38,
        type: 'sawtooth',
        volume: 0.095,
        delay: d,
        attack: 0.06,
        filterFreq: 480,
        filterEndFreq: 210,
        filterQ: 2.2,
        detune: -8,
        reverbSend: 0.35,
      });
      this.playVoice({
        freq: f * 0.5,
        endFreq: f * 0.45,
        duration: 0.42,
        type: 'sine',
        volume: 0.14,
        delay: d,
        attack: 0.04,
      });
    });
  }

  playUltimateCutin() {
    // Dramatic anime/action-RPG bass drop + metallic shimmer + rising power chord
    this.playVoice({
      freq: 140,
      endFreq: 34,
      duration: 0.42,
      type: 'sine',
      volume: 0.2,
      attack: 0.004,
    });
    this.playNoise({
      duration: 0.25,
      volume: 0.09,
      filterType: 'bandpass',
      filterFreq: 1200,
      filterEndFreq: 4800,
      filterQ: 1.6,
      reverbSend: 0.35,
    });
    [293.66, 440, 587.33, 880].forEach((f, idx) => {
      this.playVoice({
        freq: f,
        endFreq: f * 1.03,
        duration: 0.45,
        type: 'sawtooth',
        volume: 0.06,
        delay: 0.04 + idx * 0.04,
        attack: 0.02,
        filterFreq: 2400,
        detune: idx % 2 === 0 ? -6 : 6,
        reverbSend: 0.38,
      });
    });
  }

  playParry() {
    const key = Math.random() < 0.5 ? 'parry_clang_1' : 'parry_clang_2';
    const playedOgg = this.playOggSfx(key, { volume: 0.65, pitchMin: 0.95, pitchMax: 1.07, throttleMs: 60 });
    if (!playedOgg) {
      // Iconic crisp steel-ring clash fallback
      this.playNoise({
        duration: 0.045,
        volume: 0.09,
        filterType: 'highpass',
        filterFreq: 2800,
        reverbSend: 0.25,
      });
      this.playVoice({
        freq: 1240,
        endFreq: 980,
        duration: 0.22,
        type: 'triangle',
        volume: 0.09,
        attack: 0.001,
        filterFreq: 4500,
        reverbSend: 0.35,
      });
    }
    // High metallic ring + long-tail soft bell resonance
    this.playVoice({
      freq: 2480,
      endFreq: 2360,
      duration: 0.42,
      type: 'sine',
      volume: 0.055,
      delay: 0.012,
      attack: 0.002,
      reverbSend: 0.45,
    });
    this.playOggSfx('holy_bell', { volume: 0.22, pitchMin: 0.99, pitchMax: 1.02, throttleMs: 120 });
    this.playVoice({
      freq: 880,
      endFreq: 876,
      duration: 0.85,
      type: 'sine',
      volume: 0.045,
      delay: 0.03,
      attack: 0.01,
      reverbSend: 0.55,
    });
  }

  playKnightBladeSlash() {
    const now = performance.now();
    if (now - this.lastKnightBladeTime < 55) return;
    this.lastKnightBladeTime = now;
    const pitchMult = 0.95 + Math.random() * 0.1; // ±5% pitch variation
    this.playOggSfx('blade_draw', { volume: 0.28, pitchMin: 0.95, pitchMax: 1.05, throttleMs: 55 });
    // Clear short metallic "ฉิ้ง"
    this.playVoice({
      freq: 1760 * pitchMult,
      endFreq: 2420 * pitchMult,
      duration: 0.11,
      type: 'sine',
      volume: 0.075,
      attack: 0.001,
      reverbSend: 0.28,
    });
    this.playVoice({
      freq: 2980 * pitchMult,
      endFreq: 2640 * pitchMult,
      duration: 0.09,
      type: 'triangle',
      volume: 0.04,
      attack: 0.001,
      filterFreq: 5200,
      reverbSend: 0.3,
    });
  }

  playKnightBulwarkReady() {
    // Low resonant "ฮุ่ม" shield hum when 5 stacks assemble
    this.playVoice({
      freq: 110,
      endFreq: 116,
      duration: 0.45,
      type: 'triangle',
      volume: 0.08,
      attack: 0.04,
      filterFreq: 420,
      reverbSend: 0.3,
    });
    this.playVoice({
      freq: 165,
      endFreq: 168,
      duration: 0.48,
      type: 'sine',
      volume: 0.09,
      attack: 0.04,
      reverbSend: 0.35,
    });
  }

  playKnightBulwarkShatter() {
    // Glass/crystal shatter + low shield hum
    this.playOggSfx('crit_shatter', { volume: 0.55, pitchMin: 0.96, pitchMax: 1.06, throttleMs: 80 });
    this.playNoise({
      duration: 0.18,
      volume: 0.11,
      filterType: 'highpass',
      filterFreq: 2400,
      filterEndFreq: 4600,
      reverbSend: 0.38,
    });
    [1920, 2540, 3180].forEach((f, idx) => {
      this.playVoice({
        freq: f,
        endFreq: f * 0.86,
        duration: 0.16,
        type: 'sine',
        volume: 0.048,
        delay: idx * 0.022,
        attack: 0.001,
        reverbSend: 0.32,
      });
    });
    this.playVoice({
      freq: 108,
      endFreq: 68,
      duration: 0.36,
      type: 'sine',
      volume: 0.12,
      attack: 0.005,
      reverbSend: 0.28,
    });
  }

  playSlash(heavy = false) {
    const key = heavy ? 'heavy_chop' : Math.random() < 0.5 ? 'slash_1' : 'slash_2';
    if (this.playOggSfx(key, { volume: heavy ? 0.56 : 0.48, pitchMin: 0.92, pitchMax: 1.1, throttleMs: 45 })) {
      return;
    }
    this.playExecute();
  }

  playBladeDraw() {
    if (this.playOggSfx('blade_draw', { volume: 0.5, pitchMin: 0.95, pitchMax: 1.08, throttleMs: 70 })) {
      return;
    }
    this.playWeaponThrow();
  }

  playCritShatter() {
    if (this.playOggSfx('crit_shatter', { volume: 0.48, pitchMin: 0.94, pitchMax: 1.08, throttleMs: 80 })) {
      return;
    }
    this.playSkillHit({ isCrit: true, damage: 100 });
  }

  playTauntGong() {
    const played = this.playOggSfx('taunt_gong', { volume: 0.58, pitchMin: 0.96, pitchMax: 1.04, throttleMs: 200 });
    if (!played) {
      this.playBossWarning();
    }
    // Heavy low "ตึ้ง" impact + brief war shout
    this.playVoice({
      freq: 92,
      endFreq: 40,
      duration: 0.28,
      type: 'sine',
      volume: 0.16,
      attack: 0.003,
    });
    this.playVoice({
      freq: 210,
      endFreq: 315,
      duration: 0.16,
      type: 'sawtooth',
      volume: 0.065,
      delay: 0.03,
      attack: 0.02,
      filterFreq: 980,
      filterEndFreq: 420,
      reverbSend: 0.32,
    });
  }

  playGolemSlam() {
    if (this.playOggSfx('golem_slam', { volume: 0.52, pitchMin: 0.92, pitchMax: 1.06, throttleMs: 120 })) {
      return;
    }
    this.playPlayerHit();
  }

  playHolyBell() {
    if (this.playOggSfx('holy_bell', { volume: 0.6, pitchMin: 0.97, pitchMax: 1.03, throttleMs: 250 })) {
      return;
    }
    this.playEvolution();
  }

  playExcaliburDescent() {
    // 0.30s descending wind whoosh -> deep low explosion + grand bell at 0.30s
    this.playNoise({
      duration: 0.3,
      volume: 0.12,
      filterType: 'bandpass',
      filterFreq: 2400,
      filterEndFreq: 280,
      filterQ: 1.4,
      reverbSend: 0.35,
    });
    this.playVoice({
      freq: 640,
      endFreq: 140,
      duration: 0.29,
      type: 'triangle',
      volume: 0.075,
      attack: 0.02,
      filterFreq: 1400,
      reverbSend: 0.3,
    });
    // Impact at 0.30s: deep low explosion + grand cathedral bell
    this.playVoice({
      freq: 110,
      endFreq: 26,
      duration: 0.52,
      type: 'sine',
      volume: 0.24,
      delay: 0.3,
      attack: 0.003,
    });
    this.playNoise({
      duration: 0.36,
      volume: 0.14,
      delay: 0.3,
      filterType: 'lowpass',
      filterFreq: 760,
      filterEndFreq: 120,
      reverbSend: 0.42,
    });
    [523.25, 783.99, 1046.5, 1567.98].forEach((f, idx) => {
      this.playVoice({
        freq: f,
        endFreq: f * 0.996,
        duration: 0.85,
        type: idx === 0 ? 'triangle' : 'sine',
        volume: idx === 0 ? 0.095 : 0.06,
        delay: 0.3 + idx * 0.015,
        attack: 0.003,
        reverbSend: 0.55,
      });
    });
  }

  playKnightFinaleChord() {
    // Triumphant short bright major chord (C5 - E5 - G5 - C6)
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      this.playVoice({
        freq: f,
        duration: 0.52,
        type: idx % 2 === 0 ? 'triangle' : 'sine',
        volume: 0.075,
        delay: idx * 0.028,
        attack: 0.006,
        filterFreq: 4200,
        reverbSend: 0.45,
      });
    });
  }

  playExecute() {
    // Crisp shadow-blade slice + sub punch + icy shimmer
    this.playVoice({
      freq: 155,
      endFreq: 44,
      duration: 0.14,
      type: 'sine',
      volume: 0.13,
      attack: 0.002,
    });
    this.playNoise({
      duration: 0.09,
      volume: 0.095,
      filterType: 'bandpass',
      filterFreq: 3800,
      filterEndFreq: 1100,
      filterQ: 2.0,
      reverbSend: 0.26,
    });
    this.playVoice({
      freq: 1396.91,
      endFreq: 1760,
      duration: 0.16,
      type: 'sine',
      volume: 0.055,
      delay: 0.02,
      attack: 0.003,
      reverbSend: 0.32,
    });
  }

  playBreakProp(kind: 'wood' | 'crystal' = 'wood') {
    this.playNoise({
      duration: 0.11,
      volume: 0.1,
      filterType: 'bandpass',
      filterFreq: kind === 'crystal' ? 2800 : 880,
      filterEndFreq: kind === 'crystal' ? 1400 : 320,
      filterQ: 1.6,
      reverbSend: 0.25,
    });
    this.playVoice({
      freq: kind === 'crystal' ? 1320 : 185,
      endFreq: kind === 'crystal' ? 780 : 65,
      duration: 0.12,
      type: kind === 'crystal' ? 'sine' : 'triangle',
      volume: 0.085,
      attack: 0.002,
      reverbSend: 0.28,
    });
  }

  playPortalEnter() {
    [293.66, 440, 587.33, 880].forEach((freq, idx) => {
      this.playVoice({
        freq,
        endFreq: freq * 1.15,
        duration: 0.32,
        type: 'sine',
        volume: 0.075,
        delay: idx * 0.055,
        attack: 0.015,
        filterFreq: 3200,
        reverbSend: 0.45,
      });
    });
  }

  private lastChronoShatterTime = 0;

  playChronoTick() {
    // Crisp escapement clock tick during Global Time Stop
    this.playNoise({
      duration: 0.022,
      volume: 0.055,
      filterType: 'highpass',
      filterFreq: 3200,
      reverbSend: 0.18,
      bus: 'chrono',
    });
    this.playVoice({
      freq: 1480,
      endFreq: 960,
      duration: 0.055,
      type: 'triangle',
      volume: 0.075,
      attack: 0.001,
      reverbSend: 0.2,
      bus: 'chrono',
    });
    this.playVoice({
      freq: 2960,
      duration: 0.04,
      type: 'sine',
      volume: 0.032,
      attack: 0.001,
      bus: 'chrono',
    });
  }

  playTimeDebtShatter() {
    const now = performance.now();
    if (now - this.lastChronoShatterTime < 85) return;
    this.lastChronoShatterTime = now;
    // Glass shatter + rapid fast clock ticks
    this.playNoise({
      duration: 0.12,
      volume: 0.11,
      filterType: 'highpass',
      filterFreq: 2600,
      filterEndFreq: 4800,
      reverbSend: 0.32,
      bus: 'chrono',
    });
    [1760, 2349.32, 3135.96].forEach((freq, idx) => {
      this.playVoice({
        freq,
        endFreq: freq * 0.92,
        duration: 0.13,
        type: 'sine',
        volume: 0.055,
        delay: idx * 0.025,
        attack: 0.001,
        reverbSend: 0.25,
        bus: 'chrono',
      });
    });
  }

  playChronoRewind() {
    // Dramatic tape-rewind whoosh + reverse clock chime
    this.playNoise({
      duration: 0.45,
      volume: 0.13,
      filterType: 'bandpass',
      filterFreq: 3600,
      filterEndFreq: 380,
      filterQ: 2.0,
      reverbSend: 0.35,
      bus: 'chrono',
    });
    this.playVoice({
      freq: 140,
      endFreq: 680,
      duration: 0.42,
      type: 'triangle',
      volume: 0.14,
      attack: 0.02,
      filterFreq: 2200,
      reverbSend: 0.35,
      bus: 'chrono',
    });
    [1318.51, 987.77, 783.99, 1567.98].forEach((freq, idx) => {
      this.playVoice({
        freq,
        duration: 0.18,
        type: 'sine',
        volume: 0.08,
        delay: 0.05 + idx * 0.075,
        attack: 0.004,
        reverbSend: 0.35,
        bus: 'chrono',
      });
    });
  }
}

export const sound = new SoundEngine();
