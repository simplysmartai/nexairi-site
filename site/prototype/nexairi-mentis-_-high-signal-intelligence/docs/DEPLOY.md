
# Deployment Guide: Going Live (Cloudflare Pages)

## 🛑 EMERGENCY FIX: "Installing nodejs failed"
If your build fails with "Installing tools and dependencies" or you see weird characters like `nodejs@`:

1.  Go to **Settings** > **Environment variables** in Cloudflare.
2.  Add a variable:
    *   **Name:** `NODE_VERSION`
    *   **Value:** `20`
    *   **Type:** Text (Select "Text" or "Plain Text")
3.  Click **Save**.
4.  Go to **Deployments** and click **Retry deployment**.

---

## Standard Settings
*   **Build command:** `npm run build`
*   **Build output directory:** `dist`
*   **Root directory:** leave blank for this repo (set to `site/prototype/nexairi-mentis-_-high-signal-intelligence` only if you deploy from a parent monorepo)

> ℹ️ **Note:** Previous Netlify configs have been removed—Cloudflare Pages is the single source of truth for production deployments.
