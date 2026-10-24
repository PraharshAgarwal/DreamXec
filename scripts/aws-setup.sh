#!/usr/bin/env bash
# ==============================================================================
# DreamXec AWS Infrastructure Setup & Provisioning Script
# ==============================================================================
# This script provisions:
# 1. AWS S3 Bucket for Media & Document Uploads (with CORS enabled for direct browser PUT)
# 2. AWS ECR Repository for Backend Container Images
# 3. AWS S3 Bucket for Frontend Single-Page Application (SPA)
# 4. Prints recommended CloudFront, ECS, and GitHub Actions Secrets configuration
# ==============================================================================

set -e

# Default settings (customizable via env or interactive prompt)
AWS_REGION="${AWS_REGION:-ap-south-1}"
APP_NAME="${APP_NAME:-dreamxec}"
UPLOADS_BUCKET="${UPLOADS_BUCKET:-${APP_NAME}-uploads-${RANDOM}}"
FRONTEND_BUCKET="${FRONTEND_BUCKET:-${APP_NAME}-frontend-${RANDOM}}"
ECR_REPO="${ECR_REPO:-${APP_NAME}-backend}"

echo "============================================================"
echo "⚡ DreamXec AWS Infrastructure Provisioning"
echo "============================================================"
echo "Region:          $AWS_REGION"
echo "Uploads S3:      $UPLOADS_BUCKET"
echo "Frontend S3:     $FRONTEND_BUCKET"
echo "Backend ECR:     $ECR_REPO"
echo "============================================================"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
  echo "❌ Error: AWS CLI is not installed. Please install it first:"
  echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
  exit 1
fi

# Verify AWS identity
echo "🔍 Verifying AWS Credentials..."
CALLER_IDENTITY=$(aws sts get-caller-identity --output json 2>/dev/null || true)
if [ -z "$CALLER_IDENTITY" ]; then
  echo "❌ Error: Unable to authenticate with AWS. Run 'aws configure' or check your credentials."
  exit 1
fi
ACCOUNT_ID=$(echo "$CALLER_IDENTITY" | grep -o '"Account": "[^"]*' | cut -d'"' -f4)
echo "✅ Authenticated with AWS Account: $ACCOUNT_ID"

# ------------------------------------------------------------------------------
# 1. CREATE UPLOADS S3 BUCKET (Direct Client Presigned PUTs)
# ------------------------------------------------------------------------------
echo ""
echo "📦 [1/3] Creating Uploads S3 Bucket: $UPLOADS_BUCKET..."
if [ "$AWS_REGION" = "us-east-1" ]; then
  aws s3api create-bucket --bucket "$UPLOADS_BUCKET" --region "$AWS_REGION" || true
else
  aws s3api create-bucket --bucket "$UPLOADS_BUCKET" --region "$AWS_REGION" \
    --create-bucket-configuration LocationConstraint="$AWS_REGION" || true
fi

echo "⚙️ Configuring CORS for Uploads Bucket (allowing direct browser PUT uploads)..."
cat << 'EOF' > /tmp/dx-uploads-cors.json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF
aws s3api put-bucket-cors --bucket "$UPLOADS_BUCKET" --cors-configuration file:///tmp/dx-uploads-cors.json
rm -f /tmp/dx-uploads-cors.json
echo "✅ Uploads S3 bucket ready."

# ------------------------------------------------------------------------------
# 2. CREATE FRONTEND S3 BUCKET (Static Assets & SPA)
# ------------------------------------------------------------------------------
echo ""
echo "🌐 [2/3] Creating Frontend S3 Bucket: $FRONTEND_BUCKET..."
if [ "$AWS_REGION" = "us-east-1" ]; then
  aws s3api create-bucket --bucket "$FRONTEND_BUCKET" --region "$AWS_REGION" || true
else
  aws s3api create-bucket --bucket "$FRONTEND_BUCKET" --region "$AWS_REGION" \
    --create-bucket-configuration LocationConstraint="$AWS_REGION" || true
fi
echo "✅ Frontend S3 bucket ready."

# ------------------------------------------------------------------------------
# 3. CREATE ECR REPOSITORY (Backend Docker images)
# ------------------------------------------------------------------------------
echo ""
echo "🐳 [3/3] Creating Amazon ECR Repository: $ECR_REPO..."
aws ecr create-repository \
  --repository-name "$ECR_REPO" \
  --image-scanning-configuration scanOnPush=true \
  --region "$AWS_REGION" 2>/dev/null || echo "ℹ️ ECR repository $ECR_REPO already exists."

# Set lifecycle policy (keep latest 10 images to save storage cost)
cat << 'EOF' > /tmp/dx-ecr-lifecycle.json
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Retain only the 10 most recent images",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
EOF
aws ecr put-lifecycle-policy \
  --repository-name "$ECR_REPO" \
  --lifecycle-policy-text file:///tmp/dx-ecr-lifecycle.json \
  --region "$AWS_REGION" >/dev/null 2>&1 || true
rm -f /tmp/dx-ecr-lifecycle.json
echo "✅ ECR repository ready."

# ------------------------------------------------------------------------------
# SUMMARY & GITHUB ACTIONS SECRETS
# ------------------------------------------------------------------------------
ECR_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"

echo ""
echo "============================================================"
echo "🎉 AWS INFRASTRUCTURE SETUP COMPLETE!"
echo "============================================================"
echo ""
echo "📋 [Server .env] Add these variables to server/.env:"
echo "AWS_REGION=\"$AWS_REGION\""
echo "AWS_BUCKET_NAME=\"$UPLOADS_BUCKET\""
echo "# If using CloudFront for media CDN (recommended):"
echo "# CLOUDFRONT_URL=\"https://dXXXXXXXX.cloudfront.net\""
echo ""
echo "🔐 [GitHub Repository Secrets] Add these to Settings > Secrets and variables > Actions:"
echo "AWS_REGION:                     $AWS_REGION"
echo "AWS_ACCESS_KEY_ID:              <Your IAM Access Key>"
echo "AWS_SECRET_ACCESS_KEY:          <Your IAM Secret Key>"
echo "AWS_ECR_REPOSITORY:             $ECR_REPO"
echo "AWS_FRONTEND_BUCKET:            $FRONTEND_BUCKET"
echo "# Optional (when CloudFront & ECS are configured):"
echo "# AWS_CLOUDFRONT_DISTRIBUTION_ID: <Distribution ID>"
echo "# AWS_ECS_CLUSTER:               <Cluster Name>"
echo "# AWS_ECS_SERVICE:               <Service Name>"
echo ""
echo "============================================================"
