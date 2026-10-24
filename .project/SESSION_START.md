# AI Session Initialization & Context Startup Guide

> **IMPORTANT FOR AI AGENTS**: Read this file at the start of every session before analyzing or editing any files in the workspace.

---

## 🚀 Welcome to dx-v2.0 (Social Impact Platform v2.0)

**dx-v2.0** is an enterprise-grade, microservice-ready Social Impact Platform connecting universities, researchers, NGOs, corporate donors, and regulatory bodies.

---

## 📋 Session Checklist for AI Assistants

Before writing code or executing shell commands, complete the following steps:

1. **Review Project Context & Knowledge Items (KIs)**:
   * Inspect [`/.project/PROJECT.md`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/.project/PROJECT.md) for overall vision, stack, and goals.
   * Check [`/.project/CURRENT_STATE.md`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/.project/CURRENT_STATE.md) for recent active features, active phase, and completed milestones.
   * Review [`/.project/AI_RULES.md`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/.project/AI_RULES.md) and [`/.project/CONSTRAINTS.md`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/.project/CONSTRAINTS.md) for non-negotiable coding guardrails.

2. **Understand Repository Layout**:
   * `server/`: Express API gateway, Prisma ORM, Kafka producers/consumers, Zod schemas, PostgreSQL handlers.
   * `client/`: React + TypeScript + Vite frontend, Neobrutalist design system (`tailwind.config.js`, `src/index.css`), UI components.
   * `docs/`: System documentation including [`ARCHITECTURE.md`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/docs/ARCHITECTURE.md), [`API.md`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/docs/API.md), [`DATABASE.md`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/docs/DATABASE.md), [`CODING_STANDARDS.md`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/docs/CODING_STANDARDS.md), and UI design specs under `docs/ui/`.
   * `specs/`: Feature specifications and requirements (e.g., [`specs/onboarding/REQUIREMENTS.md`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/specs/onboarding/REQUIREMENTS.md)).

3. **Enforce Financial & Architectural Safety Rules**:
   * **Double-Entry Ledger Engine**: Never mutate balances directly in SQL (`UPDATE balance SET amount = ...`). All financial moves MUST append matching debit/credit entries in `ledger_entries`.
   * **Idempotency**: Every mutating API endpoint must enforce `Idempotency-Key` headers backed by Redis (`SET key IN_PROGRESS NX EX 86400`).
   * **Multi-Tenant Access**: Enforce global role (`User.role`) vs local org role (`UserOrganization.role`) context separation with PostgreSQL Row-Level Security (RLS).
   * **UI Review & Card-Like Architecture**: For any UI changes, review the separate [`docs/ui/`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/docs/ui/) folder (`DESIGN_SYSTEM.md`, `COMPONENTS.md`, `LAYOUTS.md`, `COLORS.md`, `TYPOGRAPHY.md`) and ensure all layouts strictly follow a **card-like architecture** (`.card-pastel`, `.card-pastel-offwhite`, `.card-glass`, 3-5px solid navy frames, hard offset shadows, tricolor tags).

4. **Requirement Clarification & Interactive Alignment (`/grill-me`)**:
   * For every request, ask clarifying follow-up questions to understand task details, business logic, edge cases, and design intent.
   * Recommend using the `/grill-me` workflow or conduct an interactive interview to align on underspecified requirements before writing code.

5. **Verification Requirement**:
   * Never declare victory without testing code changes (`npm test`, build scripts, or manual verification).
