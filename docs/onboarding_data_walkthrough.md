# Onboarding & Database Population Guide (Real Examples) 🚀

Here is a step-by-step guide showing how data is populated in the tables as different roles sign up and join.

---

## Step 1: Sponsoring a Grant (Sponsor / Donor Onboarding)

### 1. Signup (Creates a User)
A corporate sponsor signs up. The database creates a `User` record:
```json
{
  "id": "user_sponsor_999",
  "email": "ashish.gupta@google.com",
  "name": "Ashish Gupta",
  "role": "DONOR",
  "organizationName": "Google Devs Trust",
  "donorVerified": false
}
```

### 2. Admin Verifies Sponsor
An admin checks Google's documents and verifies them. The database updates the User record:
```json
{
  "donorVerified": true
}
```

### 3. Sponsor Posts a Grant
The verified sponsor creates a funding grant:
```json
{
  "id": "grant_888",
  "title": "Green Tech Fund",
  "budget": 50000.0,
  "donorId": "user_sponsor_999" // Links to Ashish
}
```

---

## Step 2: Setting up Colleges & Clubs (Admin Setup)

### 1. Registering the College (University)
An organization tenant is created for the university:
```json
{
  "id": "org_univ_001",
  "name": "NIT Kurukshetra",
  "type": "UNIVERSITY",
  "parentId": null
}
```

### 2. Registering the Club inside the College
A student club is created and linked to the university:
```json
{
  "id": "org_club_002",
  "name": "Coding Club",
  "type": "CLUB",
  "parentId": "org_univ_001" // Links to NIT Kurukshetra
}
```

---

## Step 3: Student Researcher Onboarding

### 1. Signup (Creates a User)
A student named Rohan signs up:
```json
{
  "id": "user_rohan_111",
  "email": "rohan@gmail.com",
  "name": "Rohan Sharma",
  "role": "USER", // Global role is generic user
  "college": "NIT Kurukshetra"
}
```

### 2. Student Joins the College
Rohan joins the university tenant:
```json
{
  "id": "membership_001",
  "userId": "user_rohan_111",
  "organizationId": "org_univ_001", // NIT Kurukshetra
  "role": "RESEARCHER",
  "verified": false // Pending student card verification
}
```

### 3. Student Submits Verification Documents
Rohan uploads his student ID card for approval:
```json
{
  "id": "verify_222",
  "userId": "user_rohan_111",
  "fullName": "Rohan Sharma",
  "studentEmail": "rohan@gmail.com",
  "officialEmail": "rohan@nitkkr.ac.in",
  "documentUrl": "https://s3.aws.com/id_rohan.pdf",
  "status": "PENDING"
}
```
*(Once approved, `status` becomes `APPROVED` and Rohan's `UserOrganization` membership is marked `verified: true`)*.

---

## Step 4: Club President Onboarding

### 1. Signup & Joining the Club
A senior student named Sneha signs up. She is appointed as the President of the Coding Club.

**Sneha's User Record:**
```json
{
  "id": "user_sneha_333",
  "email": "sneha@gmail.com",
  "name": "Sneha Kumari",
  "role": "USER" // Globally, she is a student user
}
```

**Sneha's Club Membership Record:**
```json
{
  "id": "membership_002",
  "userId": "user_sneha_333",
  "organizationId": "org_club_002", // Coding Club
  "role": "ORG_ADMIN", // Local Role is Admin (President)
  "verified": true
}
```
*(Since she is `ORG_ADMIN` of the club, she can approve join requests, post campaigns under the club name, and add other members).*

---

## Step 5: The Project Creation Flow (The Logical Sequence)

To create a Project successfully in the database, the parent references must exist first. This dictates the order of execution:

### 🗺️ The Logical Flow Sequence:
```
1. College Created ──▶ 2. Club Created ──▶ 3. Student Signed Up ──▶ 4. Student Joins Club ──▶ 5. Project Created
```

---

### Step-by-Step Data Population:

#### 1. First, College must exist:
```json
{
  "id": "org_college_101",
  "name": "NIT Kurukshetra",
  "type": "UNIVERSITY",
  "parentId": null
}
```

#### 2. Second, Club is created (linked to College):
```json
{
  "id": "org_club_202",
  "name": "Coding Club",
  "type": "CLUB",
  "parentId": "org_college_101" // ◄ Links to College
}
```

#### 3. Third, Student account is registered:
```json
{
  "id": "user_student_303",
  "email": "rohan@gmail.com",
  "name": "Rohan Sharma",
  "role": "USER"
}
```

#### 4. Fourth, Student is mapped to the Club:
```json
{
  "id": "membership_404",
  "userId": "user_student_303",      // ◄ Links to Student
  "organizationId": "org_club_202",  // ◄ Links to Club
  "role": "RESEARCHER",
  "verified": true
}
```

#### 5. Finally, Project is created (by Student under the Club):
Now that all dependencies exist, Rohan can successfully create a new Project! 

The project links to the **Student** (as a ProjectMember) and the **Club** (since campaigns are hosted by clubs):

**A. Create the Project record:**
```json
{
  "id": "proj_505",
  "title": "IoT Automation Grid",
  "description": "Smart power grid monitor.",
  "stage": "DISCOVERY"
}
```

**B. Link the Student to the Project (Create ProjectMember):**
```json
{
  "id": "member_link_606",
  "projectId": "proj_505",        // ◄ Links to Project
  "userId": "user_student_303",   // ◄ Links to Student
  "role": "PI"                    // Rohan acts as Lead (Principal Investigator)
}
```

