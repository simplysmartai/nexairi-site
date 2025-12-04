# Nexairi Launch Kit (Static Starter)

**Why static first?** It's the fastest path to live on HostGator: drag & drop to `/public_html/nexairi` (or your root). 
Use this until you’re ready to upgrade to Next.js for routing, ISR, and APIs.

## What’s inside
- `/site` — static landing with Tools cards and sections
- `/prompts` — copy/paste prompts for logo, banner, blog, SEO, and n8n
- `/automation` — put your exported n8n workflows here
- `/content` — Markdown posts (n8n will add more over time)
- `/content_html` — simple JSON index for client-side list
- `/branding` — colors, taglines

## Deploy on HostGator (cPanel)
1. Create `nexairi` addon domain -> directory (e.g., `/public_html/nexairi`).
2. Upload contents of `/site` into that directory.
3. Replace `tools/giftscout.html` and `tools/pup.html` URLs with your live pages (or drop your HTML directly).
4. Add analytics and ad tags (paste into `index.html` before `</head>` or end of `<body>`).

## Upgrade path to Next.js
Keep branding/assets/prompts; rebuild UI in Next.js when you want dynamic routes and server-side features.

— Generated 2025-11-07
