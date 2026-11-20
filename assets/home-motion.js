/* Peluvi home motion: curtain transitions, smooth scroll, cursor reveal hero,
   block text reveals, talking pet portraits, expanding image, card fan. */
(() => {
  const body = document.body;
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduce = motionPreference.matches;
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
    const showPreview = () => {
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
    };
    a.addEventListener("pointerenter", showPreview);
    a.addEventListener("focus", showPreview);
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && body.classList.contains("pv-menu-open")) setMenu(false); });

  // Marching squares for the animated contours in the sections below the hero.
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

  const playHeroPreview = window.initPeluviHero?.() || (() => {});

  /* ---------- live contour lines for every textured section ---------- */
  const liveTargets = [
    { sel: ".pv-shift", color: "auto" },
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
      const path = l.gen(l.w + 24, l.h + 24, liveT, 12, 0, oy);
      l.c.setTransform(l.dpr, 0, 0, l.dpr, 0, 0);
      l.c.clearRect(0, 0, l.w, l.h);
      l.c.strokeStyle = l.color === "auto" ? lineColorFor(l.host) : l.color;
      l.c.lineWidth = 1.1; l.c.lineCap = "round";
      l.c.stroke(path);
    });
  };
  requestAnimationFrame(liveDraw);

  /* ---------- compact community carousel ---------- */
  function initCommunityRotation(hasAudio, stopAudio) {
    const section = document.querySelector("#comunidad-peluvi");
    const track = section?.querySelector("#pv-community-pages");
    const pages = [...(track?.querySelectorAll(":scope > [data-community-page]") || [])];
    const controls = section?.querySelector("[data-community-controls]");
    const previous = controls?.querySelector("[data-community-prev]");
    const next = controls?.querySelector("[data-community-next]");
    const toggle = controls?.querySelector("[data-community-toggle]");
    const status = section?.querySelector("[data-community-status]");
    if (pages.length < 2 || !previous || !next || !toggle) return () => {};

    let index = Math.max(0, pages.findIndex(page => !page.hidden));
    let visible = false;
    let hovered = matchMedia("(any-hover: hover)").matches && track.matches(":hover");
    let focused = track.contains(document.activeElement);
    let requestedPlayback = null;
    let timer;

    const playbackEnabled = () => requestedPlayback ?? !motionPreference.matches;
    const canRotate = () => playbackEnabled() && visible && !document.hidden && !hovered && !focused && !hasAudio();
    const updateTimer = () => {
      clearTimeout(timer);
      if (canRotate()) {
        timer = setTimeout(() => {
          if (canRotate()) showPage(1);
        }, 6000);
      }
    };
    const updateToggle = () => { toggle.textContent = playbackEnabled() ? "Pausar" : "Reanudar"; };
    function showPage(step, manual = false) {
      stopAudio();
      section.dataset.communityDirection = step < 0 ? "prev" : "next";
      pages[index].hidden = true;
      index = (index + step + pages.length) % pages.length;
      pages[index].hidden = false;
      if (status) status.textContent = manual ? `Grupo ${index + 1} de ${pages.length}` : "";
      updateTimer();
    }

    controls.hidden = false;
    updateToggle();
    previous.addEventListener("click", () => showPage(-1, true));
    next.addEventListener("click", () => showPage(1, true));
    toggle.addEventListener("click", () => {
      requestedPlayback = !playbackEnabled();
      updateToggle();
      updateTimer();
    });
    for (const [type, value] of [["pointerenter", true], ["pointerleave", false]]) {
      track.addEventListener(type, (event) => {
        if (event.pointerType === "touch") return;
        hovered = value;
        updateTimer();
      });
    }
    track.addEventListener("focusin", () => {
      focused = true;
      updateTimer();
    });
    track.addEventListener("focusout", (event) => {
      focused = track.contains(event.relatedTarget);
      updateTimer();
    });
    document.addEventListener("visibilitychange", updateTimer);
    motionPreference.addEventListener("change", (event) => {
      if (event.matches && requestedPlayback === true) requestedPlayback = null;
      updateToggle();
      updateTimer();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.intersectionRatio >= 0.35;
        updateTimer();
      }, { threshold: 0.35 }).observe(track);
    }
    return updateTimer;
  }

  /* ---------- talking pets in the collage ---------- */
  const talkers = [...document.querySelectorAll(".pv-talk")].map((figure) => ({
    figure,
    video: figure.querySelector("video[data-src]"),
    button: figure.querySelector(".pv-talk-badge"),
  })).filter((pet) => pet.video && pet.button);
  const hoverPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const canPreviewPet = () => hoverPointer.matches && !motionPreference.matches;
  let activePet = null;
  let playbackVersion = 0;

  const setPetAudio = ({ video, button }, enabled) => {
    video.muted = !enabled;
    button.textContent = enabled ? "Silenciar" : "Escuchar";
    button.setAttribute("aria-pressed", String(enabled));
    updateCommunityTimer();
  };
  const stopPet = () => {
    if (!activePet) return;
    const pet = activePet;
    activePet = null;
    playbackVersion++;
    pet.figure.classList.remove("is-talking");
    pet.video.pause();
    setPetAudio(pet, false);
  };
  const updateCommunityTimer = initCommunityRotation(() => Boolean(activePet && !activePet.video.muted), stopPet);
  const playPet = (pet, audio) => {
    if (activePet && activePet !== pet) stopPet();
    activePet = pet;
    const version = ++playbackVersion;
    const { figure, video } = pet;
    if (!video.hasAttribute("src")) video.src = video.dataset.src;
    setPetAudio(pet, audio);
    if (audio) video.currentTime = 0;
    video.play().then(() => {
      if (version === playbackVersion) figure.classList.add("is-talking");
    }).catch(() => {
      if (version === playbackVersion) stopPet();
    });
  };
  talkers.forEach((pet) => {
    pet.figure.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch" && canPreviewPet() && (!activePet || activePet.video.muted)) {
        playPet(pet, false);
      }
    });
    pet.figure.addEventListener("pointerleave", () => {
      if (activePet === pet && pet.video.muted) stopPet();
    });
    pet.button.addEventListener("click", () => {
      if (activePet !== pet || pet.video.muted) {
        playPet(pet, true);
      } else if (canPreviewPet() && pet.figure.matches(":hover")) {
        setPetAudio(pet, false);
      } else {
        stopPet();
      }
    });
  });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(({ target, isIntersecting }) => target === activePet?.figure && !isIntersecting)) {
        stopPet();
      }
    });
    talkers.forEach(({ figure }) => observer.observe(figure));
  }
  motionPreference.addEventListener("change", () => {
    if (motionPreference.matches && activePet?.video.muted) stopPet();
  });

  const darkSections = [...document.querySelectorAll(".pv-message-intro, .pv-hall, .pv-footer")];
  function updateHeaderTheme() {
    header.classList.toggle("on-dark", darkSections.some(section => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= 40 && bounds.bottom > 40;
    }));
  }
  updateHeaderTheme();

  /* ---------- no-animation fallback ---------- */
  const finishCurtain = () => { curtain?.classList.remove("is-on"); };
  if (!hasGsap || reduce) {
    finishCurtain();
    window.addEventListener("scroll", updateHeaderTheme, { passive: true });
    window.addEventListener("resize", updateHeaderTheme);
    playHeroPreview();
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
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (self) => {
      header.classList.toggle("is-scrolled", self.scroll() > 40);
      updateHeaderTheme();
    },
    onRefresh: updateHeaderTheme,
  });

  /* ---------- curtain: intro + page transitions ---------- */
  const intro = () => {
    gsap.from(".pv-hero-scene", {
      yPercent: 12, opacity: 0, duration: 1.6, ease: "expo.out",
      onComplete: () => {
        dispatchEvent(new Event("resize"));
        playHeroPreview();
      },
    });
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
  // Remember the first visit across reloads and browser sessions.
  let introSeen = false;
  try {
    introSeen = localStorage.getItem("peluviIntroSeen") === "1";
    localStorage.setItem("peluviIntroSeen", "1");
  } catch {
    // Unavailable storage must never block access to the page.
    introSeen = true;
  }
  if (introSeen) {
    introVideo?.remove();
    finishCurtain();
    intro();
  } else if (introVideo && !reduce) {
    curtain.classList.add("is-on", "has-video");
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
    curtain.classList.add("is-on");
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
  gsap.to(".pv-hero-scene", { y: () => innerHeight * 0.12, ease: "none", scrollTrigger: { trigger: ".pv-hero", start: "top top", end: "bottom top", scrub: true } });

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

  /* ---------- text reveals: each line slides up softly ---------- */
  document.querySelectorAll("[data-blocks]").forEach((el) => {
    const lines = el.querySelectorAll(":scope > span");
    gsap.from(lines, {
      y: 40, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08,
      scrollTrigger: { trigger: el, start: "top 85%" },
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
      .to(".pv-expand img", { clipPath: "inset(0% 0% 0% 0% round 14px)", ease: "power2.inOut", duration: 0.3 });
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
