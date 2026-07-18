import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Lock, Eye, EyeOff, Download, Upload, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ToolHeader } from "@/components/security/ToolHeader";
import { PrivacyNote } from "@/components/security/PrivacyNote";
import { CopyButton } from "@/components/security/CopyButton";
import { encryptText, decryptText } from "@/lib/security-tools";
import { addRecent, trackEvent } from "@/lib/storage";

export const Route = createFileRoute("/text-encryption")({
  head: () => ({ meta: [{ title: "Text Encryption — Mbrojtja Digjitale" }] }),
  component: () => (
    <AppShell>
      <TextEncryption />
    </AppShell>
  ),
});

function TextEncryption() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    trackEvent("text_encryption_opened");
    addRecent("/text-encryption", "Text Encryption");
  }, []);

  async function encrypt() {
    setError("");
    if (!input) return setError("Enter some text to encrypt.");
    if (!password) return setError("Enter a master password.");
    try {
      const out = await encryptText(input, password);
      setOutput(out);
      setMode("encrypt");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function decrypt() {
    setError("");
    if (!input) return setError("Paste an encrypted payload to decrypt.");
    if (!password) return setError("Enter your master password.");
    try {
      const out = await decryptText(input, password);
      setOutput(out);
      setMode("decrypt");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function download() {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "encrypt" ? "encrypted.txt" : "decrypted.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setInput(String(reader.result ?? ""));
    reader.readAsText(f);
  }

  function clearAll() {
    setInput("");
    setOutput("");
    setPassword("");
    setError("");
  }

  return (
    <div className="space-y-6">
      <ToolHeader icon={Lock} title="Text Encryption" description="Encrypt and decrypt text with AES-256-GCM. Everything happens locally." />
      <PrivacyNote />

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          If you forget your master password, your encrypted data cannot be recovered.
        </AlertDescription>
      </Alert>

      <Card className="space-y-4 p-5">
        <div>
          <Label className="mb-2 block">Text</Label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type text to encrypt, or paste an encrypted payload to decrypt"
            rows={6}
            className="font-mono text-sm"
          />
        </div>

        <div>
          <Label className="mb-2 block">Master password</Label>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
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
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={encrypt}>Encrypt</Button>
          <Button variant="secondary" onClick={decrypt}>Decrypt</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Load .txt
          </Button>
          <Button variant="ghost" onClick={clearAll}>Clear all</Button>
          <input ref={fileRef} type="file" accept=".txt,text/plain" className="hidden" onChange={onFile} />
        </div>

        {output ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>{mode === "encrypt" ? "Encrypted output" : "Decrypted output"}</Label>
              <div className="flex gap-2">
                <CopyButton value={output} label="Copy" />
                <Button size="sm" variant="outline" onClick={download}>
                  <Download className="mr-1 h-4 w-4" /> Save
                </Button>
              </div>
            </div>
            <Textarea readOnly value={output} rows={5} className="font-mono text-xs" />
          </div>
        ) : null}
      </Card>
    </div>
  );
}