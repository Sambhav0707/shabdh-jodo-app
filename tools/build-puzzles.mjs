// Validates each language's group bank and builds a fixed, reproducible list of daily puzzles.
// Usage: node tools/build-puzzles.mjs [hi|hinglish|kn|te|ta|all] [count]
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// Character ranges allowed in words; names may also use + _ ' " ( ) , : / ? ! . and curly quotes.
const LANGS = {
  hi:       { script: "\\u0900-\\u097F", seed: 20260101, maxLen: 10 },
  hinglish: { script: "A-Za-z'",          seed: 20260202, maxLen: 12, latin: true },
  kn:       { script: "\\u0C80-\\u0CFF", seed: 20260303, maxLen: 12 },
  te:       { script: "\\u0C00-\\u0C7F", seed: 20260404, maxLen: 12 },
  ta:       { script: "\\u0B80-\\u0BFF", seed: 20260505, maxLen: 12 },
};
const FAMILIES = new Set(["food", "fruit_veg", "animal", "nature", "body", "home", "clothing", "people", "profession",
  "place", "culture", "festival", "religion_myth", "music_dance", "sport_game", "science", "education", "transport",
  "time", "color_shape", "number", "emotion", "language", "synonym", "compound", "idiom", "object", "health", "money_work"]);

const arg = process.argv[2] || "all";
const COUNT = Number(process.argv[3]) || 730;
const targets = arg === "all" ? Object.keys(LANGS) : [arg];
for (const t of targets) {
  if (!LANGS[t]) { console.error(`Unknown language "${t}". Use one of: ${Object.keys(LANGS).join(", ")}, all`); process.exit(1); }
}

const graphemes = new Intl.Segmenter("und", { granularity: "grapheme" });
const norm = (s) => s.normalize("NFC").trim();

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let failed = false;
for (const lang of targets) failed = !(await build(lang)) || failed;
process.exit(failed ? 1 : 0);

