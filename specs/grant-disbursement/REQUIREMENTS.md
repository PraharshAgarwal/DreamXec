# Feature Specification & Requirements: Grant Disbursement Engine

---

## 🎯 Feature Overview

The **Grant Disbursement Engine** manages student research proposal scoring, reviewer assignments, milestone verification, and double-entry ledger fund transfers.

---

## 📋 Functional Requirements

### 1. Proposal Scoring & Reviewer Assignment
* Multi-reviewer score aggregation (1-10 rating scale).
* Proposal approval triggers milestone creation.

### 2. Double-Entry Disbursement Execution
* Disbursement of grant funds MUST call the Ledger Service to write balanced entries (`DEBIT` grant liability account, `CREDIT` student wallet asset account).

### 3. Milestone Release Triggers
* Milestone reports require proof upload (Document Service presigned S3 URLs) before funds are unlocked.
