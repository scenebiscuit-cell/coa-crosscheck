# Instructions for GitHub Copilot: COA Crosscheck

Read this before changing anything in this repository.

## What this project is

A static web page that checks a cannabis lab **certificate of analysis (COA)** against one state's rules (Texas, Missouri, Colorado, California, or federal hemp) and gives a verdict (Clear, Review, or Hold). Every finding cites the rule it comes from. It's a portfolio project by Nick Lax, hosted on GitHub Pages at https://scenebiscuit-cell.github.io/coa-crosscheck/. It is not legal advice.

The owner knows HTML and CSS well and is still learning JavaScript. Explain JavaScript changes in plain language, keep them small, and do one testable step at a time. He works on Windows, so give PowerShell commands.

## Hard rules

1. **No build step and no dependencies.** Plain HTML, CSS, and vanilla JavaScript in `<script>` tags. Don't add npm packages, frameworks, bundlers, or TypeScript. External scripts load only from cdnjs with an exact version (pdf.js 3.11.174 is the only one).
2. **Reading and judging stay separate.** The parser turns COA text into structured fields. The rules engine turns fields plus a rulebook into findings. Never put compliance logic in the parser, and never put COA-format guessing in the engine.
3. **Never change a regulatory number without a source.** Every limit in `src/rules.js` needs a `cite` with a working link to the official rule or statute, and the rulebook's `verified` date must be updated. If you can't confirm a value from an official source, say so and leave it alone. Don't state thresholds from memory. Record each change in `docs/VERIFY.md`.
4. **When a rule is unclear, flag it for review instead of failing it.** Use a `warn` check that explains the open question. Examples: Missouri's "800 mg of THC" (the tool shows total THC and Δ9-only), and semi-synthetic cannabinoids in CO, CA, and MO.
5. **Every compliance finding needs a citation.** Checks are added with `add(id, status, title, detail, cite)`; status is `pass`, `warn`, `fail`, or `info`.
6. **Fixtures are fictional.** Never commit a real COA, real client names, or real license numbers. Copy the *layout* of a real COA into an invented one in `tests/fixtures/`.
7. **Don't weaken or delete tests to make them pass.** Fix the code, or explain why the test was wrong.
8. **Keep the parser in sync with the Texas repo.** `scenebiscuit-cell/tcup-coa-checker` uses the same code in `src/core.js` from `/* ---------- cannabinoid names` up to `/* ---------- the AI extraction prompt`. When you change that block here, copy it there too and run its tests.

## Files

