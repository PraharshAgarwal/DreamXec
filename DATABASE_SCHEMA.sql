-- ============================================================================
-- SOCIAL IMPACT PLATFORM - PostgreSQL Production DDL Schema (Multi-Schema Contexts)
-- Redesigned for High Concurrency, Bounded Contexts, and Normalized Relationships
-- ============================================================================

-- Enable required global system extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ----------------------------------------------------------------------------
-- CREATE BOUNDED CONTEXT NAMESPACES (SCHEMAS)
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS organization;
CREATE SCHEMA IF NOT EXISTS workflow;
CREATE SCHEMA IF NOT EXISTS verification;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS documents;
CREATE SCHEMA IF NOT EXISTS notifications;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS search;
CREATE SCHEMA IF NOT EXISTS jobs;

-- ============================================================================
-- 1. IDENTITY DOMAIN SCHEMA (identity.*)
-- ============================================================================

CREATE TYPE identity.account_status_type AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE identity.session_status_type AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

CREATE TABLE identity.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    account_status identity.account_status_type NOT NULL DEFAULT 'ACTIVE',
    profile_metadata JSONB DEFAULT '{}'::jsonb, -- dynamic attributes (e.g. occupation, gender, bio)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE identity.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    access_token_hash VARCHAR(255) UNIQUE NOT NULL,
    refresh_token_hash VARCHAR(255) UNIQUE NOT NULL,
    active_tenant_id UUID, -- References organization.organizations (soft link due to cross-schema)
    device_info JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    status identity.session_status_type NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE identity.inbox_events (
    id UUID PRIMARY KEY,
    event_source VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. ORGANIZATION DOMAIN SCHEMA (organization.*)
-- ============================================================================

CREATE TYPE organization.lifecycle_status_type AS ENUM (
    'DRAFT', 'SUBMITTED', 'PENDING_VERIFICATION', 'VERIFICATION_REQUESTED',
    'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'ARCHIVED', 'MERGED', 'DELETED'
);

CREATE TYPE organization.membership_status_type AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REMOVED');

CREATE TABLE organization.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES organization.organizations(id) ON DELETE SET NULL,
    hierarchy_path LTREE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    org_type VARCHAR(100) NOT NULL, -- e.g. 'UNIVERSITY', 'NGO', 'CORPORATE'
    lifecycle_status organization.lifecycle_status_type NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE organization.capabilities (
    slug VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE organization.organization_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    capability_slug VARCHAR(100) NOT NULL REFERENCES organization.capabilities(slug) ON DELETE CASCADE,
    enabled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    disabled_at TIMESTAMP WITH TIME ZONE,
    enabled_by UUID NOT NULL, -- References identity.users(id)
    expires_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_org_capability UNIQUE (organization_id, capability_slug)
);

CREATE TABLE organization.capability_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    capability_slug VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'ENABLED', 'DISABLED', 'EXPIRED'
    performed_by UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE organization.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References identity.users(id)
    organization_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    designation VARCHAR(150),
    department VARCHAR(150),
    status organization.membership_status_type NOT NULL DEFAULT 'PENDING',
    joined_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID,
    accepted_at TIMESTAMP WITH TIME ZONE,
    removed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_user_membership UNIQUE (user_id, organization_id)
);

CREATE TABLE organization.membership_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_invitation UNIQUE (email, organization_id)
);

CREATE TABLE organization.membership_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'INVITED', 'JOINED', 'SUSPENDED', 'REMOVED'
    performed_by UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature Flags & Rollouts Context
CREATE TABLE organization.features (
    slug VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE organization.tenant_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    feature_slug VARCHAR(100) NOT NULL REFERENCES organization.features(slug) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    configuration JSONB DEFAULT '{}'::jsonb, -- Feature toggles inside modular structures
    CONSTRAINT unique_tenant_feature UNIQUE (tenant_id, feature_slug)
);

-- Zanzibar ReBAC Relationship Tuples
CREATE TABLE organization.relation_tuples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    namespace VARCHAR(100) NOT NULL,
    object_id UUID NOT NULL,
    relation VARCHAR(100) NOT NULL,
    subject_namespace VARCHAR(100) NOT NULL,
    subject_id UUID NOT NULL,
    subject_relation VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_tuples_uniqueness ON organization.relation_tuples (
    tenant_id, namespace, object_id, relation, subject_namespace, subject_id, COALESCE(subject_relation, '')
);

