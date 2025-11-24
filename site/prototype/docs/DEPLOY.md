# Deployment Guide

## Step 1: Save Code to GitHub
1.  Click the **"Save to GitHub"** button in your editor.
2.  Commit the changes to your `main` branch.

## Step 2: Configure Cloudflare Pages
1.  Log in to your Cloudflare Dashboard.
2.  Go to **Workers & Pages** -> **Create Application** -> **Pages** -> **Connect to Git**.
3.  Select your `Nexairi` repository.
4.  **Build Settings:**
    *   **Framework Preset:** Vite
    *   **Build Command:** `npm run build`
    *   **Build Output Directory:** `dist`
5.  Click **Save and Deploy**.

## Step 3: Future Updates
*   To add new posts, simply update the `public/posts.json` file in your GitHub repository (either manually or via n8n).
*   Cloudflare will detect the change and update the site automatically in seconds.
