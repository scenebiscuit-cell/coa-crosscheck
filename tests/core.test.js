// Run with: npm test   (Node 18+, no dependencies)
const test = require("node:test");
const assert = require("node:assert/strict");
const CORE = require("../src/core.js");
const RULES = require("../src/rules.js");
const SAMPLES = require("../src/samples.js");

const TODAY = "2026-10-25";
const sample = (id) => CORE.parseText(SAMPLES.find((x) => x.id === id).text);
const run = (id, rs = "TX-MED", today = TODAY) => CORE.evaluate(sample(id), RULES.byId(rs), { today });
const evalData = (data, rs, today = TODAY) => CORE.evaluate(CORE.sanitizeExtraction(data), RULES.byId(rs), { today });
const check = (r, id) => r.checks.find((c) => c.id === id);

/* ---------- Texas (TCUP) ---------- */
test("TX: tincture sample clears", () => {
  const r = run("tincture");
  assert.equal(r.verdict, "clear");
  assert.ok(Math.abs(r.math.perUnit - 9.5754) < 1e-6);   // 9.40 + 0.20 × 0.877 mg per 1 mL
});

test("TX: gummy fails the 10 mg dose cap, the 1 g package cap, and the mold test", () => {
  const r = run("gummy");
  assert.equal(r.verdict, "hold");
  assert.equal(check(r, "lim-dose").status, "fail");
  assert.equal(check(r, "lim-pkg").status, "fail");
  assert.match(check(r, "panel").title, /Mold/);
});

test("TX: vape fails on HHC and lead; inhaled dose is set by prescription", () => {
  const r = run("vape");
  assert.equal(check(r, "phyto").status, "fail");
  assert.match(check(r, "results").detail, /Lead/);
  assert.equal(check(r, "rxdose").status, "info");
  assert.equal(check(r, "form").status, "warn");
});

test("TX: flower is not an allowed form", () => {
  assert.equal(check(evalData({ product: { form: "Flower" } }, "TX-MED"), "form").status, "fail");
});

/* ---------- California ---------- */
test("CA adult-use: 11.6 mg gummy fails the 10 mg serving and 100 mg package limits", () => {
  const r = run("gummy", "CA-AU");
  assert.equal(check(r, "lim-serving").status, "fail");
  assert.equal(check(r, "lim-pkg").status, "fail");
});

test("CA: lead in a vape is judged against California's inhalable limit", () => {
  const r = run("vape", "CA-AU");
  assert.match(check(r, "results").detail, /California limit 0\.5/);
  assert.equal(check(r, "micro").status, "fail");          // STEC and Aspergillus not reported
});

test("CA medicinal allows 2,000 mg concentrates; adult-use stops at 1,000 mg", () => {
  const data = { product: { form: "Distillate concentrate", net_content: 1, net_content_unit: "g" },
    cannabinoids: [{ name: "Δ9-THC", value: 1500, unit: "mg/g" }] };
  assert.equal(check(evalData(data, "CA-AU"), "lim-pkgc").status, "fail");
  assert.equal(check(evalData(data, "CA-MED"), "lim-pkgc").status, "pass");
});

test("CA counts THC + THCA only; Δ8 is flagged separately", () => {
  const data = { product: { form: "Gummy", unit_size: 5, unit_size_unit: "g" },
    cannabinoids: [{ name: "Δ9-THC", value: 1.5, unit: "mg/g" }, { name: "Δ8-THC", value: 1.0, unit: "mg/g" }] };
  const r = evalData(data, "CA-AU");
  assert.equal(r.math.perUnit, 7.5);
  assert.equal(check(r, "phyto").status, "warn");
});

/* ---------- Colorado ---------- */
test("CO retail caps edibles; CO medical does not", () => {
  assert.equal(check(run("gummy", "CO-AU"), "lim-serving").status, "fail");
  const med = run("gummy", "CO-MED");
  assert.equal(med.checks.filter((c) => c.id.startsWith("lim-") && c.status === "fail").length, 0);
  assert.equal(check(med, "lim-none").status, "info");
});

test("CO: oral and topical products use different lead limits", () => {
  const panel = (lead) => [{ category: "heavy_metals", name: "Heavy metals", status: "pass",
    analytes: [{ name: "Lead", result: String(lead), limit: "10", unit: "ppm", status: null }] }];
  assert.equal(check(evalData({ product: { form: "Gummy" }, panels: panel(2) }, "CO-AU"), "results").status, "fail");   // oral < 1 ppm
  assert.equal(check(evalData({ product: { form: "Lotion" }, panels: panel(2) }, "CO-AU"), "results").status, "pass");  // topical < 10 ppm
});

