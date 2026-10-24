# Database Schema & Data Architecture Guide: dx-v2.0

---

## 🛢️ PostgreSQL Foundation & Extension Setup

The **dx-v2.0** database leverages specialized PostgreSQL extensions to support tree hierarchies, case-insensitive strings, and double-entry accounting integrity.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "citext";
```

---

## ⚖️ Double-Entry Ledger Schema

Financial balances are managed via an append-only double-entry ledger system.

```sql
-- Ledger Accounts
CREATE TABLE ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    account_number VARCHAR(64) UNIQUE NOT NULL,
    account_type VARCHAR(32) NOT NULL, -- 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction Headers
CREATE TABLE ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    reference_type VARCHAR(64) NOT NULL, -- 'DONATION', 'GRANT_DISBURSEMENT'
    reference_id UUID NOT NULL,
    description TEXT,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ledger Entries (Debits & Credits)
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES ledger_transactions(id) ON DELETE CASCADE,
    account_id UUID REFERENCES ledger_accounts(id),
    amount DECIMAL(18, 4) NOT NULL, -- Positive = Debit (+), Negative = Credit (-)
    entry_type VARCHAR(10) CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Zero-Sum Deferred Trigger Constraint
```sql
CREATE OR REPLACE FUNCTION check_ledger_transaction_balance() 
RETURNS TRIGGER AS $$
DECLARE
    balance_sum DECIMAL(18, 4);
BEGIN
    SELECT SUM(amount) INTO balance_sum 
    FROM ledger_entries 
    WHERE transaction_id = NEW.transaction_id;
    
    IF balance_sum <> 0 THEN
        RAISE EXCEPTION 'Ledger Transaction % is unbalanced! Debits and credits sum to %', NEW.transaction_id, balance_sum;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🌳 Hierarchical Organization Schema (`ltree`)

Organizations are stored using PostgreSQL `ltree` paths to support instant parent-child tree traversals.

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    org_type VARCHAR(50) NOT NULL, -- 'UNIVERSITY', 'NGO', 'CORPORATE', 'CLUB'
    parent_id UUID REFERENCES organizations(id),
    hierarchy_path ltree NOT NULL,
    lifecycle_status VARCHAR(32) DEFAULT 'PENDING_VERIFICATION'
);

-- Indexing for fast descendant lookups (<@) and ancestor lookups (@>)
CREATE INDEX idx_orgs_hierarchy_path ON organizations USING gist(hierarchy_path);
```

---

## 🛡️ Row-Level Security (RLS) Implementation

Multi-tenant tables enforce RLS policies based on session configuration variables:

```sql
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON workflow_templates
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

---

## 🎓 Student Crowdfunding & Campaigns Schema (`campaigns.*`)

The `campaigns` domain enables verified students to run crowdfunding campaigns with faculty endorsement, milestone-based escrow payouts, and backer reward perks.

```sql
-- Campaigns Master Table
CREATE TABLE campaigns.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organization.organizations(id),
    student_user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organization.organizations(id),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'TUITION_FEE', 'RESEARCH_GRANT', 'STARTUP_INNOVATION', 'EMERGENCY_AID', 'COMPETITION_TRAVEL', 'EXTRACURRICULAR'
    disbursement_type VARCHAR(50) DEFAULT 'MILESTONE_TRANCHE', -- 'MILESTONE_TRANCHE', 'DIRECT_TUITION_PAYOUT', 'REIMBURSEMENT'
    funding_model VARCHAR(50) DEFAULT 'FLEXIBLE', -- 'FLEXIBLE', 'ALL_OR_NOTHING'
    short_description VARCHAR(500) NOT NULL,
    story_markdown TEXT NOT NULL,
    cover_image_url VARCHAR(500) NOT NULL,
    video_url VARCHAR(500),
    target_amount DECIMAL(15, 2) NOT NULL,
    min_donation_amount DECIMAL(15, 2) DEFAULT 1.00,
    current_raised_amount DECIMAL(15, 2) DEFAULT 0.00,
    donor_count INTEGER DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'DRAFT', -- 'DRAFT', 'SUBMITTED', 'PENDING_ENDORSEMENT', 'PENDING_VERIFICATION', 'APPROVED', 'LIVE', 'PAUSED', 'FULLY_FUNDED', 'CLOSED', 'CANCELLED', 'REJECTED', 'DISBURSING', 'COMPLETED'
    
    -- Org Admin Verification Audit
    verified_by_user_id UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    escrow_account_id UUID UNIQUE REFERENCES finance.ledger_accounts(id) ON DELETE SET NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_campaigns_tenant_status ON campaigns.campaigns(tenant_id, status);
