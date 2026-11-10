import { objectives, statuses, dateKey, metrics, calendarStatus } from './commercial-utils.js';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = (n,currency='COP') => new Intl.NumberFormat('es-CO',{style:'currency',currency,maximumFractionDigits:currency==='COP'?0:2}).format(n);
const num = n => Number(n).toLocaleString('es-CO');
let state = null, storage = '', month = dateKey().slice(0,7), loading = false, saving = false;
const dialog = $('cm-dialog');
function message(value,error=false) { for (const id of ['cm-message','cm-calendar-message']) { $(id).textContent=value; $(id).classList.toggle('cm-error',error); } }
async function api(input) {
  const token = localStorage.getItem('peluvi_admin_token');
  if (!token) throw new Error('Inicia sesión como administrador para continuar.');
  const response = await fetch('/api/admin/commercial',{method:input?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(input?{body:JSON.stringify(input)}:{})});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo completar la operación.');
  state=data.state; storage=data.storage; render();
}
async function refresh() {
  if (loading) return;
  loading=true; message('Cargando campañas…');
  try { await api(); message(''); } catch(e) { message(e.message,true); } finally { loading=false; }
}
async function save(action,data) {
  if (saving) return;
  saving=true;
  const buttons=[...dialog.querySelectorAll('button')]; buttons.forEach(b=>b.disabled=true);
  $('cm-dialog-message').textContent='Guardando…';
  try { await api({action,data,revision:state.revision}); dialog.close(); message('Cambios guardados.'); }
  catch(e) { $('cm-dialog-message').textContent=e.message; $('cm-dialog-message').classList.add('cm-error'); }
  finally { saving=false; buttons.forEach(b=>b.disabled=false); }
}
function open(title,html) { $('cm-dialog-title').textContent=title; $('cm-dialog-body').innerHTML=html; $('cm-dialog-message').textContent=''; $('cm-dialog-message').classList.remove('cm-error'); if (!dialog.open) dialog.showModal(); }
$('cm-dialog-close').onclick=()=>dialog.close();
dialog.addEventListener('cancel',event=>{if(saving)event.preventDefault();});
function field(label,name,value='',type='text',extra='') { return `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`; }
function select(label,name,items,value) { return `<label>${label}<select name="${name}">${Object.entries(items).map(([k,v])=>`<option value="${esc(k)}" ${k===value?'selected':''}>${esc(v)}</option>`).join('')}</select></label>`; }
function formData(form) { return Object.fromEntries(new FormData(form)); }
function campaignForm(id) {
  if (!state) return;
  const c=state.campaigns.find(c=>c.id===id) || {name:'',owner:'Administración Peluvi',objective:'registrations',platform:'Meta Ads',currency:'COP',budget:0,target:100,status:'active',start:dateKey(),end:'',notes:''};
  open(id?'Editar campaña':'Una nueva campaña para Peluvi',`<form id="cm-campaign-form"><div class="cm-form-grid">${field('Nombre de campaña','name',c.name,'text','required maxlength="200"')}${field('Responsable','owner',c.owner,'text','required maxlength="100"')}${select('Objetivo','objective',objectives,c.objective)}${select('Canal','platform',Object.fromEntries(['Meta Ads','Google Ads','TikTok','Orgánico','Otro'].map(x=>[x,x])),c.platform)}${select('Moneda del presupuesto','currency',{COP:'Pesos colombianos (COP)',USD:'Dólares (USD)'},c.currency)}${field('Presupuesto planeado','budget',c.budget,'number','required min="0" step="0.01"')}${field('Meta de resultados (cantidad)','target',c.target,'number','required min="0" step="1"')}${select('Estado','status',statuses,c.status)}${field('Fecha de inicio','start',c.start,'date','required')}${field('Fecha de finalización (opcional)','end',c.end,'date')}<label class="wide">Notas<textarea name="notes" rows="3" maxlength="2000">${esc(c.notes)}</textarea></label></div><p class="cm-hint">El presupuesto es una planificación. La inversión real se obtiene de los resultados diarios. Archivar conserva los reportes y el historial.</p><div class="cm-actions"><button class="cm-primary" type="submit">Guardar campaña</button></div></form>`);
  $('cm-campaign-form').onsubmit=e=>{e.preventDefault();const b=formData(e.currentTarget);save('campaign',{...b,...(id?{id}:{}),budget:Number(b.budget),target:Number(b.target)});};
}
function filtered() {
  const f=formData($('cm-filters'));
  return state.campaigns.filter(c=>(!f.search || `${c.name} ${c.owner}`.toLowerCase().includes(f.search.toLowerCase())) && (!f.objective || c.objective===f.objective) && (!f.status || c.status===f.status));
}
function rowsFor(c) {
  const f=formData($('cm-filters'));
  return state.days.filter(d=>d.campaignId===c.id && (!f.from || d.date>=f.from) && (!f.to || d.date<=f.to));
}
function metric(label,value,note) { return `<article class="cm-metric"><small>${label}</small><strong>${value}</strong><small>${note}</small></article>`; }
function render() {
  if (!state) return;
  const storageText=storage==='local'?'Guardado local · Disponible en este equipo. La conexión a Supabase está pendiente para producción.':'Guardado en Supabase · Acceso privado de administración.';
  $('cm-storage').textContent=storageText; $('cm-calendar-storage').textContent=storageText;
  const campaigns=filtered(), rows=campaigns.flatMap(rowsFor), total=metrics(rows);
  $('cm-metrics').innerHTML=metric('Campañas activas',num(campaigns.filter(c=>c.status==='active').length),'Dentro de los filtros actuales')+metric('Inversión real',money(total.spend),'COP · Reportes del periodo')+metric('Resultados registrados',num(total.results),'Según el objetivo de cada campaña')+metric('Ingresos atribuidos',money(total.revenue),'COP · Registrados manualmente');
  $('cm-list').innerHTML=campaigns.length?`<div class="cm-table-wrap"><table><thead><tr><th>CAMPAÑA / RESPONSABLE</th><th>OBJETIVO</th><th>INVERSIÓN COP</th><th>RESULTADOS / META</th><th>COSTO / RESULTADO</th><th>ROAS</th><th>ESTADO</th><th>GESTIONAR</th></tr></thead><tbody>${campaigns.map(c=>{const m=metrics(rowsFor(c));return `<tr><td><strong>${esc(c.name)}</strong><small>${esc(c.owner)} · ${esc(c.platform)}</small><small>Presupuesto: ${money(c.budget,c.currency)} ${c.currency}</small></td><td>${objectives[c.objective]}</td><td>${money(m.spend)}</td><td>${num(m.results)} / ${num(c.target)}<small>${c.target?Math.round(m.results/c.target*100)+'% de la meta':'Sin meta'}</small></td><td>${m.cpr===null?'—':money(m.cpr)}</td><td>${c.objective==='sales'&&m.roas!==null?m.roas.toFixed(2)+'×':'—'}</td><td><span class="cm-pill ${c.status}">${statuses[c.status]}</span></td><td><button data-results="${c.id}">Resultados</button> <button data-edit="${c.id}">Editar</button></td></tr>`;}).join('')}</tbody></table></div>`:`<div class="cm-empty"><h3>${state.campaigns.length?'No hay coincidencias.':'Tu próxima campaña empieza aquí.'}</h3><p>${state.campaigns.length?'Ajusta los filtros para encontrar tus campañas.':'Define un objetivo, asigna un responsable y registra los resultados para descubrir qué funciona.'}</p>${state.campaigns.length?'':'<button class="cm-primary" data-new>Crear primera campaña</button>'}</div>`;
  $('cm-audit').innerHTML=state.events.slice(-30).reverse().map(e=>`<p><strong>${esc(e.detail)}</strong> · ${esc(e.actor)}<br><small>${new Date(e.at).toLocaleString('es-CO',{timeZone:'America/Bogota'})}</small></p>`).join('') || '<p>Aún no hay cambios registrados.</p>';
  const owner=$('cm-owner').value, owners=[...new Set(state.campaigns.map(c=>c.owner))].sort();
  $('cm-owner').innerHTML=owners.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('');
  if(owners.includes(owner))$('cm-owner').value=owner;
  renderCalendar();
}
$('cm-list').onclick=e=>{const edit=e.target.closest('[data-edit]'),results=e.target.closest('[data-results]'); if(edit)campaignForm(edit.dataset.edit);if(results)resultsForm(results.dataset.results);if(e.target.closest('[data-new]'))campaignForm();};
$('cm-new').onclick=()=>campaignForm();$('cm-refresh').onclick=refresh;
$('cm-filters').onsubmit=e=>e.preventDefault();$('cm-filters').oninput=()=>state&&render();
function resultsForm(id) {
  const c=state.campaigns.find(c=>c.id===id), rows=state.days.filter(d=>d.campaignId===id).sort((a,b)=>b.date.localeCompare(a.date)), totals=metrics(rows);
  open(c.name,`<div class="cm-detail-summary"><span>Inversión real<strong>${money(totals.spend)}</strong></span><span>${objectives[c.objective]}<strong>${num(totals.results)}</strong></span><span>Costo por resultado<strong>${totals.cpr===null?'—':money(totals.cpr)}</strong></span></div><form id="cm-day-form"><div class="cm-form-grid">${field('Día del reporte','date',dateKey(),'date',`required min="${c.start}" max="${c.end&&c.end<dateKey()?c.end:dateKey()}"`)}${field('Inversión del día ('+c.currency+')','spend',0,'number','required min="0" step="0.01"')}${c.currency==='USD'?field('Tasa del día · COP por USD','rate','','number','required min="0.01" step="0.01"'):''}${field('Mensajes recibidos','messages',0,'number','required min="0" step="1"')}${field(objectives[c.objective]+' · resultados','results',0,'number','required min="0" step="1"')}${field('Ingresos atribuidos (COP)','revenue',0,'number','required min="0" step="0.01"')}</div><p class="cm-hint">Datos manuales. Si el día ya tiene un reporte, se cargarán sus valores para editarlo. Guardar una corrección reabre el cierre de ese día.</p><div class="cm-actions"><button class="cm-primary" ${c.status==='archived'?'disabled':''}>Guardar reporte diario</button></div></form><h3>Historial diario</h3><div class="cm-table-wrap"><table><thead><tr><th>DÍA</th><th>INVERSIÓN COP</th><th>MENSAJES</th><th>RESULTADOS</th><th>INGRESOS COP</th></tr></thead><tbody>${rows.map(d=>`<tr><td><button type="button" data-day-edit="${d.date}">${d.date}</button></td><td>${money(d.spend*d.rate)}</td><td>${num(d.messages)}</td><td>${num(d.results)}</td><td>${money(d.revenue)}</td></tr>`).join('') || '<tr><td colspan="5">Aún no hay resultados registrados.</td></tr>'}</tbody></table></div>`);
  const form=$('cm-day-form');
  const loadDay=()=>{const row=rows.find(d=>d.date===form.elements.date.value);for(const key of ['spend','messages','results','revenue','rate'])if(form.elements[key])form.elements[key].value=row?.[key]??(key==='rate'?'':0);};
  form.elements.date.onchange=loadDay; loadDay();
  $('cm-dialog-body').querySelectorAll('[data-day-edit]').forEach(b=>b.onclick=()=>{form.elements.date.value=b.dataset.dayEdit;loadDay();form.scrollIntoView({block:'nearest'});});
  form.onsubmit=e=>{e.preventDefault();const b=formData(form);save('day',{...b,campaignId:id,spend:Number(b.spend),rate:Number(b.rate||1),messages:Number(b.messages),results:Number(b.results),revenue:Number(b.revenue)});};
}
function renderCalendar() {
  const [y,m]=month.split('-').map(Number), days=new Date(Date.UTC(y,m,0)).getUTCDate(), offset=(new Date(`${month}-01T12:00:00Z`).getUTCDay()+6)%7;
  $('cm-month-label').textContent=new Date(`${month}-01T12:00:00Z`).toLocaleDateString('es-CO',{month:'long',year:'numeric',timeZone:'America/Bogota'});
  const owner=$('cm-owner').value;
  if(!owner){$('cm-calendar').innerHTML='<div class="cm-empty"><h3>Un calendario para tus campañas.</h3><p>Crea una campaña y asigna un responsable para empezar el seguimiento diario.</p></div>';return;}
  let html=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=>`<div class="cm-weekday">${d}</div>`).join('')+'<div></div>'.repeat(offset);
  for(let n=1;n<=days;n++){const day=`${month}-${String(n).padStart(2,'0')}`, cell=calendarStatus(state,owner,day);html+=`<button class="cm-day ${cell.status}${day===dateKey()?' is-today':''}" data-close-day="${day}" aria-label="${day}: ${cell.label}"><strong>${n}</strong><small>${cell.label}${cell.late?' · tarde':''}</small>${cell.rows.length?`<small>${num(metrics(cell.rows).results)} resultados</small>`:''}</button>`;}
  $('cm-calendar').innerHTML=`<div class="cm-calendar-grid">${html}</div>`;
}
$('cm-calendar').onclick=e=>{const b=e.target.closest('[data-close-day]');if(b)closeDay(b.dataset.closeDay);};
function closeDay(day) {
  const owner=$('cm-owner').value,cell=calendarStatus(state,owner,day),totals=metrics(cell.rows);
  const campaigns=state.campaigns.filter(c=>c.owner===owner&&c.start<=day&&(!c.end||c.end>=day));
  const eligible=day<=dateKey()&&day>=state.config.trackingStart&&campaigns.length&&cell.status!=='closed';
  open('Reporte del '+day,`<p><strong>${esc(owner)}</strong> · ${cell.label}</p><div class="cm-detail-summary"><span>Inversión COP<strong>${money(totals.spend)}</strong></span><span>Resultados<strong>${num(totals.results)}</strong></span><span>Ingresos COP<strong>${money(totals.revenue)}</strong></span></div><div class="cm-table-wrap"><table><thead><tr><th>CAMPAÑA</th><th>RESULTADOS</th><th>REPORTE</th></tr></thead><tbody>${campaigns.map(c=>{const row=cell.rows.find(d=>d.campaignId===c.id);return `<tr><td>${esc(c.name)}</td><td>${row?num(row.results):'—'}</td><td>${row?'Registrado':'Sin reporte'}</td></tr>`;}).join('') || '<tr><td colspan="3">No hay campañas para esta fecha.</td></tr>'}</tbody></table></div>${eligible?`<form id="cm-close-form"><p>Al cerrar confirmas que revisaste todos los resultados de esta jornada${totals.results===0?', incluidos los días sin resultados':''}.</p><label><span><input type="checkbox" required> Confirmo que el reporte está completo.</span></label><div class="cm-actions"><button class="cm-primary">Confirmar cierre del día</button></div></form>`:'<p>Este día no requiere un nuevo cierre.</p>'}`);
  if($('cm-close-form'))$('cm-close-form').onsubmit=e=>{e.preventDefault();save('close',{owner,date:day});};
}
function shiftMonth(delta){const [y,m]=month.split('-').map(Number);month=new Date(Date.UTC(y,m-1+delta,1)).toISOString().slice(0,7);if(state)renderCalendar();}
$('cm-prev').onclick=()=>shiftMonth(-1);$('cm-next').onclick=()=>shiftMonth(1);$('cm-today').onclick=()=>{month=dateKey().slice(0,7);if(state)renderCalendar();};$('cm-owner').onchange=()=>renderCalendar();
$('cm-config-open').onclick=()=>{
  if(!state)return;const c=state.config;
  open('Configurar calendario comercial',`<form id="cm-config-form"><div class="cm-form-grid">${field('Hora límite · Colombia','deadline',c.deadline,'time','required')}${field('Inicio del seguimiento','trackingStart',c.trackingStart,'date','required')}</div><fieldset><legend>Días laborales</legend>${['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].map((d,i)=>`<label><input name="workDays" type="checkbox" value="${i}" ${c.workDays.includes(i)?'checked':''}>${d}</label>`).join('')}</fieldset><label>Festivos · una fecha por línea (AAAA-MM-DD)<textarea name="holidays" rows="5" placeholder="2026-12-25">${esc(c.holidays.join('\n'))}</textarea></label><p class="cm-hint">Los festivos y días no laborales no generan pendientes. La configuración se aplica a todos los responsables.</p><div class="cm-actions"><button class="cm-primary">Guardar configuración</button></div></form>`);
  $('cm-config-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);save('config',{deadline:f.get('deadline'),trackingStart:f.get('trackingStart'),workDays:f.getAll('workDays').map(Number),holidays:f.get('holidays').split(/\s+/).filter(Boolean)});};
};
$('cm-export').onclick=()=>{
  if(!state)return;
  const rows=[['Campaña','Responsable','Objetivo','Canal','Moneda','Presupuesto','Inversión COP','Resultados','Ingresos COP','Estado'],...filtered().map(c=>{const m=metrics(rowsFor(c));return [c.name,c.owner,objectives[c.objective],c.platform,c.currency,c.budget,m.spend,m.results,m.revenue,statuses[c.status]];})];
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"').join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`peluvi-campanas-${dateKey()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
for(const tab of document.querySelectorAll('[data-tab="campaigns"],[data-tab="commercial-calendar"]'))tab.addEventListener('click',refresh);
$('logout-btn').addEventListener('click',()=>{state=null;dialog.close();for(const id of ['cm-list','cm-calendar','cm-audit','cm-metrics'])$(id).replaceChildren();});
