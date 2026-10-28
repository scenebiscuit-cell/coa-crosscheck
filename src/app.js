/* COA Crosscheck: page logic. Uses CORE (core.js), RULES (rules.js), GLOSSARY (glossary.js), SAMPLES (samples.js). */
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // numbers in findings get their own color and font so they stand out from the words.
  // Runs on already-escaped text: skips digits inside entities (&#39;), names like Δ9-THC, and rule numbers (19 CSR 100-1.110).
  const NUM = /(?<![\p{L}\p{N}#&;§.\-\/)(])((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:\s?(?:%|mg\/g|mg\/mL|mg|g|ppm|ppb|µg\/g|µg\/kg|CFU\/g|aw|mL|oz))?)(?![\p{L}\p{N}]|\s?(?:CSR|TAC|CCR|U\.S\.C)\b|-\d)/gu;
  const nums = (html) => html.replace(NUM, '<span class="n">$1</span>');
  const F = CORE.fmt;
  const remember = {
    get(k) { try { return localStorage.getItem("coax." + k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem("coax." + k, v); } catch { /* storage blocked */ } },
  };

  const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const transition = (fn) => (document.startViewTransition && !reduceMotion()) ? document.startViewTransition(fn) : fn();

  /* ---------- theme: system, light, dark ---------- */
  const THEMES = ["system", "light", "dark"];
  function applyTheme(t) {
    if (t === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
    $("themeLbl").textContent = t[0].toUpperCase() + t.slice(1);
    $("themeBtn").setAttribute("aria-label", `Color theme: ${t === "system" ? "match system" : t}. Activate to change.`);
    syncPreviewTheme();
  }
  // the card preview follows this page's theme switch, not just the system setting
  function syncPreviewTheme() {
    const pv = document.getElementById("s-preview"), t = document.documentElement.dataset.theme;
    if (pv) { if (t) pv.setAttribute("theme", t); else pv.removeAttribute("theme"); }
  }
  let theme = THEMES.includes(remember.get("theme")) ? remember.get("theme") : "system";
  applyTheme(theme);
  $("themeBtn").onclick = () => { theme = THEMES[(THEMES.indexOf(theme) + 1) % 3]; remember.set("theme", theme); transition(() => applyTheme(theme)); };

  /* ---------- section nav: highlight the section in view ---------- */
  const navLinks = [...document.querySelectorAll(".secnav-links a")];
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) navLinks.forEach(a => a.toggleAttribute("aria-current", a.getAttribute("href") === "#" + e.target.id));
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["check", "report", "rulebook", "method"].forEach(id => { const el = $(id); if (el) io.observe(el); });
  }

  const state = { data: null, result: null, source: null, sampleId: null, sampleText: null, images: [], fileName: null, ctl: null, sample: null, canImages: false,
    ruleset: RULES.byId(remember.get("ruleset") || "TX-MED") };

  /* ---------- tooltips: any element with data-tip="<glossary key>" ---------- */
  const tipEl = document.createElement("div");
  tipEl.className = "tip-pop"; tipEl.id = "tip-pop"; tipEl.setAttribute("role", "tooltip"); tipEl.hidden = true;
  document.body.append(tipEl);
  let tipFor = null;
  function showTip(el) {
    const g = GLOSSARY.get(el.dataset.tip);
    if (!g) return;
    tipFor = el;
    tipEl.innerHTML = `<b>${esc(g.title)}</b><span>${esc(g.body)}</span>`;
    tipEl.hidden = false;
    el.setAttribute("aria-describedby", "tip-pop");
    const r = el.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    const vw = document.documentElement.clientWidth;
    let left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), vw - w - 8);
    let top = r.top - h - 8; if (top < 8) top = r.bottom + 8;
    tipEl.style.left = left + window.scrollX + "px"; tipEl.style.top = top + window.scrollY + "px";
  }
  function hideTip() { if (tipFor) tipFor.removeAttribute("aria-describedby"); tipFor = null; tipEl.hidden = true; }
  document.addEventListener("mouseover", (e) => { const t = e.target.closest?.("[data-tip]"); if (t && t !== tipFor) showTip(t); else if (!t && tipFor) hideTip(); });
  document.addEventListener("focusin", (e) => { const t = e.target.closest?.("[data-tip]"); if (t) showTip(t); });
  document.addEventListener("focusout", (e) => { if (e.target.closest?.("[data-tip]")) hideTip(); });
  document.addEventListener("click", (e) => { const t = e.target.closest?.("[data-tip]"); if (t) { tipFor === t ? hideTip() : showTip(t); } else hideTip(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideTip(); });
  window.addEventListener("scroll", hideTip, { passive: true });
  const tip = (text, key) => { const k = key || GLOSSARY.lookup(text); return k && GLOSSARY.has(k) ? `<span class="term" tabindex="0" data-tip="${k}">${esc(text)}</span>` : esc(text); };

  /* ---------- rulebook picker ---------- */
  const sel = $("ruleset");
  const groups = {};
  for (const r of RULES.SETS) (groups[r.state] = groups[r.state] || []).push(r);
  sel.innerHTML = Object.entries(groups).map(([st, list]) => `<optgroup label="${esc(st)}">${list.map(r => `<option value="${r.id}">${esc(r.state === "Federal hemp" ? "Federal hemp (all states)" : `${r.state} · ${r.market}`)}</option>`).join("")}</optgroup>`).join("");
  sel.value = state.ruleset.id;
  sel.onchange = () => {
    state.ruleset = RULES.byId(sel.value); remember.set("ruleset", sel.value);
    transition(() => { renderRuleset(); if (state.data) renderResults(); });
  };

  function renderRuleset() {
    const rs = state.ruleset;
    $("limits").innerHTML = rs.headline.map(h => `<div class="limit"><b>${esc(h.big)}</b><span>${esc(h.small)}</span></div>`).join("");
    $("rbProgram").textContent = rs.program;
    $("navRule").textContent = rs.state === "Federal hemp" ? "Federal hemp" : `${rs.state} · ${rs.market}`;
    // the tall trichome dresses for the state: cowboy hat (TX), government fedora (federal hemp),
    // ski beanie (CO), riverboat captain's cap (MO), and a grizzly cub on its head (CA)
    const HATS = { TX: "cowboy", US: "fedora", CO: "beanie", MO: "captain", CA: "bear" };
    window.HeaderArt?.hat(HATS[rs.stateCode] || false);
    $("rbMeta").textContent = `${rs.regulator} · rules verified ${new Date(rs.verified + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    // sample tones follow the selected rules
    for (const b of sWrap.children) {
      const smp = SAMPLES.find(x => x.id === b.dataset.id);
      const v = CORE.evaluate(CORE.parseText(smp.text), rs).verdict;
      b.dataset.tone = { clear: "pass", review: "warn", hold: "fail" }[v];
      b.hidden = !!(smp.notIn && smp.notIn.includes(rs.id));   // e.g. no flower or concentrate samples for Texas
      b.querySelector("span").textContent = { clear: "Clears here", review: "Needs review here", hold: "Holds here" }[v];
    }
    renderRulebook();
  }

  function cite(c) { return c ? ` <cite><a href="${c.url}" target="_blank" rel="noopener">${esc(c.text)}</a></cite>` : ""; }
  function renderRulebook() {
    const rs = state.ruleset;
    const lim = (rs.limits || []).map(l => `<tr><td>${esc(l.label)}${l.effective ? ` <span class="soon">from ${new Date(l.effective + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>` : ""}</td>
      <td class="num">${l.grams != null ? `${l.grams} g` : `${l.mg >= 1000 ? F(l.mg, 0) : F(l.mg, l.mg < 1 ? 1 : 0)} mg`}</td><td>${esc(l.forms === "*" ? "All products" : l.forms.map(formLabel).join(", "))}</td><td>${cite(l.cite)}</td></tr>`).join("");
    const metals = rs.metals ? (() => {
      const routes = Object.keys(rs.metals.table).filter((r, i, a) => i === 0 || JSON.stringify(rs.metals.table[r]) !== JSON.stringify(rs.metals.table[a[i - 1]]));
      const names = Object.keys(rs.metals.table.inhaled);
      return `<div class="tbl"><table><thead><tr><th>Use</th>${names.map(n => `<th>${tip(n[0].toUpperCase() + n.slice(1), n)}</th>`).join("")}</tr></thead><tbody>
        ${routes.map(r => `<tr><td>${tip(rs.metals.routeLabels[r], r)}</td>${names.map(n => `<td class="num">${rs.metals.strict ? "&lt; " : "≤ "}${rs.metals.table[r][n]}</td>`).join("")}</tr>`).join("")}
        </tbody></table></div><p class="rbnote">${tip(rs.metals.unit)} ${cite(rs.metals.cite)}</p>`;
    })() : `<p class="rbnote">No state table. Results are compared to the limits printed on the COA.</p>`;
    const micro = rs.microbes ? `<ul class="rblist">${rs.microbes.required.map(o => `<li>${tip(o.label, o.org)} must be absent in 1 g${o.when ? (o.reviewOtherwise ? " (required for inhaled products; confirm for others)" : " (inhaled products)") : ""}</li>`).join("")}
        ${rs.microbes.tymc ? `<li>${tip("Total yeast and mold", "tymc")} under ${F(rs.microbes.tymc, 0)} ${tip("CFU/g")}</li>` : ""}</ul>${cite(rs.microbes.cite)}` : "";
    const myco = rs.mycotoxins ? `<ul class="rblist">${rs.mycotoxins.total ? `<li>${tip("Aflatoxins", "aflatoxin")} + ${tip("ochratoxin A", "ochratoxin")} combined ≤ ${rs.mycotoxins.total} ${tip(rs.mycotoxins.unit)}</li>`
        : `<li>${tip("Aflatoxins", "aflatoxin")} (B1, B2, G1, G2) ${rs.mycotoxins.strict ? "under" : "≤"} ${rs.mycotoxins.aflatoxins} ${tip(rs.mycotoxins.unit)}</li><li>${tip("Ochratoxin A", "ochratoxin")} ${rs.mycotoxins.strict ? "under" : "≤"} ${rs.mycotoxins.ochratoxin} ${tip(rs.mycotoxins.unit)}</li>`}</ul>${cite(rs.mycotoxins.cite)}` : "";
    const water = rs.water ? `<ul class="rblist"><li>Flower and pre-rolls ≤ ${rs.water.flower} ${tip("aw")}</li>${rs.water.hashKief ? `<li>Hash and kief ≤ ${rs.water.hashKief} ${tip("aw")}</li>` : ""}${rs.water.solidEdible ? `<li>${rs.stateCode === "MO" ? "Solid infused products (edibles, lozenges, capsules)" : "Solid edibles"} ≤ ${rs.water.solidEdible} ${tip("aw")}</li>` : ""}</ul>${rs.water.moisture ? `<p class="rbnote">${esc(rs.water.moisture)}</p>` : ""}${cite(rs.water.cite)}` : "";
    const pretty = (k) => ({ "12dichloroethane": "1,2-Dichloroethane", isopropylalcohol: "Isopropyl alcohol", ethylacetate: "Ethyl acetate", ethylether: "Ethyl ether",
      ethyleneoxide: "Ethylene oxide", methylenechloride: "Methylene chloride", mgk264: "MGK-264", kresoximmethyl: "Kresoxim-methyl", methylparathion: "Methyl parathion",
      piperonylbutoxide: "Piperonyl butoxide", chlormequatchloride: "Chlormequat chloride", vitamineacetate: "Vitamin E acetate (inhalables)" }[k] || k[0].toUpperCase() + k.slice(1));
    const solv = rs.solvents ? (() => {
      const t = rs.solvents.table, names = Object.keys(t.inhaled), split = t.inhaled !== t.oral;
      return `<details class="rbmore"><summary>${tip("Residual solvent", "residual_solvents")} limits (${names.length})</summary><div class="tbl"><table><thead><tr><th>Solvent</th>${split ? "<th>Inhaled</th><th>Infused / oral</th>" : "<th>Limit</th>"}</tr></thead><tbody>
        ${names.map(n => `<tr><td>${esc(pretty(n))}</td><td class="num">${rs.solvents.strict ? "&lt; " : "≤ "}${F(t.inhaled[n], 0)}</td>${split ? `<td class="num">≤ ${F(t.oral[n], 0)}</td>` : ""}</tr>`).join("")}
        </tbody></table></div><p class="rbnote">${tip("ppm")}${rs.solvents.exempt ? ". Ethanol above the limit is allowed in products that aren't inhaled." : ""} ${cite(rs.solvents.cite)}</p></details>`;
    })() : "";
    const pest = rs.pesticides ? (() => {
      const e = Object.entries(rs.pesticides.table).filter(([k]) => !["ddvp", "permethrin"].includes(k));
      return `<details class="rbmore"><summary>${tip("Pesticide", "pesticides")} action limits (${e.length})</summary><div class="tbl"><table><thead><tr><th>Analyte</th><th>Fails above</th></tr></thead><tbody>
        ${e.map(([k, v]) => `<tr><td>${esc(pretty(k))}</td><td class="num">${v} ppm</td></tr>`).join("")}</tbody></table></div>${cite(rs.pesticides.cite)}</details>`;
    })() : "";
    const prof = rs.profile ? `<h4>Required cannabinoid profile</h4><p class="rbnote">${rs.profile.keys.map(k => tip(rs.profile.labels[k], k)).join(", ")}. ${esc(rs.profile.note)}${cite(rs.profile.cite)}</p>` : "";
    // each required test gets its category color (see [data-cat] in styles.css)
    const catOf = (k) => ["potency", "thc", "cbd"].includes(k) ? "potency" : k === "mold" ? "microbials" : k === "water_activity" ? "moisture" : k;
    const panel = rs.panel ? `<ul class="rblist">${rs.panel.items.map(it => `<li data-cat="${catOf(it.key)}">${tip(it.label, ["potency", "thc", "cbd"].includes(it.key) ? "potency" : it.key === "water_activity" ? "water_activity" : it.key)}${it.level === "review" ? " <span class=\"soon\">confirm</span>" : ""}${it.when ? " <span class=\"soon\">some products</span>" : ""}</li>`).join("")}</ul>${cite(rs.panel.cite)}${rs.panel.note ? `<p class="rbnote">${esc(rs.panel.note)}</p>` : ""}`
      : `<p class="rbnote">${esc(rs.panelNote || "")}</p>`;
    $("rulebook").innerHTML = `
      <div class="rb-head"><div><div class="eyebrow">Rulebook</div><h2>${esc(rs.state === "Federal hemp" ? "Federal hemp" : rs.state)} <span>${esc(rs.market)}</span></h2></div>
        <p>${esc(rs.program)} · ${esc(rs.regulator)}</p></div>
      <div class="rb-grid">
        <section><h3>${tip("THC limits", "per_package")}</h3>${lim ? `<div class="tbl"><table><thead><tr><th>Limit</th><th>Max</th><th>Applies to</th><th>Source</th></tr></thead><tbody>${lim}</tbody></table></div>` : ""}
          ${rs.limitsNote ? `<p class="rbnote">${esc(rs.limitsNote)}</p>` : ""}${(rs.limits || []).filter(l => l.note).map(l => `<p class="rbnote">${esc(l.note)}</p>`).join("")}
          <h4>How ${tip("Total THC", "total_thc")} is counted</h4><p class="rbnote">${esc(rs.totalThcText)}</p>${rs.altThc ? `<p class="rbnote"><span class="soon">unconfirmed</span> ${esc(rs.altThc.note)}</p>` : ""}
          ${rs.labelVariance ? `<h4>${tip("Label variance", "label_variance")}</h4><p class="rbnote">${esc(rs.labelVariance.text)}${cite(rs.labelVariance.cite)}</p>` : ""}</section>
        <section><h3>Required tests</h3>${panel}${prof}${solv}${pest}</section>
        ${rs.metals || rs.panel ? `<section><h3 data-cat="heavy_metals">${tip("Heavy metals", "heavy_metals")}</h3>${metals}</section>` : ""}
        ${micro || myco || water ? `<section><h3 data-cat="microbials">${tip("Microbials", "microbials")} and ${tip("mycotoxins", "mycotoxins")}</h3>${micro}${myco}${water ? `<h4>${tip("Water activity", "water_activity")}</h4>${water}` : ""}</section>` : ""}
        ${rs.synthetic ? `<section><h3>Cannabinoid origin</h3><p class="rbnote">${esc(rs.synthetic.text)}${rs.synthetic.effective ? ` Effective ${new Date(rs.synthetic.effective + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.` : ""}${rs.synthetic.status === "warn" ? " The checker flags these for review." : ""}${cite(rs.synthetic.cite)}</p></section>` : ""}
      </div>
      <p class="rb-sources">Sources: ${rs.sources.map(c => `<a href="${c.url}" target="_blank" rel="noopener">${esc(c.text)}</a>`).join(" · ")}</p>`;
  }
  const FORM_LABELS = { smokable: "flower and pre-rolls", inhalation: "vapes and inhalers", concentrate: "concentrates", edible: "edibles", tincture: "tinctures", capsule: "capsules", ode: "orally dissolving", topical: "topicals", suppository: "suppositories", other: "other" };
  const formLabel = (f) => FORM_LABELS[f] || f;

  /* ---------- samples ---------- */
  const sWrap = $("samples");
  for (const s of SAMPLES) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "sample"; b.dataset.id = s.id; b.setAttribute("aria-pressed", "false");
    b.innerHTML = `<b>${esc(s.label)}</b><span>${esc(s.hint)}</span>`;
    b.onclick = () => loadSample(s.id);
    sWrap.append(b);
  }
  function markSample(id) { for (const b of sWrap.children) b.setAttribute("aria-pressed", String(b.dataset.id === id)); }
  function loadSample(id) {
    const s = SAMPLES.find(x => x.id === id);
    clearAttachment();
    $("coa").value = s.text;
    state.sampleId = id; state.sampleText = s.text;
    markSample(id);
    setStatus("");
    showData(CORE.parseText(s.text), "Sample · built-in parser");
  }
  $("coa").addEventListener("input", () => { if ($("coa").value !== state.sampleText) { state.sampleId = null; markSample(null); } });

  /* ---------- status ---------- */
  function setStatus(msg, err) { const el = $("status"); el.textContent = msg; el.classList.toggle("err", !!err); }

  /* ---------- Claude availability ---------- */
  (async () => {
    try {
      const sample = await window.claude?.use?.("sample");
      if (!sample) throw 0;
      state.sample = sample;
      refreshRunLabel();
      $("how").innerHTML = "<b>How it works.</b> Claude reads the document and fills in a fixed set of fields. The compliance calls come from rules written in code, each tied to a statute or rule, so the same COA always gets the same verdict. You can correct any field the reader got wrong.";
      const lim = await sample.limits().catch(() => null);
      state.canImages = !!lim?.images;
      refreshRunLabel();
    } catch {
      state.sample = null;
    }
  })();

  /* ---------- fetch from a link (Claude desktop app's built-in browser) ---------- */
  const HOST = "host:claude_browser";
  (async () => {
    try {
      const mcp = await window.claude?.use?.("mcp");
      if (!mcp) return;
      const list = await mcp.listTools(HOST).catch(() => null);
      if (!list?.servers?.some(s => s.server === HOST)) return;
      state.mcp = mcp;
      $("fetchForm").hidden = false;
    } catch { /* stays hidden */ }
  })();

  function rawText(res) {
    const p = res?.payload;
    if (typeof p === "string") return p;
    if (p && typeof p === "object") {
      for (const k of ["text", "content", "pageText", "page_text"]) if (typeof p[k] === "string") return p[k];
    }
    return (res?.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  }
  // get_page_text wraps the page in "Title/URL/Source element ---" and a trailing "Tab Context:" block
  function pageText(res) {
    let t = rawText(res);
    const head = t.indexOf("\n---\n");
    if (/^\s*Title:/.test(t) && head !== -1) t = t.slice(head + 5);
    const tail = t.search(/\n\s*Tab Context:/);
    if (tail !== -1) t = t.slice(0, tail);
    return t.trim();
  }
  function b64ToBlob(data, type) {
    const bin = atob(data); const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new Blob([u], { type: type || "image/png" });
  }
  $("fetchForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    let url = $("url").value.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    let host;
    try { host = new URL(url).hostname; if (!host.includes(".")) throw 0; } catch { setStatus("Enter a full web address, like https://lab.example.com/coa/123.", true); return; }
    const btn = $("fetchBtn");
    btn.disabled = true;
    clearAttachment(); state.sampleId = null; markSample(null);
    setStatus(`Opening ${host} in the Claude browser…`);
    try {
      await state.mcp.callTool(HOST, "navigate", { url });
      let text = pageText(await state.mcp.callTool(HOST, "get_page_text", { max_chars: 60000 }, { cache: false }));
      if (text.replace(/\s/g, "").length < 200) {        // portals that render late: one more look
        await new Promise(r => setTimeout(r, 2500));
        text = pageText(await state.mcp.callTool(HOST, "get_page_text", { max_chars: 60000 }, { cache: false }));
      }
      if (text.replace(/\s/g, "").length < 200) {
        setStatus(/\.pdf(\?|#|$)/i.test(url)
          ? `That link opens a PDF, which the Claude browser shows as an image. Click the download arrow at the top right of the PDF in the Claude browser, then drop the file in above. The checker reads PDFs directly.`
          : `${host} didn't return readable text. It may need a login or show the COA as a PDF. Download the COA from the Claude browser and drop it in above.`, true);
        return;
      }
      $("coa").value = text.trim(); state.sampleText = null;
      showAttachment(host);
      setStatus(`Pulled the COA text from ${host}. Checking it now…`);
      $("run").click();
    } catch (err) {
      const msg = {
        server_not_connected: "The Claude browser isn't reachable. Open this page in the Claude desktop app and try again.",
        cancelled: "The fetch was declined in the Claude app.",
        approval_required: "The Claude app needs your approval to use its browser. Click Fetch again and choose Allow.",
        not_in_manifest: "Browser access is turned off for this page. You can turn it back on from the page's Permissions menu.",
        blocked_by_policy: "Your organization's settings block this page from using the Claude browser.",
        tool_error: "The Claude browser couldn't open that link. Check the address and try again.",
      }[err?.code] || "Couldn't fetch that link. Try again, or download the COA and drop it in above.";
      const access = err?.code === "tool_error" && /allow|permission|approv/i.test(String(err?.message || ""));
      setStatus(access ? `The Claude browser needs your permission to open ${host}. Allow it when the app asks, then click Fetch again.` : msg, true);
    } finally { btn.disabled = false; }
  });

  /* ---------- local model through Ollama (runs on the viewer's own computer) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem("coa." + k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem("coa." + k, v); } catch { /* storage blocked: settings just aren't remembered */ } },
    remove(k) { try { localStorage.removeItem("coa." + k); } catch { /* storage blocked */ } },
  };
  const VISION_NAME = /(vl\b|vl:|vision|llava|gemma3|minicpm-v|moondream|qwen3-vl|mistral-small3\.[12])/i;
  state.local = null;   // { url, model, vision }

  function imageReader() {
    if (useOllama() && state.local.vision) return "local";
    if (state.sample && state.canImages) return "claude";
    return null;
  }
  function readerName() { return imageReader() === "local" ? state.local.model : "Claude"; }
  function useOllama() { return !!state.local && $("useLocal").checked; }

  /* ---------- Ask about this result: local Ollama, Claude, or an OpenAI-compatible service ---------- */
  state.askWith = "local";
  let askCtl = null;   // the running question's AbortController; the Stop button uses it

  const cloudValue = (id) => $(id).value.trim();
  function cloudConfig(w) {
    return w === "claude" ? { apiKey: cloudValue("claudeKey"), model: cloudValue("claudeModel") }
      : { apiKey: cloudValue("openaiKey"), model: cloudValue("openaiModel"), baseUrl: cloudValue("openaiBase") };
  }
  function askReady(w = state.askWith) {
    if (w === "local") return useOllama();
    const c = cloudConfig(w);
    return !!(c.apiKey && c.model && (w === "claude" || c.baseUrl));
  }
  function askModelName(w) { return w === "local" ? state.local?.model : cloudConfig(w).model; }
  function providerName(w) {
    if (w === "claude") return "Anthropic";
    try { return new URL(cloudValue("openaiBase")).host; } catch { return "your OpenAI-compatible provider"; }
  }
  // keys must never show up in a message, even one the provider sends back
  function scrubKeys(msg) {
    let s = String(msg);
    for (const id of ["claudeKey", "openaiKey"]) { const k = cloudValue(id); if (k.length > 5) s = s.split(k).join("[key hidden]"); }
    return s;
  }

  function updateAsk() {
    if (!$("askForm")) return;
    const w = state.askWith, on = askReady(w), busy = !!askCtl;
    $("askWith").value = w;
    $("askQ").disabled = !on; $("askBtn").disabled = !on || busy;
    $("askState").textContent = on ? askModelName(w) : (w === "local" ? "Local AI off" : "Add your key");
    $("askState").dataset.on = on ? "1" : "";
    $("askNotice").hidden = w === "local";
    if (w !== "local") $("askNotice").textContent = `Your question, this report, and the COA's results are sent to ${providerName(w)} under your account. Their usage charges apply.`;
    if ($("askOut").dataset.used) return;
    $("askOut").innerHTML = on
      ? `<p class="ask-note">Try: <button type="button" class="suggest">Which finding matters most?</button> <button type="button" class="suggest">Explain the THC math</button></p>`
      : w === "local"
        ? `<p class="ask-note">Connect a local AI model under <b>Use a local AI model</b> to ask questions in plain language. Answers use only this report and the selected rulebook, and stay on your computer.</p>`
        : `<p class="ask-note">Add your ${w === "claude" ? "Anthropic" : "provider"} API key${w === "openai" ? ", base URL, and model" : ""} under <b>Use a cloud AI model</b> to ask questions in plain language. Answers use only this report and the selected rulebook.</p>`;
    $("askOut").querySelectorAll(".suggest").forEach(b => b.onclick = () => { $("askQ").value = b.textContent; askQuestion(); });
  }

  // each streamer calls onText(everything so far) and returns { text, refusal, truncated }
  async function streamLocal(am, signal, onText) {
    const { url, model } = state.local;
    let resp;
    try {
      resp = await fetch(url + "/api/chat", { method: "POST", signal, body: JSON.stringify({ model, stream: true, keep_alive: "10m",
        messages: [{ role: "system", content: am.system }, ...am.messages], options: { temperature: 0.2, num_ctx: 16384 } }) });
    } catch (e) { throw e.name === "AbortError" ? e : new Error(`Lost the connection to Ollama at ${url}.`); }
    if (!resp.ok) throw new Error((await resp.text()).slice(0, 160));
    const reader = resp.body.getReader(), dec = new TextDecoder(); let buf = "", text = "";
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true }); const lines = buf.split("\n"); buf = lines.pop();
      for (const line of lines) { if (!line.trim()) continue; const j = JSON.parse(line); if (j.error) throw new Error(j.error); text += j.message?.content || ""; }
      onText(text);
    }
    return { text };
  }

  async function streamCloud(w, am, signal, onText) {
    const cfg = cloudConfig(w);
    const req = CORE.askRequest(w, cfg, am);   // throws a plain-language Error for a missing key, model, or unsafe address
    let resp;
    try {
      // the key goes only in req.headers, and only to the provider the visitor chose
      resp = await fetch(req.url, { method: "POST", headers: req.headers, body: req.body, signal, credentials: "omit", referrerPolicy: "no-referrer" });
    } catch (e) {
      if (e.name === "AbortError") throw e;
      throw new Error(`Your browser couldn't reach ${req.host}. Check your internet connection and the address. If both are right, the service may not allow requests made straight from a web page (a CORS block), and this site can't work around that.`);
    }
    if (!resp.ok) throw new Error(CORE.askErrorMessage(w, resp.status, (await resp.text()).slice(0, 2000), cfg.model));
    const parse = w === "claude" ? CORE.anthropicStreamEvent : CORE.openaiStreamEvent;
    const reader = resp.body.getReader(), dec = new TextDecoder(); let buf = "", text = "", refusal = false, truncated = false;
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      const split = CORE.sseSplit(buf + dec.decode(value, { stream: true })); buf = split.rest;
      for (const ev of split.events) {
        const r = parse(ev);
        if (r.error) throw new Error(`${providerName(w)} stopped the answer: ${r.error}`);
        if (r.text) text += r.text;
        if (r.refusal) refusal = true;
        if (r.truncated) truncated = true;
      }
      onText(text);
    }
    return { text, refusal, truncated };
  }

  async function askQuestion() {
    const q = $("askQ").value.trim(), w = state.askWith;
    if (!q || !askReady(w) || askCtl) return;
    const am = CORE.askMessages(CORE.askContext({ ruleset: state.ruleset, result: state.result, data: state.data }), q);
    const out = $("askOut"); out.dataset.used = "1";
    out.innerHTML = `<p class="ask-q">${esc(q)}</p><p class="ask-a" id="askA">Thinking…</p>`;
    askCtl = new AbortController();
    $("askStop").hidden = false; updateAsk();
    let text = "";
    const onText = (t) => { text = t; $("askA").textContent = t || "Thinking…"; };
    try {
      const r = await (w === "local" ? streamLocal : streamCloud.bind(null, w))(am, askCtl.signal, onText);
      text = r.text.trim();
      $("askA").textContent = text || (r.refusal ? "The model declined to answer this question." : "The model didn't return an answer. Try rephrasing.");
      if (text && r.refusal) $("askA").textContent += "\n\n(The model stopped early and declined to finish.)";
      if (text && r.truncated) $("askA").textContent += "\n\n(The answer hit the length limit and was cut off.)";
    } catch (e) {
      $("askA").textContent = e.name === "AbortError" ? (text.trim() ? text.trim() + "\n\n(Stopped.)" : "Stopped.") : scrubKeys(w === "local" ? `The model couldn't answer: ${e.message}` : e.message);
    } finally {
      askCtl = null; $("askStop").hidden = true; updateAsk();
    }
  }

  /* ---------- cloud AI panel: keys stay in this tab unless "Remember on this device" is on ---------- */
  const CLOUD_FIELDS = ["claudeKey", "claudeModel", "openaiKey", "openaiModel", "openaiBase"];
  function saveCloud() { for (const id of CLOUD_FIELDS) store.set("cloud." + id, $(id).value); store.set("cloud.remember", "1"); }
  function forgetCloud() { for (const id of CLOUD_FIELDS) store.remove("cloud." + id); store.remove("cloud.remember"); }
  function updateCloudState() {
    const any = askReady("claude") || askReady("openai");
    $("cloudState").textContent = any ? "Ready" : "Off";
    $("cloudState").dataset.on = any ? "1" : "";
  }
  if (store.get("cloud.remember") === "1") {
    for (const id of CLOUD_FIELDS) { const v = store.get("cloud." + id); if (v) $(id).value = v; }
    $("cloudRemember").checked = true;
  }
  updateCloudState();
  for (const id of CLOUD_FIELDS) $(id).addEventListener("input", () => {
    if ($("cloudRemember").checked) saveCloud();
    updateCloudState(); updateAsk();
  });
  $("cloudRemember").onchange = () => {
    const el = $("cloudStatus"); el.classList.remove("err");
    if ($("cloudRemember").checked) {
      saveCloud();
      const kept = store.get("cloud.remember") === "1";
      if (!kept) { $("cloudRemember").checked = false; el.classList.add("err"); }
      el.textContent = kept ? "Saved on this device. Turn this off to delete it." : "This browser blocked saving, so your keys will only be kept until you close or reload this tab.";
    } else {
      forgetCloud();
      el.textContent = "Deleted from this device. Your keys stay in this tab until you close or reload it.";
    }
  };

  function refreshRunLabel() {
    if (useOllama()) {
      $("run").textContent = `Read with ${state.local.model} and check`;
      $("runLocal").hidden = false;
    } else if (state.sample) {
      $("run").textContent = "Read with Claude and check";
      $("runLocal").hidden = false;
    } else {
      $("run").textContent = "Check COA";
      $("runLocal").hidden = true;
    }
    updateAsk();
    const photos = !!imageReader();
    $("drop").querySelector("span").textContent = photos ? "Or drop a PDF, text file, or photo of a COA, or" : "Or drop a PDF or text file, or";
  }

  function ollamaBase() {
    let u = $("ollamaUrl").value.trim() || "http://localhost:11434";
    if (!/^https?:\/\//i.test(u)) u = "http://" + u;
    return u.replace(/\/+$/, "");
  }
  function setLocalStatus(msg, kind) {
    const el = $("ollamaStatus"); el.textContent = msg;
    el.classList.toggle("err", kind === "err");
    $("localState").textContent = state.local ? "Connected" : "Off";
    $("localState").dataset.on = state.local ? "1" : "";
  }

  $("ollamaUrl").value = store.get("ollamaUrl") || "http://localhost:11434";
  if (/^https?:$/.test(location.protocol)) $("originCmd").textContent = `setx OLLAMA_ORIGINS "${location.origin}"`;
  $("ollamaConnect").onclick = connectOllama;
  $("ollamaModel").onchange = async () => {
    if (!state.local) return;
    state.local.model = $("ollamaModel").value;
    store.set("ollamaModel", state.local.model);
    state.local.vision = await hasVision(ollamaBase(), state.local.model);
    setLocalStatus(`Using ${state.local.model}${state.local.vision ? " (reads photos and scans)" : " (text and PDFs with text)"}.`);
    refreshRunLabel();
  };
  $("useLocal").onchange = refreshRunLabel;

  async function hasVision(base, model) {
    try {
      const r = await fetch(base + "/api/show", { method: "POST", body: JSON.stringify({ model }), signal: AbortSignal.timeout(5000) });
      if (r.ok) { const j = await r.json(); if (Array.isArray(j.capabilities)) return j.capabilities.includes("vision"); }
    } catch { /* older Ollama: fall back to the name */ }
    return VISION_NAME.test(model);
  }

  async function connectOllama() {
    const base = ollamaBase();
    store.set("ollamaUrl", base);
    $("ollamaConnect").disabled = true;
    setLocalStatus(`Connecting to ${base}…`);
    try {
      const r = await fetch(base + "/api/tags", { signal: AbortSignal.timeout(6000) });
      if (!r.ok) throw new Error("http " + r.status);
      const models = ((await r.json()).models || []).map(m => m.name || m.model).filter(Boolean);
      if (!models.length) { state.local = null; setLocalStatus("Ollama is running but has no models yet. In a terminal, run: ollama pull qwen2.5:14b", "err"); return; }
      const saved = store.get("ollamaModel");
      const pick = models.find(m => m === saved) || models.find(m => /^qwen2\.5:14b/.test(m)) || models.find(m => /qwen|llama|mistral|gemma/i.test(m)) || models[0];
      $("ollamaModel").innerHTML = models.map(m => `<option ${m === pick ? "selected" : ""}>${esc(m)}</option>`).join("");
      $("ollamaModel").disabled = false; $("useLocal").disabled = false; $("useLocal").checked = true;
      state.local = { url: base, model: pick, vision: await hasVision(base, pick) };
      store.set("ollamaModel", pick);
      setLocalStatus(`Connected. Using ${pick}${state.local.vision ? " (reads photos and scans)" : " (text and PDFs with text)"}. The COA stays on this computer.`);
    } catch (e) {
      state.local = null;
      const fromWeb = !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && location.protocol !== "file:";
      setLocalStatus(fromWeb
        ? `Couldn't reach Ollama at ${base}. Check that Ollama is running on this computer, and that it allows this site: set OLLAMA_ORIGINS to ${location.origin} and restart Ollama. Setup steps are at the bottom of the page.`
        : `Couldn't reach Ollama at ${base}. Check that Ollama is running on this computer.`, "err");
    } finally {
      $("ollamaConnect").disabled = false;
      refreshRunLabel();
    }
  }

  // photos and scans go to the model as base64, scaled down so a 12 MP phone photo doesn't swamp it
  async function toBase64Scaled(blob, max = 1800) {
    let src = blob;
    try {
      const bmp = await createImageBitmap(blob);
      const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      src = await new Promise(r => c.toBlob(r, "image/jpeg", 0.92));
    } catch { /* send the original */ }
    const url = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(src); });
    return String(url).split(",")[1];
  }

  async function runOllama(text) {
    const busy = (on) => { $("run").disabled = on; $("runLocal").disabled = on; $("stop").hidden = !on; };
    const { url, model } = state.local;
    const imgs = state.images.length ? state.images : [];
    if (imgs.length && !state.local.vision) { setStatus(`${model} can't read images. Pick a vision model such as qwen2.5vl, or paste the COA text.`, true); return; }
    state.ctl = new AbortController();
    busy(true);
    const started = Date.now();
    const body = text ? text.slice(0, 60000) : `(The COA is in the attached image${imgs.length > 1 ? "s" : ""}. Read it from the image${imgs.length > 1 ? "s" : ""}.)`;
    const prompt = CORE.extractionPrompt(body);
    const need = Math.ceil(prompt.length / 3) + 3500 + imgs.length * 3000;
    const num_ctx = [8192, 16384, 32768].find(n => n >= need) || 32768;
    setStatus(`Starting ${model}… the first run can take 20–60 seconds while the model loads.`);
    let out = "";
    const tick = setInterval(() => {
      const secs = Math.round((Date.now() - started) / 1000);
      setStatus(out ? `${model} is reading the COA… ${out.length.toLocaleString()} characters written, ${secs}s` : `Waiting for ${model} to start… ${secs}s`);
    }, 1000);
    const send = async (format) => {
      const msg = { role: "user", content: prompt };
      if (imgs.length) msg.images = await Promise.all(imgs.map(b => toBase64Scaled(b)));
      return fetch(url + "/api/chat", {
        method: "POST", signal: state.ctl.signal,
        body: JSON.stringify({ model, messages: [msg], stream: true, format, keep_alive: "10m",
          options: { temperature: 0, num_ctx } }),
      });
    };
    try {
      let r = await send(CORE.extractionSchema());
      if (!r.ok) {
        const t = await r.text();
        if (r.status === 400 && /format|schema|grammar/i.test(t)) r = await send("json");   // older Ollama: plain JSON mode
        else if (r.status === 404 || /not found/i.test(t)) throw new Error(`Model ${model} isn't installed. Run: ollama pull ${model}`);
        else throw new Error(`Ollama returned an error: ${t.slice(0, 200)}`);
        if (!r.ok) throw new Error(`Ollama returned an error: ${(await r.text()).slice(0, 200)}`);
      }
      const reader = r.body.getReader(), dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          const j = JSON.parse(line);
          if (j.error) throw new Error(j.error);
          out += j.message?.content || "";
        }
      }
      if (buf.trim()) { const j = JSON.parse(buf); if (j.error) throw new Error(j.error); out += j.message?.content || ""; }
      let raw;
      try { raw = JSON.parse(out); }
      catch { const a = out.indexOf("{"), b = out.lastIndexOf("}"); raw = a !== -1 && b > a ? JSON.parse(out.slice(a, b + 1)) : null; }
      if (!raw) throw new Error(`${model}'s answer couldn't be read as data. Try again, or try a larger model.`);
      const d = CORE.sanitizeExtraction(raw);
      const secs = Math.round((Date.now() - started) / 1000);
      showData(d, `Read by ${model} · local`);
      setStatus(`${model} extracted ${d.cannabinoids.length} cannabinoid rows and ${d.panels.length} test panels in ${secs}s. Local models misread more often than large hosted ones, so compare the "Lab results as read" table to the COA before relying on the verdict.`);
    } catch (e) {
      if (e?.name === "AbortError") setStatus("Stopped.");
      else if (e instanceof TypeError) setStatus(`Lost the connection to Ollama at ${url}. Check that it's still running.`, true);
      else setStatus(e?.message || "The local model couldn't read this COA.", true);
    } finally { clearInterval(tick); busy(false); }
  }

  /* ---------- files ---------- */
  const drop = $("drop");
  $("pick").onclick = () => $("file").click();
  $("file").onchange = (e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; };
  drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); const f = e.dataTransfer?.files?.[0]; if (f) handleFile(f); });

  function clearAttachment() { state.images = []; state.fileName = null; state.fromScreen = false; $("attached").innerHTML = ""; }
  function showAttachment(label) {
    $("attached").innerHTML = `<span class="chip">${esc(label)} <button type="button" aria-label="Remove attachment">×</button></span>`;
    $("attached").querySelector("button").onclick = () => { clearAttachment(); setStatus(""); };
  }

  let pdfReady = null;
  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("load")); document.head.append(s); }); }
  function loadPdf() {
    if (!pdfReady) pdfReady = (async () => {
      const base = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
      await loadScript(base + "pdf.worker.min.js");   // runs pdf.js on the main thread (no cross-origin Worker)
      await loadScript(base + "pdf.min.js");
      return window.pdfjsLib;
    })();
    return pdfReady;
  }

  async function handleFile(f) {
    clearAttachment();
    state.sampleId = null; markSample(null);
    const type = f.type || "";
    try {
      if (/^image\//.test(type)) {
        if (!imageReader()) { setStatus("Reading photos needs a vision model. Connect a local vision model such as qwen2.5vl under \"Use a local AI model,\" or paste the COA text instead.", true); return; }
        state.images = [f]; state.fileName = f.name;
        $("coa").value = ""; state.sampleText = null;
        showAttachment(f.name);
        setStatus(`Photo attached. ${readerName()} will read it when you check.`);
        return;
      }
      if (/pdf/.test(type) || /\.pdf$/i.test(f.name)) {
        setStatus("Reading the PDF…");
        const pdfjs = await loadPdf();
        const doc = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
        let text = "";
        for (let i = 1; i <= Math.min(doc.numPages, 12); i++) {
          const page = await doc.getPage(i);
          const tc = await page.getTextContent();
          // group pieces into lines by height on the page, then join them by their gaps (see CORE.joinLine)
          let lastY = null, row = [];
          for (const it of tc.items) {
            if (!it.str) continue;
            const y = Math.round(it.transform[5]);
            if (lastY !== null && Math.abs(y - lastY) > 2) { text += CORE.joinLine(row) + "\n"; row = []; }
            row.push({ str: it.str, x: it.transform[4], w: it.width, h: it.height || Math.abs(it.transform[3]) });
            lastY = y;
          }
          text += CORE.joinLine(row) + "\n\n";
        }
        state.fileName = f.name;
        if (text.replace(/\s/g, "").length > 150) {
          $("coa").value = text.trim(); state.sampleText = null;
          showAttachment(f.name);
          setStatus(`Pulled text from ${doc.numPages} page${doc.numPages > 1 ? "s" : ""}. Check it below, then run the check.`);
        } else {
          // scanned PDF: render pages to images for Claude
          if (!imageReader()) { setStatus("This PDF is a scan with no text layer, so the built-in parser can't read it. Connect a local vision model such as qwen2.5vl, or paste the COA text instead.", true); return; }
          const lim = imageReader() === "claude" ? await state.sample.limits().catch(() => null) : null;
          const max = Math.min(doc.numPages, lim?.images?.maxCount || 3);
          const blobs = [];
          for (let i = 1; i <= max; i++) {
            const page = await doc.getPage(i);
            const vp = page.getViewport({ scale: 2 });
            const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height;
            await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
            blobs.push(await new Promise(r => c.toBlob(r, "image/png")));
          }
          state.images = blobs;
          $("coa").value = ""; state.sampleText = null;
          showAttachment(`${f.name} · ${max} page image${max > 1 ? "s" : ""}`);
          setStatus(`Scanned PDF. ${readerName()} will read the page images when you check.`);
        }
        return;
      }
      // text-ish
      $("coa").value = await f.text(); state.sampleText = null;
      showAttachment(f.name);
      setStatus("File loaded.");
    } catch (e) {
      setStatus("Couldn't read that file. Try pasting the COA text instead.", true);
    }
  }

  /* ---------- run ---------- */
  $("runLocal").onclick = () => runLocal();
  $("run").onclick = () => {
    const text = $("coa").value.trim();
    // unchanged sample text reloads instantly, unless a local model is on: then the model reads it too, for comparison
    if (state.sampleId && text === state.sampleText.trim() && !useOllama()) { loadSample(state.sampleId); return; }
    if (!text && !state.images.length) { setStatus("Paste COA text or attach a file first.", true); return; }
    if (useOllama()) runOllama(text); else if (state.sample) runClaude(text); else runLocal();
  };
  $("stop").onclick = () => state.ctl?.abort();

  function runLocal() {
    const text = $("coa").value;
    if (!text.trim()) { setStatus(state.images.length ? "The built-in parser reads text only. Use an AI reader for photos and scans." : "Paste COA text first.", true); return; }
    const d = CORE.parseText(text);
    const found = d.cannabinoids.length + d.panels.length;
    showData(d, "Built-in parser");
    setStatus(found ? `Parsed ${d.cannabinoids.length} cannabinoid rows and ${d.panels.length} test panels.` : "The built-in parser didn't recognize this layout." + (state.sample || state.local ? " Try the AI reader." : " Connecting a local AI model under \"Use a local AI model\" reads any layout."), !found);
  }

  async function runClaude(text) {
    const busy = (on) => { $("run").disabled = on; $("runLocal").disabled = on; $("stop").hidden = !on; };
    state.ctl = new AbortController();
    busy(true);
    setStatus("Claude is reading the COA… this usually takes 15–60 seconds.");
    const body = text ? text.slice(0, 60000) : `(The COA is in the attached image${state.images.length > 1 ? "s" : ""}. Read it from the image.)`;
    const opts = { signal: state.ctl.signal, modelTier: "default" };
    if (state.images.length) opts.images = state.images;
    try {
      const raw = await state.sample.json(CORE.extractionPrompt(body), opts);
      const d = CORE.sanitizeExtraction(raw);
      showData(d, "Read by Claude");
      setStatus(`Claude extracted ${d.cannabinoids.length} cannabinoid rows and ${d.panels.length} test panels. Correct anything it misread under Product details.` +
        (state.fromScreen ? " These values came from screen captures, where small table text can blur. For a final call, download the PDF and drop it in above." : ""));
    } catch (e) {
      const msg = {
        cancelled: "Stopped.",
        not_granted: "Claude access wasn't allowed for this page. Using the built-in parser instead.",
        sampling_disabled: "Claude isn't available on this account. Using the built-in parser instead.",
        rate_limited: "Too many requests right now. Wait a minute and try again.",
        invalid_json: "Claude's answer couldn't be read as data. Try again.",
        prompt_too_large: "That COA is too long. Paste the potency and contaminant pages only.",
        image_rejected: "That image couldn't be used. Try a clearer photo or a PDF.",
        refused: "Claude declined to read this document.",
        session_expired: "Your session expired. Sign in again and retry.",
      }[e?.code] || "Something went wrong reaching Claude. Try again.";
      setStatus(msg, e?.code !== "cancelled");
      if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled"].includes(e?.code)) {
        state.sample = null; refreshRunLabel();
        if (text) runLocal();
      }
    } finally { busy(false); }
  }

  /* ---------- render ---------- */
  function showData(d, source) {
    state.data = d; state.source = source;
    $("source").textContent = source;
    $("reportBody").innerHTML = shell();
    bindDetails();
    renderResults();
  }

  function shell() {
    const p = state.data.product;
    const opt = (u, cur) => `<option ${u === cur ? "selected" : ""}>${u}</option>`;
    return `
      <div style="display:grid;gap:18px">
        <div class="verdict" id="verdict"></div>
        <dl class="meta" id="meta"></dl>
        <fieldset class="details">
          <legend>Product details</legend>
          <div class="field"><label for="f-form">Product form</label><input id="f-form" value="${esc(p.form ?? "")}" placeholder="e.g. Gummy"></div>
          <div class="field"><label for="f-cat">Category</label><select id="f-cat" class="wide">${categoryOptions(p)}</select></div>
          <div class="field" id="f-ctype-wrap"><label for="f-ctype">Concentrate type</label><input id="f-ctype" value="${esc(p.concentrate_type ?? "")}" placeholder="e.g. Live rosin, shatter, badder"></div>
          <div class="field"><label for="f-size">Dosage unit size</label><div class="row"><input id="f-size" type="number" min="0" step="any" value="${p.unit_size ?? ""}" placeholder="4"><select id="f-sizeu" aria-label="Dosage unit size unit">${opt("g", p.unit_size_unit ?? "g")}${opt("mL", p.unit_size_unit)}</select></div></div>
          <div class="field"><label for="f-units">Units per package</label><input id="f-units" type="number" min="0" step="1" value="${p.units_per_package ?? ""}" placeholder="100"></div>
          <div class="field"><label for="f-net">Net contents</label><div class="row"><input id="f-net" type="number" min="0" step="any" value="${p.net_content ?? ""}" placeholder="400"><select id="f-netu" aria-label="Net contents unit">${opt("g", p.net_content_unit ?? "g")}${opt("mL", p.net_content_unit)}</select></div></div>
          <p class="note">Read from the COA. Edit any value and the checks rerun.</p>
        </fieldset>
        <div class="meters" id="meters"></div>
        <ul class="checks" id="checks"></ul>
        <details class="data"><summary>Lab results as read</summary><div class="inner" id="tables"></div></details>
        <details class="data share" id="shareBox">
          <summary>Show these lab results on a product page</summary>
          <div class="inner">
            <p class="fetchnote">Makes a lab-results card for shoppers. The results travel inside the link or code, so nothing is uploaded or stored. A COA covers one batch, so make a new card when a new batch goes on sale.</p>
            <div class="field"><label for="s-coa">Link to the lab's COA (optional)</label><input id="s-coa" type="url" inputmode="url" spellcheck="false" autocomplete="off" placeholder="https://lab.example.com/coa/batch-123.pdf"></div>
            <div class="sharechecks">
              <label class="toggle" for="s-checked"><input type="checkbox" id="s-checked"> I compared <b>Lab results as read</b> with the COA, and they match</label>
              <label class="toggle" for="s-verdict"><input type="checkbox" id="s-verdict" disabled> Also show the result of the rule check</label>
              <p class="fetchnote" id="s-why">Without this, the card shows the lab's numbers only. A shopper may read a rule check as a guarantee, so include it only after checking the values yourself.</p>
            </div>
            <div class="shareout">
              <div class="field"><label for="s-link">Link: for menu descriptions on Dutchie, Leafly, and similar sites, emails, or QR codes</label>
                <div class="row"><input id="s-link" readonly spellcheck="false"><button type="button" class="btn" data-copy="s-link">Copy</button><a class="btn" id="s-open" target="_blank" rel="noopener">Open</a></div></div>
              <div class="field"><label for="s-code">Code: for pages you control, such as your own website, a Shopify store, or a custom Dutchie Plus site</label>
                <textarea id="s-code" readonly spellcheck="false" rows="4"></textarea>
                <div class="row"><button type="button" class="btn" data-copy="s-code">Copy code</button><label class="toggle" for="s-iframe"><input type="checkbox" id="s-iframe"> Use a frame instead (for site builders that block scripts)</label></div></div>
              <div class="row"><button type="button" class="btn" id="s-json">Download data (JSON) for developers</button><span class="status" id="s-msg" role="status" aria-live="polite"></span></div>
            </div>
            <div class="sharepreview"><div class="eyebrow">Preview</div><coa-card id="s-preview"></coa-card></div>
          </div>
        </details>
        <section class="ask" aria-labelledby="ask-h">
          <div class="ask-head"><h3 id="ask-h">Ask about this result</h3><span class="lstate" id="askState">Local AI off</span></div>
          <div class="askwith"><label for="askWith">Answer with</label>
            <select id="askWith">
              <option value="local">Local model (Ollama)</option>
              <option value="claude">Claude (your Anthropic API key)</option>
              <option value="openai">OpenAI-compatible (your key)</option>
            </select></div>
          <p class="fetchnote cloudnotice" id="askNotice" hidden></p>
          <form id="askForm" class="askrow">
            <label class="sr" for="askQ">Your question</label>
            <input id="askQ" type="text" autocomplete="off" placeholder="Why does this fail in California but not Missouri?">
            <button type="submit" class="btn" id="askBtn">Ask</button>
            <button type="button" class="btn" id="askStop" hidden>Stop</button>
          </form>
          <div class="ask-out" id="askOut" aria-live="polite"></div>
        </section>
        <div class="foot-actions"><button type="button" class="btn" id="copy">Copy findings</button><span class="status" id="copyMsg"></span></div>
      </div>`;
  }

  // product categories the rules distinguish; the first option follows the COA's own wording
  const CATEGORIES = [["smokable", "Flower or pre-roll"], ["concentrate", "Concentrate"], ["inhalation", "Vape or inhaler"],
    ["edible", "Edible"], ["tincture", "Tincture"], ["capsule", "Capsule or tablet"], ["ode", "Orally dissolving"], ["topical", "Topical"],
    ["suppository", "Suppository"], ["other", "Other"]];
  function categoryOptions(p) {
    const rs = state.ruleset, guess = CORE.formClass(p.form);
    const name = (k) => (CATEGORIES.find(c => c[0] === k) || [, "Not set"])[1];
    const notHere = (k) => rs.forms?.[k]?.status === "fail" ? ` (not allowed in ${rs.state})` : "";
    return `<option value="">Auto: ${esc(guess ? name(guess) + notHere(guess) : "not recognized")}</option>` +
      CATEGORIES.map(([k, l]) => `<option value="${k}"${p.category === k ? " selected" : ""}>${esc(l + notHere(k))}</option>`).join("");
  }

  function bindDetails() {
    const p = state.data.product;
    const upd = () => {
      p.form = $("f-form").value.trim() || null;
      p.category = $("f-cat").value || null;
      p.concentrate_type = $("f-ctype").value.trim() || null;
      p.unit_size = CORE.num($("f-size").value); p.unit_size_unit = $("f-sizeu").value;
      p.units_per_package = CORE.num($("f-units").value);
      p.net_content = CORE.num($("f-net").value); p.net_content_unit = $("f-netu").value;
      renderResults();
    };
    for (const id of ["f-form", "f-cat", "f-ctype", "f-size", "f-sizeu", "f-units", "f-net", "f-netu"]) $(id).addEventListener("input", upd);
    $("copy").onclick = copyFindings;
    bindShare();
    $("askForm").addEventListener("submit", (e) => { e.preventDefault(); askQuestion(); });
    $("askWith").value = state.askWith;
    $("askWith").onchange = () => { state.askWith = $("askWith").value; updateAsk(); };
    $("askStop").onclick = () => askCtl?.abort();
    updateAsk();
  }

  function renderResults() {
    const d = state.data, rs = state.ruleset;
    if ($("f-cat") && document.activeElement !== $("f-cat")) $("f-cat").innerHTML = categoryOptions(d.product);   // labels follow the rulebook and the form
    const r = CORE.evaluate(d, rs);
    state.result = r;
    const p = d.product;
    const where = rs.state === "Federal hemp" ? "federal hemp law" : `${rs.state} ${rs.market.toLowerCase()} rules`;

    const head = { hold: ["Hold", `Fails ${where}. Don't release until the failures are resolved.`], review: ["Review", `No hard failures under ${where}, but some items need a person to confirm.`], clear: ["Clear", `Nothing on this COA conflicts with the ${where} checked here.`] }[r.verdict];
    const pills = ["fail", "warn", "pass", "info"].filter(k => r.counts[k]).map(k => `<span class="pill ${k}">${r.counts[k]} ${{ fail: "fail", warn: "to review", pass: "pass", info: "note" }[k]}${(k === "fail" || k === "info") && r.counts[k] > 1 ? "s" : ""}</span>`).join("");
    const changed = $("verdict").dataset.v !== r.verdict || $("verdict").dataset.rs !== rs.id;
    if (changed) window.HeaderArt?.mood(r.verdict);     // the header trichomes react to the verdict
    $("verdict").dataset.v = r.verdict; $("verdict").dataset.rs = rs.id;
    if (changed) { $("verdict").classList.remove("settle"); void $("verdict").offsetWidth; $("verdict").classList.add("settle"); }
    $("verdict").innerHTML = `<div class="stamp">${head[0]}</div><div class="vtext"><div class="eyebrow">${esc(rs.state === "Federal hemp" ? "Federal hemp" : rs.state + " · " + rs.market)}</div><h3>${esc(p.name || "Unnamed product")}</h3><p>${esc(head[1])}</p><div class="counts">${pills}</div></div>`;

    // the concentrate type field shows for concentrates and vapes, filled from the COA when it names one
    if ($("f-ctype-wrap")) $("f-ctype-wrap").hidden = !["concentrate", "inhalation"].includes(r.formClass);
    const kind = [p.form, ["concentrate", "inhalation"].includes(r.formClass) && p.concentrate_type && !(p.form || "").toLowerCase().includes(p.concentrate_type.toLowerCase()) ? p.concentrate_type : null].filter(Boolean).join(" · ");
    const m = [["Batch", p.batch, "batch"], ["Tested", d.dates.tested || d.dates.reported], ["Lab", d.lab.name], ["Product type", kind ? `${kind} (${r.route})` : null, r.route]];
    $("meta").innerHTML = m.map(([k, v, t]) => `<div><dt>${t ? `<span class="term" tabindex="0" data-tip="${t}">${k}</span>` : k}</dt><dd>${esc(v || "Not on COA")}</dd></div>`).join("");

    // meters: one per THC limit that applies to this product in this state
    $("meters").innerHTML = r.meters.map(mt => {
      const na = mt.value === null, noLim = mt.limit === null;
      const st = na ? "na" : noLim ? "nolimit" : mt.value > mt.limit ? (mt.effective ? "soon" : "fail") : "pass";
      const pct = na || noLim ? 0 : Math.min(100, (mt.value / (mt.limit * 1.5)) * 100);
      const u = mt.unit || "mg";
      const limTxt = noLim ? "no state cap" : `limit ${mt.limit >= 1000 ? F(mt.limit, 0) : F(mt.limit, mt.limit < 1 ? 1 : 0)} ${u}${mt.effective ? " from " + new Date(mt.effective + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}`;
      const altOver = mt.alt && mt.limit !== null && mt.alt.value > mt.limit;
      const altLine = mt.alt ? `<div class="altv${altOver ? " over" : ""}"><span>${esc(mt.alt.label)}</span><b>${F(mt.alt.value, mt.alt.value < 10 ? 2 : mt.alt.value < 100 ? 1 : 0)} ${u}</b></div>` : "";
      const tk = /serving|dosage/i.test(mt.label) ? "dosage_unit" : "per_package";
      return `<div class="meter" data-s="${st}"><div class="k"><span class="eyebrow"><span class="term" tabindex="0" data-tip="${tk}">${esc(mt.label)}</span></span><span class="lim">${limTxt}</span></div>
        <div class="val">${na ? "—" : F(mt.value, mt.value < 10 ? 2 : mt.value < 100 ? 1 : 0)} <small>${u}</small>${mt.alt ? ` <small class="valtag">total THC</small>` : ""}</div>${altLine}
        ${noLim ? "" : `<div class="bar ${na ? "na" : mt.value > mt.limit ? "over" : ""}" role="img" aria-label="${esc(mt.label)}: ${na ? "not calculable" : F(mt.value) + " of " + mt.limit + " " + u}"><i style="width:${pct}%"></i><b style="left:${(1 / 1.5) * 100}%"></b></div>`}
        <div class="how2">${esc(mt.how || "Needs serving size or package size")}</div></div>`;
    }).join("");
    $("meters").hidden = !r.meters.length;

    // checks, worst first
    const order = { fail: 0, warn: 1, pass: 2, info: 3 };
    const checks = [...r.checks].sort((a, b) => order[a.status] - order[b.status]);
    $("checks").innerHTML = checks.map((c, i) => `<li class="check" data-s="${c.status}" style="--i:${i}"><span class="tag">${{ fail: "Fail", warn: "Review", pass: "Pass", info: "Note" }[c.status]}</span>
      <h4>${nums(esc(c.title))}</h4><p>${nums(esc(c.detail))}${cite(c.cite)}</p></li>`).join("");

    // lab results, with tooltips on names, results and units
    const keys = rs.totalThcKeys || Object.keys(CORE.THC_WEIGHT);
    const cRows = d.cannabinoids.map(c => {
      const k = CORE.canonCannabinoid(c.name);
      const counts = k && keys.includes(k.key);
      return `<tr><td>${tip(c.name)}${counts ? ` <span class="thcmark" title="Counted toward Total THC here">●</span>` : ""}</td><td class="num">${tip(String(c.raw ?? c.value ?? ""))}</td><td class="num">${tip(c.unit || "")}</td></tr>`;
    }).join("") || `<tr><td colspan="3">No cannabinoid rows found</td></tr>`;
    const pHtml = d.panels.map(pn => {
      const rows = pn.analytes.map(a => {
        const rv = CORE.num(a.result), lv = CORE.num(a.limit);
        const bad = a.status === "fail" || (rv !== null && lv !== null && lv > 0 && rv > lv && !/^\s*</.test(String(a.result)));
        return `<tr class="${bad ? "bad" : ""}"><td>${tip(a.name)}</td><td class="num">${tip(String(a.result ?? ""))}</td><td class="num">${esc(a.limit ?? "—")}</td><td class="num">${tip(a.unit ?? "")}</td></tr>`;
      }).join("");
      const stt = pn.status === "not tested" ? "nt" : pn.status;
      const label = CORE.CATEGORY_LABEL[pn.category] || pn.name;
      return `<div class="catblock" data-cat="${esc(pn.category)}"><div class="ptitle">${tip(label, GLOSSARY.has(pn.category) ? pn.category : null)} <span class="mini ${stt}">${esc(pn.status)}</span></div>
        ${rows ? `<div class="tbl"><table><thead><tr><th>Analyte</th><th>Result</th><th>${tip("Limit", "action_level")}</th><th>Unit</th></tr></thead><tbody>${rows}</tbody></table></div>` : ""}</div>`;
    }).join("");
    $("tables").innerHTML = `<div class="catblock" data-cat="potency"><div class="ptitle">Cannabinoids <span class="sub"><span class="thcmark">●</span> counted toward ${tip("Total THC", "total_thc")} under these rules</span></div>
      <div class="tbl"><table><thead><tr><th>Cannabinoid</th><th>Result</th><th>Unit</th></tr></thead><tbody>${cRows}</tbody></table></div></div>${pHtml || "<p class='status'>No contaminant panels found.</p>"}`;
    updateShare();
  }

  /* ---------- share: a lab-results card for product pages (embed/coa-card.js draws it) ---------- */
  const SITE = location.href.replace(/[#?].*$/, "").replace(/[^/]*$/, "");
  function bindShare() {
    const chk = $("s-checked"), ver = $("s-verdict");
    chk.addEventListener("change", () => { ver.disabled = !chk.checked; if (!chk.checked) ver.checked = false; updateShare(); });
    for (const id of ["s-verdict", "s-iframe"]) $(id).addEventListener("change", updateShare);
    $("s-coa").addEventListener("input", updateShare);
    $("shareBox").querySelectorAll("[data-copy]").forEach(b => b.addEventListener("click", async () => {
      const el = $(b.dataset.copy);
      try { await navigator.clipboard.writeText(el.value); $("s-msg").textContent = "Copied."; }
      catch { el.select(); $("s-msg").textContent = "Press Ctrl+C to copy."; }
    }));
    $("s-json").addEventListener("click", () => {
      const c = state.card; if (!c) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(c, null, 2)], { type: "application/json" }));
      a.download = `lab-results-${String(c.product.batch || "coa").replace(/[^\w.-]+/g, "_")}.json`;
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  }
  let shareSeq = 0;
  async function updateShare() {
    if (!$("shareBox") || !window.COACard) return;
    const coaUrl = $("s-coa").value.trim();
    const card = CORE.toCard(state.data, { ruleset: state.ruleset, result: state.result, reviewed: $("s-checked").checked && $("s-verdict").checked, coaUrl });
    state.card = card;
    syncPreviewTheme();
    $("s-preview").card = card;
    const seq = ++shareSeq;
    const packed = await COACard.encode(card);
    if (seq !== shareSeq) return;                       // a newer update already ran
    const link = `${SITE}embed/card.html#${packed}`;
    $("s-link").value = link; $("s-open").href = link;
    const name = card.product.name || "this product";
    $("s-code").value = $("s-iframe").checked
      ? `<iframe src="${esc(link)}" title="Lab results for ${esc(name)}" loading="lazy" style="width:100%;max-width:680px;height:760px;border:0"></iframe>`
      : `<script src="${SITE}embed/coa-card.js" defer></script>\n<coa-card>\n<script type="application/json">${JSON.stringify(card).replace(/</g, "\\u003c")}</script>\n</coa-card>`;
    $("s-msg").textContent = coaUrl && !card.coaUrl ? "The COA link needs to start with https://." : "";
  }

  async function copyFindings() {
    const d = state.data, r = state.result, rs = state.ruleset;
    const lines = [
      `COA check: ${d.product.name || "Unnamed product"} (batch ${d.product.batch || "n/a"})`,
      `Rules: ${rs.state === "Federal hemp" ? "Federal hemp" : rs.state + ", " + rs.market} (verified ${rs.verified})`,
      `Verdict: ${{ hold: "HOLD", review: "NEEDS REVIEW", clear: "CLEAR" }[r.verdict]}`,
      ...r.meters.filter(m => m.limit !== null).map(m => `${m.label}: ${m.value === null ? "not calculable" : F(m.value, 2) + " " + (m.unit || "mg")}${m.alt ? ` total THC; ${F(m.alt.value, 2)} ${m.unit || "mg"} ${m.alt.label}` : ""} (limit ${m.limit} ${m.unit || "mg"}${m.effective ? " from " + m.effective : ""})`),
      "",
      ...[...r.checks].filter(c => c.status !== "pass").map(c => `[${c.status.toUpperCase()}] ${c.title}. ${c.detail}${c.cite ? ` (${c.cite.text})` : ""}`),
      "",
      `${r.counts.pass} checks passed. Source: ${state.source}.`,
    ];
    const text = lines.join("\n");
    try { await navigator.clipboard.writeText(text); $("copyMsg").textContent = "Copied"; }
    catch {
      const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.append(ta); ta.select();
      try { document.execCommand("copy"); $("copyMsg").textContent = "Copied"; } catch { $("copyMsg").textContent = "Copy failed. Select the report text instead."; }
      ta.remove();
    }
    setTimeout(() => { $("copyMsg").textContent = ""; }, 2500);
  }

  renderRuleset();
  loadSample("gummy");
})();