test("CO: a lab's printed limit looser than Colorado's is flagged", () => {
  const data = { product: { form: "Vape cartridge" }, panels: [{ category: "heavy_metals", name: "Heavy metals", status: "pass",
    analytes: [{ name: "Arsenic", result: "ND", limit: "1.5", unit: "ppm", status: "pass" }] }] };
  assert.equal(check(evalData(data, "CO-AU"), "printed").status, "warn");
});

test("CO: total yeast and mold over 10,000 CFU/g fails", () => {
  const data = { product: { form: "Flower" }, panels: [{ category: "microbials", name: "Microbials", status: "pass",
    analytes: [{ name: "Total yeast and mold", result: "25000", limit: "100000", unit: "CFU/g", status: "pass" },
      { name: "STEC", result: "ND", limit: null, unit: null, status: null }, { name: "Salmonella", result: "ND", limit: null, unit: null, status: null },
      { name: "Aspergillus fumigatus", result: "ND", limit: null, unit: null, status: null }] }] };
  const r = evalData(data, "CO-AU");
  assert.equal(check(r, "results").status, "fail");
  assert.equal(check(r, "micro").status, "pass");
});

/* ---------- Missouri ---------- */
test("MO: no serving cap, but a 3-ounce-equivalent package cap of 2,400 mg THC", () => {
  const r = run("gummy", "MO");
  assert.equal(check(r, "lim-pkg").status, "pass");          // 1,158 mg
  assert.equal(r.checks.filter((c) => c.id === "lim-serving").length, 0);
});

test("MO: chromium is tested, with a tighter limit for inhaled products", () => {
  const data = (form) => ({ product: { form }, panels: [{ category: "heavy_metals", name: "Heavy metals", status: "pass",
    analytes: [{ name: "Chromium", result: "1.0", limit: "2.0", unit: "ppm", status: "pass" }] }] });
  assert.equal(check(evalData(data("Vape cartridge"), "MO"), "results").status, "fail");   // inhaled 0.6
  assert.equal(check(evalData(data("Gummy"), "MO"), "results").status, "pass");            // infused 2.0
});

test("MO: total mycotoxins are summed against 20 µg/kg", () => {
  const data = { product: { form: "Gummy" }, panels: [{ category: "mycotoxins", name: "Mycotoxins", status: "pass", analytes: [
    { name: "Total aflatoxins", result: "12", limit: "20", unit: "µg/kg", status: "pass" },
    { name: "Ochratoxin A", result: "11", limit: "20", unit: "µg/kg", status: "pass" }] }] };
  assert.match(check(evalData(data, "MO"), "results").detail, /Total mycotoxins 23/);
});

test("MO: Aspergillus is required for every product type", () => {
  assert.match(check(run("tincture", "MO"), "micro").detail, /Aspergillus/);
});

test("MO: required cannabinoid profile includes THCV, CBDV and Δ8-THC", () => {
  assert.match(check(run("tincture", "MO"), "profile").title, /THCV, CBDV/);
});

test("MO: residual solvents use the inhaled column for vapes and flag a looser printed limit", () => {
  const r = run("vape", "MO");
  assert.match(check(r, "printed").detail, /Ethanol: printed 5000 ppm vs Missouri 1000/);
  const data = (form, ethanol) => ({ product: { form }, panels: [{ category: "residual_solvents", name: "Residual solvents", status: "pass",
    analytes: [{ name: "Ethanol", result: String(ethanol), limit: "5000", unit: "ppm", status: "pass" }] }] });
  assert.equal(check(evalData(data("Vape cartridge", 1200), "MO"), "results").status, "fail");
  assert.equal(check(evalData(data("Gummy", 1200), "MO"), "results").status, "pass");
});

