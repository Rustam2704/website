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
  access: [],
  intake: []
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
  importClientsButton: $("#import-clients-button"),
  importClientsInput: $("#import-clients-input"),
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
  accessRecords: $("#access-records"),
  intakeRecords: $("#intake-records")
};

const ACTIVE_TAB_KEY = "fanatic.crm.activeTab";

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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  row.push(field);
  rows.push(row);

  const meaningfulRows = rows.filter((items) => items.some((item) => item.trim() !== ""));
  if (!meaningfulRows.length) return [];

  const headers = meaningfulRows[0].map((header) => header.trim().toLowerCase());
  return meaningfulRows.slice(1).map((items) => {
    return Object.fromEntries(headers.map((header, index) => [header, items[index]?.trim() || ""]));
  });
}

function normalizeClientImportRow(row) {
  const plan = ["session_only", "session_plus_support"].includes(row.plan) ? row.plan : "session_only";
  const status = ["lead", "active", "paused", "done"].includes(row.status) ? row.status : "lead";

  return cleanPayload({
    owner_id: state.user.id,
    name: row.name,
    email: row.email,
    timezone: row.timezone,
    plan,
    area: row.area,
    current_goal: row.current_goal || row.goal,
    status
  });
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
    const [clients, progress, sessions, support, files, intake] = await Promise.all([
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
      requireResult(supabase.from("client_files").select("id, client_id").eq("owner_id", state.user.id)),
      requireResult(supabase.from("intake_requests").select("*").order("created_at", { ascending: false }))
    ]);

    state.clients = withClientCounts(clients, { progress, sessions, support, files });
    state.intake = intake;

    if (state.selectedClient) {
      state.selectedClient = state.clients.find((client) => client.id === state.selectedClient.id) || state.clients[0] || null;
    } else {
      state.selectedClient = state.clients[0] || null;
    }

    renderClients();
    renderStats();
    renderIntakeRequests();
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
    requests: state.intake.filter((request) => request.status === "new").length,
    total: state.clients.length
  };

  views.stats.innerHTML = `
    <article><span>Total</span><strong>${counts.total}</strong></article>
    <article><span>Leads</span><strong>${counts.leads}</strong></article>
    <article><span>Active</span><strong>${counts.active}</strong></article>
    <article><span>New requests</span><strong>${counts.requests}</strong></article>
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
    ${item.private_notes ? `<p><strong>Private:</strong> ${h(item.private_notes)}</p>` : ""}
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

function renderIntakeRequests() {
  if (!views.intakeRecords) return;

  const requests = state.intake.filter((request) => request.status !== "archived");
  if (!requests.length) {
    views.intakeRecords.innerHTML = `<div class="empty-list">No intake requests yet.</div>`;
    return;
  }

  views.intakeRecords.innerHTML = requests.map((request) => `
    <article class="record">
      <div class="record-body">
        <strong>${h(request.name)}</strong>
        <span>${h(request.email)} / ${h(request.status)} / ${h(formatDate(request.created_at))}</span>
        <p>${h(request.area || "")}</p>
        <p>${h(request.goal || "")}</p>
      </div>
      <div class="record-actions">
        ${request.status === "converted"
          ? `<button type="button" class="secondary request-select-client" data-client-id="${request.client_id || ""}">Open client</button>`
          : `<button type="button" class="secondary request-convert" data-id="${request.id}">Convert to client</button>`}
        <button type="button" class="secondary request-archive" data-id="${request.id}">Archive</button>
      </div>
    </article>
  `).join("");

  $$(".request-convert").forEach((button) => {
    button.addEventListener("click", () => convertRequestToClient(button.dataset.id));
  });

  $$(".request-archive").forEach((button) => {
    button.addEventListener("click", () => updateIntakeStatus(button.dataset.id, "archived"));
  });

  $$(".request-select-client").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.clientId) selectClient(button.dataset.clientId);
    });
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

  const data = await requireResult(supabase.from(table).insert(payload).select());
  form.reset();
  return data;
}

async function deleteRecord(table, id) {
  if (!state.selectedClient) return;
  const ok = window.confirm(`Delete this ${table.replaceAll("_", " ")} record?`);
  if (!ok) return;

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

async function updateIntakeStatus(id, status, extra = {}) {
  await requireResult(
    supabase
      .from("intake_requests")
      .update({ status, ...extra })
      .eq("id", id)
      .select()
  );
  await loadClients();
}

async function convertRequestToClient(id) {
  const request = state.intake.find((item) => item.id === id);
  if (!request) return;

  const existingClient = state.clients.find((client) => {
    return client.email && request.email && client.email.toLowerCase() === request.email.toLowerCase();
  });

  const client = existingClient || (await requireResult(
    supabase
      .from("clients")
      .insert({
        owner_id: state.user.id,
        name: request.name,
        email: request.email,
        area: request.area,
        current_goal: request.goal,
        status: "lead",
        plan: "session_only"
      })
      .select()
  ))[0];

  await updateIntakeStatus(id, "converted", { client_id: client.id });
  state.selectedClient = client;
  await loadClients();
  setActiveTab("progress");
}

async function importClientsFromCsv(file) {
  const text = await file.text();
  const rows = parseCsv(text)
    .map(normalizeClientImportRow)
    .filter((row) => row.name && row.email);

  if (!rows.length) {
    alert("No valid clients found. CSV needs at least name and email columns.");
    return;
  }

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const existing = state.clients.find((client) => {
      return client.email && row.email && client.email.toLowerCase() === row.email.toLowerCase();
    });

    if (existing) {
      await requireResult(
        supabase
          .from("clients")
          .update(row)
          .eq("owner_id", state.user.id)
          .eq("id", existing.id)
          .select()
      );
      updated += 1;
    } else {
      await requireResult(supabase.from("clients").insert(row).select());
      created += 1;
    }
  }

  await loadClients();
  alert(`CSV import complete. Created: ${created}. Updated: ${updated}.`);
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

$("#import-clients-button").addEventListener("click", () => {
  views.importClientsInput.click();
});

$("#import-clients-input").addEventListener("change", async (event) => {
  const file = event.currentTarget.files[0];
  if (!file) return;

  try {
    await importClientsFromCsv(file);
  } catch (error) {
    alert(error.message);
  } finally {
    event.currentTarget.value = "";
  }
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
    const [client] = await insertRecord("clients", event.currentTarget, { owner_id: state.user.id });
    state.selectedClient = client || null;
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
    const [clients, progress, sessions, support, files, intake] = await Promise.all([
      requireResult(supabase.from("clients").select("*").eq("owner_id", state.user.id).order("created_at", { ascending: false })),
      requireResult(supabase.from("progress_items").select("*").eq("owner_id", state.user.id).order("created_at", { ascending: false })),
      requireResult(supabase.from("sessions").select("*").eq("owner_id", state.user.id).order("date", { ascending: false })),
      requireResult(supabase.from("support_notes").select("*").eq("owner_id", state.user.id).order("created_at", { ascending: false })),
      requireResult(supabase.from("client_files").select("*").eq("owner_id", state.user.id).order("created_at", { ascending: false })),
      requireResult(supabase.from("intake_requests").select("*").order("created_at", { ascending: false }))
    ]);

    download(`fanatic-crm-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({
      exported_at: new Date().toISOString(),
      clients,
      progress_items: progress,
      sessions,
      support_notes: support,
      client_files: files,
      intake_requests: intake
    }, null, 2), "application/json");
  } catch (error) {
    alert(error.message);
  }
});

$$(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTab(button.dataset.tab);
  });
});

function setActiveTab(tabName) {
  localStorage.setItem(ACTIVE_TAB_KEY, tabName);
  $$(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  $$(".tab-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.panel !== tabName);
  });
}

setActiveTab(localStorage.getItem(ACTIVE_TAB_KEY) || "progress");

boot();
