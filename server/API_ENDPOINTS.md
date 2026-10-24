# API Endpoints Documentation

Base URL: `http://localhost:5000/api`

---

## 🔐 Auth Routes
**Base Path:** `/api/auth`

### 1. Register
- **Method:** `POST`
- **Endpoint:** `/api/auth/register`
- **Access:** Public
- **Description:** Register a new user or donor account. Email verification is required before login.

**Register as User (Student):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "USER"
}
```

**Register as Donor:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "DONOR",
  "organizationName": "Helping Hands Foundation"  // Optional
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Registration successful! Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "...",
      "email": "john@example.com",
      "name": "John Doe",
      "emailVerified": false
    }
  }
}
```

**Notes:**
- `organizationName` is optional for DONOR role
- A verification email is sent to the provided email address
- Account must be verified before login (check email for verification link)

### 2. Login
- **Method:** `POST`
- **Endpoint:** `/api/auth/login`
- **Access:** Public
- **Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "...",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "USER"
    }
  }
}
```

### 3. Get Current User
- **Method:** `GET`
- **Endpoint:** `/api/auth/me`
- **Access:** Protected
- **Headers:**
```
Authorization: Bearer <token>
```

### 4. Forgot Password
- **Method:** `POST`
- **Endpoint:** `/api/auth/forgot-password`
- **Access:** Public
- **Body:**
```json
{
  "email": "john@example.com"
}
```

### 5. Reset Password
- **Method:** `POST`
- **Endpoint:** `/api/auth/reset-password?token=<reset_token>`
- **Access:** Public
- **Body:**
```json
{
  "password": "newPassword123"
}
```

### 6. Google OAuth (Login/Register)
- **Method:** `GET`
- **Endpoint:** `/api/auth/google?role=USER` or `/api/auth/google?role=DONOR`
- **Access:** Public
- **Query Parameters:**
  - `role`: Either `USER` (default) or `DONOR`
- **Description:** Redirects to Google OAuth consent screen. After authentication, creates account or logs in based on the specified role.
- **Examples:**
  - Student/User: `GET /api/auth/google?role=USER`
  - Donor: `GET /api/auth/google?role=DONOR`

### 7. Google Callback
- **Method:** `GET`
- **Endpoint:** `/api/auth/google/callback`
- **Access:** Public (Called by Google OAuth)
- **Description:** Google redirects here after authentication. This endpoint processes the OAuth response and redirects to frontend with a JWT token.

### 8. LinkedIn OAuth (Login/Register) - OIDC
- **Method:** `GET`
- **Endpoint:** `/api/auth/linkedin?role=USER` or `/api/auth/linkedin?role=DONOR`
- **Access:** Public
- **Query Parameters:**
  - `role`: Either `USER` (default) or `DONOR`
- **Description:** Redirects to LinkedIn OAuth consent screen using OpenID Connect. After authentication, creates account or logs in based on the specified role.
- **Scopes Used:** `openid`, `profile`, `email` (OIDC scopes)
- **Examples:**
  - Student/User: `GET /api/auth/linkedin?role=USER`
  - Donor: `GET /api/auth/linkedin?role=DONOR`

### 9. LinkedIn Callback
- **Method:** `GET`
- **Endpoint:** `/api/auth/linkedin/callback`
- **Access:** Public (Called by LinkedIn OAuth)
- **Description:** LinkedIn redirects here after authentication. This endpoint processes the OAuth response and redirects to frontend with a JWT token.

---

## 👤 User Project Routes
**Base Path:** `/api/user-projects`

### 1. Get All Public User Projects
- **Method:** `GET`
- **Endpoint:** `/api/user-projects/public`
- **Access:** Public
- **Response:**
```json
{
  "status": "success",
  "results": 10,
  "data": {
    "userProjects": [...]
  }
}
```

### 2. Get Specific User Project
- **Method:** `GET`
- **Endpoint:** `/api/user-projects/:id`
- **Access:** Public
- **Example:** `/api/user-projects/507f1f77bcf86cd799439011`

### 3. Get My User Projects
- **Method:** `GET`
- **Endpoint:** `/api/user-projects/my`
- **Access:** Protected (USER)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Description:** Returns all projects created by the authenticated user, including PENDING and REJECTED projects with rejection reasons.
- **Response Example:**
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "userProjects": [
      {
        "id": "...",
        "title": "My Project",
        "status": "REJECTED",
        "rejectionReason": "Needs more detailed budget breakdown",
        ...
      },
      {
        "id": "...",
        "title": "Another Project",
        "status": "APPROVED",
        "rejectionReason": null,
        ...
      }
    ]
  }
}
```

