// The shopper card: CORE.toCard builds the data, embed/coa-card.js packs it into links and draws it.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const CORE = require("../src/core.js");
const RULES = require("../src/rules.js");
const CARD = require("../embed/coa-card.js");

const TODAY = "2026-10-26";
const fixture = (f) => CORE.parseText(fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8"));
const cardFor = (f, rsId, opts = {}) => {
  const d = fixture(f), rs = RULES.byId(rsId);
  return CORE.toCard(d, { ruleset: rs, result: CORE.evaluate(d, rs, { today: TODAY }), today: TODAY, ...opts });
};

test("card: carries the lab's numbers, with THC per serving and per package", () => {
  const c = cardFor("pasted-single-space.txt", "CO-AU");
  assert.equal(c.schema, CORE.CARD_SCHEMA);
  assert.equal(c.product.name, "Peach Rings 100");
  assert.equal(c.product.batch, "PR-2610-11");
  assert.equal(c.lab.name, "Prairie Bloom Analytical");
  assert.equal(c.thc.perUnit, 9.81);
  assert.equal(c.thc.perPkg, 98.1);
  assert.equal(c.cbd.perUnit, 0.5);                       // CBD + CBDA × 0.877, same math as THC
  assert.ok(c.thc.counts.includes("Δ8-THC"));              // Colorado's definition counts Δ8
  assert.ok(c.cannabinoids.some((x) => x.name === "Δ9-THC" && x.result === "9.81"));
  assert.equal(c.tests.find((t) => t.name === "Residual solvents").status, "not tested");
});

test("card: shows no verdict unless the seller reviewed the values", () => {
  assert.equal(cardFor("column-table.txt", "MO").review, null);
  const c = cardFor("column-table.txt", "MO", { reviewed: true });
  assert.equal(c.review.verdict, "review");
  assert.match(c.review.rules, /^Missouri/);
  assert.equal(c.review.verified, RULES.byId("MO").verified);
});

test("card: weight-based products show percent, and results over a limit are marked", () => {
  const c = cardFor("lims-export.csv", "CA-AU");
  assert.deepEqual(c.thc.conc, { value: 21.96, unit: "%" });
  const pest = c.tests.find((t) => t.name === "Pesticides");
  assert.equal(pest.status, "fail");
  assert.equal(pest.items.find((i) => i.name === "Myclobutanil").over, true);
  assert.equal(pest.items.find((i) => i.name === "Bifenazate").over, undefined);
});

test("card: only http and https COA links are kept", () => {
  assert.equal(cardFor("column-table.txt", "MO", { coaUrl: "https://lab.example.com/a.pdf" }).coaUrl, "https://lab.example.com/a.pdf");
  assert.equal(cardFor("column-table.txt", "MO", { coaUrl: "javascript:alert(1)" }).coaUrl, null);
});

test("card: packs into a short link and unpacks to the same data", { skip: typeof CompressionStream !== "function" }, async () => {
  const c = cardFor("lims-export.csv", "CA-AU", { reviewed: true, coaUrl: "https://lab.example.com/coa.pdf" });
  const packed = await CARD.encode(c);
  assert.match(packed, /^z1\.[A-Za-z0-9_-]+$/);          // safe to put after "#" in a link
  assert.ok(packed.length < 2000, `link data is ${packed.length} characters`);
  assert.deepEqual(await CARD.decode(packed), c);
  await assert.rejects(CARD.decode("not-a-card"));
});
