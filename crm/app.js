import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const config = window.FANATIC_CRM_SUPABASE || {};
const hasConfig = Boolean(config.url && config.anonKey);
const supabase = hasConfig ? createClient(config.url, config.anonKey) : null;

const state = {
  user: null,
  clients: [],
  clientSearch: "",
  clientStatusFilter: "all",
  selectedClient: null,
  progress: [],
  sessions: [],
  support: [],
  files: [],
  access: []
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const views = {
  setup: $("#setup-panel"),
  auth: $("#auth-panel"),
  dashboard: $("#dashboard"),
  authStatus: $("#auth-status"),
  authMessage: $("#auth-message"),
  deleteClientButton: $("#delete-client-button"),
  clientEditForm: $("#client-edit-form"),
  clientSearchInput: $("#client-search"),
  clientStatusFilter: $("#client-status-filter"),
  stats: $("#stats-grid"),
  clientList: $("#client-list"),
  selectedTitle: $("#selected-title"),
  selectedStatus: $("#selected-status"),
  emptyState: $("#empty-state"),
  clientWork: $("#client-work"),
  clientSummary: $("#client-summary"),
  progressRecords: $("#progress-records"),
  sessionRecords: $("#session-records"),
  supportRecords: $("#support-records"),
  fileRecords: $("#file-records"),
  accessRecords: $("#access-records")
};

function show(element, visible) {
  element.classList.toggle("hidden", !visible);
}

function setMessage(message, isError = false) {
  views.authMessage.textContent = message || "";
  views.authMessage.classList.toggle("error", isError);
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function h(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function cleanPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, value === "" ? null : value])
  );
}

function fillForm(form, values) {
  Object.entries(values).forEach(([key, value]) => {
    const field = form.elements[key];
    if (field) field.value = value ?? "";
  });
}

function download(filename, content, type = "text/csv") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
}

function safeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "file";
}

function storagePathFromUrl(url) {
  const prefix = "storage://client-files/";
  return url?.startsWith(prefix) ? url.slice(prefix.length) : null;
}