### 4. Create User Project
- **Method:** `POST`
- **Endpoint:** `/api/user-projects`
- **Access:** Protected (USER)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Body:**
```json
{
  "title": "Build a Community Platform",
  "description": "A detailed description of the project that needs funding...",
  "companyName": "Tech Startup Inc",
  "skillsRequired": ["JavaScript", "React", "Node.js"],
  "timeline": "3 months",
  "goalAmount": 5000,
  "imageUrl": "https://example.com/image.jpg"
}
```

### 5. Update User Project
- **Method:** `PUT`
- **Endpoint:** `/api/user-projects/:id`
- **Access:** Protected (USER - owner only)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Body:** (All fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated description...",
  "goalAmount": 6000
}
```

### 6. Delete User Project
- **Method:** `DELETE`
- **Endpoint:** `/api/user-projects/:id`
- **Access:** Protected (USER - owner only)
- **Headers:**
```
Authorization: Bearer <token>
```

---

## 💰 Donor Project Routes
**Base Path:** `/api/donor-projects`

**Note:** All donor projects require admin verification before appearing publicly. Projects are created with `PENDING` status and must be approved by an admin.

### 1. Get All Public Donor Projects
- **Method:** `GET`
- **Endpoint:** `/api/donor-projects/public`
- **Access:** Public
- **Description:** Returns only APPROVED donor projects

### 2. Get Specific Donor Project
- **Method:** `GET`
- **Endpoint:** `/api/donor-projects/:id`
- **Access:** Public (APPROVED projects only) / Protected (owner can view their PENDING/REJECTED projects)
- **Description:** Public users can only view approved projects. Project owners and admins can view projects in any status.

### 3. Get My Donor Projects
- **Method:** `GET`
- **Endpoint:** `/api/donor-projects/my`
- **Access:** Protected (DONOR)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Description:** Returns all projects created by the authenticated donor, including PENDING and REJECTED projects with rejection reasons.
- **Response Example:**
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "donorProjects": [
      {
        "id": "...",
        "title": "Education Initiative",
        "status": "REJECTED",
        "rejectionReason": "Project scope is unclear. Please provide more details.",
        ...
      },
      {
        "id": "...",
        "title": "Youth Program",
        "status": "APPROVED",
        "rejectionReason": null,
        ...
      }
    ]
  }
}
```

