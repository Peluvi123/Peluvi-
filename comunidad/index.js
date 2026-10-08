import config from '/directorio/config.js';
import { el, picture, safeUrl, checked, date } from './shared/ui.js';
const $ = selector => document.querySelector(selector);
const status = $('#status'), feed = $('#feed'), more = $('#more');
let client, user, before = null, generation = 0, busy = false;
const authorFilter = new URLSearchParams(location.search).get('autor');
if (authorFilter) { document.querySelector('h1').textContent = 'Comunidad del negocio'; document.querySelector('#access h2').textContent = 'Conoce su comunidad.'; }
const seen = new Set();
let toastTimer;
function notify(message) { const toast = $('#toast'); toast.textContent = message; toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.hidden = true, 4200); }
const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  entry.target.querySelectorAll('video').forEach(video => { if (entry.isIntersecting) video.play().catch(() => {}); else video.pause(); });
}), {threshold: .65});
function action(icon, label, handler) { const button = el('button', null, 'post-action'); button.type = 'button'; button.setAttribute('aria-label', label); const glyph = el('span', null, 'action-icon'); const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('width','23'); svg.setAttribute('height','23'); svg.setAttribute('fill','none'); svg.setAttribute('stroke','currentColor'); svg.setAttribute('stroke-width','1.8'); svg.setAttribute('aria-hidden','true'); const path = document.createElementNS(svg.namespaceURI, 'path'); path.setAttribute('d', {'♥':'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z','☏':'M21 11.5a9 9 0 0 1-9 9H4l-2 2V11.5a9.5 9.5 0 0 1 19 0ZM7 11h.01M12 11h.01M17 11h.01','♧':'M6 3h12v18l-6-4-6 4Z','↗':'M14 3l7 7-7 7v-5C7 12 4 15 3 20V12c0-5 5-7 11-7Z'}[icon]); svg.append(path); glyph.append(svg); button.append(glyph, el('span', label)); button.addEventListener('click', handler); return button; }

