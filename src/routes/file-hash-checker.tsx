import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FileDigit, Upload, X, Check, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolHeader } from "@/components/security/ToolHeader";
import { PrivacyNote } from "@/components/security/PrivacyNote";
import { CopyButton } from "@/components/security/CopyButton";
import { hashFile, md5File } from "@/lib/security-tools";
import { addRecent, trackEvent } from "@/lib/storage";

export const Route = createFileRoute("/file-hash-checker")({
  head: () => ({ meta: [{ title: "File Hash Checker — Mbrojtja Digjitale" }] }),
  component: () => (
    <AppShell>
      <FileHashChecker />
    </AppShell>
  ),
});

function FileHashChecker() {
  const [file, setFile] = useState<File | null>(null);
  const [sha256, setSha256] = useState("");
  const [sha512, setSha512] = useState("");
  const [md5, setMd5] = useState("");
  const [expected, setExpected] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [computeMd5, setComputeMd5] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    addRecent("/file-hash-checker", "File Hash Checker");
  }, []);

  async function process(f: File) {
    setFile(f);
    setSha256("");
    setSha512("");
    setMd5("");
    setProgress(0);
    setBusy(true);
    try {
      const s256 = await hashFile(f, "SHA-256", setProgress);
      setSha256(s256);
      const s512 = await hashFile(f, "SHA-512");
      setSha512(s512);
      if (computeMd5) {
        const m = await md5File(f);
        setMd5(m);
      }
      trackEvent("file_hash_generated");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) void process(f);
  }

  function clear() {
    setFile(null);
    setSha256("");
    setSha512("");
    setMd5("");
    setExpected("");
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  const match =
    expected.trim() && (sha256 || sha512 || md5)
      ? [sha256, sha512, md5].some((h) => h && h.toLowerCase() === expected.trim().toLowerCase())
      : null;

  return (
    <div className="space-y-6">
      <ToolHeader icon={FileDigit} title="File Hash Checker" description="Verify a file's integrity by comparing its hash. The file never leaves your browser." />
      <PrivacyNote />

      <Card
        className="p-5"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Drag and drop a file, or</p>
          <div className="mt-3">
            <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
              Choose file
            </Button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void process(f);
              }}
            />
          </div>
          <label className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={computeMd5} onChange={(e) => setComputeMd5(e.target.checked)} />
            Also compute MD5 (legacy comparison only — not secure)
          </label>
        </div>

        {file ? (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown"}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={clear}>
                <X className="mr-1 h-4 w-4" /> Clear
              </Button>
            </div>

            {busy ? (
              <div>
                <div className="mb-1 text-xs text-muted-foreground">Hashing… {progress}%</div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : null}

            <HashRow label="SHA-256" value={sha256} />
            <HashRow label="SHA-512" value={sha512} />
            {computeMd5 ? (
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  MD5 is not cryptographically secure. Use for legacy comparison only.
                </div>
                <HashRow label="MD5" value={md5} />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Compare with expected hash</Label>
              <Input
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                placeholder="Paste expected hash here"
                className="font-mono text-xs"
              />
              {match !== null ? (
                <div
                  className={
                    "flex items-center gap-2 rounded-md border p-2 text-sm " +
                    (match
                      ? "border-accent/40 bg-accent/10 text-accent-foreground"
                      : "border-destructive/40 bg-destructive/10 text-destructive")
                  }
                >
                  {match ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  {match ? "Hashes Match" : "Hashes Do Not Match"}
                </div>
              ) : null}
              <p className="text-xs text-muted-foreground">
                A matching hash helps verify integrity but does not automatically prove that a file is safe.
              </p>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex items-stretch gap-2">
        <div className="min-w-0 flex-1 rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs break-all">
          {value || "—"}
        </div>
        <CopyButton value={value} />
      </div>
    </div>
  );
}