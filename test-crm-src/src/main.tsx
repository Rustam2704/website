import React from "react";
import { createRoot } from "react-dom/client";
import { createClient, type User } from "@supabase/supabase-js";
import {
  Activity,
  CalendarClock,
  CheckSquare,
  Download,
  FileText,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  UserRound
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import "./styles.css";

type View = "today" | "students" | "requests";

type Client = {
  id: string;
  owner_id: string;
  name: string;
  email: string | null;
  timezone: string | null;
  plan: "session_only" | "session_plus_support";
  paid_sessions_total: number | null;
  support_until: string | null;
  area: string | null;
  current_goal: string | null;
  status: "lead" | "active" | "paused" | "done";
  created_at: string;
  updated_at: string;
};

type Session = {
  id: string;
  client_id: string;
  date: string;
  duration_minutes: number;
  topic: string | null;
  notes: string | null;
  next_actions: string | null;
  meeting_url?: string | null;
};

type ProgressItem = {
  id: string;
  client_id: string;
  title: string;
  status: "blocked" | "in_progress" | "improved" | "done";
  priority: "low" | "normal" | "high";
  due_at: string | null;
  teacher_comment: string | null;
  created_at: string;
  updated_at: string;
};

type SupportNote = {
  id: string;
  client_id: string;
  message: string;
  source: string;
  resolved: boolean;
  created_at: string;
};

type ClientFile = {
  id: string;
  client_id: string;
  url: string;
  label: string | null;
  kind: string;
  created_at: string;
};

type IntakeRequest = {
  id: string;
  name: string;
  email: string;
  area: string | null;
  goal: string | null;
  status: "new" | "reviewed" | "converted" | "archived";
  client_id: string | null;
  created_at: string;
};

type CrmData = {
  clients: Client[];
  sessions: Session[];
  progress: ProgressItem[];
  support: SupportNote[];
  files: ClientFile[];
  intake: IntakeRequest[];
};

const emptyData: CrmData = {
  clients: [],
  sessions: [],
  progress: [],
  support: [],
  files: [],
  intake: []
};

const config = window.FANATIC_CRM_SUPABASE || {};
const hasConfig = Boolean(config.url && config.anonKey);
const supabase = hasConfig ? createClient(config.url!, config.anonKey!) : null;

const statuses = ["lead", "active", "paused", "done"] as const;
const taskStatuses = ["blocked", "in_progress", "improved", "done"] as const;

function label(value: string | null | undefined) {
  return String(value || "-").replaceAll("_", " ");
}

function formatDate(value: string | null | undefined, compact = false) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", compact
    ? { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
    : { dateStyle: "medium", timeStyle: "short" }
  ).format(new Date(value));
}

function clean<T extends Record<string, FormDataEntryValue | string | null | undefined>>(payload: T) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== "" && value != null));
}

