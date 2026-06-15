import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";

const mlPort = 18788;
const appPort = 17867;

const mlServer = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      ok: true,
      m1_available: true,
      play_model_available: true
    }));
    return;
  }
  response.writeHead(404);
  response.end();
});

await new Promise(resolve => mlServer.listen(mlPort, "127.0.0.1", resolve));

const app = spawn(process.execPath, ["src/server.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(appPort),
    ML_SERVER: `http://127.0.0.1:${mlPort}`,
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    REQUIRE_SUPABASE: "1",
    REQUIRE_SERVICE_ROLE: "1",
    EXPORT_TOKEN: "test-export-token",
    MAX_REQUEST_BYTES: "128",
    API_RATE_LIMIT: "3"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (app.exitCode !== null) {
      throw new Error(`server exited before readiness: ${app.exitCode}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${appPort}/api/health`);
      if (response.ok) return response.json();
    } catch {
      // Server is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("server readiness timeout");
}

try {
  const health = await waitForServer();
  assert.equal(health.ok, true);
  assert.equal(health.ml.play_model_available, true);
  assert.equal(health.supabase_configured, true);
  assert.equal(health.supabase_privileged, true);

  const unauthorized = await fetch(`http://127.0.0.1:${appPort}/api/export`);
  assert.equal(unauthorized.status, 401);
  assert.equal((await unauthorized.json()).error, "unauthorized");

  const tooLarge = await fetch(`http://127.0.0.1:${appPort}/api/characters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "x".repeat(200) })
  });
  assert.equal(tooLarge.status, 413);
  assert.equal((await tooLarge.json()).error, "payload_too_large");

  const invalidJson = await fetch(`http://127.0.0.1:${appPort}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{invalid"
  });
  assert.equal(invalidJson.status, 400);
  assert.equal((await invalidJson.json()).error, "invalid_json");

  const fallback = await fetch(`http://127.0.0.1:${appPort}/api/decide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "world" })
  });
  assert.equal(fallback.status, 200);

  const limited = await fetch(`http://127.0.0.1:${appPort}/api/decide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "world" })
  });
  assert.equal(limited.status, 429);
  assert.equal((await limited.json()).error, "rate_limited");

  console.log("server.test.mjs: ok");
} finally {
  app.kill("SIGTERM");
  await new Promise(resolve => app.once("exit", resolve));
  await new Promise(resolve => mlServer.close(resolve));
}