CREATE INDEX idx_campaigns_student_user ON campaigns.campaigns(student_user_id);
CREATE INDEX idx_campaigns_verified_by ON campaigns.campaigns(verified_by_user_id);
CREATE INDEX idx_campaigns_category_status ON campaigns.campaigns(category, status);

-- Campaign Milestone Tranches (Active Master State)
CREATE TABLE campaigns.campaign_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns.campaigns(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    current_version INTEGER DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'SUBMITTED', 'REJECTED', 'APPROVED', 'DISBURSED'
    disbursed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, sequence_order)
);

-- Campaign Milestone Revisions (Tracks All 100+ Edits, Diffs & Admin Approvals)
CREATE TABLE campaigns.campaign_milestone_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL REFERENCES campaigns.campaign_milestones(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15, 2) NOT NULL,
    change_reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'APPROVED', -- 'APPROVED', 'PENDING_APPROVAL', 'REJECTED'
    requested_by_user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
    reviewed_by_user_id UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(milestone_id, revision_number)
);

CREATE INDEX idx_milestone_revisions_milestone ON campaigns.campaign_milestone_revisions(milestone_id);

-- Campaign Milestone Submissions (Handles Multiple Rejections & Receipt Audit Log)
CREATE TABLE campaigns.campaign_milestone_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL REFERENCES campaigns.campaign_milestones(id) ON DELETE CASCADE,
    submission_number INTEGER DEFAULT 1,
    evidence_doc_id UUID NOT NULL REFERENCES documents.documents(id) ON DELETE RESTRICT,
    student_notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING_REVIEW', -- 'PENDING_REVIEW', 'APPROVED', 'REJECTED'
    reviewed_by_user_id UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_milestone_submissions_milestone ON campaigns.campaign_milestone_submissions(milestone_id);
CREATE INDEX idx_milestone_submissions_evidence ON campaigns.campaign_milestone_submissions(evidence_doc_id);

-- Campaign Faculty Endorsements
CREATE TABLE campaigns.campaign_endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns.campaigns(id) ON DELETE CASCADE,
    endorser_user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
    designation VARCHAR(150) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    comments TEXT,
    endorsed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, endorser_user_id)
);

-- Row-Level Security for Campaigns
ALTER TABLE campaigns.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_campaign_isolation ON campaigns.campaigns
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### 💰 Double-Entry Escrow Ledger Workflow

Every student campaign binds to an escrow liability account (`finance.ledger_accounts`).

1. **Backer Contribution ($100.00)**:
   - `DEBIT` Asset: `payments.cash_clearing_account` (+ $100.00)
   - `CREDIT` Expense: `finance.gateway_fees` (- $2.50)
   - `CREDIT` Revenue: `finance.platform_governance` (- $1.50)
   - `CREDIT` Liability: `finance.campaign_escrow:{id}` (- $96.00)

2. **Milestone Tranche Disbursement ($500.00)**:
   - `DEBIT` Liability: `finance.campaign_escrow:{id}` (+ $500.00)
   - `CREDIT` Liability: `finance.student_payout_account` / `finance.bursar_account` (- $500.00)

