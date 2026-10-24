# API Reference & Integration Guidelines: dx-v2.0

---

## 🌐 Overview & Base URL

* **Base URL**: `http://localhost:5000/api`
* **Format**: All payloads and responses use standard JSON (`Content-Type: application/json`).

---

## 🔑 Global Request Headers

| Header | Required | Purpose & Example |
| :--- | :--- | :--- |
| `Authorization` | Protected routes | `Bearer <JWT_TOKEN>` |
| `Idempotency-Key` | State-mutating routes | `Idempotency-Key: key-987a-4321-bcde` |
| `Content-Type` | `POST`, `PUT`, `PATCH` | `application/json` |

---

## 📦 Standard Response Envelopes

### Success Response Envelope
```json
{
  "status": "success",
  "results": 10,
  "message": "Operation completed successfully.",
  "data": {
    "projects": [...]
  }
}
```

### Error Response Envelope
```json
{
  "status": "error",
  "error": "ConflictException",
  "message": "Duplicate request in progress or completed.",
  "code": 409
}
```

---

## 📋 Endpoint Directory

### 🔐 1. Authentication Routes (`/api/auth`)
* `POST /api/auth/register`: Register new student or donor account.
* `POST /api/auth/login`: Authenticate credentials, return JWT token.
* `GET /api/auth/me`: Get current authenticated user profile.
* `POST /api/auth/forgot-password` & `reset-password`: Account recovery endpoints.
* `GET /api/auth/google`: Trigger Google OAuth consent screen (`?role=USER|DONOR`).
* `GET /api/auth/linkedin`: Trigger LinkedIn OIDC consent screen (`?role=USER|DONOR`).

### 👤 2. User Research Projects (`/api/user-projects`)
* `GET /api/user-projects/public`: List all approved public student research projects.
* `GET /api/user-projects/my`: List projects created by current authenticated user.
* `POST /api/user-projects`: Submit new student research project for funding.
* `PUT /api/user-projects/:id`: Update existing user project.
* `DELETE /api/user-projects/:id`: Delete user project.

### 💰 3. Donor Projects & Initiatives (`/api/donor-projects`)
* `GET /api/donor-projects/public`: List all approved donor initiatives.
* `GET /api/donor-projects/my`: List donor initiatives owned by authenticated donor.
* `POST /api/donor-projects`: Create new donor initiative (Created in `PENDING` state).
* `PUT /api/donor-projects/:id`: Update pending/rejected initiative.

### 📝 4. Applications (`/api/applications`)
* `POST /api/applications`: Submit student application to a donor project.
* `GET /api/applications/my`: List applications submitted by current student.
* `GET /api/applications/donor/all`: List all applications received across donor's projects.
* `PATCH /api/applications/:id/status`: Accept or reject student application (`status: ACCEPTED|REJECTED`).

### 🧑‍💼 5. Admin Control (`/api/admin`)
* `GET /api/admin/projects`: List all user & donor projects across all statuses.
* `PATCH /api/admin/projects/user/:id/verify`: Approve or reject user project with audit reason.
* `PATCH /api/admin/projects/donor/:id/verify`: Approve or reject donor project with audit reason.

### ⚡ 6. High-Scale Onboarding (`/api/onboarding`)
* `POST /api/onboarding/apply`: Ingest application submission into Kafka buffer (`202 Accepted`).

### 🎓 7. Student Crowdfunding & Campaigns (`/api/campaigns`)
* `GET /api/campaigns`: Browse public live campaigns with pagination, filters (category, institution), and sorting.
* `GET /api/campaigns/:slug`: Fetch single campaign details, story, milestones, updates, and donor wall.
* `POST /api/campaigns`: Create draft campaign with target amount, category, and milestone tranches.
* `PUT /api/campaigns/:id`: Update draft/rejected campaign metadata or pitch story.
* `POST /api/campaigns/:id/submit`: Submit draft campaign for institutional Org Admin review.
* `POST /api/campaigns/:id/verify`: Org Admin review endpoint (`status: APPROVED|REJECTED` with optional rejection reason).
* `POST /api/campaigns/:id/submit-endorsement`: Submit campaign to faculty member for formal academic endorsement (campaigns > $500).
* `POST /api/campaigns/:id/endorse`: Faculty endorsement review (`status: APPROVED|REJECTED`).
* `POST /api/campaigns/:id/donate`: Idempotent backer contribution with payment intent, message, and anonymity flag.
* `POST /api/campaigns/:id/updates`: Post public campaign progress update.
* `POST /api/campaigns/:id/milestones/:milestoneId/claim`: Submit/re-submit evidence receipt/invoice for milestone disbursement.
* `GET /api/campaigns/:id/milestones/:milestoneId/submissions`: List all claim submission attempts and rejection histories.
* `POST /api/campaigns/:id/milestones/:milestoneId/submissions/:submissionId/review`: Review milestone receipt claim (`status: APPROVED|REJECTED` with rejection reason).
* `POST /api/campaigns/:id/milestones/:milestoneId/revisions`: Create/request milestone revision (title, description, amount, change reason).
* `GET /api/campaigns/:id/milestones/:milestoneId/revisions`: Fetch complete chronological revision history (all 100+ versions).
* `POST /api/campaigns/:id/milestones/:milestoneId/revisions/:revisionId/review`: Org Admin review & approval/rejection of milestone revision.




