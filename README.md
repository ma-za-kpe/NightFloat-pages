<!--
Night Float — Proprietary and Confidential. Copyright (c) 2026 Maku Pauline Mazakpe. All rights reserved.
Unauthorized use, copying, modification, or distribution is prohibited without written permission.
Contact: https://startuptribunal.com/maku | LinkedIn: https://www.linkedin.com/in/maku-mazakpe/ | GitHub: https://github.com/ma-za-kpe
X: https://x.com/makumazakpe | StartupTribunal X: https://x.com/startuptribunal
-->

# Night Float simulator

An offline-capable, fictional economic simulation for explaining Night Float. It does not connect to real wallets, contain partner data, or represent regulatory approval.

## Live links

- [Night Float control room](https://ma-za-kpe.github.io/NightFloat-pages/)
- [Glossary and layperson guide](https://ma-za-kpe.github.io/NightFloat-pages/glossary/)
- [MoMo FinTech Lab pitch](https://ma-za-kpe.github.io/NightFloat-pages/pitch/)
- [Public deployment artifacts](https://github.com/ma-za-kpe/NightFloat-pages)

Owner and contact: [Maku Pauline Mazakpe](https://startuptribunal.com/maku) · [LinkedIn](https://www.linkedin.com/in/maku-mazakpe/) · [GitHub](https://github.com/ma-za-kpe) · [X](https://x.com/makumazakpe) · [StartupTribunal X](https://x.com/startuptribunal)

## Run with Docker

From the repository root:

```bash
docker compose up --build -d
```

Open `http://127.0.0.1:4173`.

## Run without Docker

From the repository root:

```bash
python3 -m http.server 4173 -d simulator
```

Then open `http://127.0.0.1:4173`.

The simulator runtime has no package dependencies and can also be deployed to any static host. Development-only test tooling is installed through npm.

The interface is responsive down to a 320 px viewport. On phones, the market and headline outcomes appear before the assumption controls, with touch-sized scenario, playback, and partner controls.

## Pages

- `/` — the source-of-truth control room, five-act wind tunnel, and six-horizon projection view
- `/glossary/` — searchable plain-language guide to the two-stock kiosk problem, operating day, partner plumbing, six-horizon earnings waterfall, eleven risks, safe language, every visual sign and term, and seventeen common questions
- `/pitch/` — eight-part MMFL partnership argument with the real wind tunnel embedded on slide four

All three pages are offline-capable and tested at 1366 × 768, a Pixel-class mobile viewport, and the exact 320 px minimum.

## Main controls

- Baseline, Night Float, and Stress presets
- Partner-backed or customer-supported hypothetical funding
- Customer opt-in, agent default risk, one utilisation-based facility fee, demand, agent mix, book cap, and score threshold
- MMFL, funding, scoring, and dusk-sweeper outage toggles
- Time scrubbing, playback speeds, and a guided run
- Projection horizon: 1 day, 1 week, 1 month, 3 months, 6 months, or 1 year

All model data is generated from the fixed seed `2026`, making scenario comparisons repeatable.

## Shareable views

Append query parameters to open a presentation at a specific state:

```text
?scenario=off&time=36
?scenario=on&time=36
?scenario=stress&time=84
?scenario=on&time=36&bank=off
?scenario=on&time=84&defaultRate=8&sweep=off
?scenario=on&time=95&horizon=year
```

Control names in the interface can also be supplied as query parameters, making important configurations reproducible.

Open `?assumptions=1` for the one-page model sheet or `?deck=1` for presenter instrumentation.

## Verification

```bash
npm test
npm run test:e2e
```

The unit and integration suite enforces at least 95% statements, branches, functions, and lines in aggregate across all first-party JavaScript, including the simulation, glossary, and pitch. The shared projection module has an additional 100% threshold in all four dimensions. End-to-end tests cover the real browser experience at 1366 × 768, common mobile size, and the 320 px minimum.

Run `npm run test:all` for syntax, aggregate coverage, integration, and browser checks. Run `npm run record:demo` to create the WebM venue fallback under the ignored `artifacts/` directory; CI also uploads it as `night-float-backup-demo`.

`npm run precommit` is the stronger release gate: proprietary-header and formatting enforcement, JavaScript/CSS/HTML/static/security lint, zero high-severity dependency vulnerabilities, deterministic build, coverage, and all E2E viewports. The Git hook invokes this automatically.
