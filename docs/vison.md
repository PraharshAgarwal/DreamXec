# Project Vision & Strategic Roadmap: Social Impact Platform (dx-v2.0)

*(Note: Primary documentation file is maintained at [`vision.md`](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/docs/vision.md))*

---

## 🎯 Executive Summary

**dx-v2.0** (Social Impact Platform v2.0) is a high-scale, enterprise-grade digital ecosystem built to transform how academic institutions, non-profit organizations (NGOs), corporate donors, researchers, and regulatory authorities collaborate, disburse grants, and measure social impact. 

By unifying double-entry accounting integrity, automated AI-driven verification pipelines, fine-grained access control, and asynchronous microservice architecture, **dx-v2.0** provides an auditable, transparent, and resilient backbone for social impact initiatives globally.

---

## 🌟 Core Mission & Strategic Goals

```
                        ┌──────────────────────────────────────────┐
                        │      dx-v2.0 Social Impact Engine        │
                        └────────────────────┬─────────────────────┘
                                             │
      ┌──────────────────────┬───────────────┴──────────────┬──────────────────────┐
      ▼                      ▼                              ▼                      ▼
┌───────────┐      ┌───────────────────┐          ┌───────────────────┐  ┌───────────────────┐
│ Trust &   │      │ Financial         │          │ Enterprise        │  │ Seamless          │
│ Verified  │      │ Integrity         │          │ Scalability       │  │ Governance        │
│ Onboarding│      │ Double-Entry      │          │ 20K+ Ops/Sec      │  │ Multi-Tenant      │
└───────────┘      └───────────────────┘          └───────────────────┘  └───────────────────┘
```

1. **Automate Organizational Trust**: Streamline NGO, university, and corporate partner onboarding through automated document OCR, government registry verification (PAN, GST, CIN), and state-machine-driven compliance workflows.
2. **Uncompromising Financial Integrity**: Eliminate balance discrepancies and fraud by backing every transaction, grant allocation, and wallet transfer with an immutable, append-only **double-entry ledger engine** (debits match credits).
3. **High Concurrency & Event-Driven Scale**: Engine design capable of buffering and processing over **20,000 requests/second** without database saturation, utilizing Kafka command queues, Redis caching/idempotency locks, and PgBouncer connection pooling.
4. **Context-Aware Zero-Trust Security**: Provide dynamic access control distinguishing a user's global system identity (`User.role`) from organization-scoped contextual privileges (`UserOrganization.role`), enforced down to PostgreSQL Row-Level Security (RLS).
5. **Data-Driven Impact Discovery**: Offer real-time analytics, faceted search capabilities (OpenSearch), and audit-ready data reporting (ClickHouse) for donors and regulatory bodies.

---

## 🏛️ Key Architectural Pillars

The platform is structured into **12 Primary Core Services**, designed for modularity, horizontal scalability, and fault tolerance:

| Service | Primary Responsibility | Key Technologies |
| :--- | :--- | :--- |
| **1. Auth Service** | User identity, OAuth2 (Google, LinkedIn), MFA, and JWT session lifecycle | Node.js / Express, Redis, PostgreSQL |
| **2. Organization Service** | Hierarchical organizational structures (`ltree`), capability matrix, dynamic tree traversal | PostgreSQL (`ltree`), Redis Tree Cache |
| **3. Authorization Service** | Contextual ABAC/RBAC privilege enforcement (Global vs Org-local permissions) | Permission Matrix, Redis Cache, RLS |
| **4. Onboarding Service** | Workflow template execution, application ingestion, and Kafka command buffering | Kafka, Express, Zod, Redis Idempotency |
| **5. Verification Service** | Multi-channel verification (Email, AI OCR, Government registry integrations) | Government APIs, Kafka Retry Queues, S3 |
| **6. Ledger & Wallet Service** | Double-entry accounting compliance engine, balance calculations, grant wallet management | PostgreSQL ACID Transactions, Deferred Triggers |
| **7. Donation Service** | Payment Gateway routing (Stripe/Razorpay), webhook processing, financial ledger dispatch | Stripe API, Razorpay Webhooks, Redis Locks |
| **8. Grant Service** | Proposal scoring, reviewer assignment, milestone tracking, and disbursement triggers | State Machine, PostgreSQL |
| **9. Document Service** | Blob storage presigned URLs, document scanning, retention enforcement | S3 Presigned URLs, Malware Scanners |
| **10. Notification Service** | Asynchronous dispatching across Email (SES), SMS (Twilio), Push (Firebase) | Kafka Consumer, AWS SES, Twilio |
| **11. Search Service** | Full-text, faceted discovery of campaigns, grants, and accredited organizations | OpenSearch Cluster, Kafka Sync Workers |
| **12. Reporting Service** | Real-time metric compilation, analytics dashboards, warehouse sync | ClickHouse, Materialized Views |

