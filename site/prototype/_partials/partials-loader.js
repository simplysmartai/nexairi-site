(() => {
  async function injectPartial(id, url) {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      const html = await res.text();
      el.outerHTML = html;
    } catch (e) {
      // Fail silently to avoid blocking page render
    }
  }
  injectPartial('proto-header', '/prototype/_partials/header.html');
  injectPartial('proto-footer', '/prototype/_partials/footer.html');
})();

