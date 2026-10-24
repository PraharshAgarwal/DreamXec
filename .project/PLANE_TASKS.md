# Plane.so Ready Task Import — Stage 1 & Stage 2

> **Format**: Plane.so Issue Templates  
> **Modules**: Stage 1 (Identity & Access Management) & Stage 2 (Organization Ecosystem)  

---

## 🛡️ STAGE 1: Identity & Access Management (IAM)

### 📌 [IAM-001] Domain Auto-Detection & Role Pre-Filling
- **State**: Todo
- **Priority**: High
- **Labels**: `IAM`, `Backend`, `API`

#### 📝 Description
Detect user institution email domain during registration (e.g. `iitd.ac.in`), match against verified organization records, unlock appropriate institutional roles (`PROFESSOR`, `RESEARCHER`, `STUDENT`), and pre-fill white-label brand colors.

#### 🔨 Implementation Steps
1. Implement `verifyDomain` controller in `server/src/api/auth/auth.controller.js`.
2. Extract domain from `req.query.email`, query Prisma `Organization` table by `domain`.
3. Return organization payload, brand color (`brandColor`), and allowed role selections.
4. Register route `GET /api/auth/verify-domain` in `server/src/api/auth/auth.routes.js`.
5. Wire frontend service method `verifyDomain(email)` in `client/src/services/authService.ts`.

#### 📁 Files Affected
- `server/src/api/auth/auth.controller.js`
- `server/src/api/auth/auth.routes.js`
- `client/src/services/authService.ts`

#### ✅ Testing & Verification
```bash
curl -X GET "http://localhost:5000/api/auth/verify-domain?email=anita.sen@iitd.ac.in"
```
*Acceptance Criteria*: Returns `200 OK` with JSON payload containing verified org details and allowed roles.

---

### 📌 [IAM-002] Federated Single Sign-On (SAML 2.0 & OIDC)
- **State**: Todo
- **Priority**: High
- **Labels**: `IAM`, `SSO`, `Security`

#### 📝 Description
Integrate enterprise SAML 2.0 Single Sign-On (Shibboleth/ADFS) and Passport.js OIDC callbacks for institutional single sign-on.

#### 🔨 Implementation Steps
1. Create `saml.service.js` in `server/src/services/` to process SAML assertion XML payloads.
2. Verify IdP XML signature against stored public certificates.
3. Extract `employeeType` claim (`"faculty"` ➔ auto-set `accountStatus = ACTIVE`).
4. Add `/api/auth/saml/login` and `/api/auth/saml/callback` routes in `auth.routes.js`.

#### 📁 Files Affected
- `server/src/services/saml.service.js` *(New)*
- `server/src/api/auth/auth.controller.js`
- `server/src/api/auth/auth.routes.js`

#### ✅ Testing & Verification
```bash
curl -X POST http://localhost:5000/api/auth/saml/callback -H "Content-Type: application/xml" --data-binary "@saml_assertion.xml"
```
*Acceptance Criteria*: Returns user session JWT token upon valid assertion signature verification.

---

### 📌 [IAM-003] Multi-Factor Authentication (2FA TOTP & Recovery Codes)
- **State**: Todo
- **Priority**: High
- **Labels**: `IAM`, `2FA`, `Security`

#### 📝 Description
Implement TOTP 2FA secret generation with QR code string (`speakeasy` + `qrcode`) and 10 single-use 8-character recovery scratch codes (`mfaScratchCodes`). Update login flow to demand TOTP verification before issuing final access JWT.

#### 🔨 Implementation Steps
1. Create `mfa.service.js` in `server/src/services/` for TOTP secret generation & QR code rendering.
2. Implement `setupMFA` and `verifyMFA` in `auth.controller.js`.
3. Update `login` flow: if `mfaEnabled == true`, return `{ status: "MFA_PENDING", mfaSessionId: "..." }`.
4. Add `/api/auth/mfa/setup` and `/api/auth/mfa/verify` routes in `auth.routes.js`.

#### 📁 Files Affected
- `server/src/services/mfa.service.js` *(New)*
- `server/src/api/auth/auth.controller.js`
- `server/src/api/auth/auth.routes.js`

#### ✅ Testing & Verification
```bash
# Setup:
curl -X POST http://localhost:5000/api/auth/mfa/setup -H "Authorization: Bearer <TOKEN>"
# Verify:
curl -X POST http://localhost:5000/api/auth/mfa/verify -H "Content-Type: application/json" -d '{"totpCode":"123456"}'
```
*Acceptance Criteria*: Correct 6-digit TOTP upgrades session state to active access JWT token.

