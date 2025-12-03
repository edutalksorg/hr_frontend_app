#!/usr/bin/env bash
# build + deploy script for Unix environments
# Requires AWS CLI configured (aws configure) or env vars AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY
# Usage: ./scripts/deploy.sh <s3-bucket> <cloudfront-dist-id>

set -euo pipefail
BUCKET="$1"
DIST_ID="$2"

pnpm install --frozen-lockfile
pnpm build

aws s3 sync ./dist s3://"${BUCKET}" --delete --acl public-read
aws cloudfront create-invalidation --distribution-id "${DIST_ID}" --paths '/*'

echo "Deployed to s3://${BUCKET} and invalidated CloudFront ${DIST_ID}."
