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
    await fetchAdminApi("pixel-summary", token);
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

function metricValue(insightData, metricName) {
  const entry = insightData?.data?.find((item) => item.name === metricName);
  const values = entry?.values;
  if (!values || values.length === 0) return null;
  return values[values.length - 1].value;
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
  errorBox.hidden = true;
  try {
    const [page, ig] = await Promise.all([
      fetchAdminApi("page-insights", token),
      fetchAdminApi("ig-insights", token),
    ]);

    document.getElementById("page-fans").textContent = formatNumber(metricValue(page, "page_fans"));
    document.getElementById("page-impressions").textContent = formatNumber(metricValue(page, "page_impressions"));
    document.getElementById("page-engaged").textContent = formatNumber(metricValue(page, "page_engaged_users"));

    document.getElementById("ig-followers").textContent = formatNumber(metricValue(ig, "follower_count"));
    document.getElementById("ig-reach").textContent = formatNumber(metricValue(ig, "reach"));
    document.getElementById("ig-engaged").textContent = formatNumber(metricValue(ig, "accounts_engaged"));
  } catch (err) {
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
