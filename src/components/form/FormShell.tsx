"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Briefcase, Check, Home, PanelLeftClose, PanelLeftOpen, ChevronRight, GraduationCap, IndianRupee, Link2, ListChecks, LogOut,
  MessageSquare, Save, Target, User, Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { REQUIRED_TOP } from "@/lib/completion";
import { clearWelcomeFlags, requestSignOut } from "@/lib/client-auth";
import { useCollapsed } from "@/lib/use-collapsed";
import { applyFields } from "@/lib/merge";
import {
  EMPTY_FORM, SECTIONS, SECTION_LABEL, sectionOfError, validateFull,
  type FormState, type Section,
} from "@/lib/schema";
import { AdvisorPanel } from "../advisor/AdvisorPanel";
import { AppShell } from "../AppShell";
import { Mascot } from "../Mascot";
import { Wordmark } from "../Logo";
import { WelcomeQuest, type WelcomeData } from "../WelcomeQuest";
import { Ctx, type FormCtx } from "./form-context";
import { ReviewSubmit } from "./ReviewSubmit";
import { SectionCompensation } from "./SectionCompensation";
import { SectionEducation } from "./SectionEducation";
import { SectionExperience } from "./SectionExperience";
import { SectionLinks } from "./SectionLinks";
import { SectionPersonal } from "./SectionPersonal";
import { SectionPreferences } from "./SectionPreferences";
import { SectionSkills } from "./SectionSkills";

const ICONS: Record<Section, React.ReactNode> = {
  personal: <User />, education: <GraduationCap />, experience: <Briefcase />,
  skills: <Wrench />, preferences: <Target />, compensation: <IndianRupee />,
  links: <Link2 />, review: <ListChecks />,
};

const n = (v: unknown) => {
  const x = parseFloat(String(v ?? ""));
  return Number.isFinite(x) ? x : 0;
};

