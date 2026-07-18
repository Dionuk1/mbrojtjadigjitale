import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ListChecks, Download, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ToolHeader } from "@/components/security/ToolHeader";
import { KEYS, readJSON, writeJSON, trackEvent } from "@/lib/storage";

const ITEMS = [
  "I use a unique password for every important account",
  "I use passwords or passphrases with at least 16 characters",
  "I use a trusted password manager",
  "I have enabled two-factor authentication",
  "I have saved my recovery codes securely",
  "My phone and computer use a screen lock",
  "My operating system is updated",
  "My browser is updated",
  "My important files are backed up",
  "I review active login sessions",
  "I do not reuse old passwords",
  "I avoid opening suspicious links and attachments",
  "I verify website domains before entering passwords",
  "I use device encryption",
  "I have updated my account recovery email and phone number",
];

export const Route = createFileRoute("/security-checklist")({
  head: () => ({ meta: [{ title: "Security Checklist — Mbrojtja Digjitale" }] }),
  component: () => (
    <AppShell>
      <SecurityChecklist />
    </AppShell>
  ),
});

function SecurityChecklist() {
  const [state, setState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setState(readJSON(KEYS.checklist, {}));
  }, []);

  function toggle(item: string) {
    setState((prev) => {
      const next = { ...prev, [item]: !prev[item] };
      writeJSON(KEYS.checklist, next);
      const done = Object.values(next).filter(Boolean).length;
      if (done === ITEMS.length) trackEvent("checklist_completed");
      return next;
    });
  }

  function reset() {
    setState({});
    writeJSON(KEYS.checklist, {});
  }

  function exportTxt() {
    const lines = ITEMS.map((i) => `${state[i] ? "[x]" : "[ ]"} ${i}`).join("\n");
    const blob = new Blob([`Security Checklist\n\n${lines}\n`], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "security-checklist.txt";
    a.click();
  }

  const done = ITEMS.filter((i) => state[i]).length;
  const pct = Math.round((done / ITEMS.length) * 100);
  const level =
    pct >= 90 ? "Strong" : pct >= 70 ? "Good" : pct >= 40 ? "Basic" : "Needs Improvement";

  const unchecked = ITEMS.filter((i) => !state[i]);

  return (
    <div className="space-y-6">
      <ToolHeader icon={ListChecks} title="Security Checklist" description="Track your personal security posture. Progress is saved only in this browser." />

      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-bold">{done} / {ITEMS.length}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Security level</div>
            <div className="text-2xl font-bold text-primary">{level}</div>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      <Card className="p-5">
        <ul className="space-y-3">
          {ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <Checkbox
                id={item}
                checked={!!state[item]}
                onCheckedChange={() => toggle(item)}
                className="mt-0.5"
              />
              <label htmlFor={item} className="cursor-pointer text-sm">
                {item}
              </label>
            </li>
          ))}
        </ul>
      </Card>

      {unchecked.length > 0 && unchecked.length < ITEMS.length ? (
        <Card className="p-5">
          <div className="mb-2 text-sm font-medium">Focus areas</div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {unchecked.slice(0, 5).map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={exportTxt}>
          <Download className="mr-2 h-4 w-4" /> Export as text
        </Button>
        <Button variant="ghost" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
      </div>
    </div>
  );
}