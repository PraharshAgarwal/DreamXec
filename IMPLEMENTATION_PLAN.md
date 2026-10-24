# DreamXec Dual-Domain & Dual-Entity Architecture: Master Implementation Plan

> **Document Version**: 2.5.0  
> **Status**: APPROVED COMPREHENSIVE BLUEPRINT & CODE AUDIT  
> **Target Date**: October 2026  
> **Scope**: Dual-domain payment segregation (`dreamxec.com` vs `dreamxec.org`), legal entity slotting (FICPL vs DAF), database schema alignment, Maker-Checker milestone disbursements, student IP retention, minor onboarding (16–17 yrs), and statutory Indian compliance (IT Act 2000/2021, DPDP Act 2023, Income Tax Act Sec 80G/12A, Indian Contract Act Sec 11).

---

## 1. Executive Summary & Legal Entity Slotting

DreamXec operates on a **Single Server / Shared IP** (`172.31.15.107` / AWS EC2 + Render fallback) serving two distinct domains with strictly segregated legal, regulatory, and financial jurisdictions :

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │               JAY KUMAR GUPTA (Individual)             │
                                    │         • Proprietary IP & "DreamXec" Trademark         │
                                    └───────────────┬────────────────────────┬───────────────┘
                                                    │ Trademark License      │ Charter License
                                                    ▼                        ▼
               ┌──────────────────────────────────────────┐    ┌──────────────────────────────────────────┐
               │  DreamXec Technologies Private Limited   │    │        DreamXec Academic Foundation      │
               │                 (FICPL)                  │    │                  (DAF)                   │
               ├──────────────────────────────────────────┤    ├──────────────────────────────────────────┤
               │ • Commercial Web App & SaaS Platform     │    │ • Non-Profit Public Foundation / Trust   │
               │ • Domain: https://www.dreamxec.com       │    │ • Domain: https://www.dreamxec.org       │
               │ • Razorpay Gateway: RAZORPAY_KEY_ID_1    │    │ • Razorpay Gateway: RAZORPAY_KEY_ID_2    │
               │ • Bank Account: Commercial Current Bank  │    │ • Bank Account: Dedicated Escrow Account │
               │ • Tax Document: GST Tax Invoice          │    │ • Tax Document: Section 80G Certificate  │
               │ • Revenue: Subscriptions & Tech Fees     │    │ • Funds: Student Grants & CSR Inflows    │
               └──────────────────────────────────────────┘    └──────────────────────────────────────────┘
