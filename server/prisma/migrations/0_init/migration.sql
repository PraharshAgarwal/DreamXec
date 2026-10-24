-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "account_vault";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "audit";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "campaigns";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "doc_vault";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "documents";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "finance";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "jobs";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "notifications";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "organization";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "payments";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "search";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "verification";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "workflow";

-- CreateEnum
CREATE TYPE "identity"."AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "identity"."SessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "identity"."Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "organization"."LifecycleStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_VERIFICATION', 'VERIFICATION_REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'ARCHIVED', 'MERGED', 'DELETED');

-- CreateEnum
CREATE TYPE "organization"."MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "organization"."OrgRole" AS ENUM ('STUDENT', 'ORG_ADMIN', 'PROFESSOR', 'RESEARCHER', 'MENTOR', 'INCUBATOR_MANAGER', 'COMPLIANCE_OFFICER', 'GOV_OFFICIAL', 'STUDENT_PRESIDENT', 'CORPORATE_ADMIN', 'DONOR');

-- CreateEnum
CREATE TYPE "organization"."OrgType" AS ENUM ('COLLEGE', 'CLUB', 'RESEARCH_INSTITUTION', 'CORPORATE', 'INCUBATOR', 'NGO');

-- CreateEnum
CREATE TYPE "workflow"."StageType" AS ENUM ('FORM', 'SUBMISSION', 'EMAIL_VERIFICATION', 'OTP_VERIFICATION', 'DOCUMENT_UPLOAD', 'DOCUMENT_VERIFICATION', 'BACKGROUND_CHECK', 'API_VALIDATION', 'AUTOMATED_CHECK', 'MANUAL_REVIEW', 'MANUAL_APPROVAL', 'FRAUD_CHECK', 'COMPLIANCE_REVIEW', 'APPROVAL', 'REJECTION', 'PAYMENT', 'EMAIL_NOTIFICATION', 'WEBHOOK', 'SYSTEM_TASK', 'COMPLETE');

-- CreateEnum
CREATE TYPE "workflow"."ExecutionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "workflow"."TemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "workflow"."InstanceStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "workflow"."SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "verification"."VerificationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "payments"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "jobs"."JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "campaigns"."CampaignStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_ENDORSEMENT', 'PENDING_VERIFICATION', 'LIVE', 'PAUSED', 'FULLY_FUNDED', 'CLOSED', 'CANCELLED', 'REJECTED', 'DISBURSING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "campaigns"."CampaignCategory" AS ENUM ('TUITION_FEE', 'RESEARCH_GRANT', 'STARTUP_INNOVATION', 'EMERGENCY_AID', 'COMPETITION_TRAVEL', 'EXTRACURRICULAR');

-- CreateEnum
CREATE TYPE "campaigns"."DisbursementType" AS ENUM ('MILESTONE_TRANCHE', 'DIRECT_TUITION_PAYOUT', 'REIMBURSEMENT');

-- CreateEnum
CREATE TYPE "campaigns"."FundingModel" AS ENUM ('FLEXIBLE', 'ALL_OR_NOTHING');

-- CreateEnum
CREATE TYPE "campaigns"."ProjectStage" AS ENUM ('DISCOVERY', 'FEASIBILITY', 'PROTOTYPE', 'PILOT', 'COMMERCIALIZATION');

