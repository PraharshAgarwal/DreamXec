# Architectural Decision Records (ADRs): dx-v2.0

---

## 📜 Log of Key Technical & Architectural Decisions

---

### 🔹 ADR-001: Double-Entry Ledger Accounting Engine
* **Status**: Accepted
* **Context**: Financial transactions involving public donations, corporate grants, and student wallet disbursements require 100% auditability and zero balance discrepancies.
* **Decision**: We adopt an **append-only double-entry ledger system**. Balances are never updated in-place (`UPDATE account SET balance = balance + X`). Instead, every transaction creates a `ledger_transaction` header and balanced `ledger_entries` (sum of debits equals sum of credits).
* **Consequences**: Complete protection against financial race conditions, audit trail compliance, zero deadlocks from balance column locks.

---

### 🔹 ADR-002: Kafka Command-Buffering for High Scale Ingestion
* **Status**: Accepted
* **Context**: Peak grant submission deadlines can generate upwards of 20,000 concurrent submissions per second, threatening to overflow PostgreSQL connection pools.
* **Decision**: The REST Gateway API (`/onboarding/apply`) validates payloads with Zod, checks Redis idempotency keys, and immediately enqueues requests into an Apache Kafka topic (`onboarding-submissions`), returning HTTP `202 Accepted`. Background worker pods consume events asynchronously.
* **Consequences**: Sub-15ms Gateway response times, predictable database load, resilience during traffic spikes.

---

### 🔹 ADR-003: PostgreSQL `ltree` for Organizational Hierarchies
* **Status**: Accepted
* **Context**: Organizations exist in complex nested hierarchies (University -> Faculty -> Department -> Student Club).
* **Decision**: We use the native PostgreSQL `ltree` extension (`hierarchy_path` column) instead of recursive adjacency lists or deeply nested documents.
* **Consequences**: Fast single-query tree traversals using ltree operators (`<@` for descendants, `@>` for ancestors), simplified sub-organization permissions.

---

### 🔹 ADR-004: Dual-Layered Role & Authorization Architecture
* **Status**: Accepted
* **Context**: Users can be general platform users while simultaneously holding president/admin rights within a specific student club or university chapter.
* **Decision**: Separate user identity into two distinct role layers:
  1. **Global System Role (`User.role`)**: `USER`, `DONOR`, `ADMIN`. Governs platform-wide capabilities.
  2. **Contextual Local Role (`UserOrganization.role`)**: `ORG_ADMIN`, `RESEARCHER`, `MEMBER`. Governs capabilities strictly within an organization boundary.
* **Consequences**: Prevents privilege escalation while allowing flexible multi-organization membership.

---

### 🔹 ADR-005: Neobrutalism + Oil-Pastel Visual Design System
* **Status**: Accepted
* **Context**: The platform UI needs to stand out, feel modern and engaging for young researchers, yet clean and trustworthy for corporate donors.
* **Decision**: Implement a custom **Neobrutalist + Oil-Pastel** design system featuring 3-5px solid navy frames, zero border radiuses on cards, hard directional offset box-shadows, saffron/green accents, and a subtle graph paper body background.
* **Consequences**: Distinct visual identity, high visual contrast, fast rendering without heavy layout shifts.
