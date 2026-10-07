"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, ArrowLeft, Check, ChevronRight, Download, FileText, LayoutDashboard, Loader2,
  LogOut, MessageSquare, PanelLeftClose, PanelLeftOpen, RotateCcw, Search, Trash2, Users, X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { LogoMark, Wordmark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { requestSignOut } from "@/lib/client-auth";
import { useCollapsed } from "@/lib/use-collapsed";
import { label } from "@/lib/labels";
import { SECTION_FIELDS, SECTION_LABEL, type FormState, type Section } from "@/lib/schema";
import type { CandidateSummary } from "@/lib/admin";

type Overview = {
  candidates: CandidateSummary[];
  totals: { candidates: number; submitted: number; inProgress: number; avgCompletion: number; withResume: number; messages: number; signIns: number };
};
type Activity = {
  logins: { candidate_id: string; succeeded: boolean; created_at: string }[];
  runs: { candidate_id: string; kind: string; section: string | null; created_at: string }[];
};
type Detail = {
  id: string; name: string; status: "draft" | "submitted"; updatedAt: string | null; submittedAt: string | null;
  percent: number; missing: string[]; form: FormState; resume: { name: string; url: string | null } | null;
  summary: string; resumeChars: number;
  thankyou: { character: string; series: string; content: { headline: string; message: string; wishes: string[]; signoff: string } } | null;
  chat: { role: string; content: string; created_at: string }[];
  notes: { section: string; note: string; created_at: string }[];
  runs: { kind: string; section: string | null; created_at: string }[];
  signIns: { signIns: number; failedSignIns: number; firstSignIn: string | null; lastSignIn: string | null; recent: { succeeded: boolean; created_at: string }[] };
};

type Tab = "dashboard" | "candidates" | "activity";
const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "candidates", label: "Candidates", icon: Users },
  { id: "activity", label: "Activity", icon: Activity },
];
const TINTS = ["from-[#FFB27A] to-[#F4701E]", "from-[#8FD3B6] to-[#2E9E75]", "from-[#9DBBFF] to-[#4A74E0]"];
const tintOf = (id: string) => TINTS[["ayushi", "gaurav", "pawan"].indexOf(id) % 3] ?? TINTS[0];

const when = (s?: string | null) =>
  s ? new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "-";
const ago = (s: string) => {
  const m = Math.round((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};
const money = (c: CandidateSummary) =>
  c.ctcMin == null ? "-" : `${c.ctcMin}${c.ctcMax ? `–${c.ctcMax}` : ""} ${c.currency === "INR" ? "LPA" : c.currency}`;

function Avatar({ id, name, size = "size-11" }: { id: string; name: string; size?: string }) {
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${tintOf(id)} font-bold text-white shadow-sm`}>
      {name[0]}
    </span>
  );
}

function Badge({ status }: { status: "draft" | "submitted" }) {
  return status === "submitted" ? (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#E3F6EC] px-2.5 py-1 text-xs font-semibold text-[#1F8A5B]"><Check className="size-3.5" /> Submitted</span>
  ) : (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">In progress</span>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="hatch h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(value, 3)}%` }} />
    </div>
  );
}

