"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Compass, Handshake, LogOut, PenLine, Sunrise } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { clearWelcomeFlags, requestSignOut } from "@/lib/client-auth";
import { initialsOf } from "@/lib/characters";

type Data = {
  character: { id: string; name: string; series: string; accent: string };
  content: { headline: string; message: string; wishes: string[]; signoff: string };
  submittedAt: string | null;
};

const WISH_ICONS = [Compass, Handshake, Sunrise];

export function ThankYou() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/thankyou")
      .then(async (r) => {
        if (r.status === 409) { router.replace("/profile"); return; }
        if (r.status === 401) { router.replace("/"); return; }
        const j = await r.json();
        if (!r.ok) throw new Error();
        setData(j);
      })
      .catch(() => setError("We could not load this page. Please refresh."));
  }, [router]);

  async function signOut() {
    if (!(await requestSignOut())) {
      toast.error("Could not sign out. Please check your connection and try again.");
      return;
    }
    clearWelcomeFlags();
    router.replace("/");
    router.refresh();
  }

  if (error) return <AppShell><p role="alert" className="m-auto p-8 text-center text-destructive">{error}</p></AppShell>;
  if (!data) return <AppShell><p className="m-auto p-8 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;

  const { character: c, content } = data;
  const when = data.submittedAt
    ? new Date(data.submittedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "";
  const d = (i: number) => ({ animationDelay: `${i * 170}ms` });

  return (
    <AppShell>
      <div className="app-scroll">
       <div className="mx-auto w-full max-w-xl lg:my-8 lg:overflow-hidden lg:rounded-[36px] lg:shadow-2xl lg:ring-1 lg:ring-black/5">
        <section
          className="safe-top relative overflow-hidden px-6 pb-16 pt-8 text-white"
          style={{ background: `linear-gradient(160deg, ${c.accent} 0%, ${c.accent}cc 55%, #1B1A19 135%)` }}
        >
          <div className="float absolute -right-12 -top-12 size-48 rounded-full bg-white/10" />
          <div className="absolute -left-10 bottom-0 size-36 rounded-full bg-white/10" />
          <div className="fade-up relative flex items-center gap-2 text-sm text-white/90" style={d(0)}>
            <CheckCircle2 className="size-5" strokeWidth={1.75} />
            <span className="font-medium">Profile submitted</span>
            {when && <span className="text-white/65">· {when}</span>}
          </div>
          <div className="relative mt-8 flex flex-col items-center text-center">
            <div className="pop relative" style={d(1)}>
              <span className="absolute inset-0 -m-3 rounded-full border border-white/30" />
              <span className="absolute inset-0 -m-6 rounded-full border border-white/15" />
              <div className="flex size-28 items-center justify-center rounded-full bg-white font-serif text-4xl shadow-2xl" style={{ color: c.accent }} aria-hidden>
                {initialsOf(c.name)}
              </div>
            </div>
            <p className="fade-up mt-9 text-xs font-semibold uppercase tracking-[0.2em] text-white/70" style={d(2)}>Your guide for this journey</p>
            <h1 className="fade-up mt-2 font-serif text-[2.2rem] leading-tight tracking-tight" style={d(3)}>{c.name}</h1>
            <p className="fade-up text-sm text-white/75" style={d(3)}>{c.series}</p>
          </div>
        </section>

        <section className="-mt-8 rounded-t-[32px] bg-background px-7 pb-14 pt-10">
          <h2 className="fade-up font-serif text-[1.7rem] leading-tight tracking-tight" style={d(4)}>{content.headline}</h2>
          <p className="fade-up mt-3 whitespace-pre-line text-[15.5px] leading-relaxed text-foreground/85" style={d(5)}>{content.message}</p>

          <ul className="mt-9 space-y-4">
            {content.wishes.map((w, i) => {
              const Icon = WISH_ICONS[i] ?? Compass;
              return (
                <li key={i} className="fade-up card-soft flex items-center gap-5 p-5" style={d(6 + i)}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: c.accent }}>
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="text-[15px] leading-snug">{w}</span>
                </li>
              );
            })}
          </ul>

          <p className="fade-up mt-8 text-center font-serif text-xl italic" style={d(9)}>{content.signoff}</p>
          <p className="fade-up mt-5 text-center text-sm text-muted-foreground" style={d(10)}>
            Your profile is saved. You can reopen and update it any time.
          </p>
          <div className="fade-up mt-6 space-y-3" style={d(11)}>
            <Link href="/profile" className="cta w-full"><PenLine /> Edit my profile</Link>
            <button type="button" onClick={signOut} className="cta-soft w-full"><LogOut className="size-[18px]" /> Sign out</button>
          </div>
        </section>
       </div>
      </div>
    </AppShell>
  );
}
