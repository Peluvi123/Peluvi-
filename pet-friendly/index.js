import config from '/directorio/config.js';
import { el, safeUrl, picture, external, rpc } from '/comunidad/shared/ui.js';
const categories = { restaurant:'Restaurantes',cafe:'Cafés',mall:'Centros comerciales',hotel:'Hoteles',bar:'Bares',park:'Parques',vet:'Veterinarias',grooming:'Peluquerías',pet_store:'Tiendas de mascotas',coworking:'Coworking',lodging:'Alojamientos',other:'Otros' };
const cities = [[4.6533,-74.0836],[6.2442,-75.5812],[3.4516,-76.532],[10.9685,-74.7813],[10.391,-75.4794],[7.1193,-73.1227],[4.8133,-75.6961],[5.0703,-75.5138],[11.2408,-74.199]];
const $ = selector => document.querySelector(selector);
const form = $('#search-form'), grid = $('#places'), status = $('#status'), more = $('#more');
let offset = 0, request, version = 0, lastParams;
Object.entries(categories).forEach(([value,label]) => $('#category').add(new Option(label,value)));
function photo(place) {
  const ref = [...(place.photos || []),...(place.google_photos || []),place.logo_url].find(Boolean);
  if (!ref) return '';
  return safeUrl(ref) || (/^places\//.test(ref) ? `${config.url}/functions/v1/place-photo?name=${encodeURIComponent(ref)}&w=600` : '');
}
function card(place, distance) {
  const node = el('article',null,'card');
  const cover = el('div','🐾','card-cover'); const url = photo(place);
  if (url) { cover.textContent = ''; cover.append(picture(url,place.name)); }
  node.append(cover,el('h3',place.name),el('span',categories[place.category] || 'Otros','eyebrow'));
  node.append(el('p',[place.address,place.city].filter(Boolean).join(' · ')));
  if (Number.isFinite(distance)) node.append(el('p',`${(distance/1000).toFixed(1)} km del centro de la ciudad`));
  const badges = el('div',null,'badges');
  badges.append(el('span',place.is_pet_friendly === true ? 'Admisión de mascotas confirmada' : 'Admisión por confirmar','badge'));
  if (place.is_peluvi_verified) badges.append(el('span','Verificado por Peluvi','badge verified'));
  node.append(badges);
  if (place.peluvi_reviews > 0) node.append(el('p',`★ ${place.peluvi_rating} · ${place.peluvi_reviews} reseñas en Peluvi`));
  if (place.reviews_google > 0) node.append(el('p',`★ ${place.rating_google} · ${place.reviews_google} reseñas en Google`));
  const details = el('details'); details.append(el('summary','Condiciones y servicios'));
  if (place.description) details.append(el('p',place.description));
  if (place.pet_policy) details.append(el('p',place.pet_policy));
  const list = el('ul');
  for (const [key,label] of Object.entries({allows_dogs:'Perros',allows_cats:'Gatos',allows_large_dogs:'Perros grandes',allows_indoor:'Acceso al interior',allows_terrace:'Terraza',water_available:'Agua para mascotas',pet_menu:'Menú para mascotas',leash_required:'Uso de correa requerido'})) {
    if (place[key] != null) list.append(el('li',`${label}: ${place[key] ? 'Sí' : 'No'}`));
  }
  if (list.childElementCount) details.append(list); else details.append(el('p','Consulta con el lugar las condiciones para tu mascota.'));
  (place.opening_hours?.weekdayDescriptions || []).forEach(line => details.append(el('p',line)));
  node.append(details);
  if (Number.isFinite(place.latitude) && Number.isFinite(place.longitude)) node.append(external('Cómo llegar ↗',`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`));
  if (safeUrl(place.website)) node.append(external('Sitio web ↗',place.website));
  const phone = String(place.whatsapp || place.phone || '').replace(/\D/g,'');
  if (phone.length >= 7 && phone.length <= 15) { const contact = el('a','Llamar','action secondary'); contact.href = `tel:+${/^3\d{9}$/.test(phone) ? '57' : ''}${phone}`; node.append(contact); }
  const reviews = el('details'); reviews.append(el('summary','Reseñas de la comunidad'));
  const content = el('div'); reviews.append(content); let loaded = false, busy = false;
  reviews.addEventListener('toggle', async () => {
    if (!reviews.open || loaded || busy) return; busy = true; content.textContent = 'Cargando reseñas…';
    try { const rows = await rpc('pet_friendly_reviews_list',{p_place:place.id,p_limit:20,p_offset:0}); content.replaceChildren();
      if (!rows.length) content.append(el('p','Este lugar aún no tiene reseñas en Peluvi.'));
      rows.forEach(row => { const review = el('div',null,'review'); review.append(el('strong',`${row.author?.name || 'Usuario Peluvi'} · ${row.rating}/5`),el('p',row.comment)); content.append(review); }); loaded = true;
    } catch { content.textContent = 'No pudimos cargar las reseñas. Cierra y vuelve a abrir para intentarlo.'; } finally { busy = false; }
  });
  node.append(reviews); return node;
}
async function search(append = false) {
  const current = ++version; request?.abort(); request = new AbortController();
  if (!append) { offset = 0; grid.replaceChildren(); const [lat,lng] = cities[Number(form.elements.city.value)] || cities[0]; lastParams = {p_lat:lat,p_lng:lng,p_radius_m:20000,p_categories:form.elements.category.value ? [form.elements.category.value] : null,p_query:form.elements.query.value.trim() || null,p_filters:{verified:$('#verified').checked,confirmed:$('#confirmed').checked,cats:$('#cats').checked,terrace:$('#terrace').checked,sort:'distance'},p_limit:30}; }
  more.hidden = true; status.textContent = 'Buscando lugares…';
  try {
    const rows = await rpc('pet_friendly_search',{...lastParams,p_offset:offset},AbortSignal.any([request.signal,AbortSignal.timeout(20000)]));
    if (current !== version) return;
    rows.forEach(row => grid.append(card(row.place,row.distance_m))); offset += rows.length;
    status.textContent = `${offset} ${offset === 1 ? 'lugar encontrado' : 'lugares encontrados'}`;
    if (!offset) { const empty = el('div',null,'empty'); empty.append(el('h2','Aún no encontramos lugares aquí'),el('p','Prueba otra ciudad, categoría o desactiva algún filtro.')); grid.append(empty); }
    more.hidden = rows.length < 30;
  } catch { if (current !== version) return; status.textContent = 'No pudimos cargar los lugares. Pulsa Buscar lugares para intentar de nuevo.'; if (append) more.hidden = false; }
}
form.addEventListener('submit',event => {event.preventDefault();search();});
$('.checks').addEventListener('change',()=>search()); more.addEventListener('click',()=>search(true)); search();
