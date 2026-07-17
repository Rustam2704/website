import fs from "node:fs/promises";
import path from "node:path";

const directory = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const library = JSON.parse(await fs.readFile(path.join(directory, "data.json"), "utf8"));
const meta = JSON.parse(await fs.readFile(path.join(directory, "meta.json"), "utf8"));
const index = await fs.readFile(path.join(directory, "index.html"), "utf8");
const app = await fs.readFile(path.join(directory, "app.js"), "utf8");
const curation = await readOptionalJson(path.join(directory, "curation.json"), null);
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

if (curation) {
  if (curation.count !== 60 || curation.picks?.length !== 60) errors.push("curation: expected exactly 60 picks.");
  if (Number(curation.reviewers || 0) < 3) errors.push("curation: expected at least 3 independent reviewers.");
  const curatedIds = new Set((curation.picks || []).map((pick) => pick.id));
  if (curatedIds.size !== (curation.picks || []).length) errors.push("curation: duplicate ids.");
  const enriched = (library.items || []).filter((item) => item.editorPick);
  if (enriched.length !== curatedIds.size) errors.push("curation: data enrichment count does not match picks.");
  const curatedTerritories = new Set(enriched.map((item) => item.territory));
  const allTerritories = new Set((library.items || []).map((item) => item.territory));
  for (const territory of allTerritories) {
    if (!curatedTerritories.has(territory)) errors.push(`curation: missing territory ${territory}.`);
  }
  for (const item of enriched) {
    if (!curatedIds.has(item.id)) errors.push(`${item.id}: marked curated but absent from curation.json.`);
    if (!Number.isFinite(Number(item.editorScore)) || !Number.isFinite(Number(item.editorVotes))) errors.push(`${item.id}: invalid editor score or votes.`);
    if (!Array.isArray(item.editorLenses) || !item.editorLenses.length || !String(item.editorNote || "").trim()) errors.push(`${item.id}: incomplete editor metadata.`);
  }
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

async function readOptionalJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}
