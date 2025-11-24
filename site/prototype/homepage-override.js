(() => {
  function el(tag, attrs = {}, html = '') {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k, v));
    if (html) e.innerHTML = html;
    return e;
  }

  function insertFeatured() {
    const root = document.getElementById('root');
    if (!root || root.dataset.nxFeaturedInjected) return;

    const wrap = el('section', {
      class: 'relative z-10 w-full border-b border-brand-border/60 bg-brand-black/70 backdrop-blur'
    });

    wrap.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="grid gap-8 md:grid-cols-2 items-stretch rounded-xl border border-brand-border bg-brand-dark/60 overflow-hidden">
          <div class="p-6 md:p-8 flex flex-col justify-center">
            <p class="text-xs tracking-widest text-brand-cyan uppercase">Series Spotlight · Thanksgiving</p>
            <h2 class="mt-2 font-serif text-3xl md:text-4xl">Eight calm dishes for a warmer table</h2>
            <p class="mt-3 text-brand-muted">Daily drops of mains, sides, and make‑ahead tricks you can actually use. Vegan‑friendly, regionally varied, and built to travel.</p>
            <div class="mt-5 flex flex-wrap gap-2">
              <a class="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-brand-cyan text-brand-black font-medium hover:brightness-105" href="/prototype/thanksgiving/">Open the series</a>
              <a class="inline-flex items-center gap-2 rounded-lg px-4 py-2 border border-brand-border hover:border-brand-cyan text-brand-text" href="/posts/thanksgiving-signature-sides.html">Day 1</a>
              <a class="inline-flex items-center gap-2 rounded-lg px-4 py-2 border border-brand-border hover:border-brand-cyan text-brand-text" href="/posts/thanksgiving-cozy-soups.html">Day 2</a>
              <a class="inline-flex items-center gap-2 rounded-lg px-4 py-2 border border-brand-border hover:border-brand-cyan text-brand-text" href="/posts/thanksgiving-delicious-desserts.html">Day 3</a>
              <a class="inline-flex items-center gap-2 rounded-lg px-4 py-2 border border-brand-border hover:border-brand-cyan text-brand-text" href="/posts/thanksgiving-turkey-main-dishes.html">Day 4</a>
            </div>
          </div>
          <div class="relative">
            <img src="/Images/thanksgiving/thanksgiving_side_dishes.png" alt="Thanksgiving Series" class="w-full h-full object-cover" style="aspect-ratio:16/9" />
          </div>
        </div>
      </div>
    `;

    // Prefer replacing the existing Featured Story inside the app
    let featuredContainer = null;
    const targetText = 'the future of sustainable ai in urban planning';
    const heading = Array.from(root.querySelectorAll('h1,h2,h3')).find(h => ((h.textContent||'').trim().toLowerCase() === targetText));
    if (heading) {
      let n = heading;
      for (let i=0; i<6 && n; i++) {
        if (n.tagName === 'SECTION' || n.tagName === 'ARTICLE') { featuredContainer = n; break; }
        if (n.className && (n.className.includes('grid') || n.className.includes('rounded') || n.className.includes('mx-auto'))) { featuredContainer = n; break; }
        n = n.parentElement;
      }
    }
    if (!featuredContainer) {
      featuredContainer = root.querySelector('section,article,div');
    }
    if (featuredContainer && featuredContainer.parentNode) {
      featuredContainer.parentNode.insertBefore(wrap, featuredContainer);
      featuredContainer.style.display = 'none';
    } else {
      // Fallback: insert before app root
      root.parentNode.insertBefore(wrap, root);
    }
    root.dataset.nxFeaturedInjected = '1';
  }

  async function insertLatest() {
    const root = document.getElementById('root');
    if (!root || root.dataset.nxLatestInjected) return;
    try {
      const res = await fetch('/content_html/index.json', { cache: 'no-cache' });
      const items = await res.json();
      const latest = Array.isArray(items) ? items.slice(0, 6) : [];
      if (!latest.length) return;

      const section = el('section', { class: 'w-full' });
      section.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div class="flex items-end justify-between gap-4">
            <div>
              <p class="text-xs tracking-widest text-brand-muted uppercase">Dispatches</p>
              <h2 class="font-serif text-2xl">Latest Articles</h2>
            </div>
          </div>
          <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" id="nx-latest-grid"></div>
        </div>
      `;
      root.parentNode.insertBefore(section, root.nextSibling);

      const grid = section.querySelector('#nx-latest-grid');
      latest.forEach((it) => {
        const card = el('a', {
          class: 'block group rounded-xl border border-brand-border bg-brand-dark/70 p-5 hover:-translate-y-0.5 transition',
          href: it.url
        });
        card.innerHTML = `
          <p class="text-xs text-brand-muted">${(it.title||'').split(' ')[0]||'Story'}</p>
          <h3 class="mt-1 font-medium">${it.title||''}</h3>
          <p class="mt-2 text-sm text-brand-muted">${it.date||''}</p>
        `;
        grid.appendChild(card);
      });
      root.dataset.nxLatestInjected = '1';
    } catch (e) {
      // ignore
    }
  }

  function run() {
    insertFeatured();
    insertLatest();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(run, 100);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(run, 100));
  }
})();