function Stat({ label: l, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card-soft p-6">
      <p className="text-sm text-muted-foreground">{l}</p>
      <p className="mt-1.5 text-[1.7rem] font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AdminApp() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [selected, setSelected] = useState<string | null>(null);
  const [data, setData] = useState<Overview | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "submitted" | "draft">("all");
  const [sideCollapsed, toggleSide] = useCollapsed("cp-admin-side-collapsed");

  const load = useCallback(async () => {
    try {
      const [o, a] = await Promise.all([fetch("/api/admin/overview"), fetch("/api/admin/activity")]);
      if (o.status === 401 || o.status === 403) { router.replace("/"); return; }
      if (!o.ok) throw new Error();
      setData(await o.json());
      if (a.ok) setActivity(await a.json());
      setError("");
    } catch {
      setError("Could not load the dashboard. Please refresh.");
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function signOut() {
    if (!(await requestSignOut())) {
      toast.error("Could not sign out. Please check your connection and try again.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  const openCandidate = (id: string) => { setSelected(id); document.getElementById("admin-scroll")?.scrollTo({ top: 0 }); };
  const goTab = (t: Tab) => { setSelected(null); setTab(t); };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.candidates ?? []).filter((c) =>
      (filter === "all" || c.status === filter) &&
      (!q || [c.name, c.fullName, c.email, c.city, ...c.titles, ...c.profiles].join(" ").toLowerCase().includes(q)));
  }, [data, query, filter]);

  const navItem = (key: string, active: boolean, Icon: React.ComponentType<{ className?: string }>, text: string, onClick?: () => void, href?: string) => {
    const cls = `flex items-center rounded-xl text-sm font-medium transition ${sideCollapsed ? "h-11 justify-center" : "w-full gap-3 px-3.5 py-2.5"} ${active ? "bg-[#1B1A19] text-white" : "text-foreground/70 hover:bg-white"}`;
    const inner = (<><Icon className="size-[18px]" />{!sideCollapsed && <span>{text}</span>}</>);
    return href ? (
      <a key={key} href={href} className={cls} title={sideCollapsed ? text : undefined} aria-label={text}>{inner}</a>
    ) : (
      <button key={key} type="button" onClick={onClick} className={cls} title={sideCollapsed ? text : undefined} aria-label={text} aria-current={active ? "page" : undefined}>{inner}</button>
    );
  };

  /* ---------------- dashboard ---------------- */
  const dashboard = data && (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <Stat label="Candidates" value={data.totals.candidates} />
        <Stat label="Submitted" value={data.totals.submitted} hint={`${data.totals.inProgress} still in progress`} />
        <Stat label="Avg. completion" value={`${data.totals.avgCompletion}%`} />
        <Stat label="Total sign-ins" value={data.totals.signIns} hint={`${data.totals.withResume}/${data.totals.candidates} resumes · ${data.totals.messages} advisor messages`} />
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="card-soft p-6 lg:col-span-2">
          <h3 className="text-lg font-bold">Submission status</h3>
          {(() => {
            const R = 54, C = 2 * Math.PI * R;
            const frac = data.totals.candidates ? data.totals.submitted / data.totals.candidates : 0;
            return (
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-4">
                <div className="relative size-36 shrink-0">
                  <svg viewBox="0 0 130 130" className="size-36 -rotate-90">
                    <circle cx="65" cy="65" r={R} fill="none" stroke="#F3EEE7" strokeWidth="14" />
                    <circle cx="65" cy="65" r={R} fill="none" stroke="#F4701E" strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - C * frac} style={{ transition: "stroke-dashoffset 700ms" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tabular-nums">{data.totals.submitted}</span>
                    <span className="text-xs text-muted-foreground">of {data.totals.candidates}</span>
                  </div>
                </div>
                <ul className="space-y-2 whitespace-nowrap text-sm">
                  <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-primary" /> Submitted: {data.totals.submitted}</li>
                  <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-muted" /> In progress: {data.totals.inProgress}</li>
                </ul>
              </div>
            );
          })()}
        </section>

        <section className="card-soft p-6 lg:col-span-3">
          <h3 className="text-lg font-bold">Compensation</h3>
          <p className="text-xs text-muted-foreground">Current vs expected (in each person&apos;s own currency, LPA for INR)</p>
          {(() => {
            const max = Math.max(1, ...data.candidates.flatMap((c) => [c.ctcCurrent ?? 0, c.ctcMax ?? c.ctcMin ?? 0]));
            return (
              <div className="mt-4 space-y-4">
                {data.candidates.map((c) => (
                  <div key={c.id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-muted-foreground">{c.ctcCurrent ?? "-"} → {money(c)}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[#1B1A19]/70" style={{ width: `${((c.ctcCurrent ?? 0) / max) * 100}%` }} /></div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-grad" style={{ width: `${(((c.ctcMax ?? c.ctcMin) ?? 0) / max) * 100}%` }} /></div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#1B1A19]/70" /> Current</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> Expected</span>
                </div>
              </div>
            );
          })()}
        </section>
      </div>

      <section>
        <h3 className="mb-5 text-lg font-bold">Candidates</h3>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.candidates.map((c) => (
            <button key={c.id} type="button" onClick={() => openCandidate(c.id)} className="card-soft p-6 text-left transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center gap-3">
                <Avatar id={c.id} name={c.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{c.fullName || c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.email || "No email yet"}</p>
                </div>
                <Badge status={c.status} />
              </div>
              <div className="mt-4"><div className="mb-1.5 flex justify-between text-xs text-muted-foreground"><span>Completion</span><span>{c.percent}%</span></div><Bar value={c.percent} /></div>
              <p className="mt-3 truncate text-sm text-foreground/70">{c.titles.slice(0, 2).join(", ") || c.profiles.slice(0, 2).join(", ") || "No preferences yet"}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span><strong className="text-sm text-foreground">{c.signIns}</strong> sign-ins</span><span>Last: {c.lastSignIn ? ago(c.lastSignIn) : "never"}</span></div>
            </button>
          ))}
        </div>
      </section>

      {activity && (
        <section className="card-soft p-6">
          <h3 className="mb-2 text-lg font-bold">Recent activity</h3>
          <ActivityList activity={activity} limit={8} />
        </section>
      )}
    </div>
  );

  /* ---------------- candidates ---------------- */
  const candidates = data && (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, role, city…"
            aria-label="Search candidates"
            className="h-12 w-full rounded-full border border-input bg-white pl-11 pr-4 text-base outline-none focus:ring-3 focus:ring-primary/25"
          />
        </label>
        <div className="flex gap-2">
          {(["all", "submitted", "draft"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`h-12 rounded-full px-4 text-sm font-semibold capitalize transition ${filter === f ? "bg-[#1B1A19] text-white" : "bg-white text-foreground/70 shadow-sm"}`}>
              {f === "draft" ? "In progress" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="card-soft overflow-hidden">
        <div className="hidden grid-cols-[1.6fr_1.1fr_1.2fr_1.3fr_auto] xl:grid-cols-[1.6fr_1.1fr_1.2fr_1.3fr_1fr_1.3fr_auto] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
          <span>Candidate</span><span>Status</span><span>Completion</span><span className="hidden xl:block">Looking for</span><span className="hidden xl:block">Expected</span><span>Sign-ins</span><span />
        </div>
        {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No candidates match.</p>}
        {filtered.map((c) => (
          <button key={c.id} type="button" onClick={() => openCandidate(c.id)}
            className="grid w-full gap-3 border-b border-border px-6 py-6 text-left transition last:border-0 hover:bg-accent/40 lg:grid-cols-[1.6fr_1.1fr_1.2fr_1.3fr_auto] xl:grid-cols-[1.6fr_1.1fr_1.2fr_1.3fr_1fr_1.3fr_auto] lg:items-center lg:gap-4">
            <span className="flex items-center gap-3">
              <Avatar id={c.id} name={c.name} size="size-10" />
              <span className="min-w-0"><span className="block truncate font-semibold">{c.fullName || c.name}</span><span className="block truncate text-xs text-muted-foreground">{c.email || "-"}</span></span>
            </span>
            <span><Badge status={c.status} /></span>
            <span className="flex items-center gap-3"><span className="flex-1"><Bar value={c.percent} /></span><span className="w-9 text-right text-sm tabular-nums">{c.percent}%</span></span>
            <span className="hidden truncate text-sm text-foreground/75 xl:block">{c.titles.slice(0, 2).join(", ") || "-"}</span>
            <span className="hidden text-sm xl:block">{money(c)}</span>
            <span className="text-sm"><strong>{c.signIns}</strong> <span className="text-muted-foreground">· {c.lastSignIn ? ago(c.lastSignIn) : "never"}</span></span>
            <ChevronRight className="hidden size-5 text-muted-foreground lg:block" />
          </button>
        ))}
      </div>
    </div>
  );

  /* ---------------- activity ---------------- */
  const activityTab = activity && (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card-soft p-6">
        <h3 className="mb-2 text-lg font-bold">Sign-ins</h3>
        <ul className="divide-y divide-border">
          {activity.logins.length === 0 && <li className="py-4 text-sm text-muted-foreground">Nothing yet.</li>}
          {activity.logins.map((l, i) => (
            <li key={i} className="flex items-center gap-3 py-2.5 text-sm">
              <span className={`size-2.5 rounded-full ${l.succeeded ? "bg-[#1F8A5B]" : "bg-destructive"}`} />
              <span className="flex-1"><span className="font-semibold capitalize">{l.candidate_id}</span> {l.succeeded ? "signed in" : "wrong password"}</span>
              <span className="text-xs text-muted-foreground">{ago(l.created_at)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="card-soft p-6">
        <h3 className="mb-2 text-lg font-bold">Quick fill and chat usage</h3>
        <ActivityList activity={{ logins: [], runs: activity.runs }} limit={40} />
      </section>
    </div>
  );

  const titles: Record<Tab, string> = { dashboard: "Dashboard", candidates: "Candidates", activity: "Activity" };

  return (
    <AppShell>
      <aside
        className={`side-scroll hidden min-h-0 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-white/60 py-7 transition-[width,padding] duration-300 lg:flex [&>*]:shrink-0 ${sideCollapsed ? "w-[84px] px-3.5" : "w-[264px] px-5"}`}
        aria-label="Sidebar"
      >
        <div className={`mb-8 flex items-center ${sideCollapsed ? "flex-col gap-4" : "justify-between"}`}>
          <div className="flex items-center gap-3">
            <Wordmark size={40} sub="Admin console" hideText={sideCollapsed} />
          </div>
          <button
            type="button" onClick={toggleSide}
            aria-label={sideCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sideCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex size-9 items-center justify-center rounded-full text-foreground/60 transition hover:bg-white hover:text-foreground"
          >
            {sideCollapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          </button>
        </div>
        {TABS.map((t) => navItem(t.id, !selected && tab === t.id, t.icon, t.label, () => goTab(t.id)))}
        {navItem("export", false, Download, "Export CSV", undefined, "/api/admin/export?format=csv")}
        <div className="mt-auto pt-8">
          {sideCollapsed ? (
            <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="icon-btn mx-auto size-11 text-destructive"><LogOut className="size-[18px]" /></button>
          ) : (
            <button type="button" onClick={signOut} className="cta-soft w-full"><LogOut className="size-[18px]" /> Sign out</button>
          )}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="safe-top flex shrink-0 items-center gap-4 px-6 pb-4 pt-6 lg:px-14 lg:pt-10">
          {selected ? (
            <button type="button" onClick={() => setSelected(null)} aria-label="Back" className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm transition active:scale-95"><ArrowLeft className="size-5" /></button>
          ) : (
            <span className="lg:hidden"><LogoMark size={40} /></span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-serif text-xl lg:text-[1.75rem]">{selected ? "Candidate" : titles[tab]}</h1>
            {!selected && tab === "dashboard" && <p className="hidden text-sm text-muted-foreground lg:block">Everything about your candidates in one place</p>}
          </div>
          <a href="/api/admin/export?format=csv" className="cta-soft hidden h-10 px-4 text-sm sm:inline-flex"><Download className="size-4" /> Export CSV</a>
          <button type="button" className="icon-btn size-10 lg:hidden" onClick={signOut} aria-label="Sign out"><LogOut className="size-[18px] text-destructive" /></button>
        </header>

        <div id="admin-scroll" className="app-scroll px-6 pb-14 pt-4 lg:px-14">
          <div className="mx-auto w-full max-w-6xl">
            {error && <p role="alert" className="text-destructive">{error}</p>}
            {!data && !error && <div className="flex items-center gap-2 py-10 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Loading…</div>}
            {selected ? (
              <CandidateDetail id={selected} onChanged={load} />
            ) : tab === "dashboard" ? dashboard : tab === "candidates" ? candidates : activityTab}
          </div>
        </div>

        <nav className="safe-bottom flex shrink-0 gap-1 border-t border-border bg-white/90 px-3 py-2 backdrop-blur lg:hidden" aria-label="Admin sections">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => goTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition ${!selected && tab === t.id ? "bg-accent text-accent-foreground" : "text-foreground/60"}`}>
              <t.icon className="size-5" /> {t.label}
            </button>
          ))}
        </nav>
      </div>
    </AppShell>
  );
}

function ActivityList({ activity, limit }: { activity: Activity; limit: number }) {
  const items = [
    ...activity.logins.map((l) => ({ t: l.created_at, who: l.candidate_id, text: l.succeeded ? "signed in" : "entered a wrong password", ok: l.succeeded })),
    ...activity.runs.map((r) => ({
      t: r.created_at, who: r.candidate_id, ok: true,
      text: r.kind === "fill" ? `used Quick fill${r.section ? ` on ${SECTION_LABEL[r.section as Section] ?? r.section}` : ""}`
        : r.kind === "chat" ? "sent a message to the advisor" : r.kind === "check" ? "checked their profile"
        : r.kind === "thankyou" ? "received a thank-you note" : "advisor memory updated",
    })),
  ].sort((a, b) => +new Date(b.t) - +new Date(a.t)).slice(0, limit);
  if (!items.length) return <p className="py-4 text-sm text-muted-foreground">Nothing yet.</p>;
  return (
    <ul className="divide-y divide-border">
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-3 py-2.5 text-sm">
          <span className={`size-2.5 shrink-0 rounded-full ${it.ok ? "bg-primary" : "bg-destructive"}`} />
          <span className="min-w-0 flex-1 truncate"><span className="font-semibold capitalize">{it.who}</span> {it.text}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{ago(it.t)}</span>
        </li>
      ))}
    </ul>
  );
}

const DETAIL_TABS = ["Profile", "Experience & education", "Conversation", "Resume & note"] as const;

function CandidateDetail({ id, onChanged }: { id: string; onChanged: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [tab, setTab] = useState<(typeof DETAIL_TABS)[number]>("Profile");
  const [busy, setBusy] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/candidates/${id}`);
      if (r.ok) setD(await r.json());
    } catch { /* offline: keep showing the loader until the next attempt */ }
  }, [id]);
  useEffect(() => { setD(null); void load(); }, [load]);

  async function act(action: string, okText?: string) {
    setBusy(action);
    try {
      const r = await fetch(`/api/admin/candidates/${id}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
      });
      const j = await r.json().catch(() => ({}));
      setBusy(""); setConfirmReset(false);
      if (r.ok) { toast.success(okText ?? j.message); await load(); onChanged(); } else toast.error(j.error ?? "Could not do that.");
    } catch {
      setBusy(""); setConfirmReset(false);
      toast.error("Could not reach the server. Please try again.");
    }
  }

  if (!d) return <div className="flex items-center gap-2 py-10 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Loading…</div>;
  const f = d.form as unknown as Record<string, unknown>;
  const show = (v: unknown) => (Array.isArray(v) ? v.join(", ") : String(v ?? ""));

  const kv = (s: Section) => (
    <section key={s} className="card-soft p-6">
      <h3 className="mb-3 text-lg font-bold">{SECTION_LABEL[s]}</h3>
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {SECTION_FIELDS[s].map((k) => (
          <div key={k}><dt className="text-xs text-muted-foreground">{label(k)}</dt><dd className="break-words text-sm font-medium">{show(f[k]) || <span className="text-muted-foreground">-</span>}</dd></div>
        ))}
      </dl>
    </section>
  );

  return (
    <div className="space-y-8">
      <section className="card-soft p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar id={d.id} name={d.name} size="size-14" />
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold">{d.form.full_name || d.name}</p>
            <p className="text-sm text-muted-foreground">{d.form.email || "No email yet"} · Last update {when(d.updatedAt)}</p>
          </div>
          <Badge status={d.status} />
        </div>
        <div className="mt-4 grid items-center gap-3 sm:grid-cols-[1fr_auto]">
          <div><div className="mb-1.5 flex justify-between text-xs text-muted-foreground"><span>Completion</span><span>{d.percent}%</span></div><Bar value={d.percent} /></div>
          {d.submittedAt && <p className="text-xs text-muted-foreground">Submitted {when(d.submittedAt)}</p>}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Total sign-ins</p><p className="mt-1 text-2xl font-bold tabular-nums">{d.signIns.signIns}</p>{d.signIns.failedSignIns > 0 && <p className="text-xs text-muted-foreground">{d.signIns.failedSignIns} wrong passwords</p>}</div>
          <div className="rounded-2xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Last signed in</p><p className="mt-1 text-sm font-semibold">{when(d.signIns.lastSignIn)}</p></div>
          <div className="rounded-2xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">First signed in</p><p className="mt-1 text-sm font-semibold">{when(d.signIns.firstSignIn)}</p></div>
        </div>
        {d.missing.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Still missing: {d.missing.map(label).join(", ")}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          {d.status === "submitted" ? (
            <Button variant="outline" size="sm" className="h-9 rounded-full px-4" disabled={!!busy} onClick={() => act("reopen")}>{busy === "reopen" ? <Loader2 className="animate-spin" /> : <RotateCcw />} Reopen for editing</Button>
          ) : (
            <Button variant="outline" size="sm" className="h-9 rounded-full px-4" disabled={!!busy} onClick={() => act("mark_submitted")}>{busy === "mark_submitted" ? <Loader2 className="animate-spin" /> : <Check />} Mark as submitted</Button>
          )}
          {d.status === "submitted" && <Button variant="outline" size="sm" className="h-9 rounded-full px-4" disabled={!!busy} onClick={() => act("regenerate_thankyou")}>{busy === "regenerate_thankyou" ? <Loader2 className="animate-spin" /> : <FileText />} New thank-you note</Button>}
          <Button variant="outline" size="sm" className="h-9 rounded-full px-4" disabled={!!busy || d.chat.length === 0} onClick={() => act("clear_chat")}><MessageSquare /> Clear conversation</Button>
          <Button variant="destructive" size="sm" className="h-9 rounded-full px-4" disabled={!!busy} onClick={() => setConfirmReset(true)}><Trash2 /> Reset profile</Button>
        </div>
      </section>

      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0" role="tablist">
        {DETAIL_TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${tab === t ? "bg-[#1B1A19] text-white" : "bg-white text-foreground/70 shadow-sm"}`}>{t}</button>
        ))}
      </div>

      {tab === "Profile" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {(["personal", "skills", "preferences", "compensation", "links", "review"] as Section[]).map(kv)}
          <section className="card-soft p-6 lg:col-span-2">
            <h3 className="mb-3 text-lg font-bold">Sign-in history</h3>
            {d.signIns.recent.length === 0 ? <p className="text-sm text-muted-foreground">No sign-ins yet.</p> : (
              <ul className="grid gap-x-8 sm:grid-cols-2">
                {d.signIns.recent.map((l, i) => (
                  <li key={i} className="flex items-center gap-3 border-b border-border py-2.5 text-sm">
                    <span className={`size-2.5 rounded-full ${l.succeeded ? "bg-[#1F8A5B]" : "bg-destructive"}`} />
                    <span className="flex-1">{l.succeeded ? "Signed in" : "Wrong password"}</span>
                    <span className="text-xs text-muted-foreground">{when(l.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === "Experience & education" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card-soft p-6">
            <h3 className="mb-3 text-lg font-bold">Experience</h3>
            {d.form.no_experience || d.form.experience.length === 0 ? <p className="text-sm text-muted-foreground">None listed.</p> : (
              <ol className="space-y-4">
                {d.form.experience.map((e, i) => (
                  <li key={i} className="border-l-2 border-primary/40 pl-4">
                    <p className="font-semibold">{[e.job_title, e.company].filter(Boolean).join(" at ")}</p>
                    <p className="text-xs text-muted-foreground">{e.start_date || "?"} to {e.is_current ? "present" : e.end_date || "?"} · {[e.employment_type, e.work_mode, e.location].filter(Boolean).join(" · ")}</p>
                    {e.responsibilities && <p className="mt-1.5 whitespace-pre-line text-sm text-foreground/80">{e.responsibilities}</p>}
                    {e.achievements && <p className="mt-1 text-sm text-foreground/80"><span className="font-medium">Achievements:</span> {e.achievements}</p>}
                    {e.skills_used && <p className="mt-1 text-xs text-muted-foreground">Skills: {e.skills_used}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
          <section className="card-soft p-6">
            <h3 className="mb-3 text-lg font-bold">Education</h3>
            {d.form.education.length === 0 ? <p className="text-sm text-muted-foreground">None listed.</p> : (
              <ol className="space-y-4">
                {d.form.education.map((e, i) => (
                  <li key={i} className="border-l-2 border-primary/40 pl-4">
                    <p className="font-semibold">{[e.degree, e.field_of_study].filter(Boolean).join(", ") || e.level}</p>
                    <p className="text-xs text-muted-foreground">{[e.institution, [e.start_year, e.end_year].filter(Boolean).join("–"), e.status, e.grade ? `${e.grade} ${e.grade_type ?? ""}` : ""].filter(Boolean).join(" · ")}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}

      {tab === "Conversation" && (
        <div className="grid gap-6 lg:grid-cols-5">
          <section className="card-soft p-6 lg:col-span-3">
            <h3 className="mb-3 text-lg font-bold">Advisor chat ({d.chat.length})</h3>
            <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {d.chat.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
              {d.chat.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] whitespace-pre-wrap rounded-[20px] px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-grad text-white" : "bg-muted"}`}>
                    {m.content}
                    <span className={`mt-1 block text-[10px] ${m.role === "user" ? "text-white/70" : "text-muted-foreground"}`}>{when(m.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <div className="space-y-6 lg:col-span-2">
            <section className="card-soft p-6">
              <h3 className="mb-2 text-lg font-bold">Advisor memory</h3>
              <p className="whitespace-pre-line text-sm text-foreground/80">{d.summary || "Nothing summarised yet. It updates every 10 messages."}</p>
            </section>
            <section className="card-soft p-6">
              <h3 className="mb-2 text-lg font-bold">Quick fill notes</h3>
              {d.notes.length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : (
                <ul className="space-y-3">
                  {d.notes.slice(0, 10).map((n, i) => (
                    <li key={i} className="text-sm"><span className="text-xs font-semibold text-primary">{SECTION_LABEL[n.section as Section] ?? n.section} · {ago(n.created_at)}</span><p className="line-clamp-4 whitespace-pre-line text-foreground/80">{n.note}</p></li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      {tab === "Resume & note" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card-soft p-6">
            <h3 className="mb-3 text-lg font-bold">Resume</h3>
            {d.resume ? (
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-primary"><FileText className="size-5" /></span>
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{d.resume.name}</p><p className="text-xs text-muted-foreground">{d.resumeChars ? `${d.resumeChars.toLocaleString()} characters read` : "Text could not be read"}</p></div>
                {d.resume.url && <a href={d.resume.url} target="_blank" rel="noreferrer" className="rounded-full bg-[#1B1A19] px-4 py-2 text-sm font-semibold text-white">Open</a>}
              </div>
            ) : <p className="text-sm text-muted-foreground">No resume uploaded.</p>}
            <p className="mt-3 text-xs text-muted-foreground">The link is private and expires in an hour.</p>
          </section>
          <section className="card-soft p-6">
            <h3 className="mb-2 text-lg font-bold">Thank-you note</h3>
            {d.thankyou ? (
              <div className="space-y-2 text-sm">
                <p className="text-xs font-semibold text-primary">{d.thankyou.character} · {d.thankyou.series}</p>
                <p className="font-semibold">{d.thankyou.content.headline}</p>
                <p className="whitespace-pre-line text-foreground/80">{d.thankyou.content.message}</p>
              </div>
            ) : <p className="text-sm text-muted-foreground">Created after the candidate submits.</p>}
          </section>
        </div>
      )}

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Reset {d.name}&apos;s profile?</DialogTitle>
            <DialogDescription>This permanently deletes their answers, entries, resume, notes and conversation. They start again from a blank form. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" className="cta-soft" onClick={() => setConfirmReset(false)}><X /> Cancel</button>
            <button type="button" className="cta" style={{ background: "#C0392B", boxShadow: "0 10px 20px -12px rgba(192,57,43,.7)" }} disabled={!!busy} onClick={() => act("reset_profile")}>{busy === "reset_profile" && <Loader2 className="animate-spin" />} Yes, reset</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
