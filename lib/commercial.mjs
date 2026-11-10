import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function freshState() { return { revision: 0, campaigns: [], days: [], closes: [], events: [], config: { deadline: '20:00', trackingStart: today(), workDays: [1,2,3,4,5,6], holidays: [] } }; }
function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
function text(value, max = 200) { if (typeof value !== 'string' || !value.trim() || value.length > max) fail('Revisa los campos de texto.'); return value.trim(); }
function date(value) { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) fail('Fecha inválida.'); return value; }
function amount(value, integer = false) { if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1e12 || (integer && !Number.isSafeInteger(value))) fail('Los valores deben ser números positivos o cero.'); return value; }
function choice(value, choices) { if (!choices.includes(value)) fail('Opción inválida.'); return value; }
export function mutate(state, input, actor = 'Administrador') {
  if (!input || typeof input !== 'object') fail('Solicitud inválida.');
  if (input.revision !== state.revision) fail('Otra sesión actualizó los datos. Actualiza antes de guardar.', 409);
  const s = structuredClone(state), b = input.data || {};
  let target = '', detail = '';
  if (input.action === 'campaign') {
    const old = b.id ? s.campaigns.find(c => c.id === b.id) : null;
    if (b.id && !old) fail('Campaña no encontrada.', 404);
    const c = { id: old?.id || randomUUID(), name: text(b.name), owner: text(b.owner,100), objective: choice(b.objective,['registrations','providers','appointments','sales','messages']), platform: choice(b.platform,['Meta Ads','Google Ads','TikTok','Orgánico','Otro']), currency: choice(b.currency,['COP','USD']), budget: amount(b.budget), target: amount(b.target), status: choice(b.status,['active','paused','completed','archived']), start: date(b.start), end: b.end ? date(b.end) : '', notes: typeof b.notes === 'string' ? b.notes.slice(0,2000) : '', createdAt: old?.createdAt || new Date().toISOString() };
    if (c.end && c.end < c.start) fail('La fecha final debe ser posterior al inicio.');
    if (old && old.currency !== c.currency && s.days.some(d => d.campaignId === old.id)) fail('No puedes cambiar la moneda después de registrar resultados.');
    if (s.days.some(d => d.campaignId === c.id && (d.date < c.start || (c.end && d.date > c.end)))) fail('Las fechas deben incluir los resultados ya registrados.');
    if (old) s.campaigns[s.campaigns.indexOf(old)] = c; else s.campaigns.push(c);
    target = c.id; detail = old ? 'Campaña actualizada' : 'Campaña creada';
  } else if (input.action === 'day') {
    const c = s.campaigns.find(c => c.id === b.campaignId);
    if (!c) fail('Campaña no encontrada.',404);
    if (c.status === 'archived') fail('Reactiva la campaña antes de registrar resultados.');
    const day = date(b.date);
    if (day > today() || day < c.start || (c.end && day > c.end)) fail('El día debe estar dentro de la campaña y no puede ser futuro.');
    const rate = c.currency === 'COP' ? 1 : amount(b.rate);
    if (!rate) fail('Ingresa la tasa COP por USD del día.');
    const row = { campaignId: c.id, date: day, spend: amount(b.spend), rate, messages: amount(b.messages,true), results: amount(b.results,true), revenue: amount(b.revenue), updatedAt: new Date().toISOString(), actor };
    const index = s.days.findIndex(d => d.campaignId === c.id && d.date === day);
    if (index < 0) s.days.push(row); else s.days[index] = row;
    // A changed report must be reviewed and closed again.
    s.closes = s.closes.filter(d => !(d.date === day && d.owner === c.owner));
    target = c.id; detail = `Resultados del ${day}`;
  } else if (input.action === 'close') {
    const day = date(b.date), owner = text(b.owner,100);
    if (day > today() || day < s.config.trackingStart) fail('Solo puedes cerrar días dentro del seguimiento y hasta hoy.');
    if (!s.campaigns.some(c => c.owner === owner)) fail('Responsable no encontrado.');
    const existing = s.closes.find(c => c.owner === owner && c.date === day);
    if (existing) fail('Este día ya está cerrado.');
    s.closes.push({ owner, date: day, closedAt: new Date().toISOString(), actor });
    target = owner; detail = `Cierre del ${day}`;
  } else if (input.action === 'config') {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.deadline)) fail('Hora límite inválida.');
    if (!Array.isArray(b.workDays) || !b.workDays.length || b.workDays.some(n => !Number.isInteger(n) || n < 0 || n > 6)) fail('Selecciona días laborales.');
    if (!Array.isArray(b.holidays) || b.holidays.length > 366) fail('Lista de festivos inválida.');
    s.config = { deadline: b.deadline, trackingStart: date(b.trackingStart), workDays: [...new Set(b.workDays)], holidays: [...new Set(b.holidays.map(date))] };
    target = 'config'; detail = 'Configuración actualizada';
  } else fail('Acción no reconocida.');
  s.revision++;
  s.events.push({ id: randomUUID(), action: input.action, target, detail, actor, at: new Date().toISOString() });
  return s;
}

let queue = Promise.resolve();
export function createCommercialStore({ file = join(process.cwd(), '.data/commercial.json'), config = null, production = false } = {}) {
  async function db(path, options = {}) {
    const response = await fetch(`${config.url}/rest/v1/${path}`, { ...options, headers: { apikey: config.key, ...(config.key.startsWith('eyJ') ? { Authorization: `Bearer ${config.key}` } : {}), 'Content-Type': 'application/json', ...options.headers }, signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    if (!response.ok) fail('No se pudo acceder al módulo comercial en Supabase. Revisa la migración y la configuración.',503);
    return data;
  }
  async function read() {
    if (config) {
      const rows = await db('commercial_workspace?id=eq.main&select=state');
      if (!rows.length) fail('Falta inicializar el módulo comercial en Supabase.',503);
      return rows[0].state;
    }
    if (production) fail('Configura Supabase para guardar campañas en producción.',503);
    try { return JSON.parse(await readFile(file,'utf8')); }
    catch (e) { if (e.code === 'ENOENT') return freshState(); throw e; }
  }
  async function update(input, actor) {
    const operation = queue.then(async () => {
      const state = await read(), next = mutate(state, input, actor);
      if (config) {
        const saved = await db('rpc/save_commercial_workspace', { method:'POST', body:JSON.stringify({ expected_revision: state.revision, next_state: next }) });
        if (!saved) fail('Otra sesión actualizó los datos. Actualiza antes de guardar.',409);
      } else {
        await mkdir(dirname(file),{recursive:true,mode:0o700});
        const temp = `${file}.${randomUUID()}.tmp`;
        await writeFile(temp,JSON.stringify(next),{mode:0o600}); await rename(temp,file);
      }
      return next;
    });
    queue = operation.catch(() => {}); return operation;
  }
  return { read, update, storage: config ? 'supabase' : 'local' };
}
