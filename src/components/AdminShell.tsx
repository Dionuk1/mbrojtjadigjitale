import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, BarChart3, Wrench, Bell, Lightbulb, ShieldAlert,
  MessageSquare, ScrollText, KeyRound, SlidersHorizontal, Users, Palette,
  Download, Info, LogOut, Menu, X, ShieldHalf, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { adminLogout as adminLogoutFn } from "@/lib/admin.functions";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/tools", label: "Tools", icon: Wrench },
  { to: "/admin/alerts", label: "Security Alerts", icon: Bell },
  { to: "/admin/tips", label: "Daily Tips", icon: Lightbulb },
  { to: "/admin/weak-patterns", label: "Weak Patterns", icon: ShieldAlert },
  { to: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { to: "/admin/logs", label: "Audit Logs", icon: ScrollText },
  { to: "/admin/sessions", label: "Sessions", icon: KeyRound },
  { to: "/admin/settings", label: "Site Settings", icon: SlidersHorizontal },
  { to: "/admin/users", label: "Admin Users", icon: Users },
  { to: "/admin/appearance", label: "Appearance", icon: Palette },
  { to: "/admin/exports", label: "Exports", icon: Download },
  { to: "/admin/about", label: "About", icon: Info },
];

const COLLAPSE_KEY = "md.admin.sidebar.collapsed";

export function AdminShell({
  children,
  username,
}: {
  children: React.ReactNode;
  username?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const logout = useServerFn(adminLogoutFn);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch { /* ignore */ }
  }, []);
  useEffect(() => setMobileOpen(false), [pathname]);

  function toggle() {
    setCollapsed((c) => {
      const n = !c;
      try { localStorage.setItem(COLLAPSE_KEY, n ? "1" : "0"); } catch { /* ignore */ }
      return n;
    });
  }

  async function doLogout() {
    await logout();
    navigate({ to: "/admin/login" });
  }

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const current = NAV.find((n) => isActive(n.to, n.exact));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarInner isActive={isActive} collapsed={collapsed} onToggleCollapse={toggle} />
      </aside>

      <div className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          className={cn("absolute inset-0 bg-black/60 transition-opacity", mobileOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarInner isActive={isActive} collapsed={false} showClose onClose={() => setMobileOpen(false)} />
        </aside>
      </div>

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-background/80 px-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/admin" className="hover:text-foreground">Admin</Link>
              {current && current.to !== "/admin" && (
                <>
                  <span>/</span>
                  <span className="text-foreground">{current.label}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {username && <span className="hidden text-sm text-muted-foreground sm:inline">{username}</span>}
            <Button variant="ghost" size="sm" onClick={doLogout}>
              <LogOut className="mr-2 h-4 w-4" />Log out
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl animate-fade-in px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarInner({
  isActive, collapsed, showClose, onClose, onToggleCollapse,
}: {
  isActive: (to: string, exact?: boolean) => boolean;
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
          {!collapsed && <span className="truncate font-semibold">Admin Console</span>}
        </div>
        {showClose ? (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        ) : onToggleCollapse ? (
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} aria-label="Toggle sidebar">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        ) : null}
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                    collapsed && "justify-center px-2",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {!collapsed && (
        <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/70">
          Mbrojtja Digjitale
        </div>
      )}
    </div>
  );
}