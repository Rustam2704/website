import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { html, render, useEffect, useMemo, useState } from "https://esm.sh/htm/preact/standalone";

const config = window.FANATIC_CRM_SUPABASE || {};
const hasConfig = Boolean(config.url && config.anonKey);
const supabase = hasConfig ? createClient(config.url, config.anonKey) : null;

const emptyData = {
  clients: [],
  progress: [],
  sessions: [],
  support: [],
  files: [],
  intake: []
};

const statusOptions = ["lead", "active", "paused", "done"];
const taskStatuses = ["blocked", "in_progress", "improved", "done"];

function currentRedirectUrl() {
  return `${window.location.origin}/test-crm/`;
}

function formatDate(value, compact = false) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", compact
    ? { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
    : { dateStyle: "medium", timeStyle: "short" }
  ).format(new Date(value));
}

function label(value) {
  return String(value || "-").replaceAll("_", " ");
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function clean(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== ""));
}

function countsFor(client, data) {
  const progress = data.progress.filter((item) => item.client_id === client.id);
  const sessions = data.sessions.filter((item) => item.client_id === client.id);
  const support = data.support.filter((item) => item.client_id === client.id);
  return {
    tasks: progress.filter((item) => item.status !== "done").length,
    blockers: progress.filter((item) => item.status === "blocked").length,
    sessions: sessions.length,
    messages: support.filter((item) => !item.resolved).length,
    nextSession: nextSessionFor(client.id, data.sessions),
    latestSession: latestBy(sessions, "date"),
    latestMessage: latestBy(support, "created_at")
  };
}

