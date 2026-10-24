# STAGE 1 & STAGE 2 IMPLEMENTATION & TESTING BLUEPRINT

> **Target Modules**:  
> - **Stage 1**: Identity & Access Management (IAM-1 to IAM-12 / IAM-001 to IAM-012)  
> - **Stage 2**: Organization & Ecosystem Management (ORG-1 to ORG-11 / ORG-001 to ORG-011)  
>  
> **PRD Source**: `DX-PHASE-2-PRD.pdf`  

---

## 🛡️ STAGE 1: Identity & Access Management (IAM)

### Subtask 1.1: Domain Auto-Detection & Role Pre-Filling (IAM-001)
* **What to do**:
  - Parse email domain (e.g. `anita.sen@iitd.ac.in` -> `iitd.ac.in`).
  - Query Prisma `Organization` table by `domain`.
  - Return organization details, custom brand colors (`#D0202F`), and unlocked roles (`PROFESSOR`, `RESEARCHER`, `STUDENT`).
* **Files to edit/create**:
  - [server/src/api/auth/auth.controller.js](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/server/src/api/auth/auth.controller.js) — Add `verifyDomain` handler.
  - [server/src/api/auth/auth.routes.js](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/server/src/api/auth/auth.routes.js) — Add `GET /api/auth/verify-domain`.
* **How to test**:
  ```bash
  curl -X GET "http://localhost:5000/api/auth/verify-domain?email=anita.sen@iitd.ac.in"
  ```
  *Expected Output*: `{ "status": "success", "data": { "verified": true, "organization": { "name": "IIT Delhi", "domain": "iitd.ac.in" }, "allowedRoles": ["PROFESSOR", "RESEARCHER", "STUDENT"] } }`.

---

### Subtask 1.2: Multi-Factor Authentication (2FA TOTP & Recovery Codes) (IAM-003 / IAM-5)
* **What to do**:
  - Generate TOTP secret and QR code URI using `speakeasy` and `qrcode`.
  - Generate 10 immutable single-use 8-character recovery scratch codes (`mfaScratchCodes`).
  - Update `login` flow: if `mfaEnabled == true`, return `{ status: "MFA_PENDING", mfaSessionId: "..." }`.
  - Validate TOTP token in `/api/auth/mfa/verify` before granting full JWT token access.
* **Files to edit/create**:
  - `server/src/services/mfa.service.js` *(NEW)* — TOTP helper routines.
  - [server/src/api/auth/auth.controller.js](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/server/src/api/auth/auth.controller.js) — Add `setupMFA`, `verifyMFA`, and MFA check inside `login`.
  - [server/src/api/auth/auth.routes.js](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/server/src/api/auth/auth.routes.js) — Add `POST /mfa/setup`, `POST /mfa/verify`.
* **How to test**:
  ```bash
  # 1. Setup 2FA
  curl -X POST http://localhost:5000/api/auth/mfa/setup -H "Authorization: Bearer <JWT_ACCESS_TOKEN>"
  # 2. Verify 6-digit TOTP code
  curl -X POST http://localhost:5000/api/auth/mfa/verify -H "Content-Type: application/json" -d '{"totpCode":"123456"}'
  ```

---

### Subtask 1.3: PBAC Permission Gating & Redis Permission Cache (IAM-004 / IAM-7)
* **What to do**:
  - Implement `requirePermission(permissionKey)` middleware.
  - Query role permissions from database and store compiled permissions list in Redis (`permissions:{userId}`) with a 10-minute TTL (`EX 600`).
  - Enforce strict `accountStatus` check (`ACTIVE`). Block `SUSPENDED` or `UNDER_REVIEW` users.
* **Files to edit/create**:
  - `server/src/middleware/auth.middleware.js` *(NEW/Update)* — `protect` & `requirePermission`.
  - `server/src/permissions/matrix.js` *(Update)* — System permission keys matrix.
* **How to test**:
  ```bash
  # Attempt privileged operation without permission:
  curl -X PATCH http://localhost:5000/api/user-projects/proj-101/budget \
    -H "Authorization: Bearer <STUDENT_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"budget": 500000}'
  ```
  *Expected Output*: `403 Forbidden` with response `{"status":"fail","message":"Access Denied: Inadequate privileges."}`.

---

### Subtask 1.4: Multi-Device Session Management & Live Remote Revocation (IAM-005 / IAM-6)
* **What to do**:
  - Record session footprint (`ipAddress`, `deviceAgent`, `location`, `tokenFamily`) on every login in `UserSession`.
  - Build `GET /api/auth/sessions` listing active devices.
  - Build `DELETE /api/auth/sessions/:sessionId` adding the token to Redis blacklist (`blacklist:{token}`).
* **Files to edit/create**:
  - [server/src/api/auth/auth.controller.js](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/server/src/api/auth/auth.controller.js) — Add `getActiveSessions`, `revokeSession`.
  - [server/src/api/auth/auth.routes.js](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/server/src/api/auth/auth.routes.js) — Register session endpoints.
* **How to test**:
  ```bash
  # List sessions:
  curl -X GET http://localhost:5000/api/auth/sessions -H "Authorization: Bearer <JWT_TOKEN>"
  # Revoke session:
  curl -X DELETE http://localhost:5000/api/auth/sessions/sess_99218 -H "Authorization: Bearer <JWT_TOKEN>"
  ```

---