```

### Statutory Comparison Matrix

| Jurisdiction | Commercial SaaS & Tech Platform (`dreamxec.com`) | Public Foundation & Research Crowdfunding (`dreamxec.org`) |
| :--- | :--- | :--- |
| **Operating Entity** | **DreamXec Technologies Private Limited** (FICPL) | **DreamXec Academic Foundation** (DAF - Section 8 / Trust) |
| **Trademark & IP** | Exclusive commercial license from Founder / Individual | Exclusive non-profit charter license from Founder / Individual |
| **Registered Office** | AR-101, Eldeco Accolade, Sohna, Gurgaon, HR - 122103 | AR-101, Eldeco Accolade, Sohna, Gurgaon, HR - 122103 |
| **Statutory Role** | Software vendor, SaaS provider, Technology operator | Grantmaker, Public Escrow Nodal Manager, 80G Issuer |
| **Tax Regime** | Corporate Income Tax (22–25%) + 18% GST | Exempt under Section 12A / 80G / CSR-1 Registered |
| **Bank Account** | Commercial Bank Account (FICPL) | Dedicated Non-Profit Escrow Account (DAF) |
| **Payment Gateway** | Razorpay Account 1 (`RAZORPAY_KEY_ID_1`) | Razorpay Account 2 (`RAZORPAY_KEY_ID_2`) |
| **Tax Document Issued**| GST Statutory Tax Invoice (Form GST INV-1) | Section 80G Tax Exemption Certificate (Form 10BE) |
| **Applicable Products** | College Admin SaaS, Recruiter Cards, Student Tools | Student Research Crowdfunding, CSR Grants, Gov Grants |

---

## 2. Statutory Legal Rationale & Indian Laws Compliance

### A. Income Tax Act, 1961 (Sections 12A, 80G, & Rule 18AB)
- **The Code Reason**: Public research crowdfunding contributions and CSR donations **cannot legally enter a Private Limited company's bank account**. If donor funds hit FICPL, the funds are immediately classified as taxable commercial revenue (subject to 22–25% corporate tax + 18% GST), and the donor forfeits their Section 80G tax deduction.
- **The Architectural Guard**: In `server/src/modules/donations/donation.service.js`, all crowdfunding pledges and CSR contributions must be hardcoded to `RAZORPAY_KEY_ID_2` (DAF). Receipts generated via `client/src/utils/generate80GTaxReceiptPdf.ts` must display DAF's 12A/80G URN and Form 10BE compliance details.

### B. RBI Escrow & Payment Aggregator (PA) Guidelines
- **The Code Reason**: Under RBI guidelines, a private tech company cannot act as an unregistered custodial intermediary holding crowdsourced public funds for third parties (students/colleges).
- **The Architectural Guard**: DAF (Section 8) holds the non-profit escrow account. Milestone disbursements are programmed through RazorpayX nodal payouts directly from DAF's escrow account to verified vendors or student/university bank accounts. FICPL receives only an arms-length technology licensing fee from DAF.

### C. Digital Personal Data Protection Act, 2023 (DPDP Act) & Minor Consent
- **The Code Reason**: Section 9 of the DPDP Act 2023 mandates verifiable parental/guardian consent before processing any personal data of a minor (under 18 years old). Furthermore, tracking or behavioral profiling of minors is strictly prohibited.
- **The Architectural Guard**: For high school / junior college innovators aged 16–17, `client/src/components/RegisterPage.tsx` must capture `dateOfBirth`. If `age < 18`, registration requires guardian details and parental consent undertaking before proposal submission.

### D. Indian Contract Act, 1872 (Section 11 - Competence to Contract)
- **The Code Reason**: Under Section 11 of the Indian Contract Act, minors are legally incompetent to enter into binding financial contracts. A minor cannot execute an escrow disbursement agreement alone.
- **The Architectural Guard**: Minor proposals on `dreamxec.org` cannot launch or receive disbursements without:
  1. A verified Faculty Guide/Institution endorsement (`CampaignEndorsement` in `client/src/components/admin/AdminFacultyEndorsements.tsx`).
  2. Co-signature or authorization from the institution or adult guardian.

### E. IT Act 2000 & 2021 Intermediary Guidelines (Rule 3(2))
- **The Code Reason**: Platforms hosting user-generated research proposals and campaigns must publish the contact details of a Statutory Grievance Redressal Officer on their website with an acknowledgment SLA (within 24 hours) and disposal SLA (within 15 calendar days).
- **The Architectural Guard**: Both `dreamxec.com` and `dreamxec.org` footers (`DesktopFooter.tsx`) must display:
  - **Grievance Officer**: Jay Kumar Gupta
  - **Registered Office**: AR-101, Eldeco Accolade, Sohna, Gurgaon, Haryana - 122103
  - **Email**: `grievance@dreamxec.com` / `grievance@dreamxec.org`

### F. Student Intellectual Property (IP) Ownership Protection
- **The Code Reason**: Students and academic institutions must retain 100% ownership of patents, copyrights, schematics, and prototype code. If DreamXec claimed equity or IP ownership, university incubator partnerships and research grants would be legally jeopardized.
- **The Architectural Guard**: Step 5 of `CreateCampaign.tsx` and platform terms must explicitly affirm student IP retention, granting DreamXec only a limited display license for project milestone validation.

---

## 3. Codebase Inspection & Architectural Gaps

### A. Gateway Credential Resolution (`server/src/config/razorpay.config.js`)
- **Current Behavior**:
  - `resolveRazorpayCredentials(reqOrOrigin)` inspects `x-client-domain`, `Origin`, `Referer`, and `Host`.
  - Matches `domain2` (`dreamxec.org`) &rarr; returns `creds2`; else falls back to `creds1` (`dreamxec.com`).
- **Code Gap**:
  - If a user browsing `dreamxec.com` clicks an embedded student research campaign and pledges funds, header-based routing defaults to `creds1` (FICPL - commercial taxable account).
- **Code Solution**:
  - Update `resolveRazorpayCredentials(context, purpose)` to evaluate `purpose`. Philanthropic transactions (`RESEARCH_DONATION`, `CSR_CONTRIBUTION`) must unconditionally route to `creds2` (DAF), regardless of the origin domain.

### B. Donation Service Order Creation (`server/src/modules/donations/donation.service.js`)
- **Current Lines 50–99**:
  ```javascript
  async createDonationOrder({ amount, projectId, message, anonymous, email, name, user, origin, req }) {
    // ...
    const order = await this.paymentGateway.createOrder({
      amount: donationAmount * 100,
      currency: 'INR',
      receipt: `rcpt_${donation.id.slice(0, 10)}`,
      notes: { donationId: donation.id, projectId },
      origin,
      req,
    });
  }
  ```
- **Code Gap**: `createOrder` does not pass `purpose: 'RESEARCH_DONATION'`, leaving routing vulnerable if headers are absent or localhost.
- **Code Solution**: Explicitly pass `purpose: 'RESEARCH_DONATION'` into `this.paymentGateway.createOrder({ ..., purpose: 'RESEARCH_DONATION' })`.

### C. Database Models (`server/prisma/schema.prisma`)
- **Current State**:
  - `User` model (lines 41–92 in `identity` schema) has `apaarId`, `isKycVerified`, and `kycVerifiedAt`.
  - `MilestoneDisbursement` (lines 1325–1360 in `finance` schema) already contains `makerUserId`, `checkerUserId`, and `status: DisbursementStatus (PENDING_CHECKER, AUTHORIZED, PROCESSING, SETTLED, FAILED)`.
  - `UtilizationProof` tracks vendor name, invoice number, amount claimed, and verified status.
- **Code Gap**:
  - `User` lacks explicit minor compliance fields (`dateOfBirth`, `isMinor`, `parentConsentSigned`, `guardianName`, `guardianEmail`).
  - `PaymentIntent` and `Donation` lack an `entityJurisdiction` field (`COMMERCIAL_FICPL` vs `FOUNDATION_DAF`), making cross-entity tax audit reporting difficult.
- **Code Solution**:
  - Add DOB and minor consent fields to `User`.
  - Add `entityJurisdiction` to `PaymentIntent` and `Donation`.

### D. Maker-Checker Financial Engine (`server/src/modules/admin/controllers/admin-milestone.controller.js`)
- **Current State**:
  - Lines 169–196: Maker review sets milestone disbursement to `PENDING_CHECKER` and sets `makerUserId`.
  - Lines 367–378: `authorizeDisbursement` enforces the 4-eyes principle:
    ```javascript
    if (disb.makerUserId && disb.makerUserId === req.user?.id && !isSuperAdmin) {
      throw new AppError('Dual-Custody Violation: The Maker who verified the milestone deliverables cannot authorize the financial release. A separate Finance/Treasury Officer must authorize as Checker.', 403);
    }
    ```
  - Lines 384–405: Calls `ledgerService.postMilestoneDisbursement` and transitions status to `SETTLED`.
- **Architectural Readiness**: The backend maker-checker logic is robust and conforms to dual-custody audit standards. The next step is connecting live RazorpayX payout APIs for automated bank releases.

### E. Document Generators (`client/src/utils/`)
- **Current State**:
  - `generate80GTaxReceiptPdf.ts`: Generates Form 10BE Section 80G certificates under "DREAMXEC INNOVATION FOUNDATION".
  - `generateInvoicePdf.ts`: Currently also displays "DREAMXEC INNOVATION FOUNDATION" on lines 147–156.
- **Code Gap**: Commercial SaaS subscriptions and corporate talent access fees on `dreamxec.com` must issue invoices under **DreamXec Technologies Private Limited** with GST details, not the non-profit foundation.
- **Code Solution**: Update `generateInvoicePdf.ts` to output FICPL company details, CIN, and GSTIN for commercial transactions, and `generate80GTaxReceiptPdf.ts` to output DAF details with the official Gurgaon registered office address.

---

## 4. Multi-Domain Routing Flowchart

```
                            ┌────────────────────────────────────────────────────────┐
                            │                 Client Payment Request                 │
                            │              (Donation, SaaS, or Grant)                │
                            └───────────────────────────┬────────────────────────────┘
                                                        │
                                                        ▼
                                       ┌─────────────────────────────────┐
                                       │     Is Transaction Purpose      │
                                       │    Philanthropic or Research?   │
                                       └────────┬───────────────┬────────┘
                                                │               │
                                       YES      │               │ NO
                                                ▼               ▼
                      ┌───────────────────────────────────┐   ┌───────────────────────────────────┐
                      │ Route to DAF Gateway              │   │ Route to FICPL Gateway            │
                      │ Key: RAZORPAY_KEY_ID_2            │   │ Key: RAZORPAY_KEY_ID_1            │
                      │ Bank: Non-Profit Escrow (DAF)     │   │ Bank: Commercial Bank (FICPL)     │
                      │ Header: dreamxec.org              │   │ Header: dreamxec.com              │
                      └─────────────────┬─────────────────┘   └─────────────────┬─────────────────┘
                                        │                                       │
                                        ▼                                       ▼
                      ┌───────────────────────────────────┐   ┌───────────────────────────────────┐
                      │ Issue Form 10BE Section 80G Cert  │   │ Issue Form GST INV-1 Tax Invoice  │
                      │ "DreamXec Academic Foundation"    │   │ "DreamXec Technologies Pvt. Ltd." │
                      │ CIN/Trust Reg • 12A/80G URN       │   │ CIN • GSTIN Registered            │
                      └─────────────────┬─────────────────┘   └───────────────────────────────────┘
                                        │
                                        ▼
                      ┌───────────────────────────────────────────────────────────┐
                      │                 Maker-Checker Milestone Escrow            │
                      ├───────────────────────────────────────────────────────────┤
                      │ 1. Student submits: Geotagged prototype photos, lab logs, │
                      │    and vendor GST invoices.                               │
                      │ 2. Grant Officer (Maker) verifies deliverables:           │
                      │    Disbursement marked PENDING_CHECKER.                   │
                      │ 3. Finance Officer (Checker) validates ledger & invoice:  │
                      │    Disbursement authorized & settled via RazorpayX.       │
                      └───────────────────────────────────────────────────────────┘
