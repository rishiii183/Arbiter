import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, ShieldCheck, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

const policies = [
  { name: "clinical-notes-v3", scope: "Healthcare", entities: 18, action: "anonymize", risk: "high",  enabled: true,  updated: "2 hours ago" },
  { name: "finance-default",   scope: "BFSI",       entities: 14, action: "anonymize", risk: "high",  enabled: true,  updated: "yesterday" },
  { name: "research-strict",   scope: "R&D Lab",    entities: 22, action: "block",     risk: "critical", enabled: true,  updated: "3 days ago" },
  { name: "general-employee",  scope: "All staff",  entities: 9,  action: "warn",      risk: "medium", enabled: true,  updated: "1 week ago" },
  { name: "marketing-draft",   scope: "Growth",     entities: 5,  action: "passthrough", risk: "low", enabled: false, updated: "2 weeks ago" },
];

const Policies = () => {
  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Policy management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define how Foretyx handles sensitive entities per team and per model.
          </p>
        </div>
        <Button className="gap-1.5"><Plus className="h-4 w-4"/> New policy</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Active policies", value: "12" },
          { label: "Entity types covered", value: "44" },
          { label: "Avg coverage score", value: "91%" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs text-muted-foreground">{m.label}</div>
            <div className="text-2xl font-bold tracking-tight mt-1">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <Input className="pl-9 bg-background" placeholder="Search policies..."/>
          </div>
          <div className="flex gap-2 text-xs">
            {["All", "Healthcare", "BFSI", "Research", "General"].map((t, i) => (
              <button key={t} className={`px-3 py-1.5 rounded-md ring-1 transition-colors
                ${i===0 ? "bg-primary/10 ring-primary/30 text-foreground" : "ring-border text-muted-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/30">
            <tr>
              <th className="text-left font-medium px-5 py-3">Policy</th>
              <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Scope</th>
              <th className="text-left font-medium px-5 py-3 hidden lg:table-cell">Entities</th>
              <th className="text-left font-medium px-5 py-3">Action</th>
              <th className="text-left font-medium px-5 py-3 hidden lg:table-cell">Risk</th>
              <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Updated</th>
              <th className="text-left font-medium px-5 py-3">Enabled</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => (
              <tr key={p.name} className="border-t border-border hover:bg-muted/20 group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-primary/10 ring-1 ring-primary/25 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-primary"/>
                    </div>
                    <div className="font-mono text-sm">{p.name}</div>
                  </div>
                </td>
                <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">{p.scope}</td>
                <td className="px-5 py-4 text-muted-foreground hidden lg:table-cell">{p.entities}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ring-1
                    ${p.action === "anonymize" ? "bg-primary/10 ring-primary/30 text-primary" :
                      p.action === "block" ? "bg-warning/10 ring-warning/30 text-warning" :
                      p.action === "warn" ? "bg-warning/10 ring-warning/20 text-warning" :
                      "bg-muted ring-border text-muted-foreground"}`}>
                    {p.action}
                  </span>
                </td>
                <td className="px-5 py-4 hidden lg:table-cell">
                  <span className="text-xs text-muted-foreground capitalize">{p.risk}</span>
                </td>
                <td className="px-5 py-4 text-muted-foreground text-xs hidden md:table-cell">{p.updated}</td>
                <td className="px-5 py-4"><Switch defaultChecked={p.enabled}/></td>
                <td className="px-5 py-4">
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors"/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
};

export default Policies;
