/* COA Crosscheck · lab-results card for product pages
   Created by Nick Lax · MIT License · https://github.com/scenebiscuit-cell/coa-crosscheck

   Usage on any page that allows scripts:
     <script src="https://scenebiscuit-cell.github.io/coa-crosscheck/embed/coa-card.js" defer></script>
     <coa-card><script type="application/json">{ ...card data... }</script></coa-card>

   The card's data can also come from data-card="z1...." (a packed string), src="results.json",
   or the element's .card property. Styling: set --coa-accent on the page to change the accent color,
   and theme="light" or theme="dark" to override the visitor's system setting. Fonts follow the page.

   The data never leaves the page: nothing is sent anywhere, and links carry the data after "#",
   which browsers don't send to the server. */
(function () {
  "use strict";
  const SCHEMA = /^coa-card\/1$/;

  /* ---------- packing card data into a link ---------- */
  const b64u = {
    enc(bytes) { let s = ""; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); },
    dec(str) { const s = atob(str.replace(/-/g, "+").replace(/_/g, "/")); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; },
  };
  const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
  // "z1." = compressed JSON (most browsers since 2023), "j1." = plain JSON for older ones
  async function encode(card) {
    const bytes = new TextEncoder().encode(JSON.stringify(card));
    if (typeof CompressionStream === "function") return "z1." + b64u.enc(await pipe(bytes, new CompressionStream("deflate-raw")));
    return "j1." + b64u.enc(bytes);
  }
  async function decode(str) {
    const s = String(str || "").trim().replace(/^#/, "");
    const tag = s.slice(0, 3), body = s.slice(3);
    let bytes = b64u.dec(body);
    if (tag === "z1.") bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
    else if (tag !== "j1.") throw new Error("Not a lab-results card link");
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  /* ---------- formatting ---------- */
  const fmt = (n, d = 2) => n === null || n === undefined || !isFinite(n) ? null : Number(n).toLocaleString("en-US", { maximumFractionDigits: n < 10 ? d : n < 100 ? 1 : 0 });
  const STATUS = { pass: ["Passed", "pass"], fail: ["Failed", "fail"], "not tested": ["Not tested", "nt"], reported: ["Results listed", "rep"] };
  const VERDICT = {
    clear: "no conflicts found",
    review: "no failures found, but some items still need confirmation",
    hold: "does not meet these rules",
  };
  const isND = (c) => c.value === 0 || /^(nd|n\.d\.|<|not detected|none detected|bql|bdl)/i.test(String(c.result || ""));
  // units as shoppers read them; dates like 2026-10-24 as Oct 24, 2026
  const UNIT_WORDS = { "mg/unit": " mg per serving", "mg/pkg": " mg per package", "%": "%" };
  const withUnit = (v, u) => !u || /^(nd|n\.d\.|not detected|none detected|absent|<?\s*lo[qd]|bql|bdl|negative)/i.test(String(v)) ? String(v) : String(v) + (UNIT_WORDS[u] || " " + u);
  const day = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : iso;
  const safeHref = (u) => /^https?:\/\/\S+$/i.test(String(u || "")) ? u : null;

  // build DOM with text only, so nothing in the data can run as code
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) if (v !== null && v !== undefined && v !== false) el.setAttribute(k, v === true ? "" : v);
    for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) el.append(k instanceof Node ? k : String(k));
    return el;
  }

  const CSS = `
    :host { --a: var(--coa-accent, #0f6e62); --bg: #ffffff; --fg: #17201f; --mut: #55625f; --line: #d9e2df; --soft: #f2f6f5;
      --ok: #136b3c; --okbg: #e4f4ea; --bad: #a3221b; --badbg: #fbe9e7; --nt: #5d6664; --ntbg: #eceeed;
      display: block; font: inherit; color: var(--fg); max-width: 640px; }
    @media (prefers-color-scheme: dark) { :host(:not([theme="light"])) { --bg: #141b1a; --fg: #e6eeec; --mut: #a3b1ad; --line: #2c3836; --soft: #1b2422;
      --ok: #7fd6a3; --okbg: #163223; --bad: #ff9c92; --badbg: #3a1714; --nt: #b4bebb; --ntbg: #262e2c; --a: var(--coa-accent, #6fd3c3); } }
    :host([theme="dark"]) { --bg: #141b1a; --fg: #e6eeec; --mut: #a3b1ad; --line: #2c3836; --soft: #1b2422;
      --ok: #7fd6a3; --okbg: #163223; --bad: #ff9c92; --badbg: #3a1714; --nt: #b4bebb; --ntbg: #262e2c; --a: var(--coa-accent, #6fd3c3); }
    * { box-sizing: border-box; }
    .card { background: var(--bg); border: 1px solid var(--line); border-top: 4px solid var(--a); border-radius: 12px; padding: 18px; line-height: 1.45; }
    .eyebrow { margin: 0; font-size: .75em; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--a); }
    h2 { margin: 2px 0 4px; font-size: 1.25em; line-height: 1.2; }
    h3 { margin: 18px 0 8px; font-size: .95em; }
    .meta { margin: 0; color: var(--mut); font-size: .9em; }
    .kind { margin: 0 0 2px; font-size: .9em; font-weight: 600; }
    .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 14px; }
    .tile { background: var(--soft); border-radius: 10px; padding: 10px 12px; }
    .tile .k { font-size: .8em; color: var(--mut); font-weight: 600; }
    .tile .v { font-size: 1.5em; font-weight: 700; font-variant-numeric: tabular-nums; }
    .tile .s { font-size: .82em; color: var(--mut); }
    table { width: 100%; border-collapse: collapse; font-size: .9em; }
    th, td { text-align: left; padding: 6px 4px; border-bottom: 1px solid var(--line); vertical-align: top; }
    th { font-size: .8em; color: var(--mut); font-weight: 600; }
    td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; }
    .nd { margin: 6px 0 0; font-size: .85em; color: var(--mut); }
    ul.tests { list-style: none; margin: 0; padding: 0; }
    ul.tests > li { border-bottom: 1px solid var(--line); }
    .row { display: flex; justify-content: space-between; align-items: center; gap: 10px; min-height: 40px; padding: 4px 0; }
    details > summary { cursor: pointer; list-style: none; }
    details > summary::-webkit-details-marker { display: none; }
    details > summary .name::before { content: "▸"; display: inline-block; width: 1.1em; color: var(--mut); transition: transform .15s; }
    details[open] > summary .name::before { transform: rotate(90deg); }
    details > div { padding: 0 0 10px; }
    summary:focus-visible, a:focus-visible { outline: 2px solid var(--a); outline-offset: 2px; border-radius: 4px; }
    .chip { font-size: .78em; font-weight: 700; padding: 2px 9px; border-radius: 99px; white-space: nowrap; }
    .chip.pass { color: var(--ok); background: var(--okbg); } .chip.fail { color: var(--bad); background: var(--badbg); }
    .chip.nt, .chip.rep { color: var(--nt); background: var(--ntbg); }
    tr.over td { color: var(--bad); font-weight: 600; }
    .review { margin-top: 14px; padding: 10px 12px; border-radius: 10px; background: var(--soft); font-size: .88em; }
    .foot { margin-top: 14px; font-size: .8em; color: var(--mut); }
    .foot p { margin: 4px 0; }
    a { color: var(--a); font-weight: 600; }
    a.coa { display: inline-block; margin-top: 12px; padding: 8px 14px; border: 1px solid var(--a); border-radius: 8px; text-decoration: none; min-height: 24px; }
    .err { color: var(--mut); font-size: .9em; }
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }`;

  function build(c) {
    if (!c || !SCHEMA.test(c.schema || "")) return h("div", { class: "card" }, h("p", { class: "err" }, "This lab-results card couldn't be read. Ask the seller for the lab's certificate of analysis."));
    const p = c.product || {}, lab = c.lab || {}, d = c.dates || {};
    const tested = d.tested || d.reported;
    // "Concentrate · Live Resin Badder": the category plus the kind the COA names
    const kind = [p.form, p.concentrateType && !new RegExp(p.concentrateType.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(p.form || "") ? p.concentrateType : null].filter(Boolean).join(" · ");
    const metaBits = [p.batch && `Batch ${p.batch}`, tested && `Tested ${tested}`, lab.name && `by ${lab.name}`].filter(Boolean);

    const tile = (label, m) => {
      if (!m) return null;
      // the headline number: per serving if known, else per package, else the concentration
      let main = null, per = "", sub = [];
      const conc = m.conc ? (m.conc.unit === "%" ? `${fmt(m.conc.value)}%` : `${fmt(m.conc.value)} ${m.conc.unit}`) : null;
      if (m.perUnit !== null && m.perUnit !== undefined) { main = `${fmt(m.perUnit)} mg`; per = "per serving"; if (m.perPkg != null) sub.push(`${fmt(m.perPkg)} mg per package`); }
      else if (m.perPkg !== null && m.perPkg !== undefined) { main = `${fmt(m.perPkg)} mg`; per = "per package"; }
      if (conc) { if (main) sub.push(`${conc} by ${m.conc.unit === "%" ? "weight" : "volume"}`); else { main = conc; per = m.conc.unit === "%" ? "by weight" : ""; } }
      if (!main) return null;
      return h("div", { class: "tile" }, h("div", { class: "k" }, per ? `${label} · ${per}` : label),
        h("div", { class: "v" }, main), sub.map(s => h("div", { class: "s" }, s)));
    };

    const cans = c.cannabinoids || [];
    const found = cans.filter(x => !isND(x)), nd = cans.filter(isND);
    const canSection = cans.length ? [h("h3", null, "Cannabinoids"),
      found.length ? h("table", null, h("thead", null, h("tr", null, h("th", { scope: "col" }, "Cannabinoid"), h("th", { scope: "col", class: "n" }, "Amount"))),
        h("tbody", null, found.map(x => h("tr", null, h("td", null, x.name), h("td", { class: "n" }, withUnit(x.result, x.unit)))))) : null,
      nd.length ? h("p", { class: "nd" }, "Not detected: " + nd.map(x => x.name).join(", ")) : null] : [];

    const tests = (c.tests || []).map(t => {
      const [label, cls] = STATUS[t.status] || STATUS.reported;
      const head = [h("span", { class: "name" }, t.name), h("span", { class: "chip " + cls }, label)];
      if (!t.items || !t.items.length) return h("li", null, h("div", { class: "row" }, h("span", null, t.name), h("span", { class: "chip " + cls }, label)));
      return h("li", null, h("details", null, h("summary", { class: "row" }, head),
        h("div", null, h("table", null,
          h("thead", null, h("tr", null, h("th", { scope: "col" }, "Test"), h("th", { scope: "col", class: "n" }, "Result"), h("th", { scope: "col", class: "n" }, "Limit"))),
          h("tbody", null, t.items.map(i => h("tr", { class: i.over ? "over" : null },
            h("td", null, i.name, i.over ? " (over limit)" : ""),
            h("td", { class: "n" }, i.result == null ? "—" : withUnit(i.result, i.unit)),
            h("td", { class: "n" }, i.limit ? [i.limit, i.unit].filter(Boolean).join(" ") : "—"))))))));
    });

    const r = c.review;
    const coa = safeHref(c.coaUrl);
    const thcTile = tile("Total THC", c.thc), cbdTile = tile("Total CBD", c.cbd);
    return h("article", { class: "card", "aria-label": `Lab results${p.name ? " for " + p.name : ""}` },
      h("p", { class: "eyebrow" }, "Lab results"),
      h("h2", null, p.name || "Product"),
      kind ? h("p", { class: "kind" }, kind) : null,
      metaBits.length ? h("p", { class: "meta" }, metaBits.join(" · ")) : null,
      thcTile || cbdTile ? h("div", { class: "tiles" }, thcTile, cbdTile) : null,
      c.thc && c.thc.counts && c.thc.counts.length ? h("p", { class: "nd" }, "Total THC counts " + c.thc.counts.join(", ") + (c.thc.counts.includes("THCA") ? " (THCA × 0.877)." : ".")) : null,
      canSection,
      tests.length ? [h("h3", null, "Safety tests"), h("ul", { class: "tests" }, tests)] : null,
      r && VERDICT[r.verdict] ? h("p", { class: "review" }, `Checked against ${r.rules} rules (citations verified ${day(r.verified)}): ${VERDICT[r.verdict]}. Not legal advice.`) : null,
      coa ? h("a", { class: "coa", href: coa, target: "_blank", rel: "noopener noreferrer" }, "View the lab's full certificate") : null,
      h("div", { class: "foot" },
        h("p", null, "Summary read from the lab's certificate of analysis", c.made ? ` on ${day(c.made)}` : "", ". The lab's certificate is the official record."),
        h("p", null, "Made with ", h("a", { href: "https://scenebiscuit-cell.github.io/coa-crosscheck/", target: "_blank", rel: "noopener" }, "COA Crosscheck"), ".")));
  }

  /* ---------- <coa-card> ---------- */
  if (typeof window !== "undefined" && window.customElements && !customElements.get("coa-card")) {
    class COACardElement extends HTMLElement {
      static get observedAttributes() { return ["data-card", "src"]; }
      constructor() { super(); this._root = this.attachShadow({ mode: "open" }); this._card = null; }
      set card(v) { this._card = v; this.render(); }
      get card() { return this._card; }
      connectedCallback() { this.load(); }
      attributeChangedCallback() { if (this.isConnected) this.load(); }
      async load() {
        try {
          if (this.dataset.card) this._card = await decode(this.dataset.card);
          else if (this.getAttribute("src")) this._card = await (await fetch(this.getAttribute("src"))).json();
          else {
            const s = this.querySelector('script[type="application/json"]');
            // if this script loaded before the card's contents were parsed, try again once the page is ready
            if (!s && document.readyState === "loading") { document.addEventListener("DOMContentLoaded", () => this.load(), { once: true }); return; }
            if (s) this._card = JSON.parse(s.textContent);
          }
        } catch { this._card = null; }
        this.render();
      }
      render() {
        this._root.replaceChildren(h("style", null, CSS), build(this._card));
      }
    }
    customElements.define("coa-card", COACardElement);
  }

  const api = { encode, decode, SCHEMA };
  if (typeof window !== "undefined") window.COACard = api;
  if (typeof module !== "undefined") module.exports = api;
})();
