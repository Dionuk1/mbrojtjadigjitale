export function StrengthBar({ score, label }: { score: number; label: string }) {
  const color =
    score >= 85
      ? "bg-accent"
      : score >= 65
        ? "bg-primary"
        : score >= 45
          ? "bg-yellow-500"
          : score >= 25
            ? "bg-orange-500"
            : "bg-destructive";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>Strength</span>
        <span className="font-medium text-foreground">{label}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${color} transition-[width] duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}