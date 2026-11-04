// Player actions: submit a guess, use a hint, finish the game.
async function submit() {
  if (selected.length !== 4 || busy) return;
  const seenKey = selected.slice().sort().join("|");
  if (state.seen.includes(seenKey)) { toast(t.already); return; }
  state.seen.push(seenKey);
  const levels = selected.map(levelOf);
  state.guesses.push(levels);
  const counts = {};
  for (const l of levels) counts[l] = (counts[l] || 0) + 1;
  const best = Math.max(...Object.values(counts));

  if (best === 4) {
    busy = true;
    render();
    if (!reducedMotion) {
      selected.map(tileOf).forEach((el, i) => { el.style.animationDelay = i * 90 + "ms"; el.classList.add("hop"); });
      await wait(650);
    }
    sound("correct");
    state.solved.push(levels[0]);
    freshLevel = levels[0];
    selected = [];
    busy = false;
    if (state.solved.length === 4) { finish(true); return; }
  } else {
    state.mistakes++;
    sound("wrong");
    if (navigator.vibrate) navigator.vibrate(120);
    toast(best === 3 ? t.oneAway : t.wrong);
    selected.map(tileOf).forEach((el) => { el.classList.remove("pop"); el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); });
    if (state.mistakes >= MAX_MISTAKES) {
      selected = [];
      persist();
      setTimeout(() => finish(false), 650);
      return;
    }
    persist();
    // Update the mistake dots only, so the tiles keep their shake animation.
    $("dots").innerHTML = Array.from({ length: MAX_MISTAKES }, (_, i) =>
      `<span class="dot${i < state.mistakes ? " used" : ""}"></span>`).join("");
    return;
  }
  persist();
  render();
}
function useHint() {
  if (state.done || state.hintWord) return;
  const easiest = groupsOf(state.puzzleIdx).find((g) => !state.solved.includes(g.level));
  state.hintWord = easiest.words[Math.floor(Math.random() * 4)];
  state.started = true;
  toast(t.hintToast);
  persist();
  render();
}
function finish(won) {
  state.done = true;
  state.won = won;
  if (state.mode !== "practice") {
    if (!load("result-" + state.day, null)) {
      save("result-" + state.day, { won, mistakes: state.mistakes, time: state.elapsed });
      const s = getStats();
      s.played++;
      if (won) { s.wins++; s.dist[state.mistakes]++; } else s.dist[4]++;
      if (state.mode === "daily") {
        if (won) {
          s.streak = s.lastWinDay === state.day - 1 ? s.streak + 1 : 1;
          s.lastWinDay = state.day;
          s.maxStreak = Math.max(s.maxStreak, s.streak);
        } else s.streak = 0;
      }
      save("stats", s);
    }
  }
  persist();
  render();
  if (won) {
    sound("win");
    confetti();
    toast(state.mistakes === 0 ? t.perfect : t.great);
  } else toast(t.nextTime);
}
