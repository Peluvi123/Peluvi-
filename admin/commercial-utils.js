export const objectives = { registrations:'Registros de usuarios', providers:'Registro de negocios', appointments:'Citas', sales:'Ventas', messages:'Mensajes' };
export const statuses = { active:'Activa', paused:'Pausada', completed:'Finalizada', archived:'Archivada' };
export const dateKey = () => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function metrics(rows) {
  const totals = rows.reduce((a,d) => ({spend:a.spend+d.spend*d.rate, revenue:a.revenue+d.revenue, results:a.results+d.results, messages:a.messages+d.messages}),{spend:0,revenue:0,results:0,messages:0});
  return {...totals, cpr:totals.results ? totals.spend/totals.results : null, roas:totals.spend ? totals.revenue/totals.spend : null};
}
export function calendarStatus(state, owner, day, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const time = new Intl.DateTimeFormat('en-GB',{timeZone:'America/Bogota',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
  const config = state.config;
  const campaigns = state.campaigns.filter(c=>c.owner === owner && c.start <= day && (!c.end || c.end >= day));
  const ids = new Set(campaigns.map(c=>c.id));
  const rows = state.days.filter(d=>ids.has(d.campaignId) && d.date === day);
  const close = state.closes.find(c=>c.owner === owner && c.date === day);
  if (close) return {status:'closed',label:'Cerrado',late:Date.parse(close.closedAt) > Date.parse(`${day}T${config.deadline}:00-05:00`),rows};
  if (day < config.trackingStart || !campaigns.length) return {status:'off',label:'Sin seguimiento',rows};
  if (config.holidays.includes(day) || !config.workDays.includes(new Date(day+'T12:00:00Z').getUTCDay())) return {status:'off',label:'No laborable',rows};
  if (day > today) return {status:'future',label:'Próximo',rows};
  if (day === today && time < config.deadline) return {status:rows.length ? 'partial' : 'pending',label:rows.length ? 'En progreso' : 'Pendiente',rows};
  return {status:'overdue',label:'Sin cierre',rows};
}
