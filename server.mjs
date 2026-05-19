import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { env, pipeline } from "@xenova/transformers";

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

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }
  if (request.method === "POST" && request.url === "/api/embed") {
    await embedText(request, response);
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