| File | What it holds | Notes |
|---|---|---|
| `src/core.js` | Parser (`parseText`, `joinLine`), AI extraction prompt and schema, the "Ask about this result" helpers (`askContext`, `askMessages`, `askRequest`, `askErrorMessage`, `sseSplit`, `anthropicStreamEvent`, `openaiStreamEvent`), THC math (`thcMath`), rules engine (`evaluate`) | Pure functions, no DOM, no network. Exports `CORE` for the browser and Node. The ask helpers sit after the shared parser block, so they are not synced to the Texas repo. |
| `src/rules.js` | One rulebook per jurisdiction as plain data: limits, required panels, contaminant tables, citations, `verified` dates | Adding a state means adding a rulebook and tests. The engine shouldn't need changes. |
| `src/glossary.js` | Tooltip explanations for underlined terms | Plain language, one or two sentences. |
| `src/samples.js` | Fictional sample COAs for the sample buttons | |
| `src/app.js` | The interface: rulebook picker, file upload with pdf.js, local Ollama reader, the Ask box with local, Claude, and OpenAI-compatible answers (visitor's own API key), report rendering, tooltips, theme | The only file that touches the DOM. API keys stay in memory unless "Remember on this device" is on; never put one in a URL, a log, or the shopper card. |
| `src/styles.css` | All styles, with color tokens on `:root` and dark-mode overrides | |
| `embed/coa-card.js` | The `<coa-card>` element sellers put on product pages, plus `COACard.encode`/`decode` for results links | Loaded by other people's websites. See "The shopper card" below. |
| `embed/card.html` | The results-link page: reads the card data after `#` and shows the card | |
| `tests/*.test.js` | Unit tests run with `node --test` | |
| `tests/fixtures/` | Fictional COAs, one per lab layout | |
| `docs/VERIFY.md` | Every regulatory value with its source and verification status | Update whenever `rules.js` changes. |

## How the parser works (`parseText` in `src/core.js`)

Labs don't share a COA layout and no state standardizes one, so the parser looks for patterns that recur across labs. In order:

1. **CSV exports** (`fromCsv`) become tab-separated rows. A "Section, Analyte, Result, ..." export becomes a header line per section.
2. **Fields** like `Batch: A1` are found with `field()` over *segments*: lines split at wide gaps and in front of known labels (`LABEL_NAMES`), with a bare `Label:` taking its value from the next line. To support a new field label, add it to `LABEL_NAMES` and to the matching `field(...)` pattern.
3. **Table rows** are split by `cellsOf()`: tabs, pipes, or 2+ spaces separate cells. With single spaces only, value-like tokens (`VALUE_TOKEN`) are read off the end of the line and the rest is the name.
4. **Sections** start at a header (`SECTION_NAME`, all-caps lines, `Name — PASS`), a status on the next line (`STATUS_LINE`), a one-line summary with several "Section Status" pairs, or a summary grid (a row of names over a row of statuses).
5. **Table headers** (`HEADER_FIRST`) set the column order. LOD, LOQ, dilution, and uncertainty columns are skipped. Units can come from the header (`Result (ppm)`) or from a units row underneath.
6. **Potency** comes from sideways tables (names in a row, unit rows under them) or row tables. When several unit columns exist, the parser prefers mg/unit, then mg/package, mg/mL, mg/g, and %.
7. **Cannabinoid names**, both abbreviations and chemical names, map to keys in `CANNABINOIDS`. Order matters: acids before their neutral forms.

The self-checks in `evaluate` (`read` check) catch misreads: impossible values, and THC rows that don't add up to the lab's printed total.

## The shopper card (`embed/`)

`CORE.toCard(data, { ruleset, result, reviewed, coaUrl })` turns a checked COA into a small JSON card (schema `coa-card/1`). The card shows the lab's results to shoppers. The verdict is included only when `reviewed` is true. Sellers share it three ways: a link to `embed/card.html#<packed data>`, a script snippet with the JSON inline, or a JSON download. Rules for this code:

- **Other websites load `embed/coa-card.js` directly, so never break existing cards.** Every card ever made with `coa-card/1` must keep rendering. Add fields only as optional extras. A change that removes or renames a field needs a new schema version (`coa-card/2`), and the script must still read version 1.
- **Render data as text only** (the `h()` helper sets `textContent`). Never use `innerHTML` with card data, and only allow `http`/`https` links.
- **Card data stays after the `#`** in links, so it never reaches a server.
- Styles live inside the element's shadow DOM. Sellers can set `--coa-accent` and a `theme` attribute; fonts follow their page.
- Tests: `tests/card.test.js`. See `docs/SHARING.md` for the seller-facing guide.

## Adding support for a new lab layout

Use the prompt file `.github/prompts/add-lab-layout.prompt.md` (type `/add-lab-layout` in Copilot Chat). The short version:

1. Write a fictional fixture in `tests/fixtures/` that copies the layout (spacing, column order, wording), not the data.
2. Add a test in `tests/layouts.test.js` that asserts the fields, cannabinoids, panels, and one evaluation result. Run it and watch it fail.
3. Make the smallest change to `parseText` that makes it pass.
4. Run `npm test`. Every existing fixture must still pass, because a fix for one lab often breaks another.

## Commands (PowerShell)

```powershell
npm test                       # all unit tests; Node 18 or newer
python -m http.server 8000     # then open http://localhost:8000
```

## Style

- Match the existing code: 2-space indent, double quotes, semicolons, `const`/`let`, small pure functions.
- Comments explain *why*, in plain English. Each regex that guesses at a lab format gets a comment with an example of the text it's for.
- Interface text is plain and specific. No jargon without a glossary tooltip. Keep the footer credit "Created by Nick Lax".
- Accessibility is required: WCAG 2.2 AA in light and dark themes, visible focus, keyboard-reachable tooltips, 24 px minimum tap targets, and no motion when the user prefers reduced motion. Use the color tokens in `styles.css`, not new hex values.
- Commit messages: imperative, under 72 characters ("Read potency tables with LOQ columns").
