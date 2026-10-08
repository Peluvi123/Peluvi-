import config from './config.js';
import { fetchCategory } from './catalog.js';
import { availableSlots, colombiaNow, lastDate, minutes } from './booking-utils.js';
const $ = selector => document.querySelector(selector);
const form = $('#booking-form'), petForm = $('#pet-form');
const field = name => form.elements.namedItem(name);
const message = text => { $('#message').textContent = text; };
const node = (tag, text) => { const el = document.createElement(tag); el.textContent = text; return el; };
const params = new URLSearchParams(location.search);
const category = params.get('categoria') === 'grooming' ? 'grooming' : 'vet';
const providerId = params.get('proveedor');
let appointmentFilter = 'all';
let client, user, provider, pets = [], profile, draft, requestId, availabilityVersion = 0, accountVersion = 0;
const statuses = { pending: 'Pendiente de confirmación', confirmed: 'Confirmada', in_progress: 'En curso', completed: 'Completada', cancelled: 'Cancelada' };
function checked(result) { if (result.error) throw result.error; return result.data; }
function options(select, items, placeholder) {
  select.replaceChildren(new Option(placeholder, ''));
  items.forEach(([value, label]) => select.add(new Option(label, value)));
}
async function loadPets() {
  const owner = user.id;
  const rows = checked(await client.from('user_pets').select('id,name,species,breed,image_url').eq('user_id', owner).order('created_at'));
  if (user?.id !== owner) return;
  pets = rows;
  $('#pet-count').textContent = String(pets.length);
  options(field('pet'), pets.map(p => [p.id, `${p.name}${p.breed ? ` · ${p.breed}` : ''}`]), pets.length ? 'Selecciona tu mascota' : 'Primero agrega una mascota');
  $('#pets-list').replaceChildren(...pets.map(p => { const el = node('div', ''); el.className = 'pet-item'; const avatar = node('span','🐾'); avatar.className = 'pet-avatar'; if (p.image_url?.startsWith('https://')) { const image = document.createElement('img'); image.src = p.image_url; image.alt = p.name; image.addEventListener('error',()=>image.remove()); avatar.append(image); } const copy = node('div',''); copy.append(node('strong',p.name),node('small',[p.species, p.breed].filter(Boolean).join(' · ') || 'Mascota')); el.append(avatar,copy); return el; }));
}
async function busySlots(date) {
  const data = checked(await client.rpc('provider_busy_slots', { p_provider: provider.id, p_date: date }));
  if (!Array.isArray(data)) throw new Error('No se pudo consultar la disponibilidad.');
  return data;
}
async function loadTimes() {
  const version = ++availabilityVersion;
  const date = field('date').value;
  field('time').disabled = true; options(field('time'), [], 'Consultando horarios…');
  $('#slots-message').textContent = '';
  if (!date) { options(field('time'), [], 'Elige una fecha'); return; }
  try {
    const busy = await busySlots(date);
    if (version !== availabilityVersion) return;
    const free = availableSlots(date, busy);
    options(field('time'), free.map(t => [t,t]), free.length ? 'Selecciona una hora' : 'No hay horarios disponibles');
    field('time').disabled = !free.length;
    $('#slots-message').textContent = free.length ? 'Horarios solicitables; sujetos a confirmación del negocio.' : 'Elige otra fecha.';
  } catch {
    if (version !== availabilityVersion) return;
    options(field('time'), [], 'No se pudo consultar');
    $('#slots-message').textContent = 'No pudimos consultar los horarios. Cambia la fecha para volver a intentar.';
  }
}
async function loadAppointments() {
  const owner = user.id;
  const rows = checked(await client.from('appointments').select('id,vet_id,vet_name,pet_name,service,date,time,status,proposed_date,proposed_time,reschedule_status').eq('user_id', owner).order('date', { ascending: false }));
  if (user?.id !== owner) return;
  $('#appointments-list').replaceChildren();
  if (!rows.length) $('#appointments-list').append(node('p', 'Aún no tienes citas. Encuentra un servicio en el directorio para empezar.'));
  const current = colombiaNow();
  const upcoming = a => (a.date > current.date || (a.date === current.date && minutes(a.time || '') >= current.minute)) && ['pending','confirmed','in_progress'].includes(a.status);
  $('#upcoming-count').textContent = String(rows.filter(upcoming).length);
  $('#pending-count').textContent = String(rows.filter(a=>a.status === 'pending').length);
  rows.sort((a,b)=>Number(upcoming(b))-Number(upcoming(a)) || (upcoming(a) ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  rows.forEach(appointment => {
    const row = node('article',''); row.className = 'appointment-row'; row.dataset.group = upcoming(appointment) ? 'upcoming' : 'past';
    const state = node('span', statuses[appointment.status] || appointment.status); state.className = 'appointment-state'; state.dataset.status = appointment.status;
    const date = new Date(`${appointment.date}T12:00:00-05:00`);
    const dateTile = node('div',''); dateTile.className = 'appointment-date';
    dateTile.append(node('span', Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-CO',{month:'short',timeZone:'America/Bogota'}).replace('.','')),node('strong',Number.isNaN(date.getTime()) ? '—' : String(date.getUTCDate())));
    const copy = node('div',''); copy.className = 'appointment-copy';
    const petLabel = node('span', appointment.pet_name || 'Tu mascota'); petLabel.className = 'appointment-pet';
    copy.append(petLabel, node('h3', appointment.service || 'Consulta'), node('p', appointment.vet_name || 'Negocio'), node('small', `${appointment.time} · Colombia`),state);
    row.append(dateTile,copy);
    if (appointment.reschedule_status === 'pending') row.append(node('p', `Hay una propuesta de cambio para ${appointment.proposed_date} a las ${appointment.proposed_time}. Revísala y respóndela desde la app.`));
    if (['pending', 'confirmed'].includes(appointment.status)) {
      const cancel = node('button','Cancelar cita'); cancel.type = 'button';
      cancel.addEventListener('click', () => {
        cancel.hidden = true;
        const question = node('p','¿Quieres cancelar esta cita?');
        const yes = node('button','Sí, cancelar'); yes.type = 'button';
        const no = node('button','Conservar cita'); no.type = 'button';
        row.append(question,yes,no);
        no.addEventListener('click',()=>{ question.remove(); yes.remove(); no.remove(); cancel.hidden = false; });
        yes.addEventListener('click',async()=>{
          yes.disabled = true; no.disabled = true;
          try {
            const updated = checked(await client.from('appointments').update({status:'cancelled'}).eq('id',appointment.id).eq('user_id',user.id).in('status',['pending','confirmed']).select('id'));
            if (!updated.length) throw new Error('El estado cambió. Actualiza tus citas.');
            await client.from('notifications').insert({user_id:appointment.vet_id,type:'general',title:'Cita cancelada',body:`El cliente canceló la cita de ${appointment.pet_name}.`,appointment_id:appointment.id});
            message('Cita cancelada.'); await loadAppointments();
          } catch { message('No pudimos confirmar la cancelación. Actualiza tus citas antes de volver a intentar.'); yes.disabled = false; no.disabled = false; }
        });
      });
      row.append(node('p',''),cancel);
    }
    $('#appointments-list').append(row);
  });
  applyFilter();
}
function applyFilter() {
  const rows = [...document.querySelectorAll('.appointment-row')];
  rows.forEach(row=>row.hidden = appointmentFilter !== 'all' && row.dataset.group !== appointmentFilter);
  $('#filter-empty').hidden = appointmentFilter === 'all' || rows.some(row=>!row.hidden);
  document.querySelectorAll('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter === appointmentFilter)));
}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{appointmentFilter=button.dataset.filter;applyFilter();}));
async function showAccount() {
  const version = ++accountVersion;
  $('#auth').hidden = !!user; $('#logout').hidden = !user;
  $('#booking').hidden = true; $('#appointments').hidden = true;
  $('#client-home').hidden = true; document.body.classList.remove('client-dashboard');
  if (!user) return;
  message('Cargando tu cuenta…');
  try {
    profile = checked(await client.from('profiles').select('name,phone').eq('id',user.id).maybeSingle());
    if (version !== accountVersion) return;
    if (!providerId) {
      document.body.classList.add('client-dashboard');
      $('#dashboard-date').textContent = new Intl.DateTimeFormat('es-CO', {weekday:'long', day:'numeric', month:'long', timeZone:'America/Bogota'}).format(new Date());
      $('#client-greeting').textContent = profile?.name ? `Hola, ${profile.name.split(' ')[0]}.` : 'Qué bueno tenerte aquí.';
      $('#client-agenda').append($('#appointments'));
      $('#client-pets').append(document.querySelector('.pets-box'));
      await loadPets();
      if (version !== accountVersion) return;
      $('#client-home').hidden = false;
    }
    if (providerId) {
      const providers = await fetchCategory(category, AbortSignal.timeout(20000));
      if (version !== accountVersion) return;
      provider = providers.find(p=>p.id === providerId);
      if (!provider) throw new Error('Este proveedor ya no está disponible. Vuelve al directorio.');
      $('#page-title').textContent = 'Su próxima cita empieza aquí.';
      $('#provider-name').textContent = provider.name;
      $('#provider-location').textContent = provider.location;
      options(field('service'), provider.services.map(service=>[service,service]), 'Selecciona un servicio');
      $('#review-button').disabled = !provider.services.length;
      await loadPets();
      if (version !== accountVersion) return;
      field('date').min = colombiaNow().date; field('date').max = lastDate();
      $('#booking').hidden = false;
    }
    await loadAppointments();
    if (version !== accountVersion) return;
    $('#appointments').hidden = false; message(provider && !provider.services.length ? 'El negocio aún no publicó servicios para agendar. Puedes contactarlo desde el directorio.' : '');
  } catch (error) { message(error.message || 'No pudimos cargar tu cuenta. Recarga la página para intentar de nuevo.'); }
}
$('#login').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.currentTarget.querySelector('button'); button.disabled = true;
  message('Iniciando sesión…');
  try {
    const data = checked(await client.auth.signInWithPassword({email:$('#login').elements.email.value.trim(),password:$('#login').elements.password.value}));
    $('#login').elements.password.value = ''; user = data.user; await showAccount();
  } catch { message('No pudimos iniciar sesión. Revisa tu correo, contraseña y conexión.'); }
  finally { button.disabled = false; }
});
$('#logout').addEventListener('click', async()=>{
  $('#logout').disabled = true;
  try { checked(await client.auth.signOut({scope:'local'})); location.reload(); }
  catch { message('No se pudo cerrar sesión. Intenta de nuevo.'); $('#logout').disabled = false; }
});
field('date').addEventListener('change', loadTimes);
petForm.addEventListener('submit', async event=>{
  event.preventDefault(); const button = petForm.querySelector('button'); button.disabled = true;
  try {
    const name = petForm.elements.name.value.trim();
    if (!name) throw new Error('Escribe el nombre de tu mascota.');
    const saved = checked(await client.from('user_pets').insert({user_id:user.id,name,species:petForm.elements.species.value,breed:petForm.elements.breed.value.trim()}).select('id').single());
    await loadPets(); field('pet').value = saved.id; petForm.reset(); message('Mascota guardada en tu cuenta de Peluvi.');
  } catch { message('No pudimos confirmar el registro. Actualiza la página antes de volver a guardar.'); }
  finally { button.disabled = false; }
});
form.addEventListener('submit', async event=>{
  event.preventDefault();
  const pet = pets.find(p=>p.id === field('pet').value);
  if (!pet || !provider.services.includes(field('service').value) || !availableSlots(field('date').value,[]).includes(field('time').value)) { message('Revisa la mascota, el servicio y un horario futuro.'); return; }
  draft = {user_id:user.id,vet_id:provider.id,vet_name:provider.name,vet_address:provider.location,vet_image:provider.image || '',pet_id:pet.id,pet_name:pet.name,pet_image:pet.image_url || '',pet_breed:pet.breed || '',owner_name:profile?.name || null,owner_phone:profile?.phone || null,service:field('service').value,date:field('date').value,time:field('time').value,notes:field('notes').value.trim(),status:'pending'};
  requestId = crypto.randomUUID();
  $('#summary-list').replaceChildren();
  for (const [label,value] of [['Negocio',draft.vet_name],['Mascota',draft.pet_name],['Servicio',draft.service],['Fecha',draft.date],['Hora',`${draft.time} · Colombia`],['Notas',draft.notes || 'Sin notas']]) $('#summary-list').append(node('dt',label),node('dd',value));
  form.hidden = true; $('#summary').hidden = false; $('#confirm-booking').focus(); message('');
});
$('#edit-booking').addEventListener('click',()=>{ $('#summary').hidden = true; form.hidden = false; draft = null; });
$('#confirm-booking').addEventListener('click', async()=>{
  if (!draft) return;
  const button = $('#confirm-booking'); button.disabled = true; $('#edit-booking').disabled = true;
  try {
    const auth = checked(await client.auth.getUser());
    if (auth.user?.id !== draft.user_id) throw new Error('Tu sesión cambió. Recarga la página e inicia sesión.');
    // Reuse the UUID when retrying an uncertain response, so one request cannot create two appointments.
    let saved = checked(await client.from('appointments').select('id').eq('id',requestId).eq('user_id',user.id).maybeSingle());
    if (!saved) {
      const busy = await busySlots(draft.date);
      if (!availableSlots(draft.date,busy).includes(draft.time)) throw new Error('Ese horario ya no está disponible. Edita la solicitud y elige otra hora.');
      saved = checked(await client.from('appointments').insert({id:requestId,...draft}).select('id').single());
      const notification = await client.from('notifications').insert({user_id:provider.id,type:'general',title:'Nueva solicitud de cita',body:`${profile?.name || 'Un cliente'} solicitó ${draft.service} para ${draft.pet_name} el ${draft.date} a las ${draft.time}.`,appointment_id:saved.id});
      if (notification.error) console.warn('La cita se guardó; no se pudo enviar la notificación al proveedor.');
    }
    $('#summary').hidden = true; form.hidden = false; form.reset(); options(field('time'),[],'Elige una fecha'); field('time').disabled = true; draft = null;
    message('Solicitud guardada. Queda pendiente de confirmación del negocio y ya puedes verla en Mis citas y en la app.');
    await loadAppointments(); $('#appointments').scrollIntoView({behavior:'smooth'});
  } catch (error) { message(error.message || 'No pudimos confirmar el envío. Puedes volver a intentar sin duplicar esta solicitud.'); }
  finally { button.disabled = false; $('#edit-booking').disabled = false; }
});
$('#refresh').addEventListener('click',async()=>{ $('#refresh').disabled = true; try { await loadAppointments(); } catch { message('No se pudieron actualizar tus citas.'); } finally { $('#refresh').disabled = false; } });
try {
  const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2');
  client = createClient(config.url,config.key,{auth:{storageKey:'peluvi-web-client'}});
  const session = checked(await client.auth.getSession()); user = session.session?.user || null;
  client.auth.onAuthStateChange((event,session)=>{
    if (event === 'SIGNED_OUT' || (user && session?.user && session.user.id !== user.id)) {
      user = null; accountVersion++; availabilityVersion++; pets = []; draft = null;
      $('#appointments-list').replaceChildren(); $('#pets-list').replaceChildren();
      $('#client-home').hidden = true; document.body.classList.remove('client-dashboard');
      $('#booking').hidden = true; $('#appointments').hidden = true; $('#logout').hidden = true; $('#auth').hidden = false;
      message('Inicia sesión para continuar.');
    }
  });
  await showAccount();
} catch { message('No pudimos conectar con Peluvi. Revisa tu conexión y recarga esta página.'); }

const passwordToggle = document.querySelector('#toggle-password');
passwordToggle.addEventListener('click', () => {
  const input = document.querySelector('#login-password');
  const visible = input.type === 'password';
  input.type = visible ? 'text' : 'password';
  passwordToggle.setAttribute('aria-pressed', String(visible));
  passwordToggle.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
  passwordToggle.querySelector('.eye-slash').toggleAttribute('hidden', !visible);
});
