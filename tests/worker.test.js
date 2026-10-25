const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

globalThis.crypto ||= require("node:crypto").webcrypto;

const source = readFileSync(require("node:path").join(__dirname, "../worker/worker.js"), "utf8");
const workerPromise = import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)
  .then((module) => module.default);
const origin = "https://scenebiscuit-cell.github.io";

function environment() {
  const values = new Map();
  const calls = [];
  return {
    calls,
    LIMITS: {
      async get(key) { return values.get(key) ?? null; },
      async put(key, value) { values.set(key, value); },
    },
    AI: {
      async run(model, input) {
        calls.push({ model, input });
        return { response: "A concise answer." };
      },
    },
    ALLOWED_ORIGINS: origin,
    PER_VISITOR_DAILY: "10",
    GLOBAL_DAILY: "40",
  };
}

test("worker health endpoint reports success with the configured CORS origin", async () => {
  const worker = await workerPromise;
  const response = await worker.fetch(new Request("https://worker.example/health", {
    headers: { Origin: origin },
  }), environment());
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
});

test("worker rejects unapproved origins", async () => {
  const worker = await workerPromise;
  const response = await worker.fetch(new Request("https://worker.example/chat", {
    method: "POST",
    headers: { Origin: "https://untrusted.example" },
    body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
  }), environment());
  assert.equal(response.status, 403);
});

test("worker validates chat messages before charging a daily request", async () => {
  const worker = await workerPromise;
  const env = environment();
  const response = await worker.fetch(new Request("https://worker.example/chat", {
    method: "POST",
    headers: { Origin: origin, "CF-Connecting-IP": "192.0.2.1" },
    body: JSON.stringify({ messages: [null] }),
  }), env);
  assert.equal(response.status, 400);
  assert.equal(env.calls.length, 0);
});

test("worker sends valid chat requests to Workers AI", async () => {
  const worker = await workerPromise;
  const env = environment();
  const response = await worker.fetch(new Request("https://worker.example/chat", {
    method: "POST",
    headers: { Origin: origin, "CF-Connecting-IP": "192.0.2.1" },
    body: JSON.stringify({ messages: [{ role: "user", content: "Explain this result." }] }),
  }), env);
  assert.deepEqual(await response.json(), { response: "A concise answer." });
  assert.equal(env.calls.length, 1);
  assert.match(env.calls[0].model, /llama/);
});

test("worker exposes COA triage through Workers AI", async () => {
  const worker = await workerPromise;
  const env = environment();
  const response = await worker.fetch(new Request("https://worker.example/triage", {
    method: "POST",
    headers: { Origin: origin, "CF-Connecting-IP": "192.0.2.2" },
    body: JSON.stringify({ text: "Lab COA: Δ9-THC 10 mg/g" }),
  }), env);
  assert.deepEqual(await response.json(), { response: "A concise answer." });
  assert.match(env.calls[0].input.messages[0].content, /valid JSON/);
});
