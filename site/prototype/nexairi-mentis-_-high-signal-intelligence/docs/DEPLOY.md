
# Deployment Guide: Going Live

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
*   **Root directory:** (Leave BLANK)
