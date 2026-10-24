# DreamXec Platform — User Credentials & Test Accounts

This document contains test credentials for all user roles across the DreamXec platform.

> **Default Password:** `Password@123` (applies to all test accounts below)

---

## 👥 Credentials Reference Table

| Role / User Type | Full Name | Email | Password | Organization & Role | Key Capabilities & Access |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Student President (Club Lead)** | Aarav Sharma | `aarav.sharma@nitkkr.ac.in` | `Password@123` | Aero Club NIT Kurukshetra<br/>*(Role: `STUDENT_PRESIDENT`)* | • Create & publish fundraising campaigns<br/>• Submit milestone completion proofs<br/>• Post disbursement utilization receipts<br/>• Access Student Dashboard (`/dashboard`) |
| **Student Member** | Rohan Mehta | `student.member@nitkkr.ac.in` | `Password@123` | Aero Club NIT Kurukshetra<br/>*(Role: `STUDENT`)* | • Verified club student dashboard<br/>• Participate in club campaigns<br/>• Track club project milestones |
| **College / University Admin** | Dean & Registrar Admin | `registrar@nitkkr.ac.in` | `Password@123` | NIT Kurukshetra<br/>*(Role: `ORG_ADMIN`)* | • College admin verification & oversight<br/>• Approve student club affiliations<br/>• Institutional proposal endorsements |
| **Professor / Faculty Mentor** | Prof. Rajesh Kumar | `prof.rajesh@nitkkr.ac.in` | `Password@123` | NIT Kurukshetra<br/>*(Role: `PROFESSOR`)* | • Endorse student campaigns<br/>• Academic milestone peer reviews<br/>• Research supervision |
| **Principal Investigator / Researcher** | Dr. Sneha Verma | `sneha.verma@nitkkr.ac.in` | `Password@123` | NIT Kurukshetra<br/>*(Role: `RESEARCHER`)* | • Lead AI & Robotics research programs<br/>• Submit research grant updates |
| **Incubator Manager** | Dr. Ramesh Chandra | `incubator.manager@nitkkr.ac.in` | `Password@123` | NIT Kurukshetra<br/>*(Role: `INCUBATOR_MANAGER`)* | • Manage startup incubation pipelines<br/>• Allocate innovation seed grants |
| **Industry Mentor** | Vikram Aditya | `vikram.mentor@nitkkr.ac.in` | `Password@123` | Aero Club NIT Kurukshetra<br/>*(Role: `MENTOR`)* | • Technical milestone validation<br/>• Review deliverable proof uploads |
| **Individual Donor (Philanthropist)** | Ananya Singhania | `donor@dreamxec.com` | `Password@123` | Acme Ventures & Philanthropy<br/>*(Role: `DONOR`)* | • Fund student campaigns via escrow<br/>• Review milestone progress & release tranches<br/>• Access Donor Dashboard (`/donor/dashboard`) |
| **Corporate CSR Partner** | Acme Philanthropic Trust | `donor.corporate@dreamxec.com` | `Password@123` | Acme Ventures & Philanthropy<br/>*(Role: `CORPORATE_ADMIN`)* | • Allocate corporate CSR grants<br/>• Corporate compliance & ESG impact reporting |
| **Platform Super Admin** | DX Platform Admin | `dx.admin@dreamxec.com` | `Password@123` | DX Platform Governance<br/>*(Role: `ORG_ADMIN` / `ADMIN`)* | • Full Admin Console access (`/dx-admin`)<br/>• Manage all campaigns, clubs, & users<br/>• Financial ledger & audit logs |
| **Chief Compliance Officer** | Chief Compliance Officer | `compliance@dreamxec.com` | `Password@123` | DX Platform Governance<br/>*(Role: `COMPLIANCE_OFFICER` / `ADMIN`)* | • Financial disbursement validation (Maker-Checker)<br/>• Legal & KYC clearance for escrow payouts |

---

## 🛠️ Seeding / Resetting Credentials

To re-seed or ensure all accounts exist with updated passwords in your local or staging database, run:

```bash
node server/src/scripts/seed-all-user-credentials.js
```
