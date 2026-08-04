import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const root = process.cwd();
const port = Number(process.env.PORT || 8000);

loadLocalEnv();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".svg": "image/svg+xml",
};

const peluviContext = `
Peluvi es una app movil premium para duenos de mascotas, construida con React Native, Expo 51 y TypeScript.
Funcionalidades:
- Adopcion estilo Tinder: tarjetas deslizables con fotos de mascotas disponibles como perros, gatos, conejos y aves. El usuario puede dar like, pasar, deshacer y ver detalles con historia, salud, personalidad y fundacion responsable. Desde el detalle puede contactar por WhatsApp o enviar solicitud de adopcion.
- Explorar servicios: directorio de veterinarias, peluquerias caninas, cuidadores y fundaciones. Incluye vista de lista y detalle con calificaciones, horarios, precios y opcion de agendar cita.
- SOS: boton de emergencia para mascotas perdidas o situaciones urgentes.
- Tienda de alimentos: catalogo de productos con carrito de compras.
- Favoritos: guardado de mascotas y servicios favoritos.
- Perfil: gestion de cuenta.
- Autenticacion: email/contrasena, Google, Apple y modo invitado.
- Roles: Cliente, como dueno de mascota, y Proveedor, como veterinaria, peluqueria, fundacion, tienda o cuidador, con dashboards propios.
`;

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);

    if (request.method === "POST" && url.pathname === "/api/chat") {
      await handleChat(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/admin/login") {
      await handleAdminLogin(request, response);
      return;
    }

    if (url.pathname === "/api/cron/social-publisher") {
      await handleSocialCron(request, response);
      return;
    }

    if (url.pathname.startsWith("/api/admin/social")) {
      await handleSocialApi(url, request, response);
      return;
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/admin/")) {
      await handleAdminApi(url.pathname, request, response);
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "Método no permitido" });
      return;
    }

    await serveStatic(url.pathname, response, request);
  } catch (error) {
    sendJson(response, 500, { error: "Error interno del servidor" });
  }
});

server.listen(port, () => {
  console.log(`Peluvi web en http://localhost:${port}`);
});

async function handleChat(request, response) {
  const body = await readBody(request);
  const payload = JSON.parse(body || "{}");
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const cleanMessages = messages
    .filter((message) => ["user", "assistant"].includes(message.role) && typeof message.content === "string")
    .slice(-10);
  const fallbackReply = buildPeluviFallback(cleanMessages);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    sendJson(response, 200, { reply: fallbackReply, mode: "local" });
    return;
  }

  const instructions = `
Eres Peluvi IA, un asistente amable, breve y premium para la landing de Peluvi.
Responde en espanol claro. Ayuda a usuarios a entender la app, adopciones, servicios, SOS, tienda, favoritos, perfiles y roles.
No inventes disponibilidad real ni precios reales; si el usuario quiere una accion concreta, orientalo dentro de la app.

${peluviContext}
`;

  try {
    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions,
        input: cleanMessages,
        temperature: 0.6,
        max_output_tokens: 420,
      }),
    });

    const data = await openaiResponse.json();
    if (!openaiResponse.ok) {
      sendJson(response, 200, { reply: fallbackReply, mode: "local" });
      return;
    }

    sendJson(response, 200, {
      reply: extractText(data) || fallbackReply,
      mode: extractText(data) ? "ai" : "local",
    });
  } catch {
    sendJson(response, 200, { reply: fallbackReply, mode: "local" });
  }
}

function buildPeluviFallback(messages) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const text = lastUserMessage
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (/(adop|fundacion|hogar)/.test(text)) {
    return "En Adopción puedes conocer mascotas que buscan hogar, revisar su información y contactar a la fundación responsable. Abre la categoría Adopción desde Inicio.";
  }
  if (/(veter|vacun|clinica|salud|urgencia)/.test(text)) {
    return "Peluvi reúne veterinarias, servicios, especialistas, horarios y opciones para agendar. En una urgencia real, contacta inmediatamente una clínica veterinaria cercana.";
  }
  if (/(peluquer|groom|bano|corte|unas|spa)/.test(text)) {
    return "En Peluquerías puedes consultar baños, cortes, spa, cuidado de uñas y groomers. Abre esa categoría para ver todas sus funciones.";
  }
  if (/(tienda|comida|alimento|producto|juguete)/.test(text)) {
    return "En Tiendas puedes explorar alimentos, juguetes y accesorios, consultar novedades y contactar directamente a negocios aliados.";
  }
  if (/(cuidad|paseo|guarderia|estancia)/.test(text)) {
    return "En Cuidadores encontrarás opciones de paseos, visitas a domicilio, guardería y seguimiento durante el servicio.";
  }
  if (/(sos|perdid|alerta|report)/.test(text)) {
    return "SOS permite reportar una mascota perdida, indicar su última ubicación y activar ayuda comunitaria. Abre SOS desde Inicio para conocer el proceso.";
  }
  if (/(negocio|proveedor|registr|portal)/.test(text)) {
    return "Si tienes un negocio para mascotas, entra en Para negocios para conocer los beneficios y registrarte en el portal de proveedores.";
  }

  return "Peluvi reúne adopciones, veterinarias, peluquerías, tiendas, cuidadores y alertas SOS. Dime qué necesita tu mascota y te indicaré dónde encontrarlo.";
}

