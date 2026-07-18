import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyRound, ShieldCheck, FileText, FileDigit, Lock, ListChecks, Search, Trash2, Lightbulb,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PrivacyNote } from "@/components/security/PrivacyNote";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import { DAILY_TIPS } from "@/lib/tips";

const TOOLS = [
  { to: "/password-generator", label: "Password Generator", icon: KeyRound, desc: "Create strong random passwords" },
  { to: "/strength-checker", label: "Strength Checker", icon: ShieldCheck, desc: "Analyze password strength locally" },
  { to: "/passphrase-generator", label: "Passphrase Generator", icon: FileText, desc: "Memorable multi-word passphrases" },
  { to: "/file-hash-checker", label: "File Hash Checker", icon: FileDigit, desc: "Verify file integrity with SHA-256" },
  { to: "/text-encryption", label: "Text Encryption", icon: Lock, desc: "AES-GCM encrypt and decrypt text" },
  { to: "/security-checklist", label: "Security Checklist", icon: ListChecks, desc: "Track your personal security" },
];

export const Route = createFileRoute("/")({
  component: () => (
    <AppShell>
      <Dashboard />
    </AppShell>
  ),
});

function Dashboard() {
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<{ path: string; name: string; at: number }[]>([]);
  const [checklistPct, setChecklistPct] = useState(0);

  useEffect(() => {
    setRecent(readJSON(KEYS.recent, []));
    const cl = readJSON<Record<string, boolean>>(KEYS.checklist, {});
    const total = 15;
    const done = Object.values(cl).filter(Boolean).length;
    setChecklistPct(Math.round((done / total) * 100));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return TOOLS;
    return TOOLS.filter((t) => t.label.toLowerCase().includes(s) || t.desc.toLowerCase().includes(s));
  }, [q]);

  const tip = useMemo(() => {
    const day = Math.floor(Date.now() / 86400000);
    return DAILY_TIPS[day % DAILY_TIPS.length];
  }, []);

  function clearRecent() {
    writeJSON(KEYS.recent, []);
    setRecent([]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Mbrojtja Digjitale</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A lightweight set of personal cybersecurity tools. Everything runs locally in your browser — no account, no upload, no tracking.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tools…"
          className="pl-9"
        />
      </div>

      <PrivacyNote />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <Link key={t.to} to={t.to}>
            <Card className="group h-full p-4 transition-colors hover:border-primary/40 hover:bg-accent/5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <t.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium">{t.label}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{t.desc}</div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-accent" />
            Daily security tip
          </div>
          <p className="text-sm text-muted-foreground">{tip}</p>
        </Card>

        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              Security checklist
            </span>
            <span className="text-muted-foreground">{checklistPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${checklistPct}%` }} />
          </div>
          <div className="mt-3">
            <Link to="/security-checklist" className="text-sm text-primary hover:underline">
              Continue checklist →
            </Link>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Recently used tools</div>
          {recent.length > 0 ? (
            <Button type="button" variant="ghost" size="sm" onClick={clearRecent}>
              <Trash2 className="mr-1 h-4 w-4" />
              Clear
            </Button>
          ) : null}
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing yet. Recently opened tools will appear here (stored only in this browser).
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((r) => (
              <li key={r.path} className="py-2 text-sm">
                <Link to={r.path} className="text-primary hover:underline">
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
