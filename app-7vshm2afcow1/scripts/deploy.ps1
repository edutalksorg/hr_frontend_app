# build + deploy script for Windows PowerShell
# Requires AWS CLI configured (aws configure) or env vars AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY
# Usage: .\scripts\deploy.ps1 -BucketName <your-bucket> -CloudFrontId <your-dist-id>
param(
  [Parameter(Mandatory=$true)] [string] $BucketName,
  [Parameter(Mandatory=$true)] [string] $CloudFrontId
)

pnpm install --frozen-lockfile
pnpm build

aws s3 sync ./dist "s3://$BucketName" --delete --acl public-read
aws cloudfront create-invalidation --distribution-id $CloudFrontId --paths '/*'

Write-Host "Deployed to s3://$BucketName and invalidated CloudFront $CloudFrontId."