### 4. Create Donor Project
- **Method:** `POST`
- **Endpoint:** `/api/donor-projects`
- **Access:** Protected (DONOR)
- **Authentication:** Required - Bearer token
- **Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```
- **Body:**
```json
{
  "title": "Youth Education Initiative",
  "description": "Supporting education for underprivileged youth. This program aims to provide scholarships, mentorship, and resources to students from low-income families.",
  "organization": "Education Foundation",
  "skillsRequired": ["Teaching", "Mentoring", "Curriculum Development"],
  "timeline": "6 months",
  "totalBudget": 10000,
  "imageUrl": "https://example.com/education.jpg"
}
```
- **Field Requirements:**
  - `title`: **Required** (5-200 characters)
  - `description`: **Required** (minimum 20 characters)
  - `organization`: Optional (string)
  - `skillsRequired`: Optional (array of strings)
  - `timeline`: Optional (string)
  - `totalBudget`: **Required** (positive number)
  - `imageUrl`: Optional (valid URL format)
- **Response:**
```json
{
  "status": "success",
  "message": "Donor project created successfully. Awaiting admin approval.",
  "data": {
    "donorProject": {
      "id": "673bf8a2c1234567890abcde",
      "title": "Youth Education Initiative",
      "description": "Supporting education for underprivileged youth...",
      "organization": "Education Foundation",
      "skillsRequired": ["Teaching", "Mentoring", "Curriculum Development"],
      "timeline": "6 months",
      "totalBudget": 10000,
      "allocatedFunds": 0,
      "imageUrl": "https://example.com/education.jpg",
      "status": "PENDING",
      "rejectionReason": null,
      "donorId": "673bf123c1234567890abcde",
      "createdAt": "2025-11-06T10:30:00.000Z",
      "updatedAt": "2025-11-06T10:30:00.000Z"
    }
  }
}
```
- **Notes:** 
  - Project is created with `PENDING` status
  - Requires admin approval before appearing publicly
  - Donor receives email notification once admin approves/rejects

### 5. Update Donor Project
- **Method:** `PUT`
- **Endpoint:** `/api/donor-projects/:id`
- **Access:** Protected (DONOR - owner only)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Body:** (All fields optional)
```json
{
  "title": "Updated Initiative Name",
  "totalBudget": 15000
}
```
- **Note:** Only PENDING or REJECTED projects can be updated

### 6. Delete Donor Project
- **Method:** `DELETE`
- **Endpoint:** `/api/donor-projects/:id`
- **Access:** Protected (DONOR - owner only)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Note:** Only PENDING or REJECTED projects can be deleted

---

## 🎁 Donation Routes
**Base Path:** `/api/donations`

### 1. Make a Donation
- **Method:** `POST`
- **Endpoint:** `/api/donations`
- **Access:** Protected (DONOR)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Body:**
```json
{
  "amount": 100,
  "userProjectId": "507f1f77bcf86cd799439011",
  "message": "Great project! Keep it up!",
  "anonymous": false
}
```

### 2. Get My Donations
- **Method:** `GET`
- **Endpoint:** `/api/donations/my`
- **Access:** Protected (DONOR)
- **Headers:**
```
Authorization: Bearer <token>
```

### 3. Get Donations for a Project
- **Method:** `GET`
- **Endpoint:** `/api/donations/project/:projectId`
- **Access:** Protected (USER - project owner or ADMIN)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Example:** `/api/donations/project/507f1f77bcf86cd799439011`

### 4. Create Payment Intent (Stripe)
- **Method:** `POST`
- **Endpoint:** `/api/donations/create-payment-intent`
- **Access:** Protected (DONOR)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Body:**
```json
{
  "amount": 100,
  "projectId": "507f1f77bcf86cd799439011"
}
```

---

## 📝 Application Routes
**Base Path:** `/api/applications`

**Note:** Students (USER role) can apply to approved donor projects. Donors can review and accept/reject applications.

### 1. Apply to Donor Project
- **Method:** `POST`
- **Endpoint:** `/api/applications`
- **Access:** Protected (USER/Student)
- **Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```
- **Body:**
```json
{
  "donorProjectId": "673bf8a2c1234567890abcde",
  "coverLetter": "I am very interested in this project because I have experience in teaching and mentoring students. I believe my skills align well with the project's goals...",
  "skills": ["Teaching", "Mentoring", "Communication", "Curriculum Design"]
}
```
- **Field Requirements:**
  - `donorProjectId`: **Required** (string, valid project ID)
  - `coverLetter`: **Required** (minimum 50 characters)
  - `skills`: Optional (array of strings)
- **Response:**
```json
{
  "status": "success",
  "message": "Application submitted successfully",
  "data": {
    "application": {
      "id": "...",
      "userId": "...",
      "donorProjectId": "...",
      "coverLetter": "...",
      "skills": ["Teaching", "Mentoring"],
      "status": "PENDING",
      "createdAt": "2025-11-06T10:30:00.000Z"
    }
  }
}
```

### 2. Get My Applications (Student)
- **Method:** `GET`
- **Endpoint:** `/api/applications/my`
- **Access:** Protected (USER/Student)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Description:** Returns all applications submitted by the authenticated student
- **Response:**
```json
{
  "status": "success",
  "results": 3,
  "data": {
    "applications": [
      {
        "id": "...",
        "coverLetter": "...",
        "skills": ["Teaching"],
        "status": "ACCEPTED",
        "rejectionReason": null,
        "createdAt": "2025-11-06T10:30:00.000Z",
        "donorProject": {
          "id": "...",
          "title": "Youth Education Initiative",
          "organization": "Education Foundation",
          "timeline": "6 months"
        }
      }
    ]
  }
}
```

