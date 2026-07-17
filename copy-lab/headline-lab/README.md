# Headline Lab

A growing, public-but-noindexed comparison library for Rustam's landing-page copy systems.

Each JSON file in `batches/` contributes copy sets. Run `node build-data.mjs` to validate, deduplicate, assign stable IDs, and rebuild `data.json` plus the browser fallback `data.js`. Run `node validate.mjs` before publishing.

The page stores shortlist choices and private notes only in the viewer's browser. It checks for a new deployed `data.json` every minute.
