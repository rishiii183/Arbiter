import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const events = [
  { ts: "2026-04-30 14:22:09", evt: "egress.anonymized", user: "riya.sharma",  model: "claude-sonnet-4", policy: "clinical-notes-v3", verdict: "allow_anonymized" },
  { ts: "2026-04-30 14:21:51", evt: "egress.anonymized", user: "vikram.iyer",  model: "gpt-5.1",         policy: "finance-default",   verdict: "allow_anonymized" },
  { ts: "2026-04-30 14:20:58", evt: "egress.blocked",    user: "aman.patel",   model: "claude-sonnet-4", policy: "finance-default",   verdict: "block" },
  { ts: "2026-04-30 14:18:33", evt: "policy.updated",    user: "riya.sharma",  model: "—",               policy: "clinical-notes-v3", verdict: "config" },
  { ts: "2026-04-30 14:14:02", evt: "device.enrolled",   user: "system",       model: "—",               policy: "general-employee",  verdict: "config" },
  { ts: "2026-04-30 14:09:11", evt: "egress.anonymized", user: "neha.kapoor",  model: "gemini-2",        policy: "clinical-notes-v3", verdict: "allow_anonymized" },
];

const Audit = () => {
  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
          <p className="text-sm text-muted-foreground mt-1">Immutable, signed event stream · DPDP-aligned</p>
        </div>
        <Button variant="outline" className="gap-1.5"><Download className="h-4 w-4"/> Export 30 days</Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <Input className="pl-9 bg-background" placeholder="Filter by user, event type, policy..."/>
          </div>
          <div className="text-xs text-muted-foreground font-mono">12,847 events · ed25519-signed</div>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/30">
            <tr>
              <th className="text-left font-medium px-5 py-3">Timestamp</th>
              <th className="text-left font-medium px-5 py-3">Event</th>
              <th className="text-left font-medium px-5 py-3">Actor</th>
              <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Model</th>
              <th className="text-left font-medium px-5 py-3 hidden lg:table-cell">Policy</th>
              <th className="text-left font-medium px-5 py-3">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/20">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{e.ts}</td>
                <td className="px-5 py-3 font-mono text-xs">{e.evt}</td>
                <td className="px-5 py-3">{e.user}</td>
                <td className="px-5 py-3 font-mono text-xs hidden md:table-cell">{e.model}</td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground hidden lg:table-cell">{e.policy}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ring-1
                    ${e.verdict === "allow_anonymized" ? "bg-primary/10 ring-primary/30 text-primary" :
                      e.verdict === "block" ? "bg-warning/10 ring-warning/30 text-warning" :
                      "bg-muted ring-border text-muted-foreground"}`}>
                    {e.verdict}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
};

export default Audit;
