import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Globe, KeyRound, Loader2, ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, ExternalLink, Info, Trash2, RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ToolHeader } from "@/components/security/ToolHeader";
import { virusTotalRequest, type VtStats } from "@/lib/virustotal.functions";
import { clearVtKey, loadVtKey, maskKey, saveVtKey } from "@/lib/vt-key";
import { addRecent } from "@/lib/storage";

export const Route = createFileRoute("/website-scanner")({
  head: () => ({
    meta: [
      { title: "Website Security Scanner (VirusTotal) — Mbrojtja Digjitale" },
      { name: "description", content: "Check a website's security reputation with VirusTotal using your own API key." },
      { property: "og:title", content: "Website Security Scanner — Mbrojtja Digjitale" },
      { property: "og:description", content: "Check a website's reputation across dozens of security engines via VirusTotal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <WebsiteScanner />
    </AppShell>
  ),
});

type View =
  | { t: "idle" }
  | { t: "report"; stats: VtStats; date: number | null; id: string }
  | { t: "not_found" }
  | { t: "queued"; analysisId: string; status: string }
  | { t: "error"; message: string };

function normalizeUrl(raw: string) {
  const v = raw.trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

function WebsiteScanner() {
  const vt = useServerFn(virusTotalRequest);
  const [savedKey, setSavedKey] = useState("");
  const [remembered, setRemembered] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [remember, setRemember] = useState(false);
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<View>({ t: "idle" });
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const k = loadVtKey();
    setSavedKey(k.key);
    setRemembered(k.remembered);
    setRemember(k.remembered);
    addRecent("/website-scanner", "Website Scanner");
  }, []);

  function onSaveKey() {
    const k = keyInput.trim();
    if (k.length < 10) return;
    saveVtKey(k, remember);
    setSavedKey(k);
    setRemembered(remember);
    setKeyInput("");
    setEditing(false);
  }

  function onRemoveKey() {
    clearVtKey();
    setSavedKey("");
    setRemembered(false);
    setKeyInput("");
    setEditing(false);
    setView({ t: "idle" });
  }

  async function onScan() {
    const u = normalizeUrl(url);
    if (!u || !savedKey) return;
    setUrl(u);
    setBusy(true);
    try {
      const r = await vt({ data: { action: "report", apiKey: savedKey, url: u } });
      if (r.kind === "report") setView({ t: "report", stats: r.stats, date: r.lastAnalysisDate, id: r.id });
      else if (r.kind === "not_found") setView({ t: "not_found" });
      else if (r.kind === "error") setView({ t: "error", message: r.message });
    } catch {
      setView({ t: "error", message: "Please enter a valid website address, e.g. https://example.com" });
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit() {
    setConfirmOpen(false);
    setBusy(true);
    try {
      const r = await vt({ data: { action: "submit", apiKey: savedKey, url } });
      if (r.kind === "queued") setView({ t: "queued", analysisId: r.analysisId, status: "queued" });
      else if (r.kind === "error") setView({ t: "error", message: r.message });
    } finally {
      setBusy(false);
    }
  }

  async function onCheckAnalysis(analysisId: string) {
    setBusy(true);
    try {
      const r = await vt({ data: { action: "analysis", apiKey: savedKey, analysisId, url } });
      if (r.kind === "analysis") {
        if (r.status === "completed" && r.stats) setView({ t: "report", stats: r.stats, date: Math.floor(Date.now() / 1000), id: r.urlId });
        else setView({ t: "queued", analysisId, status: r.status });
      } else if (r.kind === "error") setView({ t: "error", message: r.message });
    } finally {
      setBusy(false);
    }
  }

  const showKeyForm = !savedKey || editing;

  return (
    <div className="space-y-6">
      <ToolHeader
        icon={Globe}
        title="Website Security Scanner – VirusTotal"
        description="Check whether security engines have flagged a website as malicious or suspicious."
      />

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">VirusTotal API Key</h2>
        </div>
        {showKeyForm ? (
          <div className="space-y-3">
            {!savedKey && (
              <p className="text-sm text-muted-foreground">
                To use this scanner, add your own free API key. Sign in at{" "}
                <a className="text-primary underline" href="https://www.virustotal.com/gui/my-apikey" target="_blank" rel="noreferrer">
                  virustotal.com
                </a>
                , open your profile → API key, and paste it here.
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="vtkey">API Key</Label>
              <Input id="vtkey" type="password" autoComplete="off" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="Paste your VirusTotal API key" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="remember" checked={remember} onCheckedChange={setRemember} />
              <Label htmlFor="remember" className="text-sm font-normal">Remember on this device</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {remember ? "Saved in this browser until you remove it." : "Kept only for this browser session and cleared when you close the tab."}
            </p>
            <div className="flex gap-2">
              <Button onClick={onSaveKey} disabled={keyInput.trim().length < 10}>Save API Key</Button>
              {editing && <Button variant="outline" onClick={() => { setEditing(false); setKeyInput(""); }}>Cancel</Button>}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-sm">{maskKey(savedKey)}</div>
              <div className="text-xs text-muted-foreground">{remembered ? "Remembered on this device" : "Stored for this session only"}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditing(true); setRemember(remembered); }}>
                <RefreshCw className="mr-1 h-4 w-4" /> Replace
              </Button>
              <Button variant="outline" size="sm" onClick={onRemoveKey}>
                <Trash2 className="mr-1 h-4 w-4" /> Remove
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <Label htmlFor="url">Website address</Label>
        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
          <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onScan()} placeholder="https://example.com" />
          <Button onClick={onScan} disabled={busy || !savedKey || !url.trim()}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Scan Website
          </Button>
        </div>
        {!savedKey && <p className="mt-2 text-xs text-muted-foreground">Add your API key above to start scanning.</p>}
      </Card>

      {busy && view.t === "idle" && (
        <Card className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking with VirusTotal…
        </Card>
      )}

      {view.t === "report" && <ReportCard stats={view.stats} date={view.date} id={view.id} />}

      {view.t === "not_found" && (
        <Card className="space-y-3 p-5">
          <StatusBadge status="none" />
          <p className="text-sm text-muted-foreground">
            VirusTotal has no existing report for this website. You can send it for a new analysis.
          </p>
          <Button variant="outline" onClick={() => setConfirmOpen(true)} disabled={busy}>Submit for analysis…</Button>
        </Card>
      )}

      {view.t === "queued" && (
        <Card className="space-y-3 p-5">
          <p className="text-sm">
            Analysis status: <span className="font-medium">{view.status}</span>. It usually takes under a minute. Check again when ready.
          </p>
          <Button variant="outline" onClick={() => onCheckAnalysis(view.analysisId)} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Check results
          </Button>
        </Card>
      )}

      {view.t === "error" && (
        <Card className="border-destructive/40 bg-destructive/10 p-5 text-sm">{view.message}</Card>
      )}

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          VirusTotal is an external service. Results show reputation reports from security vendors — they do not
          guarantee a website is completely safe and do not test for every technical vulnerability. Your API key is
          sent only to VirusTotal through a pass-through request and is never saved on our servers.
        </p>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this website to VirusTotal?</AlertDialogTitle>
            <AlertDialogDescription>
              The address <span className="break-all font-mono">{url}</span> will be sent to VirusTotal and may become
              part of its public dataset, visible to other users. Don't submit private or internal links.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onSubmit}>Yes, submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type Status = "clean" | "suspicious" | "malicious" | "none";

function StatusBadge({ status }: { status: Status }) {
  const map = {
    clean: { Icon: ShieldCheck, label: "Clean", cls: "bg-accent/15 text-accent border-accent/30", hint: "No security engine flagged this website." },
    suspicious: { Icon: ShieldAlert, label: "Suspicious", cls: "bg-warning/15 text-warning border-warning/30", hint: "Some engines consider this website suspicious. Be careful." },
    malicious: { Icon: ShieldX, label: "Malicious", cls: "bg-destructive/15 text-destructive border-destructive/30", hint: "Security engines flagged this website as dangerous. Avoid it." },
    none: { Icon: ShieldQuestion, label: "No report", cls: "bg-muted text-muted-foreground border-border", hint: "No previous analysis exists." },
  }[status];
  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${map.cls}`}>
      <map.Icon className="h-6 w-6 shrink-0" />
      <div>
        <div className="font-semibold">{map.label}</div>
        <div className="text-xs opacity-90">{map.hint}</div>
      </div>
    </div>
  );
}

function ReportCard({ stats, date, id }: { stats: VtStats; date: number | null; id: string }) {
  const total = stats.malicious + stats.suspicious + stats.harmless + stats.undetected + stats.timeout;
  const status: Status = stats.malicious > 0 ? "malicious" : stats.suspicious > 0 ? "suspicious" : total > 0 ? "clean" : "none";
  const items = [
    { label: "Malicious", value: stats.malicious, cls: "text-destructive" },
    { label: "Suspicious", value: stats.suspicious, cls: "text-warning" },
    { label: "Harmless", value: stats.harmless, cls: "text-accent" },
    { label: "Undetected", value: stats.undetected, cls: "text-muted-foreground" },
    { label: "Total engines", value: total, cls: "text-foreground" },
  ];
  return (
    <Card className="space-y-4 p-5">
      <StatusBadge status={status} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {items.map((i) => (
          <div key={i.label} className="rounded-lg border border-border p-3 text-center">
            <div className={`text-2xl font-bold ${i.cls}`}>{i.value}</div>
            <div className="text-xs text-muted-foreground">{i.label}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          Last analysis: {date ? new Date(date * 1000).toLocaleString() : "Unknown"}
        </span>
        <Button asChild variant="outline" size="sm">
          <a href={`https://www.virustotal.com/gui/url/${id}`} target="_blank" rel="noreferrer">
            View Full Report on VirusTotal <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </Button>
      </div>
    </Card>
  );
}
