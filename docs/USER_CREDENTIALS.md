# DreamXec Platform — User Credentials & Test Accounts

This document contains test credentials for all user roles across the DreamXec platform.

> **Default Password:** `Password@123` (applies to all test accounts below)

---

## 👥 Credentials Reference Table

| Role / User Type | Full Name | Email | Password | Organization & Role | Key Capabilities & Access |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Student President (Club Lead)** | Aarav Sharma | `aarav.sharma@vit.ac.in` | `Password@123` | Aero Club VIT Chennai<br/>*(Role: `STUDENT_PRESIDENT`)* | • Create & publish fundraising campaigns<br/>• Submit milestone completion proofs<br/>• Post disbursement utilization receipts<br/>• Access Student Dashboard (`/dashboard`) |
| **Student Member** | Rohan Mehta | `student.member@vit.ac.in` | `Password@123` | Aero Club VIT Chennai<br/>*(Role: `STUDENT`)* | • Verified club student dashboard<br/>• Participate in club campaigns<br/>• Track club project milestones |
| **College / University Admin** | Dean & Registrar Admin | `registrar@vit.ac.in` | `Password@123` | VIT Chennai<br/>*(Role: `ORG_ADMIN`)* | • College admin verification & oversight<br/>• Approve student club affiliations<br/>• Institutional proposal endorsements |
| **Professor / Faculty Mentor** | Prof. Rajesh Kumar | `prof.rajesh@vit.ac.in` | `Password@123` | VIT Chennai<br/>*(Role: `PROFESSOR`)* | • Endorse student campaigns<br/>• Academic milestone peer reviews<br/>• Research supervision |
| **Principal Investigator / Researcher** | Dr. Sneha Verma | `sneha.verma@vit.ac.in` | `Password@123` | VIT Chennai<br/>*(Role: `RESEARCHER`)* | • Lead AI & Robotics research programs<br/>• Submit research grant updates |
| **Incubator Manager** | Dr. Ramesh Chandra | `incubator.manager@vit.ac.in` | `Password@123` | VIT Chennai<br/>*(Role: `INCUBATOR_MANAGER`)* | • Manage startup incubation pipelines<br/>• Allocate innovation seed grants |
| **Industry Mentor** | Vikram Aditya | `vikram.mentor@vit.ac.in` | `Password@123` | Aero Club VIT Chennai<br/>*(Role: `MENTOR`)* | • Technical milestone validation<br/>• Review deliverable proof uploads |
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