test("MO: pesticide results are checked against the state's banned-analyte table", () => {
  const data = { product: { form: "Flower" }, panels: [{ category: "pesticides", name: "Pesticides", status: "pass",
    analytes: [{ name: "Myclobutanil", result: "0.3", limit: "0.5", unit: "ppm", status: "pass" }] }] };
  assert.match(check(evalData(data, "MO"), "results").detail, /Myclobutanil 0\.3 ppm \(Missouri limit 0\.2/);
});

test("MO: foreign matter screening is required", () => {
  assert.match(check(run("gummy", "MO"), "panel").title, /Foreign matter/);
});

test("CO: residual solvents are checked, with ethanol exempt for oral products", () => {
  const data = (form) => ({ product: { form }, panels: [{ category: "residual_solvents", name: "Residual solvents", status: "pass",
    analytes: [{ name: "Ethanol", result: "3000", limit: "5000", unit: "ppm", status: "pass" }] }] });
  assert.equal(check(evalData(data("Vape cartridge"), "CO-AU"), "results").status, "fail");
  assert.equal(check(evalData(data("Tincture"), "CO-AU"), "results").status, "pass");
});

test("MO: package THC is shown two ways and flagged when the definition decides the outcome", () => {
  const data = (thca) => ({ product: { form: "Capsules", net_content: 3, net_content_unit: "g" },
    cannabinoids: [{ name: "Δ9-THC", value: 700, unit: "mg/g" }, { name: "THCA", value: thca, unit: "mg/g" }] });
  assert.equal(check(evalData(data(0), "MO"), "lim-pkg").status, "pass");      // 2,100 mg both ways
  assert.equal(check(evalData(data(200), "MO"), "lim-pkg").status, "warn");    // total 2,626 mg, Δ9 2,100 mg
  assert.equal(check(evalData(data(200), "MO"), "lim-pkg").title.includes("depending"), true);
  const r = evalData({ ...data(0), cannabinoids: [{ name: "Δ9-THC", value: 900, unit: "mg/g" }] }, "MO");
  assert.equal(check(r, "lim-pkg").status, "fail");
  assert.equal(r.meters[0].alt.value, 2700);
});

test("MO: concentrates and vapes are capped by weight, 24 g per package", () => {
  const data = (g) => ({ product: { form: "Shatter concentrate", net_content: g, net_content_unit: "g" }, cannabinoids: [{ name: "Δ9-THC", value: 800, unit: "mg/g" }] });
  assert.equal(check(evalData(data(3.5), "MO"), "lim-pkgw").status, "pass");
  assert.equal(check(evalData(data(28), "MO"), "lim-pkgw").status, "fail");
  assert.equal(check(evalData(data(3.5), "MO"), "lim-pkg"), undefined);
});

test("CA: residual solvents and foreign material are required for every sample, flower included", () => {
  const r = evalData({ product: { form: "Flower" }, cannabinoids: [{ name: "THCA", value: 20, unit: "%" }],
    panels: [{ category: "heavy_metals", name: "Heavy metals", status: "pass", analytes: [] }] }, "CA-AU");
  assert.match(check(r, "panel").title, /Residual solvents/);
  assert.match(check(r, "panel").title, /Foreign material/);
});

test("MO: capsules need a water activity result; CA capsules don't", () => {
  const data = { product: { form: "Capsules" }, cannabinoids: [{ name: "Δ9-THC", value: 10, unit: "mg/g" }] };
  assert.match(check(evalData(data, "MO"), "panel").title, /Water activity/);
  assert.doesNotMatch(check(evalData(data, "CA-AU"), "panel").title, /Water activity/);
});

/* ---------- Federal hemp ---------- */
test("Hemp: the 0.4 mg per-container cap warns before Dec 11, 2026 and fails after", () => {
  assert.equal(check(run("gummy", "US-HEMP", "2026-10-25"), "lim-pkg").status, "warn");
  assert.equal(check(run("gummy", "US-HEMP", "2026-12-12"), "lim-pkg").status, "fail");
});

test("Hemp: synthetic cannabinoids become a failure on Nov 12, 2026", () => {
  assert.equal(check(run("vape", "US-HEMP", "2026-11-01"), "phyto").status, "warn");
  assert.equal(check(run("vape", "US-HEMP", "2026-11-13"), "phyto").status, "fail");
});

test("Hemp: Δ9 at 0.285% by weight passes the current 0.3% test", () => {
  assert.equal(check(run("gummy", "US-HEMP"), "hempconc").status, "pass");
});

/* ---------- parser and self-checks (state-independent) ---------- */
test("parses the sideways real-lab layout", () => {
  const text = require("node:fs").readFileSync(__dirname + "/fixtures/sideways-layout.txt", "utf8");
  const data = CORE.parseText(text);
  assert.equal(data.lab.name, "Mesquite Ridge Labs");
  assert.equal(data.product.form, "Tincture");
  assert.equal(data.cannabinoids.length, 8);
  assert.equal(data.panels.find((p) => p.category === "residual_solvents").status, "pass");
  const r = CORE.evaluate(data, RULES.byId("TX-MED"), { today: TODAY });
  assert.equal(r.verdict, "hold");
  assert.ok(Math.abs(r.math.perUnit - 9.5) < 1e-9);
});

test("self-check flags impossible values and short THC rows", () => {
  assert.equal(check(evalData({ cannabinoids: [{ name: "Δ9-THC", value: 850, unit: "%" }] }, "TX-MED"), "read").status, "warn");
  assert.equal(check(evalData({ cannabinoids: [{ name: "Δ9-THC", value: 2, unit: "mg/mL" }],
    reported_totals: { total_thc: { value: 9.5, unit: "mg/mL" } } }, "TX-MED"), "read").status, "warn");
});

test("every rulebook has citations with links and a verified date", () => {
  for (const rs of RULES.SETS) {
    assert.match(rs.verified, /^\d{4}-\d{2}-\d{2}$/, rs.id);
    assert.ok(rs.sources.length > 0, rs.id);
    for (const l of rs.limits) assert.match(l.cite.url, /^https:\/\//, rs.id + " " + l.id);
  }
});

test("ND and <LOQ read as zero", () => {
  assert.equal(CORE.num("ND"), 0);
  assert.equal(CORE.num("<LOQ"), 0);
});

/* ---------- flower and concentrates (every rulebook except Texas offers them) ---------- */
test("Flower sample clears in MO, CO and CA, and holds in Texas and under federal hemp", () => {
  for (const rs of ["MO", "CO-AU", "CO-MED", "CA-AU", "CA-MED"]) assert.equal(run("flower", rs).verdict, "clear", rs);
  assert.equal(check(run("flower", "TX-MED"), "form").status, "fail");          // TCUP excludes smoking
  assert.equal(check(run("flower", "US-HEMP"), "hempconc").status, "fail");     // far over 0.3%
});

test("MO: flower packages are capped at 3 oz (85.05 g)", () => {
  assert.equal(check(run("flower", "MO"), "lim-pkgf").status, "pass");          // 3.5 g
  const big = sample("flower"); big.product.net_content = 90;
  assert.equal(check(CORE.evaluate(big, RULES.byId("MO"), { today: TODAY }), "lim-pkgf").status, "fail");
});

test("Concentrate sample holds in Missouri only, on butanes over 800 ppm", () => {
  const mo = run("concentrate", "MO");
  assert.equal(mo.verdict, "hold");
  assert.match(check(mo, "results").detail, /Butanes 920/);
  assert.equal(check(mo, "lim-pkgw").status, "pass");                            // 1 g of a 24 g limit
  assert.equal(run("concentrate", "CA-AU").verdict, "clear");                   // 677 mg, under the 1,000 mg cap
  assert.equal(check(run("concentrate", "CO-AU"), "printed").status, "warn");   // lab printed 5,000 vs Colorado's 1,000
});

test("Hemp: the per-container cap is a review item for flower and a failure for other products", () => {
  const after = "2026-12-15";
  assert.equal(check(run("flower", "US-HEMP", after), "lim-pkgf").status, "warn");
  assert.equal(check(run("flower", "US-HEMP", after), "lim-pkg"), undefined);
  assert.equal(check(run("concentrate", "US-HEMP", after), "lim-pkg").status, "fail");
});

test("a category picked on the page overrides the COA's wording", () => {
  const d = sample("concentrate"); d.product.form = "Sugar";                   // not a word the guesser knows
  assert.equal(CORE.evaluate(d, RULES.byId("CA-AU"), { today: TODAY }).formClass, "other");
  d.product.category = "concentrate";
  const r = CORE.evaluate(d, RULES.byId("CA-AU"), { today: TODAY });
  assert.equal(r.formClass, "concentrate");
  assert.equal(check(r, "lim-pkgc").status, "pass");
});

test("concentrate type: read from the COA, kept separate from the Concentrate category", () => {
  const d = sample("concentrate");
  assert.equal(d.product.form, "Concentrate");
  assert.equal(d.product.concentrate_type, "Live Resin Badder");          // its own "Concentrate Type:" line
  const t = (form, name) => CORE.concentrateType(form, name);
  assert.equal(t("Concentrate (live rosin)", ""), "Live Rosin");
  assert.equal(t("Concentrate - Shatter", ""), "Shatter");
  assert.equal(t("Concentrate", "Gelato Live Hash Rosin 1 g"), "Live Hash Rosin");
  assert.equal(t("Concentrate", "Tangie THCa Diamonds"), "THCA Diamonds");
  assert.equal(t("Concentrate", "Sunset Sherbet 1 g"), null);              // nothing named, so left blank
  assert.equal(sample("gummy").product.concentrate_type, null);           // only for concentrates and vapes
  // the local AI reader's answer gets the same fallback
  const ai = CORE.sanitizeExtraction({ product: { form: "Concentrate", name: "Papaya Cured Resin Sauce" } });
  assert.equal(ai.product.concentrate_type, "Cured Resin Sauce");
});

test("card: shows the concentrate type next to the category", () => {
  const card = CORE.toCard(sample("concentrate"), { ruleset: RULES.byId("CA-AU") });
  assert.equal(card.product.form, "Concentrate");
  assert.equal(card.product.concentrateType, "Live Resin Badder");
  assert.equal(CORE.toCard(sample("flower"), { ruleset: RULES.byId("CA-AU") }).product.concentrateType, undefined);
});