-- CreateEnum
CREATE TYPE "campaigns"."EndorsementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "campaigns"."CampaignMemberRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "finance"."DisbursementStatus" AS ENUM ('PENDING_CHECKER', 'AUTHORIZED', 'PROCESSING', 'SETTLED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "doc_vault"."VaultDocumentType" AS ENUM ('GOVT_ID', 'STUDENT_ID', 'UNIVERSITY_ENDORSEMENT', 'BANK_PASSBOOK', 'INVOICE', 'PROJECT_PROPOSAL', 'ORGANIZATION_REGISTRATION', 'OTHER');

-- CreateEnum
CREATE TYPE "account_vault"."VaultAccountType" AS ENUM ('INDIVIDUAL_SAVINGS', 'INDIVIDUAL_CURRENT', 'INSTITUTIONAL_CURRENT', 'STUDENT_CLUB');

-- CreateTable
CREATE TABLE "identity"."users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(60),
    "email" TEXT NOT NULL,
    "secondary_email" TEXT,
    "password_hash" VARCHAR(255),
    "full_name" VARCHAR(255) NOT NULL,
    "role" "identity"."Role" NOT NULL DEFAULT 'USER',
    "account_status" "identity"."AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "profile_metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "species_id" UUID,
    "species_number" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."endangered_species" (
    "id" UUID NOT NULL,
    "common_name" VARCHAR(150) NOT NULL,
    "scientific_name" VARCHAR(200),
    "slug" VARCHAR(100) NOT NULL,
    "taxonomic_group" VARCHAR(50) NOT NULL DEFAULT 'MAMMAL',
    "category" VARCHAR(50) NOT NULL DEFAULT 'CRITICALLY_ENDANGERED',
    "estimated_count" INTEGER NOT NULL DEFAULT 100,
    "assigned_count" INTEGER NOT NULL DEFAULT 0,
    "avatar_url" VARCHAR(500) NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "habitat" VARCHAR(255),
    "region" VARCHAR(150),
    "iucn_id" VARCHAR(50),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endangered_species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."permissions" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."role_permissions" (
    "id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "permission_key" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "access_token_hash" VARCHAR(255) NOT NULL,
    "refresh_token_hash" VARCHAR(255) NOT NULL,
    "active_tenant_id" UUID,
    "device_info" JSONB NOT NULL DEFAULT '{}',
    "ip_address" VARCHAR(45),
    "status" "identity"."SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization"."organizations" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "ancestor_id" UUID,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "hierarchy_path" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "org_type" "organization"."OrgType" NOT NULL,
    "allowed_roles" "organization"."OrgRole"[] DEFAULT ARRAY[]::"organization"."OrgRole"[],
    "lifecycle_status" "organization"."LifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization"."memberships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role" "organization"."OrgRole" NOT NULL DEFAULT 'RESEARCHER',
    "designation" VARCHAR(150),
    "department" VARCHAR(150),
    "status" "organization"."MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "joined_at" TIMESTAMPTZ,
    "invited_by" UUID,
    "accepted_at" TIMESTAMPTZ,
    "removed_at" TIMESTAMPTZ,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow"."workflow_templates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "workflow"."TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow"."workflow_stages" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "stage_type" "workflow"."StageType" NOT NULL,
    "execution_order" INTEGER NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow"."workflow_instances" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "applicant_id" UUID,
    "applicant_email" TEXT NOT NULL,
    "applicant_name" VARCHAR(255) NOT NULL,
    "org_type" VARCHAR(100) NOT NULL,
    "status" "workflow"."InstanceStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "current_stage_id" UUID,
    "instance_data" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow"."stage_submissions" (
    "id" UUID NOT NULL,
    "workflow_instance_id" UUID NOT NULL,
    "workflow_stage_id" UUID NOT NULL,
    "submitted_by_id" UUID,
    "status" "workflow"."SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "form_data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow"."stage_executions" (
    "id" UUID NOT NULL,
    "workflow_instance_id" UUID NOT NULL,
    "workflow_stage_id" UUID,
    "executed_by_id" UUID,
    "stage_name" VARCHAR(150) NOT NULL,
    "stage_type" "workflow"."StageType" NOT NULL,
    "execution_order" INTEGER NOT NULL,
    "execution_status" "workflow"."ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "duration_ms" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "error_message" TEXT,

    CONSTRAINT "stage_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification"."verifications" (
    "id" UUID NOT NULL,
    "instance_id" UUID,
    "tenant_id" UUID NOT NULL,
    "verification_type" VARCHAR(100) NOT NULL,
    "status" "verification"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "evidence_url" VARCHAR(500),
    "verification_data" JSONB NOT NULL DEFAULT '{}',
    "assigned_org_admin_id" UUID,
    "notification_sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ledger_accounts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,
    "account_type" VARCHAR(50) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ledger_transactions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "reference_type" VARCHAR(100) NOT NULL,
    "reference_id" UUID NOT NULL,
    "description" TEXT,
    "posted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ledger_entries" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "amount" DECIMAL(15,4) NOT NULL,
    "entry_type" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."donations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "donor_id" UUID,
    "recipient_org_id" UUID NOT NULL,
    "campaign_id" UUID,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "donor_display_name" VARCHAR(150),
    "donor_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."payment_intents" (
    "id" UUID NOT NULL,
    "donation_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "payments"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."payment_attempts" (
    "id" UUID NOT NULL,
    "payment_intent_id" UUID NOT NULL,
    "gateway" VARCHAR(50) NOT NULL,
    "gateway_transaction_id" VARCHAR(255),
    "status" "payments"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."refunds" (
    "id" UUID NOT NULL,
    "payment_intent_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "payments"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gateway_refund_id" VARCHAR(255),
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."webhook_events" (
    "id" UUID NOT NULL,
    "gateway" VARCHAR(50) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'UNPROCESSED',
    "processed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."grants" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "total_budget" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."grant_proposals" (
    "id" UUID NOT NULL,
    "grant_id" UUID NOT NULL,
    "applicant_org_id" UUID NOT NULL,
    "submitted_by" UUID NOT NULL,
    "requested_amount" DECIMAL(15,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    "proposal_data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "grant_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."grant_milestones" (
    "id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "evidence_metadata" JSONB NOT NULL DEFAULT '{}',
    "disbursed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "grant_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents"."documents" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "uploader_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "storage_provider" VARCHAR(50) NOT NULL DEFAULT 'S3',
    "storage_key" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parent_document_id" UUID,
    "is_latest" BOOLEAN NOT NULL DEFAULT true,
    "ocr_status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "ocr_text" TEXT,
    "virus_scan_status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "retention_policy" VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    "retention_expiry" TIMESTAMPTZ,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications"."notification_history" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "recipient_id" UUID,
    "channel" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'SENT',
    "payload" JSONB NOT NULL,
    "delivery_error" TEXT,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."domain_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "aggregate_type" VARCHAR(100) NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "correlation_id" UUID,
    "causation_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id","created_at")
);

-- CreateTable
CREATE TABLE "audit"."audit_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "correlation_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id","created_at")
);

-- CreateTable
CREATE TABLE "audit"."outbox_events" (
    "id" UUID NOT NULL,
    "aggregate_type" VARCHAR(100) NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "correlation_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."inbox_events" (
    "id" UUID NOT NULL,
    "event_source" VARCHAR(255) NOT NULL,
    "processed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search"."organization_dashboards" (
    "organization_id" UUID NOT NULL,
    "total_donations" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "active_members" INTEGER NOT NULL DEFAULT 0,
    "trust_score" DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    "risk_score" DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_dashboards_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "search"."donation_dashboards" (
    "campaign_id" UUID NOT NULL,
    "raised_amount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "donor_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donation_dashboards_pkey" PRIMARY KEY ("campaign_id")
);

-- CreateTable
CREATE TABLE "jobs"."background_jobs" (
    "id" UUID NOT NULL,
    "queue_name" VARCHAR(150) NOT NULL,
    "job_type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "jobs"."JobStatus" NOT NULL DEFAULT 'QUEUED',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "run_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs"."job_executions" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "status" "jobs"."JobStatus" NOT NULL,
    "error_message" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "job_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns"."campaigns" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "student_user_id" UUID NOT NULL,
    "beneficiary_user_id" UUID,
    "organization_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "category" "campaigns"."CampaignCategory" NOT NULL,
    "campaign_type" VARCHAR(50) NOT NULL DEFAULT 'INDIVIDUAL',
    "stage" "campaigns"."ProjectStage" NOT NULL DEFAULT 'DISCOVERY',
    "short_description" VARCHAR(500) NOT NULL,
    "description" TEXT NOT NULL,
    "cover_image_url" VARCHAR(500) NOT NULL,
    "gallery_image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "video_url" VARCHAR(500),
    "presentation_deck_url" VARCHAR(500),
    "faqs" JSONB NOT NULL DEFAULT '[]',
    "team_members" JSONB NOT NULL DEFAULT '[]',
    "beneficiary_details" JSONB,
    "target_amount" DECIMAL(15,2) NOT NULL,
    "min_donation_amount" DECIMAL(15,2) NOT NULL DEFAULT 1.00,
    "current_raised_amount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "donor_count" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "status" "campaigns"."CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "verified_by_user_id" UUID,
    "verified_at" TIMESTAMPTZ,
    "rejection_reason" TEXT,
    "reapproval_count" INTEGER NOT NULL DEFAULT 0,
    "escrow_account_id" UUID,
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns"."campaign_milestones" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "sequence_order" INTEGER NOT NULL,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "duration_days" INTEGER NOT NULL DEFAULT 30,
    "start_date" TIMESTAMPTZ,
    "deadline" TIMESTAMPTZ,
    "target_amount" DECIMAL(15,2) NOT NULL,
    "released_amount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "utilized_amount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "acceptance_criteria" JSONB NOT NULL DEFAULT '[]',
    "required_evidence_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
    "disbursed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns"."campaign_milestone_submissions" (
    "id" UUID NOT NULL,
    "milestone_id" UUID NOT NULL,
    "submission_number" INTEGER NOT NULL DEFAULT 1,
    "submission_attempt" INTEGER NOT NULL DEFAULT 1,
    "narrative" TEXT,
    "evidence_doc_id" UUID,
    "evidence_media_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidence_document_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "criteria_checklist" JSONB NOT NULL DEFAULT '[]',
    "student_notes" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_milestone_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."milestone_disbursements" (
    "id" UUID NOT NULL,
    "milestone_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "status" "finance"."DisbursementStatus" NOT NULL DEFAULT 'PENDING_CHECKER',
    "maker_user_id" UUID NOT NULL,
    "checker_user_id" UUID,
    "payout_reference" VARCHAR(255),
    "ledger_tx_id" UUID,
    "authorized_at" TIMESTAMPTZ,
    "settled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestone_disbursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."utilization_proofs" (
    "id" UUID NOT NULL,
    "disbursement_id" UUID NOT NULL,
    "vendor_name" VARCHAR(255) NOT NULL,
    "invoice_number" VARCHAR(100) NOT NULL,
    "amount_claimed" DECIMAL(15,2) NOT NULL,
    "receipt_file_url" VARCHAR(500) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by_user_id" UUID,
    "verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilization_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns"."campaign_endorsements" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "endorser_user_id" UUID NOT NULL,
    "designation" VARCHAR(150) NOT NULL,
    "status" "campaigns"."EndorsementStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "endorsed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns"."campaign_milestone_revisions" (
    "id" UUID NOT NULL,
    "milestone_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "target_amount" DECIMAL(15,2) NOT NULL,
    "change_reason" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'APPROVED',
    "requested_by_user_id" UUID NOT NULL,
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_milestone_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns"."campaign_members" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "campaigns"."CampaignMemberRole" NOT NULL DEFAULT 'MEMBER',
    "title" VARCHAR(100),
    "invited_by" UUID,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns"."campaign_comments" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_id" UUID,
    "content" TEXT NOT NULL,
    "reported" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_vault"."user_doc_vault" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "document_type" "doc_vault"."VaultDocumentType" NOT NULL DEFAULT 'OTHER',
    "title" VARCHAR(255) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(1000) NOT NULL,
    "file_size_bytes" BIGINT NOT NULL DEFAULT 0,
    "mime_type" VARCHAR(100),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "user_doc_vault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_vault"."user_account_vault" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_nickname" VARCHAR(100),
    "account_holder_name" VARCHAR(255) NOT NULL,
    "bank_account_number" VARCHAR(100) NOT NULL,
    "ifsc_code" VARCHAR(50) NOT NULL,
    "bank_name" VARCHAR(255),
    "upi_id" VARCHAR(150),
    "account_type" "account_vault"."VaultAccountType" NOT NULL DEFAULT 'INDIVIDUAL_SAVINGS',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "user_account_vault_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "identity"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "identity"."users"("email");

-- CreateIndex
CREATE INDEX "users_species_id_idx" ON "identity"."users"("species_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_species_id_species_number_key" ON "identity"."users"("species_id", "species_number");

-- CreateIndex
CREATE UNIQUE INDEX "endangered_species_common_name_key" ON "identity"."endangered_species"("common_name");

-- CreateIndex
CREATE UNIQUE INDEX "endangered_species_slug_key" ON "identity"."endangered_species"("slug");

-- CreateIndex
CREATE INDEX "endangered_species_is_active_assigned_count_idx" ON "identity"."endangered_species"("is_active", "assigned_count");

-- CreateIndex
CREATE INDEX "endangered_species_category_idx" ON "identity"."endangered_species"("category");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "identity"."permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permission_key_key" ON "identity"."role_permissions"("role", "permission_key");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_access_token_hash_key" ON "identity"."sessions"("access_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "identity"."sessions"("refresh_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organization"."organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_hierarchy_path_idx" ON "organization"."organizations"("hierarchy_path");

-- CreateIndex
CREATE INDEX "organizations_parent_id_idx" ON "organization"."organizations"("parent_id");

-- CreateIndex
CREATE INDEX "organizations_ancestor_id_idx" ON "organization"."organizations"("ancestor_id");

-- CreateIndex
CREATE INDEX "organizations_depth_idx" ON "organization"."organizations"("depth");

-- CreateIndex
CREATE INDEX "organizations_lifecycle_status_idx" ON "organization"."organizations"("lifecycle_status");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_user_id_organization_id_role_key" ON "organization"."memberships"("user_id", "organization_id", "role");

-- CreateIndex
CREATE INDEX "workflow_templates_tenant_id_status_idx" ON "workflow"."workflow_templates"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_templates_tenant_id_slug_version_key" ON "workflow"."workflow_templates"("tenant_id", "slug", "version");

-- CreateIndex
CREATE INDEX "workflow_stages_template_id_execution_order_idx" ON "workflow"."workflow_stages"("template_id", "execution_order");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_stages_template_id_execution_order_key" ON "workflow"."workflow_stages"("template_id", "execution_order");

-- CreateIndex
CREATE INDEX "workflow_instances_tenant_id_status_idx" ON "workflow"."workflow_instances"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "workflow_instances_applicant_id_idx" ON "workflow"."workflow_instances"("applicant_id");

-- CreateIndex
CREATE INDEX "workflow_instances_template_id_idx" ON "workflow"."workflow_instances"("template_id");

-- CreateIndex
CREATE INDEX "stage_submissions_workflow_instance_id_workflow_stage_id_idx" ON "workflow"."stage_submissions"("workflow_instance_id", "workflow_stage_id");

-- CreateIndex
CREATE INDEX "stage_submissions_submitted_by_id_idx" ON "workflow"."stage_submissions"("submitted_by_id");

-- CreateIndex
CREATE INDEX "stage_submissions_status_idx" ON "workflow"."stage_submissions"("status");

-- CreateIndex
CREATE INDEX "stage_executions_workflow_instance_id_started_at_idx" ON "workflow"."stage_executions"("workflow_instance_id", "started_at");

-- CreateIndex
CREATE INDEX "stage_executions_execution_status_idx" ON "workflow"."stage_executions"("execution_status");

-- CreateIndex
CREATE INDEX "stage_executions_executed_by_id_idx" ON "workflow"."stage_executions"("executed_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_accounts_tenant_id_name_currency_key" ON "finance"."ledger_accounts"("tenant_id", "name", "currency");

-- CreateIndex
CREATE INDEX "ledger_transactions_reference_type_reference_id_idx" ON "finance"."ledger_transactions"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "ledger_entries_account_id_created_at_idx" ON "finance"."ledger_entries"("account_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "donations_created_at_idx" ON "payments"."donations"("created_at" DESC);

-- CreateIndex
CREATE INDEX "donations_campaign_id_idx" ON "payments"."donations"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_intents_idempotency_key_key" ON "payments"."payment_intents"("idempotency_key");

-- CreateIndex
CREATE INDEX "documents_tenant_id_storage_key_idx" ON "documents"."documents"("tenant_id", "storage_key");

-- CreateIndex
CREATE INDEX "background_jobs_status_run_at_idx" ON "jobs"."background_jobs"("status", "run_at");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"."campaigns"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_escrow_account_id_key" ON "campaigns"."campaigns"("escrow_account_id");

-- CreateIndex
CREATE INDEX "campaigns_tenant_id_status_idx" ON "campaigns"."campaigns"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "campaigns_student_user_id_created_at_idx" ON "campaigns"."campaigns"("student_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "campaigns_category_status_idx" ON "campaigns"."campaigns"("category", "status");

-- CreateIndex
CREATE INDEX "campaigns_status_created_at_idx" ON "campaigns"."campaigns"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "campaigns_created_at_idx" ON "campaigns"."campaigns"("created_at" DESC);

-- CreateIndex
CREATE INDEX "campaign_milestones_campaign_id_idx" ON "campaigns"."campaign_milestones"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_milestones_campaign_id_sequence_order_key" ON "campaigns"."campaign_milestones"("campaign_id", "sequence_order");

-- CreateIndex
CREATE INDEX "campaign_milestone_submissions_milestone_id_idx" ON "campaigns"."campaign_milestone_submissions"("milestone_id");

-- CreateIndex
CREATE INDEX "campaign_milestone_submissions_evidence_doc_id_idx" ON "campaigns"."campaign_milestone_submissions"("evidence_doc_id");

-- CreateIndex
CREATE INDEX "campaign_milestone_submissions_reviewed_by_user_id_idx" ON "campaigns"."campaign_milestone_submissions"("reviewed_by_user_id");

-- CreateIndex
CREATE INDEX "milestone_disbursements_milestone_id_idx" ON "finance"."milestone_disbursements"("milestone_id");

-- CreateIndex
CREATE INDEX "milestone_disbursements_maker_user_id_idx" ON "finance"."milestone_disbursements"("maker_user_id");

-- CreateIndex
CREATE INDEX "milestone_disbursements_checker_user_id_idx" ON "finance"."milestone_disbursements"("checker_user_id");

-- CreateIndex
CREATE INDEX "utilization_proofs_disbursement_id_idx" ON "finance"."utilization_proofs"("disbursement_id");

-- CreateIndex
CREATE INDEX "utilization_proofs_verified_by_user_id_idx" ON "finance"."utilization_proofs"("verified_by_user_id");

-- CreateIndex
CREATE INDEX "campaign_endorsements_campaign_id_idx" ON "campaigns"."campaign_endorsements"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_endorsements_endorser_user_id_idx" ON "campaigns"."campaign_endorsements"("endorser_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_endorsements_campaign_id_endorser_user_id_key" ON "campaigns"."campaign_endorsements"("campaign_id", "endorser_user_id");

-- CreateIndex
CREATE INDEX "campaign_milestone_revisions_milestone_id_idx" ON "campaigns"."campaign_milestone_revisions"("milestone_id");

-- CreateIndex
CREATE INDEX "campaign_milestone_revisions_requested_by_user_id_idx" ON "campaigns"."campaign_milestone_revisions"("requested_by_user_id");

-- CreateIndex
CREATE INDEX "campaign_milestone_revisions_reviewed_by_user_id_idx" ON "campaigns"."campaign_milestone_revisions"("reviewed_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_milestone_revisions_milestone_id_revision_number_key" ON "campaigns"."campaign_milestone_revisions"("milestone_id", "revision_number");

-- CreateIndex
CREATE INDEX "campaign_members_campaign_id_idx" ON "campaigns"."campaign_members"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_members_user_id_idx" ON "campaigns"."campaign_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_members_campaign_id_user_id_key" ON "campaigns"."campaign_members"("campaign_id", "user_id");

-- CreateIndex
CREATE INDEX "campaign_comments_campaign_id_created_at_idx" ON "campaigns"."campaign_comments"("campaign_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "campaign_comments_parent_id_idx" ON "campaigns"."campaign_comments"("parent_id");

-- CreateIndex
CREATE INDEX "campaign_comments_user_id_idx" ON "campaigns"."campaign_comments"("user_id");

-- CreateIndex
CREATE INDEX "user_doc_vault_user_id_document_type_idx" ON "doc_vault"."user_doc_vault"("user_id", "document_type");

-- CreateIndex
CREATE INDEX "user_doc_vault_user_id_created_at_idx" ON "doc_vault"."user_doc_vault"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_account_vault_user_id_created_at_idx" ON "account_vault"."user_account_vault"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "identity"."users" ADD CONSTRAINT "users_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "identity"."endangered_species"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."role_permissions" ADD CONSTRAINT "role_permissions_permission_key_fkey" FOREIGN KEY ("permission_key") REFERENCES "identity"."permissions"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."sessions" ADD CONSTRAINT "sessions_active_tenant_id_fkey" FOREIGN KEY ("active_tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization"."organizations" ADD CONSTRAINT "organizations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "organization"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization"."memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization"."memberships" ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."workflow_templates" ADD CONSTRAINT "workflow_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."workflow_stages" ADD CONSTRAINT "workflow_stages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "workflow"."workflow_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."workflow_instances" ADD CONSTRAINT "workflow_instances_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "workflow"."workflow_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."workflow_instances" ADD CONSTRAINT "workflow_instances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."workflow_instances" ADD CONSTRAINT "workflow_instances_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."workflow_instances" ADD CONSTRAINT "workflow_instances_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "workflow"."workflow_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."stage_submissions" ADD CONSTRAINT "stage_submissions_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow"."workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."stage_submissions" ADD CONSTRAINT "stage_submissions_workflow_stage_id_fkey" FOREIGN KEY ("workflow_stage_id") REFERENCES "workflow"."workflow_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."stage_submissions" ADD CONSTRAINT "stage_submissions_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."stage_executions" ADD CONSTRAINT "stage_executions_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow"."workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."stage_executions" ADD CONSTRAINT "stage_executions_workflow_stage_id_fkey" FOREIGN KEY ("workflow_stage_id") REFERENCES "workflow"."workflow_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."stage_executions" ADD CONSTRAINT "stage_executions_executed_by_id_fkey" FOREIGN KEY ("executed_by_id") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification"."verifications" ADD CONSTRAINT "verifications_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "workflow"."workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification"."verifications" ADD CONSTRAINT "verifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ledger_accounts" ADD CONSTRAINT "ledger_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ledger_transactions" ADD CONSTRAINT "ledger_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "finance"."ledger_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "finance"."ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."donations" ADD CONSTRAINT "donations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."donations" ADD CONSTRAINT "donations_recipient_org_id_fkey" FOREIGN KEY ("recipient_org_id") REFERENCES "organization"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."donations" ADD CONSTRAINT "donations_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."donations" ADD CONSTRAINT "donations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"."campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."payment_intents" ADD CONSTRAINT "payment_intents_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "payments"."donations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."payment_intents" ADD CONSTRAINT "payment_intents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."payment_attempts" ADD CONSTRAINT "payment_attempts_payment_intent_id_fkey" FOREIGN KEY ("payment_intent_id") REFERENCES "payments"."payment_intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."refunds" ADD CONSTRAINT "refunds_payment_intent_id_fkey" FOREIGN KEY ("payment_intent_id") REFERENCES "payments"."payment_intents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."grants" ADD CONSTRAINT "grants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."grant_proposals" ADD CONSTRAINT "grant_proposals_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "finance"."grants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."grant_proposals" ADD CONSTRAINT "grant_proposals_applicant_org_id_fkey" FOREIGN KEY ("applicant_org_id") REFERENCES "organization"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."grant_proposals" ADD CONSTRAINT "grant_proposals_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."grant_milestones" ADD CONSTRAINT "grant_milestones_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "finance"."grant_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents"."documents" ADD CONSTRAINT "documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents"."documents" ADD CONSTRAINT "documents_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents"."documents" ADD CONSTRAINT "documents_parent_document_id_fkey" FOREIGN KEY ("parent_document_id") REFERENCES "documents"."documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications"."notification_history" ADD CONSTRAINT "notification_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search"."organization_dashboards" ADD CONSTRAINT "organization_dashboards_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs"."job_executions" ADD CONSTRAINT "job_executions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"."background_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaigns" ADD CONSTRAINT "campaigns_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaigns" ADD CONSTRAINT "campaigns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaigns" ADD CONSTRAINT "campaigns_student_user_id_fkey" FOREIGN KEY ("student_user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaigns" ADD CONSTRAINT "campaigns_beneficiary_user_id_fkey" FOREIGN KEY ("beneficiary_user_id") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaigns" ADD CONSTRAINT "campaigns_verified_by_user_id_fkey" FOREIGN KEY ("verified_by_user_id") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaigns" ADD CONSTRAINT "campaigns_escrow_account_id_fkey" FOREIGN KEY ("escrow_account_id") REFERENCES "finance"."ledger_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaign_milestones" ADD CONSTRAINT "campaign_milestones_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaign_milestone_submissions" ADD CONSTRAINT "campaign_milestone_submissions_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "campaigns"."campaign_milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaign_milestone_submissions" ADD CONSTRAINT "campaign_milestone_submissions_evidence_doc_id_fkey" FOREIGN KEY ("evidence_doc_id") REFERENCES "documents"."documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaign_milestone_submissions" ADD CONSTRAINT "campaign_milestone_submissions_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."milestone_disbursements" ADD CONSTRAINT "milestone_disbursements_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "campaigns"."campaign_milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."milestone_disbursements" ADD CONSTRAINT "milestone_disbursements_maker_user_id_fkey" FOREIGN KEY ("maker_user_id") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."milestone_disbursements" ADD CONSTRAINT "milestone_disbursements_checker_user_id_fkey" FOREIGN KEY ("checker_user_id") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."utilization_proofs" ADD CONSTRAINT "utilization_proofs_disbursement_id_fkey" FOREIGN KEY ("disbursement_id") REFERENCES "finance"."milestone_disbursements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."utilization_proofs" ADD CONSTRAINT "utilization_proofs_verified_by_user_id_fkey" FOREIGN KEY ("verified_by_user_id") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaign_endorsements" ADD CONSTRAINT "campaign_endorsements_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaign_endorsements" ADD CONSTRAINT "campaign_endorsements_endorser_user_id_fkey" FOREIGN KEY ("endorser_user_id") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaign_milestone_revisions" ADD CONSTRAINT "campaign_milestone_revisions_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "campaigns"."campaign_milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaign_milestone_revisions" ADD CONSTRAINT "campaign_milestone_revisions_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaign_milestone_revisions" ADD CONSTRAINT "campaign_milestone_revisions_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaign_members" ADD CONSTRAINT "campaign_members_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaign_members" ADD CONSTRAINT "campaign_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaign_comments" ADD CONSTRAINT "campaign_comments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaign_comments" ADD CONSTRAINT "campaign_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns"."campaign_comments" ADD CONSTRAINT "campaign_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "campaigns"."campaign_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doc_vault"."user_doc_vault" ADD CONSTRAINT "user_doc_vault_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_vault"."user_account_vault" ADD CONSTRAINT "user_account_vault_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

