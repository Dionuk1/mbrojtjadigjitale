import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, RefreshCw, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ToolHeader } from "@/components/security/ToolHeader";
import { PrivacyNote } from "@/components/security/PrivacyNote";
import { CopyButton } from "@/components/security/CopyButton";
import { StrengthBar } from "@/components/security/StrengthBar";
import { generatePassword, analyzePassword, estimateEntropy } from "@/lib/security-tools";
import { loadSettings } from "@/lib/settings";
import { addRecent, trackEvent } from "@/lib/storage";

export const Route = createFileRoute("/password-generator")({
  head: () => ({ meta: [{ title: "Password Generator — Security Toolkit" }] }),
  component: () => (
    <AppShell>
      <PasswordGenerator />
    </AppShell>
  ),
});

function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [excludeDuplicates, setExcludeDuplicates] = useState(false);
  const [easyToRead, setEasyToRead] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const s = loadSettings();
    setLength(s.defaultPasswordLength);
    trackEvent("password_generator_opened");
    addRecent("/password-generator", "Password Generator");
  }, []);

  const selectedTypes = [upper, lower, digits, symbols].filter(Boolean).length;
  const tooFewTypes = selectedTypes < 2;

  function generate() {
    const pw = generatePassword({
      length, upper, lower, digits, symbols,
      excludeAmbiguous, excludeDuplicates, easyToRead,
    });
    setPassword(pw);
    if (pw) trackEvent("password_generated");
  }

  const strength = password ? analyzePassword(password) : null;
  const entropy = password ? estimateEntropy(password) : 0;

  return (
    <div className="space-y-6">
      <ToolHeader icon={KeyRound} title="Password Generator" description="Generate cryptographically strong random passwords locally." />
      <PrivacyNote />

      <Card className="space-y-6 p-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Length</Label>
            <span className="text-sm font-medium">{length} characters</span>
          </div>
          <Slider value={[length]} min={8} max={128} step={1} onValueChange={(v) => setLength(v[0])} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleRow label="Uppercase (A-Z)" checked={upper} onChange={setUpper} />
          <ToggleRow label="Lowercase (a-z)" checked={lower} onChange={setLower} />
          <ToggleRow label="Numbers (0-9)" checked={digits} onChange={setDigits} />
          <ToggleRow label="Symbols (!@#…)" checked={symbols} onChange={setSymbols} />
          <ToggleRow label="Exclude ambiguous chars" checked={excludeAmbiguous} onChange={setExcludeAmbiguous} />
          <ToggleRow label="Avoid duplicate chars" checked={excludeDuplicates} onChange={setExcludeDuplicates} />
          <ToggleRow label="Easy to read" checked={easyToRead} onChange={setEasyToRead} />
        </div>

        {tooFewTypes ? (
          <Alert variant="destructive">
            <AlertDescription>Select at least two character types for stronger passwords.</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={generate}>Generate</Button>
          <Button variant="secondary" onClick={generate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
          <Button variant="ghost" onClick={() => setPassword("")}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>

        {password ? (
          <div className="space-y-3">
            <div className="flex items-stretch gap-2">
              <div className="min-w-0 flex-1 rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm break-all">
                {password}
              </div>
              <CopyButton value={password} label="Copy" />
            </div>
            {strength ? <StrengthBar score={strength.score} label={strength.label} /> : null}
            <p className="text-xs text-muted-foreground">
              Estimated entropy: <span className="font-medium text-foreground">{entropy} bits</span>
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}