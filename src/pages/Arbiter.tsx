import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const Dashboard3DCard = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(6deg) rotateY(-8deg) rotateZ(1deg)");
  const [promptsCount, setPromptsCount] = useState(1243);
  const [piiBlocked, setPiiBlocked] = useState(47);
  const [injectionsStopped, setInjectionsStopped] = useState(3);

  // Live telemetry pulse simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPromptsCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
      if (Math.random() > 0.6) setPiiBlocked((prev) => prev + 1);
      if (Math.random() > 0.85) setInjectionsStopped((prev) => prev + 1);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`);
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(6deg) rotateY(-8deg) rotateZ(1deg)");
  };

  return (
    <div className="lg:col-span-5 [perspective:1000px] py-4">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="rounded-xl overflow-hidden surface-mid transition-all duration-300 ease-out cursor-pointer group"
        style={{
          transform,
          transformStyle: "preserve-3d",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.75), 0 0 35px 0 rgba(15, 107, 94, 0.25)"
        }}
      >
        <div className="relative h-10 flex items-center px-4 border-b border-cream-soft bg-surface-dark/95 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#FF5F57] inline-block" />
            <span className="h-2 w-2 rounded-full bg-[#FFBD2E] inline-block" />
            <span className="h-2 w-2 rounded-full bg-[#28C840] inline-block" />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 font-mono text-[11px] text-cream/40 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            arbiter.foretyx.in/console
          </div>
        </div>

        <div className="p-7 space-y-6 bg-gradient-to-b from-surface-mid to-surface-dark">
          <div>
            <div className="font-sans text-[10px] uppercase tracking-[0.14em] text-cream/40 font-semibold flex items-center justify-between">
              <span>Today</span>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                LIVE TELEMETRY
              </span>
            </div>
            <div className="mt-2 display-sans text-[44px] text-cream leading-none font-bold tracking-tight">
              {promptsCount.toLocaleString()}
            </div>
            <div className="mt-1 font-body text-[13px] text-cream/55 flex items-center gap-2">
              prompts processed
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-cream-soft/60 p-4 bg-white/5 backdrop-blur-sm transition-all group-hover:border-teal-light/40">
              <div className="font-sans text-[10px] uppercase tracking-[0.14em] text-teal-light font-medium">PII blocked</div>
              <div className="mt-1 display-sans text-[26px] text-cream font-bold">{piiBlocked}</div>
            </div>
            <div className="rounded-lg border border-cream-soft/60 p-4 bg-white/5 backdrop-blur-sm transition-all group-hover:border-teal-light/40">
              <div className="font-sans text-[10px] uppercase tracking-[0.14em] text-teal-light font-medium">Injections stopped</div>
              <div className="mt-1 display-sans text-[26px] text-cream font-bold">{injectionsStopped}</div>
            </div>
          </div>

          <div className="font-mono text-[11px] leading-relaxed text-cream/70 space-y-2 pt-2 border-t border-cream-soft/40">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span> Enclave attested
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span> PCR0: a7f2c8e1...
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span> 0 bytes raw PII egressed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Arbiter = () => {
  return (
    <div className="dark min-h-screen bg-surface-dark text-cream">
      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface-dark/95 border-b border-cream-soft">
        <div className="container h-16 flex items-center justify-between">
          <Link to="/arbiter"><Logo variant="arbiter" tone="cream" /></Link>
          <nav className="hidden md:flex items-center gap-9 font-sans text-[14px] text-cream/60">
            <a href="#protocol"   className="hover:text-cream transition-colors nav-link-green-underline">Protocol</a>
            <a href="#why"        className="hover:text-cream transition-colors nav-link-green-underline">Why Arbiter</a>
            <a href="#compliance" className="hover:text-cream transition-colors nav-link-green-underline">Compliance</a>
            <Link to="/" className="hover:text-cream transition-colors nav-link-green-underline">Foretyx</Link>
          </nav>
          <Link to="/dashboard" target="_blank" rel="noopener noreferrer" className="btn-primary text-[12px]">
            Open console <span className="arrow">→</span>
          </Link>
        </div>
      </header>

      {/* TICKER */}
      <div className="surface-mid border-b border-cream-soft overflow-hidden">
        <div className="h-10 flex items-center overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="marquee flex gap-12 whitespace-nowrap w-max font-sans text-[11px] uppercase tracking-[0.14em] text-cream/60 font-medium">
            {[...Array(2)].flatMap((_, i) =>
              ["Cryptographic attestation", "DPDP Act compliant", "Aadhaar & PAN detection", "Prompt injection blocked", "Zero raw PII egressed", "GDPR", "HIPAA", "TEE attested"]
                .map((t) => (
                  <span key={`${i}-${t}`} className="flex items-center gap-12">
                    {t}<span aria-hidden>·</span>
                  </span>
                ))
            )}
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="surface-dark border-b border-cream-soft" style={{ background: "#111210" }}>
        <div className="container pt-10 sm:pt-12 pb-[72px] grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <a
              href="#"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-sans text-[13px] text-cream"
              style={{
                background: "hsla(170,76%,24%,0.15)",
                border: "1px solid hsla(170,76%,24%,0.4)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-teal-light" />
              New · DPDP Act 2023 compliance pack <span className="opacity-60">→</span>
            </a>

            <h1 className="display-sans text-[56px] sm:text-[72px] lg:text-[88px] text-cream mt-4">
              Use any LLM.<br />
              Leak nothing.
            </h1>

            <p className="mt-5 max-w-[480px] font-body text-[18px] leading-[1.6] text-cream/85">
              Arbiter is Foretyx's enterprise AI security gateway. Every prompt is
              processed inside a cryptographic <strong className="font-medium text-cream">enclave</strong>{" "}
              before anything reaches an external LLM. We cannot read it. Nobody can.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link to="/dashboard" target="_blank" rel="noopener noreferrer" className="btn-primary">
                Start free pilot <span className="arrow">→</span>
              </Link>
              <a href="#" className="btn-outline-cream">Talk to security team</a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 font-sans text-[13px] text-cream/60">
              {["Zero raw PII egress", "TEE attested", "DPDP Act 2023", "SOC 2 Type II (Roadmap)"].map((t) => (
                <span key={t} className="inline-flex items-center gap-2">
                  <span className="text-teal-light">✓</span> {t}
                </span>
              ))}
            </div>
          </div>

          {/* 3D Interactive Console Card */}
          <Dashboard3DCard />
        </div>
      </section>

      {/* PROTOCOL — three numbered steps */}
      <section id="protocol" className="border-b border-cream-soft">
        <div className="container py-[100px]">
          <div className="section-label">The protocol</div>
          <h2 className="display-serif-medium text-[40px] lg:text-[56px] text-cream max-w-3xl">
            Three steps. Zero raw<br/>PII on the wire.
          </h2>

          <div className="mt-16 grid lg:grid-cols-3 gap-px bg-cream/8">
            {[
              { n: "01", t: "Intercept", d: "The local enclave captures every outbound request from any AI app, browser extension or SDK." },
              { n: "02", t: "Detect & tokenize", d: "On-device NER tags 44+ India-specific entities. Sensitive spans become stable opaque placeholders." },
              { n: "03", t: "Rehydrate locally", d: "The model reply is mapped back to real values inside the enclave. The mapping never leaves." },
            ].map((s) => (
              <div key={s.n} className="surface-dark relative p-10 overflow-hidden">
                <span
                  aria-hidden
                  className="absolute -top-6 -right-2 display-serif text-[160px] leading-none"
                  style={{ color: "rgba(245, 240, 232, 0.06)" }}
                >
                  {s.n}
                </span>
                <div className="relative">
                  <div className="font-mono text-[12px] text-teal-light">{s.n}</div>
                  <h3 className="mt-6 font-sans font-medium text-[22px] text-cream">{s.t}</h3>
                  <p className="mt-3 font-body text-[15px] leading-[1.65] text-cream/65 max-w-[36ch]">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY — comparison (cream section) */}
      <section id="why" className="surface-cream relative">
        <div className="grain-cream pointer-events-none absolute inset-0" />
        <div className="container py-[100px] relative">
          <div className="section-label"><span className="rule-teal" />Why Arbiter</div>
          <h2 className="display-serif text-[40px] lg:text-[56px] text-ink max-w-3xl">
            Not another cloud proxy.<br/>A fundamentally different architecture.
          </h2>

          <div className="mt-14 overflow-x-auto">
            <table className="w-full border-collapse font-sans text-[15px]">
              <thead>
                <tr>
                  <th className="text-left py-4 pr-6 font-medium text-[12px] uppercase tracking-[0.14em] text-ink/60">Feature</th>
                  <th className="text-left py-4 px-6 font-medium text-[12px] uppercase tracking-[0.14em] text-teal-deep bg-teal-wash border-t-2 border-teal-deep">Arbiter</th>
                  <th className="text-left py-4 px-6 font-medium text-[12px] uppercase tracking-[0.14em] text-ink/60">Cloud gateways</th>
                  <th className="text-left py-4 pl-6 font-medium text-[12px] uppercase tracking-[0.14em] text-ink/60">DLP tools</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Runs inside cryptographic enclave", true, false, false],
                  ["Detects 44+ India-specific entities", true, "Partial", false],
                  ["DPDP Act 2023 control mapping", true, false, "Partial"],
                  ["Tokens never leave the device", true, false, false],
                  ["Signed audit trail (ed25519)", true, "Partial", true],
                  ["Works with ChatGPT, Claude, Gemini", true, true, false],
                ].map(([label, a, b, c]) => (
                  <tr key={String(label)} style={{ borderTop: "1px solid hsl(var(--ink) / 0.06)" }}>
                    <td className="py-4 pr-6 font-body text-ink">{label}</td>
                    <td className="py-4 px-6 bg-teal-wash text-teal-deep font-medium">
                      {a === true ? "✓" : a === false ? "—" : a}
                    </td>
                    <td className="py-4 px-6 text-ink/50">{b === true ? "✓" : b === false ? "—" : b}</td>
                    <td className="py-4 pl-6 text-ink/50">{c === true ? "✓" : c === false ? "—" : c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="border-b border-cream-soft surface-dark">
        <div className="container py-[100px] max-w-5xl">
          <div className="section-label">Customer story</div>
          <blockquote className="display-serif text-[32px] sm:text-[40px] lg:text-[48px] leading-[1.15] text-cream">
            "We rolled Arbiter to 1,400 clinicians in eleven days.
            Discharge summary times dropped 38% and our DPDP audit
            findings on AI use went from <em className="not-italic text-mustard">23</em> to{" "}
            <em className="not-italic text-teal-light">zero</em>."
          </blockquote>
          <div className="mt-10 flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-cream/15" />
            <div className="font-sans text-[14px] text-cream">Dr. Anjali Rao</div>
            <span className="font-sans text-[14px] text-cream/50">CMIO, Apex Care Hospitals · Bengaluru</span>
          </div>
        </div>
      </section>

      {/* KEY STATS */}
      <section id="compliance" className="surface-cream relative border-b border-ink-soft">
        <div className="grain-cream pointer-events-none absolute inset-0" />
        <div className="container py-[100px] relative">
          <div className="section-label"><span className="rule-teal" />By the numbers</div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4">
            {[
              { v: "<200", u: "ms",    l: "Median overhead", hl: false },
              { v: "44",   u: "+",     l: "India-specific entities", hl: false },
              { v: "0",    u: "",      l: "Bytes raw PII egressed", hl: true },
              { v: "99.9", u: "%",     l: "Enclave uptime target", hl: false },
            ].map((s, i) => (
              <div
                key={s.l}
                className="px-8 py-2"
                style={{ borderLeft: i === 0 ? "none" : "1px solid hsl(var(--ink) / 0.10)" }}
              >
                <div
                  className={`display-serif text-teal-deep leading-none ${s.hl ? "text-[80px] lg:text-[88px]" : "text-[64px] lg:text-[72px]"}`}
                  style={s.hl ? { color: "#0F6B5E" } : undefined}
                >
                  {s.v}<span className="font-sans text-[24px] text-ink/40 ml-1 align-middle">{s.u}</span>
                </div>
                <div className="mt-3 font-sans text-[11px] uppercase tracking-[0.14em] text-teal-deep">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section>
        <div className="container py-[100px]">
          <div className="max-w-3xl">
            <div className="section-label">Pilot</div>
            <h2 className="display-serif text-[40px] lg:text-[56px] text-cream leading-[1.1]">
              Sovereign AI starts with<br/>sovereign data.
            </h2>
            <p className="mt-6 font-body text-[18px] leading-[1.6] text-cream/85 max-w-[520px]">
              Run a 30-day pilot on up to 25 seats. We deploy the enclave, map your top three
              policies, and hand over a compliance-ready report.
            </p>
            <p className="mt-4 font-sans text-[14px] text-cream/50">
              Starting at ₹75,000 for 30 days · up to 50 seats
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/dashboard" className="btn-primary">
                Start free pilot <span className="arrow">→</span>
              </Link>
              <a href="#" className="btn-outline-cream">Talk to security team</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-cream-soft surface-mid">
        <div className="container py-12 flex flex-wrap items-center justify-between gap-6">
          <Logo variant="arbiter" tone="cream" size="sm" />
          <div className="font-sans text-[12px] text-cream/55 flex flex-wrap gap-6">
            <a href="#" className="hover:text-cream">Docs</a>
            <a href="#" className="hover:text-cream">Trust center</a>
            <a href="#" className="hover:text-cream">Status</a>
            <Link to="/" className="hover:text-cream">Foretyx</Link>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="font-mono text-[11px] text-cream/30">
              enclave: attested · pcr0: [live] · 0 bytes egressed
            </div>
            <div className="font-sans text-[11px] uppercase tracking-[0.14em] text-cream/40">
              © 2026 Foretyx · Bengaluru
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Arbiter;
