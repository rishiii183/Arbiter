import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const Section = ({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) => (
  <div className="grid lg:grid-cols-3 gap-6 py-8 border-b border-border last:border-0">
    <div>
      <h3 className="font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </div>
    <div className="lg:col-span-2 space-y-4">{children}</div>
  </div>
);

const ToggleRow = ({ title, desc, on = true }: { title: string; desc: string; on?: boolean }) => (
  <div className="flex items-start justify-between gap-6 rounded-lg border border-border p-4 bg-background/50">
    <div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
    </div>
    <Switch defaultChecked={on}/>
  </div>
);

const Settings = () => {
  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Workspace, security and AI gateway preferences.</p>
      </div>

      <div className="flex gap-1 border-b border-border mb-2">
        {["General", "Security", "AI Providers", "Compliance", "Billing"].map((t, i) => (
          <button key={t}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors
              ${i===0 ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card px-6">
        <Section title="Organization" desc="Visible to all members of your workspace.">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Organization name</Label>
              <Input defaultValue="Apex Care Hospitals" className="bg-background"/>
            </div>
            <div className="space-y-1.5">
              <Label>Workspace ID</Label>
              <Input readOnly defaultValue="ws_apexcare_2026" className="bg-background font-mono text-sm"/>
            </div>
            <div className="space-y-1.5">
              <Label>Default region</Label>
              <Input defaultValue="ap-south-1 (Mumbai)" className="bg-background"/>
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Input defaultValue="Asia/Kolkata (IST)" className="bg-background"/>
            </div>
          </div>
        </Section>

        <Section title="Gateway behavior" desc="How the local sidecar handles outbound AI traffic by default.">
          <ToggleRow title="Enforce anonymization" desc="Strip detected PII from every prompt before egress."/>
          <ToggleRow title="Block on unknown entity" desc="Halt egress when confidence is below 0.7."/>
          <ToggleRow title="Local-only mode" desc="Refuse all egress; use on-prem models only." on={false}/>
          <ToggleRow title="Stream audit to SIEM" desc="Forward signed events to Splunk / Elastic in real time."/>
        </Section>

        <Section title="Sensitive entity vocabulary" desc="India-specific identifiers detected by the on-device model.">
          <div className="flex flex-wrap gap-1.5">
            {["AADHAAR","PAN","ABHA_ID","UPI_VPA","IFSC","BANK_ACCT","GSTIN","VOTER_ID","DL_NUMBER","PASSPORT_IN","PHONE_IN","EMAIL","PIN_CODE","MRN","ICD10","RX_NUMBER","TRIAL_ID","PATIENT_NAME","DOB","ADDRESS_IN"].map((e) => (
              <span key={e} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 ring-1 ring-primary/25 text-[11px] font-mono text-primary">
                {e}
              </span>
            ))}
            <button className="inline-flex items-center px-2.5 py-1 rounded-full ring-1 ring-dashed ring-border text-[11px] text-muted-foreground hover:text-foreground hover:ring-primary/30">
              + Add custom
            </button>
          </div>
        </Section>

        <Section title="Danger zone" desc="Irreversible workspace actions.">
          <div className="rounded-lg border border-warning/40 bg-warning/5 p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Rotate token-vault key</div>
              <div className="text-xs text-muted-foreground mt-0.5">All sidecars will resync; in-flight tokens become unrecoverable.</div>
            </div>
            <Button variant="outline" className="border-warning/50 text-warning hover:bg-warning/10 hover:text-warning">Rotate</Button>
          </div>
        </Section>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost">Discard</Button>
        <Button>Save changes</Button>
      </div>
    </AppShell>
  );
};

export default Settings;
