#!/bin/bash

# Cron Job 테스트 스크립트

echo "🧪 Testing Cron Job: process-plan-changes"
echo ""

# 로컬 환경
LOCAL_URL="http://localhost:3000/api/cron/process-plan-changes"

# 또는 배포된 환경
PROD_URL="https://jobizic.vercel.app/api/cron/process-plan-changes"

# CRON_SECRET 환경변수가 있으면 사용
if [ -n "$CRON_SECRET" ]; then
  echo "Using CRON_SECRET authentication"
  curl -X GET "$LOCAL_URL" \
    -H "Authorization: Bearer $CRON_SECRET" \
    -H "Content-Type: application/json" \
    | jq '.'
else
  echo "No CRON_SECRET (open endpoint for testing)"
  curl -X GET "$LOCAL_URL" \
    -H "Content-Type: application/json" \
    | jq '.'
fi

echo ""
echo "✅ Test complete"
