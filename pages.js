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

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionVideos = document.querySelectorAll("video[autoplay]");

function syncMotionPreference() {
  motionVideos.forEach((video) => {
    if (reducedMotion.matches) {
      video.pause();
      video.currentTime = 0;
    } else {
      video.play().catch(() => {});
    }
  });
}

syncMotionPreference();
reducedMotion.addEventListener?.("change", syncMotionPreference);

const commercialVideo = document.querySelector('.commercial-player video');
if (commercialVideo) {
  const startCommercial = () => {
    if (document.hidden) return;
    commercialVideo.muted = true;
    commercialVideo.play().catch(() => {});
  };
  if (commercialVideo.readyState >= 2) startCommercial();
  else commercialVideo.addEventListener('loadeddata', startCommercial, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && commercialVideo.paused) startCommercial();
  });
}

const tourDialog = document.querySelector('.peluvi-tour');
if (tourDialog) {
  const steps = [
    { id: 'perfil', title: 'El perfil de tu mascota', description: 'Un lugar para conocer y organizar lo importante de tu compañero.', items: ['Entra a la sección de mascotas en la app.', 'Selecciona tu mascota para consultar su perfil.', 'Mantén sus datos actualizados para tenerlos a mano.'], href: '/downloads/Peluvi-Android-debug.apk', link: 'Descargar la app →' },
    { id: 'servicios', title: 'Encuentra ayuda cerca de ti', description: 'Explora opciones de cuidado según lo que necesita tu mascota.', items: ['Elige una categoría, como veterinarias o peluquerías.', 'Busca por servicio y ubicación.', 'Consulta la información del proveedor y las opciones de contacto.'], href: '/servicios/', link: 'Explorar servicios →' },
    { id: 'inicio', title: 'Todo comienza en Peluvi', description: 'La pantalla principal reúne accesos a las funciones de la app.', items: ['Busca el servicio que necesitas.', 'Usa los accesos rápidos para explorar categorías.', 'Entra a favoritos, tu perfil o las alertas desde la navegación.'], href: '/downloads/Peluvi-Android-debug.apk', link: 'Descargar la app →' },
    { id: 'adopcion', title: 'Conoce a tu próximo compañero', description: 'Descubre mascotas que buscan un hogar y conoce su historia.', items: ['Entra a Adopción.', 'Explora las mascotas y revisa sus perfiles.', 'Consulta los datos de contacto y el proceso con el responsable de la adopción.'], href: '/#adopcion', link: 'Explorar adopciones →' },
    { id: 'sos', title: 'Una comunidad que ayuda', description: 'Las alertas permiten dar visibilidad a mascotas perdidas o que necesitan ayuda.', items: ['Entra a la sección SOS.', 'Consulta los reportes o inicia una alerta con la información disponible.', 'Comparte datos útiles con la persona responsable del reporte.'], href: '/#sos', link: 'Conocer las alertas SOS →' },
    { id: 'tienda', title: 'Encuentra lo que necesita', description: 'Descubre tiendas y opciones para el cuidado cotidiano de tu mascota.', items: ['Abre la categoría de tiendas.', 'Explora negocios y la información de sus productos.', 'Consulta disponibilidad y detalles con el proveedor.'], href: '/#tiendas', link: 'Explorar tiendas →' }
  ];
  const experiences = [
    { focus: [15, 49], label: 'Perfil', options: ['Datos de Luna', 'Historial', 'Favoritos'], feedback: ['Nombre, edad y especie ayudan a identificar a tu mascota. Aquí puedes consultar su información.', 'Reúne información útil sobre el cuidado de tu mascota y mantenla a mano.', 'Guarda las opciones que te interesan para volver a consultarlas.'] },
    { focus: [30, 47], label: 'Servicios', options: ['Veterinaria', 'Peluquería', 'Cuidadores'], feedback: ['Busca atención veterinaria por ubicación y consulta los datos de cada clínica.', 'Encuentra opciones de baño y cuidado del pelaje. Consulta servicios y horarios con el proveedor.', 'Explora opciones de paseos y acompañamiento, y consulta la disponibilidad con cada cuidador.'] },
    { focus: [49, 48], label: 'La app', options: ['Buscar', 'Accesos rápidos', 'Favoritos'], feedback: ['Escribe lo que necesita tu mascota y una ubicación para orientar la búsqueda.', 'Salta directamente a adopciones, veterinarias, peluquerías, comida o cuidadores.', 'Vuelve a las mascotas y negocios que guardaste desde la navegación de la app.'] },
    { focus: [67, 48], label: 'Adopción', options: ['Conoce a Milo', 'Su historia', 'Cómo adoptar'], feedback: ['Explora el perfil de cada mascota para conocer su edad, características y necesidades.', 'Lee la información compartida por la persona o fundación responsable.', 'Contacta al responsable para conocer los requisitos y los pasos de adopción.'] },
    { focus: [80, 51], label: 'SOS', options: ['Ver alertas', 'Reportar', 'Ayudar'], feedback: ['Consulta reportes y sus ubicaciones para saber dónde se necesita ayuda.', 'Incluye una foto, ubicación e información de contacto al crear un reporte.', 'Si tienes información útil, contacta al responsable. Consulta siempre los datos del reporte.'] },
    { focus: [91, 55], label: 'Tienda', options: ['Alimentos', 'Accesorios', 'Consultar negocio'], feedback: ['Descubre tiendas de alimentos y consulta las opciones para tu mascota.', 'Explora accesorios publicados por negocios y revisa sus detalles.', 'Pregunta al proveedor por precios, disponibilidad y formas de entrega.'] }
  ];
  const chapters = tourDialog.querySelector('.tour-chapters');
  experiences.forEach((experience, index) => {
    const button = document.createElement('button'); button.textContent = experience.label;
    button.addEventListener('click', () => renderTour(index)); chapters.append(button);
  });
  let current = 0;
  let opener;
  const prev = tourDialog.querySelector('.tour-prev');
  const next = tourDialog.querySelector('.tour-next');
  const phone = tourDialog.querySelector('.phone-content');
  let saved = false;
  let cart = 0;
  function phoneButton(text, action, className = '') {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = text; button.className = className; button.addEventListener('click', action); return button;
  }
  function phoneMessage(text) {
    const message = phone.querySelector('.phone-message'); message.textContent = text;
  }
  function renderPhone(id) {
    const titles = { perfil: 'Mi mascota', servicios: 'Servicios cerca', inicio: '¡Hola, Carlos!', adopcion: 'Encuentra un compañero', sos: 'Ayudemos juntos', tienda: 'Para tu mascota' };
    phone.replaceChildren();
    const heading = document.createElement('h3'); heading.textContent = titles[id]; phone.append(heading);
    const badge = document.createElement('span'); badge.className = 'phone-demo-badge'; badge.textContent = 'Demostración interactiva'; phone.append(badge);
    const illustration = document.createElement('img'); illustration.src = `/assets/tour/${id}.png`; illustration.alt = experiences[steps.findIndex(s => s.id === id)].label; illustration.className = 'phone-illustration'; phone.append(illustration);
    const controls = document.createElement('div'); controls.className = 'phone-controls'; phone.append(controls);
    if (id === 'inicio') {
      const subtitle = document.createElement('p'); subtitle.textContent = '¿Qué necesita tu mascota?'; controls.append(subtitle);
      [['Veterinaria','servicios'],['Adopción','adopcion'],['Tienda','tienda'],['SOS','sos']].forEach(([label, target]) => controls.append(phoneButton(label, () => renderTour(steps.findIndex(s => s.id === target)))));
    } else if (id === 'servicios') {
      const search = document.createElement('input'); search.placeholder = 'Busca por nombre…'; search.setAttribute('aria-label', 'Buscar en la demostración'); controls.append(search);
      const result = document.createElement('article'); result.className = 'phone-result';
      const filters = document.createElement('div'); filters.className = 'phone-filters';
      const samples = {Veterinaria: 'Clínica Peluvi · Atención veterinaria', Peluquería: 'Peluvi Grooming · Baño y corte', Cuidadores: 'Paseos Peluvi · Paseos y visitas'};
      function choose(label) { result.textContent = samples[label]; [...filters.children].forEach(b => b.setAttribute('aria-pressed', String(b.textContent === label))); }
      Object.keys(samples).forEach(label => filters.append(phoneButton(label, () => {choose(label); search.value = '';}, 'phone-chip'))); controls.append(filters, result); choose('Veterinaria');
      search.addEventListener('input', () => { const match = Object.values(samples).filter(t => t.toLowerCase().includes(search.value.toLowerCase())); result.textContent = match.join(' · ') || 'No hay coincidencias. Prueba con Peluvi.'; });
      controls.append(phoneButton('Ver proveedor →', () => phoneMessage('Ejemplo de proveedor: consulta sus servicios, horarios y contacto antes de elegir.'), 'phone-primary'));
    } else if (id === 'perfil') {
      const info = document.createElement('p'); info.textContent = 'Luna · Golden retriever · 3 años'; controls.append(info);
      ['Datos','Historial','Favoritos'].forEach((label, i) => controls.append(phoneButton(label, () => phoneMessage(['Luna: perro, golden retriever, 3 años. Perfil de ejemplo.', 'Aquí puedes consultar la información de cuidado de tu mascota.', saved ? 'Milo está en tus favoritos de esta demostración.' : 'Todavía no guardaste una mascota. Prueba en Adopción.'][i]), 'phone-chip')));
    } else if (id === 'adopcion') {
      const info = document.createElement('p'); info.textContent = 'Milo · Gatito · Busca un hogar'; controls.append(info);
      const favorite = phoneButton(saved ? '♥ Guardado' : '♡ Guardar a Milo', () => {saved = !saved; favorite.textContent = saved ? '♥ Guardado' : '♡ Guardar a Milo'; favorite.setAttribute('aria-pressed', String(saved)); phoneMessage(saved ? 'Milo quedó en tus favoritos de la demo.' : 'Milo se quitó de tus favoritos de la demo.');}, 'phone-primary'); favorite.setAttribute('aria-pressed', String(saved)); controls.append(favorite);
      controls.append(phoneButton('Conocer su historia →', () => phoneMessage('Milo es un perfil de ejemplo. En la app, revisa su historia y consulta los requisitos con su responsable.')));
    } else if (id === 'sos') {
      const map = document.createElement('div'); map.className = 'phone-map'; map.textContent = '⌖'; map.append(phoneButton('Ver alerta', () => phoneMessage('Alerta de ejemplo: mascota vista cerca del parque. Abre el reporte para consultar foto, ubicación y contacto.'))); controls.append(map);
      controls.append(phoneButton('¿Cómo reportar?', () => phoneMessage('Agrega foto, ubicación y contacto. Esta demostración no publica reportes.'), 'phone-primary'));
    } else {
      const count = document.createElement('p'); count.className = 'phone-cart'; count.textContent = `Tu selección: ${cart} productos`;
      ['Alimento','Arnés','Juguete'].forEach(label => controls.append(phoneButton(`＋ ${label}`, () => { cart++; count.textContent = `Tu selección: ${cart} productos`; phoneMessage(`${label} añadido a tu selección de ejemplo. Consulta precio y disponibilidad con la tienda.`); })));
      controls.append(count, phoneButton('Vaciar selección', () => {cart = 0; count.textContent = 'Tu selección: 0 productos'; phoneMessage('Puedes volver a explorar los productos.');}, 'phone-chip'));
    }
    const message = document.createElement('p'); message.className = 'phone-message'; message.setAttribute('aria-live', 'polite'); message.textContent = 'Toca los controles para explorar esta función.'; phone.append(message);
  }
  tourDialog.querySelectorAll('[data-phone]').forEach(button => button.addEventListener('click', () => renderTour(steps.findIndex(s => s.id === button.dataset.phone))));
  function renderTour(index) {
    current = index;
    const step = steps[index];
    const experience = experiences[index];
    const scene = tourDialog.querySelector('.tour-scene');
    renderPhone(step.id);
    const sceneImage = scene.querySelector('.tour-scene-image'); sceneImage.src = `/assets/tour/${step.id}.png`; sceneImage.alt = experience.label;
    scene.style.setProperty('--focus-x', `${experience.focus[0]}%`);
    scene.style.setProperty('--focus-y', `${experience.focus[1]}%`);
    tourDialog.querySelector('.scene-category').textContent = experience.label;
    [...chapters.children].forEach((button, i) => { button.setAttribute('aria-current', i === index ? 'step' : 'false'); });
    tourDialog.querySelector('.tour-progress div').style.width = `${(index + 1) / steps.length * 100}%`;
    const options = tourDialog.querySelector('.demo-options');
    const feedback = tourDialog.querySelector('.demo-feedback');
    options.replaceChildren(...experience.options.map((label, i) => {
      const button = document.createElement('button'); button.textContent = label; button.setAttribute('aria-pressed', String(i === 0));
      button.addEventListener('click', () => { [...options.children].forEach(b => b.setAttribute('aria-pressed', String(b === button))); feedback.textContent = experience.feedback[i]; });
      return button;
    }));
    feedback.textContent = experience.feedback[0];
    tourDialog.querySelector('.tour-step').textContent = `CONOCE PELUVI · ${index + 1} DE ${steps.length}`;
    tourDialog.querySelector('h2').textContent = step.title;
    tourDialog.querySelector('.tour-description').textContent = step.description;
    tourDialog.querySelector('ol').replaceChildren(...step.items.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    const link = tourDialog.querySelector('.tour-link');
    link.href = step.href; link.textContent = step.link;
    prev.disabled = index === 0;
    next.textContent = index === steps.length - 1 ? 'Terminar recorrido ✓' : 'Siguiente →';
  }
  document.querySelectorAll('[data-tour]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    renderTour(steps.findIndex(step => step.id === button.dataset.tour));
    tourDialog.showModal();
  }));
  prev.addEventListener('click', () => { if (current > 0) renderTour(current - 1); });
  next.addEventListener('click', () => { if (current < steps.length - 1) renderTour(current + 1); else renderTour(2); });
  tourDialog.querySelector('.tour-fullscreen').addEventListener('click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await tourDialog.requestFullscreen(); }
    catch { tourDialog.classList.toggle('expanded'); }
  });
  tourDialog.addEventListener('keydown', event => {
    if (event.target.tagName === 'INPUT') return;
    if (event.key === 'ArrowRight' && current < steps.length - 1) { event.preventDefault(); renderTour(current + 1); }
    if (event.key === 'ArrowLeft' && current > 0) { event.preventDefault(); renderTour(current - 1); }
  });
  tourDialog.querySelector('.tour-close')?.addEventListener('click', () => tourDialog.close());
  tourDialog.addEventListener('click', event => { if (event.target === tourDialog) { const r = tourDialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) tourDialog.close(); } });
  if (tourDialog.classList.contains('inline-explorer')) renderTour(2);
  tourDialog.addEventListener('close', () => { if (document.fullscreenElement === tourDialog) document.exitFullscreen().catch(() => {}); opener?.focus(); });
}
