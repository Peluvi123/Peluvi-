import config from './app-config.js';
const status = document.getElementById('status');
const form = document.getElementById('reset');
const params = new URLSearchParams(location.hash.slice(1));
let token = params.get('access_token');
const recovery = params.get('type') === 'recovery';
history.replaceState(null, '', location.pathname);
if (params.has('error') || !token || !recovery) {
  token = null;
  status.textContent = 'Este enlace no es válido o ya venció. Solicita un correo nuevo y abre únicamente el enlace más reciente.';
} else {
  status.textContent = 'Escribe tu nueva contraseña de Peluvi (mínimo 8 caracteres).';
  form.hidden = false;
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  const password = document.getElementById('password').value;
  if (password !== document.getElementById('confirm').value) { status.textContent = 'Las contraseñas no coinciden.'; return; }
  const button = form.querySelector('button'); button.disabled = true;
  try {
    const response = await fetch(`${config.url}/auth/v1/user`, {method:'PUT', headers:{apikey:config.key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({password})});
    const data = await response.json();
    if (!response.ok) {
      status.textContent = response.status === 401 || response.status === 403 ? 'El enlace venció. Solicita uno nuevo.' : data.code === 'same_password' ? 'Elige una contraseña diferente de la anterior.' : 'No se pudo guardar. Prueba una contraseña más larga con letras y números.';
      return;
    }
    token = null; form.reset(); form.hidden = true;
    status.textContent = 'Contraseña actualizada. Ya puedes entrar al administrador y conectar la app con redes@peluvi.com y tu nueva contraseña.';
  } catch { status.textContent = 'No se pudo conectar. Revisa tu conexión y vuelve a intentarlo.'; }
  finally { button.disabled = false; }
});
