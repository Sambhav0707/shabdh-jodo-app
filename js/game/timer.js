// Game timer and the daily countdown tick.
// The timer runs only while the game is in progress and the tab is visible.
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  if (state && state.started && !state.done && !document.hidden) {
    state.elapsed += now - lastTick;
    renderTimer();
    if (Math.floor(state.elapsed / 1000) % 5 === 0) persist();
  }
  lastTick = now;
  updateCountdown();
}, 1000);
document.addEventListener("visibilitychange", () => { lastTick = Date.now(); if (document.hidden) persist(); });
