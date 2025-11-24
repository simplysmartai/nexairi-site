# Cloudflare & Deployment Notes

## Performance Rules (Page Rules)
1. **Cache Level:** "Cache Everything" for `*.css`, `*.js`, `*.jpg`, `*.png`.
2. **Edge Cache TTL:** Set to 7 days minimum for assets.
3. **Browser Cache TTL:** Set to 4 hours for HTML, 1 year for hashed assets.

## Optimization Settings (Speed Tab)
- **Auto Minify:** Check HTML, CSS, JS.
- **Brotli:** On.
- **Rocket Loader:** **OFF**. (Can break inline scripts/hydration in some static setups, test carefully).
- **Image Resizing:** Enable (requires Pro) or use Cloudflare Polish for WebP conversion.

## Security
- **Strict SSL/TLS:** Enable.
- **HSTS:** Enable.

## Deployment Verification
- [ ] Verify `site/posts/` slugs match exactly to prevent 404s.
- [ ] Check `nx-btn--ghost` contrast in Hero section on mobile devices in direct sunlight.
- [ ] Ensure `nexairi_header_logo.png` is served with correct MIME type and cache headers.