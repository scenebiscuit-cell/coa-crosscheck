---
description: Change a rulebook value, with an official source, tests, and the verification log
agent: agent
argument-hint: Which state, which value, and the link to the new rule
---

Update a regulatory value in this project. Follow the hard rules in [copilot-instructions.md](../copilot-instructions.md), especially: never change a number without an official source.

What changed: ${input:change:State, the value, and a link to the official rule or statute}

Steps:

1. **Confirm the source.** Open the link I gave. Quote the exact sentence that sets the value and give the section number. If the link isn't an official source (a state register, administrative code, statute, or the regulator's own site), stop and ask me for one.
2. **Find every place the value is used:** `src/rules.js` (limits, panel items, tables), `src/glossary.js`, `index.html` text, `README.md`, and `docs/VERIFY.md`.
3. **Write or update a test** in `tests/core.test.js` that would fail with the old value and pass with the new one. Run it and show it failing.
4. **Make the change.** Update the value, its `cite` (text and link), and the rulebook's `verified` date (today, YYYY-MM-DD). If the rule has a future effective date, set that limit's `effective` date so the checker reports "starts on" before that date.
5. **Update `docs/VERIFY.md`:** the row's value, source link, and status, plus the audit date at the top.
6. **Run `npm test`** and make sure everything passes. If the change is to Texas, remind me that the Texas-only repo (`tcup-coa-checker`) needs the same change in `src/core.js` and its README.
7. **Summarize** what changed, the quoted rule text, anything you couldn't confirm, and a suggested commit message.
