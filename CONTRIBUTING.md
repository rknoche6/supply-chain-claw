# Contributing to Supply Chain Claw

Thanks for contributing.

This project values **accuracy, comparability, and clarity** over volume. Please keep changes practical and evidence-driven.

---

## Ground rules

1. **No fabricated data**

   - Do not add guessed/placeholder numeric records.
   - If a source is uncertain/conflicting, leave it out and note the gap.

2. **Preserve quality gates**

   - All contributions should pass:
     - `npm run format:write`
     - `npm run lint`
     - `npm run test`
     - `npm run build`

3. **Keep explorer UX focused**

   - Prioritize useful workflows: search, filters, country/material drilldowns, compare, map clarity.

4. **Be explicit about comparability**
   - Make metric/unit/year differences visible.
   - Avoid misleading deltas when records are not directly comparable.

---

## Development setup

```bash
git clone https://github.com/rknoche6/supply-chain-claw.git
cd supply-chain-claw
npm install
npm run dev
```

---

## Branching and commits

- Create a focused branch per change.
- Use clear commit messages, preferably Conventional Commits:
  - `feat(...)`
  - `fix(...)`
  - `chore(...)`
  - `docs(...)`

Examples:

- `feat(compare): add matched-year-only filter`
- `fix(materials): prevent unit-mismatched delta rendering`

---

## Pull request checklist

Before opening a PR:

- [ ] I ran `npm run format:write`
- [ ] I ran `npm run lint`
- [ ] I ran `npm run test`
- [ ] I ran `npm run build`
- [ ] I verified affected pages locally
- [ ] I added/updated source citations for any new data
- [ ] I avoided adding roadmap/marketing text into explorer UI

In PR description, include:

- what changed
- why it matters for users
- screenshots/GIFs for UI changes (if applicable)
- any data sources used

---

## Data contribution guidance

For new records, include at minimum:

- value
- unit
- year
- source name
- source URL

Preferred source types:

- official/public statistical sources (USGS, UN, World Bank, IEA, FAO, etc.)

---

## What to avoid

- Huge mixed PRs with unrelated refactors + feature + data changes
- Silent behavior changes without UI/context updates
- Hidden assumptions around confidence/freshness logic

---

## Need help?

Open an issue with:

- the exact problem
- expected vs actual behavior
- reproduction steps
- relevant logs/screenshots
