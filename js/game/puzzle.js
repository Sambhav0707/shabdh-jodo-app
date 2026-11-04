// Puzzle selection, game state creation, saving, stats and share grid.
const puzzleFor = (day) => mod(day, PUZZLES.length);
function groupsOf(idx) { return PUZZLES[idx].groups.map(([name, words], level) => ({ name, words, level })); }
function newState(mode, day, puzzleIdx) {
  return { mode, day, puzzleIdx, count: PUZZLES.length, order: shuffled(groupsOf(puzzleIdx).flatMap((g) => g.words)),
           solved: [], mistakes: 0, guesses: [], seen: [], done: false, won: false,
           hintWord: null, elapsed: 0, started: false };
}
// Daily and archive games are saved per day; practice games are throwaway.
function openDay(day) {
  const mode = day === dayNumber() ? "daily" : "archive";
  const saved = load("game-" + day, null);
  state = saved && saved.count === PUZZLES.length ? saved : newState(mode, day, puzzleFor(day));
  state.mode = mode;
  selected = [];
  dealNext = true;
  render();
}
const startDaily = () => openDay(dayNumber());
function startPractice() {
  let idx;
  do { idx = Math.floor(Math.random() * PUZZLES.length); } while (PUZZLES.length > 1 && idx === state.puzzleIdx);
  state = newState("practice", null, idx);
  selected = [];
  dealNext = true;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function persist() { if (state && state.mode !== "practice") save("game-" + state.day, state); }
function levelOf(w) { return groupsOf(state.puzzleIdx).find((g) => g.words.includes(w)).level; }
function getStats() {
  const s = load("stats", {});
  return { played: 0, wins: 0, streak: 0, maxStreak: 0, lastWinDay: null, ...s, dist: s.dist || [0, 0, 0, 0, 0] };
}
function emojiGrid() { return state.guesses.map((g) => g.map((l) => EMOJI[l]).join("")).join("\n"); }
