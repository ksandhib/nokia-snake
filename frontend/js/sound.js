// Retro beeps synthesized locally with WebAudio: no audio files, no network. Fails silently.
let ctx = null;
const SOUNDS = {
  eat: [[880, 0.06]],
  click: [[600, 0.03]],
  start: [[660, 0.08], [880, 0.14]],
  over: [[300, 0.15], [220, 0.15], [140, 0.35]],
};

export const sound = {
  enabled: true,
  play(name) {
    if (!this.enabled) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      let t = ctx.currentTime;
      for (const [freq, dur] of SOUNDS[name]) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "square"; o.frequency.value = freq; g.gain.value = 0.04;
        o.connect(g).connect(ctx.destination);
        o.start(t); o.stop(t + dur); t += dur;
      }
    } catch { /* silent */ }
  },
};
