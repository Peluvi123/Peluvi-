/* Peluvi home motion: curtain transitions, smooth scroll, cursor reveal hero,
   block text reveals, color-shifting collage, expanding image, card fan. */
(() => {
  const body = document.body;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const curtain = document.querySelector(".pv-curtain");
  const header = document.querySelector(".pv-header");

  /* ---------- menu ---------- */
  const menu = document.querySelector(".pv-menu");
  const burger = document.querySelector(".pv-burger");
  let lenis = null;
  const setMenu = (open) => {
    if (!menu || !burger) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    body.classList.toggle("pv-menu-open", open);
    if (open) {
      menu.hidden = false;
      lenis?.stop();
      if (hasGsap && !reduce) {
        gsap.fromTo(menu, { clipPath: "circle(0% at calc(100% - 60px) 34px)" }, { clipPath: "circle(150% at calc(100% - 60px) 34px)", duration: 0.9, ease: "expo.inOut" });
        gsap.fromTo(".pv-menu-links a", { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.05, delay: 0.35 });
        gsap.fromTo(".pv-menu-preview", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.1, ease: "expo.out", delay: 0.45 });
        gsap.fromTo(".pv-menu-foot > *, .pv-menu-inner > .pv-menu-label", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.06, delay: 0.6 });
      } else menu.style.clipPath = "none";
    } else {
      lenis?.start();
      if (hasGsap && !reduce) gsap.to(menu, { clipPath: "circle(0% at calc(100% - 60px) 34px)", duration: 0.7, ease: "expo.inOut", onComplete: () => { menu.hidden = true; } });
      else menu.hidden = true;
    }
  };
  burger?.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  // Menu preview: the photo on the right swaps to match the hovered link.
  const preview = menu?.querySelector(".pv-menu-preview");
  menu?.querySelectorAll(".pv-menu-links a").forEach((a) => {
    a.addEventListener("pointerenter", () => {
      if (!preview || preview.dataset.img === a.dataset.img) return;
      preview.dataset.img = a.dataset.img;
      const frame = preview.querySelector(".pv-menu-frame");
      const img = new Image();
      img.src = a.dataset.img; img.alt = "";
      img.classList.toggle("is-cutout", /cutout/.test(a.dataset.img));
      frame.append(img);
      preview.querySelector("figcaption").textContent = a.dataset.cap || "";
      if (hasGsap && !reduce) {
        gsap.fromTo(img, { clipPath: "inset(100% 0 0 0)", scale: 1.15 }, { clipPath: "inset(0% 0 0 0)", scale: 1, duration: 0.8, ease: "expo.out",
          onComplete: () => { while (frame.children.length > 1) frame.firstElementChild.remove(); } });
      } else while (frame.children.length > 1) frame.firstElementChild.remove();
    });
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && body.classList.contains("pv-menu-open")) setMenu(false); });

  /* ---------- hero: a liquid blob follows the cursor. Inside it the background
     turns violet with white contour lines and the pets wear their Peluvi gear.
     A slower, larger echo blob paints a pale tint behind them. ---------- */
  /* Live contour lines: a slowly evolving noise field traced with marching squares,
     so the topographic texture flows on its own instead of being a still image. */
  const makeContours = () => {
    const P = new Uint8Array(512);
    const perm = Array.from({ length: 256 }, (_, i) => i).sort(() => Math.random() - 0.5);
    for (let i = 0; i < 512; i++) P[i] = perm[i & 255];
    const fade = (t) => t * t * (3 - 2 * t);
    const lerp = (a, b, t) => a + (b - a) * t;
    const hash = (x, y, z) => P[(P[(P[x & 255] + y) & 255] + z) & 255] / 255;
    const noise = (x, y, z) => {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
      const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
      const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
      return lerp(
        lerp(lerp(c(0, 0, 0), c(1, 0, 0), xf), lerp(c(0, 1, 0), c(1, 1, 0), xf), yf),
        lerp(lerp(c(0, 0, 1), c(1, 0, 1), xf), lerp(c(0, 1, 1), c(1, 1, 1), xf), yf), zf);
    };
    const levels = [0.18, 0.26, 0.34, 0.42, 0.5, 0.58, 0.66, 0.74, 0.82];
    let field = new Float32Array(0);
    return (w, h, t, cs = 11, ox = 0, oy = 0) => {
      // snap the grid to the page offset so lines stay put while the canvas scrolls
      const sx = Math.floor(ox / cs) * cs, sy = Math.floor(oy / cs) * cs;
      const fx = sx - ox, fy = sy - oy;
      const cols = Math.ceil(w / cs) + 2, rows = Math.ceil(h / cs) + 2;
      if (field.length !== cols * rows) field = new Float32Array(cols * rows);
      const sc = 1 / 340;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const x = (i * cs + sx) * sc, y = (j * cs + sy) * sc;
        field[j * cols + i] = noise(x, y, t) * 0.7 + noise(x * 2.1 + 9, y * 2.1 + 4, t * 1.3) * 0.3;
      }
      const path = new Path2D();
      for (const L of levels) {
        for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
          const a = field[j * cols + i], b = field[j * cols + i + 1], c = field[(j + 1) * cols + i + 1], d = field[(j + 1) * cols + i];
          const k = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
          if (k === 0 || k === 15) continue;
          const x0 = i * cs + fx, y0 = j * cs + fy;
          const T = () => [x0 + cs * (L - a) / (b - a), y0];
          const R = () => [x0 + cs, y0 + cs * (L - b) / (c - b)];
          const B = () => [x0 + cs * (L - d) / (c - d), y0 + cs];
          const Lf = () => [x0, y0 + cs * (L - a) / (d - a)];
          const seg = (p, q) => { path.moveTo(p[0], p[1]); path.lineTo(q[0], q[1]); };
          switch (k) {
            case 1: case 14: seg(Lf(), B()); break;
            case 2: case 13: seg(B(), R()); break;
            case 3: case 12: seg(Lf(), R()); break;
            case 4: case 11: seg(T(), R()); break;
            case 6: case 9: seg(T(), B()); break;
            case 7: case 8: seg(T(), Lf()); break;
            case 5: seg(T(), Lf()); seg(B(), R()); break;
            case 10: seg(T(), R()); seg(Lf(), B()); break;
          }
        }
      }
      return path;
    };
  };

  const hero = document.querySelector(".pv-hero");
  const stage = document.querySelector(".pv-hero-stage");
  const gearImg = document.querySelector(".pv-hero-gear");
  const canvas = document.querySelector(".pv-reveal");
  if (hero && stage && gearImg && canvas) {
    const echoCanvas = document.createElement("canvas");
    echoCanvas.className = "pv-reveal pv-reveal--echo";
    echoCanvas.setAttribute("aria-hidden", "true");
    hero.insertBefore(echoCanvas, canvas);
    const topoCanvas = document.createElement("canvas");
    topoCanvas.className = "pv-topo-live";
    topoCanvas.setAttribute("aria-hidden", "true");
    hero.prepend(topoCanvas);
    hero.classList.add("has-live-topo");
    const tctx = topoCanvas.getContext("2d");
    const gearLayer = document.createElement("canvas"); // gear drawn once per resize
    const gctx = gearLayer.getContext("2d");
    const contours = makeContours();
    let lines = null, topoT = Math.random() * 50, lastTopo = 0;
    const ctx = canvas.getContext("2d");
    const ectx = echoCanvas.getContext("2d");
    const layer = document.createElement("canvas"); // violet + white lines + gear
    const lctx = layer.getContext("2d");
    const echoLayer = document.createElement("canvas"); // pale tint + violet lines
    const elctx = echoLayer.getContext("2d");
    const SCALE = 3; // metaball field resolution divisor
    let w = 0, h = 0, dpr = 1, fw = 0, fh = 0, visible = true;

    const buildGear = () => {
      gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gctx.clearRect(0, 0, w, h);
      if (!gearImg.complete || !gearImg.naturalWidth) return;
      // measure against the canvas itself: both share the scroll parallax, so it cancels out
      const hr = canvas.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      const iw = gearImg.naturalWidth, ih = gearImg.naturalHeight;
      const s = Math.min(sr.width / iw, sr.height / ih);
      const dw = iw * s, dh = ih * s;
      gctx.drawImage(gearImg, sr.left - hr.left + (sr.width - dw) / 2, sr.top - hr.top + (sr.height - dh), dw, dh);
    };
    const strokeLines = (c, color, width) => {
      if (!lines) return;
      c.strokeStyle = color; c.lineWidth = width; c.lineCap = "round";
      c.stroke(lines);
    };
    const buildLayers = () => {
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.fillStyle = "#7a45f3"; lctx.fillRect(0, 0, w, h);
      strokeLines(lctx, "rgba(255,255,255,.9)", 1.4);
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.drawImage(gearLayer, 0, 0);
      elctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      elctx.fillStyle = "#e3d8fa"; elctx.fillRect(0, 0, w, h);
      strokeLines(elctx, "#b8a5e6", 1.2);
    };
    const drawTopo = (now) => {
      if (now - lastTopo < 33) return false; // ~30 fps is plenty for slow drift
      lastTopo = now;
      if (!reduce) topoT += 0.0045;
      lines = contours(w, h, topoT);
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tctx.clearRect(0, 0, w, h);
      strokeLines(tctx, "#cdc3df", 1.1);
      return true;
    };

    // Each blob is a chain of nodes: the head chases the target, each node chases
    // the one before it. Moving fast stretches the chain; resting gathers it.
    const makeBlob = (nodes, follow, decay) => ({
      nodes: Array.from({ length: nodes }, () => ({ x: 0, y: 0 })),
      follow, decay, energy: 0,
      field: document.createElement("canvas"),
    });
    const main = makeBlob(9, 0.3, 0.975);
    const echo = makeBlob(7, 0.1, 0.985);

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      fw = Math.ceil(w / SCALE); fh = Math.ceil(h / SCALE);
      [canvas, echoCanvas, layer, echoLayer, topoCanvas, gearLayer].forEach((c) => { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); });
      [main, echo].forEach((b) => { b.field.width = fw; b.field.height = fh; });
      buildGear();
      lastTopo = 0; drawTopo(performance.now());
      buildLayers();
    };
    resize();
    addEventListener("resize", resize);
    if (!gearImg.complete) gearImg.addEventListener("load", () => { buildGear(); buildLayers(); });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

    let tx = w / 2, ty = h / 2, px = tx, py = ty, lastMove = -1e9, started = false;
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!started) { [main, echo].forEach((b) => b.nodes.forEach((n) => { n.x = tx; n.y = ty; })); px = tx; py = ty; started = true; }
      lastMove = performance.now();
    }, { passive: true });

    // Autopilot for touch screens / idle cursor so the effect is always discoverable.
    let t0 = 0;
    const autopilot = (now) => {
      if (now - lastMove < 2200) return;
      t0 += 0.012;
      tx = w * (0.5 + 0.24 * Math.sin(t0 * 0.9) + 0.06 * Math.sin(t0 * 2.3));
      ty = h * (0.48 + 0.2 * Math.sin(t0 * 1.4 + 1));
      if (!started) { [main, echo].forEach((b) => b.nodes.forEach((n) => { n.x = tx; n.y = ty; })); started = true; }
    };

    const step = (b, speed, gain) => {
      b.energy = Math.min(1, b.energy * b.decay + speed * gain);
      const head = b.nodes[0];
      head.x += (tx - head.x) * b.follow;
      head.y += (ty - head.y) * b.follow;
      for (let i = 1; i < b.nodes.length; i++) {
        const n = b.nodes[i], p = b.nodes[i - 1], f = b.follow * (1.15 - i / (b.nodes.length * 2.5));
        n.x += (p.x - n.x) * f; n.y += (p.y - n.y) * f;
      }
    };

    // Metaball field: additive radial falloff, then a hard threshold → liquid shape.
    const renderField = (b, R) => {
      const f = b.field.getContext("2d", { willReadFrequently: true });
      f.setTransform(1, 0, 0, 1, 0, 0);
      f.clearRect(0, 0, fw, fh);
      if (b.energy < 0.01) return false;
      f.globalCompositeOperation = "lighter";
      b.nodes.forEach((n, i) => {
        const r = (R * (0.35 + 0.65 * b.energy) * Math.min(1, b.energy * 4) * (1 - i / (b.nodes.length * 1.6))) / SCALE;
        if (r < 1) return;
        const x = n.x / SCALE, y = n.y / SCALE;
        const g = f.createRadialGradient(x, y, 0, x, y, r * 2);
        g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
        f.fillStyle = g;
        f.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
      });
      // Lumps orbiting the head keep the outline irregular, never a perfect circle.
      const head = b.nodes[0], e = (0.35 + 0.65 * b.energy) * Math.min(1, b.energy * 4), t = performance.now() / 1000;
      for (let k = 0; k < 5; k++) {
        const ang = t * (0.5 + k * 0.17) + k * 1.7 + Math.sin(t * 0.9 + k * 2) * 0.8;
        const dist = R * e * (0.8 + 0.3 * Math.sin(t * 1.1 + k));
        const r = (R * e * (0.5 + 0.2 * Math.sin(t * 1.7 + k * 3))) / SCALE;
        if (r < 1) continue;
        const x = (head.x + Math.cos(ang) * dist) / SCALE, y = (head.y + Math.sin(ang) * dist * 0.85) / SCALE;
        const g = f.createRadialGradient(x, y, 0, x, y, r * 2);
        g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
        f.fillStyle = g;
        f.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
      }
      f.globalCompositeOperation = "source-over";
      const img = f.getImageData(0, 0, fw, fh), d = img.data;
      for (let i = 3; i < d.length; i += 4) {
        const a = d[i];
        d[i] = a < 118 ? 0 : a > 138 ? 255 : ((a - 118) / 20) * 255;
      }
      f.putImageData(img, 0, 0);
      return true;
    };
    const composite = (c, cv, b, src) => {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, cv.width, cv.height);
      c.imageSmoothingEnabled = true;
      c.globalCompositeOperation = "source-over";
      c.drawImage(b.field, 0, 0, cv.width, cv.height);
      c.globalCompositeOperation = "source-in";
      c.drawImage(src, 0, 0);
      c.globalCompositeOperation = "source-over";
    };

    let empty = true;
    const draw = (now) => {
      requestAnimationFrame(draw);
      if (!visible || !w) return;
      const moved = drawTopo(now);
      if (!reduce) autopilot(now);
      if (!started) return;
      const speed = Math.hypot(tx - px, ty - py) / Math.max(w, 1);
      px = tx; py = ty;
      step(main, speed, 7);
      step(echo, speed, 4);
      const base = Math.max(80, Math.min(w, 1700) * 0.1);
      const a = renderField(echo, base * 1.9);
      const b = renderField(main, base);
      if (!a && !b && empty) return;
      empty = !a && !b;
      if (moved) buildLayers();
      composite(ectx, echoCanvas, echo, echoLayer);
      composite(ctx, canvas, main, layer);
    };
    requestAnimationFrame(draw);
  }

  /* ---------- live contour lines for every textured section ---------- */
  const liveTargets = [
    { sel: ".pv-shift", color: "auto", drift: true },
    { sel: ".pv-hall", color: "rgba(255,255,255,.13)" },
    { sel: ".pv-download", color: "#cdc3df" },
    { sel: ".pv-social", color: "#d6cde8" },
    { sel: ".pv-footer-inner", color: "rgba(255,255,255,.15)" },
    { sel: ".pv-menu-inner", color: "rgba(255,255,255,.14)" },
  ];
  const liveLayers = liveTargets.map((t) => {
    const host = document.querySelector(t.sel);
    if (!host) return null;
    const cv = document.createElement("canvas");
    cv.className = "pv-live";
    cv.setAttribute("aria-hidden", "true");
    host.classList.add("pv-has-live");
    host.prepend(cv);
    const layer = { ...t, host, cv, c: cv.getContext("2d"), gen: makeContours(), visible: false, sticky: false };
    new IntersectionObserver(([e]) => { layer.visible = e.isIntersecting; }).observe(host);
    return layer;
  }).filter(Boolean);
  const sizeLive = () => liveLayers.forEach((l) => {
    const cs = getComputedStyle(l.host);
    l.sticky = l.host.offsetHeight > innerHeight * 1.5 && cs.display === "block";
    l.cv.classList.toggle("pv-live--sticky", l.sticky);
    const w = l.host.clientWidth, h = l.sticky ? innerHeight : l.host.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    l.w = w; l.h = h; l.dpr = dpr;
    l.cv.width = Math.round(w * dpr); l.cv.height = Math.round(h * dpr);
  });
  sizeLive();
  addEventListener("resize", sizeLive);
  // the menu is display:none until opened, so size its canvas when it appears
  if (window.ResizeObserver) { const mi = document.querySelector(".pv-menu-inner"); mi && new ResizeObserver(() => sizeLive()).observe(mi); }
  addEventListener("load", sizeLive);
  const lineColorFor = (el) => {
    const m = getComputedStyle(el).backgroundColor.match(/\d+(\.\d+)?/g);
    if (!m) return "rgba(255,255,255,.15)";
    const [r, g, b] = m.map(Number);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255; // 0 dark … 1 light
    const k = Math.min(1, Math.max(0, (lum - 0.2) / 0.7));
    const mix = (a, z) => Math.round(a + (z - a) * k);
    return `rgba(${mix(255, 150)},${mix(255, 125)},${mix(255, 210)},${(0.16 + 0.34 * k).toFixed(2)})`;
  };
  let liveT = Math.random() * 40, liveLast = 0;
  const liveDraw = (now) => {
    requestAnimationFrame(liveDraw);
    if (now - liveLast < 33) return;
    liveLast = now;
    if (!reduce) liveT += 0.0045;
    liveLayers.forEach((l) => {
      if (!l.visible || !l.w) return;
      const hostRect = l.host.getBoundingClientRect(), cvRect = l.cv.getBoundingClientRect();
      const oy = cvRect.top - hostRect.top; // keep the field anchored to the page while scrolling
      let ox = 0;
      if (l.drift && window.gsap) {
        const tr = document.querySelector(".pv-collage-track");
        if (tr) ox = -(gsap.getProperty(tr, "x") || 0) * 0.85;
      }
      const path = l.gen(l.w + 24, l.h + 24, liveT, 12, ox, oy);
      l.c.setTransform(l.dpr, 0, 0, l.dpr, 0, 0);
      l.c.clearRect(0, 0, l.w, l.h);
      l.c.strokeStyle = l.color === "auto" ? lineColorFor(l.host) : l.color;
      l.c.lineWidth = 1.1; l.c.lineCap = "round";
      l.c.stroke(path);
    });
  };
  requestAnimationFrame(liveDraw);

  /* ---------- talking pets in the collage ---------- */
  const talkers = [...document.querySelectorAll(".pv-talk")];
  const setTalking = (fig, on) => {
    const video = fig.querySelector("video");
    if (on) {
      talkers.forEach((f) => f !== fig && setTalking(f, false));
      if (video && !video.src) video.src = video.dataset.src;
      video?.play().catch(() => {});
      fig.classList.add("is-talking");
    } else {
      fig.classList.remove("is-talking");
      video?.pause();
    }
  };
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  talkers.forEach((fig) => {
    if (canHover) {
      fig.addEventListener("pointerenter", () => setTalking(fig, true));
      fig.addEventListener("pointerleave", () => setTalking(fig, false));
    }
    fig.addEventListener("click", () => setTalking(fig, !fig.classList.contains("is-talking")));
  });
  if (!canHover && "IntersectionObserver" in window) {
    // On touch screens the pet nearest the middle of the screen talks.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setTalking(e.target, true); else if (e.target.classList.contains("is-talking")) setTalking(e.target, false); });
    }, { rootMargin: "0px -40% 0px -40%" });
    talkers.forEach((f) => io.observe(f));
  }

  /* ---------- no-animation fallback ---------- */
  const finishCurtain = () => { curtain?.classList.remove("is-on"); };
  if (!hasGsap || reduce) {
    finishCurtain();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  if (typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      const id = a.getAttribute("href");
      if (id.length < 2 || a.hasAttribute("aria-controls")) return;
      a.addEventListener("click", (e) => {
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target);
      });
    });
    const panels = [...document.querySelectorAll('[id$="-panel"]')];
    const observer = new MutationObserver(() => {
      const open = panels.some((p) => !p.hidden);
      body.classList.toggle("pv-panel-open", open);
      open ? lenis.stop() : (!body.classList.contains("pv-menu-open") && lenis.start());
    });
    panels.forEach((p) => observer.observe(p, { attributes: true, attributeFilter: ["hidden"] }));
  }

  /* ---------- header: hide on scroll down, invert on dark sections ---------- */
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (self) => {
      const y = self.scroll();
      header.classList.toggle("is-scrolled", y > 40);
      lastY = y;
    },
  });
  [".pv-message", ".pv-hall", ".pv-footer"].forEach((sel) => {
    ScrollTrigger.create({
      trigger: sel, start: "top 40px", end: "bottom 40px",
      onToggle: (self) => header.classList.toggle("on-dark", self.isActive),
    });
  });

  /* ---------- curtain: intro + page transitions ---------- */
  const intro = () => {
    gsap.from(".pv-hero-stage", { yPercent: 12, opacity: 0, duration: 1.6, ease: "expo.out", onComplete: () => dispatchEvent(new Event("resize")) });
    gsap.from(".pv-header > *, .pv-ticket, .pv-hero-hint", { y: -20, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.2 });
  };
  // the bubble turns into a hole and grows until the whole page shows through
  const openCurtain = (tl = gsap.timeline()) => tl
    .add(() => { curtain.classList.add("is-opening"); curtain.style.setProperty("--hole", "40px"); })
    .to(".pv-curtain img, .pv-curtain span", { opacity: 0, duration: 0.15 })
    .to(curtain, { "--hole": "520vmax", duration: 1.15, ease: "expo.in" }, "<")
    .add(() => {
      finishCurtain(); curtain.classList.remove("is-opening", "has-video"); curtain.style.removeProperty("--hole");
      gsap.set(".pv-curtain img, .pv-curtain span", { clearProps: "all" });
      introVideo?.remove();
    })
    .add(intro, "-=0.45");

  // the original Peluvi loading video (the white cat), then the bubble opens
  const introVideo = curtain.querySelector(".pv-curtain-video");
  // The white-cat intro plays every time the home is opened (click or any key skips it).
  if (introVideo && !reduce) {
    curtain.classList.add("has-video");
    const logo = curtain.querySelector("img");
    let opened = false;
    const done = () => { if (opened) return; opened = true; openCurtain(); };
    introVideo.addEventListener("timeupdate", () => {
      if (introVideo.duration) logo.style.opacity = Math.max(0, 1 - introVideo.currentTime / introVideo.duration / 0.65);
    });
    introVideo.addEventListener("ended", done, { once: true });
    introVideo.addEventListener("error", done, { once: true });
    setTimeout(done, 8000);
    introVideo.play().catch(done);
    curtain.addEventListener("click", done, { once: true });
    addEventListener("keydown", done, { once: true });
  } else {
    introVideo?.remove();
    openCurtain(gsap.timeline()
      .from(".pv-curtain img", { scale: 0.5, opacity: 0, duration: 0.6, ease: "back.out(2)" })
      .to(".pv-curtain img", { rotate: -8, scale: 1.08, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 3 }));
  }

  document.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || a.target === "_blank" || a.hasAttribute("download")) return;
    let url;
    try { url = new URL(href, location.href); } catch { return; }
    if (url.origin !== location.origin || /\.(apk|mp4|png|jpe?g|pdf)$/i.test(url.pathname)) return;
    a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      curtain.classList.add("is-on");
      gsap.fromTo(curtain, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.7, ease: "expo.inOut", onComplete: () => { location.href = url.href; } });
    });
  });
  addEventListener("pageshow", (e) => { if (e.persisted) { curtain.classList.remove("is-on"); gsap.set(curtain, { clipPath: "inset(0 0 100% 0)" }); } });

  /* ---------- hero leaves ---------- */
  gsap.to(".pv-hero-stage, .pv-reveal", { y: () => innerHeight * 0.12, ease: "none", scrollTrigger: { trigger: ".pv-hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- message marquee + signature ---------- */
  gsap.utils.toArray(".pv-marquee-row").forEach((row, i) => {
    gsap.fromTo(row, { xPercent: i ? -40 : 0 }, { xPercent: i ? 0 : -40, ease: "none", scrollTrigger: { trigger: ".pv-message", start: "top bottom", end: "bottom top", scrub: true } });
  });
  document.querySelectorAll(".pv-sign path").forEach((path) => {
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: path.closest("figure, div, footer"), start: "top 75%", end: "top 25%", scrub: true } });
  });
  gsap.fromTo(".pv-sign-photo img", { yPercent: 18, scale: 0.9 }, { yPercent: -6, scale: 1, ease: "none", scrollTrigger: { trigger: ".pv-sign-photo", start: "top bottom", end: "bottom 30%", scrub: true } });

  /* ---------- collage: the page keeps scrolling while the strip drifts left (diagonal) ---------- */
  const shift = document.querySelector(".pv-shift");
  const collage = document.querySelector(".pv-collage");
  const track = document.querySelector(".pv-collage-track");
  const distance = () => track.scrollWidth - innerWidth;
  // Place each item so it crosses the middle of the screen at the moment the strip brings it into view.
  const layoutCollage = () => {
    const vh = innerHeight, ch = collage.offsetHeight, T = track.scrollWidth / innerWidth;
    track.querySelectorAll(":scope > figure, :scope > .pv-note").forEach((el) => {
      const left = el.offsetLeft / innerWidth;
      const pm = Math.min(1, Math.max(0, (left - 0.5) / Math.max(T - 1, 0.01)));
      const yl = (parseFloat(el.style.getPropertyValue("--y")) || 30) / 100 * vh * 0.85;
      const top = pm * ch - vh + yl;
      el.style.setProperty("--top", `${Math.max(vh * 0.14, Math.min(ch - el.offsetHeight - vh * 0.1, top))}px`);
    });
    // Push any photo (plus its speech bubble) that would sit on top of a text note below it.
    track.querySelectorAll(":scope > .pv-note").forEach((note) => {
      const nl = note.offsetLeft, nr = nl + note.offsetWidth, nt = parseFloat(note.style.getPropertyValue("--top")), nb = nt + note.offsetHeight;
      track.querySelectorAll(":scope > figure").forEach((fig) => {
        const fl = fig.offsetLeft, fr = fl + fig.offsetWidth + (fig.classList.contains("pv-talk") ? 220 : 40);
        const ft = parseFloat(fig.style.getPropertyValue("--top")), fb = ft + fig.offsetHeight;
        if (fr > nl - 40 && fl < nr + 40 && fb > nt - 40 && ft < nb + 40) fig.style.setProperty("--top", `${nb + 70}px`);
      });
    });
  };
  layoutCollage();
  ScrollTrigger.addEventListener("refreshInit", layoutCollage);
  // One timeline with explicit values: the colour depends only on scroll position,
  // whatever direction or position you arrive from.
  gsap.timeline({ scrollTrigger: { trigger: ".pv-collage", start: "top 85%", end: "top -55%", scrub: true } })
    .fromTo(shift, { backgroundColor: "#2d1463", color: "#f4f1f8" }, { backgroundColor: "#a594d6", color: "#2d1463", ease: "none", duration: 1, immediateRender: true })
    .to(shift, { backgroundColor: "#f4f1f8", color: "#2d1463", ease: "none", duration: 1 });
  ScrollTrigger.create({ trigger: ".pv-collage", start: "top 40px", end: "bottom 40px", onToggle: (s) => s.isActive && header.classList.remove("on-dark") });
  const slide = gsap.to(track, {
    x: () => -distance(), ease: "none",
    scrollTrigger: { trigger: ".pv-collage", start: "top bottom", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true },
  });
  // The contour texture lags behind the photos a little, so it reads as a deeper layer.

  // Each photo drifts at its own speed while the strip moves → depth.
  gsap.utils.toArray(".pv-collage figure").forEach((fig) => {
    const speed = parseFloat(fig.dataset.speed || "1");
    gsap.fromTo(fig, { x: (speed - 1) * 220, y: (speed - 1) * -90 }, { x: (1 - speed) * 220, y: (speed - 1) * 90, ease: "none", scrollTrigger: { trigger: fig, containerAnimation: slide, start: "left right", end: "right left", scrub: true } });
  });
  document.querySelectorAll(".pv-note").forEach((note) => {
    const path = note.querySelector(".pv-mini-sign path");
    if (!path) return;
    const len = path.getTotalLength();
    gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: note, containerAnimation: slide, start: "left 75%", end: "left 35%", scrub: true } });
  });

  /* ---------- text reveals: each line slides up softly ---------- */
  document.querySelectorAll("[data-blocks]").forEach((el) => {
    const lines = el.querySelectorAll(":scope > span");
    const inStrip = el.closest(".pv-collage-track");
    gsap.from(lines, {
      y: 40, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08,
      scrollTrigger: inStrip ? { trigger: el, containerAnimation: slide, start: "left 82%" } : { trigger: el, start: "top 85%" },
    });
  });

  /* ---------- paths: image grows to full bleed ---------- */
  const mm = gsap.matchMedia();
  // A phone drawn in line art; the photo then lights up inside its screen and opens to full bleed.
  const phoneLines = gsap.utils.toArray(".pv-phone > *");
  phoneLines.forEach((el) => el.setAttribute("pathLength", "1"));
  const SCREEN = "inset(4% 22.6% 4% 22.6% round 24px)";
  const drawPhone = (trigger) => gsap.timeline({ scrollTrigger: trigger })
    .fromTo(phoneLines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none", stagger: 0.04, duration: 0.6 })
    .to({}, { duration: 0.15 })
    // cross-fade: the drawing goes away as the photo comes in, so the two phones never overlap
    .fromTo(".pv-expand img", { opacity: 0, clipPath: SCREEN }, { opacity: 1, ease: "power1.inOut", duration: 0.3 })
    .fromTo(".pv-phone", { opacity: 1 }, { opacity: 0, ease: "power2.out", duration: 0.12 }, "<");
  mm.add("(min-width: 801px)", () => {
    drawPhone({ trigger: ".pv-paths", start: "top 75%", end: "top top", scrub: 1 });
    const tl = gsap.timeline({ scrollTrigger: { trigger: ".pv-paths", start: "top top", end: "+=170%", scrub: 1, pin: ".pv-paths-pin" } });
    tl.fromTo(".pv-expand img", { clipPath: SCREEN }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 0.3, immediateRender: false }, 0.05)
      .to(".pv-expand", { width: "100vw", height: "100svh", borderRadius: 0, ease: "power2.inOut", duration: 1 }, 0.25)
      .to(".pv-path--l", { xPercent: -60, opacity: 0, ease: "power2.in", duration: 1 }, 0.25)
      .to(".pv-path--r", { xPercent: 60, opacity: 0, ease: "power2.in", duration: 1 }, 0.25)
      .fromTo(".pv-expand img", { scale: 1.3 }, { scale: 1, ease: "none", duration: 1.25 }, 0);
  });
  mm.add("(max-width: 800px)", () => {
    drawPhone({ trigger: ".pv-expand", start: "top 90%", end: "center 55%", scrub: 1 })
      .to(".pv-expand img", { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 0.3 });
  });

  /* ---------- hall cards ---------- */
  gsap.from(".pv-card", { opacity: 0, duration: 1, ease: "power2.out", stagger: 0.06, scrollTrigger: { trigger: ".pv-grid", start: "top 85%" } });
  const cols = () => (innerWidth > 800 ? 4 : 2);
  gsap.utils.toArray(".pv-card").forEach((card, i) => {
    gsap.fromTo(card, { y: () => ((i % cols()) % 2 ? 140 : 40) }, { y: () => ((i % cols()) % 2 ? -100 : -20), ease: "none", scrollTrigger: { trigger: ".pv-grid", start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true } });
  });

  /* ---------- download ---------- */
  gsap.from(".pv-download-media video", { clipPath: "inset(20% 20% 20% 20%)", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".pv-download-media", start: "top 85%" } });


  /* ---------- social fan ---------- */
  const fan = gsap.utils.toArray(".pv-fan img");
  const mid = (fan.length - 1) / 2;
  fan.forEach((img, i) => { img.style.zIndex = String(10 - Math.round(Math.abs(i - mid))); });
  gsap.timeline({ scrollTrigger: { trigger: ".pv-social", start: "top 75%", end: "center 55%", scrub: 1 } })
    .fromTo(fan, { rotate: 0, x: 0, y: 40 }, {
      rotate: (i) => (i - mid) * 9,
      x: (i) => (i - mid) * Math.min(innerWidth * 0.085, 120),
      y: (i) => Math.abs(i - mid) * 18,
      scale: (i) => (i === Math.round(mid) ? 1.18 : 1),
      ease: "power2.out",
    });

  // Measuring while smooth scroll is still gliding gives wrong trigger positions,
  // so pause it for the instant a refresh takes and only refresh once scrolling is idle.
  ScrollTrigger.addEventListener("refreshInit", () => lenis?.stop());
  ScrollTrigger.addEventListener("refresh", () => {
    if (!body.classList.contains("pv-menu-open") && !body.classList.contains("pv-panel-open")) lenis?.start();
  });
  let lastScrollAt = 0;
  addEventListener("scroll", () => { lastScrollAt = performance.now(); }, { passive: true });
  const refreshWhenIdle = () => {
    const wait = 250 - (performance.now() - lastScrollAt);
    if (wait > 0) { setTimeout(refreshWhenIdle, wait + 20); return; }
    ScrollTrigger.refresh();
  };
  addEventListener("load", refreshWhenIdle);
  document.fonts?.ready.then(refreshWhenIdle);
  if ("ResizeObserver" in window) {
    let lastH = 0, timer = 0;
    new ResizeObserver(() => {
      const hNow = document.querySelector("main").offsetHeight;
      if (Math.abs(hNow - lastH) < 2) return;
      lastH = hNow;
      clearTimeout(timer);
      timer = setTimeout(refreshWhenIdle, 150);
    }).observe(document.querySelector("main"));
  }
})();
