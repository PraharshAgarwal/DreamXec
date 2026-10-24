# AI Coding Rules & Mandates for dx-v2.0

> **STRICT COMPLIANCE REQUIRED**: All AI assistants MUST adhere to these non-negotiable rules when modifying files in this codebase.

---

## 🚫 Rule 1: Financial Balance Mutation Prohibition
* **NEVER** write code that directly updates balance columns in SQL (e.g. `UPDATE accounts SET balance = balance + 100`).
* **ALWAYS** execute financial movements by writing a `ledger_transaction` and matching `ledger_entries` (where sum of debits equals sum of credits) inside an ACID PostgreSQL transaction.

---

## 🛡️ Rule 2: Mandatory Payload Validation
* **NEVER** trust client inputs in Express routes.
* **ALWAYS** define a Zod validation schema (in `server/src/dto/` or controller handlers) and validate `req.body` before processing logic.

---

## 🔑 Rule 3: Enforce Idempotency on State Mutations
* **NEVER** expose state-mutating endpoints (`POST`, `PUT`, `PATCH`) without checking for an `Idempotency-Key` header.
* **ALWAYS** check Redis before execution: `SET idempotent:{domain}:{key} IN_PROGRESS NX EX 86400`. Return `409 Conflict` if duplicate request is detected.

---

## 🎨 Rule 4: Neobrutalist & Card-Like UI Architecture
* **ALWAYS** review the documentation suite in [`docs/ui/`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/docs/ui/) (`DESIGN_SYSTEM.md`, `COMPONENTS.md`, `LAYOUTS.md`, `COLORS.md`, `TYPOGRAPHY.md`) before making UI changes.
* **NEVER** use generic rounded corners (`rounded-xl`), soft blurred drop shadows (`shadow-xl`), or unstyled flat containers for primary views.
* **ALWAYS** structure UI components using a **card-like architecture** (`.card-pastel`, `.card-pastel-offwhite`, `.card-glass`, `.scroll-stack-card`) featuring 3-5px solid navy frames (`border-4 border-dreamxec-navy`), hard offset directional shadows (`4px 4px 0 #003366`), and tricolor accent tag headers (`.card-tricolor-tag`).

---

## 📜 Rule 5: File & Symbol Links in Responses
* **ALWAYS** create clickable GitHub-style markdown links using the `file://` scheme when referencing files or code symbols in responses (e.g. [`server.js`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/server/server.js)).

---

## ✅ Rule 6: Runtime Verification Before Task Completion
* **NEVER** claim a feature is complete or a bug is fixed without running linting, build checks, or test scripts (`npm test`, `tsc`, or manual execution verification).

---

## ❓ Rule 7: Mandatory Requirement Clarification & Interactive Alignment (Grill-Me Protocol)
* **ALWAYS** ask clarifying follow-up questions for requests to gain a deep, accurate understanding of task requirements, business logic, edge cases, and design preferences.
* **USE INTERACTIVE ALIGNMENT (`/grill-me`)**: Recommend using the `/grill-me` workflow or perform a structured interactive interview whenever there are design choices, underspecified details, or complex architectural decisions to align on before writing code.