### 3. Get All Applications for My Projects (Donor)
- **Method:** `GET`
- **Endpoint:** `/api/applications/donor/all`
- **Access:** Protected (DONOR)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Description:** Returns all applications across all donor projects owned by the authenticated donor

### 4. Get Applications for Specific Project (Donor)
- **Method:** `GET`
- **Endpoint:** `/api/applications/donor/project/:projectId`
- **Access:** Protected (DONOR - project owner only)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Description:** Returns all applications for a specific donor project
- **Example:** `/api/applications/donor/project/673bf8a2c1234567890abcde`

### 5. Accept/Reject Application (Donor)
- **Method:** `PATCH`
- **Endpoint:** `/api/applications/:applicationId/status`
- **Access:** Protected (DONOR - project owner only)
- **Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```
- **Body:**
```json
{
  "status": "ACCEPTED",  // or "REJECTED"
  "rejectionReason": "Optional reason if rejecting"
}
```
- **Response:**
```json
{
  "status": "success",
  "data": {
    "application": {
      "id": "...",
      "status": "ACCEPTED",
      "rejectionReason": null,
      "user": {
        "id": "...",
        "name": "Alice Student",
        "email": "alice@example.com"
      },
      "donorProject": {
        "id": "...",
        "title": "Youth Education Initiative"
      }
    }
  }
}
```

### 6. Withdraw Application (Student)
- **Method:** `DELETE`
- **Endpoint:** `/api/applications/:applicationId`
- **Access:** Protected (USER - application owner only)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Description:** Students can withdraw their PENDING applications
- **Note:** Only PENDING applications can be withdrawn

---

## 🧑‍💼 Admin Routes
**Base Path:** `/api/admin`

**Note:** Both User Projects and Donor Projects require admin verification before they become publicly visible.

### 1. Get All Projects
- **Method:** `GET`
- **Endpoint:** `/api/admin/projects`
- **Access:** Protected (ADMIN)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Description:** Returns all projects (User and Donor) across all statuses (PENDING, APPROVED, REJECTED, COMPLETED)
- **Response:**
```json
{
  "status": "success",
  "data": {
    "userProjects": {
      "results": 5,
      "projects": [...]
    },
    "donorProjects": {
      "results": 3,
      "projects": [...]
    }
  }
}
```

### 2. Verify/Approve User Project
- **Method:** `PATCH`
- **Endpoint:** `/api/admin/projects/user/:id/verify`
- **Access:** Protected (ADMIN)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Body:**
```json
{
  "status": "APPROVED",  // or "REJECTED"
  "reason": "Optional rejection reason (stored in DB if REJECTED)"
}
```
- **Description:** Approves or rejects a user project. The rejection reason is saved to the database and returned when fetching the project. An email notification is sent to the project owner.
- **Response:**
```json
{
  "status": "success",
  "data": {
    "userProject": {
      "id": "...",
      "status": "REJECTED",
      "rejectionReason": "Needs more detailed budget breakdown",
      ...
    }
  }
}
```

### 3. Verify/Approve Donor Project
- **Method:** `PATCH`
- **Endpoint:** `/api/admin/projects/donor/:id/verify`
- **Access:** Protected (ADMIN)
- **Headers:**
```
Authorization: Bearer <token>
```
- **Body:**
```json
{
  "status": "APPROVED",  // or "REJECTED"
  "reason": "Optional rejection reason (stored in DB if REJECTED)"
}
```
- **Description:** Approves or rejects a donor project. The rejection reason is saved to the database and returned when fetching the project. An email notification is sent to the donor.
- **Response:**
```json
{
  "status": "success",
  "data": {
    "donorProject": {
      "id": "...",
      "status": "REJECTED",
      "rejectionReason": "Project scope is unclear",
      ...
    }
  }
}
```

### 4. Get All Users
- **Method:** `GET`
- **Endpoint:** `/api/admin/users`
- **Access:** Protected (ADMIN)
- **Headers:**
```
Authorization: Bearer <token>
```

### 5. Get All Donors
- **Method:** `GET`
- **Endpoint:** `/api/admin/donors`
- **Access:** Protected (ADMIN)
- **Headers:**
```
Authorization: Bearer <token>
```

---

## 🔔 Webhook Routes
**Base Path:** `/api/webhooks`

### 1. Stripe Webhook
- **Method:** `POST`
- **Endpoint:** `/api/webhooks/stripe`
- **Access:** Public (but verified by Stripe signature)
- **Headers:**
```
stripe-signature: <signature>
```

---

## 📊 Testing Examples

### Example 1: Register as a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Student",
    "email": "alice@example.com",
    "password": "password123",
    "role": "USER"
  }'
```

