// Small helpers: DOM lookup, math, dates, time formatting, text measuring.
const $ = (id) => document.getElementById(id);
const mod = (a, n) => ((a % n) + n) % n;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const graphemes = window.Intl && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
const glyphCount = (w) => graphemes ? [...graphemes.segment(w)].length : w.length;
// Same rule as the original: days since a fixed local-midnight epoch, wrapped over the puzzle list.
function dayNumber(d = new Date()) {
  const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((midnight - EPOCH) / 864e5);
}
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
