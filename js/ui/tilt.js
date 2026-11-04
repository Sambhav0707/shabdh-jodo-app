// Pointer tilt for the tiles.
// ---- pointer tilt: tiles lean toward the cursor / finger and catch a moving glare ----
(function tilt() {
  if (reducedMotion) return;
  const board = $("board");
  const reset = (el) => { ["--rx", "--ry", "--z"].forEach((p) => el.style.removeProperty(p)); el.classList.remove("tilt"); };
  const lean = (e) => {
    const el = e.target.closest && e.target.closest(".tile");
    if (!el || el.classList.contains("pop") || el.classList.contains("shake")) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", ((px - .5) * 22).toFixed(1) + "deg");
    el.style.setProperty("--rx", (-(py - .5) * 22).toFixed(1) + "deg");
    el.style.setProperty("--mx", (px * 100).toFixed(0) + "%");
    el.style.setProperty("--my", (py * 100).toFixed(0) + "%");
    if (!el.classList.contains("sel") && e.pointerType !== "touch") el.style.setProperty("--z", "14px");
    el.classList.add("tilt");
  };
  board.addEventListener("pointermove", lean);
  board.addEventListener("pointerdown", lean);
  const leave = (e) => { const el = e.target.closest && e.target.closest(".tile"); if (el) reset(el); };
  board.addEventListener("pointerout", leave);
  board.addEventListener("pointerup", leave);
  board.addEventListener("pointercancel", leave);
})();
