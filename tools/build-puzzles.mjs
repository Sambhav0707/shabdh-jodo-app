// Validates the group bank and builds a fixed, reproducible list of daily puzzles.
// Usage: node hindi-connections/tools/build-puzzles.mjs [count]
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const COUNT = Number(process.argv[2]) || 365;
const SEED = 20260101;
const FAMILIES = new Set(["food", "fruit_veg", "animal", "nature", "body", "home", "clothing", "people", "profession",
  "place", "culture", "festival", "religion_myth", "music_dance", "sport_game", "science", "education", "transport",
  "time", "color_shape", "number", "emotion", "language", "synonym", "compound", "idiom", "object", "health", "money_work"]);
const WORD_RE = /^[ऀ-ॿ‌‍-]+( [ऀ-ॿ‌‍-]+)*$/;
const NAME_RE = /^[ऀ-ॿ‌‍ \-+_()'"‘’“”,:/?!.]+$/;

const norm = (s) => s.normalize("NFC").trim();
const graphemes = new Intl.Segmenter("hi", { granularity: "grapheme" });
// Words that fit on a 4-across tile: at most two words and about ten letters.
const fitsTile = (w) => w.split(" ").length <= 2 && [...graphemes.segment(w)].length <= 10;

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---- load + validate ----
const errors = [];
const levels = [];
for (let lvl = 0; lvl < 4; lvl++) {
  const mod = await import("file://" + join(here, "bank", `level${lvl}.mjs`).replace(/\\/g, "/"));
  const names = new Set();
  const groups = [];
  mod.default.forEach((g, i) => {
    const where = `level${lvl}[${i}] ${g?.name ?? ""}`;
    if (!g || typeof g.name !== "string" || typeof g.family !== "string" || !Array.isArray(g.words)) {
      errors.push(`${where}: missing name/family/words`); return;
    }
    const name = norm(g.name);
    const words = g.words.map((w) => norm(String(w)));
    if (!NAME_RE.test(name)) errors.push(`${where}: name has non-Devanagari characters`);
    if (!FAMILIES.has(g.family)) errors.push(`${where}: unknown family "${g.family}"`);
    if (words.length < 4 || words.length > 6) errors.push(`${where}: needs 4–6 words, has ${words.length}`);
    const bad = words.filter((w) => !WORD_RE.test(w));
    if (bad.length) errors.push(`${where}: invalid words ${bad.join(", ")}`);
    if (new Set(words).size !== words.length) errors.push(`${where}: duplicate words`);
    if (names.has(name)) errors.push(`${where}: duplicate group name`);
    names.add(name);
    groups.push({ id: `${lvl}:${i}`, level: lvl, name, family: g.family, words, tileWords: words.filter(fitsTile) });
  });
  const usable = groups.filter((g) => g.tileWords.length >= 4).length;
  if (usable < COUNT) errors.push(`level${lvl}: only ${usable} groups with 4 tile-sized words, need ${COUNT}`);
  levels.push(groups);
}
if (errors.length) {
  console.error(`Bank validation failed (${errors.length} problems):\n` + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}

// ---- ambiguity index: groups sharing any candidate word can never meet in one puzzle ----
const byWord = new Map();
for (const g of levels.flat()) for (const w of g.words) {
  if (!byWord.has(w)) byWord.set(w, new Set());
  byWord.get(w).add(g.id);
}
const conflicts = new Map();
for (const g of levels.flat()) {
  const set = new Set();
  for (const w of g.words) for (const id of byWord.get(w)) if (id !== g.id) set.add(id);
  conflicts.set(g.id, set);
}
const compatible = (g, picked) => picked.every((p) => p.family !== g.family && !conflicts.get(g.id).has(p.id));

// ---- generate ----
const pools = levels.map((groups) => shuffle(groups.filter((g) => g.tileWords.length >= 4)));
const used = new Set();
const ORDER = [3, 2, 1, 0]; // most constrained (wordplay) levels first

function pick(picked, depth) {
  if (depth === ORDER.length) return picked;
  let tries = 0;
  for (const g of pools[ORDER[depth]]) {
    if (used.has(g.id) || !compatible(g, picked)) continue;
    const res = pick([...picked, g], depth + 1);
    if (res) return res;
    if (++tries > 40) break;
  }
  return null;
}

const puzzles = [];
for (let i = 0; i < COUNT; i++) {
  const groups = pick([], 0);
  if (!groups) {
    const left = levels.map((_, l) => pools[l].filter((g) => !used.has(g.id)).length);
    console.error(`Could not build puzzle ${i + 1}; unused groups per level: ${left.join(" / ")}. Add more groups.`);
    process.exit(1);
  }
  groups.forEach((g) => used.add(g.id));
  groups.sort((a, b) => a.level - b.level);
  puzzles.push({ id: i + 1, groups: groups.map((g) => [g.name, shuffle(g.tileWords).slice(0, 4)]) });
}

// ---- final self-check ----
for (const p of puzzles) {
  const all = p.groups.flatMap(([, w]) => w);
  if (new Set(all).size !== 16) throw new Error(`puzzle ${p.id} has repeated words`);
}

const out = "// GENERATED by tools/build-puzzles.mjs — edit tools/bank/*.mjs instead.\n" +
  "window.PUZZLES = [\n" + puzzles.map((p) => JSON.stringify(p)).join(",\n") + "\n];\n";
writeFileSync(join(here, "..", "puzzles.js"), out);

const famCount = {};
for (const p of puzzles) for (const [name] of p.groups) {
  const g = levels.flat().find((x) => x.name === name);
  famCount[g.family] = (famCount[g.family] || 0) + 1;
}
console.log(`Built ${puzzles.length} puzzles -> puzzles.js`);
console.log(`Groups skipped as too long for tiles: ${levels.map((l) => l.filter((g) => g.tileWords.length < 4).length).join(" / ")}`);
console.log(`Bank sizes: ${levels.map((l) => l.length).join(" / ")}; unused: ${levels.map((l) => l.filter((g) => !used.has(g.id)).length).join(" / ")}`);
console.log("Most used families: " + Object.entries(famCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([f, n]) => `${f} ${n}`).join(", "));
