import fs from "node:fs/promises";
import path from "node:path";

const directory = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const reviewsDirectory = path.join(directory, "curation", "reviews");
const library = JSON.parse(await fs.readFile(path.join(directory, "data.json"), "utf8"));
const byId = new Map(library.items.map((item) => [item.id, item]));
const territories = [...new Set(library.items.map((item) => item.territory))];
const files = (await fs.readdir(reviewsDirectory)).filter((filename) => filename.endsWith(".json")).sort();

if (files.length < 3) throw new Error(`Expected at least 3 independent review files; received ${files.length}.`);

const candidates = new Map();

for (const filename of files) {
  const review = JSON.parse(await fs.readFile(path.join(reviewsDirectory, filename), "utf8"));
  if (!review.lens || !Array.isArray(review.picks)) throw new Error(`${filename}: expected lens and picks.`);
  if (review.picks.length !== 60) throw new Error(`${filename}: expected exactly 60 picks; received ${review.picks.length}.`);

  const reviewIds = new Set(review.picks.map((pick) => pick.id));
  if (reviewIds.size !== review.picks.length) throw new Error(`${filename}: contains duplicate ids.`);
  const coveredTerritories = new Set(review.picks.map((pick) => byId.get(pick.id)?.territory).filter(Boolean));
  const missingTerritories = territories.filter((territory) => !coveredTerritories.has(territory));
  if (missingTerritories.length) throw new Error(`${filename}: missing territories: ${missingTerritories.join(", ")}.`);

  for (const pick of review.picks) {
    const item = byId.get(pick.id);
    if (!item) throw new Error(`${filename}: unknown id ${pick.id}.`);
    const score = Number(pick.score);
    if (!Number.isFinite(score) || score < 1 || score > 10) throw new Error(`${filename}: invalid score for ${pick.id}.`);
    if (!String(pick.reason || "").trim()) throw new Error(`${filename}: missing reason for ${pick.id}.`);
    if (wordCount(pick.reason) > 16) throw new Error(`${filename}: reason for ${pick.id} exceeds 16 words.`);

    const candidate = candidates.get(pick.id) || { id: pick.id, territory: item.territory, headline: item.headline, scores: [], lenses: [], reasons: [] };
    candidate.scores.push(score);
    candidate.lenses.push(review.lens);
    candidate.reasons.push(String(pick.reason).trim());
    candidates.set(pick.id, candidate);
  }
}

const ranked = [...candidates.values()].map((candidate) => ({
  ...candidate,
  votes: candidate.scores.length,
  score: Number((candidate.scores.reduce((sum, value) => sum + value, 0) / candidate.scores.length).toFixed(1))
})).sort(compareCandidates);

const selected = [];
const selectedIds = new Set();

for (const territory of territories) {
  const candidate = ranked.find((entry) => entry.territory === territory && !selectedIds.has(entry.id));
  if (candidate) add(candidate);
}

for (const candidate of ranked) {
  if (selected.length >= 60) break;
  add(candidate);
}

if (selected.length !== 60) throw new Error(`Expected 60 curated picks; selected ${selected.length}.`);
const selectedTerritories = new Set(selected.map((candidate) => candidate.territory));
const missingSelectedTerritories = territories.filter((territory) => !selectedTerritories.has(territory));
if (missingSelectedTerritories.length) throw new Error(`Curated set missing territories: ${missingSelectedTerritories.join(", ")}.`);

const curation = {
  generatedAt: new Date().toISOString(),
  reviewers: files.length,
  count: selected.length,
  picks: selected.sort(compareCandidates).map((candidate) => ({
    id: candidate.id,
    score: candidate.score,
    votes: candidate.votes,
    lenses: [...new Set(candidate.lenses)],
    note: [...new Set(candidate.reasons)].slice(0, 2).join(" ")
  }))
};

await fs.writeFile(path.join(directory, "curation.json"), `${JSON.stringify(curation, null, 2)}\n`, "utf8");
console.log(`Curated ${curation.count} picks from ${candidates.size} reviewed systems across ${files.length} lenses.`);

function add(candidate) {
  if (selectedIds.has(candidate.id) || selected.length >= 60) return;
  selected.push(candidate);
  selectedIds.add(candidate.id);
}

function compareCandidates(left, right) {
  return right.votes - left.votes || right.score - left.score || numericId(left.id) - numericId(right.id);
}

function numericId(id) {
  return Number(String(id).replace(/\D/g, "")) || 0;
}

function wordCount(value) {
  return String(value).trim().split(/\s+/).filter(Boolean).length;
}
