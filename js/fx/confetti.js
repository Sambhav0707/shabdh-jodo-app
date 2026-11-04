// Win confetti.
// ---- confetti ----
function confetti() {
  if (reducedMotion) return;
  const c = $("confetti"), ctx = c.getContext("2d");
  c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  c.classList.remove("hidden");
  const colors = ["#f6d860", "#9fcb6b", "#9cb9f0", "#c08ad6", "#e07a1f"];
  const parts = Array.from({ length: 120 }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 80, y: innerHeight * .35,
    vx: (Math.random() - .5) * 9, vy: -Math.random() * 9 - 3, r: Math.random() * 6 + 4,
    rot: Math.random() * 6, vr: (Math.random() - .5) * .3, color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const end = performance.now() + 2200;
  (function frame(now) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += .25; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
    }
    if (now < end) requestAnimationFrame(frame);
    else { ctx.setTransform(1, 0, 0, 1, 0, 0); c.classList.add("hidden"); }
  })(performance.now());
}