async function serveStatic(pathname, response, request) {
  const safePath = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, safePath === "/" ? "index.html" : safePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (!pathname.endsWith("/") && existsSync(filePath) && statSync(filePath).isDirectory()) {
    response.writeHead(301, { Location: `${pathname}/` });
    response.end();
    return;
  }

  let resolvedPath = filePath;
  if (existsSync(resolvedPath) && statSync(resolvedPath).isDirectory()) {
    resolvedPath = join(resolvedPath, "index.html");
  }
  const finalPath = existsSync(resolvedPath) ? resolvedPath : join(root, "index.html");
  const ext = extname(finalPath);
  const contentType = mimeTypes[ext] || "application/octet-stream";

  if (ext === ".mp4") {
    streamVideo(finalPath, response, request, contentType);
    return;
  }

  response.writeHead(200, { "Content-Type": contentType });
  if (request.method !== "HEAD") {
    response.end(await readFile(finalPath));
  } else {
    response.end();
  }
}

function streamVideo(filePath, response, request, contentType) {
  const fileSize = statSync(filePath).size;
  const range = request.headers.range;

  if (!range) {
    response.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": fileSize,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache",
    });
    if (request.method !== "HEAD") {
      createReadStream(filePath).pipe(response);
    } else {
      response.end();
    }
    return;
  }

  const [startText, endText] = range.replace(/bytes=/, "").split("-");
  const start = Number.parseInt(startText, 10);
  const end = endText ? Number.parseInt(endText, 10) : fileSize - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start >= fileSize || end >= fileSize) {
    response.writeHead(416, { "Content-Range": `bytes */${fileSize}` });
    response.end();
    return;
  }

  response.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": end - start + 1,
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
  });

  if (request.method !== "HEAD") {
    createReadStream(filePath, { start, end }).pipe(response);
  } else {
    response.end();
  }
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Payload demasiado grande"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function readBinaryBody(request, maxBytes = 4_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        request.destroy();
        reject(new Error("El archivo supera el límite de 4 MB."));
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

const GRAPH_API_VERSION = process.env.META_GRAPH_VERSION || "v26.0";
const graphCache = new Map();
const socialMemoryStore = { items: [] };
const SOCIAL_STORE_KEY = "peluvi:social:content:v1";
const ADMIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

function signAdminToken(expiresAt) {
  return createHmac("sha256", process.env.ADMIN_PASSWORD || "").update(String(expiresAt)).digest("hex");
}

function issueAdminToken() {
  const expiresAt = Date.now() + ADMIN_TOKEN_TTL_MS;
  return `${expiresAt}.${signAdminToken(expiresAt)}`;
}

async function handleAdminLogin(request, response) {
  if (!process.env.ADMIN_PASSWORD) {
    sendJson(response, 500, { error: "Falta configurar ADMIN_PASSWORD." });
    return;
  }
  const body = await readBody(request);
  const { password } = JSON.parse(body || "{}");
  if (password !== process.env.ADMIN_PASSWORD) {
    sendJson(response, 401, { error: "Clave incorrecta." });
    return;
  }
  sendJson(response, 200, { token: issueAdminToken() });
}

function requireAdminAuth(request) {
  const authHeader = request.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return { error: 401, message: "Falta iniciar sesión." };

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || Date.now() > Number(expiresAt)) {
    return { error: 401, message: "Sesión inválida o expirada." };
  }

  const expected = Buffer.from(signAdminToken(expiresAt));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { error: 401, message: "Sesión inválida o expirada." };
  }
  return { ok: true };
}

