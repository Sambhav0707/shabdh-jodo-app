// Sound effects (Web Audio, off by default).
// ---- sound (Web Audio, off by default) ----
let audioCtx;
function sound(kind) {
  if (!settings.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = { tap: [[660, 0, .05]], wrong: [[220, 0, .18], [180, .12, .2]],
                    correct: [[523, 0, .12], [659, .1, .12], [784, .2, .18]],
                    win: [[523, 0, .15], [659, .12, .15], [784, .24, .15], [1047, .36, .3]] }[kind];
    for (const [freq, at, dur] of notes) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = kind === "wrong" ? "sawtooth" : "triangle";
      o.frequency.value = freq;
      const start = audioCtx.currentTime + at;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(kind === "wrong" ? 0.06 : 0.12, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start(start); o.stop(start + dur + 0.02);
    }
  } catch {}
}
