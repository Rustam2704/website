import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const directory = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const source = await fs.readFile(path.join(directory, "variants.js"), "utf8");
const scope = {};
vm.runInNewContext(source, { window: scope });
const variants = scope.COPY_VARIANTS;
const offer = scope.COPY_OFFER;
const errors = [];

if (!Array.isArray(variants) || variants.length !== 20) {
  errors.push(`Expected 20 variants; received ${variants?.length ?? 0}.`);
}

if (offer?.price !== "$400–$520 a month") {
  errors.push(`Expected monthly price $400–$520 a month; received ${offer?.price ?? "nothing"}.`);
}

const ids = new Set();

for (const variant of variants || []) {
  if (ids.has(variant.id)) errors.push(`Duplicate id: ${variant.id}`);
  ids.add(variant.id);

  for (const field of ["id", "name", "eyebrow", "headline", "support", "incoming", "placeholder", "button", "proofHeading"]) {
    if (!String(variant[field] || "").trim()) errors.push(`${variant.id}: missing ${field}`);
  }

  const headlineWords = variant.headline.trim().split(/\s+/).length;
  if (headlineWords > 16) errors.push(`${variant.id}: headline has ${headlineWords} words`);
  if (!Array.isArray(variant.proof) || variant.proof.length !== 3) errors.push(`${variant.id}: proof must have 3 items`);

  const filename = path.join(directory, `v${variant.id}.html`);
  const html = await fs.readFile(filename, "utf8");
  if (!html.includes(variant.headline)) errors.push(`${variant.id}: generated page headline is stale`);
  if (!html.includes(offer?.price || "__missing_offer__")) errors.push(`${variant.id}: monthly price is missing`);
  if (/\$100|\$130/.test(html)) {
    errors.push(`${variant.id}: legacy session pricing remains`);
  }
  if (!html.includes('meta name="robots" content="noindex, nofollow"')) errors.push(`${variant.id}: missing noindex`);
  if (html.includes("formsubmit.co") || html.toLowerCase().includes("telegram bot token")) {
    errors.push(`${variant.id}: local prototype contains a production transport`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Validated 20 unique copy pages, monthly pricing, concise headlines, 3 proof items each, and local-only chat transport.");
}