function formPayload(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

async function requireResult<T>(query: PromiseLike<{ data: T | null; error: unknown }>) {
  const { data, error } = await query;
  if (error) throw error as Error;
  return data as T;
}

function nextSession(clientId: string, sessions: Session[]) {
  const now = Date.now();
  return sessions
    .filter((session) => session.client_id === clientId && new Date(session.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null;
}

function latestBy<T extends Record<string, unknown>>(records: T[], field: keyof T) {
  return [...records]
    .filter((record) => record[field])
    .sort((a, b) => new Date(String(b[field])).getTime() - new Date(String(a[field])).getTime())[0] || null;
}

function clientStats(client: Client, data: CrmData) {
  const tasks = data.progress.filter((item) => item.client_id === client.id);
  const sessions = data.sessions.filter((item) => item.client_id === client.id);
  const support = data.support.filter((item) => item.client_id === client.id);
  return {
    activeTasks: tasks.filter((item) => item.status !== "done").length,
    blockers: tasks.filter((item) => item.status === "blocked").length,
    sessions: sessions.length,
    openMessages: support.filter((item) => !item.resolved).length,
    nextSession: nextSession(client.id, data.sessions),
    latestSession: latestBy(sessions, "date"),
    latestMessage: latestBy(support, "created_at")
  };
}

function activityItems(data: CrmData) {
  const clients = Object.fromEntries(data.clients.map((client) => [client.id, client]));
  return [
    ...data.sessions.map((session) => ({
      type: "Session",
      icon: CalendarClock,
      title: session.topic || session.next_actions || "Lesson recorded",
      client: clients[session.client_id]?.name || "Unknown student",
      date: session.date
    })),
    ...data.progress.map((task) => ({
      type: "Task",
      icon: CheckSquare,
      title: task.title,
      client: clients[task.client_id]?.name || "Unknown student",
      date: task.updated_at || task.created_at
    })),
    ...data.support.map((note) => ({
      type: "Message",
      icon: MessageSquare,
      title: note.message,
      client: clients[note.client_id]?.name || "Unknown student",
      date: note.created_at
    })),
    ...data.files.map((file) => ({
      type: "File",
      icon: FileText,
      title: file.label || file.kind,
      client: clients[file.client_id]?.name || "Unknown student",
      date: file.created_at
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 12);
}

function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [data, setData] = React.useState<CrmData>(emptyData);
  const [view, setView] = React.useState<View>("today");
  const [selectedId, setSelectedId] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [sheet, setSheet] = React.useState<"student" | "task" | "session" | "message" | "file" | null>(null);
  const [busy, setBusy] = React.useState(true);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    void boot();
    if (!supabase) return;
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) void loadAll(session.user.id);
    });
    return () => auth.subscription.unsubscribe();
  }, []);

  async function boot() {
    if (!supabase) {
      setBusy(false);
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    setUser(sessionData.session?.user || null);
    if (sessionData.session?.user) await loadAll(sessionData.session.user.id);
    setBusy(false);
  }

  async function loadAll(ownerId = user?.id) {
    if (!supabase || !ownerId) return;
    setBusy(true);
    try {
      const [clients, progress, sessions, support, files, intake] = await Promise.all([
        requireResult<Client[]>(supabase.from("clients").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false })),
        requireResult<ProgressItem[]>(supabase.from("progress_items").select("*").eq("owner_id", ownerId).order("updated_at", { ascending: false })),
        requireResult<Session[]>(supabase.from("sessions").select("*").eq("owner_id", ownerId).order("date", { ascending: false })),
        requireResult<SupportNote[]>(supabase.from("support_notes").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false })),
        requireResult<ClientFile[]>(supabase.from("client_files").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false })),
        requireResult<IntakeRequest[]>(supabase.from("intake_requests").select("*").order("created_at", { ascending: false }))
      ]);
      setData({ clients, progress, sessions, support, files, intake });
      setSelectedId((current) => current || clients[0]?.id || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function signIn() {
    if (!supabase) return;
    setMessage("Opening Google sign in...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/test-crm/`,
        queryParams: { prompt: "select_account" }
      }
    });
    if (error) setMessage(error.message);
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setUser(null);
    setData(emptyData);
  }

  async function insert(table: string, payload: Record<string, unknown>) {
    if (!supabase || !user) return;
    await requireResult(supabase.from(table).insert(clean(payload as Record<string, string>)).select());
    await loadAll();
  }

  async function update(table: string, id: string, payload: Record<string, unknown>) {
    if (!supabase || !user) return;
    await requireResult(supabase.from(table).update(clean(payload as Record<string, string>)).eq("owner_id", user.id).eq("id", id).select());
    await loadAll();
  }

  async function convertRequest(request: IntakeRequest) {
    if (!supabase || !user) return;
    const existing = data.clients.find((client) => client.email?.toLowerCase() === request.email.toLowerCase());
    const client = existing || (await requireResult<Client[]>(supabase.from("clients").insert({
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
  }

  const selected = data.clients.find((client) => client.id === selectedId) || null;
  const filteredClients = data.clients.filter((client) => {
    const haystack = [client.name, client.email, client.area, client.current_goal].join(" ").toLowerCase();
    return (status === "all" || client.status === status) && haystack.includes(search.toLowerCase());
  });

  if (busy && !user) return <FullScreen title="Loading CRM..." />;
  if (!hasConfig) return <FullScreen title="Supabase config missing" detail="This route reads the existing CRM config." />;
  if (!user) return <LoginScreen message={message} onSignIn={signIn} />;

  return (
    <SidebarProvider>
      <AppSidebar view={view} setView={setView} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b bg-background/95 px-5 backdrop-blur">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">Teaching CRM</p>
            <h1 className="text-2xl font-semibold tracking-tight">{view === "today" ? "Today" : view === "students" ? "Students" : "Requests"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{user.email}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon"><MoreHorizontal /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => download("fanatic-test-crm-clients.csv", toCsv(data.clients as unknown as Record<string, unknown>[]), "text/csv")}>
                  <Download /> Export clients CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => download("fanatic-test-crm-backup.json", JSON.stringify(data, null, 2), "application/json")}>
                  <FileText /> Backup JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void loadAll()}>
                  <RefreshCw /> Refresh
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void signOut()}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="grid gap-5 p-5">
          {message ? <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">{message}</div> : null}
          {view === "today" ? <TodayView data={data} openStudents={() => setView("students")} selectClient={setSelectedId} /> : null}
          {view === "students" ? (
            <StudentsView
              data={data}
              clients={filteredClients}
              selected={selected}
              search={search}
              status={status}
              setSearch={setSearch}
              setStatus={setStatus}
              setSelectedId={setSelectedId}
              openSheet={setSheet}
              update={update}
            />
          ) : null}
          {view === "requests" ? <RequestsView requests={data.intake} convert={convertRequest} /> : null}
        </main>
        <RecordSheets
          sheet={sheet}
          close={() => setSheet(null)}
          selected={selected}
          user={user}
          insert={insert}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppSidebar({ view, setView }: { view: View; setView: (view: View) => void }) {
  const items = [
    ["today", LayoutDashboard],
    ["students", GraduationCap],
    ["requests", Inbox]
  ] as const;

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:!p-1.5">
              <GraduationCap />
              <span className="text-base font-semibold">fanatic.crm</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(([item, Icon]) => (
                <SidebarMenuItem key={item}>
                  <SidebarMenuButton isActive={view === item} onClick={() => setView(item)}>
                    <Icon />
                    <span>{label(item)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

function TodayView({ data, openStudents, selectClient }: { data: CrmData; openStudents: () => void; selectClient: (id: string) => void }) {
  const clientsById = Object.fromEntries(data.clients.map((client) => [client.id, client]));
  const active = data.clients.filter((client) => client.status === "active").length;
  const openTasks = data.progress.filter((task) => task.status !== "done").slice(0, 7);
  const upcoming = data.sessions.filter((session) => new Date(session.date).getTime() >= Date.now()).slice(0, 6);
  const hotStudents = data.clients.map((client) => ({ client, stats: clientStats(client, data) })).filter(({ client, stats }) => client.status === "active" || stats.blockers || stats.openMessages).slice(0, 6);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Students" value={data.clients.length} />
        <Metric label="Active" value={active} />
        <Metric label="New requests" value={data.intake.filter((item) => item.status === "new").length} />
        <Metric label="Open tasks" value={data.progress.filter((item) => item.status !== "done").length} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.3fr_0.9fr]">
        <Card>
          <CardHeader><CardTitle>Hot students</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {hotStudents.map(({ client, stats }) => (
              <button className="rounded-md border p-3 text-left hover:bg-accent" key={client.id} onClick={() => { selectClient(client.id); openStudents(); }}>
                <strong className="block">{client.name}</strong>
                <span className="text-sm text-muted-foreground">{stats.blockers} blockers / {stats.openMessages} messages</span>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {activityItems(data).map((item, index) => {
              const Icon = item.icon;
              return (
                <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 border-b pb-3 last:border-b-0" key={`${item.type}-${index}`}>
                  <span className="grid size-8 place-items-center rounded-md bg-muted"><Icon className="size-4" /></span>
                  <div className="min-w-0">
                    <strong className="block truncate">{item.title}</strong>
                    <span className="text-sm text-muted-foreground">{item.client} / {formatDate(item.date, true)}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Open tasks</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {openTasks.map((task) => (
              <button className="rounded-md border p-3 text-left hover:bg-accent" key={task.id} onClick={() => { selectClient(task.client_id); openStudents(); }}>
                <strong className="block">{task.title}</strong>
                <span className="text-sm text-muted-foreground">{clientsById[task.client_id]?.name || "Unknown"} / {label(task.status)}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Upcoming sessions</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {upcoming.map((session) => (
              <div className="rounded-md border p-3" key={session.id}>
                <strong className="block">{formatDate(session.date)}</strong>
                <span className="text-sm text-muted-foreground">{clientsById[session.client_id]?.name || "Unknown"} / {session.topic || "Session"}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Needs attention</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {data.clients.filter((client) => client.status === "active" && !nextSession(client.id, data.sessions)).map((client) => (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-950" key={client.id}>
                <strong className="block">{client.name}: no next session</strong>
                <span className="text-sm">{client.current_goal || client.area}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <strong className="mt-2 block text-3xl">{value}</strong>
      </CardContent>
    </Card>
  );
}

function StudentsView(props: {
  data: CrmData;
  clients: Client[];
  selected: Client | null;
  search: string;
  status: string;
  setSearch: (value: string) => void;
  setStatus: (value: string) => void;
  setSelectedId: (value: string) => void;
  openSheet: (value: "student" | "task" | "session" | "message" | "file") => void;
  update: (table: string, id: string, payload: Record<string, unknown>) => Promise<void>;
}) {
  const { data, clients, selected, search, status, setSearch, setStatus, setSelectedId, openSheet, update } = props;
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(460px,0.95fr)_minmax(0,1.05fr)]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Students</CardTitle>
          <Button onClick={() => openSheet("student")}><Plus /> Add student</Button>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2 md:grid-cols-[1fr_160px]">
            <Input placeholder="Search students" value={search} onChange={(event) => setSearch(event.currentTarget.value)} />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statuses.map((item) => <SelectItem value={item} key={item}>{label(item)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[760px] grid-cols-[1.1fr_0.7fr_1.2fr_0.7fr] gap-2 px-3 pb-2 text-xs font-bold uppercase text-muted-foreground">
              <span>Student</span><span>Next</span><span>Goal</span><span>Work</span>
            </div>
            {clients.map((client) => {
              const stats = clientStats(client, data);
              return (
                <button className={`grid min-w-[760px] grid-cols-[1.1fr_0.7fr_1.2fr_0.7fr] gap-2 rounded-md border p-3 text-left hover:bg-accent ${selected?.id === client.id ? "border-primary bg-accent" : ""}`} key={client.id} onClick={() => setSelectedId(client.id)}>
                  <span><strong className="block">{client.name}</strong><small className="text-muted-foreground">{client.email || client.area}</small></span>
                  <span>{stats.nextSession ? formatDate(stats.nextSession.date, true) : "-"}</span>
                  <span className="truncate">{client.current_goal || client.area || "-"}</span>
                  <span>{stats.activeTasks} tasks / {stats.openMessages} msgs</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <StudentDetail data={data} selected={selected} openSheet={openSheet} update={update} />
    </div>
  );
}

function StudentDetail({ data, selected, openSheet, update }: { data: CrmData; selected: Client | null; openSheet: (value: "task" | "session" | "message" | "file") => void; update: (table: string, id: string, payload: Record<string, unknown>) => Promise<void> }) {
  if (!selected) return <Card><CardContent className="p-6 text-muted-foreground">Select a student.</CardContent></Card>;
  const stats = clientStats(selected, data);
  const tasks = data.progress.filter((item) => item.client_id === selected.id);
  const sessions = data.sessions.filter((item) => item.client_id === selected.id);
  const support = data.support.filter((item) => item.client_id === selected.id);
  const files = data.files.filter((item) => item.client_id === selected.id);
  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge variant="secondary">{label(selected.status)}</Badge>
            <CardTitle className="mt-2 text-2xl">{selected.name}</CardTitle>
            <p className="text-muted-foreground">{selected.current_goal || selected.area || "No goal set."}</p>
          </div>
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <strong className="block">{stats.nextSession ? formatDate(stats.nextSession.date, true) : "No lesson"}</strong>
            <span className="text-muted-foreground">{stats.sessions} sessions / {stats.activeTasks} tasks</span>
          </div>
        </div>
        <form className="grid gap-2 md:grid-cols-[150px_1fr_auto]" onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          void update("clients", selected.id, formPayload(event.currentTarget));
        }}>
          <Select name="status" defaultValue={selected.status}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{statuses.map((item) => <SelectItem value={item} key={item}>{label(item)}</SelectItem>)}</SelectContent>
          </Select>
          <Input name="current_goal" defaultValue={selected.current_goal || ""} placeholder="Current goal" />
          <Button type="submit" variant="outline">Save</Button>
        </form>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="flex h-auto flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="grid gap-3 md:grid-cols-2">
            <Info label="Next action" value={stats.nextSession ? "Prepare the next lesson context." : "Schedule the next lesson."} />
            <Info label="Latest session" value={stats.latestSession ? `${formatDate(stats.latestSession.date)} / ${stats.latestSession.topic || "Session"}` : "No sessions yet."} />
            <Info label="Latest message" value={stats.latestMessage ? stats.latestMessage.message : "No messages yet."} />
            <Info label="Open tasks" value={tasks.filter((item) => item.status !== "done").map((item) => item.title).join(", ") || "Nothing open."} />
          </TabsContent>
          <TabsContent value="tasks"><RecordList title="Tasks" icon={CheckSquare} action={() => openSheet("task")} items={tasks.map((item) => ({ id: item.id, title: item.title, meta: `${label(item.status)}${item.due_at ? ` / due ${formatDate(item.due_at, true)}` : ""}` }))} /></TabsContent>
          <TabsContent value="sessions"><RecordList title="Sessions" icon={CalendarClock} action={() => openSheet("session")} items={sessions.map((item) => ({ id: item.id, title: formatDate(item.date), meta: item.topic || item.next_actions || "Session" }))} /></TabsContent>
          <TabsContent value="messages"><RecordList title="Messages" icon={MessageSquare} action={() => openSheet("message")} items={support.map((item) => ({ id: item.id, title: item.message, meta: `${formatDate(item.created_at, true)} / ${item.resolved ? "resolved" : "open"}` }))} /></TabsContent>
          <TabsContent value="files"><RecordList title="Files" icon={FileText} action={() => openSheet("file")} items={files.map((item) => ({ id: item.id, title: item.label || item.kind, meta: item.url }))} /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border p-3"><span className="text-xs font-bold uppercase text-muted-foreground">{label}</span><p className="mt-2">{value}</p></div>;
}

function RecordList({ title, icon: Icon, action, items }: { title: string; icon: typeof Activity; action: () => void; items: { id: string; title: string; meta: string }[] }) {
  return (
    <div className="grid gap-3 pt-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold"><Icon className="size-4" /> {title}</h3>
        <Button size="sm" onClick={action}><Plus /> Add</Button>
      </div>
      {items.map((item) => <div className="rounded-md border p-3" key={item.id}><strong className="block">{item.title}</strong><span className="text-sm text-muted-foreground">{item.meta}</span></div>)}
    </div>
  );
}

function RequestsView({ requests, convert }: { requests: IntakeRequest[]; convert: (request: IntakeRequest) => Promise<void> }) {
  const visible = requests.filter((request) => request.status !== "archived");
  return (
    <Card>
      <CardHeader><CardTitle>Consultation requests</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        {visible.map((request) => (
          <div className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_auto]" key={request.id}>
            <div>
              <strong className="block">{request.name}</strong>
              <span className="text-sm text-muted-foreground">{request.email} / {label(request.status)} / {formatDate(request.created_at)}</span>
              <p className="mt-2 text-sm">{request.area} {request.goal}</p>
            </div>
            {request.status === "converted" ? <Badge>Converted</Badge> : <Button onClick={() => void convert(request)}>Convert</Button>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RecordSheets({ sheet, close, selected, user, insert }: { sheet: "student" | "task" | "session" | "message" | "file" | null; close: () => void; selected: Client | null; user: User; insert: (table: string, payload: Record<string, unknown>) => Promise<void> }) {
  const title = sheet === "student" ? "Add student" : sheet === "task" ? "Add task" : sheet === "session" ? "Add session" : sheet === "message" ? "Add message" : "Add file";
  return (
      <Sheet open={Boolean(sheet)} onOpenChange={(open: boolean) => !open && close()}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader><SheetTitle>{title}</SheetTitle></SheetHeader>
        <form className="grid gap-3 px-4" onSubmit={async (event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          if (!sheet) return;
          const raw = formPayload(event.currentTarget);
          if (sheet === "student") await insert("clients", { ...raw, owner_id: user.id });
          if (sheet === "task" && selected) await insert("progress_items", { ...raw, owner_id: user.id, client_id: selected.id, priority: "normal" });
          if (sheet === "session" && selected) await insert("sessions", { ...raw, owner_id: user.id, client_id: selected.id, duration_minutes: 50, date: raw.date || new Date().toISOString() });
          if (sheet === "message" && selected) await insert("support_notes", { ...raw, owner_id: user.id, client_id: selected.id, source: "manual" });
          if (sheet === "file" && selected) await insert("client_files", { ...raw, owner_id: user.id, client_id: selected.id, kind: "other" });
          close();
        }}>
          {sheet === "student" ? (
            <>
              <Input name="name" placeholder="Name" required />
              <Input name="email" type="email" placeholder="Email" />
              <Input name="timezone" placeholder="Time zone" />
              <Input name="area" placeholder="Area" />
              <Textarea name="current_goal" placeholder="Current goal" />
            </>
          ) : null}
          {sheet === "task" ? (
            <>
              <Input name="title" placeholder="Task or blocker" required />
              <Select name="status" defaultValue="in_progress">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{taskStatuses.map((item) => <SelectItem value={item} key={item}>{label(item)}</SelectItem>)}</SelectContent>
              </Select>
              <Input name="due_at" type="date" />
            </>
          ) : null}
          {sheet === "session" ? (
            <>
              <Input name="date" type="datetime-local" />
              <Input name="topic" placeholder="Topic" />
              <Input name="meeting_url" type="url" placeholder="Meeting URL" />
            </>
          ) : null}
          {sheet === "message" ? <Textarea name="message" placeholder="Message or support note" required /> : null}
          {sheet === "file" ? (
            <>
              <Input name="url" type="url" placeholder="https://..." required />
              <Input name="label" placeholder="Label" />
            </>
          ) : null}
          <SheetFooter className="px-0">
            <Button type="submit">Save</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function LoginScreen({ message, onSignIn }: { message: string; onSignIn: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-muted p-5">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <p className="text-xs font-bold uppercase text-primary">Fanatic CRM</p>
          <CardTitle className="text-3xl">New CRM test shell</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-muted-foreground">React/Vite route using Atomic CRM shadcn components and the existing Supabase backend.</p>
          <Button onClick={onSignIn}>Continue with Google</Button>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}

function FullScreen({ title, detail }: { title: string; detail?: string }) {
  return <main className="grid min-h-screen place-items-center p-5"><Card className="w-full max-w-md"><CardHeader><CardTitle>{title}</CardTitle></CardHeader>{detail ? <CardContent>{detail}</CardContent> : null}</Card></main>;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
