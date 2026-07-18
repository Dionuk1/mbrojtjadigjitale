import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Eye, EyeOff, Check, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToolHeader } from "@/components/security/ToolHeader";
import { PrivacyNote } from "@/components/security/PrivacyNote";
import { StrengthBar } from "@/components/security/StrengthBar";
import { analyzePassword } from "@/lib/security-tools";
import { addRecent, trackEvent } from "@/lib/storage";

export const Route = createFileRoute("/strength-checker")({
  head: () => ({ meta: [{ title: "Password Strength Checker — Security Toolkit" }] }),
  component: () => (
    <AppShell>
      <StrengthChecker />
    </AppShell>
  ),
});

function StrengthChecker() {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    trackEvent("strength_checker_opened");
    addRecent("/strength-checker", "Strength Checker");
  }, []);

  const result = analyzePassword(pw);

  return (
    <div className="space-y-6">
      <ToolHeader icon={ShieldCheck} title="Password Strength Checker" description="Analyze your password locally. Nothing is transmitted." />
      <PrivacyNote />

      <Card className="space-y-4 p-5">
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Type a password to analyze"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {pw ? (
          <>
            <StrengthBar score={result.score} label={result.label} />
            <div className="grid gap-2 sm:grid-cols-2">
              {result.checks.map((c) => (
                <div key={c.key} className="flex items-center gap-2 text-sm">
                  {c.pass ? (
                    <Check className="h-4 w-4 text-accent" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={c.pass ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                </div>
              ))}
            </div>

            {result.issues.length > 0 ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                <div className="mb-1 font-medium text-destructive">Issues detected</div>
                <ul className="list-disc space-y-1 pl-5">
                  {result.issues.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.suggestions.length > 0 ? (
              <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                <div className="mb-1 font-medium">Suggestions</div>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {result.suggestions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div className="rounded-md border border-border p-3">
                <div className="text-xs text-muted-foreground">Estimated entropy</div>
                <div className="mt-1 font-medium">{result.entropy} bits</div>
              </div>
              <div className="rounded-md border border-border p-3">
                <div className="text-xs text-muted-foreground">Approx. offline crack time</div>
                <div className="mt-1 font-medium">{result.crackTime}</div>
                <div className="mt-1 text-xs text-muted-foreground">Rough estimate only.</div>
              </div>
            </div>

            <Button variant="ghost" onClick={() => setPw("")}>Clear</Button>
          </>
        ) : null}
      </Card>
    </div>
  );
}