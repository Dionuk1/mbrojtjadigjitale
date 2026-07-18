import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Download, Upload, RotateCcw, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToolHeader } from "@/components/security/ToolHeader";
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings, type Theme, type AutoClear } from "@/lib/settings";
import { KEYS, writeJSON } from "@/lib/storage";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Security Toolkit" }] }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

function SettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setS(loadSettings());
  }, []);

  function update(patch: Partial<Settings>) {
    const next = { ...s, ...patch };
    setS(next);
    saveSettings(next);
  }

  function exportSettings() {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "security-toolkit-settings.json";
    a.click();
  }

  function importSettings(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(String(r.result));
        const merged = { ...DEFAULT_SETTINGS, ...parsed } as Settings;
        setS(merged);
        saveSettings(merged);
      } catch {
        // ignore
      }
    };
    r.readAsText(f);
  }

  function resetAll() {
    setS(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }

  return (
    <div className="space-y-6">
      <ToolHeader icon={SettingsIcon} title="Settings" description="Local preferences. Settings are stored only in this browser." />

      <Card className="space-y-4 p-5">
        <div className="text-sm font-medium">Appearance</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block">Theme</Label>
            <Select value={s.theme} onValueChange={(v) => update({ theme: v as Theme })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <span className="text-sm">Enable animations</span>
            <Switch checked={s.animations} onCheckedChange={(v) => update({ animations: v })} />
          </label>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="text-sm font-medium">Defaults</div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Default password length</Label>
            <span className="text-sm font-medium">{s.defaultPasswordLength}</span>
          </div>
          <Slider
            value={[s.defaultPasswordLength]}
            min={8}
            max={128}
            step={1}
            onValueChange={(v) => update({ defaultPasswordLength: v[0] })}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Default passphrase words</Label>
            <span className="text-sm font-medium">{s.defaultPassphraseWords}</span>
          </div>
          <Slider
            value={[s.defaultPassphraseWords]}
            min={3}
            max={8}
            step={1}
            onValueChange={(v) => update({ defaultPassphraseWords: v[0] })}
          />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="text-sm font-medium">Privacy</div>
        <div>
          <Label className="mb-2 block">Auto-clear sensitive fields</Label>
          <Select value={s.autoClear} onValueChange={(v) => update({ autoClear: v as AutoClear })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never</SelectItem>
              <SelectItem value="1min">After 1 minute</SelectItem>
              <SelectItem value="5min">After 5 minutes</SelectItem>
              <SelectItem value="10min">After 10 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <span className="text-sm">Show privacy reminders</span>
          <Switch checked={s.showPrivacyReminders} onCheckedChange={(v) => update({ showPrivacyReminders: v })} />
        </label>
      </Card>

      <Card className="space-y-3 p-5">
        <div className="text-sm font-medium">Data</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportSettings}>
            <Download className="mr-2 h-4 w-4" /> Export settings
          </Button>
          <label>
            <input type="file" accept="application/json" className="hidden" onChange={importSettings} />
            <Button asChild variant="secondary">
              <span>
                <Upload className="mr-2 h-4 w-4" /> Import settings
              </span>
            </Button>
          </label>
          <Button variant="ghost" onClick={() => writeJSON(KEYS.recent, [])}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear recent tools
          </Button>
          <Button variant="ghost" onClick={() => writeJSON(KEYS.checklist, {})}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear checklist
          </Button>
          <Button variant="destructive" onClick={resetAll}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset all settings
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Exported settings contain only preferences, never sensitive tool input.
        </p>
      </Card>
    </div>
  );
}