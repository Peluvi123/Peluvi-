import config from './app-config.js';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = value => Number(value || 0).toLocaleString('es-CO');
const date = value => value ? new Date(value).toLocaleString('es-CO') : '—';
const types = {client:'Cliente',provider:'Proveedor',vet:'Veterinaria',grooming:'Peluquería',foundation:'Fundación',food:'Tienda',caretaker:'Cuidador'};
const actions = {suspend:'Suspensión',unsuspend:'Reactivación',delete_user:'Cuenta eliminada',delete_content:'Contenido eliminado',resolve_sos:'SOS resuelto'};
let session = null, view = 'summary', rows = [], requestId = 0, busy = false;
function message(text, error = false) { $('app-message').textContent = text; $('app-message').classList.toggle('app-error', error); }
function disconnect() {
  session = null; requestId++; rows = []; $('app-results').replaceChildren();
  $('app-workspace').hidden = true; $('app-login').hidden = false;
  $('app-connection').textContent = 'Cuenta de la app sin conectar';
  $('app-detail').close(); $('app-detail-body').replaceChildren(); message('');
}
async function request(path, body, token = session?.access_token) {
  const response = await fetch(`${config.url}${path}`, {method:'POST', headers:{apikey:config.key,'Content-Type':'application/json',Authorization:`Bearer ${token || config.key}`},body:JSON.stringify(body)});
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && session) disconnect();
    const code = data?.error_code || data?.code;
    if (code === 'invalid_credentials') throw new Error('El correo o la contraseña de la app son incorrectos. Usa tu cuenta administradora de Peluvi.');
    if (code === 'email_not_confirmed') throw new Error('Confirma el correo de tu cuenta de Peluvi antes de ingresar.');
    if (response.status === 429) throw new Error('Hay demasiados intentos. Espera unos minutos antes de volver a ingresar.');
    throw new Error(response.status === 401 ? 'La sesión expiró o los datos de acceso son incorrectos.' : data?.message === 'not_admin' ? 'Esta cuenta no tiene permisos de administrador.' : 'No se pudo completar la solicitud. Revisa la conexión y los permisos de tu cuenta.');
  }
  return data;
}
async function rpc(name, args = {}) {
  if (!session) throw new Error('Conecta tu cuenta administradora.');
  if (Date.now() / 1000 > session.expires_at - 60) {
    const previous = session;
    const renewed = await request('/auth/v1/token?grant_type=refresh_token', {refresh_token:session.refresh_token});
    if (session !== previous) throw new Error('La sesión se cerró.');
    session = {...renewed, expires_at: Date.now()/1000 + renewed.expires_in};
  }
  return request(`/rest/v1/rpc/${name}`, args);
}
$('app-login').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true; message('Conectando con Peluvi…');
  try {
    const data = new FormData(event.currentTarget);
    const auth = await request('/auth/v1/token?grant_type=password', {email:data.get('email'),password:data.get('password')});
    const allowed = await request('/rest/v1/rpc/is_admin', {}, auth.access_token);
    if (!allowed) throw new Error('Esta cuenta no tiene permisos de administrador en Peluvi.');
    session = {...auth, expires_at:Date.now()/1000 + auth.expires_in};
    event.target.reset(); $('app-login').hidden = true; $('app-workspace').hidden = false;
    $('app-connection').textContent = 'Conectado · ' + auth.user.email; await load();
  } catch (error) { message(error.message, true); } finally { button.disabled = false; }
});
$('app-disconnect').addEventListener('click', disconnect);
$('logout-btn').addEventListener('click', disconnect);
$('app-detail-close').addEventListener('click', () => $('app-detail').close());
$('app-refresh').addEventListener('click', load);
$('app-filters').addEventListener('submit', event => { event.preventDefault(); load(); });
$('app-kind').addEventListener('change', load);
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  view = button.dataset.view; $('app-search').value = '';
  document.querySelectorAll('[data-view]').forEach(item => item.classList.toggle('selected', item === button));
  $('app-filters').hidden = !['users','content'].includes(view); $('app-kind-label').hidden = view !== 'content'; load();
}));
function cards(items) { return `<div class="app-metrics">${items.map(([label,value])=>`<article class="app-metric"><span>${esc(label)}</span><strong>${esc(value ?? '—')}</strong></article>`).join('')}</div>`; }
function table(headers, body) { return `<div class="app-table"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${body.join('')}</tbody></table></div>`; }
function button(label, action, index) { return `<button data-action="${action}" data-index="${index}">${label}</button>`; }
async function load() {
  if (!session) return;
  const id = ++requestId, current = view; message('Cargando información…'); $('app-results').replaceChildren();
  try {
    const search = $('app-search').value.trim() || null;
    const data = await ({summary:()=>rpc('admin_stats'),users:()=>rpc('admin_list_users',{search}),content:()=>rpc('admin_list_content',{kind:$('app-kind').value,search}),activity:()=>rpc('admin_list_actions',{max_rows:150}),community:()=>rpc('admin_community_reports')})[current]();
    if (id !== requestId || !session) return;
    let html = '';
    if (current === 'summary') {
      html = cards([['Usuarios',number(data.users?.total)],['Nuevos en 7 días',number(data.users?.new_7d)],['Proveedores',number(data.users?.providers)],['Alertas SOS activas',number(data.sos?.active)],['Citas pendientes',number(data.appointments?.pending)],['Solicitudes de adopción',number(data.adoption?.requests_pending)],['Pedidos pendientes',number(data.orders?.pending)],['Calificación media',data.reviews?.avg ?? '—']]);
      const signups = data.signups_14d || [], max = Math.max(1,...signups.map(d=>d.count));
      html += `<div class="app-columns"><section class="app-card"><h3>La comunidad crece</h3><p>Registros de los últimos 14 días</p><div class="app-chart">${signups.map(d=>`<div title="${esc(d.day)}: ${number(d.count)} registros"><span>${number(d.count)}</span><i style="height:${Math.max(3,d.count/max*100)}px"></i><small>${esc(d.day.slice(5))}</small></div>`).join('')}</div></section><section class="app-card"><h3>Ciudades de la comunidad</h3>${(data.top_cities || []).map(c=>`<p class="app-city"><span>${esc(c.city)}</span><strong>${number(c.count)}</strong></p>`).join('') || '<p>Aún no hay ciudades registradas.</p>'}</section></div>`;
      html += cards([['Mascotas en adopción',number(data.adoption?.available)],['Adopciones completadas',number(data.adoption?.adopted)],['Citas completadas',number(data.appointments?.completed)],['Pedidos entregados',number(data.orders?.delivered)]]);
    } else {
      rows = data || [];
      if (!rows.length) html = '<div class="app-empty"><h3>Todo al día</h3><p>No hay registros para esta consulta.</p></div>';
      else if (current === 'users') html = table(['Persona o negocio','Tipo','Ciudad','Estado','Acciones'], rows.map((u,i)=>`<tr><td><strong>${esc(u.business_name || u.name || 'Sin nombre')}</strong><small>${esc(u.email)}</small></td><td>${esc(types[u.provider_type] || types[u.role] || u.role)}</td><td>${esc(u.city || '—')}</td><td>${u.is_admin ? 'Administrador' : isSuspended(u) ? 'Suspendido' : 'Activo'}</td><td>${button('Ver ficha','detail',i)}${!u.is_admin && u.id !== session.user.id ? button(isSuspended(u)?'Reactivar':'Suspender',isSuspended(u)?'unsuspend':'suspend',i) : ''}</td></tr>`));
      else if (current === 'content') html = table(['Contenido','Responsable','Estado','Acciones'],rows.map((r,i)=>`<tr><td><strong>${esc(r.title)}</strong><small>${esc(r.subtitle)}</small></td><td>${esc(r.owner)}</td><td>${esc(r.status)}</td><td>${$('app-kind').value === 'sos' && r.status === 'active' ? button('Marcar resuelto','resolve',i) : ''}${button('Eliminar','delete-content',i)}</td></tr>`));
      else if (current === 'activity') html = table(['Acción','Responsable','Registro','Fecha'],rows.map(r=>`<tr><td>${esc(actions[r.action] || r.action)}</td><td>${esc(r.admin_name || 'Administrador')}</td><td>${esc(r.target_label)}<small>${esc(r.details)}</small></td><td>${esc(date(r.created_at))}</td></tr>`));
      else html = table(['Publicación','Reportes','Motivos','Acciones'],rows.map((r,i)=>`<tr><td>${esc(r.author_name)}<small>${esc(r.body || r.content || '')}</small></td><td>${number(r.reports)}</td><td>${esc((r.reasons || []).join(', '))}</td><td>${button('Conservar','keep',i)}${button('Ocultar','hide',i)}</td></tr>`));
    }
    $('app-results').innerHTML = html; message(`Actualizado a las ${new Date().toLocaleTimeString('es-CO')}`);
  } catch (error) { if (id === requestId) message(error.message, true); }
}
function isSuspended(user) { return user.suspended_until === 'infinity' || new Date(user.suspended_until) > new Date(); }
$('app-results').addEventListener('click', async event => {
  const target = event.target.closest('[data-action]'); if (!target || busy) return;
  const row = rows[Number(target.dataset.index)], action = target.dataset.action;
  if (!row) return;
  busy = true; target.disabled = true;
  try {
    if (action === 'detail') {
      const data = await rpc('admin_user_detail',{target:row.id});
      if (!session) return;
      $('app-detail-body').innerHTML = `<h2>${esc(row.business_name || row.name)}</h2><p>${esc(row.email)} · ${esc(row.phone || 'Sin teléfono')}</p><p>${esc(row.city)} · ${esc(data.address)}</p>${cards([['Mascotas',data.pets],['Citas reservadas',data.appointments_booked],['Citas recibidas',data.appointments_received],['Pedidos',data.orders_made],['Calificación',data.rating],['Último acceso',date(data.last_sign_in)]])}<p>${esc(row.suspension_reason || '')}</p>`;
      $('app-detail').showModal(); return;
    }
    let args, name;
    if (action === 'suspend') {
      const reason = prompt('Motivo de la suspensión (se guardará en el historial):'); if (!reason?.trim()) return;
      const days = prompt('Duración en días. Escribe 0 para suspensión indefinida.','7'); if (days === null) return;
      if (!/^\d+$/.test(days) || Number(days) > 3650) throw new Error('Escribe una duración entre 0 y 3650 días.');
      args = {target:row.id,until:Number(days) ? new Date(Date.now()+Number(days)*86400000).toISOString():null,reason:reason.trim()}; name = 'admin_suspend_user';
    } else if (action === 'unsuspend') { name='admin_unsuspend_user'; args={target:row.id}; }
    else if (action === 'resolve') { name='admin_resolve_sos'; args={item:row.id}; }
    else if (action === 'delete-content') { const reason=prompt('Motivo de eliminación (se guardará en el historial):'); if (!reason?.trim()) return; name='admin_delete_content';args={kind:$('app-kind').value,item:row.id,reason:reason.trim()}; }
    else { name='admin_resolve_post_reports';args={p_post:row.post_id,p_action:action}; }
    const label = row.title || row.business_name || row.name || row.author_name || 'este registro';
    if (!confirm(`${target.textContent}: ${label}. ${action === 'delete-content' ? 'Esta eliminación es permanente. ' : ''}¿Confirmas la acción?`)) return;
    await rpc(name,args); await load();
  } catch (error) { message(error.message,true); } finally { busy=false; target.disabled=false; }
});

const passwordInput = $('app-password');
const passwordToggle = $('app-password-toggle');
function hidePassword() {
  passwordInput.type = 'password';
  passwordToggle.setAttribute('aria-label', 'Mostrar contraseña');
  passwordToggle.setAttribute('aria-pressed', 'false');
  passwordToggle.querySelector('.eye-slash').setAttribute('hidden', '');
}
passwordToggle.addEventListener('click', () => {
  const visible = passwordInput.type === 'password';
  passwordInput.type = visible ? 'text' : 'password';
  passwordToggle.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
  passwordToggle.setAttribute('aria-pressed', String(visible));
  passwordToggle.querySelector('.eye-slash').toggleAttribute('hidden', !visible);
});
$('app-login').addEventListener('submit', hidePassword);
$('logout-btn').addEventListener('click', hidePassword);
$('app-disconnect').addEventListener('click', hidePassword);
