/* COA Crosscheck: one rulebook per jurisdiction.
   Every number here comes from the cited rule or statute. "verified" is the date the citations were last checked.
   Product classes come from CORE.formClass(): smokable, inhalation, concentrate, edible, tincture, capsule, ode
   (orally dissolving), topical, suppository, other. Routes: inhaled, oral, topical. */
const RULES = (() => {
  const L = (text, url) => ({ text, url });

  const TX = {
    phase1: L("37 TAC §12.7(b)", "https://www.law.cornell.edu/regulations/texas/37-Tex-Admin-Code-SS-12-7"),
    dose: L("Occ. Code §169.001(3), as amended by HB 46 (2025)", "https://capitol.texas.gov/tlodocs/89R/analysis/html/HB00046S.htm"),
    pkg: L("Health & Safety Code ch. 487, as amended by HB 46 (2025)", "https://capitol.texas.gov/tlodocs/89R/analysis/html/HB00046S.htm"),
    phyto: L("Health & Safety Code §487.1071 (HB 46)", "https://capitol.texas.gov/tlodocs/89R/analysis/html/HB00046S.htm"),
    form: L("Occ. Code §169.001; §169.006 (pulmonary inhalation)", "https://capitol.texas.gov/tlodocs/89R/analysis/html/HB00046S.htm"),
    label: L("37 TAC §12.7(p)(6)–(8)", "https://www.law.cornell.edu/regulations/texas/37-Tex-Admin-Code-SS-12-7"),
    testing: L("TCUP overview (Vicente LLP, 2026)", "https://vicentellp.com/insights/texas-compassionate-use-program-tcup-overview/"),
  };
  const CA = {
    limits: L("4 CCR §17304", "https://law.cornell.edu/regulations/california/4-CCR-17304"),
    potency: L("4 CCR §15724", "https://www.law.cornell.edu/regulations/california/4-CCR-15724"),
    micro: L("4 CCR §15720", "https://www.law.cornell.edu/regulations/california/4-CCR-15720"),
    myco: L("4 CCR §15721", "https://www.law.cornell.edu/regulations/california/4-CCR-15721"),
    metals: L("4 CCR §15723", "https://law.cornell.edu/regulations/california/4-CCR-15723"),
    water: L("4 CCR §15717", "https://www.law.cornell.edu/regulations/california/4-CCR-15717"),
    testing: L("4 CCR §§15717–15724 (laboratory testing)", "https://www.law.cornell.edu/regulations/california/4-CCR-15724"),
  };
  const CO = {
    testing: L("1 CCR 212-3, Rule 4-115", "https://www.law.cornell.edu/regulations/colorado/1-CCR-212-3-4-115"),
    micro: L("1 CCR 212-3, Rule 4-115(D)(1)", "https://www.law.cornell.edu/regulations/colorado/1-CCR-212-3-4-115"),
    water: L("1 CCR 212-3, Rule 4-115(D)(1.5)", "https://www.law.cornell.edu/regulations/colorado/1-CCR-212-3-4-115"),
    myco: L("1 CCR 212-3, Rule 4-115(D)(2)", "https://www.law.cornell.edu/regulations/colorado/1-CCR-212-3-4-115"),
    metals: L("1 CCR 212-3, Rule 4-115(D)(4)", "https://www.law.cornell.edu/regulations/colorado/1-CCR-212-3-4-115"),
    potency: L("1 CCR 212-3, Rule 4-210(E)", "https://www.law.cornell.edu/regulations/colorado/1-CCR-212-3-4-210"),
    totalThc: L("1 CCR 212-3, Rule 1-115 (Total THC)", "https://www.sos.state.co.us/CCR/GenerateRulePdf.do?ruleVersionId=9900"),
  };
  const MO_URL = "https://www.sos.mo.gov/CMSImages/AdRules/csr/current/19csr/19c100-1.pdf";
  const MO = {
    testing: L("19 CSR 100-1.110(7)", MO_URL),
    profile: L("19 CSR 100-1.110(7)(E)", MO_URL),
    micro: L("19 CSR 100-1.110(7)(G)1", MO_URL),
    chem: L("19 CSR 100-1.110(7)(G)2", MO_URL),
    metals: L("19 CSR 100-1.110(7)(G)3", MO_URL),
    solvents: L("19 CSR 100-1.110(7)(G)4", MO_URL),
    water: L("19 CSR 100-1.110(7)(G)5", MO_URL),
    foreign: L("19 CSR 100-1.110(7)(G)6", MO_URL),
    pkg: L("19 CSR 100-1.120(4); 100-1.010(26) (800 mg THC = 1 oz)", MO_URL),
    label: L("19 CSR 100-1.120(1)(C)", MO_URL),
    guide: L("DCR packaging and labeling guide", "https://health.mo.gov/safety/cannabis/pdf/packaging-labeling-guide.pdf"),
  };
  const HEMP = {
    def: L("Federal hemp definition, as amended (Vicente LLP, Oct. 2026)", "https://vicentellp.com/insights/federal-hemp-definition-change-delay/"),
    delay: L("H.R. 6500 (2026) delay (Foley Hoag)", "https://foleyhoag.com/news-and-insights/blogs/cannabis-and-the-law/2026/september/a-temporary-reprieve-for-hemp-thc-products%E2%80%A6-but-what-now/"),
  };

  const ALL_THC = ["d9", "d8", "d10", "exo", "thca"];
  const D9_THCA = ["d9", "thca"];
  const ORAL_ETC = ["edible", "tincture", "capsule", "ode", "topical", "suppository", "concentrate", "other"];

  const caMetals = {
    inhaled: { cadmium: 0.2, lead: 0.5, arsenic: 0.2, mercury: 0.1 },
    oral: { cadmium: 0.5, lead: 0.5, arsenic: 1.5, mercury: 3.0 },
    topical: { cadmium: 0.5, lead: 0.5, arsenic: 1.5, mercury: 3.0 },
  };
  const coMetals = {
    inhaled: { lead: 0.5, arsenic: 0.2, cadmium: 0.2, mercury: 0.1 },
    oral: { lead: 1, arsenic: 1.5, cadmium: 0.5, mercury: 1.5 },
    topical: { lead: 10, arsenic: 3, cadmium: 3, mercury: 1 },
  };
  const moMetals = {
    inhaled: { arsenic: 0.2, cadmium: 0.2, chromium: 0.6, lead: 0.5, mercury: 0.1 },
    oral: { arsenic: 1.5, cadmium: 0.5, chromium: 2.0, lead: 0.5, mercury: 3.0 },
    topical: { arsenic: 1.5, cadmium: 0.5, chromium: 2.0, lead: 0.5, mercury: 3.0 },
  };

  // 19 CSR 100-1.110(7)(G)2: banned analytes, fail above (ppm). Vitamin E acetate applies to inhalables and concentrates only.
  const moPesticides = { abamectin: 0.5, acephate: 0.4, acequinocyl: 2, acetamiprid: 0.2, aldicarb: 0.4, azoxystrobin: 0.2, bifenazate: 0.2, bifenthrin: 0.2,
    boscalid: 0.4, carbaryl: 0.2, carbofuran: 0.2, chlorantraniliprole: 0.2, chlorfenapyr: 1, chlormequatchloride: 0.2, chlorpyrifos: 0.2, clofentezine: 0.2,
    cyfluthrin: 1, cypermethrin: 1, daminozide: 1, dichlorvos: 1, ddvp: 1, diazinon: 0.2, dimethoate: 0.2, ethoprophos: 0.2, etofenprox: 0.4, etoxazole: 0.2,
    fenoxycarb: 0.2, fenpyroximate: 0.4, fipronil: 0.4, flonicamid: 1, fludioxonil: 0.4, hexythiazox: 1, imazalil: 0.2, imidacloprid: 0.4, kresoximmethyl: 0.4,
    malathion: 0.2, metalaxyl: 0.2, methiocarb: 0.2, methomyl: 0.4, methylparathion: 0.2, mgk264: 0.2, myclobutanil: 0.2, naled: 0.5, oxamyl: 1, paclobutrazol: 0.4,
    permethrins: 0.2, permethrin: 0.2, prallethrin: 0.2, phosmet: 0.2, piperonylbutoxide: 2, propiconazole: 0.4, propoxur: 0.2, pyridaben: 0.2, pyrethrins: 1,
    spinosad: 0.2, spiromesifen: 0.2, spirotetramat: 0.2, spiroxamine: 0.4, tebuconazole: 0.4, thiacloprid: 0.2, thiamethoxam: 0.2, trifloxystrobin: 0.2,
    vitamineacetate: 0.2 };
  // 19 CSR 100-1.110(7)(G)4: residual solvents, fail above (ppm), inhalation vs infused
  const moSolvents = {
    inhaled: { "12dichloroethane": 2, acetone: 750, acetonitrile: 60, benzene: 1, butanes: 800, chloroform: 2, ethanol: 1000, ethylacetate: 400, ethylether: 500,
      ethyleneoxide: 5, heptane: 500, hexanes: 50, isopropylalcohol: 500, methanol: 250, methylenechloride: 125, pentanes: 750, propane: 2100, toluene: 150,
      trichloroethylene: 25, xylenes: 150 },
    oral: { "12dichloroethane": 5, acetone: 5000, acetonitrile: 410, benzene: 2, butanes: 5000, chloroform: 60, ethanol: 5000, ethylacetate: 5000, ethylether: 5000,
      ethyleneoxide: 50, heptane: 5000, hexanes: 290, isopropylalcohol: 5000, methanol: 3000, methylenechloride: 600, pentanes: 5000, propane: 5000, toluene: 890,
      trichloroethylene: 80, xylenes: 2170 },
  };
  moSolvents.topical = moSolvents.oral;
  // 1 CCR 212-3, Rule 4-115(D)(3): residual solvents, must be under (ppm)
  const coSolventsAll = { acetone: 1000, butanes: 1000, ethanol: 1000, heptane: 1000, isopropylalcohol: 1000, propane: 1000, pentanes: 1000, ethylacetate: 1000,
    benzene: 2, toluene: 180, hexanes: 60, xylenes: 430, methanol: 600 };
  const coSolvents = { inhaled: coSolventsAll, oral: coSolventsAll, topical: coSolventsAll };

  const caBase = (market) => ({
    state: "California", stateCode: "CA", regulator: "Department of Cannabis Control (DCC)",
    verified: "2026-10-24",
    totalThcKeys: D9_THCA,
    totalThcText: "THC + THCA × 0.877 (§15724). Δ8 and other isomers are reported separately; the checker shows them in the self-checks.",
    panel: {
      cite: CA.testing,
      items: [
        { key: "potency", label: "Cannabinoids", cite: CA.potency },
        { key: "heavy_metals", label: "Heavy metals", cite: CA.metals },
        { key: "microbials", label: "Microbial impurities", cite: CA.micro },
        { key: "mycotoxins", label: "Mycotoxins", cite: CA.myco },
        { key: "pesticides", label: "Residual pesticides" },
        { key: "residual_solvents", label: "Residual solvents", when: (fc) => fc !== "smokable" },
        { key: "water_activity", label: "Water activity", when: (fc, form) => fc === "smokable" || (fc === "edible" && !/beverage|drink|liquid|syrup/i.test(form || "")), cite: CA.water },
      ],
    },
    metals: { table: caMetals, unit: "µg/g", cite: CA.metals, routeLabels: { inhaled: "Inhalable", oral: "Other cannabis goods", topical: "Other cannabis goods" } },
    microbes: { cite: CA.micro, required: [
      { org: "stec", label: "STEC (Shiga toxin-producing E. coli)" },
      { org: "salmonella", label: "Salmonella" },
      { org: "aspergillus", label: "Aspergillus (fumigatus, flavus, niger, terreus)", when: (route) => route === "inhaled" },
    ] },
    mycotoxins: { cite: CA.myco, aflatoxins: 20, ochratoxin: 20, unit: "µg/kg" },
    water: { cite: CA.water, flower: 0.65, solidEdible: 0.85 },
    labelVariance: { text: "±10% between the label and the COA for any labeled cannabinoid, Total THC, or Total CBD.", cite: CA.potency },
    synthetic: { status: "warn", text: "Semi-synthetic cannabinoids such as HHC or THC-O-acetate aren't expected in licensed cannabis goods. Confirm the product's ingredients and process with the manufacturer." },
    forms: {},
    tester: { text: "California requires testing by a DCC-licensed laboratory before retail sale.", cite: CA.testing },
    sources: [CA.limits, CA.potency, CA.micro, CA.myco, CA.metals, CA.water],
    market,
  });

  const coBase = (market) => ({
    state: "Colorado", stateCode: "CO", regulator: "Marijuana Enforcement Division (MED)",
    verified: "2026-10-24",
    totalThcKeys: ALL_THC,
    totalThcText: "Δ9-THC + Δ8-THC + Δ10-THC + exo-THC + THCA × 0.877 (Rule 1-115 definition of Total THC).",
    panel: {
      cite: CO.testing,
      items: [
        { key: "potency", label: "Potency", cite: CO.potency },
        { key: "microbials", label: "Microbials", cite: CO.micro },
        { key: "heavy_metals", label: "Elemental impurities (heavy metals)", cite: CO.metals },
        { key: "pesticides", label: "Pesticides" },
        { key: "mycotoxins", label: "Mycotoxins", level: "review", cite: CO.myco },
        { key: "residual_solvents", label: "Residual solvents", level: "review", when: (fc) => fc !== "smokable" },
        { key: "water_activity", label: "Water activity", when: (fc) => fc === "smokable", cite: CO.water },
      ],
      note: "Which tests apply depends on the product type in Rule 4-115's table, so mycotoxins and residual solvents are flagged for review rather than failed when missing.",
    },
    metals: { table: coMetals, unit: "ppm", cite: CO.metals, strict: true, routeLabels: { inhaled: "Inhaled", oral: "Oral (and rectal/vaginal)", topical: "Topical / transdermal" } },
    solvents: { table: coSolvents, strict: true, cite: L("1 CCR 212-3, Rule 4-115(D)(3)", "https://www.law.cornell.edu/regulations/colorado/1-CCR-212-3-4-115"),
      exempt: (name, route) => name === "ethanol" && route !== "inhaled" },
    microbes: { cite: CO.micro, tymc: 1e4, required: [
      { org: "stec", label: "STEC (Shiga toxin-producing E. coli)" },
      { org: "salmonella", label: "Salmonella" },
      { org: "aspergillus", label: "Aspergillus (fumigatus, flavus, niger, terreus)", when: (route) => route === "inhaled" },
    ] },
    mycotoxins: { cite: CO.myco, aflatoxins: 20, ochratoxin: 20, unit: "ppb", strict: true },
    water: { cite: CO.water, flower: 0.65 },
    labelVariance: { text: "±15% for products over 2.5 mg per serving; at or under 2.5 mg, the greater of ±0.5 mg or 40%.", cite: CO.potency },
    synthetic: { status: "warn", text: "Semi-synthetic cannabinoids such as HHC or THC-O-acetate aren't expected in regulated marijuana products. Confirm the product's ingredients and process with the manufacturer." },
    forms: {},
    tester: { text: "Colorado requires testing by a MED-certified marijuana testing facility.", cite: CO.testing },
    sources: [CO.testing, CO.potency, CO.totalThc],
    market,
  });

  const SETS = [
    {
      id: "TX-MED", state: "Texas", stateCode: "TX", market: "Medical", program: "Texas Compassionate Use Program (TCUP)",
      regulator: "Texas Department of Public Safety", verified: "2026-10-24",
      headline: [{ big: "10 mg", small: "THC per dosage unit" }, { big: "1 g", small: "THC per package or device" }],
      totalThcKeys: ALL_THC,
      totalThcText: "All tetrahydrocannabinols: Δ9 + Δ8 + Δ10 + exo-THC + THCA × 0.877. The statute caps \"tetrahydrocannabinols,\" not only Δ9-THC.",
      limits: [
        { id: "dose", scope: "unit", mg: 10, forms: ["edible", "tincture", "capsule", "ode", "topical", "suppository", "concentrate", "other"], label: "THC per dosage unit", cite: TX.dose },
        { id: "pkg", scope: "pkg", mg: 1000, forms: "*", label: "THC per package or device", cite: TX.pkg },
      ],
      inhaledDoseByPrescription: true,
      panel: {
        cite: TX.phase1,
        items: [
          { key: "thc", label: "THC" }, { key: "cbd", label: "CBD" },
          { key: "residual_solvents", label: "Residual solvents" }, { key: "pesticides", label: "Pesticides" },
          { key: "mold", label: "Mold (yeast & mold)" }, { key: "heavy_metals", label: "Heavy metals" },
          { key: "fungicides", label: "Fungicides", level: "review" }, { key: "fertilizers", label: "Fertilizers", level: "review" },
        ],
        note: "TCUP rules list the categories but defer to Texas Department of Agriculture standards for methods, without their own action-limit table. Results are compared to the limits printed on the COA.",
      },
      metals: null, microbes: null, mycotoxins: null, water: null,
      labelVariance: null,
      synthetic: { status: "fail", cite: TX.phyto, text: "Only cannabinoids produced naturally by the plant, or by decarboxylation without a catalyst, are eligible for dispensing." },
      forms: {
        smokable: { status: "fail", text: "Medical use under TCUP excludes smoking, so flower and pre-rolls can't be dispensed.", cite: TX.form },
        inhalation: { status: "warn", text: "Pulmonary inhalation is allowed only when the physician prescribes it, with THC specified per dosage unit, and the device must meet state health department standards.", cite: TX.form },
      },
      traceCite: TX.label,
      tester: { text: "TCUP doesn't license independent testing labs; the dispensing organization is responsible for required testing.", cite: TX.testing },
      sources: [TX.phase1, TX.dose, TX.phyto, TX.testing],
    },
    {
      id: "MO", state: "Missouri", stateCode: "MO", market: "Medical & adult-use", program: "Missouri medical and adult-use marijuana",
      regulator: "Division of Cannabis Regulation (DCR)", verified: "2026-10-25",
      headline: [{ big: "2,400 mg", small: "THC per infused-product package (3 oz equivalent)" }, { big: "0.5 ppm", small: "Lead limit, all products" }],
      totalThcKeys: D9_THCA,
      altThc: { keys: ["d9"], label: "Δ9-THC only",
        note: "Missouri's rule says \"800 mg of THC\" without defining which THC. The checker computes both total THC (THC + THCA × 0.877) and Δ9-THC only, and asks for review when they land on opposite sides of the limit." },
      totalThcText: "Shown two ways until the Division clarifies: total THC (THC + THCA × 0.877) and Δ9-THC only. The package limit Labels list Δ9-THC per serving and package in milligrams. Δ8-THC must be reported in the cannabinoid profile and is shown in the self-checks.",
      profile: { cite: MO.profile, keys: ["d9", "thca", "cbd", "cbda", "cbn", "thcv", "cbdv", "d8"],
        labels: { d9: "Δ9-THC", thca: "THCA", cbd: "CBD", cbda: "CBDA", cbn: "CBN", thcv: "THCV", cbdv: "CBDV", d8: "Δ8-THC" },
        note: "Each analyte must vary no more than 15% from the lot mean across at least three samples." },
      limits: [
        { id: "pkg", scope: "pkg", mg: 2400, forms: ["edible", "tincture", "capsule", "ode", "topical", "suppository", "other"], label: "THC per package (3 oz equivalent)", cite: MO.pkg,
          note: "Missouri sets no per-serving THC cap. A package can't exceed 3 ounces of dried marijuana or its equivalent, and 800 mg of THC in infused products equals 1 ounce." },
        { id: "pkgw", scope: "weight", grams: 24, forms: ["concentrate", "inhalation"], label: "Concentrate per package (3 oz equivalent)", cite: MO.pkg,
          note: "For concentrates, 8 g equals 1 ounce of dried marijuana, so a package can hold at most 24 g." },
      ],
      panel: {
        cite: MO.testing,
        items: [
          { key: "potency", label: "Cannabinoid profile" }, { key: "microbials", label: "Microbials", cite: MO.micro },
          { key: "mycotoxins", label: "Mycotoxins", cite: MO.micro }, { key: "heavy_metals", label: "Heavy metals", cite: MO.metals },
          { key: "pesticides", label: "Pesticides and chemical residues", cite: MO.chem }, { key: "residual_solvents", label: "Residual solvents", cite: MO.solvents },
          { key: "water_activity", label: "Water activity", when: (fc, form) => fc === "smokable" || /hash|kief/i.test(form || "") || (fc === "edible" && !/beverage|drink|liquid|syrup/i.test(form || "")), cite: MO.water },
          { key: "foreign_matter", label: "Foreign matter", cite: MO.foreign },
        ],
        note: "Heavy-metal failures can't be remediated; other failures can be reanalyzed or remediated once under 19 CSR 100-1.110(10)–(11).",
      },
      metals: { table: moMetals, unit: "ppm", cite: MO.metals, routeLabels: { inhaled: "Inhalation product", oral: "Infused product", topical: "Infused product" } },
      microbes: { cite: MO.micro, required: [
        { org: "stec", label: "Pathogenic E. coli" }, { org: "salmonella", label: "Salmonella" },
        { org: "aspergillus", label: "Aspergillus (fumigatus, flavus, niger, terreus)" },
      ] },
      mycotoxins: { cite: MO.micro, total: 20, unit: "µg/kg" },
      water: { cite: MO.water, flower: 0.65, hashKief: 0.65, solidEdible: 0.85, moisture: "Flower and pre-rolls also fail below 5.0% or above 15.0% moisture." },
      pesticides: { table: moPesticides, cite: MO.chem },
      solvents: { table: moSolvents, cite: MO.solvents },
      labelVariance: { text: "Labels must show exact mg of each profile cannabinoid per serving. The DCR guide treats a tested amount within about 10% of a labeled amount as reasonable.", cite: MO.guide },
      synthetic: { status: "warn", text: "Semi-synthetic cannabinoids such as HHC or THC-O-acetate aren't expected in licensed marijuana products. Confirm the product's ingredients and process with the manufacturer." },
      forms: {},
      tester: { text: "Missouri requires testing by a DCR-certified testing facility, and the label must name it and the track-and-trace tag for the passing test.", cite: MO.label },
      traceCite: MO.label,
      sources: [L("19 CSR 100-1, current through the 10/31/26 Code update", MO_URL), MO.guide],
    },
    Object.assign(coBase("Adult-use (retail)"), {
      id: "CO-AU", program: "Colorado retail marijuana",
      headline: [{ big: "10 mg", small: "THC per serving (edibles)" }, { big: "100 mg", small: "THC per package (edibles)" }],
      limits: [
        { id: "serving", scope: "unit", mg: 10, forms: ["edible", "capsule", "ode"], label: "THC per serving", cite: CO.potency },
        { id: "pkg", scope: "pkg", mg: 100, forms: ["edible", "capsule", "ode"], label: "THC per package", cite: CO.potency },
      ],
    }),
    Object.assign(coBase("Medical"), {
      id: "CO-MED", program: "Colorado medical marijuana",
      headline: [{ big: "±15%", small: "Label potency tolerance (over 2.5 mg/serving)" }, { big: "0.2 ppm", small: "Arsenic limit, inhaled" }],
      limits: [],
      limitsNote: "Colorado sets no per-serving or per-package THC cap for medical edibles. The product must match its labeled THC within the potency variance.",
    }),
    Object.assign(caBase("Adult-use"), {
      id: "CA-AU", program: "California adult-use cannabis",
      headline: [{ big: "10 mg", small: "THC per serving (edibles)" }, { big: "100 mg", small: "THC per package (edibles)" }],
      limits: [
        { id: "serving", scope: "unit", mg: 10, forms: ["edible", "ode"], label: "THC per serving", cite: CA.limits },
        { id: "pkg", scope: "pkg", mg: 100, forms: ["edible", "ode"], label: "THC per package", cite: CA.limits },
        { id: "pkgc", scope: "pkg", mg: 1000, forms: ["concentrate", "topical", "tincture", "capsule", "inhalation"], label: "THC per package (concentrates and topicals)", cite: CA.limits },
      ],
    }),
    Object.assign(caBase("Medicinal"), {
      id: "CA-MED", program: "California medicinal cannabis",
      headline: [{ big: "10 mg", small: "THC per serving (edibles)" }, { big: "2,000 mg", small: "THC per package (medical concentrates and topicals)" }],
      limits: [
        { id: "serving", scope: "unit", mg: 10, forms: ["edible", "ode"], label: "THC per serving", cite: CA.limits },
        { id: "pkg", scope: "pkg", mg: 100, forms: ["edible"], label: "THC per package", cite: CA.limits },
        { id: "pkgo", scope: "pkg", mg: 500, forms: ["ode"], label: "THC per package (orally dissolving, medical only)", cite: CA.limits },
        { id: "pkgc", scope: "pkg", mg: 2000, forms: ["concentrate", "topical", "tincture", "capsule", "inhalation"], label: "THC per package (medical concentrates and topicals)", cite: CA.limits },
      ],
      limitsNote: "Medical-only limits apply only when the package is labeled \"FOR MEDICAL USE ONLY\" and sold to medicinal-use customers.",
    }),
    {
      id: "US-HEMP", state: "Federal hemp", stateCode: "US", market: "Hemp-derived products (all states)", program: "Federal hemp definition",
      regulator: "Federal law (USDA / FDA); states add their own rules", verified: "2026-10-24",
      headline: [{ big: "0.4 mg", small: "Total THC per container (from Dec 11, 2026)" }, { big: "0.3%", small: "Total THC, dry weight" }],
      totalThcKeys: ALL_THC,
      totalThcText: "Total THC includes Δ9-THC, THCA (× 0.877), and other cannabinoids with similar effects, such as Δ8.",
      limits: [
        { id: "pkg", scope: "pkg", mg: 0.4, forms: "*", label: "Total THC per container", cite: HEMP.def, effective: "2026-12-11",
          note: "Until December 11, 2026, hemp is defined by Δ9-THC at or under 0.3% on a dry-weight basis." },
      ],
      hempConcentration: { pct: 0.3, cite: HEMP.def },
      panel: null,
      panelNote: "Federal law doesn't set a contaminant testing panel for finished hemp products. Testing requirements come from the state where the product is sold.",
      metals: null, microbes: null, mycotoxins: null, water: null, labelVariance: null,
      synthetic: { status: "fail", effective: "2026-11-12", cite: HEMP.delay,
        text: "Synthetic cannabinoids, and naturally occurring cannabinoids made by chemical synthesis or outside the plant, are excluded from hemp." },
      forms: {},
      tester: null,
      sources: [HEMP.def, HEMP.delay],
    },
  ];
  return { SETS, byId: (id) => SETS.find(s => s.id === id) || SETS[0] };
})();
if (typeof module !== "undefined") module.exports = RULES;
