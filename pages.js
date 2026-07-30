const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("#primary-navigation");

function setOpen(isOpen) {
  if (!header || !toggle) return;
  header.classList.toggle("menu-open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
}

toggle?.addEventListener("click", () => setOpen(!header.classList.contains("menu-open")));
nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));

document.addEventListener("click", (event) => {
  if (header?.classList.contains("menu-open") && !header.contains(event.target)) setOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setOpen(false);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) setOpen(false);
});

