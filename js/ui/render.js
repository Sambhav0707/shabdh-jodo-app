// Draws the board, selection, timer and result panel.
function subtitle() {
  if (state.mode === "daily") return t.today + (state.day + 1);
  if (state.mode === "archive") return t.old + (state.day + 1);
  return t.practice;
}
function tileSizeClass(w) {
  const n = LANGS[lang].htmlLang === "hi-Latn" ? w.length * 0.7 : glyphCount(w);
  return n > 9 ? " xlong" : n > 6 ? " long" : "";
}
function render() {
  if (!state) return;
  const board = $("board");
  board.innerHTML = "";
  const groups = groupsOf(state.puzzleIdx);
  // On a loss, reveal the remaining groups in difficulty order.
  const shown = state.done ? [...state.solved, ...groups.map((g) => g.level).filter((l) => !state.solved.includes(l))] : state.solved;
  for (const lvl of shown) {
    const g = groups[lvl];
    const row = document.createElement("div");
    row.className = "solved-row lv" + lvl + (lvl === freshLevel ? " fresh" : "");
    row.innerHTML = `<strong></strong><span></span>`;
    row.querySelector("strong").textContent = g.name;
    row.querySelector("span").textContent = g.words.join(", ");
    board.appendChild(row);
  }
  freshLevel = null;
  const solvedWords = new Set(shown.flatMap((l) => groups[l].words));
  const dealing = dealNext && !reducedMotion;
  dealNext = false;
  let tileIdx = 0;
  for (const w of state.order.filter((w) => !solvedWords.has(w))) {
    const b = document.createElement("button");
    b.className = "tile" + (selected.includes(w) ? " sel" : "") + (w === state.hintWord ? " hint" : "") + tileSizeClass(w) + (dealing ? " deal" : "");
    if (dealing) b.style.setProperty("--i", tileIdx++);
    b.textContent = w;
    b.dataset.word = w;
    b.setAttribute("aria-pressed", selected.includes(w));
    b.onclick = () => toggle(w);
    board.appendChild(b);
  }
  fitTiles();
  $("sub").textContent = subtitle();
  $("dots").innerHTML = Array.from({ length: MAX_MISTAKES }, (_, i) =>
    `<span class="dot${i < state.mistakes ? " used" : ""}"></span>`).join("");
  $("submitBtn").disabled = selected.length !== 4 || busy;
  $("clearBtn").disabled = selected.length === 0;
  $("hintBtn").disabled = !!state.hintWord;
  for (const id of ["controls", "mistakesWrap"]) $(id).classList.toggle("hidden", state.done);
  $("result").classList.toggle("hidden", !state.done);
  renderTimer();
  if (state.done) renderResult();
}
function toggle(w) {
  if (state.done || busy) return;
  state.started = true;
  let added = false;
  if (selected.includes(w)) selected = selected.filter((x) => x !== w);
  else if (selected.length < 4) { selected.push(w); added = true; sound("tap"); }
  // Update tiles in place (no rebuild) so the flip and lift transitions can play.
  document.querySelectorAll(".tile").forEach((el) => {
    const on = selected.includes(el.dataset.word);
    el.classList.toggle("sel", on);
    el.setAttribute("aria-pressed", on);
  });
  const el = added && tileOf(w);
  if (el && !reducedMotion) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
  $("submitBtn").disabled = selected.length !== 4 || busy;
  $("clearBtn").disabled = selected.length === 0;
}
const tileOf = (w) => document.querySelector(`.tile[data-word="${CSS.escape(w)}"]`);
function renderResult() {
  $("resultTitle").textContent = state.won ? t.won : t.lost;
  $("resultMeta").textContent = `${t.time} ${fmtTime(state.elapsed)} · ${t.mistakes} ${state.mistakes}` + (state.hintWord ? " · " + t.hintUsed : "");
  $("emojiGrid").textContent = emojiGrid();
  $("todayBtn").classList.toggle("hidden", state.mode === "daily");
  updateCountdown();
}
function renderTimer() {
  $("timer").textContent = state && (state.started || state.done) ? "⏱ " + fmtTime(state.elapsed) : "";
}
function updateCountdown() {
  if (!state) return;
  if (state.mode === "daily" && state.day !== dayNumber() && state.done) { startDaily(); return; }
  if (!state.done) return;
  if (state.mode !== "daily") { $("nextIn").textContent = ""; return; }
  const now = new Date();
  const ms = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
  const pad = (n) => String(n).padStart(2, "0");
  $("nextIn").textContent = `${t.nextIn} ${pad(Math.floor(ms / 36e5))}:${pad(Math.floor((ms % 36e5) / 6e4))}:${pad(Math.floor((ms % 6e4) / 1e3))}`;
}
