// Stats and archive dialogs, and result sharing.
// ---- dialogs ----
function openStats() {
  const s = getStats();
  const pct = s.played ? Math.round((s.wins / s.played) * 100) : 0;
  $("statsNums").innerHTML = [[t.played, s.played], [t.winPct, pct], [t.streak, s.streak], [t.maxStreak, s.maxStreak]]
    .map(([k, v]) => `<div><b>${v}</b><small>${k}</small></div>`).join("");
  const max = Math.max(1, ...s.dist);
  const cur = state && state.done && state.mode !== "practice" ? (state.won ? state.mistakes : 4) : -1;
  $("dist").innerHTML = s.dist.map((n, i) =>
    `<span>${i === 4 ? t.lostShort : i}</span><div class="bar${i === cur ? " cur" : ""}" style="width:${Math.max(8, (n / max) * 100)}%">${n}</div>`).join("");
  $("statsDlg").showModal();
}
function openArchive() {
  if (!PUZZLES) return;
  const today = dayNumber();
  const grid = $("archiveGrid");
  grid.innerHTML = "";
  for (let d = today; d >= 0; d--) {
    const r = load("result-" + d, null);
    const b = document.createElement("button");
    b.className = (r ? (r.won ? "won" : "lost") : "") + (d === today ? " today" : "");
    b.innerHTML = `${d + 1}<small>${r ? (r.won ? "✓" : "✗") : d === today ? t.todayShort : "&nbsp;"}</small>`;
    b.setAttribute("aria-label", `#${d + 1}`);
    b.onclick = () => { $("archiveDlg").close(); openDay(d); window.scrollTo({ top: 0 }); };
    grid.appendChild(b);
  }
  $("archiveDlg").showModal();
}
async function share() {
  const label = state.mode === "practice" ? t.practiceBtn : `#${state.day + 1}`;
  const text = `${t.title} (${LANGS[lang].name}) ${label}${state.hintWord ? " 💡" : ""}\n⏱ ${fmtTime(state.elapsed)}\n${emojiGrid()}`;
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); toast(t.copied); }
  } catch {}
}
