import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://jljeromqlkokpmwyypqo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsamVyb21xbGtva3Btd3l5cHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjQwMDUsImV4cCI6MjA5ODQwMDAwNX0.DNvuqC273a2ZOLDXTO0BlErLujS5WUwl98UJrp6trg0"
);

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

function showDashboard(profile) {
  loginView.hidden = true;
  dashboardView.hidden = false;
  logoutBtn.hidden = false;
  dashboardGreeting.textContent = `Hola, ${profile.business_name || profile.name || "administrador"}`;
}

async function requireAdminSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    showLogin();
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    await supabase.auth.signOut();
    showLogin("Esta cuenta no tiene permisos de administrador.");
    return null;
  }

  showDashboard(profile);
  loadAllPanels(session.access_token);
  return { session, profile };
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  loginSubmit.disabled = true;
  loginSubmit.textContent = "Ingresando...";

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  loginSubmit.disabled = false;
  loginSubmit.textContent = "Ingresar";

  if (error) {
    loginError.textContent = "Correo o contraseña incorrectos.";
    loginError.hidden = false;
    return;
  }

  await requireAdminSession();
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
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

async function fetchAdminApi(path, accessToken) {
  const response = await fetch(`/api/admin/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
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

async function loadResumen(accessToken) {
  const errorBox = document.getElementById("resumen-error");
  errorBox.hidden = true;
  try {
    const [ads, pixel] = await Promise.all([
      fetchAdminApi("ads-insights", accessToken),
      fetchAdminApi("pixel-summary", accessToken),
    ]);

    const campaigns = ads?.data || [];
    const totals = campaigns.reduce(
      (acc, c) => {
        acc.spend += Number(c.spend || 0);
        const leadAction = (c.actions || []).find((a) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped");
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

async function loadRedes(accessToken) {
  const errorBox = document.getElementById("redes-error");
  errorBox.hidden = true;
  try {
    const [page, ig] = await Promise.all([
      fetchAdminApi("page-insights", accessToken),
      fetchAdminApi("ig-insights", accessToken),
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

async function loadAnuncios(accessToken) {
  const errorBox = document.getElementById("ads-error");
  const emptyBox = document.getElementById("ads-empty");
  const table = document.getElementById("ads-table");
  const tbody = document.getElementById("ads-tbody");
  errorBox.hidden = true;
  try {
    const ads = await fetchAdminApi("ads-insights", accessToken);
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

function loadAllPanels(accessToken) {
  loadResumen(accessToken);
  loadRedes(accessToken);
  loadAnuncios(accessToken);
}

supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") showLogin();
});

(async function init() {
  await requireAdminSession();
})();
