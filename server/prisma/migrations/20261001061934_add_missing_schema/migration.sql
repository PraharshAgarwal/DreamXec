/*
  Warnings:

  - The `account_type` column on the `ledger_accounts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `description` on the `ledger_transactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idempotency_key]` on the table `ledger_transactions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reversal_of_id]` on the table `ledger_transactions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reference_type,reference_id,transaction_type]` on the table `ledger_transactions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apaar_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `entry_type` on the `ledger_entries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `transaction_type` to the `ledger_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "finance"."LedgerScopeType" AS ENUM ('SYSTEM', 'USER', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "finance"."LedgerOwnerType" AS ENUM ('SYSTEM', 'USER', 'ORGANIZATION', 'CAMPAIGN');

-- CreateEnum
CREATE TYPE "finance"."LedgerAccountType" AS ENUM ('ASSET', 'LIABILITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "finance"."LedgerEntryType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "finance"."LedgerTransactionStatus" AS ENUM ('POSTED', 'VOID', 'REVERSED');

-- CreateEnum
CREATE TYPE "finance"."WithdrawalStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'SETTLED', 'FAILED', 'REVERSED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "campaigns"."CampaignCategory" ADD VALUE 'COMMUNITY_PROJECT';
ALTER TYPE "campaigns"."CampaignCategory" ADD VALUE 'CLUB_PROJECT';

-- AlterEnum
ALTER TYPE "identity"."Role" ADD VALUE 'SUPER_ADMIN';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "organization"."OrgRole" ADD VALUE 'FINANCE_OFFICER';
ALTER TYPE "organization"."OrgRole" ADD VALUE 'GRANT_OFFICER';
ALTER TYPE "organization"."OrgRole" ADD VALUE 'GOV_OFFICER';
ALTER TYPE "organization"."OrgRole" ADD VALUE 'SPONSOR';
ALTER TYPE "organization"."OrgRole" ADD VALUE 'ALUMNI';
ALTER TYPE "organization"."OrgRole" ADD VALUE 'CSR_MANAGER';
ALTER TYPE "organization"."OrgRole" ADD VALUE 'CORPORATE_RECRUITER';
ALTER TYPE "organization"."OrgRole" ADD VALUE 'VOLUNTEER';
ALTER TYPE "organization"."OrgRole" ADD VALUE 'PROGRAM_MANAGER';

-- AlterEnum
ALTER TYPE "organization"."OrgType" ADD VALUE 'GOVERNMENT_BODY';

-- AlterEnum
ALTER TYPE "payments"."PaymentStatus" ADD VALUE 'DISPUTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "workflow"."StageType" ADD VALUE 'APAAR_VERIFICATION';
ALTER TYPE "workflow"."StageType" ADD VALUE 'ORCID_VERIFICATION';

-- DropForeignKey
ALTER TABLE "finance"."ledger_accounts" DROP CONSTRAINT "ledger_accounts_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "finance"."ledger_transactions" DROP CONSTRAINT "ledger_transactions_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "payments"."donations" DROP CONSTRAINT "donations_recipient_org_id_fkey";

-- DropForeignKey
ALTER TABLE "payments"."donations" DROP CONSTRAINT "donations_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "payments"."payment_intents" DROP CONSTRAINT "payment_intents_tenant_id_fkey";

-- DropIndex
DROP INDEX "campaigns"."campaigns_created_at_idx";

-- DropIndex
DROP INDEX "finance"."ledger_transactions_reference_type_reference_id_idx";

-- AlterTable
ALTER TABLE "finance"."ledger_accounts" ADD COLUMN     "account_number" VARCHAR(50),
ADD COLUMN     "balance_cached" DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "owner_id" UUID,
ADD COLUMN     "owner_type" "finance"."LedgerOwnerType",
ADD COLUMN     "parent_account_id" UUID,
ADD COLUMN     "scope_type" "finance"."LedgerScopeType" NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "tenant_id" DROP NOT NULL,
ALTER COLUMN "user_id" DROP NOT NULL,
DROP COLUMN "account_type",
ADD COLUMN     "account_type" "finance"."LedgerAccountType" NOT NULL DEFAULT 'ASSET',
ALTER COLUMN "currency" SET DEFAULT 'INR';

-- AlterTable
ALTER TABLE "finance"."ledger_entries" ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,4),
DROP COLUMN "entry_type",
ADD COLUMN     "entry_type" "finance"."LedgerEntryType" NOT NULL;

-- AlterTable
ALTER TABLE "finance"."ledger_transactions" DROP COLUMN "description",
ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
ADD COLUMN     "idempotency_key" VARCHAR(255),
ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "reversal_of_id" UUID,
ADD COLUMN     "scope_type" "finance"."LedgerScopeType" NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN     "status" "finance"."LedgerTransactionStatus" NOT NULL DEFAULT 'POSTED',
ADD COLUMN     "transaction_type" VARCHAR(100) NOT NULL,
ADD COLUMN     "user_id" UUID,
ALTER COLUMN "tenant_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "identity"."users" ADD COLUMN     "apaar_id" VARCHAR(20),
ADD COLUMN     "is_kyc_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kyc_verified_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "organization"."organizations" ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "payments"."donations" ALTER COLUMN "tenant_id" DROP NOT NULL,
ALTER COLUMN "recipient_org_id" DROP NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'INR';

-- AlterTable
ALTER TABLE "payments"."payment_attempts" ADD COLUMN     "gateway_order_id" VARCHAR(255),
ADD COLUMN     "gateway_payment_id" VARCHAR(255),
ADD COLUMN     "gateway_signature" VARCHAR(500),
ADD COLUMN     "raw_response" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "payments"."payment_intents" ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}',
ALTER COLUMN "tenant_id" DROP NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'INR';

-- CreateTable
CREATE TABLE "finance"."withdrawal_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "status" "finance"."WithdrawalStatus" NOT NULL DEFAULT 'REQUESTED',
    "vault_account_id" UUID NOT NULL,
    "account_holder_name" VARCHAR(255) NOT NULL,
    "bank_account_number" VARCHAR(100) NOT NULL,
    "ifsc_code" VARCHAR(50) NOT NULL,
    "upi_id" VARCHAR(150),
    "razorpay_contact_id" VARCHAR(100),
    "razorpay_fund_acc_id" VARCHAR(100),
    "razorpay_payout_id" VARCHAR(100),
    "reservation_ledger_tx_id" UUID,
    "settlement_ledger_tx_id" UUID,
    "idempotency_key" VARCHAR(255) NOT NULL,
    "failure_reason" TEXT,
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,
    "settled_at" TIMESTAMPTZ,
    "failed_at" TIMESTAMPTZ,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_requests_idempotency_key_key" ON "finance"."withdrawal_requests"("idempotency_key");

-- CreateIndex
CREATE INDEX "withdrawal_requests_user_id_status_idx" ON "finance"."withdrawal_requests"("user_id", "status");

-- CreateIndex
CREATE INDEX "withdrawal_requests_status_requested_at_idx" ON "finance"."withdrawal_requests"("status", "requested_at" DESC);

-- CreateIndex
CREATE INDEX "withdrawal_requests_razorpay_payout_id_idx" ON "finance"."withdrawal_requests"("razorpay_payout_id");

-- CreateIndex
CREATE INDEX "outbox_events_status_created_at_idx" ON "audit"."outbox_events"("status", "created_at" ASC);

-- CreateIndex
CREATE INDEX "campaign_milestones_status_idx" ON "campaigns"."campaign_milestones"("status");

-- CreateIndex
CREATE INDEX "campaigns_tenant_id_status_created_at_idx" ON "campaigns"."campaigns"("tenant_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ledger_accounts_scope_type_user_id_idx" ON "finance"."ledger_accounts"("scope_type", "user_id");

-- CreateIndex
CREATE INDEX "ledger_accounts_tenant_id_account_type_idx" ON "finance"."ledger_accounts"("tenant_id", "account_type");

-- CreateIndex
CREATE INDEX "ledger_accounts_owner_type_owner_id_idx" ON "finance"."ledger_accounts"("owner_type", "owner_id");

-- CreateIndex
CREATE INDEX "ledger_entries_transaction_id_idx" ON "finance"."ledger_entries"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_transactions_idempotency_key_key" ON "finance"."ledger_transactions"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_transactions_reversal_of_id_key" ON "finance"."ledger_transactions"("reversal_of_id");

-- CreateIndex
CREATE INDEX "ledger_transactions_tenant_id_reference_type_reference_id_idx" ON "finance"."ledger_transactions"("tenant_id", "reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "ledger_transactions_scope_type_user_id_idx" ON "finance"."ledger_transactions"("scope_type", "user_id");

-- CreateIndex
CREATE INDEX "ledger_transactions_transaction_type_posted_at_idx" ON "finance"."ledger_transactions"("transaction_type", "posted_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ledger_transactions_reference_type_reference_id_transaction_key" ON "finance"."ledger_transactions"("reference_type", "reference_id", "transaction_type");

-- CreateIndex
CREATE UNIQUE INDEX "users_apaar_id_key" ON "identity"."users"("apaar_id");

-- CreateIndex
CREATE INDEX "memberships_organization_id_status_idx" ON "organization"."memberships"("organization_id", "status");

-- CreateIndex
CREATE INDEX "memberships_user_id_status_idx" ON "organization"."memberships"("user_id", "status");

-- CreateIndex
CREATE INDEX "donations_donor_id_created_at_idx" ON "payments"."donations"("donor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "donations_tenant_id_idx" ON "payments"."donations"("tenant_id");

-- CreateIndex
CREATE INDEX "donations_recipient_org_id_idx" ON "payments"."donations"("recipient_org_id");

-- CreateIndex
CREATE INDEX "payment_attempts_gateway_transaction_id_idx" ON "payments"."payment_attempts"("gateway_transaction_id");

-- CreateIndex
CREATE INDEX "payment_attempts_gateway_payment_id_idx" ON "payments"."payment_attempts"("gateway_payment_id");

-- CreateIndex
CREATE INDEX "payment_attempts_payment_intent_id_idx" ON "payments"."payment_attempts"("payment_intent_id");

-- CreateIndex
CREATE INDEX "payment_intents_donation_id_idx" ON "payments"."payment_intents"("donation_id");

-- CreateIndex
CREATE INDEX "payment_intents_status_idx" ON "payments"."payment_intents"("status");

-- CreateIndex
CREATE INDEX "stage_submissions_workflow_instance_id_created_at_idx" ON "workflow"."stage_submissions"("workflow_instance_id", "created_at" ASC);

-- CreateIndex
CREATE INDEX "workflow_instances_applicant_email_status_idx" ON "workflow"."workflow_instances"("applicant_email", "status");

-- CreateIndex
CREATE INDEX "workflow_instances_tenant_id_current_stage_id_idx" ON "workflow"."workflow_instances"("tenant_id", "current_stage_id");

-- CreateIndex
CREATE INDEX "workflow_instances_tenant_id_applicant_email_status_idx" ON "workflow"."workflow_instances"("tenant_id", "applicant_email", "status");

-- CreateIndex
CREATE INDEX "workflow_instances_tenant_id_applicant_id_status_idx" ON "workflow"."workflow_instances"("tenant_id", "applicant_id", "status");

-- AddForeignKey
ALTER TABLE "finance"."ledger_accounts" ADD CONSTRAINT "ledger_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ledger_accounts" ADD CONSTRAINT "ledger_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ledger_accounts" ADD CONSTRAINT "ledger_accounts_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "finance"."ledger_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ledger_transactions" ADD CONSTRAINT "ledger_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ledger_transactions" ADD CONSTRAINT "ledger_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ledger_transactions" ADD CONSTRAINT "ledger_transactions_reversal_of_id_fkey" FOREIGN KEY ("reversal_of_id") REFERENCES "finance"."ledger_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."donations" ADD CONSTRAINT "donations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."donations" ADD CONSTRAINT "donations_recipient_org_id_fkey" FOREIGN KEY ("recipient_org_id") REFERENCES "organization"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."payment_intents" ADD CONSTRAINT "payment_intents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organization"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
