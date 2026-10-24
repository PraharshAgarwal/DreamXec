# DreamXec (dx-v2.0) UI Component Catalog & Usage Guide

---

## 🧩 Component Library Architecture

The **DreamXec (dx-v2.0)** component library (`client/src/components/`) is organized into modular features supporting the campaign milestone lifecycle, Maker-Checker governance, donor engagement, and expressive visual styling.

---

## 🔘 Buttons & Interactive Controls

### Primary Action Button (`.btn-dreamx-primary`)
Used for main submit actions, campaign launches, and donation triggers.
* **Markup Example**:
  ```tsx
  <button className="btn-dreamx-primary px-6 py-3.5 flex items-center justify-center gap-2">
    <span>Fund Campaign</span>
    <ArrowRight className="w-5 h-5" />
  </button>
  ```
* **Visual Style**: DreamX Orange `#FE4E1A` background, 3px Forest Green `#0F534A` solid border, 4px `#0F534A` hard offset shadow.

### Secondary Action Button (`.btn-dreamx-secondary`)
Used for secondary actions, evidence submission, and document downloads.
* **Visual Style**: Forest Green `#0F534A` background, 3px Deep Purple `#4717AE` border, 4px `#4717AE` shadow.

### Tertiary Action Button (`.btn-dreamx-purple`)
Used for governance approvals, audit exports, and milestone sign-offs.
* **Visual Style**: Deep Purple `#4717AE` background, 3px Forest Green `#0F534A` border, 4px `#0F534A` shadow.

---

## 🎴 Cards & Containers

### Neobrutalist Standard Campaign Card (`.card-dreamx`)
Foundational container for campaigns and project listings.
```tsx
<div className="card-dreamx p-6 relative">
  <span className="badge-category bg-[#FFDD33] text-[#0F534A]">Research Grant</span>
  <h3 className="text-xl font-bold font-headline text-[#121316] mt-3">Solar Water Desalination</h3>
  <p className="text-gray-700 text-sm mt-2">Developing portable low-cost thermal units for coastal villages.</p>
</div>
```

### Expressive Featured Card (`.card-dreamx-featured`)
Warm paper background (`#FFF9F2`), 4px Deep Purple border, 8px Orange shadow with a floating `Badlooking Brush` badge.

---

## 📊 Milestone & Escrow Indicators

### Tranche Milestone Progress Tree (`InteractiveTrancheTimeline.tsx`)
Visualizes sequential milestones, acceptance deliverables, verification stamps, and payout ledger hashes.

### Segmented Funding Progress Bar (`DreamxProgressBar.tsx`)
Displays total funds collected against target with striped orange fill and milestone notch markers.

### Research Flip Counter (`ResearchFlipClock.tsx`)
Animated digital flip-clock displaying live dollars disbursed or student hours validated.

---

## 🏷️ Badges & Status Tags

| Status Tag | Visual Tokens | Usage Context |
| :--- | :--- | :--- |
| **Verified Deliverable** | `bg-[#0F534A] text-[#9EFC5F] border-2 border-[#0F534A]` | Maker-Checker approved milestone |
| **In Verification** | `bg-[#FFDD33] text-[#4717AE] border-2 border-[#4717AE]` | Under Reviewer review |
| **Urgent / Revisions** | `bg-[#F4002C] text-white border-2 border-[#0F534A]` | Action required or deadline imminent |
| **Disbursed Tranche** | `bg-[#FE4E1A] text-white border-2 border-[#0F534A]` | Escrow released to beneficiary |
| **Community Tag** | `bg-[#FEB3FC] text-[#4717AE] border-2 border-[#4717AE]` | Student club or backer badge |

---

## 🖼️ Modals & Governance Overlays

* **`MilestoneProofModal.tsx`**: Multi-file evidence uploader (PDF invoices, MP4 prototype videos) and reviewer audit checklist.
* **`DonateModal.tsx`**: Multi-step checkout with escrow transparency slider and instant double-entry ledger receipt.
* **`VerificationModal.tsx`**: Maker-Checker dual-approval interface for compliance officers.
