import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Cpu, Wifi, WifiOff, ShieldCheck, MoreVertical } from "lucide-react";

const devices = [
  { id: "FX-LX-2841", host: "ria-mbp.local",       user: "riya.sharma",   os: "macOS 15.3",     v: "2.4.1", status: "online",  policy: "clinical-notes-v3", lastSync: "Just now" },
  { id: "FX-LX-2840", host: "vikram-thinkpad",     user: "vikram.iyer",   os: "Ubuntu 24.04",   v: "2.4.1", status: "online",  policy: "finance-default",   lastSync: "12s ago" },
  { id: "FX-LX-2839", host: "neha-workstation",    user: "neha.kapoor",   os: "Windows 11 Pro", v: "2.4.0", status: "online",  policy: "clinical-notes-v3", lastSync: "1m ago" },
  { id: "FX-LX-2838", host: "lab-srv-01",          user: "system",        os: "Ubuntu Server 24",v: "2.4.1", status: "online", policy: "research-strict",   lastSync: "30s ago" },
  { id: "FX-LX-2837", host: "aman-mbp.local",      user: "aman.patel",    os: "macOS 14.6",     v: "2.3.7", status: "stale",   policy: "general-employee",  lastSync: "2 days ago" },
  { id: "FX-LX-2836", host: "kmehta-thinkpad",     user: "k.mehta",       os: "Ubuntu 24.04",   v: "2.4.1", status: "offline", policy: "general-employee",  lastSync: "8h ago" },
];

const Devices = () => {
  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Devices & Sidecars</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every endpoint runs the Foretyx local sidecar. Health and policy assignments below.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Download installer</Button>
          <Button>Enroll device</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total endpoints", value: "248", tone: "default" },
          { label: "Online now",      value: "231", tone: "primary" },
          { label: "Stale (>24h)",    value: "11",  tone: "warning" },
          { label: "Offline",         value: "6",   tone: "muted"   },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs text-muted-foreground">{m.label}</div>
            <div className={`text-2xl font-bold tracking-tight mt-1
              ${m.tone === "primary" ? "text-primary" : m.tone === "warning" ? "text-warning" : ""}`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Sidecar simulation card */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Live sidecar — ria-mbp.local</div>
              <div className="text-xs text-muted-foreground">Local Data Plane · port 7841</div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-primary ring-pulse"/>
              Active
            </span>
          </div>
          <div className="rounded-lg bg-background border border-border p-4 font-mono text-xs leading-relaxed text-muted-foreground overflow-x-auto">
            <div><span className="text-primary">[14:22:09]</span> intercept ▸ POST api.anthropic.com/v1/messages (2.1KB)</div>
            <div><span className="text-primary">[14:22:09]</span> detect    ▸ AADHAAR ×1 (0.98), ABHA_ID ×2 (0.96)</div>
            <div><span className="text-primary">[14:22:09]</span> tokenize  ▸ ⟨TKN_001⟩ ⟨TKN_002⟩ ⟨TKN_003⟩</div>
            <div><span className="text-primary">[14:22:09]</span> policy    ▸ clinical-notes-v3 → allow_anonymized</div>
            <div><span className="text-primary">[14:22:10]</span> egress    ▸ 1.7KB safe payload sent</div>
            <div><span className="text-primary">[14:22:11]</span> rehydrate ▸ 3 tokens mapped locally · 412ms</div>
            <div className="text-warning"><span>[14:22:14]</span> intercept ▸ POST api.openai.com (0.4KB) · BLOCKED — ACCT_NO leak</div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-sm font-semibold mb-4">Health checks</div>
          <div className="space-y-3 text-sm">
            {[
              { k: "TLS pinning",        v: "OK", ok: true },
              { k: "Local NER model",    v: "v4.2 loaded", ok: true },
              { k: "Token vault",        v: "Sealed", ok: true },
              { k: "Audit log signing",  v: "ed25519", ok: true },
              { k: "Outbound proxy",     v: "Configured", ok: true },
              { k: "Auto-update",        v: "Pending 2.4.2", ok: false },
            ].map((c) => (
              <div key={c.k} className="flex items-center justify-between">
                <span className="text-muted-foreground">{c.k}</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.ok ? "text-primary" : "text-warning"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${c.ok ? "bg-primary" : "bg-warning"}`}/>
                  {c.v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Devices table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold">All endpoints</div>
          <div className="text-xs text-muted-foreground">Updated 6s ago</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/30">
              <tr>
                <th className="text-left font-medium px-5 py-3">Device</th>
                <th className="text-left font-medium px-5 py-3">User</th>
                <th className="text-left font-medium px-5 py-3 hidden md:table-cell">OS</th>
                <th className="text-left font-medium px-5 py-3 hidden lg:table-cell">Version</th>
                <th className="text-left font-medium px-5 py-3 hidden lg:table-cell">Policy</th>
                <th className="text-left font-medium px-5 py-3">Status</th>
                <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Last sync</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                        <Cpu className="h-4 w-4 text-muted-foreground"/>
                      </div>
                      <div>
                        <div className="font-medium">{d.host}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{d.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{d.user}</td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{d.os}</td>
                  <td className="px-5 py-3.5 font-mono text-xs hidden lg:table-cell">{d.v}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground hidden lg:table-cell">{d.policy}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1
                      ${d.status === "online" ? "bg-primary/10 ring-primary/30 text-primary" :
                        d.status === "stale" ? "bg-warning/10 ring-warning/30 text-warning" :
                                               "bg-muted ring-border text-muted-foreground"}`}>
                      {d.status === "offline" ? <WifiOff className="h-3 w-3"/> :
                       d.status === "stale"   ? <ShieldCheck className="h-3 w-3"/> :
                                                <Wifi className="h-3 w-3"/>}
                      {d.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs hidden md:table-cell">{d.lastSync}</td>
                  <td className="px-5 py-3.5"><MoreVertical className="h-4 w-4 text-muted-foreground"/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
};

export default Devices;
