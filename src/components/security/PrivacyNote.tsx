import { ShieldCheck } from "lucide-react";

export function PrivacyNote({ className }: { className?: string }) {
  return (
    <div
      className={
        "flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-foreground " +
        (className ?? "")
      }
    >
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <p>
        Your sensitive data is processed locally in your browser and is never stored or transmitted.
      </p>
    </div>
  );
}