---

### 📌 [IAM-004] Permission-Based Access Control (PBAC) & Redis Cache
- **State**: Todo
- **Priority**: Urgent
- **Labels**: `IAM`, `Middleware`, `Redis`

#### 📝 Description
Replace static role checks with dynamic PBAC middleware (`requirePermission`). Cache compiled user permission arrays in Redis (`permissions:{userId}`) with 10-minute TTL (`EX 600`).

#### 🔨 Implementation Steps
1. Update `auth.middleware.js` to implement `protect` and `requirePermission`.
2. Define permissions array mapping in `server/src/permissions/matrix.js`.
3. Implement Redis permission caching with automatic cache-aside fallback.
4. Enforce strict `accountStatus` check (`ACTIVE`).

#### 📁 Files Affected
- `server/src/middleware/auth.middleware.js`
- `server/src/permissions/matrix.js`
- `server/src/services/redis.service.js`

#### ✅ Testing & Verification
```bash
curl -X PATCH http://localhost:5000/api/user-projects/proj-101/budget \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"budget": 500000}'
```
*Acceptance Criteria*: Returns `403 Forbidden` with `"Access Denied: Inadequate privileges."`.

---

### 📌 [IAM-005] Multi-Device Session Management & Live Remote Revocation
- **State**: Todo
- **Priority**: Medium
- **Labels**: `IAM`, `Sessions`, `Redis`

#### 📝 Description
Track active login footprints (`ipAddress`, `deviceAgent`, `location`, `tokenFamily`) in `UserSession`. Provide security dashboard endpoints to list active sessions and revoke specific sessions remotely by blacklisting tokens in Redis.

#### 🔨 Implementation Steps
1. Persist device metadata during login inside `UserSession` model.
2. Implement `getActiveSessions` in `auth.controller.js`.
3. Implement `revokeSession` adding target JWT token hash to Redis blacklist (`blacklist:{token}`).
4. Register `GET /api/auth/sessions` and `DELETE /api/auth/sessions/:sessionId` in `auth.routes.js`.

#### 📁 Files Affected
- `server/src/api/auth/auth.controller.js`
- `server/src/api/auth/auth.routes.js`
- `server/src/middleware/auth.middleware.js`

#### ✅ Testing & Verification
```bash
curl -X DELETE http://localhost:5000/api/auth/sessions/sess_99218 -H "Authorization: Bearer <TOKEN>"
```
*Acceptance Criteria*: Subsequent API requests using the revoked session token return `401 Unauthorized`.

---

## 🏢 STAGE 2: Organization & Ecosystem Management (ORG)

### 📌 [ORG-001] Self-Service Institutional Onboarding & Subdomain Setup
- **State**: Todo
- **Priority**: High
- **Labels**: `Organization`, `MultiTenancy`, `Backend`

#### 📝 Description
Build self-service organization registration for universities, corporate R&D, incubators, labs, and funding agencies. Support custom white-label parameters (`logoUrl`, `brandColor`, `subdomain`, `slug`).

#### 🔨 Implementation Steps
1. Create `organization.controller.js` in `server/src/api/organizations/`.
2. Implement `createOrganization` handling slug generation and subdomain uniqueness.
3. Implement `getOrganizationBySubdomain` returning workspace theme parameters.
4. Register routes in `server/src/api/organizations/organization.routes.js`.

#### 📁 Files Affected
- `server/src/api/organizations/organization.controller.js` *(New)*
- `server/src/api/organizations/organization.routes.js` *(New)*

#### ✅ Testing & Verification
```bash
curl -X POST http://localhost:5000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"IIT Delhi","slug":"iitd","subdomain":"iitd","brandColor":"#D0202F","orgType":"UNIVERSITY"}'
```
*Acceptance Criteria*: Returns `201 Created` with initialized organization record.

---

### 📌 [ORG-002] Government Accreditation & Verification Queue
- **State**: Todo
- **Priority**: Urgent
- **Labels**: `Organization`, `Compliance`, `Audit`

#### 📝 Description
Build an admin approval queue for organizations in `PENDING_VERIFICATION`. Validate tax registration ID (PAN/EIN/CIN) against national tax registry API with Levenshtein name matching. Compute SHA-256 certificate hash upon admin approval.

#### 🔨 Implementation Steps
1. Create `taxVerification.service.js` in `server/src/services/` connecting to tax registry APIs.
2. Implement `verifyOrganization` controller in `server/src/api/admin/admin.controller.js`.
3. Calculate SHA-256 certificate hash of verification payload and update status to `ACTIVE`.
4. Add route `PATCH /api/admin/organizations/:id/verify` in `admin.routes.js`.

