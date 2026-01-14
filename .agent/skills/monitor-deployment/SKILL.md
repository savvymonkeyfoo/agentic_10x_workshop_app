---
name: Monitor Vercel Deployment
description: Verifies successful Vercel deployment after pushing changes to GitHub.
---

# Monitor Vercel Deployment

This skill ensures that changes pushed to GitHub are successfully deployed to Vercel.

## Trigger

Perform this check every time you push a change to GitHub for this project.

## Procedure

1. **Open the Deployments Dashboard**
    - Go to: [https://vercel.com/mike-jones-projects/agentic-10x-workshop-app/deployments](https://vercel.com/mike-jones-projects/agentic-10x-workshop-app/deployments)
    - Use the `open_browser_url` or `read_browser_page` tool to access this page.

2. **Identify the Latest Deployment**
    - Look for the deployment associated with your latest commit.
    - Status indicators:
        - **Blue/Yellow dots/spinners**: Building/Queued.
        - **Green Checkmark**: Completed/Ready.
        - **Red X**: Failed.

3. **Monitor Progress**
    - If the deployment is in progress, wait for it to complete.
    - You may need to refresh or poll the page status if using `read_browser_page`.

4. **Confirm Completion**
    - Ensure the state becomes **Ready**.
    - If the deployment fails, analyze the build logs to identify the error.

5. **Validation**
    - Once Ready, click the deployment URL to visit the live site.
    - specific verification steps (if any) should be performed to ensure the changes are active.
