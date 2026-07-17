import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const directory = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const batchesDirectory = path.join(directory, "batches");
const requiredFields = ["angle", "eyebrow", "headline", "subheadline", "chatStarter", "cta", "proofLine", "priceLine", "whyItWorks"];
const territoryByFilename = [
  [/clarity|diagnosis/i, "Clarity & Diagnosis"],
  [/friend|human|partner/i, "Technical Friend"],
  [/outcome|momentum|value/i, "Outcomes & Momentum"],
  [/ai|automation/i, "AI & Automation"],
  [/learning|mentor/i, "Learning & Mentorship"],
  [/decision|strategy/i, "Decisions & Strategy"],
  [/builder|founder|creator|team/i, "Builders & Teams"],
  [/chat|conversation|message/i, "Chat-First Experience"],
  [/distinctive|metaphor|memorable/i, "Distinctive & Memorable"],
  [/scenario|pain|trigger/i, "Problem Scenarios"],
  [/short|sharp|concise/i, "Short & Sharp"],
  [/premium|calm|understated/i, "Premium & Calm"],
  [/objection|trust|reassurance/i, "Objections & Trust"],
  [/urgent|deadline|rescue/i, "Urgent & Practical"],
  [/transform|before-after/i, "Transformations"],
  [/question-led|questions/i, "Question-Led"],
  [/rustam-voice|first-person/i, "Rustam's Voice"],
  [/audience|role-specific/i, "Audience-Specific"],
  [/alternative|contrast|versus/i, "Alternative Contrast"],
  [/proof-led|evidence/i, "Proof-Led"],
  [/fifteen-minute|15-minute/i, "15-Minute Promise"],
  [/promise-architecture|headline-formula/i, "Promise Architecture"],
  [/emotional-relief|calm-relief/i, "Emotional Relief"],
  [/follow-through|accountability|feedback-loop/i, "Follow-Through"],
  [/direct|bold|anti-hype/i, "Direct & Anti-Hype"],
  [/setup|workflow|systems/i, "Systems & Workflow"]
];

const files = (await fs.readdir(batchesDirectory))
  .filter((filename) => filename.endsWith(".json"))
  .sort((left, right) => left.localeCompare(right, "en", { numeric: true }));

if (!files.length) throw new Error("No JSON batches found.");

const items = [];
const headlines = new Set();

for (const filename of files) {
  const payload = JSON.parse(await fs.readFile(path.join(batchesDirectory, filename), "utf8"));
  const batchItems = Array.isArray(payload) ? payload : payload.items;
  const territory = Array.isArray(payload)
    ? inferTerritory(filename)
    : payload.territory || inferTerritory(filename);

  if (!Array.isArray(batchItems)) throw new Error(`${filename}: expected a JSON array or an object with items.`);

  batchItems.forEach((item, index) => {
    for (const field of requiredFields) {
      if (!String(item?.[field] || "").trim()) throw new Error(`${filename} item ${index + 1}: missing ${field}.`);
    }

    if (item.priceLine !== "$400–$520 a month") {
      throw new Error(`${filename} item ${index + 1}: priceLine must be exactly $400–$520 a month.`);
    }

    const headlineWords = item.headline.trim().split(/\s+/).length;
    if (headlineWords > 16) throw new Error(`${filename} item ${index + 1}: headline has ${headlineWords} words.`);

    const limits = { eyebrow: 12, subheadline: 30, chatStarter: 30, cta: 6, proofLine: 18, whyItWorks: 18 };
    for (const [field, limit] of Object.entries(limits)) {
      const words = wordCount(item[field]);
      if (words > limit) throw new Error(`${filename} item ${index + 1}: ${field} has ${words} words (max ${limit}).`);
    }

    const normalizedHeadline = normalize(item.headline);
    if (headlines.has(normalizedHeadline)) throw new Error(`${filename} item ${index + 1}: duplicate headline “${item.headline}”.`);
    headlines.add(normalizedHeadline);

    items.push({
      id: `H${String(items.length + 1).padStart(3, "0")}`,
      territory,
      batch: filename.replace(/\.json$/i, ""),
      ...Object.fromEntries(requiredFields.map((field) => [field, String(item[field]).trim()]))
    });
  });
}

const canonicalItems = JSON.stringify(items);
const revision = crypto.createHash("sha256").update(canonicalItems).digest("hex").slice(0, 12);
const library = {
  revision,
  updatedAt: new Date().toISOString(),
  count: items.length,
  items
};
const json = `${JSON.stringify(library, null, 2)}\n`;
const meta = `${JSON.stringify({ revision: library.revision, updatedAt: library.updatedAt, count: library.count }, null, 2)}\n`;

await Promise.all([
  fs.writeFile(path.join(directory, "data.json"), json, "utf8"),
  fs.writeFile(path.join(directory, "data.js"), `window.HEADLINE_LAB = ${json.trim()};\n`, "utf8"),
  fs.writeFile(path.join(directory, "meta.json"), meta, "utf8")
]);

console.log(`Built ${items.length} headline systems from ${files.length} batches (revision ${revision}).`);

function inferTerritory(filename) {
  return territoryByFilename.find(([pattern]) => pattern.test(filename))?.[1] || "New Experiments";
}

function normalize(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function wordCount(value) {
  return String(value).trim().split(/\s+/).filter(Boolean).length;
}
