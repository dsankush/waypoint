import { Lock } from "lucide-react";

export function NameCard({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-[10px] border border-border bg-card p-4 text-left shadow-[0_1px_2px_rgba(27,27,31,0.04)] transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(27,27,31,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-lg text-primary-foreground">
        {name[0]}
      </span>
      <span className="flex-1 font-serif text-xl">{name}</span>
      <Lock className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
