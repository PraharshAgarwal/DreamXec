# System Constraints & Boundary Limits: dx-v2.0

---

## ⚡ Performance & Scale Boundaries

* **Gateway Response Latency**: Must remain under **15ms** for ingestion endpoints (`POST /onboarding/apply`).
* **Ingestion Concurrency Limit**: Designed to sustain **20,000 requests/second** via Kafka buffering.
* **Database CPU Threshold**: PostgreSQL node CPU utilization must remain below **60%** under peak load.

---

## 🛢️ Database & Connection Constraints

* **Connection Pool Limitation**: Direct database connections are forbidden in worker pods. All connections MUST route through **PgBouncer** in **Transaction Pooling Mode**.
* **Max Connections**: Capped at **50 active connections** per service pod.
* **Idle Transaction Timeout**: `idle_transaction_timeout = 5000ms` (Transactions automatically killed after 5 seconds of inactivity).

---

## 📦 Payload & Upload Boundaries

* **Maximum File Upload Size**: 50 MB per document (enforced at Presigned S3 Gateway).
* **S3 Presigned URL Expiry**: Presigned upload/download URLs expire after **15 minutes**.
* **Redis Key TTL**: Idempotency locks expire after **24 hours** (`86400 seconds`). User permission cache keys expire after **15 minutes** (`900 seconds`).

---

## 🔒 Compliance & Security Constraints

* **Row-Level Security (RLS)**: Every multi-tenant database table MUST include `tenant_id` and have PostgreSQL RLS enabled.
* **Data Retention**: Financial transaction logs in `ledger_entries` must never be purged or updated.

---

## 🎨 UI Architecture & Design Constraints

* **Mandatory UI Folder Review**: Before implementing or altering any UI components, layouts, or styles, AI agents MUST review the separate [`docs/ui/`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/docs/ui/) documentation suite:
  - [`DESIGN_SYSTEM.md`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/docs/ui/DESIGN_SYSTEM.md) - Neobrutalist rules & oil-pastel tokens
  - [`COMPONENTS.md`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/docs/ui/COMPONENTS.md) - Card catalog, buttons, badges, modals
  - [`LAYOUTS.md`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/docs/ui/LAYOUTS.md) - Grid systems & card-based page layouts
  - [`COLORS.md`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/docs/ui/COLORS.md) - Saffron/Navy/Green palette scale
  - [`TYPOGRAPHY.md`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/docs/ui/TYPOGRAPHY.md) - Font stacks & text effects

* **Card-Like Architecture Enforcement**: All frontend views, dashboards, forms, metrics, and content sections MUST follow a strict **card-like architecture**. UI components must be modularly structured using Neobrutalist card containers (`.card-pastel`, `.card-pastel-offwhite`, `.card-glass`, `.scroll-stack-card`) featuring:
  - Solid 3px to 5px borders (`border-4 border-dreamxec-navy`)
  - Hard offset directional shadows (`box-shadow: 4px 4px 0 #003366`, `6px 6px 0 #FF7F00`)
  - Signature tricolor accent tag headers (`.card-tricolor-tag`)
  - Modular card grids and stacked layout wrappers (`ScrollStack.tsx`, grid cards)

---

## ❓ Interactive Requirement Alignment & Grill-Me Protocol

* **Mandatory Follow-Up Questions**: For every user request, AI agents MUST ask clarifying follow-up questions to uncover underspecified requirements, confirm design choices, and validate architectural impacts.
* **Slash Command Alignment (`/grill-me`)**: Recommend and utilize the `/grill-me` interactive interview workflow to resolve ambiguities before embarking on multi-file modifications or feature development.

