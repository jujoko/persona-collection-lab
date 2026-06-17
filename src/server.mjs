import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { env, pipeline } from "@huggingface/transformers";
import {
  insertCharacter,
  insertSimulation,
  insertFeedback,
  exportAll,
  isSupabaseConfigured,
  isSupabasePrivileged
} from "./db.mjs";
import { generateNarration, generateGrowthDecision, generateWorldDecision } from "./narrate.mjs";

const ML_SERVER = process.env.ML_SERVER || "http://localhost:8788";
const REQUIRE_SUPABASE = process.env.REQUIRE_SUPABASE === "1";
const REQUIRE_SERVICE_ROLE = process.env.REQUIRE_SERVICE_ROLE === "1";
const EXPORT_TOKEN = process.env.EXPORT_TOKEN || "";
const MAX_REQUEST_BYTES = Number(process.env.MAX_REQUEST_BYTES || 262144);
const MAX_TEXT_LENGTH = Number(process.env.MAX_TEXT_LENGTH || 4000);
const API_RATE_LIMIT = Number(process.env.API_RATE_LIMIT || 60);
const API_RATE_WINDOW_MS = 60_000;
const rateBuckets = new Map();

const rootDir = fileURLToPath(new URL("../public/", import.meta.url));
const contentDir = fileURLToPath(new URL("../content/", import.meta.url));
const port = Number(process.env.PORT || 8787);
const modelName = "Xenova/all-MiniLM-L6-v2";

env.allowLocalModels = true;
env.allowRemoteModels = true;
if (process.env.TRANSFORMERS_JS_CACHE) {
  env.cacheDir = process.env.TRANSFORMERS_JS_CACHE;
}

let extractorPromise;

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", modelName);
  }
  return extractorPromise;
}

class HttpError extends Error {
  constructor(status, code, message = code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function commonHeaders(contentType) {
  return {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Resource-Policy": "same-origin"
  };
}

function staticCacheHeaders(requestedPath) {
  const ext = extname(requestedPath);
  if (ext === ".html" || ext === ".js" || ext === ".css") {
    return {
      "Cache-Control": "no-store, max-age=0",
      "Pragma": "no-cache"
    };
  }
  return {
    "Cache-Control": "public, max-age=3600"
  };
}

function sendJson(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, {
    ...commonHeaders("application/json; charset=utf-8"),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    ...extraHeaders
  });
  response.end(JSON.stringify(payload));
}

function sendRequestError(response, error, fallbackStatus = 500) {
  const status = error instanceof HttpError ? error.status : fallbackStatus;
  const code = error instanceof HttpError ? error.code : "internal_error";
  sendJson(response, status, { ok: false, error: code });
}

function isExportAuthorized(request) {
  if (!EXPORT_TOKEN) return false;
  return request.headers.authorization === `Bearer ${EXPORT_TOKEN}`;
}

async function readRequestJson(request) {
  const contentLength = Number(request.headers["content-length"] || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    throw new HttpError(413, "payload_too_large");
  }

  const chunks = [];
  let received = 0;
  for await (const chunk of request) {
    received += chunk.length;
    if (received > MAX_REQUEST_BYTES) {
      throw new HttpError(413, "payload_too_large");
    }
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "invalid_json");
  }
}

function requireText(value, field = "text") {
  const text = String(value || "").trim();
  if (!text) throw new HttpError(400, `${field}_required`);
  if (text.length > MAX_TEXT_LENGTH) {
    throw new HttpError(400, `${field}_too_long`);
  }
  return text;
}

function clientIp(request) {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.socket.remoteAddress || "unknown";
}

function consumeRateLimit(request, response) {
  if (request.method !== "POST" || !request.url?.startsWith("/api/")) return true;
  const now = Date.now();
  const key = clientIp(request);
  let bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= API_RATE_WINDOW_MS) {
    bucket = { startedAt: now, count: 0 };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  const remaining = Math.max(0, API_RATE_LIMIT - bucket.count);
  if (bucket.count > API_RATE_LIMIT) {
    sendJson(response, 429, { ok: false, error: "rate_limited" }, {
      "Retry-After": String(Math.ceil((API_RATE_WINDOW_MS - (now - bucket.startedAt)) / 1000)),
      "X-RateLimit-Remaining": "0"
    });
    return false;
  }
  response.setHeader("X-RateLimit-Remaining", String(remaining));
  return true;
}

