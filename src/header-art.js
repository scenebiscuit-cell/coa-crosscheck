/* Header art: three trichomes (clear, milky, amber) that watch the pointer, blink, and react to the verdict.
   Decorative only: hidden from screen readers, no focus stops, and no idle motion when the visitor
   prefers reduced motion. Exposes window.HeaderArt.mood("clear" | "review" | "hold" | "idle")
   and window.HeaderArt.hat("cowboy" | "fedora" | false), which puts a hat on the tall clear trichome:
   a cowboy hat for Texas, an old-school black government fedora for federal hemp. hat(true) means "cowboy". */
(function () {
  "use strict";
  const root = document.getElementById("crew");
  if (!root) return;
  const svg = root.querySelector("svg");
  const eyes = [...root.querySelectorAll(".eye")].map(g => ({
    g, pupil: g.querySelector(".pupil"), x: +g.dataset.x, y: +g.dataset.y,
    reach: +g.dataset.reach || 3,
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
      const down = root.dataset.mood === "hold" ? e.reach * 0.7 : 0;   // sad eyes droop toward the floor
      e.pupil.setAttribute("transform", `translate(${(dx / d * k).toFixed(2)} ${(dy / d * k + down).toFixed(2)})`);
    }
  }
  let queued = null;
  let last = null;
  function onPointer(ev) {
    queued = [ev.clientX, ev.clientY];
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const p = toSvg(queued[0], queued[1]);
      if (p) { last = p; look(p.x, p.y); }
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
  const tris = [...root.querySelectorAll(".tri.fg")];   // only the ones with eyes blink
  function blinkSoon() {
    if (reduce.matches) return;
    setTimeout(() => {
      const t = tris[Math.floor(Math.random() * tris.length)];
      t.classList.remove("blink"); void t.getBoundingClientRect(); t.classList.add("blink");
      blinkSoon();
    }, 2600 + Math.random() * 3800);
  }
  blinkSoon();

  /* ---------- eyelids: a skeptical squint for Review, sad eyes for Hold ---------- */
  // each eye gets a lid line and a clip that hides the eye above it, so the lid looks like it slid down
  const NS_ = "http://www.w3.org/2000/svg";
  const defs = svg.querySelector("defs") || svg.insertBefore(document.createElementNS(NS_, "defs"), svg.firstChild);
  const lids = [...root.querySelectorAll(".tri.fg .eye")].map((g, i) => {
    const sc = g.querySelector(".sclera"), x = +sc.getAttribute("cx"), y = +sc.getAttribute("cy"), r = +sc.getAttribute("r");
    const side = g.classList.contains("l") ? 1 : -1;     // +1: left eye, its inner corner is on the right
    const clip = document.createElementNS(NS_, "clipPath"), shape = document.createElementNS(NS_, "path");
    clip.id = "lidclip-" + i; clip.append(shape); defs.append(clip);
    g.querySelector(".open").setAttribute("clip-path", `url(#${clip.id})`);
    const line = document.createElementNS(NS_, "path");
    line.setAttribute("class", "lid"); line.setAttribute("stroke-width", (r * 0.42).toFixed(2)); g.append(line);
    // one tear under each trichome's left eye, at its outer corner; CSS shows it only for Hold
    if (side > 0) {
      const tear = document.createElementNS(NS_, "path"), tx = x - r * 0.55, ty = y + r * 1.45, s = r * 0.5;
      tear.setAttribute("class", "tear");
      tear.setAttribute("d", `M${tx} ${ty - s * 1.5} Q${tx + s * 1.05} ${ty - s * 0.1} ${tx} ${ty + s} Q${tx - s * 1.05} ${ty - s * 0.1} ${tx} ${ty - s * 1.5}Z`);
      g.append(tear);
    }
    return { x, y, r, side, shape, line };
  });
  function setLids(kind) {
    for (const l of lids) {
      const { x, y, r, side } = l, w = r * 1.05;
      if (kind === "sad") {
        // inner corner raised, outer corner drooping: the lid slopes down away from the nose
        const hi = y - r * 0.78, lo = y - r * 0.05;
        const x1 = x - w, x2 = x + w, y1 = side > 0 ? lo : hi, y2 = side > 0 ? hi : lo;
        const arc = `Q${x} ${((y1 + y2) / 2 - r * 0.08).toFixed(2)} ${x2} ${y2.toFixed(2)}`;
        l.shape.setAttribute("d", `M${x1} ${y1.toFixed(2)} ${arc} V${y + r * 2} H${x1} Z`);
        l.line.setAttribute("d", `M${x1} ${y1.toFixed(2)} ${arc}`);
        continue;
      }
      if (kind !== "squint") { l.shape.setAttribute("d", `M${x - w * 2} ${y - w * 2}h${w * 4}v${w * 4}h${-w * 4}Z`); l.line.removeAttribute("d"); continue; }
      // the lid sits a little above centre and slopes down toward the nose: a narrow, skeptical look
      const yo = y - r * 0.32 - side * r * 0.16, yi = y - r * 0.32 + side * r * 0.16;
      const x1 = x - w, x2 = x + w, y1 = side > 0 ? yo : yi, y2 = side > 0 ? yi : yo;
      const sag = `Q${x} ${((y1 + y2) / 2 + r * 0.1).toFixed(2)} ${x2} ${y2.toFixed(2)}`;
      l.shape.setAttribute("d", `M${x1} ${y1.toFixed(2)} ${sag} V${y + r * 2} H${x1} Z`);
      l.line.setAttribute("d", `M${x1} ${y1.toFixed(2)} ${sag}`);
    }
  }

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
    setLids(m === "review" ? "squint" : m === "hold" ? "sad" : null);
    // re-aim the pupils for the new mood; before the pointer has moved they look straight ahead
    if (last) look(last.x, last.y);
    else for (const e of eyes) e.pupil.setAttribute("transform", `translate(0 ${m === "hold" ? (e.reach * 0.7).toFixed(2) : 0})`);
    for (const t of tris) {
      const x = +t.dataset.mx, y = +t.dataset.my, r = +t.dataset.r;
      t.querySelector(".mouth")?.setAttribute("d", MOUTH[m](x, y, r));   // eyes-only art has no mouth
    }
    if (m !== "idle" && !reduce.matches) { root.classList.remove("react"); void root.getBoundingClientRect(); root.classList.add("react"); }
  }

  /* ---------- hats: a cowboy hat for Texas, a government fedora for federal hemp ---------- */
  // each hat is drawn on the same 64-unit grid as the favicon: [path, fill, stroke]
  const HATS = {
    cowboy: { tilt: -7, parts: [
      ["M2 14 Q4 29 32 28 Q60 29 62 14 Q58 23 32 23 Q6 23 2 14 Z", "#8a5a1e"],
      ["M17 25 C16 15 18 5 24 5 Q28 9 32 7 Q36 9 40 5 C46 5 48 15 47 25 Q32 27 17 25 Z", "#b8843a"],
      ["M32 8 Q31 14 32 19", "none", "#8a5a1e"],
      ["M16.6 20 Q32 22.5 47.4 20 L47.2 24.4 Q32 26.6 16.8 24.4 Z", "#3b2412"],
    ] },
    // charcoal rather than pure black, with a grey edge, so it still reads on the dark green band
    fedora: { tilt: -4, parts: [
      ["M5 23 Q7 29.5 32 28.5 Q57 29.5 59 23 Q55 26 32 26 Q9 26 5 23 Z", "#24272b", "#6b737c"],
      ["M15.5 24 C14.5 15 17 7.5 24 6.5 Q28 9.5 32 8.5 Q36 9.5 40 6.5 C47 7.5 49.5 15 48.5 24 Q32 26 15.5 24 Z", "#2e3237", "#6b737c"],
      ["M32 9.5 Q30.8 14 32 18.5", "none", "#14161a"],
      ["M15.3 19.5 Q32 22 48.7 19.5 L48.6 23.6 Q32 26 15.4 23.6 Z", "#101214"],
      ["M44 20.6 L46.6 20.3 L46.6 23.4 L44 23.7 Z", "#4a5059"],
    ] },
  };
  // drawn to fit the trichome's own size; fills are set here so no stylesheet is needed
  const NS = "http://www.w3.org/2000/svg";
  function drawHat(t, kind) {
    // the trichome says where its hat goes: centre x, a point near the top of the head, and the head's size
    const x = +t.dataset.hx, cy = +t.dataset.hy, r = +t.dataset.hr;
    const u = r / 26, y = cy - r * 0.84;               // u: one unit of the 64-unit favicon drawing
    const P = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, a, b) => `${(x + (+a - 32) * u).toFixed(1)} ${(y + (+b - 20) * u).toFixed(1)}`);
    const outer = document.createElementNS(NS, "g"), g = document.createElementNS(NS, "g");
    outer.setAttribute("class", "hat"); outer.dataset.kind = kind; outer.append(g);   // outer moves when it drops on, inner holds the tilt
    for (const [d, fill, stroke] of HATS[kind].parts) {
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", P(d)); path.setAttribute("fill", fill);
      if (stroke) { path.setAttribute("stroke", stroke); path.setAttribute("stroke-width", ((fill === "none" ? 1.6 : 0.9) * u).toFixed(1)); path.setAttribute("stroke-linecap", "round"); path.setAttribute("stroke-linejoin", "round"); }
      g.append(path);
    }
    g.setAttribute("transform", `rotate(${HATS[kind].tilt} ${x} ${cy})`);   // tipped a little
    return outer;
  }
  function hat(kind) {
    if (kind === true) kind = "cowboy";
    if (!HATS[kind]) kind = false;
    if (kind) root.dataset.hat = kind; else delete root.dataset.hat;
    const t = root.querySelector(".tri.fg.clear") || root.querySelector(".tri.clear");
    if (!t) return;
    const head = t.querySelector(".head");
    let h = head.querySelector(".hat");
    if (h && h.dataset.kind !== kind) { h.remove(); h = null; }   // switching straight from one hat to another
    if (kind && !h) {
      h = drawHat(t, kind); head.append(h);
      if (!reduce.matches && h.animate) h.animate([{ transform: "translateY(-40px)", opacity: 0 }, { transform: "translateY(3px)", opacity: 1, offset: .75 }, { transform: "none", opacity: 1 }],
        { duration: 420, easing: "ease-out" });
    } else if (!kind && h) {
      if (!reduce.matches && h.animate) h.animate([{ transform: "none", opacity: 1 }, { transform: "translateY(-30px)", opacity: 0 }], { duration: 220, easing: "ease-in" }).onfinish = () => h.remove();
      else h.remove();
    }
  }

  mood("idle");
  window.HeaderArt = { mood, hat };
})();
