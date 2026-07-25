import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ArrowUpRight,
  Info,
  ChevronDown,
  Hexagon,
  Globe2,
  ArrowRight,
} from "lucide-react";

const trend = [22, 28, 24, 36, 30, 42, 38, 48, 44, 56, 52, 64, 58, 70, 66, 78, 72, 82, 76, 88, 84, 92];

const Dashboard = () => {
  return (
    <AppShell>
      {/* Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="display text-3xl md:text-4xl">Welcome back, Riya</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Local data plane is stable
            <span className="text-foreground/80 normal-case tracking-normal ml-2">· 82ms today</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-full border border-border bg-card/60 pl-1 pr-3 py-1">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 ring-1 ring-border flex items-center justify-center text-[11px] font-semibold">
              RS
            </div>
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Compliance Admin
              </div>
              <div className="text-sm font-medium">Riya Sharma</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
          </div>
        </div>
      </div>

      {/* Hero grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* LEFT — Oversized headline stat with orbit illustration */}
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

          {/* Orbit / globe artwork */}
          <div className="relative mt-8 h-56 md:h-64 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-44 w-44 md:h-52 md:w-52 rounded-full border border-white/10" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center orbit-slow">
              <div className="h-64 w-64 md:h-80 md:w-80 rounded-full border border-dashed border-white/15" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center orbit-rev">
              <div
                className="h-72 w-72 md:h-96 md:w-96 rounded-full border border-white/10"
                style={{ transform: "rotate(18deg) scaleY(.35)" }}
              />
            </div>
            <Globe2 className="relative h-24 w-24 md:h-28 md:w-28 text-white/35" strokeWidth={0.6} />
            <ShieldCheck className="absolute h-7 w-7 text-primary -translate-y-16 translate-x-10" />
          </div>

          <div className="relative mt-2 flex justify-end">
            <Button variant="secondary" size="sm" className="rounded-full bg-white/8 hover:bg-white/15 text-white border border-white/10 gap-1.5">
              View report <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Footer mini-stats */}
          <div className="relative mt-7 grid grid-cols-3 gap-6 border-t border-white/10 pt-5">
            {[
              { k: "Blocked egress", v: "47", s: "−12%" },
              { k: "Avg latency", v: "82ms", s: "−9ms" },
              { k: "Peak throughput", v: "12k/s", s: "+18%" },
            ].map((m) => (
              <div key={m.k}>
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">{m.k}</div>
                <div className="mt-1 font-display text-xl text-white">{m.v}</div>
                <div className="text-[11px] text-success">{m.s}</div>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT column */}
        <div className="xl:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Signal-yellow priority card */}
          <article className="relative rounded-2xl p-6 overflow-hidden bg-warning text-warning-foreground border border-black/10">
            <div className="absolute inset-0 hex-pattern opacity-70 pointer-events-none" />
            <div className="relative flex items-start justify-between">
              <div className="h-10 w-10 rounded-full bg-black/10 ring-1 ring-black/15 flex items-center justify-center">
                <Hexagon className="h-4 w-4" />
              </div>
            </div>
            <h3 className="relative display text-2xl mt-10">Policy Review</h3>

            <div className="relative mt-3 inline-flex items-center rounded-full bg-black/85 text-warning px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] font-mono font-semibold">
              Due in 45 mins
            </div>

            <p className="relative mt-3 text-sm text-warning-foreground/80">
              Quarterly attestation: <span className="sysid">clinical-notes-v3</span>
            </p>

            <button className="relative mt-6 w-full rounded-md bg-black text-warning py-2.5 text-sm font-medium hover:bg-black/90 transition-colors">
              Authorize policy
            </button>
          </article>

          {/* Fleet integrity / Sidecar fleet */}
          <article className="relative rounded-2xl p-6 overflow-hidden bg-card border border-border">
            <div className="absolute inset-0 hex-pattern-dark opacity-50 pointer-events-none" />
            <div className="relative flex items-start justify-between">
              <div className="h-10 w-10 rounded-full bg-muted ring-1 ring-border flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-foreground" />
              </div>
            </div>

            <h3 className="relative display text-2xl mt-10">Sidecar Fleet</h3>

            <div className="relative mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active devices</span>
                <span className="font-display text-base">142/142</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Redaction engine</span>
                <span className="chip bg-success/15 text-success ring-1 ring-success/30 uppercase tracking-wider">
                  Nominal
                </span>
              </div>
            </div>

            <button className="relative mt-6 w-full rounded-md border border-border bg-background py-2.5 text-sm font-medium hover:bg-muted transition-colors">
              Run diagnostics
            </button>
          </article>

          {/* Network / gateway throughput chart */}
          <article className="relative rounded-2xl p-6 overflow-hidden bg-card border border-border md:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Gateway Throughput
                </div>
                <div className="mt-2 flex items-end gap-3">
                  <span className="display text-5xl">72.5<span className="text-3xl text-muted-foreground"> req/s</span></span>
                </div>
              </div>
              <button className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                <Info className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-6 items-end">
              <div>
                <div className="font-display text-2xl text-warning">21.10<span className="text-sm text-muted-foreground"> req/s</span></div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mt-1">Blocked</div>
              </div>
              <div className="text-right">
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
    </AppShell>
  );
};

export default Dashboard;
