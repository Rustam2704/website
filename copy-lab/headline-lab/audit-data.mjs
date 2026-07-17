import fs from "node:fs/promises";
import path from "node:path";

const directory = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const library = JSON.parse(await fs.readFile(path.join(directory, "data.json"), "utf8"));
const stopwords = new Set(["a", "an", "and", "as", "at", "before", "for", "from", "get", "in", "into", "it", "of", "on", "one", "or", "the", "to", "with", "without", "you", "your"]);
const riskyClaims = /guaranteed|best in|world-class|instant results?|perfect solution|always works|zero risk|100%/i;
const pairs = [];
const iterationPairs = [];
const issues = [];

for (const [index, item] of library.items.entries()) {
  if (riskyClaims.test([item.eyebrow, item.headline, item.subheadline, item.proofLine].join(" "))) {
    issues.push(`${item.id}: risky or inflated claim language.`);
  }
  if (/\b(?:11|12|13|14|15|16|17|18|19|20)\+? years\b/i.test(item.proofLine)) issues.push(`${item.id}: unverified experience number.`);

  for (let otherIndex = index + 1; otherIndex < library.items.length; otherIndex += 1) {
    const other = library.items[otherIndex];
    const similarity = jaccard(tokens(item.headline), tokens(other.headline));
    if (similarity >= 0.66) pairs.push({ left: item.id, right: other.id, similarity, a: item.headline, b: other.headline });
    if (similarity >= 0.5 && (isIteration(item) || isIteration(other))) {
      iterationPairs.push({ left: item.id, right: other.id, similarity, a: item.headline, b: other.headline });
    }
  }
}

pairs.sort((left, right) => right.similarity - left.similarity);

console.log(`Audited ${library.items.length} systems.`);
console.log(`High-overlap headline pairs: ${pairs.length}.`);
pairs.slice(0, 30).forEach((pair) => {
  console.log(`${pair.left}/${pair.right} ${(pair.similarity * 100).toFixed(0)}%\n  ${pair.a}\n  ${pair.b}`);
});
console.log(`Strict iteration-overlap pairs: ${iterationPairs.length}.`);
iterationPairs.slice(0, 20).forEach((pair) => {
  console.log(`${pair.left}/${pair.right} ${(pair.similarity * 100).toFixed(0)}%\n  ${pair.a}\n  ${pair.b}`);
});
if (iterationPairs.length) issues.push(`Strict iteration audit found ${iterationPairs.length} headline pair(s) at or above 50% similarity.`);

if (issues.length) {
  console.error(issues.join("\n"));
  process.exitCode = 1;
} else {
  console.log("No inflated or unverified claim patterns found.");
}

function tokens(value) {
  return new Set(String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter((word) => word && !stopwords.has(word)));
}

function jaccard(left, right) {
  const intersection = [...left].filter((word) => right.has(word)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

function isIteration(item) {
  return /(?:refinements|challengers|ab-tests)$/.test(String(item.batch));
}
