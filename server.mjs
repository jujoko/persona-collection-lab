import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { env, pipeline } from "@xenova/transformers";
import { insertCharacter, insertSimulation, insertFeedback, exportAll } from "./db.mjs";
import { generateNarration, generateGrowthDecision, generateWorldDecision } from "./narrate.mjs";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 8787);
const modelName = "Xenova/all-MiniLM-L6-v2";

env.allowLocalModels = true;
env.allowRemoteModels = true;

let extractorPromise;

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", modelName);
  }
  return extractorPromise;
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  });
  response.end(JSON.stringify(payload));
}

async function readRequestJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

async function embedText(request, response) {
  try {
    const body = await readRequestJson(request);
    const text = String(body.text || "").trim();
    if (!text) {
      sendJson(response, 400, { error: "text is required" });
      return;
    }
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
    sendJson(response, 500, {
      error: "embedding_failed",
      message: error?.message || String(error)
    });
  }
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const requested = normalize(join(rootDir, pathname));
  if (!requested.startsWith(rootDir)) {
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
      "Content-Type": mimeTypes[extname(requested)] || "application/octet-stream"
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
    sendJson(response, 500, { ok: false, error: error?.message || String(error) });
  }
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }
  if (request.method === "GET" && request.url === "/api/health") {
    sendJson(response, 200, { ok: true });
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
      sendJson(response, 500, { ok: false, error: error?.message || String(error) });
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
      sendJson(response, 500, { ok: false, error: error?.message || String(error) });
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
