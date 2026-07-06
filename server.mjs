import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(response, 500, {
      error: "Falta configurar OPENAI_API_KEY en .env o en el entorno.",
    });
    return;
  }

  const body = await readBody(request);
  const payload = JSON.parse(body || "{}");
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const cleanMessages = messages
    .filter((message) => ["user", "assistant"].includes(message.role) && typeof message.content === "string")
    .slice(-10);

  const instructions = `
Eres Peluvi IA, un asistente amable, breve y premium para la landing de Peluvi.
Responde en espanol claro. Ayuda a usuarios a entender la app, adopciones, servicios, SOS, tienda, favoritos, perfiles y roles.
No inventes disponibilidad real ni precios reales; si el usuario quiere una accion concreta, orientalo dentro de la app.

${peluviContext}
`;

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
    sendJson(response, openaiResponse.status, {
      error: data.error?.message || "OpenAI no pudo responder.",
    });
    return;
  }

  sendJson(response, 200, { reply: extractText(data) || "No pude generar una respuesta ahora." });
}

async function serveStatic(pathname, response, request) {
  const safePath = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, safePath === "/" ? "index.html" : safePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
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
      if (body.length > 100_000) {
        request.destroy();
        reject(new Error("Payload demasiado grande"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
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