#### 📁 Files Affected
- `server/src/services/taxVerification.service.js` *(New)*
- `server/src/api/admin/admin.controller.js`
- `server/src/api/admin/admin.routes.js`

#### ✅ Testing & Verification
```bash
curl -X PATCH http://localhost:5000/api/admin/organizations/org-123/verify \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"taxId":"AAACT1234F","legalName":"Tata Steel R&D"}'
```
*Acceptance Criteria*: Org state updates to `ACTIVE` and `agreementHash` is persisted.

---

### 📌 [ORG-003] PostgreSQL `ltree` Department & Laboratory Hierarchy
- **State**: Todo
- **Priority**: High
- **Labels**: `Organization`, `Database`, `ltree`

#### 📝 Description
Model multi-level institutional hierarchy (`Organization` ➔ `Department` ➔ `ResearchGroup`/Lab) using PostgreSQL `ltree` extensions. Build ancestor/descendant tree query methods and re-parenting with cycle prevention.

#### 🔨 Implementation Steps
1. Create `organization.service.js` in `server/src/services/` for `ltree` query execution.
2. Implement descendant query method using `<@` operator and ancestor query using `@>` operator.
3. Implement `moveNode` controller validating that `new_parent_path` does not contain target `organization_id`.
4. Implement Redis hierarchy tree caching (`org:tree:{root_id}`).

#### 📁 Files Affected
- `server/src/services/organization.service.js` *(New)*
- `server/src/api/organizations/organization.controller.js`

#### ✅ Testing & Verification
```bash
curl -X PATCH http://localhost:5000/api/organizations/nodes/lab-456/move \
  -H "Authorization: Bearer <ORG_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"newParentId":"dept-789"}'
```
*Acceptance Criteria*: Node hierarchy path updates correctly without introducing self-referencing loops.

---

### 📌 [ORG-004] Digital Collaboration MoUs & SHA-256 Signature Tracking
- **State**: Todo
- **Priority**: Medium
- **Labels**: `Organization`, `Partnership`, `Crypto`

#### 📝 Description
Implement double-signature partnership agreement workflow (`Partnership` model). Generate cryptographic SHA-256 hash of signed contract buffer (`agreementHash`) upon second org admin approval to unlock cross-directory resource sharing.

#### 🔨 Implementation Steps
1. Create `partnership.controller.js` in `server/src/api/organizations/`.
2. Implement `initiatePartnership` creating `PENDING` record.
3. Implement `approvePartnership` verifying admin role, generating SHA-256 agreement hash, and setting status to `ACTIVE`.
4. Register routes in `server/src/api/organizations/partnership.routes.js`.

#### 📁 Files Affected
- `server/src/api/organizations/partnership.controller.js` *(New)*
- `server/src/api/organizations/partnership.routes.js` *(New)*

#### ✅ Testing & Verification
```bash
curl -X PATCH http://localhost:5000/api/organizations/partnerships/part-992/approve \
  -H "Authorization: Bearer <RECEIVING_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"documentUrl":"https://s3.aws/mou-contract.pdf"}'
```
*Acceptance Criteria*: Partnership status changes to `ACTIVE` and SHA-256 hash is logged.

---

### 📌 [ORG-005] Ecosystem Dashboard Rollups & Redis Caching
- **State**: Todo
- **Priority**: Low
- **Labels**: `Organization`, `Analytics`, `Cron`

#### 📝 Description
Create background cron job calculating total joint projects, total funding allocated, and active partnerships per organization. Cache compiled analytical rollup metrics in Redis (`org:analytics:{orgId}`) with a 12-hour TTL.

#### 🔨 Implementation Steps
1. Create `rollup.cron.js` in `server/src/cron/`.
2. Write aggregate Prisma queries for active projects, funding totals, and partnerships.
3. Save JSON rollups into Redis with 12-hour TTL.
4. Expose `getOrganizationAnalytics` endpoint in `organization.controller.js`.

#### 📁 Files Affected
- `server/src/cron/rollup.cron.js` *(New)*
- `server/src/api/organizations/organization.controller.js`

#### ✅ Testing & Verification
```bash
curl -X GET http://localhost:5000/api/organizations/org-123/analytics -H "Authorization: Bearer <TOKEN>"
```
*Acceptance Criteria*: Returns pre-computed analytical metrics instantly from Redis cache.