async function build(lang) {
  const cfg = LANGS[lang];
  const rand = mulberry32(cfg.seed);
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const WORD_RE = new RegExp(`^[${cfg.script}\\u200C\\u200D-]+( [${cfg.script}\\u200C\\u200D-]+)*$`);
  const NAME_RE = new RegExp(`^[${cfg.script}\\u200C\\u200D \\-+_()'"‘’“”,:/?!.]+$`);
  // Words that fit on a 4-across tile: at most two words, each short enough.
  const fitsTile = (w) => {
    const parts = w.split(" ");
    if (parts.length > 2) return false;
    return cfg.latin ? parts.every((p) => p.length <= cfg.maxLen) : [...graphemes.segment(w)].length <= cfg.maxLen;
  };
  // Key that treats two spellings as the same word (Hinglish varies: case, ee/i, oo/u).
  const key = (w) => cfg.latin ? w.toLowerCase().replace(/ee/g, "i").replace(/oo/g, "u").replace(/[^a-z]/g, "") : w;

  const dir = join(here, "bank", lang);
  let files;
  try { files = readdirSync(dir).filter((f) => /^level[0-3].*\.mjs$/.test(f)).sort(); }
  catch { console.error(`[${lang}] no bank folder at ${dir}`); return false; }

  const errors = [];
  const levels = [[], [], [], []];
  const names = [new Set(), new Set(), new Set(), new Set()];
  for (const file of files) {
    const lvl = Number(file[5]);
    const mod = await import(pathToFileURL(join(dir, file)).href);
    mod.default.forEach((g, i) => {
      const where = `${file}[${i}] ${g?.name ?? ""}`;
      if (!g || typeof g.name !== "string" || typeof g.family !== "string" || !Array.isArray(g.words)) {
        errors.push(`${where}: missing name/family/words`); return;
      }
      const name = norm(g.name);
      const words = g.words.map((w) => norm(String(w)));
      if (!NAME_RE.test(name)) errors.push(`${where}: name has characters outside the script`);
      if (!FAMILIES.has(g.family)) errors.push(`${where}: unknown family "${g.family}"`);
      if (words.length < 4 || words.length > 6) errors.push(`${where}: needs 4–6 words, has ${words.length}`);
      const bad = words.filter((w) => !WORD_RE.test(w));
      if (bad.length) errors.push(`${where}: invalid words ${bad.join(", ")}`);
      if (new Set(words.map(key)).size !== words.length) errors.push(`${where}: duplicate words`);
      const nameKey = cfg.latin ? name.toLowerCase() : name;
      if (names[lvl].has(nameKey)) errors.push(`${where}: duplicate group name in level ${lvl}`);
      names[lvl].add(nameKey);
      levels[lvl].push({ id: `${file}:${i}`, level: lvl, name, family: g.family, words, tileWords: words.filter(fitsTile) });
    });
  }
  levels.forEach((groups, lvl) => {
    const usable = groups.filter((g) => g.tileWords.length >= 4).length;
    if (usable < COUNT) errors.push(`level${lvl}: only ${usable} groups with 4 tile-sized words, need ${COUNT}`);
  });
  if (errors.length) {
    console.error(`[${lang}] bank validation failed (${errors.length} problems):\n` +
      errors.slice(0, 80).map((e) => "  - " + e).join("\n") + (errors.length > 80 ? `\n  … and ${errors.length - 80} more` : ""));
    return false;
  }

  // Ambiguity index: groups sharing any candidate word can never meet in one puzzle.
  const all = levels.flat();
  const byWord = new Map();
  for (const g of all) for (const w of g.words) {
    const k = key(w);
    if (!byWord.has(k)) byWord.set(k, new Set());
    byWord.get(k).add(g.id);
  }
  const conflicts = new Map();
  for (const g of all) {
    const set = new Set();
    for (const w of g.words) for (const id of byWord.get(key(w))) if (id !== g.id) set.add(id);
    conflicts.set(g.id, set);
  }
  const compatible = (g, picked) => picked.every((p) => p.family !== g.family && !conflicts.get(g.id).has(p.id));

  const nameKey = (g) => g.name.toLowerCase();
  const ORDER = [3, 2, 1, 0]; // most constrained (wordplay) levels first

  // One attempt shuffles the pools and fills every puzzle. A category name is used at most once,
  // even if two levels list it. If a shuffle paints itself into a corner, try another (still seeded).
  let pools, used, puzzles, lastFail = "";
  for (let attempt = 0; attempt < 40; attempt++) {
    pools = levels.map((groups) => shuffle(groups.filter((g) => g.tileWords.length >= 4)));
    used = new Set();
    const usedNames = new Set();
    const pick = (picked, depth) => {
      if (depth === ORDER.length) return picked;
      let tries = 0;
      for (const g of pools[ORDER[depth]]) {
        if (used.has(g.id) || usedNames.has(nameKey(g)) || !compatible(g, picked)) continue;
        const res = pick([...picked, g], depth + 1);
        if (res) return res;
        if (++tries > 40) break;
      }
      return null;
    };
    puzzles = [];
    for (let i = 0; i < COUNT; i++) {
      const groups = pick([], 0);
      if (!groups) {
        lastFail = `puzzle ${i + 1}; unused groups per level: ${pools.map((p) => p.filter((g) => !used.has(g.id)).length).join(" / ")}`;
        puzzles = null;
        break;
      }
      groups.forEach((g) => { used.add(g.id); usedNames.add(nameKey(g)); });
      groups.sort((a, b) => a.level - b.level);
      puzzles.push({ id: i + 1, groups: groups.map((g) => [g.name, shuffle(g.tileWords).slice(0, 4)]) });
    }
    if (puzzles) break;
  }
  if (!puzzles) {
    console.error(`[${lang}] could not build ${COUNT} puzzles after 40 attempts (last failed at ${lastFail}). Add more groups.`);
    return false;
  }
  for (const p of puzzles) {
    const words = p.groups.flatMap(([, w]) => w.map(key));
    if (new Set(words).size !== 16) throw new Error(`[${lang}] puzzle ${p.id} has repeated words`);
  }

  mkdirSync(join(root, "puzzles"), { recursive: true });
  writeFileSync(join(root, "puzzles", `${lang}.js`),
    `// GENERATED by tools/build-puzzles.mjs — edit tools/bank/${lang}/*.mjs instead.\n` +
    `(window.PUZZLES_BY_LANG = window.PUZZLES_BY_LANG || {})[${JSON.stringify(lang)}] = [\n` +
    puzzles.map((p) => JSON.stringify(p)).join(",\n") + "\n];\n");

  const skipped = levels.map((l) => l.filter((g) => g.tileWords.length < 4).length);
  const spare = pools.map((p) => p.filter((g) => !used.has(g.id)).length);
  console.log(`[${lang}] built ${puzzles.length} puzzles -> puzzles/${lang}.js | bank ${levels.map((l) => l.length).join("/")}` +
    ` | too long for tiles ${skipped.join("/")} | spare ${spare.join("/")}`);
  return true;
}
