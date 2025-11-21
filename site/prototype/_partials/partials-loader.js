(() => {
  async function injectPartial(id, url) {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      const v = 'v20251121';
      const sep = url.includes('?') ? '&' : '?';
      const res = await fetch(url + sep + 'v=' + v, { cache: 'no-cache' });
      const html = await res.text();
      el.outerHTML = html;
    } catch (e) {
      // Fail silently to avoid blocking page render
    }
  }
  injectPartial('proto-header', '/prototype/_partials/header.html');
  injectPartial('proto-footer', '/prototype/_partials/footer.html');
})();