CREATE TABLE organization.access_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    effect VARCHAR(10) NOT NULL DEFAULT 'ALLOW' CHECK (effect IN ('ALLOW', 'DENY')),
    action_pattern VARCHAR(100) NOT NULL,
    conditions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE organization.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    correlation_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSED, FAILED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE organization.inbox_events (
    id UUID PRIMARY KEY,
    event_source VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS Policy helper setting linking back to organization context
ALTER TABLE identity.sessions ADD CONSTRAINT fk_sessions_tenant FOREIGN KEY (active_tenant_id) REFERENCES organization.organizations(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- Triggers to auto-build ltree hierarchy paths
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION organization.update_org_hierarchy_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path LTREE;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.hierarchy_path := text2ltree(replace(NEW.id::text, '-', '_'));
    ELSE
        SELECT hierarchy_path INTO parent_path FROM organization.organizations WHERE id = NEW.parent_id;
        IF parent_path IS NULL THEN
            RAISE EXCEPTION 'Parent organization % not found.', NEW.parent_id;
        END IF;
        NEW.hierarchy_path := parent_path || text2ltree(replace(NEW.id::text, '-', '_'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_org_hierarchy_path
BEFORE INSERT OR UPDATE OF parent_id ON organization.organizations
FOR EACH ROW
EXECUTE FUNCTION organization.update_org_hierarchy_path();

-- ============================================================================
-- 3. WORKFLOW ENGINE DOMAIN SCHEMA (workflow.*)
-- ============================================================================

CREATE TYPE workflow.instance_status_type AS ENUM ('DRAFT', 'SUBMITTED', 'IN_PROGRESS', 'REVIEW_PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE workflow.workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES organization.organizations(id) ON DELETE CASCADE, -- NULL = global
    name VARCHAR(255) NOT NULL,
    description TEXT,
    applies_to_org_types VARCHAR(100)[] NOT NULL,
    version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (tenant_id, name, version)
);

CREATE TABLE workflow.workflow_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES workflow.workflow_templates(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    stage_order INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (template_id, stage_order)
);

CREATE TABLE workflow.workflow_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES workflow.workflow_templates(id) ON DELETE CASCADE,
    from_stage_id UUID REFERENCES workflow.workflow_stages(id) ON DELETE CASCADE, -- NULL = entry transition
    to_stage_id UUID NOT NULL REFERENCES workflow.workflow_stages(id) ON DELETE CASCADE,
    trigger_type VARCHAR(100) NOT NULL, -- 'AUTO_ON_DOC_UPLOAD', 'MANUAL_REVIEW'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE workflow.workflow_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID NOT NULL REFERENCES workflow.workflow_stages(id) ON DELETE CASCADE,
    rule_name VARCHAR(150) NOT NULL,
    rule_type VARCHAR(100) NOT NULL, -- 'EMAIL_VERIFICATION', 'BANK_ACCOUNT_VERIFICATION', 'AI_DOCUMENT_OCR'
    configuration JSONB DEFAULT '{}'::jsonb, -- e.g. {required_doc_type: "CIN", confidence_threshold: 80}
    is_required BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE workflow.workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES workflow.workflow_templates(id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    applicant_email CITEXT NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    org_type VARCHAR(100) NOT NULL,
    status workflow.instance_status_type NOT NULL DEFAULT 'DRAFT',
    current_stage_id UUID REFERENCES workflow.workflow_stages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE workflow.workflow_stage_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES workflow.workflow_instances(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES workflow.workflow_stages(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE workflow.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    correlation_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE workflow.inbox_events (
    id UUID PRIMARY KEY,
    event_source VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. VERIFICATION PIPELINE DOMAIN SCHEMA (verification.*)
-- ============================================================================

CREATE TYPE verification.verification_status_type AS ENUM ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'FAILED');

CREATE TABLE verification.verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES workflow.workflow_instances(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    verification_type VARCHAR(100) NOT NULL, -- e.g., 'EMAIL', 'DOMAIN', 'CIN', 'PAN', 'BANK_ACCOUNT'
    status verification.verification_status_type NOT NULL DEFAULT 'PENDING',
    evidence_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Trust & Risk Traceable Framework
CREATE TABLE verification.risk_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'DOCUMENT', 'GEOLOCATION', 'REGISTRY'
    weight DECIMAL(5,2) NOT NULL,    -- Percentage weight
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE verification.risk_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES verification.verifications(id) ON DELETE CASCADE,
    risk_rule_id UUID NOT NULL REFERENCES verification.risk_rules(id) ON DELETE RESTRICT,
    value_checked VARCHAR(255),
    computed_score DECIMAL(5,2) NOT NULL, -- 0 to 100
    is_violation BOOLEAN NOT NULL DEFAULT FALSE,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE verification.trust_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES verification.verifications(id) ON DELETE CASCADE,
    factor_name VARCHAR(150) NOT NULL, -- 'GOVERNMENT_REGISTRY_MATCH', 'EMAIL_DOMAIN_MATCH'
    computed_score DECIMAL(5,2) NOT NULL,
    evidence_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE verification.score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    score_type VARCHAR(20) NOT NULL CHECK (score_type IN ('TRUST', 'RISK')),
    old_score DECIMAL(5,2) NOT NULL,
    new_score DECIMAL(5,2) NOT NULL,
    trigger_event VARCHAR(150) NOT NULL, -- e.g. 'verification.pan.verified'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Duplicate Detection Engine
CREATE TABLE verification.duplicate_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    matched_tenant_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,2) NOT NULL, -- 0 to 100
    matched_fields JSONB NOT NULL,          -- {"name": 95.5, "registration_id": 100.0}
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_RESOLVE', -- PENDING_RESOLVE, RESOLVED_DUPLICATE, RESOLVED_UNIQUE
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fraud Detection Engine
CREATE TABLE verification.fraud_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    risk_weight DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE verification.fraud_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, UNDER_INVESTIGATION, CONFIRMED_FRAUD, DISMISSED
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    assigned_to UUID, -- References identity.users(id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE verification.fraud_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fraud_case_id UUID NOT NULL REFERENCES verification.fraud_cases(id) ON DELETE CASCADE,
    fraud_rule_id UUID NOT NULL REFERENCES verification.fraud_rules(id) ON DELETE RESTRICT,
    evidence_description TEXT,
    is_matched BOOLEAN DEFAULT FALSE,
    score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE verification.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    correlation_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE verification.inbox_events (
    id UUID PRIMARY KEY,
    event_source VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. FINANCE (DOUBLE-ENTRY LEDGER & WALLET) SCHEMA (finance.*)
-- ============================================================================

CREATE TABLE finance.ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (tenant_id, name, currency)
);

CREATE TABLE finance.ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    reference_type VARCHAR(100) NOT NULL, -- e.g., 'DONATION', 'GRANT_DISBURSEMENT'
    reference_id UUID NOT NULL,            -- Linked entity ID
    description TEXT,
    posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE finance.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES finance.ledger_transactions(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES finance.ledger_accounts(id) ON DELETE RESTRICT,
    amount DECIMAL(15,4) NOT NULL, -- Debits (+), Credits (-)
    entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (
        (entry_type = 'DEBIT' AND amount > 0) OR 
        (entry_type = 'CREDIT' AND amount < 0)
    )
);

CREATE CONSTRAINT TRIGGER trigger_check_transaction_balance
AFTER INSERT OR UPDATE OR DELETE ON finance.ledger_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION check_transaction_balance();

CREATE TABLE finance.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    correlation_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE finance.inbox_events (
    id UUID PRIMARY KEY,
    event_source VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. PAYMENTS DOMAIN SCHEMA (payments.*)
-- ============================================================================

CREATE TYPE payments.payment_status_type AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

CREATE TABLE payments.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE RESTRICT,
    donor_id UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    recipient_org_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE RESTRICT,
    campaign_id UUID, -- Soft link
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments.payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID NOT NULL REFERENCES payments.donations(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE RESTRICT,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status payments.payment_status_type NOT NULL DEFAULT 'PENDING',
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments.payment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id UUID NOT NULL REFERENCES payments.payment_intents(id) ON DELETE CASCADE,
    gateway VARCHAR(50) NOT NULL, -- 'STRIPE', 'RAZORPAY'
    gateway_transaction_id VARCHAR(255),
    status payments.payment_status_type NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id UUID NOT NULL REFERENCES payments.payment_intents(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2) NOT NULL,
    status payments.payment_status_type NOT NULL DEFAULT 'PENDING',
    gateway_refund_id VARCHAR(255),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UNPROCESSED', -- UNPROCESSED, PROCESSED, FAILED
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    correlation_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE payments.inbox_events (
    id UUID PRIMARY KEY,
    event_source VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. DOCUMENTS REGISTRY SCHEMA (documents.*)
-- ============================================================================

CREATE TABLE documents.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL, -- References identity.users(id)
    name VARCHAR(255) NOT NULL,
    storage_provider VARCHAR(50) NOT NULL DEFAULT 'S3',
    storage_key VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    parent_document_id UUID REFERENCES documents.documents(id) ON DELETE SET NULL,
    is_latest BOOLEAN DEFAULT TRUE,
    ocr_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    ocr_text TEXT,
    virus_scan_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    retention_policy VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    retention_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE documents.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    correlation_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE documents.inbox_events (
    id UUID PRIMARY KEY,
    event_source VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. NOTIFICATIONS SCHEMA (notifications.*)
-- ============================================================================

CREATE TABLE notifications.notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    recipient_id UUID, -- Soft link
    channel VARCHAR(50) NOT NULL, -- 'EMAIL', 'SMS', 'PUSH', 'WHATSAPP'
    status VARCHAR(50) NOT NULL DEFAULT 'SENT', -- SENT, FAILED
    payload JSONB NOT NULL,
    delivery_error TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notifications.inbox_events (
    id UUID PRIMARY KEY,
    event_source VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. AUDITING (OLAP STREAM) & EVENTS SCHEMA (audit.*)
-- ============================================================================

-- Base Event Tables partitioned by range (monthly)
CREATE TABLE audit.domain_events (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    payload JSONB NOT NULL,
    correlation_id UUID,
    causation_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE audit.audit_events (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    user_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    correlation_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TRIGGER trigger_prevent_audit_modifications
BEFORE UPDATE OR DELETE ON audit.audit_events
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modifications();

-- ============================================================================
-- 10. CQRS READ-PROJECTION SEARCH SCHEMAS (search.* & projections)
-- ============================================================================

CREATE TABLE search.organization_dashboards (
    organization_id UUID PRIMARY KEY REFERENCES organization.organizations(id) ON DELETE CASCADE,
    total_donations DECIMAL(15,2) DEFAULT 0.00,
    active_members INT DEFAULT 0,
    trust_score DECIMAL(5,2) DEFAULT 50.00,
    risk_score DECIMAL(5,2) DEFAULT 50.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE search.donation_dashboards (
    campaign_id UUID PRIMARY KEY, -- Soft link
    raised_amount DECIMAL(15,2) DEFAULT 0.00,
    donor_count INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 11. BACKGROUND OPERATIONAL JOBS SCHEMA (jobs.*)
-- ============================================================================

CREATE TYPE jobs.job_status_type AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

CREATE TABLE jobs.background_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_name VARCHAR(150) NOT NULL,
    job_type VARCHAR(100) NOT NULL, -- 'OCR_PROCESS', 'DOCUMENT_VIRUS_SCAN'
    payload JSONB NOT NULL,
    status jobs.job_status_type NOT NULL DEFAULT 'QUEUED',
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    run_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE jobs.job_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs.background_jobs(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status jobs.job_status_type NOT NULL,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ----------------------------------------------------------------------------
-- INDEXING STRATEGIES (MULTI-SCHEMA)
-- ----------------------------------------------------------------------------
CREATE INDEX idx_org_hierarchy ON organization.organizations USING GIST (hierarchy_path);
CREATE INDEX idx_tuples_object ON organization.relation_tuples (namespace, object_id, relation);
CREATE INDEX idx_tuples_subject ON organization.relation_tuples (subject_namespace, subject_id, relation);
CREATE INDEX idx_ledger_entries_account ON finance.ledger_entries (account_id, created_at DESC);
CREATE INDEX idx_ledger_transactions_ref ON finance.ledger_transactions (reference_type, reference_id);
CREATE INDEX idx_donations_tenant ON payments.donations (tenant_id, created_at DESC);
CREATE INDEX idx_payment_intents_donation ON payments.payment_intents (donation_id);
CREATE INDEX idx_payment_attempts_intent ON payments.payment_attempts (payment_intent_id);
CREATE INDEX idx_jobs_run ON jobs.background_jobs (status, run_at);

-- ----------------------------------------------------------------------------
-- ROW-LEVEL SECURITY (RLS) POLICIES BY SCHEMA
-- ----------------------------------------------------------------------------
ALTER TABLE organization.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization.relation_tuples ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization.access_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications.notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_orgs ON organization.organizations
    FOR ALL USING (id = get_current_tenant_id() OR hierarchy_path <@ (SELECT hierarchy_path FROM organization.organizations WHERE id = get_current_tenant_id()));

CREATE POLICY tenant_isolation_tuples ON organization.relation_tuples FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policies ON organization.access_policies FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_workflows ON workflow.workflow_instances FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_verifications ON verification.verifications FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_ledger_accounts ON finance.ledger_accounts FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_ledger_transactions ON finance.ledger_transactions FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_donations ON payments.donations FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_intents ON payments.payment_intents FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_documents ON documents.documents FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_notifications ON notifications.notification_history FOR ALL USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- END OF DDL
-- ============================================================================
