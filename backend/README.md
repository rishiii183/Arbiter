<div align="center">

<br/>

# 🛡️ Foretyx Data Plane

### Zero-trust AI security gateway for enterprise LLM workloads.

**Every prompt validated. Every response sanitized. Every failure closed.**

<br/>

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Security](https://img.shields.io/badge/Security-Fail--Closed-DC2626?style=for-the-badge&logo=shield&logoColor=white)]()
[![TEE](https://img.shields.io/badge/Execution-TEE%20Enclave-7C3AED?style=for-the-badge)]()
[![Ollama](https://img.shields.io/badge/Consensus-Ollama%20LLM-F97316?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

**[🤔 The Problem](#-the-problem) · [🏗 Architecture](#-architecture) · [🛡️ Pipeline](#️-multi-phase-guard-pipeline) · [⚙️ Setup](#️-setup) · [🧪 Testing](#-testing)**

</div>

---

## 🤔 The Problem

Enterprises deploying LLMs face a threat surface that traditional security tools weren't built for:

- **Prompt injection** bypasses application-layer logic and hijacks model behavior
- **PII leakage** passes undetected through unguarded LLM inputs and outputs
- **Jailbreaks** exploit model alignment to bypass policy and safety constraints
- **Multi-turn attacks** evade per-request scanning by spreading malicious intent across sessions
- **Model responses** can expose system prompts, internal data, and synthetic placeholders

Bolting security onto LLMs after deployment doesn't work. Foretyx enforces it at the gateway — before any request reaches a model, and before any response reaches a user.

---

## ✅ What Foretyx Does

Foretyx sits as an intelligent proxy between your users and downstream LLMs (Gemini, Llama, and others). Every interaction passes through a **multi-stage, fail-closed security pipeline** before reaching the model — and every model response is scanned before delivery.

```
User Request
      │
      ▼
┌─────────────────────────────────┐
│        Foretyx Data Plane       │
│                                 │
│  T1: Deterministic Guard        │  ← <2ms fast-path rejection
│  T2: PII Detection & Pseudonym  │  ← AES-256-GCM in-memory only
│  T3: Hybrid Intelligence        │  ← ONNX DistilBERT + session scoring
│  T4: Semantic Consensus (cond.) │  ← Local LLM, fail-closed fallback
│  Output Guard                   │  ← Response scanning before delivery
│                                 │
│  [TEE Enclave — isolated]       │
└──────────────┬──────────────────┘
               │
               ▼
        Downstream LLM
     (Gemini / Llama / etc.)
```

---

## 🏗 Architecture

### Secure Execution Environment

All sensitive processing happens inside a **Trusted Execution Environment (TEE)**:

- No external network access during sensitive operations
- No disk persistence of sensitive data
- Strict VSOCK-only communication
- Cryptographic isolation from host

Sensitive data never leaves controlled execution boundaries — not even to disk.

### Design Principles

| Principle | Implementation |
|---|---|
| **Fail-closed** | No component failure results in unsafe execution |
| **Zero-trust** | Every request treated as untrusted regardless of origin |
| **Defense in depth** | Four independent guard stages — any stage can block |
| **End-to-end** | Both input and output are independently protected |
| **Session-aware** | Multi-turn attack patterns detected across requests |
| **Deterministic** | Consistent enforcement — no probabilistic allow/block decisions |

---

## 🛡️ Multi-Phase Guard Pipeline

### T1 — Deterministic Guard Layer
**Latency: <2ms**

Fast-path rejection of known adversarial patterns before any ML inference:

- Regex + OWASP LLM Top 10 detection
- Unicode normalization and encoded payload checks
- Jailbreak template detection
- Prompt manipulation and instruction override detection

### T2 — PII Detection & Pseudonymization

Detects and neutralizes sensitive data before it reaches the model:

- Detects Aadhaar, PAN, emails, API keys, tokens, and structured identifiers
- Combines pattern matching, NER, and custom recognizers
- Replaces entities with synthetic placeholders
- AES-256-GCM encrypted in-memory placeholder mapping

**Security guarantees:**
- Original values never leave enclave memory
- Placeholder mappings are ephemeral and fail-closed
- Deterministic restoration during response rehydration prevents placeholder leakage

### T3 — Hybrid Intelligence & Policy Layer

Catches attacks that isolated prompt scanning misses:

- Hybrid deterministic + ML-assisted decision pipeline
- ONNX DistilBERT semantic risk scoring
- Session anomaly scoring for multi-turn attack detection
- Multilingual detection — Hindi / Hinglish patterns included
- Policy-based enforcement: ALLOW / BLOCK / ESCALATE

### T4 — Semantic Consensus Layer *(Conditional)*

Applied selectively for ambiguous or escalated cases:

- Local LLM security evaluator (Ollama / Gemma-based)
- Higher-level semantic reasoning for novel or subtle attacks
- Timeout or uncertainty → automatic fail-closed fallback
- Never used as the sole decision layer

### Output Guard

Model responses are scanned before delivery. Blocks:

- PII leakage in model output
- Prompt leakage and system prompt exposure
- Placeholder leakage from PII pseudonymization
- Unsafe or policy-violating content

---

## ⚖️ Decision System

```
Every Request
      │
      ├─ High-risk detected    → BLOCK  (immediate, no escalation)
      ├─ Ambiguous / uncertain → ESCALATE → T4 Consensus → BLOCK if unresolved
      └─ Safe                  → ALLOW  (fast path)
```

Foretyx operates in **strict fail-closed mode**. Uncertain state is never resolved to ALLOW.

---

## ⚙️ Setup

### Environment Variables

```env
GEMINI_API_KEY=your_key_here
OLLAMA_MODEL=foretyx-guard
CONSENSUS_OLLAMA_ALWAYS=true
FAIL_BEHAVIOR=CLOSED
```

### Run with Docker *(Recommended)*

```bash
docker-compose up --build
```

### Manual Startup

```bash
# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Start local consensus model
ollama run foretyx-guard

# Start gateway
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 🧪 Testing

Foretyx ships with a **50-prompt validation suite** covering the full threat surface:

```bash
python tests/test_50_final.py
```

**Coverage:**

| Category | What's Tested |
|---|---|
| System health | Gateway startup, enclave connectivity, component readiness |
| Benign enterprise prompts | Legitimate requests pass through correctly |
| Prompt injection | Direct and indirect injection attempts |
| Semantic violations | Policy-violating content at the meaning level |
| PII detection accuracy | Aadhaar, PAN, emails, API keys, tokens |
| Encoded attack patterns | Unicode variants, base64, obfuscated payloads |
| Edge cases | Boundary conditions, partial matches, multilingual inputs |

---

## 🔒 Security Properties

| Property | Guarantee |
|---|---|
| **Fail-closed design** | No component failure produces an unsafe allow decision |
| **TEE isolation** | Sensitive data never leaves enclave memory |
| **End-to-end guarding** | Input and output independently protected |
| **Session awareness** | Multi-step attack behavior detected across turns |
| **Multilingual defense** | Real-world language variation handled (Hindi / Hinglish) |
| **Deterministic rehydration** | Placeholder restoration is unambiguous and leak-proof |
| **Ephemeral mappings** | PII placeholder maps are never persisted |

---

## ⚠️ What Foretyx Is Not

- **Not a replacement for model alignment** — Foretyx is a gateway layer, not a substitute for responsible model training
- **Not a WAF** — purpose-built for LLM threat patterns, not generic HTTP attack surface
- **Not a logging tool** — security enforcement is the function; observability is a downstream concern
- **Not probabilistic** — every enforcement decision is deterministic and replayable

---

<div align="center">

*Developed by the Foretyx AI Security Team*

</div>
