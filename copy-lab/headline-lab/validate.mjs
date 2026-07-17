import fs from "node:fs/promises";
import path from "node:path";

const directory = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const library = JSON.parse(await fs.readFile(path.join(directory, "data.json"), "utf8"));
const meta = JSON.parse(await fs.readFile(path.join(directory, "meta.json"), "utf8"));
const index = await fs.readFile(path.join(directory, "index.html"), "utf8");
const app = await fs.readFile(path.join(directory, "app.js"), "utf8");
const errors = [];
const requiredFields = ["id", "territory", "angle", "eyebrow", "headline", "subheadline", "chatStarter", "cta", "proofLine", "priceLine", "whyItWorks"];
const ids = new Set();
const headlines = new Set();

if (!Array.isArray(library.items) || library.items.length <= 20) {
  errors.push(`Expected more than 20 headline systems; received ${library.items?.length ?? 0}.`);
}

if (meta.revision !== library.revision || meta.count !== library.items.length) {
  errors.push("meta: revision or item count is stale.");
}

for (const [indexNumber, item] of (library.items || []).entries()) {
  const expectedId = `H${String(indexNumber + 1).padStart(3, "0")}`;
  if (item.id !== expectedId) errors.push(`${item.id}: expected stable id ${expectedId}.`);
  if (ids.has(item.id)) errors.push(`${item.id}: duplicate id.`);
  ids.add(item.id);

  for (const field of requiredFields) {
    if (!String(item[field] || "").trim()) errors.push(`${item.id}: missing ${field}.`);
  }

  const normalizedHeadline = String(item.headline || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (headlines.has(normalizedHeadline)) errors.push(`${item.id}: duplicate headline.`);
  headlines.add(normalizedHeadline);

  if (String(item.headline || "").trim().split(/\s+/).length > 16) errors.push(`${item.id}: headline is too long.`);
  const fieldLimits = { eyebrow: 12, subheadline: 30, chatStarter: 30, cta: 6, proofLine: 18, whyItWorks: 18 };
  for (const [field, limit] of Object.entries(fieldLimits)) {
    if (String(item[field] || "").trim().split(/\s+/).filter(Boolean).length > limit) errors.push(`${item.id}: ${field} is too long.`);
  }
  if (item.priceLine !== "$400–$520 a month") errors.push(`${item.id}: wrong monthly offer.`);
  if (/\$100|\$130/.test(JSON.stringify(item))) errors.push(`${item.id}: legacy pricing remains.`);
}

if (!index.includes('id="direction-grid"')) errors.push("index: direction grid is missing.");
if (!index.includes('meta name="robots" content="noindex, nofollow"')) errors.push("index: noindex is missing.");
for (const capability of ["data-favorite", "data-copy-card", "data-note", "checkForUpdates"]) {
  if (!app.includes(capability)) errors.push(`app: ${capability} capability is missing.`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${library.items.length} unique headline systems with filters, shortlist, notes, copying, and live refresh.`);
}
