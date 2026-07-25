import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ShieldCheck, Cpu, Settings, FileLock2, Activity, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/policies", label: "Policies", icon: ShieldCheck },
  { to: "/devices", label: "Devices", icon: Cpu },
  { to: "/audit", label: "Audit Log", icon: FileLock2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const current = nav.find((n) => pathname.startsWith(n.to))?.label ?? "Dashboard";

  return (
    <div className="dark min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card/40 backdrop-blur-sm">
        <div className="px-5 py-5 border-b border-border">
          <NavLink to="/"><Logo /></NavLink>
        </div>

        <div className="px-3 py-4">
          <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Workspace
          </div>
          <div className="mx-1 mb-3 flex items-center gap-2.5 rounded-lg border border-border bg-background/50 p-2.5">
            <div className="h-8 w-8 rounded-md bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center">
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

        <nav className="px-3 flex-1 space-y-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-foreground ring-1 ring-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 ring-1 ring-border flex items-center justify-center text-xs font-semibold">
              RS
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">Riya Sharma</div>
              <div className="text-[11px] text-muted-foreground truncate">Compliance Admin</div>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-5 bg-background/70 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Foretyx</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-sm font-medium">{current}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 ring-1 ring-primary/25 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="font-medium">Local Data Plane Active</span>
            </div>
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