function postCard(post, accountGeneration) {
  const card = el('article',null,'card'); card.id = `post-${post.id}`;
  const header = el('header',null,'post-header');
  if (safeUrl(post.author_avatar)) header.append(picture(post.author_avatar,'','avatar'));
  const author = el('div'); author.append(el('strong',post.author_name || 'Usuario Peluvi'),el('small',date(post.created_at))); header.append(author);
  const info = el('div', null, 'post-info'); info.append(header,el('p',post.caption,'post-caption'));
  if (post.hidden) info.append(el('p','Esta publicación está oculta para la comunidad. Solo tú puedes verla.'));
  const media = el('div',null,'post-media');
  for (const asset of post.media || []) {
    if (!safeUrl(asset.url)) continue;
    if (asset.type === 'image') media.append(picture(asset.url,`Foto de ${post.author_name || 'la comunidad'}`));
    if (asset.type === 'video') { const video = el('video'); video.src = safeUrl(asset.url); video.controls = true; video.preload = 'metadata'; video.playsInline = true; video.muted = true; video.loop = true; if (safeUrl(asset.poster)) video.poster = safeUrl(asset.poster); media.append(video); }
  }
  if (!media.children.length) { media.classList.add('no-media'); media.textContent = 'Un momento de nuestra comunidad ✦'; } card.append(media, info);
  const details = el('details',null,'comments'); details.append(el('summary','Ver comentarios')); const content = el('div'); details.append(content); let loaded = false, loading = false;
  details.addEventListener('toggle', async()=>{
    if (!details.open || loaded || loading || accountGeneration !== generation) return;
    loading = true; content.textContent = 'Cargando comentarios…';
    try { const rows = checked(await client.rpc('community_post_comments',{p_post:post.id})); if (accountGeneration !== generation) return;
      content.replaceChildren(); if (!rows.length) content.append(el('p','Aún no hay comentarios.'));
      rows.forEach(row=>{ const comment = el('div',null,'comment'); comment.append(el('strong',row.author_name || 'Usuario Peluvi'),el('p',row.body)); content.append(comment); }); loaded = true;
    } catch { if (accountGeneration === generation) content.textContent = 'No pudimos cargar los comentarios. Cierra y abre esta sección para reintentar.'; } finally { loading = false; }
  });
  const actions = el('div', null, 'post-actions');
  const reactions = action('♥', `${post.reaction_count || 0} reacciones`, () => notify('Para reaccionar a esta publicación, entra a la app Peluvi.'));
  const comments = action('☏', `${post.comment_count || 0} comentarios`, () => { details.open = !details.open; });
  const key = `peluvi-saved:${user.id}:${post.id}`;
  const save = action('♧', 'Guardar', () => { try { const active = localStorage.getItem(key) !== '1'; if (active) localStorage.setItem(key, '1'); else localStorage.removeItem(key); save.setAttribute('aria-pressed', String(active)); notify(active ? 'Publicación guardada en este navegador.' : 'Publicación retirada de tus guardados.'); } catch { notify('No se pudo guardar en este navegador.'); } });
  try { save.setAttribute('aria-pressed', String(localStorage.getItem(key) === '1')); } catch { save.setAttribute('aria-pressed', 'false'); }
  const share = action('↗', 'Compartir', async () => { const url = new URL(location.href); url.hash = card.id; try { if (navigator.share) await navigator.share({title: 'Un momento en Peluvi', url: url.href}); else { await navigator.clipboard.writeText(url.href); notify('Enlace copiado.'); } } catch (error) { if (error.name !== 'AbortError') notify('No se pudo compartir el enlace.'); } });
  actions.append(reactions, comments, save, share); card.append(actions, details); observer.observe(card); return card;
}
async function loadFeed() {
  if (!user || busy) return; busy = true; more.hidden = true; status.textContent = 'Cargando publicaciones…'; const current = generation;
  try { const posts = checked(await client.rpc('community_feed',{p_before:before,p_limit:10,p_author:authorFilter || null})); if (current !== generation) return;
    posts.forEach(post => { if (!seen.has(post.id)) { const card = postCard(post,current); feed.append(card); seen.add(post.id); if (location.hash === `#${card.id}`) requestAnimationFrame(() => card.scrollIntoView({block:'center'})); } });
    if (posts.length) before = posts.at(-1).created_at;
    status.textContent = seen.size ? 'Las últimas historias de la comunidad.' : 'Aún no hay publicaciones para mostrar. Las nuevas historias aparecerán aquí.';
    more.hidden = posts.length < 10;
  } catch { if (current !== generation) return; status.textContent = 'No pudimos cargar la comunidad. Intenta de nuevo.'; more.textContent = 'Volver a intentar'; more.hidden = false; }
  finally { if (current === generation) busy = false; }
}
function setAccount(next) {
  if (user?.id === next?.id && next) return;
  generation++; user = next; busy = false; before = null; seen.clear(); observer.disconnect(); feed.querySelectorAll('video').forEach(video => video.pause()); feed.replaceChildren(); more.hidden = true;
  $('#logout').hidden = !user; $('#access').hidden = !!user; $('#community-content').hidden = !user;
  if (user) { more.textContent = 'Ver más publicaciones'; loadFeed(); } else status.textContent = '';
}
$('#login').addEventListener('submit',async event=>{
  event.preventDefault(); const button = $('#login-button'); button.disabled = true; status.textContent = 'Iniciando sesión…';
  try { const data = checked(await client.auth.signInWithPassword({email:event.currentTarget.elements.email.value.trim(),password:event.currentTarget.elements.password.value})); $('#login').elements.password.value = ''; setAccount(data.user); }
  catch { status.textContent = 'No pudimos iniciar sesión. Revisa tu correo, contraseña y conexión.'; }
  finally { button.disabled = false; }
});
$('#logout').addEventListener('click',async()=>{ $('#logout').disabled = true; try { checked(await client.auth.signOut({scope:'local'})); setAccount(null); } catch { status.textContent = 'No pudimos cerrar sesión. Intenta de nuevo.'; } finally { $('#logout').disabled = false; } });
more.addEventListener('click',loadFeed);
function movePost(direction) { const cards = [...feed.children]; if (!cards.length) return; let index = cards.reduce((best, card, i) => Math.abs(card.getBoundingClientRect().top - 20) < Math.abs(cards[best].getBoundingClientRect().top - 20) ? i : best, 0); const target = cards[index + direction]; if (target) target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'}); else if (direction > 0 && !more.hidden) { more.scrollIntoView({block:'center'}); more.focus(); } }
$('#previous-post').addEventListener('click', () => movePost(-1));
$('#next-post').addEventListener('click', () => movePost(1));

async function init() {
  try { const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2'); client = createClient(config.url,config.key,{auth:{storageKey:'peluvi-web-client'}});
    client.auth.onAuthStateChange((event,session)=>{ setTimeout(()=>setAccount(session?.user || null),0); });
    const session = checked(await client.auth.getSession()); setAccount(session.session?.user || null); $('#login-button').disabled = false;
  } catch { status.textContent = 'No pudimos conectar con Peluvi. Recarga la página para volver a intentar.'; }
}
init();
