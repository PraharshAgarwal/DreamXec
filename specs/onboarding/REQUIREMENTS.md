# Feature Specification & Requirements: Onboarding Engine

---

## 🎯 Feature Overview

The **Onboarding Engine** manages the multi-tenant accreditation and registration of non-profit organizations (NGOs), university research departments, and corporate partners.

---

## 📋 Functional Requirements

### 1. Application Ingestion API
* **Endpoint**: `POST /api/onboarding/apply`
* **Concurrency Requirement**: Must buffer up to 20,000 requests/sec into Kafka topic `onboarding-submissions`.
* **Idempotency**: Must enforce `Idempotency-Key` header with 24-hour Redis TTL lock.
* **Validation**: Request body must conform to `applicationSchema` (Email, Full Name, Org Type, Registry Credentials).

### 2. State Machine Workflow Transitions
Workflow instances transition through the following states:
```
[ Draft ] ──> [ Submitted ] ──> [ In Verification ] ──> [ Approved / Rejected ]
                                       │
                                       ▼
                       [ External Registry Checks ]
                       (PAN / GST / CIN / Domain AI)
```

### 3. Automated Verification Checks
* **PAN Registry Validation**: Verify NGO tax registration number against mock/government registry.
* **Domain & Email Check**: Confirm applicant email domain matches verified institution MX records.
* **AI Document OCR**: Extract organizational incorporation details from uploaded PDF certificates.

### 4. Admin Sign-Off & Activation
* Authorized compliance officers (`onboarding:approve` permission) review flagged applications.
* Upon approval, system updates organization status to `ACTIVE`, creates tenant workspace, and dispatches activation Kafka event.

---

## 🧪 Acceptance Criteria

1. **Idempotency Test**: Submitting duplicate requests with identical `Idempotency-Key` headers must return `409 Conflict` on the second call.
2. **Kafka Buffering Test**: Gateway latency under a load of 10,000 requests/second must remain below 15ms.
3. **Double Approval Prevention**: Applications in `APPROVED` state cannot be mutated by review endpoints.
