/* Fictional sample COAs. Labs, clients and batches are invented for the demo. */
const SAMPLES = [
{ id: "tincture", label: "Tincture", hint: "Should clear",
text: `CERTIFICATE OF ANALYSIS
Pecan Bayou Analytical (fictional sample lab)
Accreditation: ISO/IEC 17025 · Cert. 9999.01 (sample)
Client: Bluebonnet Medical (fictional)
Sample Name: Relief Tincture 1:10 THC:CBD
Product Form: Tincture
Batch ID: RT-2610-014
Units per Package: 30
Dosage Unit Size: 1 mL
Net Contents: 30 mL
Date Collected: 2026-10-06
Date Tested: 2026-10-09
Date Reported: 2026-10-12

CANNABINOIDS (HPLC-DAD)
Analyte   Result   Unit
Δ9-THC   9.40   mg/mL
THCA   0.20   mg/mL
Δ8-THC   ND   mg/mL
CBD   92.10   mg/mL
CBDA   0.80   mg/mL
CBG   1.60   mg/mL
CBN   0.30   mg/mL
Total THC   9.58   mg/mL
Total CBD   92.80   mg/mL

RESIDUAL SOLVENTS — PASS
Analyte   Result   Limit   Unit   Status
Butane   ND   800   ppm   Pass
Ethanol   212   5000   ppm   Pass
Hexane   ND   290   ppm   Pass
Isopropyl alcohol   ND   500   ppm   Pass

PESTICIDES — PASS
Analyte   Result   Limit   Unit   Status
Abamectin   ND   0.1   ppm   Pass
Bifenthrin   ND   0.2   ppm   Pass
Imidacloprid   ND   0.4   ppm   Pass
Spinosad   ND   0.1   ppm   Pass

FUNGICIDES — PASS
Analyte   Result   Limit   Unit   Status
Myclobutanil   ND   0.2   ppm   Pass
Azoxystrobin   ND   0.2   ppm   Pass
Boscalid   ND   0.4   ppm   Pass

FERTILIZER RESIDUES — PASS
Analyte   Result   Limit   Unit   Status
Nitrate   12   500   ppm   Pass
Phosphate   ND   500   ppm   Pass

MICROBIALS — PASS
Analyte   Result   Limit   Unit   Status
Total yeast and mold   <100   10000   CFU/g   Pass
Total aerobic count   <100   100000   CFU/g   Pass
E. coli (STEC)   ND   ND in 1 g   —   Pass
Salmonella   ND   ND in 1 g   —   Pass

HEAVY METALS — PASS
Analyte   Result   Limit   Unit   Status
Arsenic   0.02   0.2   µg/g   Pass
Cadmium   ND   0.2   µg/g   Pass
Lead   0.05   0.5   µg/g   Pass
Mercury   ND   0.1   µg/g   Pass
`},
{ id: "gummy", label: "Gummies", hint: "Over the dose cap",
text: `CERTIFICATE OF ANALYSIS
Llano Uplift Labs (fictional sample lab)
Accreditation: ISO/IEC 17025 · Cert. 9999.02 (sample)
Client: Bluebonnet Medical (fictional)
Sample Name: Night Gummies 10 mg
Product Form: Gummy
Batch ID: NG-2609-221
Units per Package: 100
Unit Weight: 4.0 g
Net Weight: 400 g
Date Collected: 2026-09-28
Date Tested: 2026-10-01
Date Reported: 2026-10-03

CANNABINOIDS (HPLC)
Analyte   Result   Unit
Δ9-THC   2.85   mg/g
THCA   0.05   mg/g
CBD   0.40   mg/g
CBN   1.20   mg/g
Total THC   2.89   mg/g

RESIDUAL SOLVENTS — PASS
Analyte   Result   Limit   Unit   Status
Ethanol   88   5000   ppm   Pass
Butane   ND   800   ppm   Pass

PESTICIDES — PASS
Analyte   Result   Limit   Unit   Status
Bifenthrin   ND   0.2   ppm   Pass
Imidacloprid   ND   0.4   ppm   Pass

MICROBIALS — PASS
Analyte   Result   Limit   Unit   Status
Total aerobic count   1200   100000   CFU/g   Pass
E. coli (STEC)   ND   ND in 1 g   —   Pass
Salmonella   ND   ND in 1 g   —   Pass

HEAVY METALS — PASS
Analyte   Result   Limit   Unit   Status
Arsenic   ND   0.2   µg/g   Pass
Cadmium   ND   0.2   µg/g   Pass
Lead   0.11   0.5   µg/g   Pass
Mercury   ND   0.1   µg/g   Pass
`},
{ id: "vape", label: "Vape cartridge", hint: "Several failures",
text: `CERTIFICATE OF ANALYSIS
Caprock Testing Co. (fictional sample lab)
Accreditation: ISO/IEC 17025 · Cert. 9999.03 (sample)
Client: Bluebonnet Medical (fictional)
Sample Name: Calm Cartridge 1 g
Product Form: Vape cartridge
Batch ID: CC-2610-007
Units per Package: 1
Dosage Unit Size: 1.0 g
Net Weight: 1.0 g
Date Collected: 2026-10-10
Date Tested: 2026-10-13
Date Reported: 2026-10-15

CANNABINOIDS (HPLC)
Analyte   Result   Unit
Δ9-THC   81.2   %
THCA   1.1   %
Δ8-THC   6.4   %
HHC   0.9   %
CBD   0.6   %
CBG   2.3   %
Total THC   82.2   %

RESIDUAL SOLVENTS — PASS
Analyte   Result   Limit   Unit   Status
Butane   46   800   ppm   Pass
Propane   ND   2100   ppm   Pass
Ethanol   310   5000   ppm   Pass

PESTICIDES — PASS
Analyte   Result   Limit   Unit   Status
Bifenthrin   ND   0.2   ppm   Pass
Myclobutanil   ND   0.2   ppm   Pass
Spinosad   ND   0.1   ppm   Pass

MICROBIALS — PASS
Analyte   Result   Limit   Unit   Status
Total yeast and mold   <100   10000   CFU/g   Pass
Salmonella   ND   ND in 1 g   —   Pass

HEAVY METALS — FAIL
Analyte   Result   Limit   Unit   Status
Arsenic   0.04   0.2   µg/g   Pass
Cadmium   0.03   0.2   µg/g   Pass
Lead   0.62   0.5   µg/g   Fail
Mercury   ND   0.1   µg/g   Pass
`},
{ id: "flower", label: "Flower", hint: "Should clear", notIn: ["TX-MED"],
text: `CERTIFICATE OF ANALYSIS
Big Muddy Laboratories (fictional sample lab)
Accreditation: ISO/IEC 17025 · Cert. 9999.04 (sample)
Client: Current River Cultivation (fictional)
Sample Name: Ozark Haze Flower 3.5 g
Product Form: Flower
Batch ID: OH-2610-021
Net Weight: 3.5 g
Date Collected: 2026-10-05
Date Tested: 2026-10-09
Date Reported: 2026-10-11

CANNABINOIDS (HPLC)
Analyte   Result   Unit
THCA   24.60   %
Δ9-THC   0.90   %
Δ8-THC   ND   %
CBDA   0.06   %
CBD   ND   %
CBG   0.80   %
CBN   0.04   %
THCV   ND   %
CBDV   ND   %
Total THC   22.47   %

WATER ACTIVITY & MOISTURE — PASS
Analyte   Result   Limit   Unit   Status
Water activity   0.55   0.65   aw   Pass
Moisture   11.2   15   %   Pass

RESIDUAL SOLVENTS — PASS
Analyte   Result   Limit   Unit   Status
Butanes   ND   800   ppm   Pass
Ethanol   ND   1000   ppm   Pass

MICROBIALS — PASS
Analyte   Result   Limit   Unit   Status
Total yeast and mold   <100   10000   CFU/g   Pass
Aspergillus fumigatus   ND   ND in 1 g   —   Pass
Aspergillus flavus   ND   ND in 1 g   —   Pass
Aspergillus niger   ND   ND in 1 g   —   Pass
Aspergillus terreus   ND   ND in 1 g   —   Pass
E. coli (STEC)   ND   ND in 1 g   —   Pass
Salmonella   ND   ND in 1 g   —   Pass

MYCOTOXINS — PASS
Analyte   Result   Limit   Unit   Status
Total aflatoxins   ND   20   µg/kg   Pass
Ochratoxin A   ND   20   µg/kg   Pass

HEAVY METALS — PASS
Analyte   Result   Limit   Unit   Status
Arsenic   0.03   0.2   µg/g   Pass
Cadmium   ND   0.2   µg/g   Pass
Chromium   0.08   0.6   µg/g   Pass
Lead   0.09   0.5   µg/g   Pass
Mercury   ND   0.1   µg/g   Pass

PESTICIDES — PASS
Analyte   Result   Limit   Unit   Status
Abamectin   ND   0.1   ppm   Pass
Bifenazate   ND   0.1   ppm   Pass
Imidacloprid   ND   0.2   ppm   Pass
Myclobutanil   ND   0.1   ppm   Pass
Spinosad   ND   0.1   ppm   Pass

FOREIGN MATTER — PASS
Analyte   Result   Limit   Unit   Status
Foreign material (visual)   None detected   —   —   Pass
`},
{ id: "concentrate", label: "Concentrate", hint: "Depends on the state", notIn: ["TX-MED"],
text: `CERTIFICATE OF ANALYSIS
Frontier Range Analytics (fictional sample lab)
Accreditation: ISO/IEC 17025 · Cert. 9999.05 (sample)
Client: Gravel Road Extracts (fictional)
Sample Name: Peach Fuel Live Resin Badder 1 g
Product Form: Concentrate
Concentrate Type: Live Resin Badder
Batch ID: PF-2610-008
Net Weight: 1.0 g
Date Collected: 2026-10-07
Date Tested: 2026-10-10
Date Reported: 2026-10-12

CANNABINOIDS (HPLC)
Analyte   Result   Unit
THCA   72.50   %
Δ9-THC   4.10   %
Δ8-THC   ND   %
CBDA   0.10   %
CBD   ND   %
CBG   1.90   %
CBN   0.20   %
THCV   0.30   %
CBDV   ND   %
Total THC   67.68   %

RESIDUAL SOLVENTS — PASS
Analyte   Result   Limit   Unit   Status
Butanes   920   5000   ppm   Pass
Propane   140   5000   ppm   Pass
Pentanes   ND   5000   ppm   Pass
Ethanol   ND   5000   ppm   Pass

MICROBIALS — PASS
Analyte   Result   Limit   Unit   Status
Total yeast and mold   <100   10000   CFU/g   Pass
Aspergillus fumigatus   ND   ND in 1 g   —   Pass
Aspergillus flavus   ND   ND in 1 g   —   Pass
Aspergillus niger   ND   ND in 1 g   —   Pass
Aspergillus terreus   ND   ND in 1 g   —   Pass
E. coli (STEC)   ND   ND in 1 g   —   Pass
Salmonella   ND   ND in 1 g   —   Pass

MYCOTOXINS — PASS
Analyte   Result   Limit   Unit   Status
Total aflatoxins   ND   20   µg/kg   Pass
Ochratoxin A   ND   20   µg/kg   Pass

HEAVY METALS — PASS
Analyte   Result   Limit   Unit   Status
Arsenic   0.03   0.2   µg/g   Pass
Cadmium   ND   0.2   µg/g   Pass
Chromium   0.08   0.6   µg/g   Pass
Lead   0.09   0.5   µg/g   Pass
Mercury   ND   0.1   µg/g   Pass

PESTICIDES — PASS
Analyte   Result   Limit   Unit   Status
Abamectin   ND   0.1   ppm   Pass
Bifenazate   ND   0.1   ppm   Pass
Imidacloprid   ND   0.2   ppm   Pass
Myclobutanil   ND   0.1   ppm   Pass
Spinosad   ND   0.1   ppm   Pass

FOREIGN MATTER — PASS
Analyte   Result   Limit   Unit   Status
Foreign material (visual)   None detected   —   —   Pass
`},
];
if (typeof module !== "undefined") module.exports = SAMPLES;
