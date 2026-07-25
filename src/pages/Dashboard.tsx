import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  ArrowUpRight,
  Info,
  ChevronDown,
  Hexagon,
  Globe2,
  ArrowRight,
  User,
  LogOut,
  Cpu,
  Activity,
  CheckCircle2,
} from "lucide-react";

const trend = [22, 28, 24, 36, 30, 42, 38, 48, 44, 56, 52, 64, 58, 70, 66, 78, 72, 82, 76, 88, 84, 92];

const Dashboard = () => {
  const navigate = useNavigate();
  const [globeModalOpen, setGlobeModalOpen] = useState(false);

  return (
    <AppShell>
      {/* Greeting & Interactive Profile Dropdown */}
      <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="display text-3xl md:text-4xl">Welcome back, Riya</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Local data plane is stable
            <span className="text-foreground/80 normal-case tracking-normal ml-2">· 82ms today</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-full border border-border bg-card/60 hover:bg-card/90 hover:border-primary/40 pl-2.5 pr-4 py-1.5 transition-all cursor-pointer shadow-sm group outline-none">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 ring-1 ring-border flex items-center justify-center text-[11px] font-semibold group-hover:ring-primary/50 transition-all">
                  RS
                </div>
                <div className="leading-tight text-left">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
                    Compliance Admin
                  </div>
                  <div className="text-sm font-medium text-foreground">Riya Sharma</div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 space-y-1 bg-card border-border shadow-xl">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Riya Sharma</p>
                  <p className="text-xs leading-none text-muted-foreground">riya.sharma@apexcare.in</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4 text-primary" />
                <span>Account & Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/policies")} className="cursor-pointer">
                <ShieldCheck className="mr-2 h-4 w-4 text-emerald-400" />
                <span>DPDP Policies</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/devices")} className="cursor-pointer">
                <Cpu className="mr-2 h-4 w-4 text-teal-light" />
                <span>Enclave Devices</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/login")} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Hero grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* LEFT — Oversized headline stat with interactive animated globe */}
        <section className="xl:col-span-7 rounded-2xl bg-obsidian text-obsidian-foreground p-7 md:p-9 relative overflow-hidden border border-white/5">
          <div className="absolute inset-0 crosshair-bg opacity-60 pointer-events-none" />

          <div className="relative">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
              Total Prompts Anonymized (24h)
            </div>
            <div className="mt-3 flex items-end gap-3">
              <span className="display text-7xl md:text-[112px] text-white">12,847</span>
              <span className="display text-3xl md:text-4xl text-white/60 mb-3">prompts</span>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-success/15 ring-1 ring-success/40 px-3 py-1 text-xs text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Normal · DPDP compliant
            </div>
          </div>

          {/* Interactive Globe / Orbit Artwork */}
          <div
            onClick={() => setGlobeModalOpen(true)}
            className="relative mt-8 h-56 md:h-64 flex items-center justify-center cursor-pointer group"
          >
            {/* Background glowing rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-44 w-44 md:h-52 md:w-52 rounded-full border border-teal-500/20 group-hover:border-teal-400/50 transition-colors" />
            </div>

            {/* Orbit ring 1 - clockwise animation */}
            <div className="absolute inset-0 flex items-center justify-center orbit-slow">
              <div className="h-64 w-64 md:h-80 md:w-80 rounded-full border border-dashed border-teal-400/30 group-hover:border-teal-400/60 transition-colors" />
            </div>

            {/* Orbit ring 2 - reverse tilt animation */}
            <div className="absolute inset-0 flex items-center justify-center orbit-rev">
              <div
                className="h-72 w-72 md:h-96 md:w-96 rounded-full border border-white/20 group-hover:border-teal-400/40 transition-colors"
                style={{ transform: "rotate(18deg) scaleY(.35)" }}
              />
            </div>



            {/* Center Animated Globe */}
            <div className="relative p-4 rounded-full bg-teal-950/30 border border-teal-500/30 backdrop-blur-sm group-hover:scale-105 group-hover:border-teal-400/60 transition-all globe-animated">
              <Globe2 className="h-20 w-20 md:h-24 md:w-24 text-emerald-400/90 drop-shadow-[0_0_20px_rgba(15,107,94,0.6)]" strokeWidth={0.8} />
            </div>
          </div>

          <div className="relative mt-2 flex justify-end">
            <Button
              onClick={() => setGlobeModalOpen(true)}
              variant="secondary"
              size="sm"
              className="rounded-full bg-white/8 hover:bg-teal-500/20 text-white border border-white/10 hover:border-teal-400/40 gap-1.5 cursor-pointer transition-all"
            >
              View report <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Footer mini-stats */}
          <div className="relative mt-7 grid grid-cols-3 gap-6 border-t border-white/10 pt-5">
            {[
              { label: "Anonymized Today", val: "12.8k" },
              { label: "Egress Blocked", val: "100%" },
              { label: "Nitro Latency", val: "1.4ms" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/50">{s.label}</div>
                <div className="mt-1 font-mono text-xl text-white font-medium">{s.val}</div>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT — Enclave Status & Analytics */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          {/* Card 1: AWS Nitro Enclave Status */}
          <article className="rounded-2xl border border-border bg-card p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Enclave Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success border border-success/30">
                  <CheckCircle2 className="h-3 w-3" /> Attested
                </span>
              </div>
              <h3 className="text-xl font-medium mt-3">AWS Nitro TEE Enclave</h3>
              <p className="text-xs text-muted-foreground mt-1">PCR0: a7f2c8e194b2c019481b</p>
            </div>

            <div className="mt-6 pt-5 border-t border-border grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-semibold text-primary">0 Bytes</div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mt-1">Raw PII Egress</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">44 Entities</div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mt-1">Active Masking</div>
              </div>
            </div>
          </article>

          {/* Card 2: Performance Graph */}
          <article className="rounded-2xl border border-border bg-card p-6 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-2xl text-primary">49.32<span className="text-sm text-muted-foreground"> req/s</span></div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mt-1">Anonymized</div>
              </div>
            </div>

            <svg viewBox="0 0 600 140" className="w-full h-32 mt-4">
              <defs>
                <linearGradient id="areaTeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(174 100% 38%)" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="hsl(174 100% 38%)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const pts = trend.map((v, i) => `${(i / (trend.length - 1)) * 600},${130 - v * 1.05}`).join(" ");
                const area = `0,130 ${pts} 600,130`;
                return (
                  <>
                    <polygon points={area} fill="url(#areaTeal)" />
                    <polyline points={pts} fill="none" stroke="hsl(174 100% 38%)" strokeWidth="2" />
                  </>
                );
              })()}
            </svg>

            <div className="mt-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs">
                <span className="h-2 w-2 rounded-full bg-primary" /> Global · all regions
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>
              <a href="#" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
                Detailed analytics <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Measure anonymization &amp; rehydration efficiency across your sidecar regions
            </p>
          </article>
        </div>
      </div>

      {/* Interactive Globe Security & Enclave Report Dialog */}
      <Dialog open={globeModalOpen} onOpenChange={setGlobeModalOpen}>
        <DialogContent className="max-w-2xl bg-surface-dark border-cream-soft text-cream">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <Globe2 className="h-5 w-5 text-emerald-400 animate-pulse" />
              Global Data Plane & Enclave Telemetry Report
            </DialogTitle>
            <DialogDescription className="text-cream/60">
              Real-time hardware attestation specs, local NER tokenization nodes, and zero-trust egress logs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-cream-soft/40 p-3 bg-surface-mid">
                <div className="text-[10px] uppercase font-mono text-cream/40">Active Data Plane</div>
                <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  India (Mumbai)
                </div>
              </div>
              <div className="rounded-lg border border-cream-soft/40 p-3 bg-surface-mid">
                <div className="text-[10px] uppercase font-mono text-cream/40">Raw PII Egress</div>
                <div className="text-sm font-semibold text-cream mt-1">0.00 Bytes</div>
              </div>
              <div className="rounded-lg border border-cream-soft/40 p-3 bg-surface-mid">
                <div className="text-[10px] uppercase font-mono text-cream/40">Attestation State</div>
                <div className="text-sm font-semibold text-teal-light mt-1">Verified AWS Nitro TEE</div>
              </div>
            </div>

            <div className="rounded-lg border border-cream-soft/40 p-4 bg-surface-mid space-y-2">
              <div className="text-xs font-mono text-cream/50 uppercase tracking-wider mb-2">Live Node Cluster Health</div>
              {[
                { name: "Mumbai Nitro Enclave #1", status: "Operational · 12ms", check: "Attested" },
                { name: "Bengaluru Edge Proxy #2", status: "Operational · 8ms", check: "Attested" },
                { name: "Frankfurt Secondary Relay", status: "Standby · Failover Ready", check: "Attested" },
              ].map((node) => (
                <div key={node.name} className="flex items-center justify-between text-xs py-2 border-b border-cream-soft/20 last:border-0">
                  <span className="font-medium text-cream flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-teal-light" />
                    {node.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-cream/60 font-mono">{node.status}</span>
                    <span className="text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-500/20">{node.check}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Dashboard;
