"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EntryCard({
  title, collapsed, onToggle, onUp, onDown, onDuplicate, onDelete, hasError, children,
}: {
  title: string; collapsed: boolean; onToggle: () => void;
  onUp?: () => void; onDown?: () => void; onDuplicate: () => void; onDelete: () => void;
  hasError?: boolean; children: React.ReactNode;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <Card className={`card-soft gap-0 rounded-[28px] py-0 shadow-none ${hasError ? "border-destructive/50" : ""}`}>
      <div className="flex items-center gap-1 px-5 py-3.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
        >
          <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${collapsed ? "-rotate-90" : ""}`} />
          <span className="truncate font-serif text-base">{title}</span>
        </button>
        <Button variant="ghost" size="icon-sm" onClick={onUp} disabled={!onUp} aria-label="Move up"><ChevronUp /></Button>
        <Button variant="ghost" size="icon-sm" onClick={onDown} disabled={!onDown} aria-label="Move down"><ChevronDown /></Button>
        <Button variant="ghost" size="icon-sm" onClick={onDuplicate} aria-label="Duplicate"><Copy /></Button>
        {confirm ? (
          <>
            <Button variant="destructive" size="sm" onClick={() => { setConfirm(false); onDelete(); }}>Delete</Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>Keep</Button>
          </>
        ) : (
          <Button variant="ghost" size="icon-sm" onClick={() => setConfirm(true)} aria-label="Delete entry">
            <Trash2 />
          </Button>
        )}
      </div>
      {!collapsed && <CardContent className="grid gap-x-6 gap-y-6 border-t border-border px-6 py-7 lg:grid-cols-2">{children}</CardContent>}
    </Card>
  );
}

/** Shared list helpers for repeatable entries. */
export function moveItem<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}
