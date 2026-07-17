# Headline Lab

A growing, public-but-noindexed comparison library for Rustam's landing-page copy systems.

Each JSON file in `batches/` contributes copy sets. Run `node build-data.mjs` to validate, deduplicate, assign stable IDs, and rebuild `data.json` plus the browser fallback `data.js`. Run `node validate.mjs` before publishing.

Run `node audit-data.mjs` to surface unusually similar headlines and reject inflated or unverified claim language before a release.

Editorial workflow:

1. Place three 60-pick reviews in `curation/reviews/`, then run `node build-curation.mjs`.
2. Place three 15-pick refinement reviews in `curation/refinement-reviews/`, then run `node build-refinement-curation.mjs`.
3. Place three six-pick challenger reviews in `curation/challenger-reviews/`, then run `node build-challenger-curation.mjs`.
4. Run `node build-data.mjs`, `node validate.mjs`, and `node audit-data.mjs` in that order.

The interface exposes independent `Refined finalists`, `Consensus picks`, `Curated picks`, and `New challengers` filters. New visitors start with the smallest finalist set; `All` keeps the full archive available.

The page stores shortlist choices and private notes only in the viewer's browser. It checks for a new deployed `data.json` every minute.