### Example 2: Register as a Donor
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Philanthropist",
    "email": "bob@example.com",
    "password": "password123",
    "role": "DONOR",
    "organizationName": "Helping Hands Foundation"
  }'
```

### Example 3: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

### Example 4: Create a User Project
```bash
curl -X POST http://localhost:5000/api/user-projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN_HERE" \
  -d '{
    "title": "Build a Learning Platform",
    "description": "A comprehensive platform for online learning with interactive features",
    "companyName": "EduTech Startup",
    "skillsRequired": ["React", "Node.js", "MongoDB"],
    "timeline": "4 months",
    "goalAmount": 7500,
    "imageUrl": "https://example.com/project.jpg"
  }'
```

### Example 5: Create a Donor Project
```bash
curl -X POST http://localhost:5000/api/donor-projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_DONOR_TOKEN_HERE" \
  -d '{
    "title": "Youth Education Initiative",
    "description": "Supporting education for underprivileged youth with scholarships and mentorship programs",
    "organization": "Education Foundation",
    "skillsRequired": ["Teaching", "Mentoring", "Curriculum Development"],
    "timeline": "6 months",
    "totalBudget": 10000,
    "imageUrl": "https://example.com/education.jpg"
  }'
```

### Example 6: Make a Donation
```bash
curl -X POST http://localhost:5000/api/donations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DONOR_TOKEN_HERE" \
  -d '{
    "amount": 250,
    "userProjectId": "507f1f77bcf86cd799439011",
    "message": "Love this idea! Good luck!",
    "anonymous": false
  }'
```

### Example 7: Student Applies to Donor Project
```bash
curl -X POST http://localhost:5000/api/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STUDENT_TOKEN_HERE" \
  -d '{
    "donorProjectId": "673bf8a2c1234567890abcde",
    "coverLetter": "I am very interested in this project because I have experience in teaching and mentoring students. I believe my skills align well with the project goals and I am passionate about education.",
    "skills": ["Teaching", "Mentoring", "Communication"]
  }'
```

### Example 8: Get My Applications (Student)
```bash
curl -X GET http://localhost:5000/api/applications/my \
  -H "Authorization: Bearer STUDENT_TOKEN_HERE"
```

### Example 9: Donor Views Applications for Their Project
```bash
curl -X GET http://localhost:5000/api/applications/donor/project/673bf8a2c1234567890abcde \
  -H "Authorization: Bearer DONOR_TOKEN_HERE"
```

### Example 10: Donor Accepts an Application
```bash
curl -X PATCH http://localhost:5000/api/applications/673abc123def456/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DONOR_TOKEN_HERE" \
  -d '{
    "status": "ACCEPTED"
  }'
```

### Example 11: Get Public User Projects
```bash
curl -X GET http://localhost:5000/api/user-projects/public
```

### Example 12: Get Public Donor Projects
```bash
curl -X GET http://localhost:5000/api/donor-projects/public
```

### Example 13: Admin - Approve User Project
```bash
curl -X PATCH http://localhost:5000/api/admin/projects/user/507f1f77bcf86cd799439011/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -d '{
    "status": "APPROVED"
  }'
