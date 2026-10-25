/* Plain-language explanations shown in hover/focus tooltips. Keys are matched by GLOSSARY.lookup(). */
const GLOSSARY = (() => {
  const T = {
    "d9": ["Δ9-THC", "Delta-9-tetrahydrocannabinol, the main intoxicating compound in cannabis. Most state limits start from this number."],
    "thca": ["THCA", "The acid form of THC found in the raw plant. Heat converts it to Δ9-THC, losing some mass, so labs count THCA × 0.877 toward Total THC."],
    "d8": ["Δ8-THC", "An intoxicating THC isomer that occurs naturally only in trace amounts. High levels usually mean it was made from CBD with a chemical catalyst."],
    "d10": ["Δ10-THC", "A THC isomer usually produced by chemical conversion. Some states count it in Total THC."],
    "exo": ["exo-THC", "Δ9(11)-THC, a THC isomer that's usually a by-product of chemical conversion. Colorado counts it in Total THC."],
    "thcv": ["THCV", "Tetrahydrocannabivarin, a minor cannabinoid. It isn't counted toward THC limits."],
    "thcva": ["THCVA", "The acid form of THCV, a minor cannabinoid."],
    "cbd": ["CBD", "Cannabidiol, a non-intoxicating cannabinoid."],
    "cbda": ["CBDA", "The acid form of CBD. Labs count CBDA × 0.877 toward Total CBD."],
    "cbdv": ["CBDV", "Cannabidivarin, a minor non-intoxicating cannabinoid."],
    "cbg": ["CBG", "Cannabigerol, a minor non-intoxicating cannabinoid."],
    "cbga": ["CBGA", "The acid form of CBG; the plant's precursor to THCA and CBDA."],
    "cbn": ["CBN", "Cannabinol, which forms as THC ages. Mildly intoxicating; not counted in Total THC."],
    "cbc": ["CBC", "Cannabichromene, a minor non-intoxicating cannabinoid."],
    "hhc": ["HHC", "Hexahydrocannabinol, made by hydrogenating THC. It's semi-synthetic, so most programs don't allow it."],
    "hhco": ["HHC-O", "An acetate of HHC. Semi-synthetic."],
    "thco": ["THC-O-acetate", "An acetylated form of THC made by chemical synthesis. Not naturally produced by the plant."],
    "thcp": ["THCP", "Tetrahydrocannabiphorol, a potent THC analog. Products sold with it are usually made synthetically."],
    "thcjd": ["THC-JD", "A semi-synthetic THC analog."],
    "thch": ["THC-H", "A semi-synthetic THC analog."],
    "total_thc": ["Total THC", "The THC figure limits are measured against. Most rules use THC + THCA × 0.877; some states also count Δ8, Δ10, and exo-THC."],
    "total_cbd": ["Total CBD", "CBD + CBDA × 0.877."],

    "nd": ["ND", "Not detected: below the level the lab's method can detect."],
    "loq": ["LOQ", "Limit of quantitation: the lowest amount the lab can measure reliably. Results under it are often printed as \"<LOQ\"."],
    "lod": ["LOD", "Limit of detection: the lowest amount the lab can tell apart from zero."],
    "lt": ["Below the reporting limit", "A result printed as \"<\" a number means the amount was under the lab's lowest reportable level."],
    "%": ["% (percent by weight)", "Grams of the compound per 100 grams of product. 1% equals 10 mg/g."],
    "mg/g": ["mg/g", "Milligrams per gram of product. Multiply by the serving weight to get mg per serving."],
    "mg/mL": ["mg/mL", "Milligrams per milliliter, used for liquids such as tinctures."],
    "mg/unit": ["mg per unit", "Milligrams in one serving or dosage unit."],
    "mg/pkg": ["mg per package", "Milligrams in the whole package or container."],
    "ppm": ["ppm", "Parts per million. For solids, 1 ppm equals 1 µg/g or 1 mg/kg."],
    "ppb": ["ppb", "Parts per billion, 1,000 times smaller than ppm. For solids, 1 ppb equals 1 µg/kg."],
    "µg/g": ["µg/g", "Micrograms per gram, the same as ppm for solids."],
    "µg/kg": ["µg/kg", "Micrograms per kilogram, the same as ppb for solids."],
    "cfu/g": ["CFU/g", "Colony-forming units per gram: a count of live microbes that grew from the sample."],
    "aw": ["Water activity (aw)", "How much free water is available for mold and bacteria to grow, on a scale from 0 to 1. Lower is safer."],

    "lead": ["Lead", "A heavy metal cannabis can absorb from soil, nutrients, or equipment. Limits are usually tighter for inhaled products."],
    "arsenic": ["Arsenic", "A heavy metal that can come from contaminated soil or water."],
    "cadmium": ["Cadmium", "A heavy metal cannabis plants take up readily from soil and fertilizers."],
    "mercury": ["Mercury", "A heavy metal; rare in cannabis but tested in most states."],
    "chromium": ["Chromium", "A metal Missouri tests in addition to the usual four."],
    "stec": ["STEC", "Shiga toxin-producing E. coli, a bacterium that causes serious foodborne illness. Must be absent in 1 g."],
    "salmonella": ["Salmonella", "A foodborne pathogen. Must be absent in 1 g."],
    "aspergillus": ["Aspergillus", "Molds (A. fumigatus, flavus, niger, terreus) that can cause lung infections when inhaled. Usually required for smoked and vaped products."],
    "tymc": ["Total yeast and mold", "A count of all yeasts and molds in the sample, in CFU/g."],
    "aflatoxin": ["Aflatoxins", "Toxins made by some molds (B1, B2, G1, G2). Limits are commonly 20 µg/kg combined."],
    "ochratoxin": ["Ochratoxin A", "A mold toxin. Limits are commonly 20 µg/kg."],
    "water_activity": ["Water activity", "How much free water is available for microbes. Flower must usually be at or under 0.65 aw."],

    "potency": ["Potency", "The amount of each cannabinoid in the product."],
    "residual_solvents": ["Residual solvents", "Traces of extraction solvents such as butane or ethanol left in the product."],
    "pesticides": ["Pesticides", "Residues of chemicals used against pests or fungus during cultivation."],
    "fungicides": ["Fungicides", "Chemicals used against mold and mildew. Often reported inside the pesticide panel."],
    "fertilizers": ["Fertilizers", "Nutrient residues. Texas lists them as a required test category."],
    "microbials": ["Microbials", "Tests for harmful bacteria, yeast, and mold."],
    "mycotoxins": ["Mycotoxins", "Toxins produced by molds, such as aflatoxins and ochratoxin A."],
    "heavy_metals": ["Heavy metals", "Lead, arsenic, cadmium, and mercury (and chromium in Missouri)."],
    "moisture": ["Moisture", "Water content and water activity; high values let mold grow."],
    "mold": ["Mold", "Texas requires a mold test; labs report it as total yeast and mold."],
    "foreign_matter": ["Foreign matter", "Hair, insects, stems, or other material that shouldn't be in the product."],
    "terpenes": ["Terpenes", "Aroma compounds. Usually optional unless the label makes a terpene claim."],

    "action_level": ["Action level", "The highest amount of a contaminant allowed. A result above it fails the batch."],
    "dosage_unit": ["Dosage unit", "One serving as packaged: one gummy, one capsule, or one measured dose of a liquid."],
    "serving": ["Serving", "One portion as defined on the label, such as one gummy or one marked square of chocolate."],
    "batch": ["Batch", "All units made from the same production run. One COA covers one batch."],
    "label_variance": ["Label variance", "How far a tested amount may differ from what the label says and still be considered accurate."],
    "per_package": ["Per-package limit", "The most THC allowed in one package, container, or device."],
    "inhaled": ["Inhaled products", "Flower, pre-rolls, vapes, and concentrates. They get the tightest metal and mold limits because they go straight to the lungs."],
    "oral": ["Oral products", "Edibles, tinctures, and capsules."],
    "topical": ["Topical products", "Lotions, balms, and patches applied to the skin."],
    "coa": ["COA", "Certificate of analysis: a lab's report of what's in a batch and whether it passed required tests."],
    "dry_weight": ["Dry weight", "A result adjusted to remove the sample's water content. It reads higher than an as-received result."],
  };

  // map free text to a glossary key
  function lookup(text) {
    const s = String(text || "").trim();
    if (!s) return null;
    const low = s.toLowerCase();
    if (T[low]) return low;
    if (/^(nd|n\.d\.|not detected)$/i.test(s)) return "nd";
    if (/^<\s*lo[qd]/i.test(s)) return "loq";
    if (/^</.test(s)) return "lt";
    if (/^(µ|u)g\s*\/\s*g$/i.test(s)) return "µg/g";
    if (/^(µ|u)g\s*\/\s*kg$/i.test(s)) return "µg/kg";
    if (/^cfu\s*\/\s*g$/i.test(s)) return "cfu/g";
    if (/^mg\s*\/\s*ml$/i.test(s)) return "mg/mL";
    if (/^a\s?w$/i.test(s)) return "aw";
    if (/^total\s*thc/i.test(s)) return "total_thc";
    if (/^total\s*cbd/i.test(s)) return "total_cbd";
    if (typeof CORE !== "undefined") {
      const c = CORE.canonCannabinoid(s); if (c && T[c.key]) return c.key;
      const a = CORE.analyteKey(s); if (a && T[a]) return a;
    }
    return null;
  }
  const get = (key) => T[key] ? { title: T[key][0], body: T[key][1] } : null;
  return { lookup, get, has: (k) => !!T[k] };
})();
if (typeof module !== "undefined") module.exports = GLOSSARY;