async function requireResult(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function boot() {
  if (!hasConfig) {
    views.authStatus.textContent = "Supabase config missing";
    show(views.setup, true);
    return;
  }

  const { data } = await supabase.auth.getSession();
  state.user = data.session?.user || null;

  supabase.auth.onAuthStateChange((_event, session) => {
    state.user = session?.user || null;
    renderRoute();
  });

  renderRoute();
}

function renderRoute() {
  const signedIn = Boolean(state.user);
  show(views.setup, false);
  show(views.auth, !signedIn);
  show(views.dashboard, signedIn);
  views.authStatus.textContent = signedIn ? state.user.email : "Signed out";

  if (signedIn) {
    loadClients();
  }
}

async function loadClients() {
  try {
    const [clients, progress, sessions, support, files] = await Promise.all([
      requireResult(
      supabase
        .from("clients")
        .select("*")
        .eq("owner_id", state.user.id)
        .order("created_at", { ascending: false })
      ),
      requireResult(supabase.from("progress_items").select("id, client_id, status").eq("owner_id", state.user.id)),
      requireResult(supabase.from("sessions").select("id, client_id").eq("owner_id", state.user.id)),
      requireResult(supabase.from("support_notes").select("id, client_id, resolved").eq("owner_id", state.user.id)),
      requireResult(supabase.from("client_files").select("id, client_id").eq("owner_id", state.user.id))
    ]);

    state.clients = withClientCounts(clients, { progress, sessions, support, files });

    if (state.selectedClient) {
      state.selectedClient = state.clients.find((client) => client.id === state.selectedClient.id) || state.clients[0] || null;
    }

    renderClients();
    renderStats();
    if (state.selectedClient) {
      await selectClient(state.selectedClient.id);
    } else {
      renderSelectedClient();
    }
  } catch (error) {
    alert(error.message);
  }
}

function countByClient(records, predicate = () => true) {
  return records.reduce((acc, record) => {
    if (predicate(record)) {
      acc[record.client_id] = (acc[record.client_id] || 0) + 1;
    }
    return acc;
  }, {});
}

function withClientCounts(clients, related) {
  const progress = countByClient(related.progress);
  const blocked = countByClient(related.progress, (record) => record.status === "blocked");
  const sessions = countByClient(related.sessions);
  const openSupport = countByClient(related.support, (record) => !record.resolved);
  const files = countByClient(related.files);

  return clients.map((client) => ({
    ...client,
    counts: {
      progress: progress[client.id] || 0,
      blocked: blocked[client.id] || 0,
      sessions: sessions[client.id] || 0,
      openSupport: openSupport[client.id] || 0,
      files: files[client.id] || 0
    }
  }));
}

function renderStats() {
  const counts = {
    leads: state.clients.filter((client) => client.status === "lead").length,
    active: state.clients.filter((client) => client.status === "active").length,
    support: state.clients.filter((client) => client.plan === "session_plus_support").length,
    total: state.clients.length
  };

  views.stats.innerHTML = `
    <article><span>Total</span><strong>${counts.total}</strong></article>
    <article><span>Leads</span><strong>${counts.leads}</strong></article>
    <article><span>Active</span><strong>${counts.active}</strong></article>
    <article><span>With support</span><strong>${counts.support}</strong></article>
  `;
}

function renderClients() {
  const clients = filteredClients();

  if (!clients.length) {
    views.clientList.innerHTML = `<div class="empty-list">No clients yet.</div>`;
    return;
  }

  views.clientList.innerHTML = clients.map((client) => `
    <button class="client-card ${state.selectedClient?.id === client.id ? "active" : ""}" type="button" data-client-id="${client.id}">
      <strong>${h(client.name)}</strong>
      <span>${h(client.email || "No email")}</span>
      <small>${h(client.status)} / ${h(client.plan.replaceAll("_", " "))}</small>
      <span class="client-card-metrics">
        <span>${client.counts?.progress || 0} progress</span>
        <span>${client.counts?.sessions || 0} sessions</span>
        <span>${client.counts?.openSupport || 0} open support</span>
        <span>${client.counts?.files || 0} files</span>
      </span>
    </button>
  `).join("");

  $$(".client-card").forEach((button) => {
    button.addEventListener("click", () => selectClient(button.dataset.clientId));
  });
}

function filteredClients() {
  const query = state.clientSearch.trim().toLowerCase();

  return state.clients.filter((client) => {
    const statusOk = state.clientStatusFilter === "all" || client.status === state.clientStatusFilter;
    if (!statusOk) return false;
    if (!query) return true;

    return [
      client.name,
      client.email,
      client.area,
      client.current_goal,
      client.timezone
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });
}

async function selectClient(clientId) {
  state.selectedClient = state.clients.find((client) => client.id === clientId) || null;
  renderClients();
  renderSelectedClient();
  if (!state.selectedClient) return;

  const clientFilter = (query) => query.eq("owner_id", state.user.id).eq("client_id", clientId);

  const [progress, sessions, support, files, access] = await Promise.all([
    requireResult(clientFilter(supabase.from("progress_items").select("*")).order("updated_at", { ascending: false })),
    requireResult(clientFilter(supabase.from("sessions").select("*")).order("date", { ascending: false })),
    requireResult(clientFilter(supabase.from("support_notes").select("*")).order("created_at", { ascending: false })),
    requireResult(clientFilter(supabase.from("client_files").select("*")).order("created_at", { ascending: false })),
    requireResult(clientFilter(supabase.from("client_access").select("*")).order("created_at", { ascending: false }))
  ]);

  state.progress = progress;
  state.sessions = sessions;
  state.support = support;
  state.files = files;
  state.access = access;

  renderRelatedRecords();
}

function renderSelectedClient() {
  const client = state.selectedClient;
  show(views.emptyState, !client);
  show(views.clientWork, Boolean(client));
  show(views.deleteClientButton, Boolean(client));

  if (!client) {
    views.selectedTitle.textContent = "No client selected";
    views.selectedStatus.textContent = "-";
    return;
  }

  views.selectedTitle.textContent = client.name;
  views.selectedStatus.textContent = client.status;
  views.clientSummary.innerHTML = `
    <div><span>Email</span><strong>${h(client.email || "-")}</strong></div>
    <div><span>Plan</span><strong>${h(client.plan.replaceAll("_", " "))}</strong></div>
    <div><span>Area</span><strong>${h(client.area || "-")}</strong></div>
    <div><span>Goal</span><strong>${h(client.current_goal || "-")}</strong></div>
  `;

  fillForm(views.clientEditForm, client);
}

function renderRelatedRecords() {
  views.progressRecords.innerHTML = renderRecordList(state.progress, "progress_items", (item) => `
    <strong>${h(item.title)}</strong>
    <span>${h(item.priority)}</span>
    <select class="record-update" data-table="progress_items" data-id="${item.id}" data-field="status">
      ${progressStatusOptions(item.status)}
    </select>
  `);

  views.sessionRecords.innerHTML = renderRecordList(state.sessions, "sessions", (item) => `
    <strong>${h(item.topic || "Session")}</strong>
    <span>${h(formatDate(item.date))} / ${h(item.duration_minutes)} min</span>
    <p>${h(item.next_actions || item.notes || "")}</p>
  `);

  views.supportRecords.innerHTML = renderRecordList(state.support, "support_notes", (item) => `
    <strong>${h(item.source)}</strong>
    <span>${h(formatDate(item.created_at))} / ${item.resolved ? "resolved" : "open"}</span>
    <p>${h(item.message)}</p>
    <button type="button" class="secondary record-toggle" data-table="support_notes" data-id="${item.id}" data-field="resolved" data-value="${item.resolved ? "false" : "true"}">
      Mark ${item.resolved ? "open" : "resolved"}
    </button>
  `);

  views.fileRecords.innerHTML = renderRecordList(state.files, "client_files", (item) => `
    <strong>${h(item.label || item.kind)}</strong>
    <span>${h(item.kind)}</span>
    ${storagePathFromUrl(item.url)
      ? `<button type="button" class="secondary record-open-file" data-path="${h(storagePathFromUrl(item.url))}">Open stored file</button><span>${h(storagePathFromUrl(item.url))}</span>`
      : `<a href="${h(item.url)}" target="_blank" rel="noreferrer">${h(item.url)}</a>`}
  `);

  views.accessRecords.innerHTML = renderRecordList(state.access, "client_access", (item) => `
    <strong>${h(item.user_email || item.user_id)}</strong>
    <span>${h(item.status)} / ${h(item.user_id)}</span>
    <button type="button" class="secondary record-toggle" data-table="client_access" data-id="${item.id}" data-field="status" data-value="${item.status === "active" ? "revoked" : "active"}">
      Mark ${item.status === "active" ? "revoked" : "active"}
    </button>
  `);

  $$(".record-delete").forEach((button) => {
    button.addEventListener("click", () => deleteRecord(button.dataset.table, button.dataset.id));
  });

  $$(".record-update").forEach((control) => {
    control.addEventListener("change", () => updateRecord(control.dataset.table, control.dataset.id, control.dataset.field, control.value));
  });

  $$(".record-toggle").forEach((button) => {
    button.addEventListener("click", () => updateRecord(button.dataset.table, button.dataset.id, button.dataset.field, button.dataset.value === "true"));
  });

  $$(".record-open-file").forEach((button) => {
    button.addEventListener("click", () => openStoredFile(button.dataset.path));
  });
}

function renderRecordList(records, table, template) {
  if (!records.length) return `<div class="empty-list">No records yet.</div>`;
  return records.map((record) => `
    <article class="record">
      <div class="record-body">${template(record)}</div>
      <button type="button" class="danger record-delete" data-table="${table}" data-id="${record.id}">Delete</button>
    </article>
  `).join("");
}

function progressStatusOptions(currentStatus) {
  return [
    ["blocked", "Blocked"],
    ["in_progress", "In progress"],
    ["improved", "Improved"],
    ["done", "Done"]
  ].map(([value, label]) => `<option value="${value}" ${value === currentStatus ? "selected" : ""}>${label}</option>`).join("");
}

async function insertRecord(table, form, extra = {}) {
  if (!state.selectedClient && table !== "clients") return;
  const payload = cleanPayload({
    ...formToObject(form),
    ...extra
  });

  await requireResult(supabase.from(table).insert(payload).select());
  form.reset();
}

async function deleteRecord(table, id) {
  if (!state.selectedClient) return;
  await requireResult(
    supabase
      .from(table)
      .delete()
      .eq("owner_id", state.user.id)
      .eq("id", id)
      .select()
  );
  await selectClient(state.selectedClient.id);
}

async function updateRecord(table, id, field, value) {
  if (!state.selectedClient) return;
  await requireResult(
    supabase
      .from(table)
      .update({ [field]: value })
      .eq("owner_id", state.user.id)
      .eq("id", id)
      .select()
  );
  await selectClient(state.selectedClient.id);
}

async function openStoredFile(path) {
  const { data, error } = await supabase.storage
    .from("client-files")
    .createSignedUrl(path, 60);

  if (error) {
    alert(error.message);
    return;
  }

  window.open(data.signedUrl, "_blank", "noreferrer");
}

$("#auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("Signing in...");
  const email = $("#auth-email").value;
  const password = $("#auth-password").value;

  if (!password) {
    setMessage("Password is required for password sign in.", true);
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  setMessage(error ? error.message : "Signed in.", Boolean(error));
});

$("#magic-link-button").addEventListener("click", async () => {
  const email = $("#auth-email").value;
  if (!email) {
    setMessage("Enter email first.", true);
    return;
  }

  setMessage("Sending magic link...");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: config.redirectUrl || `${window.location.origin}/crm/` }
  });
  setMessage(error ? error.message : "Magic link sent. Check email.", Boolean(error));
});