### Subtask 1.5: Multi-Layer Identity Onboarding Channels (IAM-002 / SAML SSO)
* **What to do**:
  - **Channel A**: SAML 2.0 / OIDC assertion parser (`employeeType == "faculty"`) setting `accountStatus = ACTIVE`.
  - **Channel B**: JWT invite token registration (`/register?token=...`) validated via Zod schema (`inviteRegistrationSchema`).
  - **Channel C**: Manual ID scan S3 upload + web profile URL queue (`accountStatus = UNDER_REVIEW`).
* **Files to edit/create**:
  - `server/src/services/saml.service.js` *(NEW)* — SAML assertion processor.
  - [server/src/api/auth/auth.controller.js](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/server/src/api/auth/auth.controller.js) — Update `register` logic.
  - [server/src/api/auth/auth.validation.js](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/server/src/api/auth/auth.validation.js) — Add Zod validation schemas.
* **How to test**:
  ```bash
  curl -X POST http://localhost:5000/api/auth/register-invite \
    -H "Content-Type: application/json" \
    -d '{"token":"<INVITE_JWT_TOKEN>","password":"SecurePassword123!","name":"Dr. Anita"}'
  ```

---

## 🏢 STAGE 2: Organization & Ecosystem Management (ORG)

### Subtask 2.1: Self-Service Institutional Onboarding & Subdomain Setup (ORG-001 / ORG-1)
* **What to do**:
  - Implement `POST /api/organizations` accepting `name`, `slug`, `logoUrl`, `brandColor`, `subdomain`, `orgType`.
  - Create subdomain lookup endpoint `GET /api/organizations/subdomain/:subdomain`.
* **Files to edit/create**:
  - `server/src/api/organizations/organization.controller.js` *(NEW)*
  - `server/src/api/organizations/organization.routes.js` *(NEW)*
* **How to test**:
  ```bash
  curl -X POST http://localhost:5000/api/organizations \
    -H "Content-Type: application/json" \
    -d '{"name":"IIT Delhi","slug":"iitd","subdomain":"iitd","brandColor":"#D0202F","orgType":"UNIVERSITY"}'
  ```

---

### Subtask 2.2: Government Accreditation & Verification Queue (ORG-002 / ORG-2)
* **What to do**:
  - Implement admin verification endpoint `PATCH /api/admin/organizations/:id/verify`.
  - Validate tax ID (PAN/EIN/CIN) against national tax registry API with Levenshtein name distance check.
  - Compute SHA-256 certificate hash upon admin approval and change status to `ACTIVE`.
* **Files to edit/create**:
  - `server/src/services/taxVerification.service.js` *(NEW)* — External tax API connector.
  - [server/src/api/admin/admin.controller.js](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/server/src/api/admin/admin.controller.js) — Add `verifyOrganization`.
  - [server/src/api/admin/admin.routes.js](file:///home/dino/Documents/Coding/Freelance/dx-v2.0/server/src/api/admin/admin.routes.js) — Add verification route.
* **How to test**:
  ```bash
  curl -X PATCH http://localhost:5000/api/admin/organizations/org-123/verify \
    -H "Authorization: Bearer <ADMIN_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"taxId":"AAACT1234F","legalName":"Tata Steel R&D"}'
  ```

---

### Subtask 2.3: `ltree` Department & Lab Hierarchical Trees (ORG-003 / ORG-004)
* **What to do**:
  - Model multi-level hierarchy (`Organization` ➔ `Department` ➔ `ResearchGroup`/Lab) using PostgreSQL `ltree`.
  - Build ancestor query (`@>`) and descendant query (`<@`) methods.
  - Implement node relocation `PATCH /api/organizations/nodes/:id/move` with recursive self-referencing cycle check.
* **Files to edit/create**:
  - `server/src/services/organization.service.js` *(NEW)* — Tree traversal & cycle detection algorithm.
  - `server/src/api/organizations/organization.controller.js` — Add `moveNode`, `getTree`.
* **How to test**:
  ```bash
  # Test re-parenting node:
  curl -X PATCH http://localhost:5000/api/organizations/nodes/lab-456/move \
    -H "Authorization: Bearer <ORG_ADMIN_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"newParentId":"dept-789"}'
  ```

---

### Subtask 2.4: Digital Collaboration MoUs & SHA-256 Signature Tracking (ORG-007 / ORG-008)
* **What to do**:
  - Build double-signature partnership agreement workflow (`Partnership` model).
  - Generate SHA-256 hash of signed contract buffer (`agreementHash`) upon second org admin approval to unlock cross-directory resource sharing.
* **Files to edit/create**:
  - `server/src/api/organizations/partnership.controller.js` *(NEW)* — Partnership lifecycle handlers.
  - `server/src/api/organizations/partnership.routes.js` *(NEW)* — Partnership API routes.
* **How to test**:
  ```bash
  curl -X PATCH http://localhost:5000/api/organizations/partnerships/part-992/approve \
    -H "Authorization: Bearer <RECEIVING_ADMIN_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"documentUrl":"https://s3.aws/mou-contract.pdf"}'
  ```

---

### Subtask 2.5: Ecosystem Dashboard Rollups & Redis Caching (ORG-011 / ORG-8)
* **What to do**:
  - Create background cron job calculating total joint projects, total funding allocated, and active partnerships per organization.
  - Cache results in Redis (`org:analytics:{orgId}`) with 12-hour TTL.
* **Files to edit/create**:
  - `server/src/cron/rollup.cron.js` *(NEW)* — Scheduled analytics cron job.
  - `server/src/api/organizations/organization.controller.js` — Add `getOrganizationAnalytics`.
* **How to test**:
  ```bash
  curl -X GET http://localhost:5000/api/organizations/org-123/analytics \
    -H "Authorization: Bearer <TOKEN>"
  ```
