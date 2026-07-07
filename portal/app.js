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
  supportMessage: $("#support-message"),
  clientName: $("#client-name"),
  nextLessonTitle: $("#next-lesson-title"),
  nextLessonDetail: $("#next-lesson-detail"),
  nextStepsList: $("#next-steps-list"),
  currentGoal: $("#current-goal"),
  recentProgressList: $("#recent-progress-list"),
  progressRecords: $("#progress-records"),
  sessionRecords: $("#session-records"),
  fileRecords: $("#file-records"),
  clientProgressForm: $("#client-progress-form"),
  clientSupportForm: $("#client-support-form"),
  clientFileForm: $("#client-file-form")
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

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function setMessage(message, isError = false) {
  views.authMessage.textContent = message || "";
  views.authMessage.classList.toggle("error", isError);
}

function setSupportMessage(message, isError = false) {
  views.supportMessage.textContent = message || "";
  views.supportMessage.classList.toggle("error", isError);
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
    await requireResult(supabase.rpc("claim_client_access_by_email"));

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
      views.nextLessonTitle.textContent = "No profile assigned";
      views.nextLessonDetail.textContent = "No access record found for this email.";
      views.nextStepsList.innerHTML = `<p>No assigned work yet.</p>`;
      views.currentGoal.textContent = "-";
      views.recentProgressList.innerHTML = `<p>No progress is available yet.</p>`;
      views.progressRecords.innerHTML = `<div class="empty-list">No progress is available yet.</div>`;
      views.sessionRecords.innerHTML = `<div class="empty-list">No sessions are available yet.</div>`;
      views.fileRecords.innerHTML = `<div class="empty-list">No files or links are available yet.</div>`;
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
    const files = await requireResult(
      supabase
        .from("client_files")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
    );
    const sessions = await requireResult(supabase.rpc("client_list_sessions"));

    views.clientName.textContent = client.name;
    renderStudentHome(client, progress, sessions);

    views.progressRecords.innerHTML = progress.length
      ? progress.map((item) => `
        <article class="record">
          <div class="record-body">
            <strong>${h(item.title)}</strong>
            <span>${h(item.priority)}</span>
            <select class="progress-status" data-progress-id="${item.id}">
              ${progressStatusOptions(item.status)}
            </select>
          </div>
        </article>
      `).join("")
      : `<div class="empty-list">No progress is available yet.</div>`;

    document.querySelectorAll(".progress-status").forEach((control) => {
      control.addEventListener("change", () => updateProgressStatus(control.dataset.progressId, control.value));
    });

    views.fileRecords.innerHTML = files.length
      ? files.map((item) => `
        <article class="record">
          <div class="record-body">
            <strong>${h(item.label || item.kind)}</strong>
            <span>${h(item.kind)}</span>
            ${storagePathFromUrl(item.url)
              ? `<button type="button" class="secondary portal-open-file" data-path="${h(storagePathFromUrl(item.url))}">Open stored file</button><span>${h(storagePathFromUrl(item.url))}</span>`
              : `<a href="${h(item.url)}" target="_blank" rel="noreferrer">${h(item.url)}</a>`}
          </div>
        </article>
      `).join("")
      : `<div class="empty-list">No files or links are available yet.</div>`;

    document.querySelectorAll(".portal-open-file").forEach((button) => {
      button.addEventListener("click", () => openStoredFile(button.dataset.path));
    });

    views.sessionRecords.innerHTML = sessions.length
      ? sessions.map((item) => `
        <article class="record">
          <div class="record-body">
            <strong>${h(item.topic || "Session")}</strong>
            <span>${h(formatDate(item.date))} / ${h(item.duration_minutes)} min</span>
            ${item.confirmation_status ? `<span>Status: ${h(item.confirmation_status.replaceAll("_", " "))}</span>` : ""}
            ${item.meeting_url ? `<a href="${h(item.meeting_url)}" target="_blank" rel="noreferrer">Join or open meeting link</a>` : ""}
            ${item.notes ? `<p>${h(item.notes)}</p>` : ""}
            ${item.next_actions ? `<p><strong>Next:</strong> ${h(item.next_actions)}</p>` : ""}
          </div>
        </article>
      `).join("")
      : `<div class="empty-list">No sessions are available yet.</div>`;
  } catch (error) {
    alert(error.message);
  }
}

