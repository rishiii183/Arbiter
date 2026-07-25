import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  ShieldCheck,
  Plus,
  CheckCircle2,
} from "lucide-react";

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
    <Switch defaultChecked={on} />
  </div>
);

const Settings = () => {
  const [activeTab, setActiveTab] = useState<"General" | "Security" | "AI Providers" | "Compliance" | "Billing">("General");
  const { toast } = useToast();
  const [customEntities, setCustomEntities] = useState<string[]>([]);
  const [newEntity, setNewEntity] = useState("");
  const [isAddingEntity, setIsAddingEntity] = useState(false);

  const handleSave = () => {
    toast({
      title: "Settings updated",
      description: "Your workspace and sidecar gateway preferences have been saved.",
    });
  };

  const handleAddEntity = () => {
    if (newEntity.trim()) {
      setCustomEntities([...customEntities, newEntity.trim().toUpperCase()]);
      setNewEntity("");
      setIsAddingEntity(false);
      toast({
        title: "Custom entity added",
        description: `Added '${newEntity.trim().toUpperCase()}' to local NER detection models.`,
      });
    }
  };

  const tabs = [
    { id: "General", label: "General" },
    { id: "Security", label: "Security" },
    { id: "AI Providers", label: "AI Providers" },
    { id: "Compliance", label: "Compliance" },
    { id: "Billing", label: "Billing" },
  ] as const;

  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Workspace, security and AI gateway preferences.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors cursor-pointer font-medium
              ${activeTab === tab.id
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: GENERAL */}
      {activeTab === "General" && (
        <div className="rounded-xl border border-border bg-card px-6">
          <Section title="Organization" desc="Visible to all members of your workspace.">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Organization name</Label>
                <Input defaultValue="Apex Care Hospitals" className="bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label>Workspace ID</Label>
                <Input readOnly defaultValue="ws_apexcare_2026" className="bg-background font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Default region</Label>
                <Input defaultValue="ap-south-1 (Mumbai)" className="bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Input defaultValue="Asia/Kolkata (IST)" className="bg-background" />
              </div>
            </div>
          </Section>

          <Section title="Gateway behavior" desc="How the local sidecar handles outbound AI traffic by default.">
            <ToggleRow title="Enforce anonymization" desc="Strip detected PII from every prompt before egress." />
            <ToggleRow title="Block on unknown entity" desc="Halt egress when confidence is below 0.7." />
            <ToggleRow title="Local-only mode" desc="Refuse all egress; use on-prem models only." on={false} />
            <ToggleRow title="Stream audit to SIEM" desc="Forward signed events to Splunk / Elastic in real time." />
          </Section>

          <Section title="Sensitive entity vocabulary" desc="India-specific identifiers detected by the on-device model.">
            <div className="flex flex-wrap gap-1.5">
              {[
                "AADHAAR", "PAN", "ABHA_ID", "UPI_VPA", "IFSC", "BANK_ACCT", "GSTIN",
                "VOTER_ID", "DL_NUMBER", "PASSPORT_IN", "PHONE_IN", "EMAIL", "PIN_CODE",
                "MRN", "ICD10", "RX_NUMBER", "TRIAL_ID", "PATIENT_NAME", "DOB", "ADDRESS_IN",
                ...customEntities,
              ].map((e) => (
                <span key={e} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 ring-1 ring-primary/25 text-[11px] font-mono text-primary">
                  {e}
                </span>
              ))}
              {isAddingEntity ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={newEntity}
                    onChange={(e) => setNewEntity(e.target.value)}
                    placeholder="ENTITY_NAME"
                    className="h-7 w-32 text-xs font-mono bg-background"
                  />
                  <Button size="sm" onClick={handleAddEntity} className="h-7 px-2 text-xs">Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingEntity(false)} className="h-7 px-2 text-xs">Cancel</Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingEntity(true)}
                  className="inline-flex items-center px-2.5 py-1 rounded-full ring-1 ring-dashed ring-border text-[11px] text-muted-foreground hover:text-foreground hover:ring-primary/30 cursor-pointer"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add custom
                </button>
              )}
            </div>
          </Section>

          <Section title="Danger zone" desc="Irreversible workspace actions.">
            <div className="rounded-lg border border-warning/40 bg-warning/5 p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">Rotate token-vault key</div>
                <div className="text-xs text-muted-foreground mt-0.5">All sidecars will resync; in-flight tokens become unrecoverable.</div>
              </div>
              <Button variant="outline" className="border-warning/50 text-warning hover:bg-warning/10 hover:text-warning cursor-pointer">
                Rotate
              </Button>
            </div>
          </Section>
        </div>
      )}

      {/* TAB 2: SECURITY */}
      {activeTab === "Security" && (
        <div className="rounded-xl border border-border bg-card px-6">
          <Section title="Hardware Attestation (TEE)" desc="AWS Nitro Trusted Execution Environment cryptographic keys.">
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4 bg-background/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nitro Enclave Attestation Key (PCR0)</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-success/15 text-success">
                    <CheckCircle2 className="h-3 w-3" /> VERIFIED
                  </span>
                </div>
                <Input readOnly defaultValue="a7f2c8e194b2c019481b8372d9104c92" className="font-mono text-xs bg-muted/40" />
              </div>
              <ToggleRow title="Require hardware attestation on every boot" desc="Sidecar enclave will self-terminate if PCR measurements deviate." />
              <ToggleRow title="Strict AES-256-GCM vault encryption" desc="Hardware keys stay sealed in enclave RAM; zero disk persistence." />
            </div>
          </Section>

          <Section title="SSO & Authentication" desc="Access controls and hardware security keys for administrators.">
            <div className="space-y-4">
              <ToggleRow title="Enforce FIDO2 / WebAuthn hardware keys" desc="Require YubiKey or Touch ID for compliance admins." />
              <ToggleRow title="SAML 2.0 / Okta Enterprise SSO" desc="Single sign-on active for Apex Care Hospitals domain." />
            </div>
          </Section>
        </div>
      )}

      {/* TAB 3: AI PROVIDERS */}
      {activeTab === "AI Providers" && (
        <div className="rounded-xl border border-border bg-card px-6">
          <Section title="Outbound Connectors" desc="Enterprise AI models routed through the Arbiter anonymization gateway.">
            <div className="space-y-3">
              {[
                { name: "OpenAI Gateway", models: "GPT-4o, O3-mini", status: "Anonymized & Active", icon: "🟢" },
                { name: "Anthropic Claude", models: "Claude 3.5 Sonnet", status: "Anonymized & Active", icon: "🟢" },
                { name: "Google Gemini API", models: "Gemini 1.5 Pro", status: "Anonymized & Active", icon: "🟢" },
                { name: "Ollama On-Premises", models: "Llama-3-70B Local", status: "Local Sidecar (Bypass)", icon: "🔵" },
              ].map((provider) => (
                <div key={provider.name} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50">
                  <div className="flex items-center gap-3">
                    <span className="text-base">{provider.icon}</span>
                    <div>
                      <div className="text-sm font-medium">{provider.name}</div>
                      <div className="text-xs text-muted-foreground">{provider.models}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
                    {provider.status}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 4: COMPLIANCE */}
      {activeTab === "Compliance" && (
        <div className="rounded-xl border border-border bg-card px-6">
          <Section title="Regulatory Frameworks" desc="Configured compliance regimes enforced by Arbiter.">
            <div className="space-y-3">
              <ToggleRow title="DPDP Act 2023 (India)" desc="Mandatory anonymization of 44+ Indian PII entity categories." />
              <ToggleRow title="HIPAA Healthcare Rule" desc="Protected Health Information (PHI) & MRN masking." />
              <ToggleRow title="SOC 2 Type II Audit Log" desc="Cryptographic event hashing with immutable timestamping." />
            </div>
          </Section>

          <Section title="Data Retention" desc="Automatic token vault cleanup and log expiration.">
            <div className="space-y-4">
              <div className="space-y-1.5 max-w-sm">
                <Label>Token Vault Key Expiry</Label>
                <Input defaultValue="30 Days (Automatic Purge)" className="bg-background" />
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* TAB 5: BILLING */}
      {activeTab === "Billing" && (
        <div className="rounded-xl border border-border bg-card px-6">
          <Section title="Current Subscription" desc="Enterprise license and sidecar capacity.">
            <div className="p-5 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono uppercase text-primary font-semibold">Enterprise License</span>
                  <h4 className="text-lg font-bold text-foreground mt-0.5">Arbiter Nitro Enclave Pilot</h4>
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-success/20 text-success border border-success/30">
                  Active
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Up to 50 sidecar seats · ₹75,000 / month · Renews Feb 2026
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* Footer Save & Discard Buttons */}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost">Discard</Button>
        <Button onClick={handleSave} className="cursor-pointer">Save changes</Button>
      </div>
    </AppShell>
  );
};

export default Settings;
