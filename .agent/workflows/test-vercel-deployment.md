---
description: Test deployment on Vercel after changes
---

# Test Vercel Deployment

This workflow outlines how to test the application on Vercel after making changes.

## Prerequisites

- Changes have been pushed to GitHub
- Vercel URL: <https://agentic-10x-workshop-app.vercel.app>
- Login credentials (if auth enabled):
  - Username: `admin`
  - Password: `workshop2025`

## Steps

### 1. Push Changes to GitHub

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

### 2. Wait for Vercel Deployment

Wait approximately 2-3 minutes for Vercel to:

- Pull changes from GitHub
- Run build process
- Deploy to production

You can monitor deployment status at: <https://vercel.com/dashboard>

### 3. Open Browser and Navigate to App

Use the browser tool to navigate to the Vercel URL and perform testing.

### 4. Test Key Features

Depending on what was changed, test:

- **Home Page** (`/`)
  - Workshop creation
  - Workshop list display
  
- **Workshop Page** (`/workshop/[id]`)
  - Opportunity creation
  - Input validation
  - Auto-save functionality
  - VRCC scoring
  - Workflow builder
  
- **Analysis Page** (`/workshop/[id]/analysis`)
  - Matrix visualization
  - Waves visualization
  - Strategic insights
  
- **Canvas/Reporting** (`/workshop/[id]/reporting`)
  - Canvas display
  - PDF export
  - Data accuracy

### 5. Document Findings

Capture screenshots of:

- ✅ Working features
- ❌ Broken features
- 🐛 Unexpected behavior

### 6. Fix Issues and Iterate

If issues are found:

1. Identify root cause
2. Make fixes locally
3. Test locally first
4. Push to GitHub
5. Repeat this workflow

## Notes

- During development, authentication can be disabled for easier testing
- Always test locally before pushing to Vercel when possible
- Keep deployment frequency reasonable to avoid hitting Vercel build limits