function renderStudentHome(client, progress, sessions) {
  const now = Date.now();
  const upcoming = sessions
    .filter((session) => session.date && new Date(session.date).getTime() >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const activeTasks = progress
    .filter((item) => item.status !== "done")
    .slice(0, 4);
  const recentProgress = progress.slice(0, 4);

  views.nextLessonTitle.textContent = upcoming ? formatDate(upcoming.date) : "No lesson scheduled";
  views.nextLessonDetail.textContent = upcoming?.topic || upcoming?.next_actions || "Rustam will add the next session here.";
  views.currentGoal.textContent = client.current_goal || "-";
  views.nextStepsList.innerHTML = activeTasks.length
    ? activeTasks.map((item) => `<p>${h(item.title)} <span>${h(item.status.replaceAll("_", " "))}</span></p>`).join("")
    : `<p>No active tasks yet.</p>`;
  views.recentProgressList.innerHTML = recentProgress.length
    ? recentProgress.map((item) => `<p>${h(item.title)} <span>${h(item.status.replaceAll("_", " "))}</span></p>`).join("")
    : `<p>No progress is available yet.</p>`;
}

function progressStatusOptions(currentStatus) {
  return [
    ["blocked", "Blocked"],
    ["in_progress", "In progress"],
    ["improved", "Improved"],
    ["done", "Done"]
  ].map(([value, label]) => `<option value="${value}" ${value === currentStatus ? "selected" : ""}>${label}</option>`).join("");
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

async function updateProgressStatus(progressId, status) {
  try {
    await requireResult(
      supabase.rpc("client_update_progress_status", {
        p_progress_id: progressId,
        p_status: status
      })
    );
    await loadPortalData();
  } catch (error) {
    alert(error.message);
  }
}

views.clientProgressForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

  try {
    await requireResult(
      supabase.rpc("client_create_progress_item", {
        p_title: payload.title,
        p_status: payload.status,
        p_priority: payload.priority
      })
    );
    event.currentTarget.reset();
    await loadPortalData();
  } catch (error) {
    alert(error.message);
  }
});

views.clientSupportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setSupportMessage("Sending...");
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

  try {
    await requireResult(
      supabase.rpc("client_create_support_note", {
        p_message: payload.message
      })
    );
    event.currentTarget.reset();
    setSupportMessage("Sent.");
  } catch (error) {
    setSupportMessage(error.message, true);
  }
});

views.clientFileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

  try {
    await requireResult(
      supabase.rpc("client_create_file_link", {
        p_url: payload.url,
        p_label: payload.label,
        p_kind: payload.kind
      })
    );
    event.currentTarget.reset();
    await loadPortalData();
  } catch (error) {
    alert(error.message);
  }
});

views.authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("Sending magic link...");
  const { error } = await supabase.auth.signInWithOtp({
    email: views.authEmail.value,
    options: { emailRedirectTo: "https://fanatic.space/portal/" }
  });
  setMessage(error ? error.message : "Magic link sent. Check email.", Boolean(error));
});

document.querySelectorAll("[data-oauth-provider]").forEach((button) => {
  button.addEventListener("click", async () => {
    const provider = button.dataset.oauthProvider;
    setMessage(`Opening ${provider} sign in...`);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: "https://fanatic.space/portal/",
        queryParams: {
          prompt: "select_account"
        }
      }
    });

    if (error) setMessage(error.message, true);
  });
});

$("#sign-out-button").addEventListener("click", async () => {
  await supabase.auth.signOut();
});

boot();
