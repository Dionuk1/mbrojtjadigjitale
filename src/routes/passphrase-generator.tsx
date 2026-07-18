import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, RefreshCw, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToolHeader } from "@/components/security/ToolHeader";
import { PrivacyNote } from "@/components/security/PrivacyNote";
import { CopyButton } from "@/components/security/CopyButton";
import { StrengthBar } from "@/components/security/StrengthBar";
import { generatePassphrase, analyzePassword } from "@/lib/security-tools";
import { loadSettings } from "@/lib/settings";
import { addRecent, trackEvent } from "@/lib/storage";

export const Route = createFileRoute("/passphrase-generator")({
  head: () => ({ meta: [{ title: "Passphrase Generator — Security Toolkit" }] }),
  component: () => (
    <AppShell>
      <PassphraseGenerator />
    </AppShell>
  ),
});

function PassphraseGenerator() {
  const [words, setWords] = useState(4);
  const [separator, setSeparator] = useState("-");
  const [capitalize, setCapitalize] = useState(true);
  const [addNumber, setAddNumber] = useState(true);
  const [addSymbol, setAddSymbol] = useState(true);
  const [numberPosition, setNumberPosition] = useState<"start" | "end">("end");
  const [phrase, setPhrase] = useState("");

  useEffect(() => {
    setWords(loadSettings().defaultPassphraseWords);
    addRecent("/passphrase-generator", "Passphrase Generator");
  }, []);

  function generate() {
    const p = generatePassphrase({ words, separator, capitalize, addNumber, addSymbol, numberPosition });
    setPhrase(p);
    if (p) trackEvent("passphrase_generated");
  }

  const strength = phrase ? analyzePassword(phrase) : null;

  return (
    <div className="space-y-6">
      <ToolHeader icon={FileText} title="Passphrase Generator" description="Long, memorable passphrases can be both secure and easy to remember." />
      <PrivacyNote />

      <Card className="space-y-5 p-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Words</Label>
            <span className="text-sm font-medium">{words}</span>
          </div>
          <Slider value={[words]} min={3} max={8} step={1} onValueChange={(v) => setWords(v[0])} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block">Separator</Label>
            <Select value={separator} onValueChange={setSeparator}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-">Hyphen (-)</SelectItem>
                <SelectItem value="_">Underscore (_)</SelectItem>
                <SelectItem value=".">Dot (.)</SelectItem>
                <SelectItem value=" ">Space</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Number position</Label>
            <Select value={numberPosition} onValueChange={(v) => setNumberPosition(v as "start" | "end")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="start">Beginning</SelectItem>
                <SelectItem value="end">End</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ToggleRow label="Capitalize" checked={capitalize} onChange={setCapitalize} />
          <ToggleRow label="Add number" checked={addNumber} onChange={setAddNumber} />
          <ToggleRow label="Add symbol" checked={addSymbol} onChange={setAddSymbol} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={generate}>Generate</Button>
          <Button variant="secondary" onClick={generate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
          <Button variant="ghost" onClick={() => setPhrase("")}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>

        {phrase ? (
          <div className="space-y-3">
            <div className="flex items-stretch gap-2">
              <div className="min-w-0 flex-1 rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm break-all">
                {phrase}
              </div>
              <CopyButton value={phrase} label="Copy" />
            </div>
            {strength ? <StrengthBar score={strength.score} label={strength.label} /> : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Example: River-Laptop-Mango-92!</p>
        )}
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