import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({
  value,
  size = "sm",
  variant = "outline",
  label,
}: {
  value: string;
  size?: "sm" | "default" | "icon";
  variant?: "outline" | "secondary" | "default" | "ghost";
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <Button type="button" onClick={copy} size={size} variant={variant} disabled={!value}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {label ? <span className="ml-2">{copied ? "Copied" : label}</span> : null}
    </Button>
  );
}