$("#sign-out-button").addEventListener("click", async () => {
  await supabase.auth.signOut();
});

$("#client-search").addEventListener("input", (event) => {
  state.clientSearch = event.currentTarget.value;
  renderClients();
});

$("#client-status-filter").addEventListener("change", (event) => {
  state.clientStatusFilter = event.currentTarget.value;
  renderClients();
});

$("#delete-client-button").addEventListener("click", async () => {
  if (!state.selectedClient) return;
  const name = state.selectedClient.name;
  const ok = window.confirm(`Delete ${name} and all related records?`);
  if (!ok) return;

  await requireResult(
    supabase
      .from("clients")
      .delete()
      .eq("owner_id", state.user.id)
      .eq("id", state.selectedClient.id)
      .select()
  );

  state.selectedClient = null;
  await loadClients();
});

$("#client-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await insertRecord("clients", event.currentTarget, { owner_id: state.user.id });
    await loadClients();
  } catch (error) {
    alert(error.message);
  }
});

$("#client-edit-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selectedClient) return;

  try {
    const payload = cleanPayload(formToObject(event.currentTarget));
    await requireResult(
      supabase
        .from("clients")
        .update(payload)
        .eq("owner_id", state.user.id)
        .eq("id", state.selectedClient.id)
        .select()
    );
    await loadClients();
  } catch (error) {
    alert(error.message);
  }
});