function ago(ts: number | null, now: number) {
  if (!ts) return "";
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s} sec ago`;
  const m = Math.round(s / 60);
  return m === 1 ? "1 min ago" : `${m} min ago`;
}

type Resume = { name: string; url: string | null } | null;

export function FormShell({ user }: { user: { id: string; name: string } }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [resume, setResume] = useState<Resume>(null);
  const [step, setStep] = useState<Section>("personal");
  const [attempted, setAttempted] = useState<Set<Section>>(new Set());
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [view, setView] = useState<"home" | "step">("home");
  const [sideCollapsed, toggleSide] = useCollapsed("cp-side-collapsed");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [welcome, setWelcome] = useState<WelcomeData | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const welcomeKey = `cp-welcome-${user.id}`;

  // Once per sign-in: fetch the guide (kept in step with the profile) and show the welcome pop-up.
  useEffect(() => {
    let seen = false;
    try { seen = !!sessionStorage.getItem(welcomeKey); } catch { /* ignore */ }
    if (seen) return;
    let cancel = false;
    fetch("/api/welcome").then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (!cancel && j) { setWelcome(j as WelcomeData); setShowWelcome(true); }
    }).catch(() => {});
    return () => { cancel = true; };
  }, [welcomeKey]);

  const closeWelcome = useCallback(() => {
    setShowWelcome(false);
    try { sessionStorage.setItem(welcomeKey, "1"); } catch { /* ignore */ }
  }, [welcomeKey]);

  useEffect(() => {
    if (window.matchMedia("(min-width: 1280px)").matches) setAdvisorOpen(true);
  }, []);

  const formRef = useRef(form);
  formRef.current = form;
  const dirty = useRef(false);
  const inflight = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ----- load ----- */
  useEffect(() => {
    let cancel = false;
    fetch("/api/profile")
      .then(async (r) => {
        if (r.status === 401) { router.replace("/"); return; }
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        const data = j.data as FormState;
        data.education = (data.education ?? []).map((e) => ({ ...e, _k: crypto.randomUUID() }) as never);
        data.experience = (data.experience ?? []).map((e) => ({ ...e, _k: crypto.randomUUID() }) as never);
        if (!cancel) {
          setForm(data);
          setResume(j.resume ?? null);
          if (j.updatedAt) setSavedAt(new Date(j.updatedAt).getTime());
          setLoaded(true);
        }
      })
      .catch(() => !cancel && setLoadError("We could not load your profile. Please refresh the page."));
    return () => { cancel = true; };
  }, [router]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  /* ----- save ----- */
  const save = useCallback(async (): Promise<boolean> => {
    if (inflight.current) await inflight.current.catch(() => false);
    if (!dirty.current) return true;
    dirty.current = false;
    setSaving(true);
    const p = (async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: formRef.current, submit: false }),
        });
        if (!res.ok) throw new Error();
        setSavedAt(Date.now());
        setSaveError(false);
        return true;
      } catch {
        dirty.current = true;
        setSaveError(true);
        return false;
      } finally {
        setSaving(false);
        inflight.current = null;
      }
    })();
    inflight.current = p;
    return p;
  }, []);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    return save();
  }, [save]);

  const markDirty = useCallback(() => {
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void save(); }, 1500);
  }, [save]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty.current) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  /* ----- form helpers ----- */
  const set = useCallback((patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }));
    markDirty();
  }, [markDirty]);

  const touch = useCallback((name: string) => {
    setTouched((t) => (t.has(name) ? t : new Set(t).add(name)));
  }, []);

  const flash = useCallback((names: string[]) => {
    setHighlight((h) => new Set([...h, ...names]));
    setTimeout(() => {
      setHighlight((h) => {
        const nx = new Set(h);
        names.forEach((x) => nx.delete(x));
        return nx;
      });
    }, 2600);
  }, []);

  const goTo = useCallback((s: Section) => {
    setStep(s);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const onAdvisorFields = useCallback((data: Record<string, unknown>) => {
    const r = applyFields(formRef.current, data, { replace: true });
    let next = r.form;
    const changed = [...r.changed];
    if (!next.current_ctc_total && (next.current_ctc_fixed || next.current_ctc_variable)) {
      next = { ...next, current_ctc_total: String(Math.round((n(next.current_ctc_fixed) + n(next.current_ctc_variable)) * 100) / 100) };
      changed.push("current_ctc_total");
    }
    if (!changed.length) return;
    setForm(next);
    markDirty();
    flash(changed);
    toast.success("Added to your form");
  }, [flash, markDirty]);

  const errors = useMemo(() => validateFull(form), [form]);

  const errorSections = useMemo(() => {
    const s = new Set<Section>();
    Object.keys(errors).forEach((k) => s.add(sectionOfError(k)));
    return s;
  }, [errors]);

  const percent = useMemo(() => {
    const bad = new Set(Object.keys(errors).map((k) => k.split(".")[0]));
    const left = REQUIRED_TOP.filter((r) => bad.has(r)).length;
    return Math.round(((REQUIRED_TOP.length - left) / REQUIRED_TOP.length) * 100);
  }, [errors]);

  const done = (s: Section) => {
    if (s === "review") return false;
    if (s === "experience") return (form.no_experience || (form.experience ?? []).length > 0) && !errorSections.has(s);
    if (s === "preferences" || s === "skills" || s === "personal" || s === "education" || s === "compensation" || s === "links")
      return !errorSections.has(s);
    return false;
  };

  const ctx: FormCtx = {
    form, set, errors, showAllErrors: attempted.has(step), touched, touch, highlight, goTo, flash,
    userId: user.id, resume, setResume,
  };

  async function signOut() {
    try { await flush(); } catch { /* unsaved changes are kept in the browser until the next save */ }
    if (!(await requestSignOut())) {
      toast.error("Could not sign out. Please check your connection and try again.");
      return;
    }
    clearWelcomeFlags();
    router.replace("/");
    router.refresh();
  }

  const idx = SECTIONS.indexOf(step);
  const goTab = (d: number) => goTo(SECTIONS[Math.min(SECTIONS.length - 1, Math.max(0, idx + d))]);
  const next = () => {
    setAttempted((a) => new Set(a).add(step));
    if (idx < SECTIONS.length - 1) goTo(SECTIONS[idx + 1]);
  };

  const body: Record<Section, React.ReactNode> = {
    personal: <SectionPersonal />,
    education: <SectionEducation />,
    experience: <SectionExperience />,
    skills: <SectionSkills />,
    preferences: <SectionPreferences />,
    compensation: <SectionCompensation />,
    links: <SectionLinks />,
    review: <ReviewSubmit flush={flush} />,
  };

  const statusText = saveError
    ? "Not saved. Retrying on your next edit"
    : saving ? "Saving…"
    : dirty.current ? "Unsaved changes"
    : savedAt ? `Saved ${ago(savedAt, now)}` : "";

  const pct = Math.max(0, Math.min(100, percent));
  const R = 52;
  const C = 2 * Math.PI * R;
  const stepsDone = SECTIONS.filter((s) => s !== "review" && done(s)).length;
  const resumeStep: Section = SECTIONS.find((s) => s !== "review" && !done(s)) ?? "review";
  const openStep = (s: Section) => { setView("step"); goTo(s); };

  const TopBtn = ({ children, onClick, label, primary }: { children: React.ReactNode; onClick: () => void; label: string; primary?: boolean }) => (
    <button
      type="button" onClick={onClick} aria-label={label}
      className={`flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm transition active:scale-95 ${primary ? "bg-grad text-white" : "bg-white text-foreground"}`}
    >
      {children}
    </button>
  );

  const menu = (
    <div className="flex h-11 min-w-0 items-center gap-2.5 rounded-full bg-white py-1 pl-1 pr-4 shadow-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-grad text-sm font-bold text-white">{user.name[0]}</span>
      <span className="truncate text-[15px] font-medium text-foreground/70">Hello, <span className="font-bold text-foreground">{user.name}</span></span>
    </div>
  );

  const stat = (value: string, label: string, Icon: React.ComponentType<{ className?: string }>) => (
    <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-accent text-primary"><Icon className="size-[18px]" /></span>
      <span className="text-base font-bold leading-none tabular-nums">{value}</span>
      <span className="text-[11px] leading-tight text-muted-foreground">{label}</span>
    </div>
  );

  const home = (
    <div className="px-6 pb-14 pt-5 lg:px-0 lg:pt-12">
      <div className="fade-up flex items-center justify-between lg:hidden">
        {menu}
        <div className="flex gap-2">
          <TopBtn primary label="Open Career Advisor" onClick={() => setAdvisorOpen(true)}><MessageSquare className="size-5" /></TopBtn>
          <TopBtn label="Save draft" onClick={() => void flush().then((ok) => ok && toast.success("Draft saved"))}><Save className="size-5" /></TopBtn>
          <TopBtn label="Sign out" onClick={() => void signOut()}><LogOut className="size-5 text-destructive" /></TopBtn>
        </div>
      </div>
      <p className="fade-up mt-1 pl-1 text-xs text-muted-foreground lg:hidden" aria-live="polite">{statusText}</p>

      <p className="fade-up hidden text-sm font-medium text-muted-foreground lg:block">Welcome back, {user.name}</p>
      <h1 className="fade-up mt-8 font-serif text-[1.9rem] lg:mt-1 lg:text-[2.6rem]" style={{ animationDelay: "50ms" }}>
        Let&apos;s chart your<br className="lg:hidden" /> next move
      </h1>

      <section className="fade-up relative mt-7 overflow-hidden rounded-[26px] border border-white p-6 lg:mt-9 lg:p-8" style={{ background: "var(--peach)", animationDelay: "100ms" }}>
        <div className="max-w-[56%]">
          <h2 className="font-serif text-lg lg:text-2xl">{stepsDone === 0 ? "Start your profile" : resumeStep === "review" ? "Ready to review" : "Pick up where you left off"}</h2>
          <p className="mt-1 text-[13px] leading-snug text-foreground/60 lg:text-[15px]">
            {resumeStep === "review" ? "Everything is in. Check it over and submit." : `Next up: ${SECTION_LABEL[resumeStep]}.`}
          </p>
          <button
            type="button" onClick={() => openStep(resumeStep)}
            className="cta cta-dark mt-5"
          >
            {stepsDone === 0 ? "Get started" : "Continue"}
          </button>
        </div>
        <Mascot className="float absolute -right-2 top-3 w-[38%] lg:right-8 lg:top-4 lg:w-[20%]" />
        <div className="h-8 lg:h-10" />
      </section>

      <h3 className="fade-up mb-4 mt-10 text-base font-bold" style={{ animationDelay: "150ms" }}>Quick actions</h3>
      <div className="fade-up no-scrollbar -mx-6 flex gap-3 overflow-x-auto px-6 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0" style={{ animationDelay: "170ms" }}>
        {SECTIONS.map((s) => (
          <button
            key={s} type="button" onClick={() => openStep(s)}
            className="flex shrink-0 items-center gap-2.5 rounded-full bg-white px-5 py-3 text-sm font-medium shadow-sm transition hover:shadow-md active:scale-95"
          >
            <span className="text-foreground/70 [&_svg]:size-4">{ICONS[s]}</span>
            {SECTION_LABEL[s]}
            {done(s) && <Check className="size-4 text-primary" />}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section className="fade-up card-soft flex items-center justify-between gap-4 p-6" style={{ animationDelay: "200ms" }}>
          <div className="min-w-0">
            <h3 className="text-base font-bold">Profile strength</h3>
            <p className="mt-2 text-sm font-semibold">{pct >= 100 ? "All set!" : pct >= 50 ? "Good progress!" : "Just getting started"}</p>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              {pct >= 100 ? "Every required detail is filled in." : `${stepsDone} of 7 steps are complete. Finish the rest to submit.`}
            </p>
          </div>
          <div className="relative size-28 shrink-0" role="img" aria-label={`${pct}% complete`}>
            <svg viewBox="0 0 120 120" className="size-28 -rotate-90">
              <circle cx="60" cy="60" r={R} fill="none" stroke="#F3EEE7" strokeWidth="9" />
              <circle cx="60" cy="60" r={R} fill="none" stroke="#F4701E" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C - (C * pct) / 100} style={{ transition: "stroke-dashoffset 700ms ease" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold tabular-nums">{pct}</span>
              <span className="text-[11px] text-muted-foreground">/100</span>
            </div>
          </div>
        </section>

        <section className="fade-up card-soft p-6" style={{ animationDelay: "250ms" }}>
          <h3 className="mb-5 text-base font-bold">At a glance</h3>
          <div className="flex gap-1">
            {stat(`${stepsDone}/7`, "Steps done", Check)}
            {stat(String((form.skills ?? []).length), "Skills added", Wrench)}
            {stat(String((form.experience ?? []).length), "Roles listed", Briefcase)}
            {stat(resume ? "Yes" : "No", "Resume", Link2)}
          </div>
        </section>
      </div>

      <button
        type="button" onClick={() => setAdvisorOpen(true)}
        className="fade-up card-soft mt-6 flex w-full items-center gap-4 p-5 text-left transition hover:shadow-lg active:scale-[.98]" style={{ animationDelay: "280ms" }}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-grad text-white"><MessageSquare className="size-5" /></span>
        <span className="flex-1">
          <span className="block font-bold">Talk to your Career Advisor</span>
          <span className="text-xs text-muted-foreground">Sort out your preferences and expected pay in a quick chat</span>
        </span>
        <ChevronRight className="size-5 text-muted-foreground" />
      </button>
    </div>
  );

  const stepView = (
    <div className="px-6 pb-14 pt-5 lg:px-0 lg:pt-12">
      <div className="mb-6 flex items-center justify-between lg:hidden">
        <TopBtn label="Back to home" onClick={() => { setView("home"); scrollRef.current?.scrollTo({ top: 0 }); }}><ArrowLeft className="size-5" /></TopBtn>
        <span className="text-base font-bold">{SECTION_LABEL[step]}</span>
        <div className="flex gap-2">
          <TopBtn label="Save draft" onClick={() => void flush().then((ok) => ok && toast.success("Draft saved"))}><Save className="size-5" /></TopBtn>
          <TopBtn label="Sign out" onClick={() => void signOut()}><LogOut className="size-5 text-destructive" /></TopBtn>
        </div>
      </div>

      <section className="card-soft p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Your progress</span>
          <span className="text-muted-foreground">{pct}% completed</span>
        </div>
        <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="hatch absolute inset-y-0 left-0 rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 4)}%` }} />
        </div>
        <p className="mt-2.5 text-xs text-muted-foreground" aria-live="polite">
          Step {idx + 1} of {SECTIONS.length}{statusText ? ` · ${statusText}` : ""}
        </p>
      </section>

      <div className="no-scrollbar -mx-6 mt-6 flex gap-2.5 overflow-x-auto px-6 pb-1 lg:hidden" role="tablist" aria-label="Steps">
        {SECTIONS.map((s) => (
          <button
            key={s} type="button" role="tab" aria-selected={s === step} onClick={() => goTo(s)}
            ref={(el) => { if (el && s === step) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); }}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition active:scale-95 ${s === step ? "bg-[#1B1A19] text-white" : "bg-white text-foreground/70 shadow-sm"}`}
          >
            {done(s) ? <Check className={`size-4 ${s === step ? "text-white" : "text-primary"}`} /> : <span className="[&_svg]:size-4">{ICONS[s]}</span>}
            {SECTION_LABEL[s]}
          </button>
        ))}
      </div>

      <div key={step} className="fade-up mt-10">{body[step]}</div>
    </div>
  );

  return (
    <Ctx.Provider value={ctx}>
      <AppShell>
        <aside
          className={`side-scroll hidden min-h-0 shrink-0 flex-col overflow-y-auto border-r border-border bg-white/60 py-7 transition-[width,padding] duration-300 lg:flex [&>*]:shrink-0 ${sideCollapsed ? "w-[84px] px-3.5" : "w-[272px] px-5"}`}
          aria-label="Sidebar"
        >
          <div className={`mb-8 flex items-center ${sideCollapsed ? "flex-col gap-4" : "justify-between"}`}>
            <div className="flex items-center gap-3">
              <Wordmark size={40} hideText={sideCollapsed} />
            </div>
            <button
              type="button" onClick={toggleSide}
              aria-label={sideCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sideCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="flex size-9 items-center justify-center rounded-full text-foreground/60 transition hover:bg-white hover:text-foreground"
            >
              {sideCollapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
            </button>
          </div>

          {(() => {
            const item = (opts: { key: string; active: boolean; icon: React.ReactNode; label: string; done?: boolean; onClick: () => void }) => (
              <button
                key={opts.key} type="button" onClick={opts.onClick} title={sideCollapsed ? opts.label : undefined}
                aria-label={opts.label} aria-current={opts.active ? "page" : undefined}
                className={`relative flex w-full items-center rounded-xl text-sm font-medium transition ${sideCollapsed ? "h-11 justify-center" : "gap-3 px-3.5 py-2.5"} ${opts.active ? "bg-[#1B1A19] text-white" : "text-foreground/70 hover:bg-white"}`}
              >
                <span className="[&_svg]:size-[18px]">{opts.icon}</span>
                {!sideCollapsed && <span className="flex-1 text-left">{opts.label}</span>}
                {opts.done && (sideCollapsed
                  ? <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
                  : <Check className={`size-4 ${opts.active ? "text-white" : "text-primary"}`} aria-label="Complete" />)}
              </button>
            );
            return (
              <>
                {item({ key: "home", active: view === "home", icon: <Home />, label: "Overview", onClick: () => { setView("home"); scrollRef.current?.scrollTo({ top: 0 }); } })}
                {!sideCollapsed
                  ? <p className="mb-2 mt-7 px-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your profile</p>
                  : <div className="mx-auto my-4 h-px w-6 bg-border" />}
                <nav aria-label="Steps" className="space-y-1">
                  {SECTIONS.map((sec) => item({ key: sec, active: view === "step" && sec === step, icon: ICONS[sec], label: SECTION_LABEL[sec], done: done(sec), onClick: () => openStep(sec) }))}
                </nav>
              </>
            );
          })()}

          <div className="mt-auto space-y-3 pt-8">
            {sideCollapsed ? (
              <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-white text-[11px] font-bold tabular-nums shadow-sm" title={`${pct}% complete`}>{pct}%</div>
            ) : (
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex justify-between text-xs"><span className="font-semibold">Progress</span><span className="text-muted-foreground">{pct}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="hatch h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 3)}%` }} /></div>
                <p className="mt-2 text-[11px] text-muted-foreground" aria-live="polite">{statusText || "Saved as you go"}</p>
              </div>
            )}
            <div className={`flex items-center rounded-2xl bg-white shadow-sm ${sideCollapsed ? "flex-col gap-1 p-2" : "gap-2 p-2.5"}`}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-grad text-sm font-bold text-white" title={user.name}>{user.name[0]}</span>
              {!sideCollapsed && <span className="min-w-0 flex-1 truncate text-sm font-semibold">{user.name}</span>}
              <button type="button" aria-label="Save draft" title="Save draft" onClick={() => void flush().then((ok) => ok && toast.success("Draft saved"))} className="flex size-9 items-center justify-center rounded-full hover:bg-muted"><Save className="size-4" /></button>
              <button type="button" aria-label="Sign out" title="Sign out" onClick={() => void signOut()} className="flex size-9 items-center justify-center rounded-full text-destructive hover:bg-muted"><LogOut className="size-4" /></button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="app-scroll safe-top">
         <div className="mx-auto w-full max-w-xl lg:max-w-3xl">
          {!loaded ? (
            <div className="space-y-4 p-5">
              {loadError ? <p role="alert" className="text-destructive">{loadError}</p> : (
                <>
                  <Skeleton className="h-11 w-48 rounded-full" /><Skeleton className="h-16 w-3/4 rounded-2xl" />
                  <Skeleton className="h-40 w-full rounded-[28px]" /><Skeleton className="h-32 w-full rounded-3xl" />
                </>
              )}
            </div>
          ) : view === "home" ? home : stepView}
         </div>
        </div>

        {loaded && (
          <footer className="safe-bottom relative z-20 shrink-0 bg-gradient-to-t from-background via-background/95 to-transparent px-6 pb-5 pt-4">
            <div className="mx-auto flex w-full max-w-xl items-center gap-2.5 lg:max-w-3xl lg:justify-between">
              {view === "step" && (
                <button
                  type="button" aria-label="Back" disabled={idx === 0}
                  onClick={() => goTab(-1)}
                  className="icon-btn lg:w-auto lg:gap-2 lg:bg-transparent lg:px-4 lg:text-sm lg:font-medium lg:text-foreground/70 lg:shadow-none lg:hover:bg-white"
                >
                  <ArrowLeft className="size-[18px]" /><span className="hidden lg:inline">Back</span>
                </button>
              )}
              <div className={`flex flex-1 items-center gap-2.5 lg:flex-none ${view === "home" ? "lg:ml-auto" : ""}`}>
                {view === "step" && (
                  <button type="button" aria-label="Open Career Advisor" title="Career Advisor" onClick={() => setAdvisorOpen(true)} className="icon-btn relative text-primary">
                    <MessageSquare className="size-[18px]" />
                    <span className="absolute right-3 top-3 size-1.5 rounded-full bg-primary" />
                  </button>
                )}
                {view === "home" ? (
                  <button type="button" onClick={() => openStep(resumeStep)} className="cta flex-1 lg:flex-none lg:px-7">
                    {stepsDone === 0 ? "Start my profile" : resumeStep === "review" ? "Review & submit" : "Continue my profile"} <ArrowRight />
                  </button>
                ) : step !== "review" ? (
                  <button type="button" onClick={next} className="cta flex-1 lg:flex-none lg:px-8">Continue <ArrowRight /></button>
                ) : (
                  <button type="button" onClick={() => window.dispatchEvent(new Event("cp:submit"))} className="cta flex-1 lg:flex-none lg:px-8">Submit profile <Check /></button>
                )}
              </div>
            </div>
          </footer>
        )}
        </div>

        {showWelcome && welcome && loaded && (
          <WelcomeQuest
            data={welcome}
            percent={pct}
            stepsDone={stepsDone}
            nextLabel={resumeStep === "review" ? "Review & submit" : SECTION_LABEL[resumeStep]}
            onClose={closeWelcome}
          />
        )}

        <AdvisorPanel
          userName={user.name}
          getForm={() => formRef.current}
          onFields={onAdvisorFields}
          open={advisorOpen}
          onClose={() => setAdvisorOpen(false)}
        />
      </AppShell>
    </Ctx.Provider>
  );
}
