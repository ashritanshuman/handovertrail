# Changes & Architectural Decisions from Initial Plan

This document tracks intentional architectural choices, optimizations, and minor changes from the initial hackathon brief to ensure zero delivery risk within the 72-hour timeline.

---

## 1. Simulation of Authentication via `X-User-Id`
- **Initial Context**: Need role-based authorization between leaver, lead, and successor without burdening hackathon evaluators with email sign-ups, password resets, or JWT expiry friction.
- **Decision**: Implemented an explicit `X-User-Id` request header with server-side resolution against seeded users (`riya`, `maya`, `arjun`).
- **Rationale**: Enables immediate switching via a UI pill bar in the frontend so judges can instantly witness permission filtering in action without opening three incognito tabs.

---

## 2. Dual-Engine Extraction (Claude + Deterministic Seed Cache)
- **Initial Context**: Extraction relies on Anthropic's Claude Sonnet API.
- **Decision**: The backend implements both live Anthropic Claude tool extraction and a deterministic fallback seed cache (`use_cache=True` by default or when API key is missing).
- **Rationale**: Guarantees that hackathon evaluation, continuous integration, and local testing never fail due to API rate limits, network outages, or missing API keys, while still preserving full live LLM extraction capabilities when an API key is provided.

---

## 3. Single-Service Render Architecture
- **Initial Context**: Independent frontend (Vite) and backend (FastAPI) applications.
- **Decision**: Configured production builds where FastAPI serves the compiled React assets from `frontend/dist` with an SPA HTML fallback router, alongside standard CORS support for local development.
- **Rationale**: Eliminates cross-origin cookie/header issues on deployed cloud environments and provides evaluators with a single unified URL.

---

## 4. Deterministic Verification vs Generative Self-Correction
- **Initial Context**: Ensuring claims match evidence units.
- **Decision**: The verification engine is written entirely in deterministic Python logic (exact quote containment, whitespace normalization, conflict matching).
- **Rationale**: "Never let an LLM grade its own homework." Strict deterministic code ensures that status `verified` cannot be hallucinated.
