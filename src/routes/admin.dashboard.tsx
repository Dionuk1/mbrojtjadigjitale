import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LogOut, ShieldHalf } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { adminLogout, isAdmin } from "@/lib/admin-auth";
import { KEYS, readJSON, writeJSON, type AnalyticsEvent } from "@/lib/storage";
import { DEFAULT_DAILY_TIPS } from "@/lib/tips";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Security Toolkit" }, { name: "robots", content: "noindex" }] }),
  component: AdminDashboard,
});

type EventBucket = { count: number; history: string[] };

const EVENTS: { key: AnalyticsEvent; label: string }[] = [
  { key: "password_generator_opened", label: "Password generator opened" },
  { key: "password_generated", label: "Passwords generated" },
  { key: "strength_checker_opened", label: "Strength checker opened" },
  { key: "passphrase_generated", label: "Passphrases generated" },
  { key: "file_hash_generated", label: "File hashes generated" },
  { key: "text_encryption_opened", label: "Text encryption opened" },
  { key: "checklist_completed", label: "Checklists completed" },
];

const TOOL_KEYS = [
  "password-generator",
  "strength-checker",
  "passphrase-generator",
  "file-hash-checker",
  "text-encryption",
  "security-checklist",
  "security-tips",
] as const;

function AdminDashboard() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<Record<string, EventBucket>>({});
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [tips, setTips] = useState<string>(DEFAULT_DAILY_TIPS.join("\n"));
  const [weak, setWeak] = useState<string>("");

  useEffect(() => {
    if (!isAdmin()) {
      navigate({ to: "/admin/login", search: { redirect: "/admin/dashboard" } });
      return;
    }
    setReady(true);
    setData(readJSON(KEYS.analytics, {}));
    setEnabled(readJSON(KEYS.toolsEnabled, Object.fromEntries(TOOL_KEYS.map((k) => [k, true]))));
    const customTips = readJSON<string[] | null>(KEYS.tips, null);
    if (customTips) setTips(customTips.join("\n"));
    const w = readJSON<string[]>(KEYS.weakPatterns, []);
    setWeak(w.join("\n"));
  }, [navigate]);

  const totals = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    return EVENTS.map((e) => {
      const b = data[e.key] ?? { count: 0, history: [] };
      const daily = b.history.filter((t) => now - new Date(t).getTime() < day).length;
      const weekly = b.history.filter((t) => now - new Date(t).getTime() < 7 * day).length;
      return { ...e, total: b.count, daily, weekly };
    });
  }, [data]);

  const mostUsed = totals.slice().sort((a, b) => b.total - a.total)[0];

  function logout() {
    adminLogout();
    navigate({ to: "/admin/login" });
  }

  function toggleTool(k: string, v: boolean) {
    const next = { ...enabled, [k]: v };
    setEnabled(next);
    writeJSON(KEYS.toolsEnabled, next);
  }

  function saveTips() {
    const arr = tips.split("\n").map((s) => s.trim()).filter(Boolean);
    writeJSON(KEYS.tips, arr);
  }
  function saveWeak() {
    const arr = weak.split("\n").map((s) => s.trim()).filter(Boolean);
    writeJSON(KEYS.weakPatterns, arr);
  }

  if (!ready) return null;

  const feedback = readJSON<{ at: number; text: string }[]>(KEYS.feedback, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <ShieldHalf className="h-5 w-5 text-primary" />
          <span className="font-semibold">Admin · Security Toolkit</span>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin dashboard</h1>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Most used tool</div>
          <div className="mt-1 text-lg font-semibold">
            {mostUsed && mostUsed.total > 0 ? mostUsed.label : "No usage yet"}
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {totals.map((e) => (
            <Card key={e.key} className="p-4">
              <div className="text-xs text-muted-foreground">{e.label}</div>
              <div className="mt-1 text-2xl font-bold">{e.total}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {e.daily} today · {e.weekly} this week
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-5">
          <div className="mb-3 text-sm font-medium">Enable or disable tools</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {TOOL_KEYS.map((k) => (
              <label key={k} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span className="capitalize">{k.replace(/-/g, " ")}</span>
                <Switch checked={enabled[k] ?? true} onCheckedChange={(v) => toggleTool(k, v)} />
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Preference stored locally for this admin browser.</p>
        </Card>

        <Card className="space-y-3 p-5">
          <div className="text-sm font-medium">Daily security tips</div>
          <Textarea value={tips} onChange={(e) => setTips(e.target.value)} rows={6} className="text-sm" />
          <Button size="sm" onClick={saveTips}>Save tips</Button>
        </Card>

        <Card className="space-y-3 p-5">
          <Label className="text-sm font-medium">Common weak password patterns</Label>
          <p className="text-xs text-muted-foreground">
            One pattern per line. Used by the strength checker to flag known weak inputs.
          </p>
          <Textarea value={weak} onChange={(e) => setWeak(e.target.value)} rows={5} className="text-sm font-mono" />
          <Button size="sm" onClick={saveWeak}>Save patterns</Button>
        </Card>

        <Card className="p-5">
          <div className="mb-2 text-sm font-medium">Anonymous feedback</div>
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {feedback.map((f, i) => (
                <li key={i} className="rounded-md border border-border p-2">
                  <div className="text-xs text-muted-foreground">{new Date(f.at).toLocaleString()}</div>
                  <div>{f.text}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}