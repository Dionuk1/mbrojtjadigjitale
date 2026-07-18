import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  KeyRound,
  ShieldCheck,
  FileText,
  FileDigit,
  Lock,
  ListChecks,
  Lightbulb,
  Settings as SettingsIcon,
  UserCog,
  Menu,
  X,
  ShieldHalf,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { applyTheme, loadSettings } from "@/lib/settings";

const NAV = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/password-generator", label: "Password Generator", icon: KeyRound },
  { to: "/strength-checker", label: "Strength Checker", icon: ShieldCheck },
  { to: "/passphrase-generator", label: "Passphrase Generator", icon: FileText },
  { to: "/file-hash-checker", label: "File Hash Checker", icon: FileDigit },
  { to: "/text-encryption", label: "Text Encryption", icon: Lock },
  { to: "/security-checklist", label: "Security Checklist", icon: ListChecks },
  { to: "/security-tips", label: "Security Tips", icon: Lightbulb },
] as const;

const SECONDARY = [
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/admin/login", label: "Admin Login", icon: UserCog },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const s = loadSettings();
    applyTheme(s.theme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme(loadSettings().theme);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar - desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <SidebarInner isActive={isActive} onClose={() => setOpen(false)} />
      </aside>

      {/* Sidebar - mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarInner isActive={isActive} onClose={() => setOpen(false)} showClose />
        </aside>
      </div>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <ShieldHalf className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">Security Toolkit</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarInner({
  isActive,
  onClose,
  showClose,
}: {
  isActive: (to: string) => boolean;
  onClose: () => void;
  showClose?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2">
          <ShieldHalf className="h-5 w-5 text-primary" />
          <span className="font-semibold">Security Toolkit</span>
        </div>
        {showClose ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        ) : null}
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {NAV.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} Icon={item.icon} active={isActive(item.to)} />
          ))}
        </ul>
        <div className="my-3 h-px bg-sidebar-border" />
        <ul className="space-y-1">
          {SECONDARY.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} Icon={item.icon} active={isActive(item.to)} />
          ))}
        </ul>
      </nav>
      <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/70">
        Local-first. No account needed.
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  Icon,
  active,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}