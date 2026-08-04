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

async function fetchAdminApi(path, token, options = {}) {
  const response = await fetch(`/api/admin/${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "No se pudo cargar la información.");
  }
  return data;
}

const socialState = { items: [], filter: "all", capabilities: null };

function getSocialFormPayload() {
  const mediaUrls = document.getElementById("social-media-urls").value
    .split(/\n|,/).map((url) => url.trim()).filter(Boolean);
  const scheduledValue = document.getElementById("social-scheduled-at").value;
  return {
    platform: document.querySelector('input[name="platform"]:checked').value,
    mediaType: document.getElementById("social-media-type").value,
    caption: document.getElementById("social-caption").value,
    mediaUrls,
    scheduledAt: scheduledValue ? new Date(scheduledValue).toISOString() : null,
  };
}

function setReadiness(id, ready, readyText, missingText) {
  const row = document.getElementById(id);
  row.classList.toggle("is-ready", ready);
  row.classList.toggle("is-missing", !ready);
  row.querySelector("b").textContent = ready ? readyText : missingText;
}

async function loadSocialCapabilities(token) {
  const banner = document.getElementById("social-capability-banner");
  const capabilities = await fetchAdminApi("social-capabilities", token);
  socialState.capabilities = capabilities;
  setReadiness("ready-instagram", capabilities.canPublishInstagram, "Listo", "Falta permiso");
  setReadiness("ready-facebook", capabilities.canPublishFacebook, "Listo", "Falta permiso");
  setReadiness("ready-storage", capabilities.persistentStorage, "Persistente", "Modo temporal");
  setReadiness("ready-scheduler", capabilities.schedulerConfigured, "Protegido", "Sin cron");
  const missing = [];
  if (!capabilities.canPublishInstagram) missing.push("instagram_content_publish");
  if (!capabilities.canPublishFacebook) missing.push("pages_manage_posts");
  if (!capabilities.persistentStorage) missing.push("Upstash Redis para conservar agenda y borradores");
  if (!capabilities.mediaStorage) missing.push("Vercel Blob para subir archivos");
  if (!capabilities.schedulerConfigured) missing.push("CRON_SECRET y un cron para ejecutar la agenda");
  if (missing.length) {
    banner.classList.add("is-warning");
    banner.innerHTML = `<strong>El centro está operativo con límites</strong><span>Falta: ${escapeHtml(missing.join(" · "))}</span>`;
  } else {
    banner.classList.remove("is-warning");
    banner.innerHTML = "<strong>Peluvi Social está listo</strong><span>Publicación y agenda persistente habilitadas.</span>";
  }
  const uploadLabel = document.getElementById("social-upload-label");
  uploadLabel.classList.toggle("is-disabled", !capabilities.mediaStorage);
  document.getElementById("social-file-upload").disabled = !capabilities.mediaStorage;
}

function socialStatusLabel(status) {
  return ({ draft:"Borrador", scheduled:"Programado", processing:"Procesando", published:"Publicado", failed:"Error" })[status] || status;
}

function renderSocialContent() {
  const list = document.getElementById("social-content-list");
  const empty = document.getElementById("social-content-empty");
  const filtered = socialState.filter === "all" ? socialState.items : socialState.items.filter((item) => item.status === socialState.filter);
  empty.hidden = filtered.length > 0;
  list.innerHTML = filtered.map((item) => {
    const when = item.status === "scheduled" && item.scheduledAt
      ? `Para ${new Date(item.scheduledAt).toLocaleString("es-CO")}`
      : new Date(item.publishedAt || item.updatedAt || item.createdAt).toLocaleString("es-CO");
    const thumb = item.mediaUrls?.[0]
      ? `<img class="social-content-thumb" src="${escapeHtml(item.mediaUrls[0])}" alt="" />`
      : `<div class="social-content-thumb"></div>`;
    const canPublish = ["draft", "failed"].includes(item.status);
    return `<article class="social-content-item" data-social-id="${item.id}">
      ${thumb}<div class="social-content-copy"><strong>${escapeHtml(item.caption || "Publicación sin texto")}</strong>
      <span><em class="social-status ${item.status}">${socialStatusLabel(item.status)}</em>${escapeHtml(item.platform)} · ${escapeHtml(when)}</span>
      ${item.error ? `<span class="portal-error">${escapeHtml(item.error)}</span>` : ""}</div>
      <div class="social-item-actions">${canPublish ? `<button data-social-action="publish" type="button">Publicar</button>` : ""}<button data-social-action="delete" type="button">Eliminar</button></div>
    </article>`;
  }).join("");
}

async function loadSocialContent(token) {
  const data = await fetchAdminApi("social-content", token);
  socialState.items = data.data || [];
  renderSocialContent();
}

async function loadFacebookPosts(token) {
  const list = document.getElementById("facebook-posts-list");
  const empty = document.getElementById("facebook-posts-empty");
  try {
    const response = await fetchAdminApi("social-facebook-posts", token);
    const posts = Array.isArray(response.data) ? response.data : [];
    empty.hidden = posts.length > 0;
    list.innerHTML = posts.map((post) => {
      const picture = post.full_picture
        ? `<img src="${escapeHtml(post.full_picture)}" alt="" />`
        : `<div class="social-facebook-picture"></div>`;
      const date = post.created_time ? new Date(post.created_time).toLocaleString("es-CO") : "";
      return `<article class="social-facebook-post" data-facebook-post-id="${escapeHtml(post.id)}">
        ${picture}<div class="social-facebook-copy"><strong>${escapeHtml(post.message || "Publicación de Facebook")}</strong><span>${escapeHtml(date)}</span></div>
        <button class="social-delete-facebook" type="button">Eliminar de Facebook</button>
      </article>`;
    }).join("");
  } catch (error) {
    empty.textContent = error.message;
    empty.hidden = false;
  }
}

function updateSocialPreview() {
  const payload = getSocialFormPayload();
  const preview = document.getElementById("social-preview");
  const media = payload.mediaUrls[0];
  let html = `<div class="social-preview-empty"><span>＋</span><p>Agrega una URL pública para ver el contenido</p></div>`;
  if (media) html = payload.mediaType === "reel"
    ? `<video src="${escapeHtml(media)}" muted playsinline></video>`
    : `<img src="${escapeHtml(media)}" alt="Vista previa" />`;
  if (payload.caption) html += `<p class="social-preview-caption">${escapeHtml(payload.caption.slice(0, 180))}</p>`;
  preview.innerHTML = html;
  document.getElementById("caption-count").textContent = payload.caption.length;
}

async function createSocialContent(token, status) {
  const errorBox = document.getElementById("composer-error");
  const successBox = document.getElementById("composer-success");
  errorBox.hidden = true; successBox.hidden = true;
  try {
    const item = await fetchAdminApi("social-content", token, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-social-options": JSON.stringify({ status }) },
      body: JSON.stringify(getSocialFormPayload()),
    });
    let finalItem = item;
    if (status === "publish") {
      finalItem = await fetchAdminApi(`social-content/${item.id}/publish`, token, { method: "POST" });
      if (finalItem.status === "failed") throw new Error(finalItem.error);
    }
    successBox.textContent = status === "draft" ? "Borrador guardado." : status === "scheduled" ? "Publicación programada." : "Publicación enviada a Meta correctamente.";
    successBox.hidden = false;
    document.getElementById("composer-state").textContent = socialStatusLabel(finalItem.status);
    await loadSocialContent(token);
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
    await loadSocialContent(token).catch(() => {});
  }
}

function setupSocialControls(token) {
  const caption = document.getElementById("social-caption");
  const mediaUrls = document.getElementById("social-media-urls");
  const mediaType = document.getElementById("social-media-type");
  [caption, mediaUrls, mediaType].forEach((field) => field.addEventListener("input", updateSocialPreview));
  document.querySelectorAll('input[name="platform"]').forEach((field) => field.addEventListener("change", updateSocialPreview));
  document.getElementById("save-draft-btn").onclick = () => createSocialContent(token, "draft");
  document.getElementById("schedule-btn").onclick = () => createSocialContent(token, "scheduled");
  document.getElementById("publish-now-btn").onclick = () => createSocialContent(token, "publish");
  document.getElementById("social-file-upload").onchange = async (event) => {
    const files = [...event.target.files].slice(0, 10);
    if (!files.length) return;
    const label = document.getElementById("social-upload-label");
    const errorBox = document.getElementById("composer-error");
    label.querySelector("span").textContent = `Subiendo 0/${files.length}…`;
    errorBox.hidden = true;
    try {
      const urls = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const data = await fetchAdminApi("social-upload", token, {
          method: "POST",
          headers: { "Content-Type": file.type, "x-file-name": encodeURIComponent(file.name) },
          body: file,
        });
        urls.push(data.url);
        label.querySelector("span").textContent = `Subiendo ${index + 1}/${files.length}…`;
      }
      const field = document.getElementById("social-media-urls");
      field.value = [...field.value.split(/\n|,/).map((v) => v.trim()).filter(Boolean), ...urls].join("\n");
      if (urls.length > 1) document.getElementById("social-media-type").value = "carousel";
      updateSocialPreview();
    } catch (error) {
      errorBox.textContent = error.message; errorBox.hidden = false;
    } finally {
      label.querySelector("span").textContent = "↑ Subir desde el equipo";
      event.target.value = "";
    }
  };
  document.querySelectorAll("[data-social-filter]").forEach((button) => button.onclick = () => {
    document.querySelectorAll("[data-social-filter]").forEach((b) => b.classList.remove("is-active"));
    button.classList.add("is-active"); socialState.filter = button.dataset.socialFilter; renderSocialContent();
  });
  document.getElementById("social-content-list").onclick = async (event) => {
    const button = event.target.closest("[data-social-action]");
    const item = event.target.closest("[data-social-id]");
    if (!button || !item) return;
    button.disabled = true;
    try {
      if (button.dataset.socialAction === "publish") await fetchAdminApi(`social-content/${item.dataset.socialId}/publish`, token, { method:"POST" });
      else await fetchAdminApi(`social-content/${item.dataset.socialId}`, token, { method:"DELETE" });
      await loadSocialContent(token);
    } catch (error) { alert(error.message); button.disabled = false; }
  };
  document.getElementById("facebook-posts-list").onclick = async (event) => {
    const button = event.target.closest(".social-delete-facebook");
    const item = event.target.closest("[data-facebook-post-id]");
    if (!button || !item) return;
    if (!window.confirm("¿Eliminar esta publicación real de Facebook? Esta acción no se puede deshacer.")) return;
    button.disabled = true;
    button.textContent = "Eliminando…";
    try {
      await fetchAdminApi(`social-facebook-posts/${encodeURIComponent(item.dataset.facebookPostId)}`, token, { method: "DELETE" });
      await loadFacebookPosts(token);
    } catch (error) {
      alert(error.message);
      button.disabled = false;
      button.textContent = "Eliminar de Facebook";
    }
  };
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
    const connection = await fetchAdminApi("meta-status", token);

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

    const postsGrid = document.getElementById("ig-posts");
    const postsEmpty = document.getElementById("ig-posts-empty");
    let posts = [];
    try {
      const media = await fetchAdminApi("ig-media", token);
      posts = Array.isArray(media?.data) ? media.data : [];
    } catch (mediaError) {
      postsEmpty.textContent = `La cuenta está conectada, pero Meta no permitió leer publicaciones: ${mediaError.message}`;
      postsEmpty.hidden = false;
    }

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
    if (posts.length > 0) postsEmpty.hidden = true;
    else if (!postsEmpty.textContent.includes("Meta no permitió")) postsEmpty.hidden = false;
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
  setupSocialControls(token);
  Promise.all([loadSocialCapabilities(token), loadSocialContent(token), loadFacebookPosts(token)]).catch((error) => {
    const box = document.getElementById("composer-error"); box.textContent = error.message; box.hidden = false;
  });
}

trySession();