async function callGraphApi(path, { ttlMs = 5 * 60 * 1000, accessToken, cacheNamespace = "default" } = {}) {
  const token = accessToken || process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("Falta configurar el token de Meta.");

  const cacheKey = `${cacheNamespace}:${path}`;
  const cached = graphCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const resp = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || "Error de Graph API");

  graphCache.set(cacheKey, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

async function callGraphMutation(path, params, accessToken) {
  if (!accessToken) throw new Error("Falta configurar el token de Meta.");
  const body = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") body.set(key, String(value));
  });
  const resp = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || "Meta rechazó la publicación.");
  return data;
}

async function callGraphDelete(path, accessToken) {
  if (!accessToken) throw new Error("Falta configurar el token de Meta.");
  const resp = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await resp.json();
  if (!resp.ok || data.success === false) throw new Error(data.error?.message || "Meta no permitió eliminar la publicación.");
  return data;
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

async function supabaseSocialRequest(query = "", { method = "GET", body, prefer } = {}) {
  const config = supabaseConfig();
  if (!config) return null;
  const response = await fetch(`${config.url}/rest/v1/social_posts${query}`, {
    method,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "No se pudo acceder a la parrilla de Supabase.");
  }
  if (response.status === 204) return null;
  return response.json();
}

function socialItemFromRow(row) {
  return {
    id: row.id, platform: row.platform, mediaType: row.media_type, caption: row.caption,
    mediaUrls: Array.isArray(row.media_urls) ? row.media_urls : [], scheduledAt: row.scheduled_at,
    status: row.status, result: row.result, error: row.error, publishedAt: row.published_at,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function socialItemToRow(item) {
  return {
    id: item.id, platform: item.platform, media_type: item.mediaType, caption: item.caption,
    media_urls: item.mediaUrls || [], scheduled_at: item.scheduledAt, status: item.status,
    result: item.result || null, error: item.error || null, published_at: item.publishedAt || null,
    created_at: item.createdAt, updated_at: item.updatedAt || new Date().toISOString(),
  };
}

async function redisCommand(...command) {
  const config = redisConfig();
  if (!config) return null;
  const resp = await fetch(config.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const data = await resp.json();
  if (!resp.ok || data.error) throw new Error(data.error || "No se pudo acceder al almacenamiento social.");
  return data.result;
}

async function readSocialItems() {
  if (supabaseConfig()) {
    const rows = await supabaseSocialRequest("?select=*&order=created_at.desc");
    return (rows || []).map(socialItemFromRow);
  }
  const stored = await redisCommand("GET", SOCIAL_STORE_KEY);
  if (stored === null) return socialMemoryStore.items;
  try { return JSON.parse(stored || "[]"); } catch { return []; }
}

async function writeSocialItems(items) {
  socialMemoryStore.items = items;
  if (supabaseConfig()) {
    if (items.length) await supabaseSocialRequest("?on_conflict=id", {
      method: "POST", body: items.map(socialItemToRow), prefer: "resolution=merge-duplicates,return=minimal",
    });
  } else if (redisConfig()) await redisCommand("SET", SOCIAL_STORE_KEY, JSON.stringify(items));
}

async function deleteSocialItem(id) {
  socialMemoryStore.items = socialMemoryStore.items.filter((item) => item.id !== id);
  if (supabaseConfig()) {
    await supabaseSocialRequest(`?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", prefer: "return=minimal" });
    return;
  }
  const items = (await readSocialItems()).filter((item) => item.id !== id);
  await writeSocialItems(items);
}

function cleanSocialPayload(payload = {}) {
  const platform = ["instagram", "facebook", "both"].includes(payload.platform) ? payload.platform : "instagram";
  const mediaType = ["image", "carousel", "reel", "text"].includes(payload.mediaType) ? payload.mediaType : "image";
  const mediaUrls = Array.isArray(payload.mediaUrls)
    ? payload.mediaUrls.map((url) => String(url).trim()).filter((url) => /^https:\/\//i.test(url)).slice(0, 10)
    : [];
  return {
    platform,
    mediaType,
    caption: String(payload.caption || "").trim().slice(0, 2200),
    mediaUrls,
    scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt).toISOString() : null,
  };
}

async function publishInstagram(item, token, igUserId) {
  if (!igUserId) throw new Error("Falta configurar META_IG_USER_ID.");
  if (item.mediaType === "text") throw new Error("Instagram requiere una imagen o un video.");
  if (item.mediaType === "carousel") {
    if (item.mediaUrls.length < 2) throw new Error("El carrusel necesita al menos dos imágenes.");
    const children = [];
    for (const imageUrl of item.mediaUrls) {
      const child = await callGraphMutation(`${igUserId}/media`, { image_url: imageUrl, is_carousel_item: true }, token);
      children.push(child.id);
    }
    const container = await callGraphMutation(`${igUserId}/media`, {
      media_type: "CAROUSEL", children: children.join(","), caption: item.caption,
    }, token);
    return callGraphMutation(`${igUserId}/media_publish`, { creation_id: container.id }, token);
  }
  const mediaUrl = item.mediaUrls[0];
  if (!mediaUrl) throw new Error("Agrega una URL pública del archivo.");
  const container = await callGraphMutation(`${igUserId}/media`, item.mediaType === "reel"
    ? { media_type: "REELS", video_url: mediaUrl, caption: item.caption, share_to_feed: true }
    : { image_url: mediaUrl, caption: item.caption }, token);
  if (item.mediaType === "reel") {
    let ready = false;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const status = await callGraphApi(`${container.id}?fields=status_code,status`, {
        accessToken: token, cacheNamespace: `reel-${attempt}`, ttlMs: 0,
      });
      if (status.status_code === "FINISHED") { ready = true; break; }
      if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
        throw new Error(status.status || "Meta no pudo procesar el Reel.");
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    if (!ready) throw new Error("Meta todavía está procesando el Reel. Intenta publicarlo de nuevo en unos minutos.");
  }
  return callGraphMutation(`${igUserId}/media_publish`, { creation_id: container.id }, token);
}

async function publishFacebook(item, socialToken, pageId) {
  if (!pageId) throw new Error("Falta configurar META_PAGE_ID.");
  const pageToken = await getMetaPageAccessToken(pageId, socialToken);
  if (item.mediaType === "text" || !item.mediaUrls[0]) {
    return callGraphMutation(`${pageId}/feed`, { message: item.caption }, pageToken);
  }
  if (item.mediaType === "reel") {
    throw new Error("Los Reels de Facebook se habilitarán en una siguiente iteración; publica este Reel en Instagram.");
  }
  return callGraphMutation(`${pageId}/photos`, { url: item.mediaUrls[0], caption: item.caption, published: true }, pageToken);
}

async function publishSocialItem(item) {
  const token = process.env.META_SOCIAL_ACCESS_TOKEN;
  if (!token) throw new Error("Falta configurar META_SOCIAL_ACCESS_TOKEN.");
  const results = {};
  if (item.platform === "instagram" || item.platform === "both") {
    results.instagram = await publishInstagram(item, token, process.env.META_IG_USER_ID);
  }
  if (item.platform === "facebook" || item.platform === "both") {
    results.facebook = await publishFacebook(item, token, process.env.META_PAGE_ID);
  }
  return results;
}

async function processSocialItem(id) {
  const items = await readSocialItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Publicación no encontrada.");
  if (items[index].status === "processing") throw new Error("La publicación ya se está procesando.");
  items[index] = { ...items[index], status: "processing", updatedAt: new Date().toISOString(), error: null };
  await writeSocialItems(items);
  try {
    const result = await publishSocialItem(items[index]);
    items[index] = { ...items[index], status: "published", publishedAt: new Date().toISOString(), result };
  } catch (error) {
    items[index] = { ...items[index], status: "failed", error: error.message, updatedAt: new Date().toISOString() };
  }
  await writeSocialItems(items);
  return items[index];
}

async function handleSocialApi(url, request, response) {
  const auth = requireAdminAuth(request);
  if (auth.error) return sendJson(response, auth.error, { error: auth.message });
  try {
    if (url.pathname === "/api/admin/social-capabilities" && request.method === "GET") {
      let permissions = [];
      try {
        const data = await callGraphApi("me/permissions", {
          accessToken: process.env.META_SOCIAL_ACCESS_TOKEN, cacheNamespace: "permissions", ttlMs: 60_000,
        });
        permissions = (data.data || []).filter((p) => p.status === "granted").map((p) => p.permission);
      } catch {}
      return sendJson(response, 200, {
        persistentStorage: Boolean(supabaseConfig() || redisConfig()),
        storageProvider: supabaseConfig() ? "Supabase" : redisConfig() ? "Redis" : null,
        mediaStorage: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
        schedulerConfigured: Boolean(process.env.CRON_SECRET),
        permissions,
        canPublishInstagram: permissions.includes("instagram_content_publish"),
        canPublishFacebook: permissions.includes("pages_manage_posts"),
      });
    }

    if (url.pathname === "/api/admin/social-upload" && request.method === "POST") {
      if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Falta conectar Vercel Blob para subir archivos.");
      const type = String(request.headers["content-type"] || "");
      if (!type.startsWith("image/") && !type.startsWith("video/")) throw new Error("Selecciona una imagen o video válido.");
      const originalName = decodeURIComponent(String(request.headers["x-file-name"] || "contenido"));
      const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100);
      const bytes = await readBinaryBody(request);
      const { put } = await import("@vercel/blob");
      const blob = await put(`social/${Date.now()}-${safeName}`, bytes, {
        access: "public", contentType: type, addRandomSuffix: true,
      });
      return sendJson(response, 201, { url: blob.url, pathname: blob.pathname, contentType: blob.contentType });
    }

    if (url.pathname === "/api/admin/social-facebook-posts" && request.method === "GET") {
      const pageId = process.env.META_PAGE_ID;
      const token = process.env.META_SOCIAL_ACCESS_TOKEN;
      if (!pageId || !token) throw new Error("Falta configurar la conexión de Facebook.");
      const pageToken = await getMetaPageAccessToken(pageId, token);
      const data = await callGraphApi(
        `${pageId}/feed?fields=id,message,created_time,full_picture,permalink_url&limit=10`,
        { accessToken: pageToken, cacheNamespace: "facebook-posts", ttlMs: 0 }
      );
      return sendJson(response, 200, data);
    }

    if (url.pathname.startsWith("/api/admin/social-facebook-posts/") && request.method === "DELETE") {
      const postId = decodeURIComponent(url.pathname.split("/").pop() || "");
      if (!/^\d+_\d+$/.test(postId)) throw new Error("Identificador de publicación inválido.");
      const pageId = process.env.META_PAGE_ID;
      const token = process.env.META_SOCIAL_ACCESS_TOKEN;
      const pageToken = await getMetaPageAccessToken(pageId, token);
      const data = await callGraphDelete(postId, pageToken);
      graphCache.delete(`facebook-posts:${pageId}/feed?fields=id,message,created_time,full_picture,permalink_url&limit=10`);
      return sendJson(response, 200, data);
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[3];
    const action = parts[4];
    if (url.pathname === "/api/admin/social-content" && request.method === "GET") {
      const items = await readSocialItems();
      return sendJson(response, 200, { data: items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
    }
    if (url.pathname === "/api/admin/social-content" && request.method === "POST") {
      const payload = cleanSocialPayload(JSON.parse((await readBody(request)) || "{}"));
      if (!payload.caption && payload.mediaUrls.length === 0) throw new Error("Escribe un texto o agrega contenido multimedia.");
      const now = new Date().toISOString();
      const requestedStatus = JSON.parse(request.headers["x-social-options"] || "{}").status;
      const status = requestedStatus === "scheduled" ? "scheduled" : "draft";
      if (status === "scheduled" && !supabaseConfig() && !redisConfig()) {
        throw new Error("Conecta Supabase antes de programar publicaciones. Así la parrilla no se perderá al desplegar.");
      }
      if (status === "scheduled" && (!payload.scheduledAt || new Date(payload.scheduledAt) <= new Date())) {
        throw new Error("Selecciona una fecha futura para programar.");
      }
      const item = { id: randomUUID(), ...payload, status, createdAt: now, updatedAt: now, error: null };
      const items = await readSocialItems();
      items.push(item);
      await writeSocialItems(items);
      return sendJson(response, 201, item);
    }
    if (id && action === "publish" && request.method === "POST") {
      return sendJson(response, 200, await processSocialItem(id));
    }
    if (id && request.method === "DELETE") {
      await deleteSocialItem(id);
      return sendJson(response, 200, { ok: true });
    }
    sendJson(response, 404, { error: "Endpoint social no encontrado." });
  } catch (error) {
    sendJson(response, 400, { error: error.message || "No se pudo completar la acción." });
  }
}

async function handleSocialCron(request, response) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.authorization !== `Bearer ${expected}`) {
    return sendJson(response, 401, { error: "Cron no autorizado." });
  }
  try {
    const items = await readSocialItems();
    const due = items.filter((item) => item.status === "scheduled" && new Date(item.scheduledAt) <= new Date()).slice(0, 5);
    const results = [];
    for (const item of due) results.push(await processSocialItem(item.id));
    sendJson(response, 200, { processed: results.length, data: results });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

async function getMetaPageAccessToken(pageId, socialToken) {
  const pageAuth = await callGraphApi(`${pageId}?fields=access_token`, {
    accessToken: socialToken,
    cacheNamespace: "social-auth",
    ttlMs: 50 * 60 * 1000,
  });

  if (!pageAuth?.access_token) {
    throw new Error("Meta no entregó acceso a la página. Revisa los permisos del usuario del sistema.");
  }

  return pageAuth.access_token;
}

async function handleAdminApi(pathname, request, response) {
  const auth = requireAdminAuth(request);
  if (auth.error) {
    sendJson(response, auth.error, { error: auth.message });
    return;
  }

  const pageId = process.env.META_PAGE_ID;
  const igUserId = process.env.META_IG_USER_ID;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const pixelId = process.env.META_PIXEL_ID;
  const socialToken = process.env.META_SOCIAL_ACCESS_TOKEN;
  const marketingToken = process.env.META_MARKETING_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

  try {
    if (pathname === "/api/admin/session") {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (pathname === "/api/admin/meta-status") {
      if (!pageId) throw new Error("Falta configurar META_PAGE_ID.");
      if (!igUserId) throw new Error("Falta configurar META_IG_USER_ID.");
      if (!socialToken) throw new Error("Falta configurar META_SOCIAL_ACCESS_TOKEN.");

      const pageAccessToken = await getMetaPageAccessToken(pageId, socialToken);
      const [page, instagram] = await Promise.all([
        callGraphApi(`${pageId}?fields=id,name,fan_count,followers_count,picture`, {
          accessToken: pageAccessToken,
          cacheNamespace: "social",
        }),
        callGraphApi(`${igUserId}?fields=id,username,name,followers_count,media_count,profile_picture_url`, {
          accessToken: socialToken,
          cacheNamespace: "social",
        }),
      ]);

      sendJson(response, 200, { connected: true, page, instagram });
      return;
    }

    if (pathname === "/api/admin/ig-media") {
      if (!pageId) throw new Error("Falta configurar META_PAGE_ID.");
      if (!igUserId) throw new Error("Falta configurar META_IG_USER_ID.");
      if (!socialToken) throw new Error("Falta configurar META_SOCIAL_ACCESS_TOKEN.");
      const data = await callGraphApi(
        `${igUserId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=6`,
        { accessToken: socialToken, cacheNamespace: "social", ttlMs: 10 * 60 * 1000 }
      );
      sendJson(response, 200, data);
      return;
    }

    if (pathname === "/api/admin/page-insights") {
      if (!pageId) throw new Error("Falta configurar META_PAGE_ID.");
      const data = await callGraphApi(
        `${pageId}/insights?metric=page_fans,page_impressions,page_engaged_users&period=day`,
        { accessToken: socialToken, cacheNamespace: "social" }
      );
      sendJson(response, 200, data);
      return;
    }

    if (pathname === "/api/admin/ig-insights") {
      if (!igUserId) throw new Error("Falta configurar META_IG_USER_ID.");
      const data = await callGraphApi(
        `${igUserId}/insights?metric=follower_count,reach,accounts_engaged&period=day`,
        { accessToken: socialToken, cacheNamespace: "social" }
      );
      sendJson(response, 200, data);
      return;
    }

    if (pathname === "/api/admin/ads-insights") {
      if (!adAccountId) throw new Error("Falta configurar META_AD_ACCOUNT_ID.");
      const data = await callGraphApi(
        `${adAccountId}/insights?fields=campaign_name,spend,impressions,reach,actions,cost_per_action_type&level=campaign&date_preset=last_30d`,
        { accessToken: marketingToken, cacheNamespace: "marketing" }
      );
      sendJson(response, 200, data);
      return;
    }

    if (pathname === "/api/admin/pixel-summary") {
      if (!pixelId) throw new Error("Falta configurar META_PIXEL_ID.");
      const data = await callGraphApi(`${pixelId}?fields=name,last_fired_time`, {
        accessToken: marketingToken,
        cacheNamespace: "marketing",
      });
      sendJson(response, 200, data);
      return;
    }

    sendJson(response, 404, { error: "Endpoint no encontrado." });
  } catch (error) {
    sendJson(response, 502, { error: error.message || "Error consultando la API de Meta." });
  }
}

function extractText(data) {
  if (typeof data.output_text === "string") {
    return data.output_text.trim();
  }

  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("")
    .trim();
}

function loadLocalEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}
