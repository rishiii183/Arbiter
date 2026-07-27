import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldCheck,
  Cpu,
  Settings,
  FileLock2,
  MessageSquareText,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "Live Playground", icon: MessageSquareText },
  { to: "/policies", label: "Policies", icon: ShieldCheck },
  { to: "/devices", label: "Devices", icon: Cpu },
  { to: "/audit", label: "Audit Log", icon: FileLock2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  headerActions,
}: {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}) {
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const current = nav.find((n) => pathname.startsWith(n.to))?.label ?? "Dashboard";

  return (
    <div className="dark min-h-screen bg-background text-foreground flex">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop & Mobile Sidebar */}
      <aside
        className={cn(
          "flex shrink-0 flex-col sticky top-0 h-screen border-r border-border/30 bg-card/40 backdrop-blur-sm transition-all duration-300 ease-in-out z-50",
          // Desktop sidebar rules
          "hidden lg:flex",
          isCollapsed ? "lg:w-16" : "lg:w-64",
          // Mobile sidebar rules (overlay drawer)
          isMobileOpen && "flex fixed inset-y-0 left-0 w-64 bg-card z-[60]"
        )}
      >
        {/* Sidebar Header with Logo & Toggle Button */}
        <div
          className={cn(
            "h-14 flex items-center justify-between border-b border-border/30",
            isCollapsed && !isMobileOpen ? "px-2" : "px-4"
          )}
        >
          <NavLink to="/" className="flex items-center shrink-0">
            {isCollapsed && !isMobileOpen ? (
              <Logo showWordmark={false} size="sm" />
            ) : (
              <Logo size="md" />
            )}
          </NavLink>

          <button
            onClick={() => {
              if (isMobileOpen) {
                setIsMobileOpen(false);
              } else {
                setIsCollapsed(!isCollapsed);
              }
            }}
            className="p-1.5 rounded-lg border border-border/40 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0"
            title={
              isMobileOpen
                ? "Close menu"
                : isCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            {isMobileOpen ? (
              <X className="h-4 w-4" />
            ) : isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Workspace info */}
        {!isCollapsed || isMobileOpen ? (
          <div className="px-3 py-4">
            <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Workspace
            </div>
            <div className="mx-1 mb-1 flex items-center gap-2.5 rounded-lg border border-border/40 bg-background/50 p-2.5">
              <div className="h-8 w-8 rounded-md bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">AC</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">Apex Care Hospitals</div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> DPDP compliant
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-3 flex justify-center border-b border-border/20">
            <div
              className="h-8 w-8 rounded-md bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center shrink-0 cursor-pointer"
              title="Apex Care Hospitals (DPDP compliant)"
            >
              <span className="text-xs font-bold text-primary">AC</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="px-2 py-3 flex-1 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md text-sm transition-colors",
                  isCollapsed && !isMobileOpen
                    ? "justify-center h-10 w-10 mx-auto px-0"
                    : "px-3 py-2",
                  isActive
                    ? "bg-primary/10 text-foreground ring-1 ring-primary/25 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )
              }
              title={isCollapsed && !isMobileOpen ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User profile footer */}
        <div className="p-3 border-t border-border/30 mt-auto">
          <div
            className={cn(
              "flex items-center gap-2.5 px-1 py-1",
              isCollapsed && !isMobileOpen ? "justify-center" : ""
            )}
          >
            <div
              className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 ring-1 ring-border/50 flex items-center justify-center text-xs font-semibold shrink-0"
              title={isCollapsed && !isMobileOpen ? "Riya Sharma (Compliance Admin)" : undefined}
            >
              RS
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">Riya Sharma</div>
                  <div className="text-[11px] text-muted-foreground truncate">Compliance Admin</div>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border/30 flex items-center justify-between px-5 bg-background/70 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-border/40 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <span className="text-sm text-muted-foreground">Foretyx</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-sm font-medium">{current}</span>
          </div>
          <div className="flex items-center gap-3">
            {headerActions}
            <div className="hidden md:block text-xs font-mono text-muted-foreground px-2.5 py-1 rounded-md bg-muted/40">
              v2.4.1
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