```

---

## 🔑 Authentication Notes

1. **Getting a Token:**
   - Login via `/api/auth/login` or `/api/auth/register`
   - Copy the `token` from the response
   - Use it in the `Authorization` header as: `Bearer <token>`

2. **Role-Based Access:**
   - **USER**: Can create and manage user projects
   - **DONOR**: Can create donor projects and make donations
   - **ADMIN**: Can verify projects and view all users/donors

3. **Protected Routes:**
   - All routes marked as "Protected" require the `Authorization` header
   - Format: `Authorization: Bearer <your_jwt_token>`

---

## 📝 Field Validations

### User/Donor Project:
- `title`: 5-200 characters
- `description`: minimum 20 characters
- `goalAmount/totalBudget`: minimum 1
- `skillsRequired`: array of strings
- `imageUrl`: valid URI format

### Donation:
- `amount`: number, minimum 1
- `userProjectId`: valid MongoDB ObjectId
- `message`: optional string
- `anonymous`: boolean

---

## 🎓 Student Crowdfunding & Campaigns Routes
**Base Path:** `/api/campaigns`

### 1. Create Draft Campaign
- **Method:** `POST`
- **Endpoint:** `/api/campaigns`
- **Access:** Private (Student / Researcher)
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body:**
```json
{
  "title": "Autonomous Racing Drone for Collegiate Challenge",
  "category": "STARTUP_INNOVATION",
  "disbursementType": "MILESTONE_TRANCHE",
  "fundingModel": "ALL_OR_NOTHING",
  "shortDescription": "Funding specialized LiDAR sensors and carbon fiber frames for University Drone Team.",
  "storyMarkdown": "## Project Overview\nOur collegiate robotics team qualified for...",
  "coverImageUrl": "https://cdn.platform.org/uploads/drone-cover.jpg",
  "targetAmount": 4500.00,
  "minDonationAmount": 5.00,
  "currency": "USD",
  "organizationId": "d748f3b2-1111-4d1a-be29-d52cd3798939",
  "milestones": [
    {
      "title": "Tranche 1: Sensor & Electronics Acquisition",
      "targetAmount": 2500.00,
      "sequenceOrder": 1
    },
    {
      "title": "Tranche 2: Chassis Fabrication & Flight Testing",
      "targetAmount": 2000.00,
      "sequenceOrder": 2
    }
  ]
}
```
- **Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "e912f458-7f72-4d1a-be29-d52cd3799999",
    "slug": "autonomous-racing-drone-for-collegiate-challenge",
    "status": "DRAFT",
    "createdAt": "2026-08-20T23:14:44.000Z"
  }
}
```

### 2. Verify Campaign (Org Admin)
- **Method:** `POST`
- **Endpoint:** `/api/campaigns/:id/verify`
- **Access:** Private (Org Admin / Compliance Officer)
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body:**
```json
{
  "status": "APPROVED",
  "rejectionReason": null
}
```
- **Response (200 OK):**
```json
{
  "status": "success",
  "message": "Campaign successfully verified and launched.",
  "data": {
    "campaignId": "e912f458-7f72-4d1a-be29-d52cd3799999",
    "status": "LIVE",
    "verifiedByUserId": "u123-admin-uuid",
    "verifiedAt": "2026-08-20T23:45:00.000Z"
  }
}
```

### 3. Backer Donation (Idempotent Payment)
- **Method:** `POST`
- **Endpoint:** `/api/campaigns/:id/donate`
- **Access:** Public / Authenticated
- **Headers:** `Idempotency-Key: 7b99c821-4f12-4211-9232-a128e4111222`
- **Body:**
```json
{
  "amount": 100.00,
  "currency": "USD",
  "isAnonymous": false,
  "donorDisplayName": "Dr. Smith (Alumni '16)",
  "donorMessage": "Best of luck with flight testing!"
}
```
- **Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "donationId": "f111e222-7f72-4d1a-be29-d52cd3798939",
    "clientSecret": "pi_3MtwB2LkdIwxyz_secret_abc123",
    "status": "PENDING_PAYMENT"
  }
}
```

### 4. Milestone Claim Submission (Student)
- **Method:** `POST`
- **Endpoint:** `/api/campaigns/:id/milestones/:milestoneId/claim`
- **Access:** Private (Student Owner)
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body:**
```json
{
  "evidenceDocId": "doc-uuid-1122-3344",
  "studentNotes": "Attached official vendor invoice for LiDAR sensors with tax ID."
}
```
- **Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "submissionId": "sub-uuid-9988-7766",
    "submissionNumber": 2,
    "status": "PENDING_REVIEW"
  }
}
```

