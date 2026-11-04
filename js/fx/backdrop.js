// 3D backdrop (Three.js, loaded lazily; the CSS gradient is the fallback).
// Slabs in the four group colours rise and tumble behind the board, shy away from the pointer and
// scatter when you tap. A layer of dust gives depth, and a light follows the pointer.
const isDark = () => document.documentElement.dataset.theme === "dark" ||
  (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);

function startBackdrop() {
  const canvas = $("bg");
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" }); } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 18;
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(-5, 7, 10);
  scene.add(key);
  const glow = new THREE.PointLight(0xffd27a, 1.6, 30); // follows the pointer
  glow.position.set(0, 0, 6);
  scene.add(glow);

  // Slabs: loose tiles drifting upward, each with its own speed, sway and tumble.
  const colors = [0xf6d860, 0x9fcb6b, 0x9cb9f0, 0xc08ad6];
  const geo = new THREE.BoxGeometry(2.2, 1.6, 0.4);
  const mats = colors.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.12, transparent: true }));
  const slabs = [];
  const count = innerWidth * innerHeight > 700000 ? 40 : 26;
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, mats[i % 4]);
    m.userData = {
      size: 0.45 + Math.random() * 0.8, x: (Math.random() - 0.5) * 2, z: -24 + Math.random() * 16,
      y0: Math.random(), rise: 0.012 + Math.random() * 0.02, sway: 0.5 + Math.random() * 1.1, sp: 0.2 + Math.random() * 0.4, ph: Math.random() * 6.28,
      rx: Math.random() * 6, ry: Math.random() * 6, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      ox: 0, oy: 0, mx: 0, my: 0, spin: 0, cy: 0, // pointer offset, its velocity, extra spin
    };
    scene.add(m);
    slabs.push(m);
  }

  // Dust: a field of small points that drifts slowly and parallaxes against the slabs.
  const dustCount = 160, dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 50; dustPos[i * 3 + 1] = (Math.random() - 0.5) * 34; dustPos[i * 3 + 2] = -26 + Math.random() * 30;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ size: 0.12, sizeAttenuation: true, transparent: true, depthWrite: false });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  backdropTheme = () => {
    const dark = isDark();
    mats.forEach((m) => { m.opacity = dark ? 0.62 : 0.45; });
    dustMat.color.set(dark ? 0xcfc8ff : 0x4a3fa0);
    dustMat.opacity = dark ? 0.55 : 0.35;
    glow.intensity = dark ? 1.8 : 1.1;
  };
  backdropTheme();

  let w = 0, h = 0;
  function resize() {
    w = innerWidth; h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  const px = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", (e) => { px.tx = e.clientX / innerWidth - 0.5; px.ty = e.clientY / innerHeight - 0.5; });
  const vh = (z) => 2 * Math.tan(Math.PI / 8) * (camera.position.z - z);
  const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

  // A tap anywhere scatters the slabs near it.
  addEventListener("pointerdown", (e) => {
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    for (const m of slabs) {
      const d = m.userData, H = vh(d.z), W = H * camera.aspect;
      const dx = d.x * W * 0.55 + d.ox - nx * W, dy = d.cy - (-ny * H);
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 9) {
        const f = (1 - dist / 9) * 9;
        d.mx += (dx / dist) * f; d.my += (dy / dist) * f; d.spin += f * 0.9;
      }
    }
  });

  let last = 0;
  function frame(time) {
    const t = time / 1000, dt = Math.min(0.05, last ? t - last : 0.016);
    last = t;
    px.x += (px.tx - px.x) * 0.05; px.y += (px.ty - px.y) * 0.05;
    camera.position.x = px.x * 3.5; camera.position.y = -px.y * 2.5;
    camera.lookAt(0, 0, 0);
    dust.rotation.y = t * 0.02 + px.x * 0.3;
    dust.position.y = (t * 0.25) % 2;
    for (const m of slabs) {
      const d = m.userData, H = vh(d.z), W = H * camera.aspect;
      const flow = (d.y0 + t * d.rise) % 1;               // 0 → 1 rises from below the screen to above it
      const baseX = d.x * W * 0.55 + Math.sin(t * d.sp + d.ph) * d.sway;
      const baseY = (flow - 0.5) * H * 1.15;
      d.cy = baseY;
      // Shy away from the pointer, then spring back.
      const pdx = baseX + d.ox - px.tx * W, pdy = baseY + d.oy - (-px.ty * H);
      const pd = Math.hypot(pdx, pdy) || 1;
      const push = pd < 5 ? (1 - pd / 5) * 26 : 0;
      d.mx += ((pdx / pd) * push - d.ox * 7 - d.mx * 3.2) * dt;
      d.my += ((pdy / pd) * push - d.oy * 7 - d.my * 3.2) * dt;
      d.ox += d.mx * dt; d.oy += d.my * dt;
      d.spin *= Math.pow(0.15, dt);
      m.position.set(baseX + d.ox, baseY + d.oy, d.z);
      m.rotation.set(d.rx + t * d.vx + d.spin * 0.6, d.ry + t * d.vy + d.spin, Math.sin(t * d.sp + d.ph) * 0.4);
      m.scale.setScalar(d.size * smooth(0, 0.08, flow) * smooth(1, 0.92, flow)); // fade in and out at the edges
    }
    glow.position.set(px.tx * vh(0) * camera.aspect, -px.ty * vh(0), 6);
    renderer.render(scene, camera);
  }
  let raf = 0;
  const loop = (time) => { frame(time); raf = requestAnimationFrame(loop); };
  const run = () => { cancelAnimationFrame(raf); last = 0; if (!reducedMotion && !document.hidden) raf = requestAnimationFrame(loop); else frame(performance.now()); };
  addEventListener("resize", () => { resize(); if (reducedMotion) frame(0); });
  document.addEventListener("visibilitychange", run);
  run();
  canvas.classList.add("on");
}

function loadBackdrop() {
  if (navigator.connection && navigator.connection.saveData) return;
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  s.async = true;
  s.onload = () => { try { startBackdrop(); } catch {} };
  document.head.appendChild(s);
}

matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => backdropTheme());
