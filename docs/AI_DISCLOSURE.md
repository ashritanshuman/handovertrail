# AI & Tooling Disclosure

In accordance with hackathon transparency guidelines, this document outlines all AI models, SDKs, and developer tools utilized in the creation and runtime operation of **HandoverTrail**.

---

## 1. Runtime AI System
- **Provider**: Anthropic
- **Model**: `claude-sonnet-5-5` (configured via `LLM_MODEL` env variable, fallback to `claude-3-5-sonnet-20241022`)
- **Integration Approach**:
  - Structured extraction utilizing Anthropic tool-use / JSON-schema generation.
  - The model outputs typed claims accompanied by source locations and exact quotes.
- **Verification Rule**:
  - Deterministic Python code (`app/services/verify.py`) inspects and validates all LLM outputs against ingested evidence units. The LLM is never trusted to verify its own claims.

---

## 2. Developer Assistance Tools
- **Antigravity AI Pair Programmer**: Used for rapid project scaffolding, boilerplate creation, schema consistency verification, and test writing during the 72-hour development cycle.
- **Human Authorship**:
  - All architecture designs, trust principles, permission filtering logic, planted synthetic scenarios, and system integration were designed, guided, reviewed, and finalized by Team TchieSharks.