### 5. Milestone Review & Approval / Rejection (Org Admin / Faculty)
- **Method:** `POST`
- **Endpoint:** `/api/campaigns/:id/milestones/:milestoneId/submissions/:submissionId/review`
- **Access:** Private (Org Admin / Faculty Reviewer)
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body (Rejection Example):**
```json
{
  "status": "REJECTED",
  "rejectionReason": "Invoice #8891 is missing vendor tax ID and seal. Please re-upload verified copy."
}
```
- **Body (Approval Example):**
```json
{
  "status": "APPROVED",
  "rejectionReason": null
}
```
- **Response (200 OK):**
```json
{
  "status": "success",
  "message": "Milestone submission successfully processed.",
  "data": {
    "milestoneId": "ms-uuid-1234",
    "status": "APPROVED",
    "disbursedAt": "2026-08-20T23:55:00.000Z"
  }
}
```

### 6. Create / Request Milestone Revision (Student)
- **Method:** `POST`
- **Endpoint:** `/api/campaigns/:id/milestones/:milestoneId/revisions`
- **Access:** Private (Student Owner)
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body:**
```json
{
  "title": "Tranche 1: Sensor & Electronics Acquisition (Updated)",
  "description": "Acquisition of 4x LiDAR sensors and power distribution modules with revised vendor pricing.",
  "targetAmount": 2800.00,
  "changeReason": "LiDAR vendor updated catalog pricing by $300."
}
```
- **Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "revisionId": "rev-uuid-1122-3344",
    "revisionNumber": 2,
    "status": "PENDING_APPROVAL"
  }
}
```

### 7. Review Milestone Revision (Org Admin)
- **Method:** `POST`
- **Endpoint:** `/api/campaigns/:id/milestones/:milestoneId/revisions/:revisionId/review`
- **Access:** Private (Org Admin)
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body:**
```json
{
  "status": "APPROVED",
  "rejectionReason": null
}
```
- **Response (200 OK):**
```json
{
  "status": "success",
  "message": "Milestone revision approved and applied to active campaign.",
  "data": {
    "milestoneId": "ms-uuid-1234",
    "currentVersion": 2,
    "status": "APPROVED",
    "reviewedByUserId": "u123-admin-uuid",
    "reviewedAt": "2026-08-21T00:10:00.000Z"
  }
}
```

### 8. Get Chronological Milestone History (100+ Versions)
- **Method:** `GET`
- **Endpoint:** `/api/campaigns/:id/milestones/:milestoneId/revisions`
- **Access:** Public / Authenticated
- **Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "revisionNumber": 2,
      "title": "Tranche 1: Sensor & Electronics Acquisition (Updated)",
      "targetAmount": "2800.00",
      "changeReason": "LiDAR vendor updated catalog pricing by $300.",
      "status": "APPROVED",
      "requestedBy": { "id": "u1-student", "name": "Dino" },
      "reviewedBy": { "id": "u2-admin", "name": "Dean Smith" },
      "reviewedAt": "2026-08-21T00:10:00.000Z",
      "createdAt": "2026-08-21T00:08:00.000Z"
    },
    {
      "revisionNumber": 1,
      "title": "Tranche 1: Sensor & Electronics Acquisition",
      "targetAmount": "2500.00",
      "changeReason": "Initial milestone creation",
      "status": "APPROVED",
      "requestedBy": { "id": "u1-student", "name": "Dino" },
      "reviewedBy": null,
      "reviewedAt": null,
      "createdAt": "2026-08-20T23:14:44.000Z"
    }
  ]
}
```

---



## ⚠️ Error Responses

All errors follow this format:
```json
{
  "status": "error",
  "message": "Error description here"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `204`: No Content (successful deletion)
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error


