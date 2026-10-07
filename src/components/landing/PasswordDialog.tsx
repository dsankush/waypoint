"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordDialog({
  user, onClose,
}: { user: { id: string; name: string } | null; onClose: () => void }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPassword(""); setError(""); setShow(false); setBusy(false);
  }, [user?.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !password) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: user.id, password }),
      });
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        router.push(j.role === "admin" ? "/admin" : "/profile");
        router.refresh();
        return;
      }
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Incorrect password");
    } catch {
      setError("Could not reach the server. Please try again.");
    }
    setBusy(false);
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Welcome, {user?.name}</DialogTitle>
          <DialogDescription>{user?.id === "admin" ? "Enter the admin password to open the dashboard." : "Enter your password to continue."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <div className="relative">
              <Input
                id="pw"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "pw-err" : undefined}
                className="h-12 rounded-xl pr-11 text-base"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {error && (
              <p id="pw-err" role="alert" className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <Button type="submit" disabled={busy || !password} className="h-12 w-full rounded-xl text-base">
            {busy ? "Checking…" : "Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
