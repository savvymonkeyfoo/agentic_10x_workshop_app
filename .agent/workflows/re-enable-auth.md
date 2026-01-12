---
description: How to re-enable authentication after development
---

# Re-enable Authentication

Authentication has been temporarily disabled for development to enable easier automated browser testing.

## Current State

The authentication middleware in `web/src/middleware.ts` has been commented out with clear markers:

- 🚧 Banner indicating auth is disabled
- TODO comment as a reminder
- All auth logic preserved in comments
- Easy re-enable instructions

## How to Re-enable Authentication

### Option 1: Using this workflow (Recommended)

```bash
# Navigate to web directory
cd web/src

# Open middleware.ts and:
# 1. Remove lines 5-9 (the bypass code and banner)
# 2. Uncomment lines 11-40 (remove /* and */)
# 3. Save the file

# Then push to GitHub
git add src/middleware.ts
git commit -m "Re-enable authentication for production"
git push origin main
```

### Option 2: Manual edit

1. Open `web/src/middleware.ts`
2. Delete the "AUTHENTICATION DISABLED" comment block and bypass
3. Uncomment the entire `/* COMMENTED OUT FOR DEVELOPMENT */` block
4. Remove the `/* */` comment markers
5. Save and deploy

## Verification

After re-enabling, test that:

1. Navigating to `/` redirects to `/login`
2. Login works with credentials: `admin` / `workshop2025`
3. After login, you can access all pages
4. Direct navigation to protected pages requires authentication

## Automation Workaround

When auth is re-enabled, the automated browser testing will need to:

1. Start at `/login`
2. Fill in credentials
3. Click login button
4. Then proceed with testing

The workflow at `.agent/workflows/test-vercel-deployment.md` documents this process.
