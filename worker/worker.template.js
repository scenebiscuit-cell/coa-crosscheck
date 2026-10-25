const MODEL = "@cf/meta/llama-3.1-8b-instruct";
const DAY = 86400;
const TTL = 2 * DAY;

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  return (env.ALLOWED_ORIGINS || "").split(",").map((item) => item.trim()).includes(origin) ? origin : false;
}

function json(body, status, origin) {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers.Vary = "Origin";
  }
  return new Response(JSON.stringify(body), { status, headers });
}

async function consumeLimit(request, env) {
  const date = new Date().toISOString().slice(0, 10);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  const visitor = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const visitorKey = `visitor:${date}:${visitor}`;
  const globalKey = `global:${date}`;
  const [visitorCount, globalCount] = await Promise.all([
    env.LIMITS.get(visitorKey),
    env.LIMITS.get(globalKey),
  ]);
  if (Number(visitorCount || 0) >= Number(env.PER_VISITOR_DAILY || 10) ||
      Number(globalCount || 0) >= Number(env.GLOBAL_DAILY || 40)) return false;
  await Promise.all([
    env.LIMITS.put(visitorKey, String(Number(visitorCount || 0) + 1), { expirationTtl: TTL }),
    env.LIMITS.put(globalKey, String(Number(globalCount || 0) + 1), { expirationTtl: TTL }),
  ]);
  return true;
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const origin = allowedOrigin(request, env);
    if (origin === false) return json({ error: "origin_not_allowed" }, 403);
    if (request.method === "OPTIONS") return json({}, 200, origin);
    if (path === "/health" && request.method === "GET") return json({ ok: true }, 200, origin);
    if (!["/chat", "/triage"].includes(path) || request.method !== "POST") {
      return json({ error: "not_found" }, 404, origin);
    }
    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > 70000) return json({ error: "request_too_large" }, 413, origin);
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid_json" }, 400, origin);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "invalid_request" }, 400, origin);
    let messages;
    if (path === "/chat") {
      if (!Array.isArray(body.messages) || !body.messages.length ||
          body.messages.length > 12 || body.messages.some((message) =>
            !message || typeof message !== "object" ||
            !["user", "assistant"].includes(message.role) || typeof message.content !== "string" ||
            message.content.length > 60000) ||
          body.messages.reduce((total, message) => total + message.content.length, 0) > 60000) {
        return json({ error: "invalid_messages" }, 400, origin);
      }
      messages = [{ role: "system", content: "Explain only the supplied COA report and rulebook data. If the data is insufficient, say so. Do not give legal advice or invent limits." }, ...body.messages];
    } else {
      if (typeof body.text !== "string" || !body.text.trim() || body.text.length > 60000) {
        return json({ error: "invalid_text" }, 400, origin);
      }
      messages = [
        { role: "system", content: "Extract only facts present in the COA. Return valid JSON with lab {name, accreditation}, client, product {name, form, batch, units_per_package, unit_size, unit_size_unit, net_content, net_content_unit}, dates {collected, tested, reported}, cannabinoids [{name, value, raw, unit}], reported_totals {total_thc, total_cbd}, and panels [{category, name, status, analytes: [{name, result, limit, unit, status}]}]. Use null for missing scalar values and empty arrays for missing rows. Do not infer values." },
        { role: "user", content: body.text },
      ];
    }
    if (!await consumeLimit(request, env)) return json({ error: "daily_limit_reached" }, 429, origin);
    try {
      const result = await env.AI.run(MODEL, { messages, max_tokens: path === "/chat" ? 700 : 4000 });
      if (typeof result?.response !== "string") return json({ error: "model_unavailable" }, 502, origin);
      return json({ response: result.response }, 200, origin);
    } catch {
      return json({ error: "model_unavailable" }, 502, origin);
    }
  },
};
