# Foretyx Guardian & Arbiter · Enterprise AI Security Platform

<p align="center">
  <strong>Securing AI. Not using it.</strong><br/>
  Enterprise AI security research, zero-knowledge cryptographic enclaves, and DPDP Act 2023 compliance governance.
</p>

---

## Overview

**Foretyx** is an independent AI security research firm and enterprise software suite. **Arbiter** is Foretyx's flagship enterprise AI security gateway. Every prompt and data payload is processed inside a hardware-attested **Trusted Execution Environment (TEE) enclave** before reaching external LLMs, ensuring **zero raw PII egress**.

### Key Highlights
- **Arbiter Security Enclave**: Hardware-attested TEE tokenization preventing PII leaks across 44+ India-specific entities (Aadhaar, PAN, ABHA ID, IFSC, and financial records).
- **Interactive Security Research Library**: Complete catalog of peer-reviewed threat models, CVE disclosures (e.g., CVE-2026-1184), and red-teaming methodologies with **spec-compliant Adobe Acrobat PDF downloads**.
- **Modern High-Performance Stack**: Built with React 18, TypeScript, Vite, Tailwind CSS, Radix UI / shadcn components, and TanStack Query.
- **Compliance & Audit Console**: Live telemetry, rule policy enforcement, hardware key management, and complete audit logging.

---

## Repository Structure

```text
foretyx-guardian/
├── src/
│   ├── components/
│   │   ├── AllPapersDialog.tsx     # Full research library dialog & search filter
│   │   ├── PaperReaderDialog.tsx   # Interactive research paper reader modal
│   │   ├── AppShell.tsx            # Main console application shell & sidebar
│   │   ├── DataFlowDiagram.tsx     # Enclave data flow diagram component
│   │   └── ui/                     # Radix UI / shadcn component library
│   ├── lib/
│   │   ├── pdfGenerator.ts         # Spec-compliant PDF generator using jsPDF
│   │   └── utils.ts                # Class merging & utility helpers
│   ├── pages/
│   │   ├── Landing.tsx             # Foretyx firm landing page & research catalog
│   │   ├── Arbiter.tsx             # Arbiter product page & attestation specs
│   │   ├── Dashboard.tsx           # Security console dashboard & telemetry
│   │   ├── Policies.tsx            # PII masking & rule builder policies
│   │   ├── Devices.tsx             # Local data plane & enclave device manager
│   │   ├── Audit.tsx               # Compliance audit log & event streams
│   │   ├── Settings.tsx            # Workspace configuration & key management
│   │   └── Login.tsx               # SSO & hardware key security login
│   ├── App.tsx                     # Main application router
│   └── main.tsx                    # Application entry point
├── package.json
└── vite.config.ts
```

---

## Technology Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) / [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Management**: [TanStack Query](https://tanstack.com/query/latest)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) (Adobe Acrobat Compliant)

---

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/rishiii183/Arbiter.git
cd Arbiter
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```

The application will launch at `http://localhost:8080` (or `http://localhost:5173`).

### 4. Build for production
```bash
npm run build
```

---

## License & Attestation

- Research publications released under **Creative Commons BY-NC 4.0**.
- Software components licensed under **MIT License**.
- © 2026 Foretyx Security Research · Bengaluru, India.
