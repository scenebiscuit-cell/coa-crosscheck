/* Header art: three trichomes (clear, milky, amber) that watch the pointer, blink, and react to the verdict.
   Decorative only: hidden from screen readers, no focus stops, and no idle motion when the visitor
   prefers reduced motion. Exposes window.HeaderArt.mood("clear" | "review" | "hold" | "idle"). */
(function () {
  "use strict";
  const root = document.getElementById("crew");
  if (!root) return;
  const svg = root.querySelector("svg");
  const eyes = [...root.querySelectorAll(".eye")].map(g => ({
    g, pupil: g.querySelector(".pupil"), x: +g.dataset.x, y: +g.dataset.y,
    reach: +g.querySelector(".sclera").getAttribute("rx") * 0.45,
  }));
  const reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  /* ---------- eyes follow the pointer ---------- */
  // pointer position in the SVG's own coordinates, so the math works at any size
  function toSvg(cx, cy) {
    const m = svg.getScreenCTM();
    if (!m) return null;
    const p = svg.createSVGPoint(); p.x = cx; p.y = cy;
    return p.matrixTransform(m.inverse());
  }
  function look(px, py) {
    for (const e of eyes) {
      const dx = px - e.x, dy = py - e.y, d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 120) * e.reach;           // close to the eye: look less far
      e.pupil.setAttribute("transform", `translate(${(dx / d * k).toFixed(2)} ${(dy / d * k).toFixed(2)})`);
    }
  }
  let queued = null;
  function onPointer(ev) {
    queued = [ev.clientX, ev.clientY];
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const p = toSvg(queued[0], queued[1]);
      if (p) look(p.x, p.y);
    });
  }
  let frame = 0;
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("pointerdown", onPointer, { passive: true });   // touch: look where you tap
  // keyboard users: glance at whatever has focus
  document.addEventListener("focusin", (ev) => {
    const r = ev.target.getBoundingClientRect?.();
    if (r && r.width) onPointer({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
  });

  /* ---------- blinking ---------- */
  const tris = [...root.querySelectorAll(".tri")];
  function blinkSoon() {
    if (reduce.matches) return;
    setTimeout(() => {
      const t = tris[Math.floor(Math.random() * tris.length)];
      t.classList.remove("blink"); void t.getBoundingClientRect(); t.classList.add("blink");
      blinkSoon();
    }, 2600 + Math.random() * 3800);
  }
  blinkSoon();

  /* ---------- mood follows the verdict ---------- */
  // mouths are drawn relative to each trichome's own size
  const MOUTH = {
    idle:   (x, y, r) => `M${x - r * .16} ${y} Q${x} ${y + r * .12} ${x + r * .16} ${y}`,
    clear:  (x, y, r) => `M${x - r * .24} ${y - r * .03} Q${x} ${y + r * .26} ${x + r * .24} ${y - r * .03}`,
    review: (x, y, r) => `M${x - r * .15} ${y + r * .05} L${x + r * .15} ${y + r * .02}`,
    hold:   (x, y, r) => `M${x - r * .17} ${y + r * .1} Q${x} ${y - r * .06} ${x + r * .17} ${y + r * .1}`,
  };
  function mood(m) {
    if (!MOUTH[m]) m = "idle";
    root.dataset.mood = m;
    for (const t of tris) {
      const x = +t.dataset.mx, y = +t.dataset.my, r = +t.dataset.r;
      t.querySelector(".mouth").setAttribute("d", MOUTH[m](x, y, r));
    }
    if (m !== "idle" && !reduce.matches) { root.classList.remove("react"); void root.getBoundingClientRect(); root.classList.add("react"); }
  }
  mood("idle");
  window.HeaderArt = { mood };
})();
