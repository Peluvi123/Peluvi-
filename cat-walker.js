(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compactScreen = window.matchMedia("(max-width: 760px)");
  if (reduceMotion.matches || compactScreen.matches) return;

  const walker = document.createElement("div");
  walker.className = "ambient-cat";
  walker.setAttribute("aria-hidden", "true");
  walker.innerHTML = '<video muted loop playsinline preload="auto"><source src="/assets/cat-walking-greenscreen-web.mp4" type="video/mp4" /></video><canvas width="640" height="360"></canvas>';
  document.body.appendChild(walker);

  const catVideo = walker.querySelector("video");
  const canvas = walker.querySelector("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  catVideo.muted = true;

  const renderFrame = () => {
    if (!walking) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(catVideo, 0, 0, canvas.width, canvas.height);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = frame.data;

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const other = Math.max(red, blue);
      const greenExcess = green - other;

      if (green > 55 && greenExcess > 14 && green > red * 1.1 && green > blue * 1.1) {
        const opacity = Math.max(0, Math.min(1, (46 - greenExcess) / 32));
        pixels[index + 3] = Math.round(255 * opacity);
        pixels[index + 1] = Math.min(green, other + 3);
      } else if (greenExcess > 5) {
        pixels[index + 1] = Math.min(green, other + 4);
      }
    }

    context.putImageData(frame, 0, 0);
    requestAnimationFrame(renderFrame);
  };

  let walking = false;
  let lastWalkAt = 0;
  let lastTriggerY = 0;
  let direction = "left";

  const startWalk = () => {
    if (walking || reduceMotion.matches || compactScreen.matches) return;
    walking = true;
    lastWalkAt = Date.now();
    lastTriggerY = window.scrollY;
    direction = direction === "left" ? "right" : "left";
    walker.style.setProperty("--cat-lane", `${10 + Math.round(Math.random() * 28)}px`);
    walker.classList.remove("walk-left", "walk-right");
    void walker.offsetWidth;
    walker.classList.add(direction === "left" ? "walk-left" : "walk-right");
    catVideo.currentTime = 0;
    catVideo.play().then(renderFrame).catch(() => {});
  };

  const considerWalk = () => {
    const movedEnough = Math.abs(window.scrollY - lastTriggerY) > 520;
    const cooledDown = Date.now() - lastWalkAt > 45000;
    if (window.scrollY > 360 && movedEnough && cooledDown) startWalk();
  };

  walker.addEventListener("animationend", (event) => {
    if (event.target !== walker) return;
    walker.classList.remove("walk-left", "walk-right");
    walking = false;
    catVideo.pause();
    context.clearRect(0, 0, canvas.width, canvas.height);
  });

  window.addEventListener("scroll", considerWalk, { passive: true });
})();
