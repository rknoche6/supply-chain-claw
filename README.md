# Supply Chain Claw

[Live site](https://supply-chain-claw.vercel.app)


Supply Chain Claw is an explorer-first web app for understanding global material and trade flows.

It helps you answer questions like:
- Which countries are key exporters/importers for a material?
- Where are data gaps in country-to-country exchange lanes?
- How comparable are two countries across the same material (year, unit, source, confidence)?

---

## What you can do

- **Explore materials** with source-cited country records
- **Drill into countries** for partner lanes, roles, and material evidence
- **Compare countries/materials** with strict comparability filters
- **Inspect map exchange lanes** and highlight material-link coverage gaps
- **Review methodology** and data-quality rules (confidence/freshness/source coverage)

Core routes:
- `/` — command-center home
- `/materials` and `/materials/[slug]`
- `/countries` and `/countries/[slug]`
- `/compare`
- `/methodology`
- `/games/20-questions` (optional side feature)

---

## Product principles

1. **Explorer first**: practical navigation and drilldowns over marketing fluff.
2. **Accuracy first**: no invented records. Every data row should have value, unit, year, source name, and source URL.
3. **Comparability first**: expose metric/unit/year alignment clearly.
4. **Transparency first**: confidence and freshness are visible in the UI.

---

## Tech stack

- **Next.js 14** (App Router)
- **React + TypeScript**
- **Vitest** for tests
- **ESLint + Prettier** for quality/formatting

---

## Local development

### Prerequisites

- Node.js 22+
- npm

### Setup

```bash
git clone https://github.com/rknoche6/supply-chain-claw.git
cd supply-chain-claw
npm install
```

### Run

```bash
npm run dev
```

### Quality gates

```bash
npm run format:write
npm run lint
npm run test
npm run build
```

---

## Data quality model

The app is designed around source-cited, structured records.

Expected fields per record:
- material/product
- country
- metric
- value
- unit
- year
- source name
- source URL
- confidence/freshness derivation (where applicable)

When records are uncertain or conflicting, they should be skipped until properly validated.

---

## Project status

This is an actively evolving project with frequent incremental updates.

Current direction:
- Expand high-quality material coverage
- Improve map usability for exchange-lane decisions
- Improve country-to-country comparability and evidence clarity

---

## Contributing

Contributions are welcome. Please read **[CONTRIBUTING.md](./CONTRIBUTING.md)** before opening a PR.

---

## License

No license file is currently defined in this repository.
Add a `LICENSE` file if you want to publish usage terms for code reuse.
