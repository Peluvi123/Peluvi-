/* Inner pages: violet curtain between pages + headings/cards slide up as they enter. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;


  // Live contour lines: one fixed canvas behind the whole page (same generator as the home),
  // anchored to the scroll position so the lines never stop at a section edge.
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
  const cv = document.createElement("canvas");
  cv.className = "ed-live";
  cv.setAttribute("aria-hidden", "true");
  document.body.prepend(cv);
  const ctx = cv.getContext("2d");
  const gen = makeContours();
  let W = 0, H = 0, dpr = 1, t = Math.random() * 40, last = 0;
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); };
  size(); addEventListener("resize", size);
  const draw = (now) => {
    requestAnimationFrame(draw);

    if (now - last < 33) return;
    last = now;
    if (!reduce) t += 0.0045;
    const path = gen(W + 24, H + 24, t, 12, 0, scrollY);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(150,125,210,.22)";
    ctx.lineWidth = 1.1; ctx.lineCap = "round";
    ctx.stroke(path);
  };
  requestAnimationFrame(draw);

  // Dark sections: deep violet band with white lines from the same field, so they continue
  // seamlessly from the light lines around them.
  document.querySelectorAll(".ed-dark").forEach((sec) => {
    const dc = document.createElement("canvas");
    dc.className = "ed-dark-live";
    dc.setAttribute("aria-hidden", "true");
    sec.prepend(dc);
    const dctx = dc.getContext("2d");
    let vis = false, w = 0, h = 0;
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; }).observe(sec);
    const fit = () => { w = sec.clientWidth; h = sec.clientHeight; dc.width = Math.round(w * dpr); dc.height = Math.round(h * dpr); };
    fit(); addEventListener("resize", fit); if (window.ResizeObserver) new ResizeObserver(fit).observe(sec);
    const loop = () => {
      requestAnimationFrame(loop);
      if (!vis || !w) return;
      const top = sec.getBoundingClientRect().top + scrollY;
      const path = gen(w + 24, h + 24, t, 12, 0, top);
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dctx.clearRect(0, 0, w, h);
      dctx.strokeStyle = "rgba(255,255,255,.07)";
      dctx.lineWidth = 1.1; dctx.lineCap = "round";
      dctx.stroke(path);
    };
    requestAnimationFrame(loop);
  });

  // Curtain: covers the page on load and lifts; slides back in before leaving to another page.
  const curtain = document.createElement("div");
  curtain.className = "ed-curtain";
  curtain.setAttribute("aria-hidden", "true");
  document.body.append(curtain);
  const lift = () => requestAnimationFrame(() => requestAnimationFrame(() => curtain.classList.add("is-gone")));
  if (reduce) curtain.remove(); else lift();
  addEventListener("pageshow", (e) => { if (e.persisted && !reduce) { curtain.classList.remove("is-leaving"); lift(); } });

  if (!reduce) document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === "_blank" || a.hasAttribute("download")) return;
    let url;
    try { url = new URL(a.href, location.href); } catch { return; }
    if (url.origin !== location.origin || url.pathname === location.pathname || /\.(apk|mp4|png|jpe?g|pdf)$/i.test(url.pathname)) return;
    e.preventDefault();
    curtain.classList.add("is-reset");
    void curtain.offsetWidth;
    curtain.classList.remove("is-reset", "is-gone");
    curtain.classList.add("is-leaving");
    setTimeout(() => { location.href = url.href; }, 560);
  });

  // Reveal on scroll
  if (reduce || !("IntersectionObserver" in window)) return;
  const targets = document.querySelectorAll(
    ".page-main h1, .page-main h2, .page-lead, .page-actions, .detail-card, .step-card, .biz-clean-tile, .pet-tip, .section-heading > p, .check-list"
  );
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("is-in");
    io.unobserve(en.target);
  }), { rootMargin: "0px 0px -8% 0px" });
  targets.forEach((el, i) => {
    el.classList.add("ed-reveal");
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    io.observe(el);
  });
})();
