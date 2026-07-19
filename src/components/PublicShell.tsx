import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home, KeyRound, ShieldCheck, FileText, FileDigit, Lock, ListChecks, Lightbulb,
  Settings as SettingsIcon, UserCog, Menu, X, ShieldHalf, QrCode, LifeBuoy,
  ChevronLeft, ChevronRight, GraduationCap, Wrench, UserCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { applyTheme, loadSettings } from "@/lib/settings";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const GROUPS: { title: string; icon: React.ComponentType<{ className?: string }>; items: Item[] }[] = [
  {
    title: "Tools",
    icon: Wrench,
    items: [
      { to: "/", label: "Dashboard", icon: Home },
      { to: "/password-generator", label: "Password Generator", icon: KeyRound },
      { to: "/strength-checker", label: "Strength Checker", icon: ShieldCheck },
      { to: "/passphrase-generator", label: "Passphrase Generator", icon: FileText },
      { to: "/file-hash-checker", label: "File Hash Checker", icon: FileDigit },
      { to: "/text-encryption", label: "Text Encryption", icon: Lock },
      { to: "/secure-qr-generator", label: "Secure QR Generator", icon: QrCode },
      { to: "/account-emergency", label: "Account Emergency", icon: LifeBuoy },
    ],
  },
  {
    title: "Learn",
    icon: GraduationCap,
    items: [
      { to: "/security-checklist", label: "Security Checklist", icon: ListChecks },
      { to: "/security-tips", label: "Security Tips", icon: Lightbulb },
    ],
  },
  {
    title: "Account",
    icon: UserCircle,
    items: [
      { to: "/settings", label: "Settings", icon: SettingsIcon },
      { to: "/admin/login", label: "Admin", icon: UserCog },
    ],
  },
];

const COLLAPSE_KEY = "md.sidebar.collapsed";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const s = loadSettings();
    applyTheme(s.theme);
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme(loadSettings().theme);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  }

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarInner
          isActive={isActive}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarInner
            isActive={isActive}
            collapsed={false}
            showClose
            onClose={() => setMobileOpen(false)}
          />
        </aside>
      </div>

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <ShieldHalf className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">Mbrojtja Digjitale</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl animate-fade-in px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
          Mbrojtja Digjitale · Local-first cybersecurity tools · No account required
        </footer>
      </div>
    </div>
  );
}

function SidebarInner({
  isActive,
  collapsed,
  showClose,
  onClose,
  onToggleCollapse,
}: {
  isActive: (to: string) => boolean;
  collapsed: boolean;
  showClose?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <ShieldHalf className="h-5 w-5 shrink-0 text-primary" />
          {!collapsed && <span className="truncate font-semibold">Mbrojtja Digjitale</span>}
        </div>
        {showClose ? (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        ) : onToggleCollapse ? (
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} aria-label="Toggle sidebar">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        ) : null}
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {GROUPS.map((g) => (
          <div key={g.title} className="mb-3">
            {!collapsed && (
              <div className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/60">
                {g.title}
              </div>
            )}
            <ul className="space-y-1">
              {g.items.map((item) => (
                <NavItem
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  Icon={item.icon}
                  active={isActive(item.to)}
                  collapsed={collapsed}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {!collapsed && (
        <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/70">
          Local-first. No account needed.
        </div>
      )}
    </div>
  );
}

function NavItem({
  to, label, Icon, active, collapsed,
}: {
  to: string; label: string; Icon: React.ComponentType<{ className?: string }>;
  active: boolean; collapsed: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        title={collapsed ? label : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent",
          collapsed && "justify-center px-2",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    </li>
  );
}