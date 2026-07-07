import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const config = window.FANATIC_CRM_SUPABASE || {};
const supabase = createClient(config.url, config.anonKey);

const $ = (selector) => document.querySelector(selector);

const views = {
  authStatus: $("#auth-status"),
  authPanel: $("#auth-panel"),
  dashboard: $("#portal-dashboard"),
  authForm: $("#auth-form"),
  authEmail: $("#auth-email"),
  authMessage: $("#auth-message"),
  clientName: $("#client-name"),
  clientSummary: $("#client-summary"),
  progressRecords: $("#progress-records")
};

let user = null;

function h(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function show(element, visible) {
  element.classList.toggle("hidden", !visible);
}

function setMessage(message, isError = false) {
  views.authMessage.textContent = message || "";
  views.authMessage.classList.toggle("error", isError);
}

async function requireResult(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function boot() {
  const { data } = await supabase.auth.getSession();
  user = data.session?.user || null;

  supabase.auth.onAuthStateChange((_event, session) => {
    user = session?.user || null;
    renderRoute();
  });

  renderRoute();
}

async function renderRoute() {
  const signedIn = Boolean(user);
  views.authStatus.textContent = signedIn ? user.email : "Signed out";
  show(views.authPanel, !signedIn);
  show(views.dashboard, signedIn);

  if (signedIn) {
    await loadPortalData();
  }
}

async function loadPortalData() {
  try {
    const access = await requireResult(
      supabase
        .from("client_access")
        .select("client_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
    );

    if (!access.length) {
      views.clientName.textContent = "No client profile assigned";
      views.clientSummary.innerHTML = `<div><span>Status</span><strong>No access record found for this email.</strong></div>`;
      views.progressRecords.innerHTML = `<div class="empty-list">No progress is available yet.</div>`;
      return;
    }

    const clientId = access[0].client_id;
    const [client] = await requireResult(supabase.from("clients").select("*").eq("id", clientId).limit(1));
    const progress = await requireResult(
      supabase
        .from("progress_items")
        .select("*")
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false })
    );

    views.clientName.textContent = client.name;
    views.clientSummary.innerHTML = `
      <div><span>Area</span><strong>${h(client.area || "-")}</strong></div>
      <div><span>Goal</span><strong>${h(client.current_goal || "-")}</strong></div>
      <div><span>Status</span><strong>${h(client.status || "-")}</strong></div>
      <div><span>Plan</span><strong>${h((client.plan || "-").replaceAll("_", " "))}</strong></div>
    `;

    views.progressRecords.innerHTML = progress.length
      ? progress.map((item) => `
        <article class="record">
          <div class="record-body">
            <strong>${h(item.title)}</strong>
            <span>${h(item.status.replaceAll("_", " "))} / ${h(item.priority)}</span>
          </div>
        </article>
      `).join("")
      : `<div class="empty-list">No progress is available yet.</div>`;
  } catch (error) {
    alert(error.message);
  }
}

views.authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("Sending magic link...");
  const { error } = await supabase.auth.signInWithOtp({
    email: views.authEmail.value,
    options: { emailRedirectTo: "https://fanatic.space/portal/" }
  });
  setMessage(error ? error.message : "Magic link sent. Check email.", Boolean(error));
});

$("#sign-out-button").addEventListener("click", async () => {
  await supabase.auth.signOut();
});

boot();
