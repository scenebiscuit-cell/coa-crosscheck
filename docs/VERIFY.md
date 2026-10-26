# Verifying the rulebooks

Every number the checker applies lives in `src/rules.js`. This file lists each one, where it comes from, how it was verified, and what a person should still confirm. Last full audit: **October 25, 2026**; flower and concentrate rules added **October 26, 2026**.

**How to use this file.** Open the source link, find the value, and tick the box in the right-hand column. Re-run this whenever a state publishes new rules; each rulebook in the app shows its own "verified" date.

Legend: ✅ checked against the official text · 🟡 checked against a secondary source or reasoned from the rule · ⚖️ judgment call worth a second opinion.

## Texas · Compassionate Use Program (medical)

| Value in the tool | Source | Status | You |
|---|---|---|---|
| ≤ 10 mg THC per dosage unit | [Occ. Code §169.001(3), HB 46 enrolled](https://capitol.texas.gov/tlodocs/89R/billtext/html/HB00046F.htm) | ✅ | ☐ |
| ≤ 1 g THC per package, container, or inhalation device | Health & Safety Code §487.107(c), HB 46 enrolled | ✅ | ☐ |
| Only phytocannabinoids may be dispensed (no catalyst conversion) | Health & Safety Code §487.1071, HB 46 enrolled | ✅ | ☐ |
| Smoking excluded; inhalation only by prescription, THC per dosage unit set in the prescription | Occ. Code §169.001(4)–(5), §169.006 | ✅ | ☐ |
| Required tests: THC, CBD, residual solvents, pesticides, fungicides, fertilizers, mold, heavy metals | [37 TAC §12.7(b)](https://www.law.cornell.edu/regulations/texas/37-Tex-Admin-Code-SS-12-7) | ✅ | ☐ |
| §12.7 not amended since 2017; no pending Chapter 12 changes | [DPS administrative rules page](https://dps.texas.gov/section/general-counsel/administrative-rules) | ✅ | ☐ |
| Contaminant limits: none published; printed COA limits used | 37 TAC §12.7(a)–(b) defers to TDA rules | 🟡 | ☐ |
| Testing is done in-house by dispensing organizations | [Vicente LLP overview](https://vicentellp.com/insights/texas-compassionate-use-program-tcup-overview/) | 🟡 Confirm with an operator | ☐ |
| ⚖️ Fungicide and fertilizer gaps are "review," not "fail" | §12.7(b) lists both as required | ⚖️ The rule supports "fail"; review was chosen because labs rarely itemize fertilizers | ☐ |

## Missouri · medical and adult-use

Source for everything below unless noted: [19 CSR 100-1, current through the 10/31/26 Code update](https://www.sos.mo.gov/CMSImages/AdRules/csr/current/19csr/19c100-1.pdf). The 61 pesticides and 20 solvents were compared to the extracted rule text by script: 0 mismatches.

| Value in the tool | Section | Status | You |
|---|---|---|---|
| Package ≤ 3 oz dried marijuana or equivalent | 100-1.120(4) | ✅ | ☐ |
| 1 oz = 8 g concentrate = 800 mg THC in infused products → 24 g / 2,400 mg per package | 100-1.010(26) | ✅ | ☐ |
| Flower and pre-rolls ≤ 3 oz (85.05 g) per package | 100-1.120(4): "shall not be packaged in a manner that exceeds three (3) ounces" of dried, unprocessed marijuana | ✅ | ☐ |
| ⚖️ Which "THC" the 800 mg means (total vs Δ9 only) | 100-1.010(26) is silent | ⚖️ Tool shows both; ask the Division if it matters | ☐ |
| Cannabinoid profile: Δ9-THC, THCA, CBD, CBDA, CBN, THCV, CBDV, Δ8-THC; ±15% across ≥ 3 samples | 100-1.110(7)(E) | ✅ | ☐ |
| Mycotoxins (aflatoxins + ochratoxin A) ≤ 20 µg/kg total | 100-1.110(7)(G)1.A | ✅ | ☐ |
| Pathogenic E. coli, Salmonella, Aspergillus (4 species) absent in 1 g, all products | 100-1.110(7)(G)1.B–C | ✅ | ☐ |
| 61 pesticide action limits; vitamin E acetate for inhalables/concentrates only | 100-1.110(7)(G)2 | ✅ | ☐ |
| Metals, inhaled / infused (ppm): As 0.2/1.5, Cd 0.2/0.5, Cr 0.6/2.0, Pb 0.5/0.5, Hg 0.1/3.0 | 100-1.110(7)(G)3 | ✅ | ☐ |
| 20 residual solvent limits, inhaled vs infused | 100-1.110(7)(G)4 | ✅ | ☐ |
| Water activity: flower/pre-rolls ≤ 0.65 (moisture 5–15%), hash/kief ≤ 0.65, solid infused ≤ 0.85 | 100-1.110(7)(G)5 | ✅ | ☐ |
| ⚖️ "Solid infused" includes capsules and lozenges | 100-1.110(7)(G)5.C | ⚖️ Reasoned from "all solid infused products" | ☐ |
| Foreign matter screening required | 100-1.110(7)(G)6 | ✅ | ☐ |
| Heavy-metal failures can't be remediated | 100-1.110(10)(C) | ✅ | ☐ |
| Label must show exact mg per serving of each profile cannabinoid, the testing lab, and the track-and-trace tag | 100-1.120(1)(C)2 | ✅ | ☐ |
| Label tolerance about ±10% | [DCR packaging guide (2021)](https://health.mo.gov/safety/cannabis/pdf/packaging-labeling-guide.pdf) | 🟡 Older guidance; not in the rule | ☐ |
| ⚖️ Semi-synthetic cannabinoids flagged for review | No specific rule found | ⚖️ | ☐ |

## Colorado · retail and medical

Primary sources: [Rule 4-115](https://www.law.cornell.edu/regulations/colorado/1-CCR-212-3-4-115), [Rule 4-210](https://www.law.cornell.edu/regulations/colorado/1-CCR-212-3-4-210), [Rule 1-115 definitions](https://www.sos.state.co.us/CCR/GenerateRulePdf.do?ruleVersionId=9900). Verified October 24, 2026.

| Value in the tool | Section | Status | You |
|---|---|---|---|
| Retail edibles ≤ 10 mg THC per serving, ≤ 100 mg per package | 4-210(E)(4)(c) | ✅ | ☐ |
| Medical edibles: no cap; must match label within variance | 4-210(E)(4)(b) | ✅ | ☐ |
| Variance ±15% over 2.5 mg/serving; otherwise greater of ±0.5 mg or 40% | 4-210(E)(5) | ✅ | ☐ |
| Total THC = Δ9 + Δ8 + Δ10 + exo-THC + THCA × 0.877 | 1-115 | ✅ | ☐ |
| STEC, Salmonella absent in 1 g; Aspergillus absent except oral and skin products; TYMC < 10⁴ CFU/g | 4-115(D)(1) | ✅ | ☐ |
| Water activity ≤ 0.65 for flower, shake, trim, pre-rolls | 4-115(D)(1.5) | ✅ | ☐ |
| Aflatoxins < 20 ppb; ochratoxin A < 20 ppb | 4-115(D)(2) | ✅ | ☐ |
| Residual solvents (13 limits); ethanol over the limit allowed in non-inhaled products | 4-115(D)(3) | ✅ | ☐ |
| Metals (ppm), inhaled / oral / topical: Pb 0.5/1/10, As 0.2/1.5/3, Cd 0.2/0.5/3, Hg 0.1/1.5/1 | 4-115(D)(4) | ✅ | ☐ |
| ⚖️ Retail edible caps also applied to capsules and lozenges; not to tinctures | "Edible Retail Marijuana Product" | ⚖️ Confirm how MED classifies capsules and tinctures | ☐ |
| No THC cap per package for flower or concentrates; the 8 g per day concentrate limit is a sales rule, not a COA check | [MED 2022 rules release](https://sbg.colorado.gov/sites/sbg/files/211230_New_MED_2022_Rules_Release_0.pdf) (HB21-1317) | 🟡 | ☐ |
| ⚖️ Mycotoxins and residual solvents are "review" when missing | Applicability varies by product in 4-115's table | ⚖️ | ☐ |
| Pesticide action limits (≈95) | 4-115(D)(5) | 🟡 Not encoded; printed COA limits used | ☐ |

## California · adult-use and medicinal

| Value in the tool | Source | Status | You |
|---|---|---|---|
| Edibles ≤ 10 mg THC per serving, ≤ 100 mg per package | [4 CCR §17304](https://law.cornell.edu/regulations/california/4-CCR-17304) | ✅ | ☐ |
| Concentrates and topicals ≤ 1,000 mg; medical-only ≤ 2,000 mg | §17304 | ✅ | ☐ |
| Orally dissolving, medical only: ≤ 500 mg per package, ≤ 10 mg pieces | §17304 | ✅ | ☐ |
| Tinctures are concentrates (1,000 mg cap) | [DCC tincture guidance](https://www.cannabis.ca.gov/wp-content/uploads/sites/2/2022/11/beverage-and-tincture-guidance_legal-draft_2022-1031.pdf) | ✅ | ☐ |
| ⚖️ Capsules treated as concentrates | Not stated in §15000 | ⚖️ Matches the market (25 mg capsules are sold); confirm with DCC | ☐ |
| Required on every sample: cannabinoids, foreign material, heavy metals, microbials, mycotoxins, moisture/water activity, pesticides, residual solvents | [§15714](https://www.law.cornell.edu/regulations/california/4-CCR-15714) | ✅ | ☐ |
| Total THC = THC + THCA × 0.877; label variance ±10% | [§15724](https://www.law.cornell.edu/regulations/california/4-CCR-15724) | ✅ | ☐ |
| STEC, Salmonella absent in 1 g; Aspergillus (4 species) for inhalables | [§15720](https://www.law.cornell.edu/regulations/california/4-CCR-15720) | ✅ | ☐ |
| Aflatoxins ≤ 20 µg/kg; ochratoxin A ≤ 20 µg/kg | [§15721](https://www.law.cornell.edu/regulations/california/4-CCR-15721) | ✅ | ☐ |
| Metals (µg/g), inhalable / other: Cd 0.2/0.5, Pb 0.5/0.5, As 0.2/1.5, Hg 0.1/3.0 | [§15723](https://law.cornell.edu/regulations/california/4-CCR-15723) | ✅ | ☐ |
| Water activity: flower ≤ 0.65; solid edibles ≤ 0.85 | [§15717](https://www.law.cornell.edu/regulations/california/4-CCR-15717) | ✅ | ☐ |
| Pesticide action levels revised (DCC-2025-03-R); printed COA limits used | [DCC final text](https://www.cannabis.ca.gov/cannabis-laws/rulemaking/dcc-2025-03-r-pesticide-testing/final-text/) | 🟡 Check the effective date | ☐ |
| Proposed multipack rule (DCC-2026-01-R) doesn't change THC limits | DCC proposed text, Feb. 2026 | 🟡 Watch for adoption | ☐ |

## Federal hemp

| Value in the tool | Source | Status | You |
|---|---|---|---|
| ≤ 0.4 mg total THC per container for final products, from Dec 11, 2026 | [Vicente LLP, Oct. 13, 2026](https://vicentellp.com/insights/federal-hemp-definition-change-delay/) | 🟡 Law firm summary of the statute | ☐ |
| ≤ 0.3% total THC (incl. THCA and similar cannabinoids), dry weight | same | 🟡 | ☐ |
| Synthetic cannabinoids excluded from Nov 12, 2026 (not delayed) | [Akerman LLP](https://www.akerman.com/en/perspectives/congress-approves-one-month-delay-of-federal-hemp-thc-restrictions.html); [Foley Hoag](https://foleyhoag.com/news-and-insights/blogs/cannabis-and-the-law/2026/september/a-temporary-reprieve-for-hemp-thc-products%E2%80%A6-but-what-now/) | 🟡 | ☐ |
| ⚖️ Flower: 0.4 mg per container flagged for review, not failed | The cap covers "final hemp-derived cannabinoid products"; whether retail flower is one awaits FDA guidance on "containers" ([Regulatory Oversight](https://www.regulatoryoversight.com/2025/12/congress-narrows-federal-definition-of-hemp-effectively-banning-most-intoxicating-hemp-products/); [Oklahoma AG letter](https://ag.ok.gov/wp-content/uploads/2026/01/2026-Hemp-Clarification-Letter.pdf)) | ⚖️ Flower must meet 0.3% total THC either way | ☐ |
| Watch: December continuing resolution or a federal hemp framework could change these dates | Akerman LLP | 🟡 Re-check in early December | ☐ |

## Test the tool against real COAs

The rules can be right and the reading still wrong. Before relying on a verdict:

1. **Collect 10–20 real COAs** from different labs and states (PDFs from brand websites work).
2. **For each, compare "Lab results as read" to the PDF:** every cannabinoid row, unit, serving size, and package size. Note anything missed.
3. **Recompute one THC number by hand** per COA (mg/g × grams per serving) and match it to the meter.
4. **Check that the verdict makes sense to you** as a compliance reviewer. Where it doesn't, the cause is either a reading error (fix the parser or the prompt) or a rule question (update this file).
5. **Record the results** (for example, "17 of 20 read correctly"). That's the accuracy figure to cite on a resume.
