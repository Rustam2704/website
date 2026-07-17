import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const directory = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const variantsSource = await fs.readFile(path.join(directory, "variants.js"), "utf8");
const scope = {};
vm.runInNewContext(variantsSource, { window: scope });
const variants = scope.COPY_VARIANTS;
const offer = scope.COPY_OFFER;

if (!Array.isArray(variants) || variants.length !== 20) {
  throw new Error(`Expected exactly 20 copy variants, received ${variants?.length ?? 0}.`);
}

if (!offer?.label || !offer?.price || !offer?.detail) {
  throw new Error("Expected a complete monthly offer in COPY_OFFER.");
}

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const page = (variant) => `<!doctype html>
<html lang="en" data-copy-variant="${escapeHtml(variant.id)}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <meta name="description" content="${escapeHtml(variant.support)}">
    <title>${escapeHtml(variant.id)} · ${escapeHtml(variant.name)} · Rustam</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <canvas id="starfield" aria-hidden="true"></canvas>
    <div class="aurora" aria-hidden="true"></div>

    <header class="lab-toolbar">
      <div class="lab-brand">
        <span class="lab-dot" aria-hidden="true"></span>
        <strong>RUSTAM</strong>
        <span>personal technical help</span>
      </div>
      <nav class="lab-switcher" aria-label="Copy variant navigation">
        <a id="previous-variant" href="index.html" aria-label="Previous copy variant">←</a>
        <a class="lab-all" href="index.html"><span>Copy direction&nbsp;</span>${escapeHtml(variant.id)} / 20</a>
        <a id="next-variant" href="index.html" aria-label="Next copy variant">→</a>
      </nav>
    </header>

    <main class="experience">
      <section class="hero-grid" aria-labelledby="hero-headline">
        <article class="chat-panel" aria-label="Start a private conversation with Rustam">
          <header class="chat-header">
            <span class="avatar" aria-hidden="true">RA</span>
            <span class="chat-person">
              <strong>Rustam Alieskerov</strong>
              <span>personal technical specialist · online</span>
            </span>
            <span class="chat-private">direct chat</span>
          </header>

          <div class="ghost-stream" aria-hidden="true">
            <span class="ghost-line">Hi Rustam. I’m trying to formulate what I should do with my AI setup.</span>
            <span class="ghost-line">I don’t know where to start.</span>
            <span class="ghost-line">Everything works, but the whole process feels harder than it should.</span>
          </div>

          <div class="chat-thread" id="chat-thread" aria-live="polite">
            <p class="message message-incoming" id="rotating-prompt">${escapeHtml(variant.incoming)}</p>
          </div>

          <form class="chat-composer" id="chat-form">
            <label class="visually-hidden" for="chat-input">Your message to Rustam</label>
            <textarea id="chat-input" rows="3" placeholder="${escapeHtml(variant.placeholder)}" required></textarea>
            <div class="composer-row">
              <p class="composer-status" id="composer-status">Local prototype · nothing leaves this browser</p>
              <button class="send-button" type="submit">
                <span id="send-button-label">${escapeHtml(variant.button)}</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </form>
        </article>

        <div class="promise-panel">
          <p class="eyebrow">${escapeHtml(variant.eyebrow)}</p>
          <h1 id="hero-headline">${escapeHtml(variant.headline)}</h1>
          <p class="support">${escapeHtml(variant.support)}</p>
          <div class="clarity-path" aria-label="Expected output of the first conversation">
            <strong>15 min</strong>
            <span>problem → goal → next step</span>
          </div>
          <div class="monthly-offer" aria-label="${escapeHtml(offer.label)}: ${escapeHtml(offer.price)}">
            <span>${escapeHtml(offer.label)}</span>
            <strong>${escapeHtml(offer.price)}</strong>
            <small>${escapeHtml(offer.detail)}</small>
          </div>
        </div>
      </section>

      <section class="proof-zone" aria-label="Why trust Rustam">
        <h2 class="proof-heading">${escapeHtml(variant.proofHeading)}</h2>
        ${variant.proof.map(([label, text]) => `<div class="proof-item">
            <strong>${escapeHtml(label)}</strong>
            <span>${escapeHtml(text)}</span>
          </div>`).join("\n        ")}
      </section>
    </main>

    <script src="variants.js"></script>
    <script src="app.js"></script>
  </body>
</html>
`;

await Promise.all(variants.map((variant) =>
  fs.writeFile(path.join(directory, `v${variant.id}.html`), page(variant), "utf8")
));

console.log(`Generated ${variants.length} local copy pages in ${directory}`);
