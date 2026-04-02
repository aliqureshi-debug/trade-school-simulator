let audioCtx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function tone(freq: number, duration: number, volume = 0.12, type: OscillatorType = 'sine', delay = 0): void {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    const now = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch {
    // Web Audio not supported
  }
}

function sweep(freqStart: number, freqEnd: number, duration: number, volume = 0.1, delay = 0): void {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime + delay;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.linearRampToValueAtTime(freqEnd, now + duration);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch {
    // Web Audio not supported
  }
}

export const sound = {
  candleClose() {
    tone(800, 0.03, 0.05);
  },

  tradeOpen() {
    tone(440, 0.08, 0.1);
    tone(550, 0.08, 0.1, 'sine', 0.09);
  },

  tradeWin() {
    tone(523, 0.1, 0.12);
    tone(659, 0.1, 0.12, 'sine', 0.11);
    tone(784, 0.15, 0.12, 'sine', 0.22);
  },

  tradeLoss() {
    tone(440, 0.1, 0.1);
    tone(330, 0.15, 0.1, 'sine', 0.12);
  },

  phaseUnlock() {
    sweep(400, 1200, 0.2, 0.1);
    tone(800, 0.3, 0.08, 'sine', 0.22);
  },

  achievement() {
    tone(1047, 0.15, 0.12);
  },

  ariaWarn() {
    tone(220, 0.1, 0.1);
    tone(220, 0.1, 0.1, 'sine', 0.15);
  },

  levelUp() {
    tone(523, 0.08, 0.1);
    tone(659, 0.08, 0.1, 'sine', 0.09);
    tone(784, 0.08, 0.1, 'sine', 0.18);
    tone(1047, 0.2, 0.12, 'sine', 0.27);
  },

  newsSpike() {
    // Three rapid ascending beeps: 440 → 550 → 660 Hz
    tone(440, 0.08, 0.14, 'sine', 0);
    tone(550, 0.08, 0.14, 'sine', 0.1);
    tone(660, 0.1, 0.16, 'sine', 0.2);
  },

  cooldownEnd() {
    // Soft ascending two-tone: 440 → 660 Hz
    tone(440, 0.12, 0.09, 'sine', 0);
    tone(660, 0.2, 0.11, 'sine', 0.14);
  },

  setMuted(val: boolean) {
    muted = val;
  },

  isMuted() {
    return muted;
  },
};