---

## 👥 Personas & Platform Value Proposition

### 🎓 Universities & Research Institutions
* **Parent-Child Hierarchy**: Support for main university entities, campus chapters, and student clubs (e.g., Coding Club under NIT Kurukshetra).
* **Research Grants**: Simplified application, proposal scoring, and milestone-tracked funding.

### 🏢 NGOs & Non-Profit Organizations
* **Fast-Track Accreditation**: Rapid onboarding via automated background checks and compliance verifications.
* **Transparent Wallet**: Direct grant receipts and clear double-entry statements for public accountability.

### 💳 Corporate Donors & Philanthropists
* **Direct Grant Routing**: Clear lineage of every dollar donated, from payment intent to milestone delivery.
* **Impact Analytics**: Consolidated dashboards summarizing active campaigns and verified field outcomes.

### 🛡️ Compliance & Regulatory Officers
* **Audit-Ready Ledgers**: Every financial movement logged with debit/credit balance validation.
* **Access Control**: Strict separation between admin rights and operational capabilities via fine-grained RLS policies.

---

## 🚀 Technology Stack

* **Frontend**: React, TypeScript, Vite, Tailwind CSS, Component Library (Shadcn/UI paradigm)
* **Backend Gateway & Services**: Node.js, Express, Zod validation schemas
* **Database & Persistence**: PostgreSQL (Extensions: `ltree`, `citext`, `uuid-ossp`), Prisma ORM, PgBouncer (Transaction pooling mode)
* **Event Broker & Buffering**: Apache Kafka (Topics: `onboarding-submissions`, `organization-events`, retry queues, DLQs)
* **Caching & Invalidation**: Redis (Idempotency locks `SET NX`, tree caching, user permissions TTL)
* **Search & Analytics**: OpenSearch (Discovery engine), ClickHouse (Data warehouse)

---

## 📅 Roadmap & Implementation Phases

```mermaid
gantt
    title dx-v2.0 Implementation & Execution Roadmap
    dateFormat  YYYY-MM-DD
    section Core Infrastructure
    Phase 1: DB Foundation, DDL & RLS Validation   :done, p1, 2026-07-20, 5d
    Phase 2: Ingestion API & Kafka Buffering        :active, p2, after p1, 6d
    Phase 3: Worker Engine & Workflow State Machine : p3, after p2, 7d
    section Verifications & Security
    Phase 4: AI OCR & Automated Registry Pipelines : p4, after p3, 8d
    Phase 5: Compliance Dashboard & Access Control   : p5, after p4, 5d
    section Scale & Quality Assurance
    Phase 6: Load Testing (20K RPS) & Chaos Testing : p6, after p5, 6d
```

1. **Phase 1: Database Foundation & RLS Validation**: Schema DDL, extension enablement (`ltree`, `citext`), and multi-tenant Row-Level Security assertion testing.
2. **Phase 2: Ingestion API & Kafka Buffering**: High-throughput `/onboarding/apply` endpoint, Redis idempotency keys, and Kafka message production.
3. **Phase 3: Worker Engine & State Machine**: Event-driven background workers parsing JSON workflow steps and driving state updates.
4. **Phase 4: Verification Pipeline**: Third-party API integrations (PAN/GST/CIN registries), document AI OCR execution, and DLQ exception handling.
5. **Phase 5: Admin Compliance Dashboard & Access Controls**: Management APIs, approval workflows, and Zanzibar-inspired permission middleware.
6. **Phase 6: Load, Stress, & Chaos Testing**: Verification under 20,000 requests/sec with k6, simulating DB node failovers and Redis cache flushes.