async function proxyToMl(request, response, path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const body = await readRequestJson(request);
    body.text = requireText(body.text);
    if (path === "/play_action") {
      if (!Array.isArray(body.candidates) || body.candidates.length === 0) {
        throw new HttpError(400, "candidates_required");
      }
      if (body.candidates.length > 50
          || body.candidates.some(candidate => typeof candidate !== "string"
            || !candidate.trim() || candidate.length > 100)) {
        throw new HttpError(400, "invalid_candidates");
      }
    }
    const mlRes = await fetch(`${ML_SERVER}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await mlRes.json();
    sendJson(response, mlRes.status, payload);
  } catch (error) {
    if (error instanceof HttpError) {
      sendRequestError(response, error);
      return;
    }
    sendJson(response, 503, {
      ok: false,
      error: error?.name === "AbortError" ? "ml_timeout" : "ml_unavailable"
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function getMlHealth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const mlRes = await fetch(`${ML_SERVER}/health`, { signal: controller.signal });
    if (!mlRes.ok) return null;
    return await mlRes.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function embedText(request, response) {
  try {
    const body = await readRequestJson(request);
    const text = requireText(body.text);
    const extractor = await getExtractor();
    const output = await extractor(text, { pooling: "mean", normalize: true });
    const embedding = Array.from(output.data, value => Number(value));
    sendJson(response, 200, {
      provider: "Transformers.js",
      model: modelName,
      dimensions: embedding.length,
      embedding
    });
  } catch (error) {
    if (error instanceof HttpError) sendRequestError(response, error);
    else sendJson(response, 500, { ok: false, error: "embedding_failed" });
  }
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const servingContent = pathname.startsWith("/content/");
  const baseDir = servingContent ? contentDir : rootDir;
  const relativePath = servingContent ? pathname.replace(/^\/content\//, "") : pathname;
  const requested = normalize(join(baseDir, relativePath));
  if (!requested.startsWith(baseDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  try {
    const content = await readFile(requested);
    const mimeTypes = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8"
    };
    response.writeHead(200, {
      ...commonHeaders(mimeTypes[extname(requested)] || "application/octet-stream"),
      ...staticCacheHeaders(requested),
      "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:8787; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
    });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

async function handleData(request, response, inserter) {
  try {
    const body = await readRequestJson(request);
    await inserter(body);
    console.log(`[DB] ${request.url} ok`);
    sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error(`[DB] ${request.url} error:`, error?.message || error);
    sendRequestError(response, error);
  }
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }
  if (!consumeRateLimit(request, response)) return;
  if (request.method === "GET" && request.url === "/api/health") {
    const ml = await getMlHealth();
    const supabaseConfigured = isSupabaseConfigured();
    const supabasePrivileged = isSupabasePrivileged();
    const ok = Boolean(ml)
      && (!REQUIRE_SUPABASE || supabaseConfigured)
      && (!REQUIRE_SERVICE_ROLE || supabasePrivileged);
    sendJson(response, ok ? 200 : 503, {
      ok,
      node: true,
      ml,
      supabase_configured: supabaseConfigured,
      supabase_required: REQUIRE_SUPABASE,
      supabase_privileged: supabasePrivileged,
      service_role_required: REQUIRE_SERVICE_ROLE
    });
    return;
  }
  if (request.method === "GET" && request.url === "/api/schema") {
    try {
      const schemaPath = join(rootDir, "learned_schema.json");
      const content = await readFile(schemaPath, "utf8");
      sendJson(response, 200, { ok: true, schema: JSON.parse(content) });
    } catch {
      sendJson(response, 404, { ok: false, error: "learned_schema.json 없음 — train_m3.py를 먼저 실행하세요" });
    }
    return;
  }
  if (request.method === "GET" && request.url === "/api/export") {
    if (!isExportAuthorized(request)) {
      sendJson(response, EXPORT_TOKEN ? 401 : 503, {
        ok: false,
        error: EXPORT_TOKEN ? "unauthorized" : "export_disabled"
      });
      return;
    }
    try {
      const data = await exportAll();
      sendJson(response, 200, data);
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error?.message || String(error) });
    }
    return;
  }
  if (request.method === "POST" && request.url === "/api/embed") {
    await embedText(request, response);
    return;
  }
  if (request.method === "POST" && request.url === "/api/persona") {
    await proxyToMl(request, response, "/persona");
    return;
  }
  if (request.method === "POST" && request.url === "/api/play_action") {
    await proxyToMl(request, response, "/play_action");
    return;
  }
  if (request.method === "POST" && request.url === "/api/characters") {
    await handleData(request, response, insertCharacter);
    return;
  }
  if (request.method === "POST" && request.url === "/api/simulations") {
    await handleData(request, response, insertSimulation);
    return;
  }
  if (request.method === "POST" && request.url === "/api/feedback") {
    await handleData(request, response, insertFeedback);
    return;
  }
  if (request.method === "POST" && request.url === "/api/decide") {
    try {
      const body = await readRequestJson(request);
      const type = body.type; // "growth" | "world"
      let result = null;
      if (type === "growth") {
        result = await generateGrowthDecision(body);
      } else if (type === "world") {
        result = await generateWorldDecision(body);
      } else {
        sendJson(response, 400, { ok: false, error: "type must be 'growth' or 'world'" });
        return;
      }
      if (result) {
        sendJson(response, 200, { ok: true, result });
      } else {
        sendJson(response, 200, { ok: false, fallback: true });
      }
    } catch (error) {
      sendRequestError(response, error);
    }
    return;
  }
  if (request.method === "POST" && request.url === "/api/narrate") {
    try {
      const body = await readRequestJson(request);
      const narration = await generateNarration(body);
      if (narration) {
        sendJson(response, 200, { ok: true, narration });
      } else {
        sendJson(response, 200, { ok: false, fallback: true });
      }
    } catch (error) {
      sendRequestError(response, error);
    }
    return;
  }
  if (request.method === "GET") {
    await serveStatic(request, response);
    return;
  }
  response.writeHead(405);
  response.end("Method not allowed");
});

server.listen(port, () => {
  console.log(`Persona Collection Lab running at http://localhost:${port}`);
  console.log(`Embedding model: ${modelName}`);
});
