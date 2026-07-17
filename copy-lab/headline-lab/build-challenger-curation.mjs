import fs from "node:fs/promises";
import path from "node:path";

const directory = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const reviewsDirectory = path.join(directory, "curation", "challenger-reviews");
const library = JSON.parse(await fs.readFile(path.join(directory, "data.json"), "utf8"));
const byId = new Map(library.items.map((item) => [item.id, item]));
const eligible = library.items.filter((item) => item.batch.endsWith("challengers"));
const eligibleIds = new Set(eligible.map((item) => item.id));
const batches = [...new Set(eligible.map((item) => item.batch))].sort();
const files = (await fs.readdir(reviewsDirectory)).filter((filename) => filename.endsWith(".json")).sort();

if (batches.length !== 3) throw new Error(`Expected 3 challenger batches; received ${batches.length}.`);
if (eligible.length !== 30) throw new Error(`Expected 30 challenger systems; received ${eligible.length}.`);
if (files.length < 3) throw new Error(`Expected at least 3 independent challenger reviews; received ${files.length}.`);

const candidates = new Map();
for (const filename of files) {
  const review = JSON.parse(await fs.readFile(path.join(reviewsDirectory, filename), "utf8"));
  if (!review.lens || !Array.isArray(review.picks)) throw new Error(`${filename}: expected lens and picks.`);
  if (review.picks.length !== 6) throw new Error(`${filename}: expected exactly 6 picks; received ${review.picks.length}.`);
  const reviewIds = new Set(review.picks.map((pick) => pick.id));
  if (reviewIds.size !== review.picks.length) throw new Error(`${filename}: contains duplicate ids.`);

  for (const batch of batches) {
    if (!review.picks.some((pick) => byId.get(pick.id)?.batch === batch)) throw new Error(`${filename}: missing ${batch}.`);
  }

  for (const pick of review.picks) {
    if (!eligibleIds.has(pick.id)) throw new Error(`${filename}: ${pick.id} is not a challenger candidate.`);
    const score = Number(pick.score);
    if (!Number.isFinite(score) || score < 1 || score > 10) throw new Error(`${filename}: invalid score for ${pick.id}.`);
    const reason = String(pick.reason || "").trim();
    if (!reason) throw new Error(`${filename}: missing reason for ${pick.id}.`);
    if (wordCount(reason) > 16) throw new Error(`${filename}: reason for ${pick.id} exceeds 16 words.`);
    const item = byId.get(pick.id);
    const candidate = candidates.get(pick.id) || { id: pick.id, batch: item.batch, scores: [], lenses: [], reasons: [] };
    candidate.scores.push(score);
    candidate.lenses.push(review.lens);
    candidate.reasons.push(reason);
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
for (const batch of batches) add(ranked.find((candidate) => candidate.batch === batch));
for (const candidate of ranked) {
  if (selected.length >= 6) break;
  add(candidate);
}
if (selected.length !== 6) throw new Error(`Expected 6 challenger finalists; selected ${selected.length}.`);

const curation = {
  generatedAt: new Date().toISOString(),
  reviewers: files.length,
  eligible: eligible.length,
  count: selected.length,
  picks: selected.sort(compareCandidates).map((candidate) => ({
    id: candidate.id,
    score: candidate.score,
    votes: candidate.votes,
    lenses: [...new Set(candidate.lenses)],
    note: [...new Set(candidate.reasons)].slice(0, 2).join(" ")
  }))
};

await fs.writeFile(path.join(directory, "challenger-curation.json"), `${JSON.stringify(curation, null, 2)}\n`, "utf8");
console.log(`Selected ${curation.count} finalists from ${curation.eligible} challengers across ${curation.reviewers} lenses.`);

function add(candidate) {
  if (!candidate || selectedIds.has(candidate.id) || selected.length >= 6) return;
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
