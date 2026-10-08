import { categories, fetchCategory } from './catalog.js';

const dialog = document.querySelector('.directory');
const tabs = dialog.querySelector('nav');
const results = dialog.querySelector('.directory-results');
const status = dialog.querySelector('.directory-status');
const input = dialog.querySelector('input');
let active = 'vet', records = [], controller, loading = false;
const emergency = document.querySelector('#emergency-only');
const categoryCopy = { vet: 'Encuentra veterinarias, conoce sus servicios y solicita una cita para tu mascota.', grooming: 'Descubre peluquerías, explora sus servicios y reserva su próximo momento de cuidado.', caretaker: 'Conoce cuidadores y encuentra compañía para los paseos y días de tu mascota.', products: 'Explora alimentos y accesorios publicados en Peluvi para consentir a tu mascota.', adoption: 'Conoce sus historias y conecta con quienes pueden ayudarte a darle un nuevo hogar.' };
const folded = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const element = (tag, text, className) => {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
};
function safeImage(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
}
function render() {
  results.replaceChildren();
  if (loading) return;
  const term = folded(input.value.trim());
  const matches = records.filter(item => folded([item.name, item.location, item.subtitle, ...item.services].join(' ')).includes(term) && (!emergency.checked || item.emergency));
  status.textContent = matches.length ? `${matches.length} ${matches.length === 1 ? 'resultado' : 'resultados'}` : (term || emergency.checked) ? 'No encontramos coincidencias. Prueba otro nombre o ciudad.' : 'Todavía no hay publicaciones disponibles en esta categoría.';
  if (!matches.length) {
    const empty = element('div', undefined, 'directory-empty');
    empty.append(element('span', '♡'), element('h3', records.length ? 'Probemos otra búsqueda' : 'Pronto habrá más por descubrir'), element('p', records.length ? 'Cambia el texto o desactiva el filtro para ver más opciones.' : 'Cuando haya publicaciones disponibles, podrás encontrarlas aquí.'));
    results.append(empty);
  }
  matches.forEach(item => {
    const card = element('article', undefined, 'directory-card');
    const cover = element('div', categories[active].icon, 'directory-cover');
    const imageUrl = safeImage(item.image);
    if (imageUrl) {
      const image = element('img'); image.src = imageUrl; image.alt = item.name; image.loading = 'lazy';
      image.addEventListener('error', () => image.remove(), { once: true }); cover.append(image);
    }
    const body = element('div', undefined, 'directory-card-body');
    body.append(element('span', categories[active].title, 'card-category'), element('h3', item.name));
    if (item.description) body.append(element('p', item.description, 'card-intro'));
    if (item.location) body.append(element('p', `⌖ ${item.location}`, 'directory-location'));
    if (item.subtitle) body.append(element('p', item.subtitle));
    if (Number(item.reviews) > 0) body.append(element('p', `★ ${item.rating} · ${item.reviews} opiniones`));
    if (item.price !== undefined) body.append(element('strong', new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.price), 'directory-price'));
    if (item.emergency) body.append(element('span', 'Atiende urgencias', 'directory-badge'));
    if (item.available === false) body.append(element('span', 'Sin disponibilidad por ahora', 'directory-badge'));
    const details = element('details'); details.append(element('summary', 'Ver información'));
    details.append(element('p', item.description || 'Este perfil aún no tiene una descripción.'));
    if (item.schedule) details.append(element('p', `Horarios: ${item.schedule}`));
    if (item.services.length) { const list = element('ul'); item.services.forEach(service => list.append(element('li', service))); details.append(list); }
    body.append(details);
    if (['vet', 'grooming'].includes(active)) {
      const book = element('a', 'Agendar cita →', 'directory-contact booking-link');
      book.href = `/directorio/citas.html?categoria=${active}&proveedor=${encodeURIComponent(item.id)}`;
      body.append(book);
    }
    const digits = String(item.phone).replace(/\D/g, '');
    const phone = /^3\d{9}$/.test(digits) ? `57${digits}` : digits;
    if (phone.length >= 7 && phone.length <= 15) {
      const contact = element('a', 'Contactar por WhatsApp', 'directory-contact');
      contact.href = `https://wa.me/${phone}`; contact.target = '_blank'; contact.rel = 'noopener noreferrer'; body.append(contact);
    }
    card.append(cover, body); results.append(card);
  });
}
async function openCategory(key) {
  const url = new URL(location.href); url.searchParams.set('categoria', key); history.replaceState(null, '', url);
  document.title = `${categories[key].title} | Peluvi`;
  document.querySelector('#hero-title').replaceChildren(document.createTextNode(categories[key].title), element('span', '.'));
  document.querySelector('.hero-description').textContent = categoryCopy[key];
  document.querySelector('.current-category').textContent = categories[key].title;
  emergency.checked = false; document.querySelector('.emergency-filter').hidden = key !== 'vet';
  active = key; records = []; loading = true; input.value = ''; results.replaceChildren();
  dialog.querySelector('#directory-title').textContent = categories[key].title;
  tabs.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === key)));
  status.textContent = 'Cargando publicaciones de Peluvi…';
  controller?.abort(); controller = new AbortController();
  const request = controller;
  try {
    records = await fetchCategory(key, AbortSignal.any([request.signal, AbortSignal.timeout(20000)]));
    if (request !== controller) return;
    loading = false; render();
  } catch (error) {
    if (request !== controller || request.signal.aborted) return;
    loading = false;
    status.textContent = 'No pudimos cargar las publicaciones. Revisa tu conexión e intenta de nuevo.';
    const retry = element('button', 'Volver a intentar', 'directory-contact'); retry.type = 'button';
    retry.addEventListener('click', () => openCategory(key)); results.append(retry);
  }
}
const categoryIcons = { vet: 'icon-vet-crop.png', grooming: 'icon-grooming-tight.png', caretaker: 'icon-walkers-crop.png', products: 'icon-food-tight.png', adoption: 'icon-heart.png' };
Object.entries(categories).forEach(([key, category]) => {
  const button = element('button'); button.type = 'button'; button.dataset.category = key;
  const icon = element('img'); icon.src = `/assets/${categoryIcons[key]}`; icon.alt = '';
  icon.width = 32; icon.height = 32;
  button.append(icon, element('span', category.title));
  button.addEventListener('click', () => openCategory(key)); tabs.append(button);
});
input.addEventListener('input', render);
emergency.addEventListener('change', render);
const initialCategory = new URLSearchParams(location.search).get('categoria');
openCategory(categories[initialCategory] ? initialCategory : 'vet');
