# Deploying the Frontend to S3 + CloudFront

This project uses Vite. The production build output lives in the `dist/` directory by default.

Two ways to deploy:

1) GitHub Actions (recommended)
  - Provide the following GitHub repository secrets:
    - AWS_ACCESS_KEY_ID
    - AWS_SECRET_ACCESS_KEY
    - AWS_REGION (e.g. ap-south-1)
    - S3_BUCKET (e.g. my-frontend-bucket)
    - CLOUDFRONT_DISTRIBUTION_ID
  - Push to `main` / `master`; the workflow at `.github/workflows/deploy.yml` will build and deploy.

2) Local deploy (requires AWS CLI)
  - Using Bash / WSL / macOS:

    ```bash
    chmod +x ./scripts/deploy.sh
    ./scripts/deploy.sh <S3_BUCKET> <CLOUDFRONT_DIST_ID>
    ```

  - On Windows PowerShell:

    ```powershell
    ./scripts/deploy.ps1 -BucketName <S3_BUCKET> -CloudFrontId <CLOUDFRONT_DIST_ID>
    ```

Notes:
- The workflow syncs the `dist/` directory to the S3 bucket and then creates a CloudFront invalidation for `/*`.
- Make sure your S3 bucket is configured for hosting (static website hosting, or CloudFront origin) and the bucket policy allows the deployment principal (AWS credentials) to sync.
- Replace the placeholder Elastic Beanstalk URL inside `.env.production` with your real EB URL before building if you want the frontend to hit that backend.
