"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronLeft, MessageSquare } from "lucide-react";
import type { FormState } from "@/lib/schema";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK = [
  "I am looking at backend roles",
  "I prefer remote or hybrid",
  "Help me with my expected CTC",
  "I can join in 30 days",
];

export function AdvisorPanel({
  userName, getForm, onFields, open, onClose,
}: {
  userName: string;
  getForm: () => FormState;
  onFields: (d: Record<string, unknown>) => void;
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/chat/history")
      .then((r) => r.json())
      .then((j) => setMessages(j.messages ?? []))
      .catch(() => setMessages([{ role: "assistant", content: `Hello ${userName}, I am your Career Advisor. Which kinds of roles interest you most?` }]))
      .finally(() => setLoading(false));
  }, [userName]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [text]);

  async function send(raw?: string) {
    const message = (raw ?? text).trim();
    if (!message || busy) return;
    setText("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "" }]);
    const patchLast = (fn: (c: string) => string) =>
      setMessages((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: fn(x.content) } : x)));
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, profile: getForm() }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        patchLast(() => j.error ?? "Sorry, I could not reply just now. Please try again.");
      } else {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            try {
              const ev = JSON.parse(line);
              if (ev.type === "token") patchLast((c) => c + ev.text);
              else if (ev.type === "fields") onFields(ev.data);
              else if (ev.type === "error") patchLast((c) => c || ev.message);
            } catch { /* partial line */ }
          }
        }
      }
    } catch {
      patchLast((c) => c || "Sorry, I could not reply just now. Please try again.");
    }
    setBusy(false);
  }

  const onlyGreeting = messages.length <= 1;

  return (
    <section
      aria-label="Career Advisor"
      aria-hidden={!open}
      className={`absolute inset-0 z-40 flex-col bg-background xl:static xl:inset-auto xl:z-auto xl:w-[390px] xl:shrink-0 xl:border-l xl:border-border xl:bg-white/50 ${open ? "sheet-up flex xl:animate-none" : "hidden"}`}
    >
      <div className="safe-top shrink-0 px-6 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <button
            type="button" onClick={onClose} aria-label="Close advisor"
            className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm transition active:scale-95"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex-1 text-center">
            <h2 className="font-serif text-lg leading-tight">Career Advisor</h2>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-[#34C38F]" /> Online
            </p>
          </div>
          <span className="flex size-11 items-center justify-center rounded-full bg-grad text-white shadow-sm">
            <MessageSquare className="size-5" strokeWidth={1.75} />
          </span>
        </div>
      </div>

      <div className="app-scroll space-y-5 px-6 py-6" role="log" aria-live="polite">
        {loading && <p className="text-center text-sm text-muted-foreground">Loading…</p>}
        {messages.map((m, i) => {
          const last = i === messages.length - 1;
          return (
            <div key={i} className={`fade-up flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-grad text-white"><MessageSquare className="size-4" /></span>
              )}
              <div
                className={`max-w-[85%] whitespace-pre-wrap px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${m.role === "user"
                  ? "bg-grad rounded-[22px] rounded-br-md text-white"
                  : "rounded-[22px] rounded-bl-md bg-white"}`}
              >
                {m.content || (busy && last ? <span className="typing text-muted-foreground" aria-label="Typing"><span /><span /><span /></span> : "")}
              </div>
            </div>
          );
        })}
        {onlyGreeting && !busy && !loading && (
          <div className="flex flex-wrap gap-3 pt-2">
            {QUICK.map((q) => (
              <button
                key={q} type="button" onClick={() => void send(q)}
                className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-foreground/80 shadow-sm transition active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); void send(); }}
        className="safe-bottom shrink-0 px-6 pb-6 pt-3"
      >
        <div className="flex items-end gap-2 rounded-full bg-white p-1.5 pl-5 shadow-md focus-within:ring-3 focus-within:ring-primary/25">
          <textarea
            ref={areaRef}
            value={text}
            rows={1}
            maxLength={2000}
            placeholder="Ask anything…"
            aria-label="Message"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
            }}
            className="max-h-[120px] min-h-10 flex-1 resize-none bg-transparent py-2 text-base outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit" disabled={busy || !text.trim()} aria-label="Send"
            className="bg-grad flex size-11 shrink-0 items-center justify-center rounded-full text-white transition active:scale-90 disabled:opacity-40"
          >
            <ArrowUp className="size-5" />
          </button>
        </div>
      </form>
    </section>
  );
}