function nextSessionFor(clientId, sessions) {
  const now = Date.now();
  return sessions
    .filter((session) => session.client_id === clientId && session.date && new Date(session.date).getTime() >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
}

function latestBy(records, field) {
  return [...records]
    .filter((record) => record[field])
    .sort((a, b) => new Date(b[field]) - new Date(a[field]))[0] || null;
}

function attentionItems(data) {
  const items = [];
  const newRequests = data.intake.filter((item) => item.status === "new").length;
  if (newRequests) {
    items.push({ title: `${newRequests} new consultation request${newRequests === 1 ? "" : "s"}`, tone: "warm" });
  }

  data.clients.forEach((client) => {
    const stats = countsFor(client, data);
    if (client.status === "active" && !stats.nextSession) {
      items.push({ title: `${client.name}: no next session`, detail: client.current_goal || client.area, tone: "danger" });
    }
    if (stats.blockers) {
      items.push({ title: `${client.name}: ${stats.blockers} blocker${stats.blockers === 1 ? "" : "s"}`, detail: "Open tasks need a decision.", tone: "danger" });
    }
    if (stats.messages) {
      items.push({ title: `${client.name}: ${stats.messages} open message${stats.messages === 1 ? "" : "s"}`, detail: "Messages waiting.", tone: "warm" });
    }
  });

  return items.slice(0, 8);
}

async function requireResult(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState("today");
  const [selectedId, setSelectedId] = useState("");
  const [detailTab, setDetailTab] = useState("overview");
  const [showAddStudent, setShowAddStudent] = useState(false);

  useEffect(() => {
    boot();
    if (!supabase) return undefined;
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) loadAll(session.user.id);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  async function boot() {
    if (!hasConfig) {
      setLoading(false);
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const activeUser = sessionData.session?.user || null;
    setUser(activeUser);
    if (activeUser) await loadAll(activeUser.id);
    setLoading(false);
  }

  async function loadAll(ownerId = user?.id) {
    if (!ownerId) return;
    setBusy(true);
    try {
      const [clients, progress, sessions, support, files, intake] = await Promise.all([
        requireResult(supabase.from("clients").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false })),
        requireResult(supabase.from("progress_items").select("*").eq("owner_id", ownerId).order("updated_at", { ascending: false })),
        requireResult(supabase.from("sessions").select("*").eq("owner_id", ownerId).order("date", { ascending: false })),
        requireResult(supabase.from("support_notes").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false })),
        requireResult(supabase.from("client_files").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false })),
        requireResult(supabase.from("intake_requests").select("*").order("created_at", { ascending: false }))
      ]);
      setData({ clients, progress, sessions, support, files, intake });
      setSelectedId((current) => current || clients[0]?.id || "");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function signIn() {
    setMessage("Opening Google sign in...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: currentRedirectUrl(),
        queryParams: { prompt: "select_account" }
      }
    });
    if (error) setMessage(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setData(emptyData);
  }

  async function submitClient(event) {
    event.preventDefault();
    const payload = clean({ ...formData(event.currentTarget), owner_id: user.id });
    setBusy(true);
    try {
      const [client] = await requireResult(supabase.from("clients").insert(payload).select());
      setSelectedId(client.id);
      setShowAddStudent(false);
      event.currentTarget.reset();
      await loadAll();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function addRecord(table, payload, form) {
    if (!selectedId) return;
    setBusy(true);
    try {
      await requireResult(supabase.from(table).insert(clean({
        ...payload,
        owner_id: user.id,
        client_id: selectedId
      })).select());
      form?.reset();
      await loadAll();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateRecord(table, id, payload) {
    setBusy(true);
    try {
      await requireResult(supabase.from(table).update(payload).eq("owner_id", user.id).eq("id", id).select());
      await loadAll();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function convertRequest(request) {
    const existing = data.clients.find((client) => client.email && client.email.toLowerCase() === request.email.toLowerCase());
    setBusy(true);
    try {
      const client = existing || (await requireResult(supabase.from("clients").insert({
        owner_id: user.id,
        name: request.name,
        email: request.email,
        area: request.area,
        current_goal: request.goal,
        status: "lead",
        plan: "session_only"
      }).select()))[0];
      await requireResult(supabase.from("intake_requests").update({ status: "converted", client_id: client.id }).eq("id", request.id).select());
      setSelectedId(client.id);
      setView("students");
      await loadAll();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  const selected = data.clients.find((client) => client.id === selectedId) || null;
  const filteredClients = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.clients
      .filter((client) => status === "all" || client.status === status)
      .filter((client) => !needle || [client.name, client.email, client.area, client.current_goal].some((value) => String(value || "").toLowerCase().includes(needle)))
      .sort((a, b) => {
        const nextA = nextSessionFor(a.id, data.sessions)?.date || "9999";
        const nextB = nextSessionFor(b.id, data.sessions)?.date || "9999";
        return String(nextA).localeCompare(String(nextB));
      });
  }, [data, query, status]);

  if (loading) return html`<${LoadingScreen} />`;
  if (!hasConfig) return html`<${SetupMissing} />`;
  if (!user) return html`<${LoginScreen} message=${message} onSignIn=${signIn} />`;

  return html`
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" href="../"><span>F</span><strong>fanatic.crm</strong></a>
        <nav>
          ${["today", "students", "requests"].map((item) => html`
            <button class=${view === item ? "active" : ""} onClick=${() => setView(item)}>${label(item)}</button>
          `)}
        </nav>
        <div class="side-card">
          <span>Test route</span>
          <strong>/test-crm</strong>
          <p>New CRM shell, old data model.</p>
        </div>
      </aside>

      <main class="workspace">
        <header class="topbar">
          <div>
            <p>Teaching CRM</p>
            <h1>${view === "today" ? "Today" : view === "students" ? "Students" : "Requests"}</h1>
          </div>
          <div class="top-actions">
            <span class="user-pill">${user.email}</span>
            <button class="secondary" onClick=${() => loadAll()}>Refresh</button>
            <button class="secondary" onClick=${signOut}>Sign out</button>
          </div>
        </header>

        ${message && html`<div class="notice">${message}</div>`}
        ${busy && html`<div class="busy">Syncing...</div>`}

        ${view === "today" && html`<${TodayView} data=${data} onOpenStudents=${() => setView("students")} onSelect=${setSelectedId} />`}
        ${view === "students" && html`
          <${StudentsView}
            data=${data}
            clients=${filteredClients}
            selected=${selected}
            query=${query}
            status=${status}
            detailTab=${detailTab}
            setQuery=${setQuery}
            setStatus=${setStatus}
            setSelected=${setSelectedId}
            setDetailTab=${setDetailTab}
            openAdd=${() => setShowAddStudent(true)}
            addRecord=${addRecord}
            updateRecord=${updateRecord}
          />
        `}
        ${view === "requests" && html`<${RequestsView} requests=${data.intake} onConvert=${convertRequest} />`}
      </main>

      ${showAddStudent && html`<${AddStudentModal} onClose=${() => setShowAddStudent(false)} onSubmit=${submitClient} />`}
    </div>
  `;
}

function LoadingScreen() {
  return html`<div class="center-screen"><div class="loader"></div><p>Loading CRM...</p></div>`;
}

function SetupMissing() {
  return html`<div class="center-screen"><h1>Supabase config missing</h1><p>Fill <code>crm/config.js</code>; this test route reuses that config.</p></div>`;
}

function LoginScreen({ message, onSignIn }) {
  return html`
    <main class="login">
      <section>
        <p>Fanatic CRM</p>
        <h1>New CRM test shell</h1>
        <span>Uses the same Supabase backend as the current /crm route.</span>
        <button onClick=${onSignIn}>Continue with Google</button>
        ${message && html`<small>${message}</small>`}
      </section>
    </main>
  `;
}

function TodayView({ data, onOpenStudents, onSelect }) {
  const active = data.clients.filter((client) => client.status === "active").length;
  const requests = data.intake.filter((item) => item.status === "new").length;
  const upcoming = data.sessions
    .filter((session) => session.date && new Date(session.date).getTime() >= Date.now())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6);
  const attention = attentionItems(data);
  const clientsById = Object.fromEntries(data.clients.map((client) => [client.id, client]));

  return html`
    <section class="metric-grid">
      <${Metric} label="Students" value=${data.clients.length} />
      <${Metric} label="Active" value=${active} />
      <${Metric} label="New requests" value=${requests} />
      <${Metric} label="Open tasks" value=${data.progress.filter((item) => item.status !== "done").length} />
    </section>
    <section class="two-col">
      <div class="panel">
        <div class="panel-head"><h2>Upcoming sessions</h2><button class="secondary" onClick=${onOpenStudents}>Students</button></div>
        <div class="stack">
          ${upcoming.length ? upcoming.map((session) => {
            const client = clientsById[session.client_id];
            return html`
              <article class="list-row">
                <div><strong>${formatDate(session.date)}</strong><span>${client?.name || "Unknown student"} / ${session.topic || "Session"}</span></div>
                ${client && html`<button class="secondary" onClick=${() => { onSelect(client.id); onOpenStudents(); }}>Open</button>`}
              </article>
            `;
          }) : html`<div class="empty">No upcoming sessions.</div>`}
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h2>Needs attention</h2></div>
        <div class="stack">
          ${attention.length ? attention.map((item) => html`
            <article class=${`attention ${item.tone || ""}`}><strong>${item.title}</strong>${item.detail && html`<span>${item.detail}</span>`}</article>
          `) : html`<div class="empty">Nothing urgent.</div>`}
        </div>
      </div>
    </section>
  `;
}

function Metric({ label, value }) {
  return html`<article class="metric"><span>${label}</span><strong>${value}</strong></article>`;
}

function StudentsView(props) {
  const { data, clients, selected, query, status, detailTab, setQuery, setStatus, setSelected, setDetailTab, openAdd, addRecord, updateRecord } = props;

  return html`
    <section class="student-layout">
      <div class="panel table-panel">
        <div class="panel-head">
          <h2>Students</h2>
          <button onClick=${openAdd}>Add student</button>
        </div>
        <div class="filters">
          <input type="search" placeholder="Search students" value=${query} onInput=${(event) => setQuery(event.currentTarget.value)} />
          <select value=${status} onChange=${(event) => setStatus(event.currentTarget.value)}>
            <option value="all">All statuses</option>
            ${statusOptions.map((item) => html`<option value=${item}>${label(item)}</option>`)}
          </select>
        </div>
        <div class="student-table">
          <div class="table-head"><span>Student</span><span>Next</span><span>Goal</span><span>Work</span></div>
          ${clients.map((client) => {
            const stats = countsFor(client, data);
            return html`
              <button class=${`table-row ${selected?.id === client.id ? "selected" : ""}`} onClick=${() => setSelected(client.id)}>
                <span><strong>${client.name}</strong><small>${client.email || client.area || "No contact"}</small></span>
                <span>${stats.nextSession ? formatDate(stats.nextSession.date, true) : "-"}</span>
                <span>${client.current_goal || client.area || "-"}</span>
                <span>${stats.tasks} tasks / ${stats.messages} msgs</span>
              </button>
            `;
          })}
        </div>
      </div>

      <${StudentDetail}
        data=${data}
        selected=${selected}
        tab=${detailTab}
        setTab=${setDetailTab}
        addRecord=${addRecord}
        updateRecord=${updateRecord}
      />
    </section>
  `;
}

function StudentDetail({ data, selected, tab, setTab, addRecord, updateRecord }) {
  if (!selected) return html`<aside class="panel detail"><div class="empty">Select a student.</div></aside>`;

  const stats = countsFor(selected, data);
  const tasks = data.progress.filter((item) => item.client_id === selected.id);
  const sessions = data.sessions.filter((item) => item.client_id === selected.id);
  const messages = data.support.filter((item) => item.client_id === selected.id);
  const files = data.files.filter((item) => item.client_id === selected.id);

  return html`
    <aside class="panel detail">
      <div class="student-hero">
        <div>
          <p>${label(selected.status)} / ${selected.timezone || "timezone not set"}</p>
          <h2>${selected.name}</h2>
          <span>${selected.current_goal || selected.area || "No current goal set."}</span>
        </div>
        <div class="mini-metrics">
          <strong>${stats.nextSession ? formatDate(stats.nextSession.date, true) : "No lesson"}</strong>
          <span>${stats.sessions} sessions / ${stats.tasks} tasks</span>
        </div>
      </div>

      <div class="tabs">
        ${["overview", "tasks", "sessions", "messages", "files"].map((item) => html`
          <button class=${tab === item ? "active" : ""} onClick=${() => setTab(item)}>${label(item)}</button>
        `)}
      </div>

      ${tab === "overview" && html`<${OverviewTab} selected=${selected} stats=${stats} tasks=${tasks} sessions=${sessions} messages=${messages} files=${files} />`}
      ${tab === "tasks" && html`<${TasksTab} tasks=${tasks} addRecord=${addRecord} updateRecord=${updateRecord} />`}
      ${tab === "sessions" && html`<${SessionsTab} sessions=${sessions} addRecord=${addRecord} />`}
      ${tab === "messages" && html`<${MessagesTab} messages=${messages} addRecord=${addRecord} updateRecord=${updateRecord} />`}
      ${tab === "files" && html`<${FilesTab} files=${files} addRecord=${addRecord} />`}
    </aside>
  `;
}

function OverviewTab({ selected, stats, tasks, sessions, messages, files }) {
  return html`
    <div class="overview-grid">
      <${InfoCard} label="Next action" value=${stats.nextSession ? "Prepare the next lesson context." : selected.status === "active" ? "Schedule the next lesson." : "Review status and goal."} />
      <${InfoCard} label="Current goal" value=${selected.current_goal || "No current goal set."} />
      <${InfoCard} label="Latest session" value=${stats.latestSession ? `${formatDate(stats.latestSession.date)} / ${stats.latestSession.next_actions || stats.latestSession.topic || "Session"}` : "No sessions yet."} />
      <${InfoCard} label="Latest message" value=${stats.latestMessage ? stats.latestMessage.message : "No messages yet."} />
      <${InfoCard} label="Open tasks" value=${tasks.filter((item) => item.status !== "done").map((item) => item.title).join(", ") || "Nothing open."} />
      <${InfoCard} label="Files" value=${files.length ? `${files.length} links/files saved` : "No files yet."} />
    </div>
  `;
}

function InfoCard({ label, value }) {
  return html`<article class="info-card"><span>${label}</span><p>${value}</p></article>`;
}

function TasksTab({ tasks, addRecord, updateRecord }) {
  return html`
    <${InlineForm} button="Add task" onSubmit=${(event) => {
      event.preventDefault();
      addRecord("progress_items", { ...formData(event.currentTarget), priority: "normal" }, event.currentTarget);
    }}>
      <input name="title" placeholder="Task or blocker" required />
      <select name="status">${taskStatuses.map((item) => html`<option value=${item}>${label(item)}</option>`)}</select>
      <input name="due_at" type="date" />
    </${InlineForm}>
    <div class="stack">${tasks.map((task) => html`
      <article class="list-row">
        <div><strong>${task.title}</strong><span>${label(task.status)}${task.due_at ? ` / due ${formatDate(task.due_at, true)}` : ""}</span></div>
        <select value=${task.status} onChange=${(event) => updateRecord("progress_items", task.id, { status: event.currentTarget.value })}>
          ${taskStatuses.map((item) => html`<option value=${item}>${label(item)}</option>`)}
        </select>
      </article>
    `)}</div>
  `;
}

function SessionsTab({ sessions, addRecord }) {
  return html`
    <${InlineForm} button="Add session" onSubmit=${(event) => {
      event.preventDefault();
      const raw = formData(event.currentTarget);
      addRecord("sessions", { date: raw.date || new Date().toISOString(), topic: raw.topic, meeting_url: raw.meeting_url, duration_minutes: 50 }, event.currentTarget);
    }}>
      <input name="date" type="datetime-local" />
      <input name="topic" placeholder="Topic" />
      <input name="meeting_url" type="url" placeholder="Meeting URL" />
    </${InlineForm}>
    <div class="stack">${sessions.map((session) => html`
      <article class="list-row">
        <div><strong>${formatDate(session.date)}</strong><span>${session.topic || session.next_actions || "Session"}${session.meeting_url ? " / meeting link saved" : ""}</span></div>
      </article>
    `)}</div>
  `;
}

function MessagesTab({ messages, addRecord, updateRecord }) {
  return html`
    <${InlineForm} button="Add message" onSubmit=${(event) => {
      event.preventDefault();
      addRecord("support_notes", { ...formData(event.currentTarget), source: "manual" }, event.currentTarget);
    }}>
      <input name="message" placeholder="Message or support note" required />
    </${InlineForm}>
    <div class="stack">${messages.map((message) => html`
      <article class="list-row">
        <div><strong>${message.message}</strong><span>${formatDate(message.created_at)} / ${message.resolved ? "resolved" : "open"}</span></div>
        <button class="secondary" onClick=${() => updateRecord("support_notes", message.id, { resolved: !message.resolved })}>${message.resolved ? "Reopen" : "Resolve"}</button>
      </article>
    `)}</div>
  `;
}

function FilesTab({ files, addRecord }) {
  return html`
    <${InlineForm} button="Add link" onSubmit=${(event) => {
      event.preventDefault();
      addRecord("client_files", { ...formData(event.currentTarget), kind: "other" }, event.currentTarget);
    }}>
      <input name="url" type="url" placeholder="https://..." required />
      <input name="label" placeholder="Label" />
    </${InlineForm}>
    <div class="stack">${files.map((file) => html`
      <article class="list-row">
        <div><strong>${file.label || file.kind}</strong><a href=${file.url} target="_blank" rel="noreferrer">${file.url}</a></div>
      </article>
    `)}</div>
  `;
}

function InlineForm({ children, button, onSubmit }) {
  return html`<form class="inline-form" onSubmit=${onSubmit}>${children}<button type="submit">${button}</button></form>`;
}

function RequestsView({ requests, onConvert }) {
  const visible = requests.filter((request) => request.status !== "archived");
  return html`
    <section class="panel">
      <div class="panel-head"><h2>Consultation requests</h2></div>
      <div class="stack">
        ${visible.length ? visible.map((request) => html`
          <article class="list-row request-row">
            <div>
              <strong>${request.name}</strong>
              <span>${request.email} / ${label(request.status)} / ${formatDate(request.created_at)}</span>
              <p>${request.area || ""} ${request.goal || ""}</p>
            </div>
            ${request.status === "converted"
              ? html`<span class="chip">Converted</span>`
              : html`<button onClick=${() => onConvert(request)}>Convert</button>`}
          </article>
        `) : html`<div class="empty">No open requests.</div>`}
      </div>
    </section>
  `;
}

function AddStudentModal({ onClose, onSubmit }) {
  return html`
    <div class="modal-backdrop" onClick=${(event) => event.target === event.currentTarget && onClose()}>
      <section class="modal">
        <div class="panel-head">
          <h2>Add student</h2>
          <button class="secondary icon" onClick=${onClose}>x</button>
        </div>
        <form class="student-form" onSubmit=${onSubmit}>
          <input name="name" placeholder="Name" required />
          <input name="email" type="email" placeholder="Email" />
          <input name="timezone" placeholder="Time zone" />
          <select name="plan">
            <option value="session_only">$100 session only</option>
            <option value="session_plus_support">$130 plus support</option>
          </select>
          <input name="area" placeholder="Area" />
          <select name="status">${statusOptions.map((item) => html`<option value=${item}>${label(item)}</option>`)}</select>
          <textarea name="current_goal" placeholder="Current goal" rows="3"></textarea>
          <button type="submit">Create student</button>
        </form>
      </section>
    </div>
  `;
}

render(html`<${App} />`, document.getElementById("app"));
