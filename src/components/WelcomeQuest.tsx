"use client";

import { useEffect, useMemo } from "react";
import { Flame, Lock, Swords, Trophy } from "lucide-react";
import { initialsOf } from "@/lib/characters";

export type WelcomeData = {
  firstName: string;
  streak: number;
  guide: {
    character: { id: string; name: string; series: string; accent: string };
    line: string; headline: string; updated: boolean;
  } | null;
};

const RANKS = ["Newcomer", "Explorer", "Builder", "Climber", "Challenger", "Pro", "Elite", "Legend"];
const COLORS = ["#F4701E", "#FFB020", "#3B82F6", "#34C38F", "#EA4C3A", "#B06AF0", "#FFFFFF"];

export function WelcomeQuest({
  data, percent, stepsDone, nextLabel, onClose,
}: { data: WelcomeData; percent: number; stepsDone: number; nextLabel: string | null; onClose: () => void }) {
  const g = data.guide;
  const accent = g?.character.accent ?? "#3A3631";
  const level = Math.min(stepsDone + 1, 8);
  const rank = RANKS[Math.min(stepsDone, RANKS.length - 1)];

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const pieces = useMemo(
    () => Array.from({ length: 34 }, (_, i) => ({
      x: `${(i * 29 + 7) % 100}%`, dx: `${((i * 37) % 120) - 60}px`, rot: `${(i * 83) % 720 - 360}deg`,
      c: COLORS[i % COLORS.length], d: `${(i % 9) * 90}ms`, t: `${1900 + (i % 7) * 260}ms`,
    })),
    [],
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Welcome">
      <div className="fade-up relative w-full max-w-sm overflow-hidden rounded-[32px] bg-white shadow-2xl">
        <div
          className="relative overflow-hidden px-7 pb-12 pt-9 text-center text-white"
          style={{ background: `linear-gradient(160deg, ${accent} 0%, ${accent}d9 55%, #1B1A19 150%)` }}
        >
          <div className="confetti pointer-events-none absolute inset-x-0 top-0 h-full" aria-hidden>
            {pieces.map((p, i) => (
              <i key={i} style={{ ["--x" as string]: p.x, ["--dx" as string]: p.dx, ["--rot" as string]: p.rot, ["--c" as string]: p.c, ["--d" as string]: p.d, ["--t" as string]: p.t }} />
            ))}
          </div>

          <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur">
            <Swords className="size-3.5" /> {g ? (g.updated ? "New guide unlocked" : "Quest continues") : "Quest begins"}
          </span>

          <div className="relative mx-auto mt-6 flex size-28 items-center justify-center">
            <span className="ring-pulse absolute inset-0 rounded-full border-2 border-white/60" />
            <span className="ring-pulse absolute inset-0 rounded-full border-2 border-white/40" style={{ animationDelay: "900ms" }} />
            <div className="badge-in relative flex size-28 items-center justify-center rounded-full bg-white font-bold shadow-2xl" style={{ color: accent }}>
              {g ? <span className="text-4xl">{initialsOf(g.character.name)}</span> : <Lock className="size-10" />}
            </div>
          </div>

          <h2 className="relative mt-5 text-[1.7rem] font-bold leading-tight tracking-tight">Welcome back, {data.firstName}!</h2>
          <p className="relative mt-1 text-sm text-white/80">
            {g ? <>Your guide <strong className="text-white">{g.character.name}</strong> · {g.character.series}</> : "Your guide appears once you share your goals"}
          </p>
        </div>

        <div className="-mt-5 rounded-t-[28px] bg-white px-6 pb-7 pt-8">
          <p className="text-center text-[15px] leading-relaxed text-foreground/80">
            {g ? g.line : "Tell us the roles you want or add your experience. We will match you with a character who fits your journey."}
          </p>

          <div className="mt-6 rounded-3xl bg-muted/60 p-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-bold"><Trophy className="size-4 text-primary" /> Level {level} · {rank}</span>
              <span className="tabular-nums text-muted-foreground">{percent} XP</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white">
              <div className="hatch xp-fill h-full rounded-full" style={{ width: `${Math.max(percent, 4)}%` }} />
            </div>
            {nextLabel && <p className="mt-2 text-xs text-muted-foreground">Next checkpoint: {nextLabel}</p>}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 rounded-3xl bg-accent px-4 py-3.5 text-sm font-semibold text-accent-foreground">
            <Flame className="flame size-5 text-primary" /> {data.streak <= 1 ? "Day 1 of your streak" : `${data.streak}-day streak`}
          </div>

          <button
            type="button" onClick={onClose} autoFocus
            className="cta shine relative mt-5 w-full overflow-hidden"
          >
            Let&apos;s go
          </button>
        </div>
      </div>
    </div>
  );
}