```

---

## 5. Detailed Phase-by-Phase Roadmap

### Phase 1: Purpose-Aware Gateway Routing (Backend)
- **Goal**: Prevent cross-domain pledge leakage by prioritizing transaction purpose over domain headers.
- **Target Files**:
  - `server/src/config/razorpay.config.js`
  - `server/src/modules/donations/donation.service.js`
  - `server/src/modules/donations/adapters/razorpay-payment.adapter.js`
- **Actions**:
  1. Add `TransactionPurpose` enumeration:
     - DAF (Non-profit): `RESEARCH_DONATION`, `CSR_CONTRIBUTION`, `GOVERNMENT_GRANT`.
     - FICPL (Commercial): `COLLEGE_SAAS_SUBSCRIPTION`, `CORPORATE_TALENT_ACCESS`, `PREMIUM_STUDENT_SERVICE`.
  2. Modify `resolveRazorpayCredentials(context, purpose)`:
     - If purpose is philanthropic &rarr; enforce `creds2`.
     - If purpose is commercial &rarr; enforce `creds1`.
     - If purpose is omitted &rarr; resolve via `extractDomainFromRequest(context)`.
  3. Ensure `createDonationOrder` explicitly passes `purpose: TransactionPurpose.RESEARCH_DONATION`.

### Phase 2: Minor Onboarding, DPDP Compliance & Faculty Guide Gate
- **Goal**: Comply with DPDP Act 2023 §9 and Contract Act 1872 §11 for 16–17 year old innovators.
- **Target Files**:
  - `server/prisma/schema.prisma`
  - `client/src/components/RegisterPage.tsx`
  - `client/src/components/CreateCampaign.tsx`
  - `client/src/components/admin/AdminFacultyEndorsements.tsx`
- **Actions**:
  1. Add fields to `User` in `schema.prisma`:
     - `dateOfBirth DateTime? @map("date_of_birth") @db.Date`
     - `isMinor Boolean @default(false) @map("is_minor")`
     - `parentConsentSigned Boolean @default(false) @map("parent_consent_signed")`
     - `guardianName String? @map("guardian_name") @db.VarChar(255)`
     - `guardianEmail String? @map("guardian_email") @db.VarChar(255)`
  2. In `RegisterPage.tsx`:
     - Add Date of Birth input field.
     - Auto-calculate age. If `age < 18`:
       - Show Guardian Name and Guardian Email fields.
       - Display mandatory Parental Consent Undertaking checkbox.
  3. In `CreateCampaign.tsx`:
     - If creator is a minor, require nominating an institutional Faculty Guide.
     - Campaign proposal remains in `PENDING_FACULTY_ENDORSEMENT` until approved via `AdminFacultyEndorsements.tsx`.

### Phase 3: Student IP Ownership & Legal Protections
- **Goal**: Guarantee student IP retention and provide statutory clarity.
- **Target Files**:
  - `client/src/components/CreateCampaign.tsx` (Step 5)
  - `client/src/sections/Footer/components/DesktopFooter.tsx`
  - Platform Terms of Service
- **Actions**:
  1. In `CreateCampaign.tsx` (Step 5):
     - Add dedicated Student IP Retention checkbox:
       > *"I confirm that all research code, hardware schematics, laboratory prototypes, and patentable inventions remain 100% the intellectual property of the student team and their affiliated institution. Neither DreamXec Academic Foundation nor DreamXec Technologies Pvt. Ltd. claims any equity or IP ownership."*
  2. In `DesktopFooter.tsx`:
     - Add footer legal notices:
       - `dreamxec.com` is operated by DreamXec Technologies Private Limited (Commercial SaaS).
       - `dreamxec.org` is operated by DreamXec Academic Foundation (Section 8 Non-Profit).
       - Registered Office: AR-101, Eldeco Accolade, Sohna, Gurgaon, Haryana - 122103.

### Phase 4: Statutory Grievance Redressal Mechanism
- **Goal**: Comply with Rule 3(2) of the Information Technology (Intermediary Guidelines) Rules, 2021.
- **Target Files**:
  - `client/src/sections/Footer/components/DesktopFooter.tsx`
  - `client/src/app/AppRoutes.tsx` (Dedicated `/grievance` modal/route)
- **Actions**:
  1. Display Grievance Officer details in the footer and on a dedicated modal:
     - **Officer Name**: Jay Kumar Gupta
     - **Role**: Statutory Grievance & Compliance Officer
     - **Address**: AR-101, Eldeco Accolade, Sohna, Gurgaon, Haryana - 122103, India
     - **Email**: `grievance@dreamxec.com` / `grievance@dreamxec.org`
     - **Acknowledgment SLA**: Within 24 hours
     - **Disposal SLA**: Within 15 calendar days

### Phase 5: Maker-Checker Escrow & Document Standardization
- **Goal**: Align financial PDFs and live disbursements with statutory accounting.
- **Target Files**:
  - `client/src/utils/generateInvoicePdf.ts`
  - `client/src/utils/generate80GTaxReceiptPdf.ts`
  - `client/src/components/finance/FinanceOfficerDashboard.tsx`
- **Actions**:
  1. In `generateInvoicePdf.ts`:
     - Update issuer to **DreamXec Technologies Private Limited** with Gurgaon address and GSTIN format for commercial transactions.
  2. In `generate80GTaxReceiptPdf.ts`:
     - Ensure issuer is **DreamXec Academic Foundation** with Section 80G Form 10BE formatting and Gurgaon address.
  3. In `FinanceOfficerDashboard.tsx`:
     - Confirm Maker-Checker 4-eyes segregation is visual in the UI with Maker signoff badge and Checker release action.

---

## 6. End-to-End Verification & Testing Matrix

| ID | Test Scenario | Domain | Transaction Purpose | Expected Gateway | Issuer On Document | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-1** | Public donor backs student research | `dreamxec.org` | `RESEARCH_DONATION` | `RAZORPAY_KEY_ID_2` | DreamXec Academic Foundation | Section 80G Form 10BE Receipt issued |
| **TC-2** | Cross-domain click (donor clicks on .com) | `dreamxec.com` | `RESEARCH_DONATION` | `RAZORPAY_KEY_ID_2` | DreamXec Academic Foundation | Purpose Guard overrides header; routes to DAF |
| **TC-3** | College Admin pays annual SaaS subscription | `dreamxec.com` | `COLLEGE_SAAS_SUBSCRIPTION` | `RAZORPAY_KEY_ID_1` | DreamXec Technologies Pvt. Ltd. | GST Tax Invoice issued (18% GST) |
| **TC-4** | Recruiter subscribes to student talent portal | `dreamxec.com` | `CORPORATE_TALENT_ACCESS` | `RAZORPAY_KEY_ID_1` | DreamXec Technologies Pvt. Ltd. | B2B GST Tax Invoice issued |
| **TC-5** | 16-year-old student registers | `dreamxec.org` | User Registration | N/A | N/A | Requires Guardian name, email & consent checkbox |
| **TC-6** | Minor submits project proposal | `dreamxec.org` | Proposal Creation | N/A | N/A | Proposal held until Faculty Guide endorses |
| **TC-7** | Grant Officer attempts Maker + Checker release | `dreamxec.org` | Milestone Disbursement | N/A | N/A | Blocked with 403 "Dual-Custody Violation" |
| **TC-8** | Finance Officer authorizes release | `dreamxec.org` | Milestone Disbursement | RazorpayX Payout | DreamXec Academic Foundation | Milestone settled; double-entry ledger posted |

---

## 7. Environment & Deployment Configuration (AWS EC2 & Render)

Both servers (AWS EC2 `172.31.15.107` and Render fallback) operate with the following clean `.env` structure:

```env
# ── Multi-Domain Binding ──
DOMAIN_1=dreamxec.com
DOMAIN_2=dreamxec.org

