import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const config = window.FANATIC_CRM_SUPABASE || {};
const supabase = createClient(config.url, config.anonKey);

const $ = (selector) => document.querySelector(selector);

const views = {
  authStatus: $("#auth-status"),
  authPanel: $("#auth-panel"),
  dashboard: $("#portal-dashboard"),
  authMessage: $("#auth-message"),
  supportMessage: $("#support-message"),
  clientName: $("#client-name"),
  clientTimezone: $("#client-timezone"),
  nextLessonTitle: $("#next-lesson-title"),
  nextLessonDetail: $("#next-lesson-detail"),
  nextLessonAction: $("#next-lesson-action"),
  nextActionCard: $("#next-action-card"),
  currentGoal: $("#current-goal"),
  recentProgressList: $("#recent-progress-list"),
  progressRecords: $("#progress-records"),
  sessionRecords: $("#session-records"),
  messageRecords: $("#message-records"),
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

function formatDueDate(value) {
  if (!value) return "No deadline";
  const localDate = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(localDate));
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
  renderNextActionLoading();

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
      views.clientTimezone.textContent = "-";
      views.nextLessonTitle.textContent = "No profile assigned";
      views.nextLessonDetail.textContent = "No access record found for this email.";
      views.nextLessonAction.textContent = "View sessions";
      views.nextLessonAction.href = "#sessions";
      views.nextLessonAction.removeAttribute("target");
      views.nextLessonAction.removeAttribute("rel");
      renderNextActionEmpty(
        "No profile assigned",
        "Ask Rustam to invite this Google email to your client profile."
      );
      views.currentGoal.textContent = "-";
      views.recentProgressList.innerHTML = `<p>No progress is available yet.</p>`;
      views.progressRecords.innerHTML = `<div class="empty-list">No progress is available yet.</div>`;
      views.sessionRecords.innerHTML = `<div class="empty-list">No sessions are available yet.</div>`;
      views.messageRecords.innerHTML = `<div class="empty-list">No messages yet.</div>`;
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
    const messages = await requireResult(
      supabase
        .from("support_notes")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
    );

    views.clientName.textContent = client.name;
    views.clientTimezone.textContent = client.timezone || client.area || "-";
    renderStudentHome(client, progress, sessions);

    views.progressRecords.innerHTML = progress.length
      ? progress.map((item) => `
        <article class="record">
          <div class="record-body">
            <strong>${h(item.title)}</strong>
            <span>${h(item.priority)}${item.due_at ? ` / Due: ${h(formatDate(item.due_at))}` : ""}</span>
            ${item.teacher_comment ? `<p><strong>Teacher:</strong> ${h(item.teacher_comment)}</p>` : ""}
            <label class="compact-field">
              Your note
              <textarea class="progress-note" data-progress-id="${item.id}" rows="2">${h(item.client_comment || "")}</textarea>
            </label>
            <select class="progress-status" data-progress-id="${item.id}">
              ${progressStatusOptions(item.status)}
            </select>
            <button type="button" class="secondary progress-note-save" data-progress-id="${item.id}">Save note</button>
          </div>
        </article>
      `).join("")
      : `<div class="empty-list">No progress is available yet.</div>`;

    document.querySelectorAll(".progress-status").forEach((control) => {
      control.addEventListener("change", () => updateProgressStatus(control.dataset.progressId, control.value));
    });

    document.querySelectorAll(".progress-note-save").forEach((button) => {
      button.addEventListener("click", () => {
        const note = document.querySelector(`.progress-note[data-progress-id="${button.dataset.progressId}"]`)?.value || "";
        updateProgressNote(button.dataset.progressId, note);
      });
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

    views.messageRecords.innerHTML = messages.length
      ? messages.map((item) => `
        <article class="record">
          <div class="record-body">
            <strong>${h(item.source || "message")}</strong>
            <span>${h(formatDate(item.created_at))} / ${item.resolved ? "resolved" : "open"}</span>
            <p>${h(item.message)}</p>
          </div>
        </article>
      `).join("")
      : `<div class="empty-list">No messages yet.</div>`;
  } catch (error) {
    renderNextActionError(error.message);
    alert(error.message);
  }
}

function renderStudentHome(client, progress, sessions) {
  const now = Date.now();
  const upcoming = sessions
    .filter((session) => session.date && new Date(session.date).getTime() >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const recentProgress = progress.slice(0, 4);

  views.nextLessonTitle.textContent = upcoming ? formatDate(upcoming.date) : "No lesson scheduled";
  views.nextLessonDetail.textContent = upcoming?.topic || upcoming?.next_actions || "Rustam will add the next session here.";
  views.nextLessonAction.textContent = upcoming?.meeting_url ? "Join lesson" : "View sessions";
  views.nextLessonAction.href = upcoming?.meeting_url || "#sessions";

  if (upcoming?.meeting_url) {
    views.nextLessonAction.target = "_blank";
    views.nextLessonAction.rel = "noreferrer";
  } else {
    views.nextLessonAction.removeAttribute("target");
    views.nextLessonAction.removeAttribute("rel");
  }

  views.currentGoal.textContent = client.current_goal || "-";
  renderNextAction(client, progress);
  views.recentProgressList.innerHTML = recentProgress.length
    ? recentProgress.map((item) => `<p>${h(item.title)} <span>${h(item.status.replaceAll("_", " "))}</span></p>`).join("")
    : `<p>No progress is available yet.</p>`;
}

function renderNextActionLoading() {
  views.nextActionCard.innerHTML = `<p class="next-action-loading">Loading your next step...</p>`;
}

function renderNextActionEmpty(title, detail) {
  views.nextActionCard.innerHTML = `
    <div class="next-action-empty">
      <span>Next step</span>
      <strong>${h(title)}</strong>
      <p>${h(detail)}</p>
      <a class="next-action-link" href="#tasks">Open tasks</a>
      <p class="form-message" id="next-action-message"></p>
    </div>
  `;
}

function renderNextActionError(message) {
  views.nextActionCard.innerHTML = `
    <div class="next-action-empty">
      <span>Next step</span>
      <strong>Could not load your next step</strong>
      <p class="form-message error">${h(message)}</p>
      <button type="button" class="secondary" id="next-action-retry">Try again</button>
    </div>
  `;
  $("#next-action-retry")?.addEventListener("click", loadPortalData);
}

function renderNextAction(client, progress) {
  const priorityRank = { high: 0, normal: 1, low: 2 };
  const activeTasks = progress
    .filter((item) => item.status !== "done")
    .sort((a, b) => {
      const aDue = a.due_at ? new Date(a.due_at).getTime() : Number.POSITIVE_INFINITY;
      const bDue = b.due_at ? new Date(b.due_at).getTime() : Number.POSITIVE_INFINITY;
      if (aDue !== bDue) return aDue - bDue;

      const priorityDifference = (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1);
      if (priorityDifference) return priorityDifference;

      return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
    });
  const task = activeTasks[0];

  if (!task) {
    renderNextActionEmpty(
      "You are up to date",
      "There are no active tasks. Add a new step when you are ready to continue."
    );
    return;
  }

  views.nextActionCard.innerHTML = `
    <div class="next-action-summary">
      <span>Current goal</span>
      <p>${h(client.current_goal || "No goal has been set yet.")}</p>
      <div class="next-action-heading">
        <div>
          <span>Do this next</span>
          <strong>${h(task.title)}</strong>
        </div>
        <div class="next-action-meta">
          <span>${h(task.priority || "normal")} priority</span>
          <span>${h(formatDueDate(task.due_at))}</span>
        </div>
      </div>
      ${task.teacher_comment ? `<p class="next-action-teacher"><strong>Rustam:</strong> ${h(task.teacher_comment)}</p>` : ""}
    </div>
    <form class="next-action-form" id="next-action-form" data-progress-id="${h(task.id)}">
      <label>
        Progress status
        <select name="status">
          ${progressStatusOptions(task.status)}
        </select>
      </label>
      <label>
        Short update
        <textarea name="client_comment" rows="2" placeholder="What changed, or what is blocking you?">${h(task.client_comment || "")}</textarea>
      </label>
      <button type="submit">Save progress</button>
      <p class="form-message next-action-message" id="next-action-message"></p>
    </form>
  `;

  $("#next-action-form")?.addEventListener("submit", saveNextActionProgress);
}

async function saveNextActionProgress(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  const message = form.querySelector(".next-action-message");
  const payload = Object.fromEntries(new FormData(form).entries());

  button.disabled = true;
  button.textContent = "Saving...";
  message.textContent = "Saving your update...";
  message.classList.remove("error");

  try {
    await requireResult(
      supabase.rpc("client_update_progress_status", {
        p_progress_id: form.dataset.progressId,
        p_status: payload.status
      })
    );
    await requireResult(
      supabase.rpc("client_update_progress_note", {
        p_progress_id: form.dataset.progressId,
        p_client_comment: payload.client_comment || ""
      })
    );
    await loadPortalData();
    const refreshedMessage = $("#next-action-message");
    if (refreshedMessage) refreshedMessage.textContent = "Progress saved. Here is your current next step.";
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
    button.disabled = false;
    button.textContent = "Save progress";
  }
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

async function updateProgressNote(progressId, comment) {
  try {
    await requireResult(
      supabase.rpc("client_update_progress_note", {
        p_progress_id: progressId,
        p_client_comment: comment
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
  const request = {
    p_title: payload.title,
    p_status: payload.status,
    p_priority: payload.priority
  };

  if (payload.due_at) {
    request.p_due_at = payload.due_at;
  }

  if (payload.client_comment) {
    request.p_client_comment = payload.client_comment;
  }

  try {
    await requireResult(supabase.rpc("client_create_progress_item", request));
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
    await loadPortalData();
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
