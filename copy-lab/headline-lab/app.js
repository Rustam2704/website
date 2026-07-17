(function () {
  const STORAGE_KEY = "fanatic-headline-lab-v1";
  const REFRESH_INTERVAL = 60000;
  const state = loadState();
  let library = normalizeLibrary(window.HEADLINE_LAB);
  let visibleItems = [];
  let toastTimer = 0;

  const elements = {
    grid: document.querySelector("#direction-grid"),
    empty: document.querySelector("#empty-state"),
    search: document.querySelector("#headline-search"),
    sort: document.querySelector("#headline-sort"),
    favoritesOnly: document.querySelector("#favorites-only"),
    random: document.querySelector("#random-direction"),
    copyShortlist: document.querySelector("#copy-shortlist"),
    filters: document.querySelector("#territory-filters"),
    totalCount: document.querySelector("#total-count"),
    visibleCount: document.querySelector("#visible-count"),
    favoriteCount: document.querySelector("#favorite-count"),
    updatedAt: document.querySelector("#updated-at"),
    syncStatus: document.querySelector("#sync-status"),
    toast: document.querySelector("#copy-toast")
  };

  bindControls();
  renderAll();
  window.setInterval(checkForUpdates, REFRESH_INTERVAL);

  function bindControls() {
    elements.search?.addEventListener("input", (event) => {
      state.query = event.target.value;
      renderCards();
    });

    elements.sort?.addEventListener("change", (event) => {
      state.sort = event.target.value;
      saveState();
      renderCards();
    });

    elements.favoritesOnly?.addEventListener("click", () => {
      state.favoritesOnly = !state.favoritesOnly;
      saveState();
      renderAll();
    });

    elements.random?.addEventListener("click", () => {
      if (!visibleItems.length) return;
      const item = visibleItems[Math.floor(Math.random() * visibleItems.length)];
      document.querySelector(`[data-direction-id="${item.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
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
      renderAll();
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
    if (elements.search && elements.search.value !== state.query) elements.search.value = state.query;
    if (elements.sort) elements.sort.value = state.sort;
  }

  function renderFilters() {
    const territories = [...new Set(library.items.map((item) => item.territory))].sort();
    const buttons = ["All", ...territories];
    if (!buttons.includes(state.territory)) state.territory = "All";
    elements.filters.innerHTML = buttons.map((territory) => `
      <button class="territory-filter" type="button" data-territory="${escapeHtml(territory)}" aria-pressed="${territory === state.territory}">
        ${escapeHtml(territory)}${territory === "All" ? ` · ${library.items.length}` : ""}
      </button>
    `).join("");
  }

  function renderCards() {
    const query = state.query.trim().toLowerCase();
    visibleItems = library.items.filter((item) => {
      if (state.territory !== "All" && item.territory !== state.territory) return false;
      if (state.favoritesOnly && !state.favorites.includes(item.id)) return false;
      if (!query) return true;
      return Object.values(item).join(" ").toLowerCase().includes(query);
    });

    visibleItems.sort((a, b) => {
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
    elements.grid.innerHTML = visibleItems.map(renderCard).join("");
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

    return `
      <article class="direction-card${favorite ? " is-favorite" : ""}" data-direction-id="${escapeHtml(item.id)}">
        <div class="card-topline">
          <div class="card-labels">
            <span class="direction-id">${escapeHtml(item.id)}</span>
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

  async function checkForUpdates() {
    try {
      elements.syncStatus.textContent = "Checking for new copy…";
      const response = await fetch(`data.json?refresh=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Update check returned ${response.status}`);
      const incoming = normalizeLibrary(await response.json());
      if (incoming.revision !== library.revision) {
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
          favorites: Array.isArray(saved.favorites) ? saved.favorites : [],
          notes: saved.notes && typeof saved.notes === "object" ? saved.notes : {}
        };
      }
    } catch (error) {
      console.warn("Could not read headline lab preferences.", error);
    }
    return { query: "", sort: "newest", territory: "All", favoritesOnly: false, favorites: [], notes: {} };
  }

  function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sort: state.sort,
      territory: state.territory,
      favoritesOnly: state.favoritesOnly,
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
