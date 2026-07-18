import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Lightbulb, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToolHeader } from "@/components/security/ToolHeader";

const TIPS: { category: string; items: string[] }[] = [
  {
    category: "Password Security",
    items: [
      "Use a unique password for each account.",
      "Prefer passwords or passphrases with at least 16 characters.",
      "Use a trusted password manager to store credentials.",
      "Never reuse compromised or old passwords.",
      "Never store important passwords in plain text.",
    ],
  },
  {
    category: "Two-Factor Authentication",
    items: [
      "Enable two-factor authentication on important accounts.",
      "Prefer authenticator apps or hardware security keys when available.",
      "Save recovery codes in a secure location.",
      "Never share one-time authentication codes with anyone.",
    ],
  },
  {
    category: "Phishing Protection",
    items: [
      "Verify the real domain before entering your password.",
      "Avoid opening unexpected attachments and links.",
      "Be skeptical of urgent messages asking for credentials.",
      "Type important URLs directly instead of clicking links.",
    ],
  },
  {
    category: "Device Security",
    items: [
      "Lock your phone and computer with a strong screen lock.",
      "Keep your operating system and applications updated.",
      "Enable device encryption where available.",
      "Install apps only from official stores.",
    ],
  },
  {
    category: "Browser Security",
    items: [
      "Keep your browser updated.",
      "Review installed extensions and remove ones you don't use.",
      "Avoid saving passwords in the browser if a password manager is available.",
    ],
  },
  {
    category: "Wi-Fi Security",
    items: [
      "Avoid entering credentials on public, untrusted Wi-Fi.",
      "Use a reputable VPN on unknown networks.",
      "Use WPA2 or WPA3 on your home router with a strong password.",
    ],
  },
  {
    category: "Backup Security",
    items: [
      "Back up important files regularly.",
      "Keep at least one backup offline or offsite.",
      "Test that you can restore from backups periodically.",
    ],
  },
  {
    category: "Social Media Privacy",
    items: [
      "Review privacy settings on each platform.",
      "Limit sharing of personal information that could answer security questions.",
    ],
  },
  {
    category: "File Download Safety",
    items: [
      "Download software only from trusted official sources.",
      "Verify file hashes when they are published by the vendor.",
    ],
  },
  {
    category: "Account Recovery",
    items: [
      "Keep your recovery email and phone number up to date.",
      "Review active login sessions regularly.",
      "Remove old devices and unused connected apps.",
    ],
  },
];

export const Route = createFileRoute("/security-tips")({
  head: () => ({ meta: [{ title: "Security Tips — Security Toolkit" }] }),
  component: () => (
    <AppShell>
      <SecurityTips />
    </AppShell>
  ),
});

function SecurityTips() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return TIPS.map((g) => ({
      ...g,
      items: g.items.filter((it) => !s || it.toLowerCase().includes(s)),
    })).filter((g) => (!cat || g.category === cat) && g.items.length > 0);
  }, [q, cat]);

  return (
    <div className="space-y-6">
      <ToolHeader icon={Lightbulb} title="Security Tips" description="Short, practical advice to improve your everyday security." />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tips…" className="pl-9" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          onClick={() => setCat(null)}
          variant={cat === null ? "default" : "secondary"}
          className="cursor-pointer"
        >
          All
        </Badge>
        {TIPS.map((g) => (
          <Badge
            key={g.category}
            onClick={() => setCat(g.category)}
            variant={cat === g.category ? "default" : "secondary"}
            className="cursor-pointer"
          >
            {g.category}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((g) => (
          <Card key={g.category} className="p-4">
            <div className="mb-2 font-medium">{g.category}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {g.items.map((it) => (
                <li key={it} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}