$("#progress-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await insertRecord("progress_items", event.currentTarget, {
      owner_id: state.user.id,
      client_id: state.selectedClient.id
    });
    await selectClient(state.selectedClient.id);
  } catch (error) {
    alert(error.message);
  }
});

$("#session-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const raw = formToObject(event.currentTarget);
    await insertRecord("sessions", event.currentTarget, {
      ...raw,
      owner_id: state.user.id,
      client_id: state.selectedClient.id,
      duration_minutes: Number(raw.duration_minutes || 50),
      date: raw.date ? new Date(raw.date).toISOString() : new Date().toISOString()
    });
    await selectClient(state.selectedClient.id);
  } catch (error) {
    alert(error.message);
  }
});

$("#support-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await insertRecord("support_notes", event.currentTarget, {
      owner_id: state.user.id,
      client_id: state.selectedClient.id
    });
    await selectClient(state.selectedClient.id);
  } catch (error) {
    alert(error.message);
  }
});

$("#file-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await insertRecord("client_files", event.currentTarget, {
      owner_id: state.user.id,
      client_id: state.selectedClient.id
    });
    await selectClient(state.selectedClient.id);
  } catch (error) {
    alert(error.message);
  }
});

$("#access-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selectedClient) return;

  const payload = formToObject(event.currentTarget);

  try {
    await requireResult(
      supabase.rpc("grant_client_access_by_email", {
        p_client_id: state.selectedClient.id,
        p_user_email: payload.email
      })
    );
    event.currentTarget.reset();
    await selectClient(state.selectedClient.id);
  } catch (error) {
    alert(error.message);
  }
});

$("#upload-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selectedClient) return;

  const form = event.currentTarget;
  const payload = formToObject(form);
  const file = form.elements.file.files[0];
  if (!file) return;

  try {
    const path = `${state.user.id}/${state.selectedClient.id}/${Date.now()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("client-files")
      .upload(path, file, { upsert: false });

    if (uploadError) throw uploadError;

    await requireResult(
      supabase.from("client_files").insert({
        owner_id: state.user.id,
        client_id: state.selectedClient.id,
        url: `storage://client-files/${path}`,
        label: payload.label || file.name,
        kind: payload.kind || "other"
      }).select()
    );

    form.reset();
    await selectClient(state.selectedClient.id);
  } catch (error) {
    alert(error.message);
  }
});

$("#export-button").addEventListener("click", () => {
  download(`fanatic-crm-clients-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(state.clients));
});

$("#backup-button").addEventListener("click", async () => {
  try {
    const [clients, progress, sessions, support, files] = await Promise.all([
      requireResult(supabase.from("clients").select("*").eq("owner_id", state.user.id).order("created_at", { ascending: false })),
      requireResult(supabase.from("progress_items").select("*").eq("owner_id", state.user.id).order("created_at", { ascending: false })),
      requireResult(supabase.from("sessions").select("*").eq("owner_id", state.user.id).order("date", { ascending: false })),
      requireResult(supabase.from("support_notes").select("*").eq("owner_id", state.user.id).order("created_at", { ascending: false })),
      requireResult(supabase.from("client_files").select("*").eq("owner_id", state.user.id).order("created_at", { ascending: false }))
    ]);

    download(`fanatic-crm-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({
      exported_at: new Date().toISOString(),
      clients,
      progress_items: progress,
      sessions,
      support_notes: support,
      client_files: files
    }, null, 2), "application/json");
  } catch (error) {
    alert(error.message);
  }
});

$$(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".tab").forEach((tab) => tab.classList.toggle("active", tab === button));
    $$(".tab-panel").forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.panel !== button.dataset.tab);
    });
  });
});

boot();
