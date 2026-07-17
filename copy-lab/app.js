(function () {
  const variants = Array.isArray(window.COPY_VARIANTS) ? window.COPY_VARIANTS : [];
  const offer = window.COPY_OFFER || {};
  const variantId = document.documentElement.dataset.copyVariant;
  const currentVariant = variants.find((item) => item.id === variantId);

  initStars();

  if (document.body.dataset.copyIndex === "true") {
    renderIndex();
    return;
  }

  if (!currentVariant) return;

  initVariantNavigation();
  initChat();

  function initVariantNavigation() {
    const currentIndex = variants.findIndex((item) => item.id === variantId);
    const previous = variants[(currentIndex - 1 + variants.length) % variants.length];
    const next = variants[(currentIndex + 1) % variants.length];
    const previousLink = document.querySelector("#previous-variant");
    const nextLink = document.querySelector("#next-variant");

    if (previousLink) previousLink.href = `v${previous.id}.html`;
    if (nextLink) nextLink.href = `v${next.id}.html`;
  }

  function renderIndex() {
    const grid = document.querySelector("#variant-grid");
    if (!grid) return;

    grid.innerHTML = variants.map((variant) => `
      <a class="variant-card" href="v${escapeHtml(variant.id)}.html">
        <span class="variant-card-arrow" aria-hidden="true">↗</span>
        <div>
          <span class="variant-card-id">${escapeHtml(variant.id)} · ${escapeHtml(variant.name)}</span>
          <h2>${escapeHtml(variant.headline)}</h2>
        </div>
        <p>${escapeHtml(variant.support)}</p>
        <p class="variant-card-offer">
          <span>${escapeHtml(offer.label)}</span>
          <strong>${escapeHtml(offer.price)}</strong>
        </p>
      </a>
    `).join("");
  }

  function initChat() {
    const form = document.querySelector("#chat-form");
    const input = document.querySelector("#chat-input");
    const thread = document.querySelector("#chat-thread");
    const buttonLabel = document.querySelector("#send-button-label");
    const status = document.querySelector("#composer-status");
    const rotatingPrompt = document.querySelector("#rotating-prompt");
    if (!form || !input || !thread || !buttonLabel || !status) return;

    const storageKey = `fanatic-copy-lab-chat-${variantId}`;
    const state = loadState(storageKey);
    const commonPrompts = [
      currentVariant.incoming,
      "I do not know where to start.",
      "I am trying to set up AI, but I cannot formulate the real goal.",
      "Everything works, but the whole process feels much harder than it should."
    ];
    let promptIndex = 0;
    let promptTimer = null;

    state.messages.forEach((message) => appendMessage(message.role, message.text, false));

    if (rotatingPrompt && state.messages.length > 0) {
      rotatingPrompt.closest(".message")?.remove();
    }

    if (rotatingPrompt && state.messages.length === 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      promptTimer = window.setInterval(() => {
        promptIndex = (promptIndex + 1) % commonPrompts.length;
        rotatingPrompt.animate(
          [{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }],
          { duration: 420, easing: "ease-out" }
        );
        window.setTimeout(() => {
          rotatingPrompt.textContent = commonPrompts[promptIndex];
        }, 210);
      }, 5200);
    }

    syncComposer();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) {
        input.focus();
        return;
      }

      if (promptTimer) {
        window.clearInterval(promptTimer);
        promptTimer = null;
      }

      if (rotatingPrompt) rotatingPrompt.closest(".message")?.remove();
      appendMessage("user", value);
      state.messages.push({ role: "user", text: value, createdAt: new Date().toISOString() });
      input.value = "";
      status.textContent = "Saving this local conversation…";
      form.querySelector("button").disabled = true;

      try {
        await deliverMessage({ variantId, stage: state.stage, text: value });

        if (state.stage === "problem") {
          state.problem = value;
          state.stage = "contact";
          await replyAfter("I’ve got the rough version. Where can I reply—your email or Telegram username?");
        } else if (state.stage === "contact") {
          state.contact = value;
          state.stage = "conversation";
          await replyAfter("Saved in this local prototype. The Telegram / CRM relay is the next connection; for now, this thread stays in your browser.");
        } else {
          await replyAfter("Added to this local thread. You can keep writing here without leaving the page.");
        }

        saveState(storageKey, state);
        syncComposer();
      } catch (error) {
        status.textContent = "Could not save locally. Your text is still visible above.";
        console.warn("Local chat save failed.", error);
      } finally {
        form.querySelector("button").disabled = false;
        input.focus();
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    function syncComposer() {
      if (state.stage === "problem") {
        input.placeholder = currentVariant.placeholder;
        buttonLabel.textContent = currentVariant.button;
        status.textContent = "Local prototype · nothing leaves this browser";
      } else if (state.stage === "contact") {
        input.placeholder = "Email or @telegram username";
        buttonLabel.textContent = "Send contact";
        status.textContent = "One detail so Rustam can reply later";
      } else {
        input.placeholder = "Continue the conversation…";
        buttonLabel.textContent = "Send message";
        status.textContent = "Conversation saved on this device";
      }
    }

    function appendMessage(role, text, animate = true) {
      const message = document.createElement("p");
      message.className = role === "user" ? "message message-outgoing" : "message message-incoming";
      if (!animate) message.style.animation = "none";
      message.textContent = text;
      thread.appendChild(message);
      thread.scrollTop = thread.scrollHeight;
    }

    async function replyAfter(text) {
      await new Promise((resolve) => window.setTimeout(resolve, 520));
      appendMessage("assistant", text);
      state.messages.push({ role: "assistant", text, createdAt: new Date().toISOString() });
    }
  }

  function loadState(key) {
    try {
      const saved = JSON.parse(window.localStorage.getItem(key));
      if (saved && Array.isArray(saved.messages)) return saved;
    } catch (error) {
      console.warn("Could not read local chat state.", error);
    }
    return { stage: "problem", messages: [], problem: "", contact: "" };
  }

  function saveState(key, state) {
    window.localStorage.setItem(key, JSON.stringify(state));
  }

  async function deliverMessage(payload) {
    const endpoint = window.FANATIC_CHAT_CONFIG?.endpoint;
    if (!endpoint) {
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      return { mode: "local" };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Chat relay returned ${response.status}`);
    return response.json();
  }

  function initStars() {
    const canvas = document.querySelector("#starfield");
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let depth = 0;
    let stars = [];
    let animationFrame = 0;
    let previousTime = 0;

    const makeStar = (randomDepth = true) => ({
      x: (Math.random() - 0.5) * width * 1.8,
      y: (Math.random() - 0.5) * height * 1.8,
      z: randomDepth ? Math.random() * depth + 1 : depth,
      opacity: 0.22 + Math.random() * 0.48,
      tint: Math.random() > 0.88 ? "174, 203, 255" : "240, 246, 255"
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      depth = Math.max(width, height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 700 ? 58 : Math.min(128, Math.round((width * height) / 11500));
      stars = Array.from({ length: count }, () => makeStar(true));
      draw(0);
    };

    const draw = (delta) => {
      context.clearRect(0, 0, width, height);
      const centerX = width * 0.5;
      const centerY = height * 0.47;
      const speed = Math.min(14, Math.max(6, width * 0.0075));

      stars.forEach((star, index) => {
        if (!reducedMotion.matches) star.z -= speed * delta;
        const scale = depth / Math.max(star.z, 1);
        const screenX = star.x * scale + centerX;
        const screenY = star.y * scale + centerY;

        if (star.z < 1 || screenX < -8 || screenX > width + 8 || screenY < -8 || screenY > height + 8) {
          stars[index] = makeStar(false);
          return;
        }

        const closeness = 1 - star.z / depth;
        const radius = 0.28 + Math.max(0, closeness) * 0.78;
        context.beginPath();
        context.arc(screenX, screenY, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${star.tint}, ${star.opacity * (0.45 + closeness * 0.55)})`;
        context.fill();
      });
    };

    const animate = (time) => {
      const delta = Math.min(0.05, Math.max(0, (time - previousTime) / 1000));
      previousTime = time;
      draw(delta);
      animationFrame = window.requestAnimationFrame(animate);
    };

    const syncAnimation = () => {
      window.cancelAnimationFrame(animationFrame);
      if (document.hidden || reducedMotion.matches) {
        draw(0);
        return;
      }
      previousTime = performance.now();
      animationFrame = window.requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", syncAnimation);
    reducedMotion.addEventListener?.("change", syncAnimation);
    resize();
    syncAnimation();
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
