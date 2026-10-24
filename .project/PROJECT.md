# Project Definition & Core Scope: dx-v2.0

---

## 📌 Project Identity

* **Project Name**: dx-v2.0 (Social Impact Platform v2.0)
* **Repository Root**: `/home/dino/Documents/Coding/Freelance/dx-v2.0`
* **Domain**: Social Impact, Institutional Research Grants, NGO Accreditation, Double-Entry Financial Tracking, and Transparent Philanthropy.

---

## 🎯 Core Objectives & Value Proposition

**dx-v2.0** is designed to solve critical pain points in the social impact and research grant lifecycle:

1. **Double-Entry Financial Integrity**: Prevents fund leakage and balance discrepancies by enforcing immutable double-entry accounting (`ledger_entries`) for every donation, wallet top-up, and milestone grant disbursement.
2. **High-Scale Application Ingestion**: Ingests up to 20,000 application submissions per second using Express API gateway rate-limiting, Redis idempotency keys, and Kafka message command buffering.
3. **Automated Verification Pipeline**: Integrates AI OCR for document validation and government registry APIs (PAN, GST, CIN) to accredit organizations automatically.
4. **Hierarchical Multi-Tenancy**: Models complex organizational structures (e.g. main university -> campus chapter -> student club) using PostgreSQL `ltree` extensions and fine-grained Row-Level Security (RLS).
5. **Contextual Security Model**: Distinguishes between global platform roles (`User.role`: `USER`, `DONOR`, `ADMIN`) and contextual organization roles (`UserOrganization.role`: `ORG_ADMIN`, `RESEARCHER`, `MEMBER`).

---

## 🏗️ Core Architecture Overview

The system is organized into **12 Primary Core Services**:

1. **Auth Service**: User registration, login, JWT session management, Google & LinkedIn OIDC OAuth integrations, MFA.
2. **Organization Service**: Org CRUD, hierarchical ltree path resolution, capability configurations.
3. **Authorization Service**: Attribute & role-based privilege engine (ABAC/RBAC), RLS policy enforcement.
4. **Onboarding Service**: Workflow template engine, submission ingestion API, Kafka queue buffering.
5. **Verification Service**: Government registry connectors (PAN/GST/CIN), AI document OCR, Kafka retry loops & DLQs.
6. **Ledger & Wallet Service**: Double-entry ledger transactions, debit/credit triggers, wallet balance management.
7. **Donation Service**: Payment intent routing (Stripe/Razorpay), webhook reconciliation loops.
8. **Grant Service**: Milestone proposal reviews, scoring engine, disbursement triggers.
9. **Document Service**: AWS S3 pre-signed upload/download URLs, virus/malware scanning.
10. **Notification Service**: Asynchronous multi-channel messaging (Email via SES, SMS via Twilio, Push via Firebase).
11. **Search Service**: OpenSearch indexing, full-text and faceted search queries for grants and accredited NGOs.
12. **Reporting Service**: ClickHouse data warehouse sync, analytics dashboard metric aggregation.

---

## 🛠️ Technology Stack

| Tier | Technologies Used |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS (Neobrutalism Design Tokens), Shadcn UI, Swiper.js, Lucide Icons |
| **Backend Gateway** | Node.js, Express, Zod Schema Validation, Axios, JsonWebToken |
| **Databases** | PostgreSQL 16+ (Extensions: `ltree`, `citext`, `uuid-ossp`), Prisma ORM, ClickHouse |
| **Connection Pooling** | PgBouncer (Transaction Pooling Mode) |
| **Message Broker** | Apache Kafka (Topics: `onboarding-submissions`, `organization-events`, retry queues, DLQs) |
| **Caching & Locks** | Redis (Idempotency locks `SET NX`, user permission matrix TTL, tree cache) |
| **Search Engine** | OpenSearch Cluster |