# ── Commercial SaaS & Tech Platform (Pvt Ltd / FICPL) ──
RAZORPAY_KEY_ID_1=rzp_test_Tod9hDmKLicqzB
RAZORPAY_KEY_SECRET_1=lO5sB0HUcMVMzlQJ9rDRuENE
RAZORPAY_WEBHOOK_SECRET_1=abc123xyz789

# ── Non-Profit Foundation & Research Escrow (DAF) ──
RAZORPAY_KEY_ID_2=rzp_test_Tod9hDmKLicqzB
RAZORPAY_KEY_SECRET_2=lO5sB0HUcMVMzlQJ9rDRuENE
RAZORPAY_WEBHOOK_SECRET_2=abc123xyz789

# ── Simulation & Testing Flags ──
RAZORPAY_SIMULATION=true
RAZORPAYX_SIMULATION=true

# ── Registered Corporate & Foundation Metadata ──
COMPANY_NAME_COMMERCIAL="DreamXec Technologies Private Limited"
COMPANY_NAME_FOUNDATION="DreamXec Academic Foundation"
COMPANY_REGISTERED_ADDRESS="AR-101, Eldeco Accolade, Sohna, Gurgaon, Haryana - 122103"

# ── Statutory Grievance Redressal (IT Rules 2021) ──
GRIEVANCE_OFFICER_NAME="Jay Kumar Gupta"
GRIEVANCE_OFFICER_EMAIL="grievance@dreamxec.com"
GRIEVANCE_OFFICER_PHONE="+91-124-XXXXXXX"
```
