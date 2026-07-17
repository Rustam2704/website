(function () {
  const STORAGE_KEY = "fanatic-headline-lab-v1";
  const REFRESH_INTERVAL = 60000;
  const state = loadState();
  let library = normalizeLibrary(window.HEADLINE_LAB);
  let visibleItems = [];
  let renderLimit = state.compact ? 120 : 60;
  let toastTimer = 0;

  const elements = {
    grid: document.querySelector("#direction-grid"),
    empty: document.querySelector("#empty-state"),
    search: document.querySelector("#headline-search"),
    sort: document.querySelector("#headline-sort"),
    favoritesOnly: document.querySelector("#favorites-only"),
    compactMode: document.querySelector("#compact-mode"),
    random: document.querySelector("#random-direction"),
    copyShortlist: document.querySelector("#copy-shortlist"),
    filters: document.querySelector("#territory-filters"),
    curationNote: document.querySelector("#curation-note"),
    curationNoteCopy: document.querySelector("#curation-note-copy"),
    loadMore: document.querySelector("#load-more"),
    totalCount: document.querySelector("#total-count"),
    visibleCount: document.querySelector("#visible-count"),
    favoriteCount: document.querySelector("#favorite-count"),
    updatedAt: document.querySelector("#updated-at"),
    syncStatus: document.querySelector("#sync-status"),
    toast: document.querySelector("#copy-toast")
  };

  bindControls();
  renderAll();
  restoreLinkedDirection();
  window.setInterval(checkForUpdates, REFRESH_INTERVAL);

  function bindControls() {
    elements.search?.addEventListener("input", (event) => {
      state.query = event.target.value;
      resetRenderLimit();
      renderCards();
    });

    elements.sort?.addEventListener("change", (event) => {
      state.sort = event.target.value;
      saveState();
      resetRenderLimit();
      renderCards();
    });

    elements.favoritesOnly?.addEventListener("click", () => {
      state.favoritesOnly = !state.favoritesOnly;
      saveState();
      resetRenderLimit();
      renderAll();
    });

    elements.compactMode?.addEventListener("click", () => {
      state.compact = !state.compact;
      saveState();
      resetRenderLimit();
      renderSummary();
      renderCards();
    });

    elements.random?.addEventListener("click", () => {
      if (!visibleItems.length) return;
      const item = visibleItems[Math.floor(Math.random() * visibleItems.length)];
      const itemIndex = visibleItems.findIndex((entry) => entry.id === item.id);
      if (itemIndex >= renderLimit) {
        renderLimit = itemIndex + 1;
        renderCards();
      }
      window.requestAnimationFrame(() => document.querySelector(`[data-direction-id="${item.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    });

    elements.copyShortlist?.addEventListener("click", async () => {
      const items = library.items.filter((item) => state.favorites.includes(item.id));
      if (!items.length) return showToast("Shortlist is empty");
      await copyText(items.map(formatCopySystem).join("\n\n---\n\n"));
      showToast(`Copied ${items.length} shortlisted direction${items.length === 1 ? "" : "s"}`);
    });

    elements.filters?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-territory]");
      if (!button) return;
      state.territory = button.dataset.territory;
      saveState();
      resetRenderLimit();
      renderAll();
    });

    elements.loadMore?.addEventListener("click", () => {
      renderLimit += state.compact ? 120 : 60;
      renderCards();
    });

    elements.grid?.addEventListener("click", async (event) => {
      const favorite = event.target.closest("[data-favorite]");
      if (favorite) {
        toggleFavorite(favorite.dataset.favorite);
        return;
      }

      const copyPhrase = event.target.closest("[data-copy-phrase]");
      if (copyPhrase) {
        await copyText(copyPhrase.dataset.copyPhrase);
        showToast("Phrase copied");
        return;
      }

      const copyCard = event.target.closest("[data-copy-card]");
      if (copyCard) {
        const item = library.items.find((entry) => entry.id === copyCard.dataset.copyCard);
        if (!item) return;
        await copyText(formatCopySystem(item));
        showToast(`${item.id} copied`);
        return;
      }

      const copyLink = event.target.closest("[data-copy-link]");
      if (copyLink) {
        const id = copyLink.dataset.copyLink;
        const url = new URL(window.location.href);
        url.hash = `direction-${id}`;
        await copyText(url.toString());
        window.history.replaceState(null, "", url);
        showToast(`${id} link copied`);
      }
    });

    elements.grid?.addEventListener("input", (event) => {
      const note = event.target.closest("[data-note]");
      if (!note) return;
      state.notes[note.dataset.note] = note.value;
      saveState();
    });
  }

  function renderAll() {
    renderSummary();
    renderFilters();
    renderCards();
  }

  function renderSummary() {
    elements.totalCount.textContent = library.items.length;
    elements.favoriteCount.textContent = state.favorites.length;
    elements.updatedAt.textContent = formatDate(library.updatedAt);
    elements.favoritesOnly.setAttribute("aria-pressed", String(state.favoritesOnly));
    elements.favoritesOnly.textContent = state.favoritesOnly ? "Showing shortlist" : "Shortlist only";
    elements.compactMode.setAttribute("aria-pressed", String(state.compact));
    elements.compactMode.textContent = state.compact ? "Full cards" : "Compact scan";
    document.body.classList.toggle("is-compact", state.compact);
    if (elements.search && elements.search.value !== state.query) elements.search.value = state.query;
    if (elements.sort) elements.sort.value = state.sort;
    renderCurationNote();
  }

  function renderCurationNote() {
    if (!elements.curationNote || !elements.curationNoteCopy) return;
    const picks = library.items.filter((item) => item.editorPick);
    const refinements = library.items.filter((item) => item.refinementPick);
    elements.curationNote.hidden = picks.length === 0;
    if (!picks.length) return;
    const lenses = new Set(picks.flatMap((item) => item.editorLenses || []));
    const consensus = picks.filter((item) => Number(item.editorVotes || 0) >= 2).length;
    const refinementMessage = refinements.length ? ` ${refinements.length} second-pass systems also earned Refined finalist status.` : "";
    elements.curationNoteCopy.textContent = `${picks.length} systems were selected across ${lenses.size} independent editorial lenses; ${consensus} earned multiple votes.${refinementMessage} Start with the finalist filters, then explore Curated picks.`;
  }

  function renderFilters() {
    const territories = [...new Set(library.items.map((item) => item.territory))].sort();
    const curatedCount = library.items.filter((item) => item.editorPick).length;
    const consensusCount = library.items.filter((item) => Number(item.editorVotes || 0) >= 2).length;
    const refinementCount = library.items.filter((item) => item.refinementPick).length;
    const buttons = ["All", ...(refinementCount ? ["Refined finalists"] : []), ...(consensusCount ? ["Consensus picks"] : []), ...(curatedCount ? ["Curated picks"] : []), ...territories];
    const counts = Object.fromEntries(territories.map((territory) => [territory, library.items.filter((item) => item.territory === territory).length]));
    counts["Curated picks"] = curatedCount;
    counts["Consensus picks"] = consensusCount;
    counts["Refined finalists"] = refinementCount;
    if (!buttons.includes(state.territory)) state.territory = "All";
    elements.filters.innerHTML = buttons.map((territory) => `
      <button class="territory-filter" type="button" data-territory="${escapeHtml(territory)}" aria-pressed="${territory === state.territory}">
        ${escapeHtml(territory)} · ${territory === "All" ? library.items.length : counts[territory]}
      </button>
    `).join("");
  }

  function renderCards() {
    const query = state.query.trim().toLowerCase();
    visibleItems = library.items.filter((item) => {
      if (state.territory === "Refined finalists" && !item.refinementPick) return false;
      if (state.territory === "Consensus picks" && Number(item.editorVotes || 0) < 2) return false;
      if (state.territory === "Curated picks" && !item.editorPick) return false;
      if (state.territory !== "All" && state.territory !== "Curated picks" && state.territory !== "Consensus picks" && state.territory !== "Refined finalists" && item.territory !== state.territory) return false;
      if (state.favoritesOnly && !state.favorites.includes(item.id)) return false;
      if (!query) return true;
      return Object.values(item).join(" ").toLowerCase().includes(query);
    });

    visibleItems.sort((a, b) => {
      if (state.sort === "curated") {
        return Number(Boolean(b.refinementPick || b.editorPick)) - Number(Boolean(a.refinementPick || a.editorPick))
          || Math.max(Number(b.refinementVotes || 0), Number(b.editorVotes || 0)) - Math.max(Number(a.refinementVotes || 0), Number(a.editorVotes || 0))
          || Math.max(Number(b.refinementScore || 0), Number(b.editorScore || 0)) - Math.max(Number(a.refinementScore || 0), Number(a.editorScore || 0))
          || numericId(a.id) - numericId(b.id);
      }
      if (state.sort === "oldest") return numericId(a.id) - numericId(b.id);
      if (state.sort === "shortest") return wordCount(a.headline) - wordCount(b.headline) || numericId(a.id) - numericId(b.id);
      if (state.sort === "favorites") {
        const favoriteDifference = Number(state.favorites.includes(b.id)) - Number(state.favorites.includes(a.id));
        return favoriteDifference || numericId(b.id) - numericId(a.id);
      }
      return numericId(b.id) - numericId(a.id);
    });

    elements.visibleCount.textContent = visibleItems.length;
    elements.favoriteCount.textContent = state.favorites.length;
    elements.empty.hidden = visibleItems.length > 0;
    const renderedItems = visibleItems.slice(0, renderLimit);
    elements.grid.innerHTML = renderedItems.map(renderCard).join("");
    const remaining = Math.max(0, visibleItems.length - renderedItems.length);
    elements.loadMore.hidden = remaining === 0;
    elements.loadMore.textContent = remaining ? `Load ${Math.min(remaining, state.compact ? 120 : 60)} more · ${remaining} remaining` : "All matching directions loaded";
  }

  function renderCard(item) {
    const favorite = state.favorites.includes(item.id);
    const phrases = [
      ["Chat opener", item.chatStarter, ""],
      ["CTA", item.cta, ""],
      ["Trust", item.proofLine, ""],
      ["Offer", item.priceLine, "is-offer"],
      ["Reason", item.whyItWorks, ""]
    ];
    if (item.editorPick) phrases.push(["Editor note", item.editorNote, "is-editor-note"]);
    if (item.refinementPick) phrases.push(["Refinement note", item.refinementNote, "is-refinement-note"]);

    return `
      <article class="direction-card${favorite ? " is-favorite" : ""}${item.editorPick ? " is-editor-pick" : ""}${item.refinementPick ? " is-refinement-pick" : ""}" id="direction-${escapeHtml(item.id)}" data-direction-id="${escapeHtml(item.id)}">
        <div class="card-topline">
          <div class="card-labels">
            <button class="direction-id direction-link" type="button" data-copy-link="${escapeHtml(item.id)}" aria-label="Copy a direct link to ${escapeHtml(item.id)}">${escapeHtml(item.id)}</button>
            ${item.editorPick ? `<span class="editor-pick-label">Curated · ${escapeHtml(item.editorScore)} · ${escapeHtml(item.editorVotes)} vote${item.editorVotes === 1 ? "" : "s"}</span>` : ""}
            ${item.refinementPick ? `<span class="refinement-pick-label">Refined · ${escapeHtml(item.refinementScore)} · ${escapeHtml(item.refinementVotes)} vote${item.refinementVotes === 1 ? "" : "s"}</span>` : ""}
            <span class="direction-angle">${escapeHtml(item.territory)} · ${escapeHtml(item.angle)}</span>
          </div>
          <button class="favorite-button" type="button" data-favorite="${escapeHtml(item.id)}" aria-pressed="${favorite}" aria-label="${favorite ? "Remove from" : "Add to"} shortlist">${favorite ? "★" : "☆"}</button>
        </div>

        <div class="copy-system">
          <p class="direction-eyebrow">${escapeHtml(item.eyebrow)}</p>
          <h2>${escapeHtml(item.headline)}</h2>
          <p class="direction-subheadline">${escapeHtml(item.subheadline)}</p>
        </div>

        <div class="phrase-list">
          ${phrases.map(([label, value, className]) => `
            <div class="phrase-row ${className}">
              <span class="phrase-label">${escapeHtml(label)}</span>
              <span class="phrase-value">${escapeHtml(value)}</span>
              <button class="copy-phrase" type="button" data-copy-phrase="${escapeHtml(value)}" aria-label="Copy ${escapeHtml(label)}">⧉</button>
            </div>
          `).join("")}
        </div>

        <div class="card-footer">
          <textarea class="card-note" data-note="${escapeHtml(item.id)}" rows="1" placeholder="Your note about this direction…">${escapeHtml(state.notes[item.id] || "")}</textarea>
          <button class="copy-card" type="button" data-copy-card="${escapeHtml(item.id)}">Copy full set</button>
        </div>
      </article>
    `;
  }

  function toggleFavorite(id) {
    if (state.favorites.includes(id)) {
      state.favorites = state.favorites.filter((favoriteId) => favoriteId !== id);
    } else {
      state.favorites = [...state.favorites, id];
    }
    saveState();
    renderSummary();
    renderCards();
  }

  function restoreLinkedDirection() {
    if (!window.location.hash.startsWith("#direction-H")) return;
    const id = window.location.hash.replace("#direction-", "");
    if (library.items.some((item) => item.id === id) && !document.querySelector(window.location.hash)) {
      state.query = "";
      state.territory = "All";
      state.favoritesOnly = false;
      renderLimit = library.items.length;
      renderAll();
    }
    window.requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView({ block: "center" }));
  }

  function resetRenderLimit() {
    renderLimit = state.compact ? 120 : 60;
  }

  async function checkForUpdates() {
    try {
      elements.syncStatus.textContent = "Checking for new copy…";
      const metaResponse = await fetch(`meta.json?refresh=${Date.now()}`, { cache: "no-store" });
      if (!metaResponse.ok) throw new Error(`Update check returned ${metaResponse.status}`);
      const meta = await metaResponse.json();
      if (meta.revision !== library.revision) {
        const response = await fetch(`data.json?revision=${encodeURIComponent(meta.revision)}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Library refresh returned ${response.status}`);
        const incoming = normalizeLibrary(await response.json());
        const added = Math.max(0, incoming.items.length - library.items.length);
        library = incoming;
        renderAll();
        showToast(added ? `${added} new directions added` : "Library updated");
      }
      elements.syncStatus.textContent = "Live library";
    } catch (error) {
      console.warn("Could not refresh headline library.", error);
      elements.syncStatus.textContent = "Refresh available";
    }
  }

  function formatCopySystem(item) {
    return [
      `${item.id} · ${item.territory} · ${item.angle}`,
      `EYEBROW: ${item.eyebrow}`,
      `HEADLINE: ${item.headline}`,
      `SUPPORT: ${item.subheadline}`,
      `CHAT: ${item.chatStarter}`,
      `CTA: ${item.cta}`,
      `TRUST: ${item.proofLine}`,
      `OFFER: ${item.priceLine}`,
      `WHY: ${item.whyItWorks}`,
      item.editorPick ? `EDITOR: ${item.editorNote}` : "",
      item.refinementPick ? `REFINEMENT: ${item.refinementNote}` : "",
      state.notes[item.id] ? `NOTE: ${state.notes[item.id]}` : ""
    ].filter(Boolean).join("\n");
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 1900);
  }

  function loadState() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") {
        return {
          query: "",
          sort: saved.sort || "newest",
          territory: saved.territory || "All",
          favoritesOnly: Boolean(saved.favoritesOnly),
          compact: Boolean(saved.compact),
          favorites: Array.isArray(saved.favorites) ? saved.favorites : [],
          notes: saved.notes && typeof saved.notes === "object" ? saved.notes : {}
        };
      }
    } catch (error) {
      console.warn("Could not read headline lab preferences.", error);
    }
    return { query: "", sort: "newest", territory: "All", favoritesOnly: false, compact: false, favorites: [], notes: {} };
  }

  function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sort: state.sort,
      territory: state.territory,
      favoritesOnly: state.favoritesOnly,
      compact: state.compact,
      favorites: state.favorites,
      notes: state.notes
    }));
  }

  function normalizeLibrary(value) {
    return value && Array.isArray(value.items)
      ? value
      : { revision: "empty", updatedAt: new Date(0).toISOString(), items: [] };
  }

  function numericId(id) {
    return Number(String(id).replace(/\D/g, "")) || 0;
  }

  function wordCount(value) {
    return String(value).trim().split(/\s+/).filter(Boolean).length;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
