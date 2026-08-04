const TOKEN_KEY = "peluvi_admin_token";

const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loginSubmit = document.getElementById("login-submit");
const logoutBtn = document.getElementById("logout-btn");
const dashboardGreeting = document.getElementById("dashboard-greeting");

function showLogin(message) {
  loginView.hidden = false;
  dashboardView.hidden = true;
  logoutBtn.hidden = true;
  if (message) {
    loginError.textContent = message;
    loginError.hidden = false;
  }
}

function showDashboard() {
  loginView.hidden = true;
  dashboardView.hidden = false;
  logoutBtn.hidden = false;
  dashboardGreeting.textContent = "Hola, administrador";
}

async function trySession() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    showLogin();
    return;
  }

  try {
    await fetchAdminApi("session", token);
    showDashboard();
    loadAllPanels(token);
  } catch (err) {
    localStorage.removeItem(TOKEN_KEY);
    showLogin();
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  loginSubmit.disabled = true;
  loginSubmit.textContent = "Ingresando...";

  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();

    if (!response.ok) {
      loginError.textContent = data.error || "Clave incorrecta.";
      loginError.hidden = false;
      return;
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    showDashboard();
    loadAllPanels(data.token);
  } catch (err) {
    loginError.textContent = "No se pudo conectar con el servidor.";
    loginError.hidden = false;
  } finally {
    loginSubmit.disabled = false;
    loginSubmit.textContent = "Ingresar";
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  showLogin();
});

document.querySelectorAll(".portal-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".portal-tab").forEach((b) => b.classList.remove("is-active"));
    document.querySelectorAll(".portal-panel").forEach((p) => (p.hidden = true));
    btn.classList.add("is-active");
    document.querySelector(`.portal-panel[data-panel="${btn.dataset.tab}"]`).hidden = false;
  });
});

async function fetchAdminApi(path, token) {
  const response = await fetch(`/api/admin/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "No se pudo cargar la información.");
  }
  return data;
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("es-CO").format(Number(value));
}

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "USD" }).format(Number(value));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadResumen(token) {
  const errorBox = document.getElementById("resumen-error");
  errorBox.hidden = true;
  try {
    const [ads, pixel] = await Promise.all([
      fetchAdminApi("ads-insights", token),
      fetchAdminApi("pixel-summary", token),
    ]);

    const campaigns = ads?.data || [];
    const totals = campaigns.reduce(
      (acc, c) => {
        acc.spend += Number(c.spend || 0);
        const leadAction = (c.actions || []).find(
          (a) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
        );
        acc.results += leadAction ? Number(leadAction.value || 0) : 0;
        return acc;
      },
      { spend: 0, results: 0 }
    );

    document.getElementById("resumen-spend").textContent = formatCurrency(totals.spend);
    document.getElementById("resumen-results").textContent = formatNumber(totals.results);
    document.getElementById("resumen-cpr").textContent =
      totals.results > 0 ? formatCurrency(totals.spend / totals.results) : "—";

    const pixelStatus = document.getElementById("pixel-status");
    if (pixel?.last_fired_time) {
      const lastFired = new Date(pixel.last_fired_time);
      pixelStatus.innerHTML = `<p><strong>Pixel "${pixel.name || "Peluvi Web"}"</strong> — último evento registrado: ${lastFired.toLocaleString("es-CO")}.</p><p class="portal-muted">Meta no permite ver conteos de visitas del pixel fuera de campañas activas. Los resultados de campañas aparecen en la pestaña "Anuncios".</p>`;
    } else {
      pixelStatus.innerHTML = `<p class="portal-muted">Aún no se ha registrado actividad del pixel, o falta configurar META_PIXEL_ID.</p>`;
    }
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
}

async function loadRedes(token) {
  const errorBox = document.getElementById("redes-error");
  const status = document.getElementById("meta-connection-status");
  errorBox.hidden = true;
  try {
    const [connection, media] = await Promise.all([
      fetchAdminApi("meta-status", token),
      fetchAdminApi("ig-media", token),
    ]);

    status.classList.add("is-connected");
    status.innerHTML = "<i></i> Meta conectado";

    document.getElementById("page-name").textContent = connection.page?.name || "Página Paluvi";
    document.getElementById("page-followers").textContent = formatNumber(connection.page?.followers_count);
    document.getElementById("page-likes").textContent = formatNumber(connection.page?.fan_count);
    if (connection.page?.picture?.data?.url) {
      document.getElementById("page-avatar").innerHTML = `<img src="${escapeHtml(connection.page.picture.data.url)}" alt="" />`;
    }

    document.getElementById("ig-username").textContent = `@${connection.instagram?.username || "peluvi.pet"}`;
    document.getElementById("ig-followers").textContent = formatNumber(connection.instagram?.followers_count);
    document.getElementById("ig-media-count").textContent = formatNumber(connection.instagram?.media_count);
    if (connection.instagram?.profile_picture_url) {
      document.getElementById("ig-avatar").innerHTML = `<img src="${escapeHtml(connection.instagram.profile_picture_url)}" alt="" />`;
    }

    const posts = Array.isArray(media?.data) ? media.data : [];
    const postsGrid = document.getElementById("ig-posts");
    const postsEmpty = document.getElementById("ig-posts-empty");
    postsGrid.innerHTML = posts
      .map((post) => {
        const image = post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url;
        const date = post.timestamp ? new Date(post.timestamp).toLocaleDateString("es-CO", { day: "numeric", month: "short" }) : "";
        return `<a class="admin-post-card" href="${escapeHtml(post.permalink || "#")}" target="_blank" rel="noreferrer">
          ${image ? `<img src="${escapeHtml(image)}" alt="Publicación de Instagram" loading="lazy" />` : ""}
          <span>${escapeHtml(date)}</span>
          <p>${escapeHtml((post.caption || "Publicación de Peluvi").slice(0, 100))}</p>
        </a>`;
      })
      .join("");
    postsEmpty.hidden = posts.length > 0;
  } catch (err) {
    status.classList.remove("is-connected");
    status.classList.add("is-error");
    status.innerHTML = "<i></i> Requiere configuración";
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
}

async function loadAnuncios(token) {
  const errorBox = document.getElementById("ads-error");
  const emptyBox = document.getElementById("ads-empty");
  const table = document.getElementById("ads-table");
  const tbody = document.getElementById("ads-tbody");
  errorBox.hidden = true;
  try {
    const ads = await fetchAdminApi("ads-insights", token);
    const campaigns = ads?.data || [];

    if (campaigns.length === 0) {
      emptyBox.hidden = false;
      table.hidden = true;
      return;
    }

    tbody.innerHTML = campaigns
      .map((c) => {
        const resultAction = (c.actions || []).find(
          (a) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
        );
        const results = resultAction ? Number(resultAction.value || 0) : 0;
        const spend = Number(c.spend || 0);
        const cpr = results > 0 ? formatCurrency(spend / results) : "—";
        return `<tr>
          <td>${c.campaign_name || "—"}</td>
          <td>${formatCurrency(spend)}</td>
          <td>${formatNumber(c.reach)}</td>
          <td>${formatNumber(results)}</td>
          <td>${cpr}</td>
        </tr>`;
      })
      .join("");

    emptyBox.hidden = true;
    table.hidden = false;
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
}

function loadAllPanels(token) {
  loadResumen(token);
  loadRedes(token);
  loadAnuncios(token);
}

trySession();
