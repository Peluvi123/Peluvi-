import config from '/directorio/config.js';
export const el = (tag, text, className) => { const node = document.createElement(tag); if (text != null) node.textContent = text; if (className) node.className = className; return node; };
export function safeUrl(value) { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } }
export function picture(url, alt, className = '') { const node = el('img', null, className); node.src = safeUrl(url); node.alt = alt; node.loading = 'lazy'; node.addEventListener('error', () => node.remove(), { once: true }); return node; }
export function link(text, url, className = 'action secondary') { const node = el('a', text, className); node.href = url; return node; }
export function external(text, url) { const node = link(text, safeUrl(url)); node.target = '_blank'; node.rel = 'noopener noreferrer'; return node; }
export async function rpc(name, body, signal) {
  const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, { method: 'POST', headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: signal || AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('No pudimos cargar la información. Intenta de nuevo.');
  return response.json();
}
export const checked = result => { if (result.error) throw result.error; return result.data; };
export const date = iso => new Date(iso).toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'numeric' });
