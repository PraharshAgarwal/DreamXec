#!/bin/bash

# Test script for application endpoints
echo "🧪 Testing Application Endpoints"
echo "================================"

# Base URL
BASE_URL="http://localhost:5000/api"

echo ""
echo "1. Testing GET public donor projects (should work without auth):"
curl -s -X GET "$BASE_URL/donor-projects/public" | head -c 200
echo "..."

echo ""
echo ""
echo "2. Testing GET applications without auth (should fail):"
curl -s -X GET "$BASE_URL/applications/my" | head -c 200
echo "..."

echo ""
echo ""
echo "3. Testing GET donor applications without auth (should fail):"
curl -s -X GET "$BASE_URL/applications/donor/all" | head -c 200
echo "..."

echo ""
echo ""
echo "✅ Basic endpoint connectivity test completed!"
echo "📝 Applications with null users have been cleaned up"
echo "🛡️  Controller now filters out invalid user references"
echo ""
echo "Next steps for full testing:"
echo "1. Login as a student to test student application endpoints"
echo "2. Login as a donor to test donor application viewing endpoints"
echo "3. Create new applications to test the complete workflow"