#!/usr/bin/env bash
# ==============================================================================
# DreamXec EC2 Host-Side Manual Deployment & Health Test Script
# ==============================================================================
# Usage: ./deploy-ec2.sh [IMAGE_TAG]
# Default IMAGE_TAG is 'latest'
# ==============================================================================

set -e

AWS_REGION="ap-south-1"
REPO_NAME="dreamxec-backend"
IMAGE_TAG="${1:-latest}"

echo "============================================================"
echo "⚡ DreamXec EC2 Manual Deployment (Region: $AWS_REGION)"
echo "============================================================"

# Detect AWS Account ID from instance metadata
ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text 2>/dev/null || true)
if [ -z "$ACCOUNT_ID" ]; then
  # Fallback to IMDSv2
  TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60" 2>/dev/null || true)
  ACCOUNT_ID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/dynamic/instance-identity/document 2>/dev/null | grep -o '"accountId" : "[^"]*' | cut -d'"' -f4 || true)
fi

if [ -z "$ACCOUNT_ID" ]; then
  echo "❌ Error: Could not determine AWS Account ID. Make sure the EC2 instance role is attached."
  exit 1
fi

ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_NAME="${ECR_REGISTRY}/${REPO_NAME}:${IMAGE_TAG}"

if [ ! -f /opt/dreamxec/.env ]; then
  echo "❌ Error: /opt/dreamxec/.env not found! Please create it before running."
  exit 1
fi

echo "🔐 Logging into Amazon ECR ($ECR_REGISTRY)..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo "📥 Pulling Docker image: $IMAGE_NAME..."
docker pull "$IMAGE_NAME"

# Determine active and idle slots
if docker ps --format '{{.Names}}' | grep -w -q 'dreamxec-backend-green'; then
  CURRENT_CONTAINER='dreamxec-backend-green'
  NEW_CONTAINER='dreamxec-backend-blue'
  NEW_PORT=5000
else
  CURRENT_CONTAINER='dreamxec-backend-blue'
  NEW_CONTAINER='dreamxec-backend-green'
  NEW_PORT=5001
fi

if docker ps --format '{{.Names}}' | grep -w -q '^dreamxec-backend$'; then
  CURRENT_CONTAINER='dreamxec-backend'
  NEW_CONTAINER='dreamxec-backend-green'
  NEW_PORT=5001
fi

echo "🚀 Starting new container $NEW_CONTAINER on port $NEW_PORT..."
docker rm -f "$NEW_CONTAINER" 2>/dev/null || true
docker run -d \
  --name "$NEW_CONTAINER" \
  --restart unless-stopped \
  -p 127.0.0.1:$NEW_PORT:5000 \
  --env-file /opt/dreamxec/.env \
  "$IMAGE_NAME"

echo "⏳ Waiting for new container $NEW_CONTAINER to become healthy..."
HEALTHY=false
for i in $(seq 1 45); do
  if curl -f -s http://127.0.0.1:$NEW_PORT/health/live >/dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  sleep 1
done

if [ "$HEALTHY" != "true" ]; then
  echo "❌ Application failed health check. Printing logs:"
  docker logs --tail 50 "$NEW_CONTAINER"
  docker stop "$NEW_CONTAINER" 2>/dev/null || true
  docker rm "$NEW_CONTAINER" 2>/dev/null || true
  exit 1
fi

echo "✅ New container is LIVE and healthy on port $NEW_PORT"

# Update Nginx upstream
sudo mkdir -p /etc/nginx/conf.d
echo "upstream dreamxec_upstream { server 127.0.0.1:$NEW_PORT; }" | sudo tee /etc/nginx/conf.d/dreamxec-upstream.conf > /dev/null
sudo sed -i 's|proxy_pass http://127.0.0.1:5000;|proxy_pass http://dreamxec_upstream;|' /etc/nginx/sites-available/dreamxec 2>/dev/null || true

if sudo nginx -t 2>/dev/null; then
  sudo nginx -s reload
  echo "🔄 Nginx reloaded to port $NEW_PORT with zero downtime."
fi

echo "⏳ Draining old container (5 seconds)..."
sleep 5

if [ "$CURRENT_CONTAINER" != "$NEW_CONTAINER" ]; then
  docker stop "$CURRENT_CONTAINER" 2>/dev/null || true
  docker rm "$CURRENT_CONTAINER" 2>/dev/null || true
fi

echo "🧹 Cleaning up dangling images..."
docker image prune -af --filter "until=72h" > /dev/null 2>&1 || true

echo "🎉 Zero-Downtime Deployment successful!"
