export const slots = ['07:00 am','07:30 am','08:00 am','08:30 am','09:00 am','09:30 am','10:00 am','10:30 am','11:00 am','11:30 am','12:00 pm','02:00 pm','02:30 pm','03:00 pm','03:30 pm','04:00 pm','04:30 pm','05:00 pm','05:30 pm','06:00 pm','06:30 pm','07:00 pm'];
export function minutes(time) {
  const match = time.match(/^(\d{1,2})[:.](\d{2})\s*(am|pm)$/i);
  return match ? (+match[1] % 12 + (match[3].toLowerCase() === 'pm' ? 12 : 0)) * 60 + +match[2] : -1;
}
export function colombiaNow(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minute: +parts.hour * 60 + +parts.minute };
}
export function lastDate(now = new Date()) { return colombiaNow(new Date(now.getTime() + 13 * 86400000)).date; }
export function availableSlots(date, busy, now = new Date()) {
  const current = colombiaNow(now);
  if (date < current.date || date > lastDate(now)) return [];
  const occupied = new Set(busy.map(minutes));
  return slots.filter(slot => !occupied.has(minutes(slot)) && (date !== current.date || minutes(slot) >= current.minute + 30));
}
