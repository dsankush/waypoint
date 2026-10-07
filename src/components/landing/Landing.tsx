"use client";

import { useState } from "react";
import { ChevronRight, ShieldCheck, UserCog } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { Wordmark } from "@/components/Logo";
import { ADMIN, USERS } from "@/lib/users";
import { PasswordDialog } from "./PasswordDialog";

const TINTS = ["from-[#FFB27A] to-[#F4701E]", "from-[#8FD3B6] to-[#2E9E75]", "from-[#9DBBFF] to-[#4A74E0]"];

export function Landing() {
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  return (
    <AppShell>
      <div className="app-scroll safe-top">
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-6 pb-12 pt-10 lg:px-14">
          <div className="fade-up flex items-center justify-between">
            <span className="flex items-center gap-3">
              <Wordmark size={42} />
            </span>
            <span className="rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-muted-foreground shadow-sm">Private portal</span>
          </div>

          <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-2 lg:gap-24 lg:py-16">
            <section>
              <h1 className="fade-up font-serif text-[2rem] lg:text-[3.2rem]" style={{ animationDelay: "60ms" }}>
                Let&apos;s chart your<br />next move
              </h1>
              <p className="fade-up mt-4 hidden max-w-md text-base text-muted-foreground lg:block" style={{ animationDelay: "100ms" }}>
                Share your background once. We keep it safe, tidy and ready for the right opportunity.
              </p>
              <div className="fade-up relative mt-6 overflow-hidden rounded-[28px] border border-white p-5 lg:mt-10 lg:max-w-lg lg:p-8" style={{ background: "var(--peach)", animationDelay: "120ms" }}>
                <div className="max-w-[55%]">
                  <h2 className="font-serif text-lg lg:text-xl">Your story, ready for the right role</h2>
                  <p className="mt-1.5 text-[13px] leading-snug text-foreground/60 lg:text-sm">A friendly guide helps you fill it in, step by step.</p>
                </div>
                <Mascot className="float absolute -right-1 top-3 w-[44%] lg:w-[40%]" />
                <div className="h-8 lg:h-12" />
              </div>
            </section>

            <section className="lg:mx-auto lg:w-full lg:max-w-md">
              <p className="fade-up mb-4 text-base font-bold" style={{ animationDelay: "180ms" }}>Who is this?</p>
              <div className="space-y-4">
                {USERS.map((u, i) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelected({ id: u.id, name: u.name })}
                    className="fade-up card-soft group flex w-full items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[.98]"
                    style={{ animationDelay: `${220 + i * 70}ms` }}
                  >
                    <span className={`flex size-12 items-center justify-center rounded-full bg-gradient-to-br ${TINTS[i]} text-xl font-bold text-white shadow-md`}>
                      {u.name[0]}
                    </span>
                    <span className="flex-1">
                      <span className="block text-base font-bold">{u.name}</span>
                      <span className="text-xs text-muted-foreground">Tap to continue</span>
                    </span>
                    <span className="flex size-9 items-center justify-center rounded-full bg-accent text-primary">
                      <ChevronRight className="size-5" />
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelected({ id: ADMIN.id, name: ADMIN.name })}
                  className="fade-up flex w-full items-center gap-3 rounded-3xl border border-dashed border-input px-4 py-3.5 text-left text-sm font-medium text-foreground/70 transition hover:bg-white"
                  style={{ animationDelay: "440ms" }}
                >
                  <UserCog className="size-5" /> Admin sign in
                </button>
              </div>
              <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" strokeWidth={1.75} /> Private and password protected
              </p>
            </section>
          </div>
        </div>
      </div>
      <PasswordDialog user={selected} onClose={() => setSelected(null)} />
    </AppShell>
  );
}
