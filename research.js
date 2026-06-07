/* ============================================================
   research.js — Full interactivity for research.html
   Also safely loaded by game.html (all selectors guard-checked)
   ============================================================ */
 
/* ── ArXiv API integration ── */

// Maps filter category → ArXiv search query
const ARXIV_QUERIES = {
  all : 'cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CV OR cat:q-bio',
  ai  : 'cat:cs.AI',
  ml  : 'cat:cs.LG',
  nlp : 'cat:cs.CL',
  cv  : 'cat:cs.CV',
  bio : 'cat:q-bio',
};

// Maps ArXiv category prefix → our internal category + display info
const CAT_MAP = {
  'cs.AI' : { category:'ai',  tag:'tag-ai',  tagLabel:'Artificial Intelligence' },
  'cs.LG' : { category:'ml',  tag:'tag-ml',  tagLabel:'Machine Learning' },
  'cs.CL' : { category:'nlp', tag:'tag-nlp', tagLabel:'NLP' },
  'cs.CV' : { category:'cv',  tag:'tag-cv',  tagLabel:'Computer Vision' },
  'q-bio' : { category:'bio', tag:'tag-bio', tagLabel:'Bioinformatics' },
};

// Live papers fetched from ArXiv — replaces the old static array
let PAPERS = [];
let arxivCache = {};   // keyed by query string to avoid redundant fetches

/**
 * Fetches real papers from the ArXiv API.
 * Tries three CORS proxies in sequence until one works.
 * Works from file://, localhost, and hosted environments.
 */
async function fetchArxivPapers(query, maxResults = 18) {
  if (arxivCache[query]) return arxivCache[query];

  const apiUrl = 'https://export.arxiv.org/api/query'
    + '?search_query=' + encodeURIComponent(query)
    + '&sortBy=submittedDate&sortOrder=descending'
    + '&max_results=' + maxResults;

  // Three independent proxies tried in order
  const PROXIES = [
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    url => `https://thingproxy.freeboard.io/fetch/${url}`,
  ];

  let xmlText = null;
  let lastErr  = '';

  for (const makeProxy of PROXIES) {
    try {
      const res = await fetch(makeProxy(apiUrl), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) { lastErr = 'HTTP ' + res.status; continue; }
      const text = await res.text();
      // Sanity-check: must look like an Atom feed
      if (text.includes('<feed') || text.includes('<entry')) { xmlText = text; break; }
      lastErr = 'Unexpected response (not XML)';
    } catch (e) {
      lastErr = e.message;
    }
  }

  if (!xmlText) throw new Error('All proxies failed. Last error: ' + lastErr);

  const parser  = new DOMParser();
  const xml     = parser.parseFromString(xmlText, 'application/xml');
  const entries = [...xml.querySelectorAll('entry')];

  if (entries.length === 0) throw new Error('ArXiv returned 0 results for this query.');

  const papers = entries.map((entry, i) => {
    const rawId    = entry.querySelector('id')?.textContent?.trim() ?? '';
    const arxivId  = rawId.replace(/https?:\/\/arxiv\.org\/abs\//, '').replace(/v\d+$/, '');
    const title    = (entry.querySelector('title')?.textContent ?? 'Untitled').replace(/\s+/g, ' ').trim();
    const abstract = (entry.querySelector('summary')?.textContent ?? '').replace(/\s+/g, ' ').trim();
    const published = entry.querySelector('published')?.textContent?.trim() ?? '';
    const dateStr  = published
      ? new Date(published).toLocaleString('en-US', { month: 'short', year: 'numeric' })
      : '';

    const primaryCat = entry.querySelector('primary_category')?.getAttribute('term') ?? '';
    const catPrefix  = Object.keys(CAT_MAP).find(k => primaryCat.startsWith(k)) ?? 'cs.AI';
    const { category, tag, tagLabel } = CAT_MAP[catPrefix];

    return { id: arxivId || String(i + 1), tag, tagLabel, category, title, abstract, date: dateStr,
             arxivUrl: `https://arxiv.org/abs/${arxivId}` };
  });

  arxivCache[query] = papers;
  return papers;
}
async function loadPapersForFilter(filterKey) {
  const grid = document.querySelector('#research-papers .row.g-4');
  if (!grid) return;

  // Show loading skeleton
  grid.innerHTML = Array.from({ length: 6 }, () => `
    <div class="col-md-6 col-lg-4">
      <div class="paper-card" style="min-height:220px;">
        <div style="height:18px;width:55%;background:rgba(255,255,255,.07);border-radius:6px;margin-bottom:14px;animation:skPulse 1.4s infinite;"></div>
        <div style="height:14px;width:90%;background:rgba(255,255,255,.05);border-radius:6px;margin-bottom:8px;animation:skPulse 1.4s infinite;"></div>
        <div style="height:14px;width:75%;background:rgba(255,255,255,.05);border-radius:6px;animation:skPulse 1.4s infinite;"></div>
      </div>
    </div>`).join('');

  if (!document.getElementById('sk-pulse-style')) {
    const s = document.createElement('style');
    s.id = 'sk-pulse-style';
    s.textContent = '@keyframes skPulse{0%,100%{opacity:.4}50%{opacity:.9}}';
    document.head.appendChild(s);
  }

  try {
    const query = ARXIV_QUERIES[filterKey] ?? ARXIV_QUERIES.all;
    PAPERS = await fetchArxivPapers(query, 18);
  } catch (err) {
    console.error('ArXiv API error:', err);
    PAPERS = [];
    grid.innerHTML = `<div class="col-12 text-center py-5">
      <i class="fa-solid fa-triangle-exclamation" style="font-size:2.5rem;color:#f87171;display:block;margin-bottom:14px;"></i>
      <p style="color:var(--text-muted);">Could not load papers from ArXiv.</p>
      <p style="color:var(--text-muted);font-size:.8rem;opacity:.7;">${err.message}</p>
      <button onclick="loadPapersForFilter(state.activeFilter)" class="btn-paper btn-paper-outline" style="margin-top:12px;padding:8px 20px;">
        <i class="fa-solid fa-rotate"></i> Retry
      </button>
    </div>`;
    return;
  }

  state.visibleCount = 6;
  renderPapers();
}
   
  /* ── App state ── */
  const state = {
    activeFilter : 'all',
    searchQuery  : '',
    visibleCount : 6,
    savedIds     : new Set(),
  };
   
  const BATCH = 3;
   
  function noJump(e) { e.preventDefault(); }
   
  /* ══════════════════════════════════
     1. NAVBAR
  ══════════════════════════════════ */
  function initNavbar() {
    const nav = document.getElementById('scholarNav');
    if (!nav) return;
   
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        nav.style.padding   = '6px 0';
        nav.style.boxShadow = '0 4px 24px rgba(0,0,0,0.45)';
      } else {
        nav.style.padding   = '12px 0';
        nav.style.boxShadow = 'none';
      }
    }, { passive: true });
   
    document.querySelectorAll('#navMenu .nav-link').forEach(link => {
      link.addEventListener('click', () => {
        const menu = document.getElementById('navMenu');
        if (menu && menu.classList.contains('show')) {
          if (typeof bootstrap !== 'undefined') {
            bootstrap.Collapse.getInstance(menu)?.hide();
          }
        }
      });
    });
  }
   
  /* ══════════════════════════════════
     2. FILTER TABS
  ══════════════════════════════════ */
  function initFilterTabs() {
    const MAP = {
      'All'                   : 'all',
      'Artificial Intelligence': 'ai',
      'Machine Learning'      : 'ml',
      'NLP'                   : 'nlp',
      'Computer Vision'       : 'cv',
      'Bioinformatics'        : 'bio',
      '2024 – 2025'           : 'all',
    };
   
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.dataset.filter = MAP[tab.textContent.trim()] ?? 'all';
   
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        state.activeFilter = this.dataset.filter;
        state.visibleCount = 6;
        loadPapersForFilter(this.dataset.filter);
      });
    });
  }
   
  /* ══════════════════════════════════
     3. RENDER PAPERS
  ══════════════════════════════════ */
  function renderPapers() {
    const grid    = document.querySelector('#research-papers .row.g-4');
    const loadBtn = document.querySelector('#load-more-btn');
    if (!grid) return;
   
    const q = state.searchQuery.toLowerCase();
   
    const filtered = PAPERS.filter(p => {
      const catOk    = state.activeFilter === 'all' || p.category === state.activeFilter;
      const searchOk = !q || p.title.toLowerCase().includes(q) || p.abstract.toLowerCase().includes(q) || p.tagLabel.toLowerCase().includes(q);
      return catOk && searchOk;
    });
   
    const slice = filtered.slice(0, state.visibleCount);
   
    grid.style.transition = 'opacity 0.22s ease';
    grid.style.opacity    = '0';
   
    setTimeout(() => {
      grid.innerHTML = slice.length
        ? slice.map(buildCard).join('')
        : `<div class="col-12 text-center py-5">
             <i class="fa-solid fa-file-circle-xmark" style="font-size:2.5rem;color:var(--text-muted);display:block;margin-bottom:14px;"></i>
             <p style="color:var(--text-muted);">No papers found. Try a different filter or search term.</p>
           </div>`;
   
      attachCardEvents();
      animateCards();
   
      if (loadBtn) {
        loadBtn.style.display = filtered.length > state.visibleCount ? 'inline-flex' : 'none';
      }
   
      grid.style.opacity = '1';
    }, 200);
  }
   
  function buildCard(p) {
    const saved = state.savedIds.has(p.id);
    return `
      <div class="col-md-6 col-lg-4" data-paper-id="${p.id}">
        <div class="paper-card">
          <span class="paper-tag ${p.tag}">${p.tagLabel}</span>
          <h4 class="paper-title">${p.title}</h4>
          <p class="paper-abstract">${p.abstract}</p>
          <div class="paper-meta">
            <span><i class="fa-regular fa-calendar"></i> ${p.date}</span>
            <span><i class="fa-brands fa-arxiv" style="font-size:.85em;"></i> ArXiv</span>
          </div>
          <div class="paper-actions">
            <a href="${p.arxivUrl || ('https://arxiv.org/abs/' + p.id)}" target="_blank" rel="noopener" class="btn-paper btn-paper-primary btn-read" data-id="${p.id}">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Read
            </a>
            <button class="btn-paper btn-paper-outline btn-save ${saved ? 'saved' : ''}"
                    data-id="${p.id}"
                    style="${saved ? 'color:#93c5fd;border-color:#185FA5;' : ''}">
              <i class="fa-${saved ? 'solid' : 'regular'} fa-bookmark"></i>
              ${saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>`;
  }
   
  /* ══════════════════════════════════
     4. CARD BUTTON EVENTS
  ══════════════════════════════════ */
  function attachCardEvents() {
    // .btn-read now has a real href to arxiv.org — no handler needed
   
    document.querySelectorAll('.btn-save').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const id = parseInt(this.dataset.id);
        if (state.savedIds.has(id)) {
          state.savedIds.delete(id);
          this.innerHTML = '<i class="fa-regular fa-bookmark"></i> Save';
          this.style.color = '';
          this.style.borderColor = '';
          this.classList.remove('saved');
          showToast('Removed from saved.');
        } else {
          state.savedIds.add(id);
          this.innerHTML = '<i class="fa-solid fa-bookmark"></i> Saved';
          this.style.color       = '#93c5fd';
          this.style.borderColor = '#185FA5';
          this.classList.add('saved');
          showToast('Paper saved!');
        }
      });
    });
  }
   
  /* ══════════════════════════════════
     5. LOAD MORE
  ══════════════════════════════════ */
  function initLoadMore() {
    const btn = document.querySelector('#research-papers .text-center button');
    if (btn) {
      btn.id = 'load-more-btn';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        state.visibleCount += BATCH;
        renderPapers();
      });
    }
  }
   
  /* ══════════════════════════════════
     6. SEARCH
  ══════════════════════════════════ */
  function initSearch() {
    const heroInput = document.querySelector('.hero-search input');
    const heroBtn   = document.querySelector('.hero-search button');
    const ctaInput  = document.querySelector('.research-input-group input');
    const ctaBtn    = document.querySelector('.research-input-group button');
   
    function doSearch(inputEl) {
      if (!inputEl) return;
      state.searchQuery  = inputEl.value.trim();
      state.visibleCount = 6;
      state.activeFilter = 'all';
      document.querySelectorAll('.filter-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.filter === 'all');
      });
      renderPapers();
      document.getElementById('research-papers')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
   
    heroBtn?.addEventListener('click', (e) => { e.preventDefault(); doSearch(heroInput); });
    ctaBtn ?.addEventListener('click', (e) => { e.preventDefault(); doSearch(ctaInput);  });
   
    [heroInput, ctaInput].forEach(inp => {
      inp?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doSearch(inp); } });
    });
   
    let debounce;
    ctaInput?.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => doSearch(ctaInput), 380);
    });
  }
   
  /* ══════════════════════════════════
     7. STATS COUNTER
  ══════════════════════════════════ */
  function initStatsCounter() {
    const MAP = { '12,400+':12400, '340+':340, '8,900+':8900, '98%':98 };
    const SFX = { 12400:'+', 340:'+', 8900:'+', 98:'%' };
    const fmt = (v, t) => t >= 1000 ? v.toLocaleString() + SFX[t] : v + SFX[t];
   
    const animate = (el, target) => {
      const start = performance.now();
      const tick  = (now) => {
        const p = Math.min((now - start) / 1600, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.floor(e * target), target);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
   
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const raw = en.target.textContent.trim();
        const t   = MAP[raw];
        if (t !== undefined) { animate(en.target, t); obs.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
   
    document.querySelectorAll('.stat-number').forEach(el => obs.observe(el));
  }
   
  /* ══════════════════════════════════
     8. SCROLL REVEAL
  ══════════════════════════════════ */
  function initScrollReveal() {
    const css = document.createElement('style');
    css.textContent = `
      .reveal { opacity:0; transform:translateY(26px); transition:opacity .5s ease,transform .5s ease; }
      .reveal.visible { opacity:1; transform:translateY(0); }
    `;
    document.head.appendChild(css);
   
    const tag = (sel, delay = 0) =>
      document.querySelectorAll(sel).forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${delay + i * 0.07}s`;
      });
   
    tag('.section-label');
    tag('.section-title');
    tag('.section-sub');
    tag('.stat-item', 0);
    tag('.topic-card', 0);
    document.querySelector('.featured-card')        ?.classList.add('reveal');
    document.querySelector('.research-search-wrap') ?.classList.add('reveal');
    document.querySelector('.game-promo-card')      ?.classList.add('reveal');
   
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.1 });
   
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  }
   
  /* ══════════════════════════════════
     9. CARD ENTRANCE ANIMATION
  ══════════════════════════════════ */
  function animateCards() {
    document.querySelectorAll('#research-papers .paper-card').forEach((card, i) => {
      card.style.opacity    = '0';
      card.style.transform  = 'translateY(18px)';
      card.style.transition = 'opacity .38s ease, transform .38s ease';
      setTimeout(() => {
        card.style.opacity  = '1';
        card.style.transform = 'translateY(0)';
      }, i * 75);
    });
  }
   
  /* ══════════════════════════════════
     10. TOAST
  ══════════════════════════════════ */
  function showToast(msg) {
    let wrap = document.getElementById('rs-toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'rs-toast-wrap';
      wrap.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
      document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    t.style.cssText = `
      background:rgba(13,31,53,.95);border:1px solid rgba(24,95,165,.45);
      color:#e2e8f0;padding:11px 18px;border-radius:12px;font-size:.84rem;
      font-family:'Poppins',sans-serif;backdrop-filter:blur(12px);
      box-shadow:0 8px 24px rgba(0,0,0,.3);display:flex;align-items:center;
      gap:9px;opacity:0;transform:translateY(10px);transition:all .28s ease;pointer-events:none;`;
    t.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#4ade80;"></i> ${msg}`;
    wrap.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      t.style.opacity = '1'; t.style.transform = 'translateY(0)';
    }));
    setTimeout(() => {
      t.style.opacity = '0'; t.style.transform = 'translateY(10px)';
      setTimeout(() => t.remove(), 300);
    }, 2600);
  }
   
  /* ══════════════════════════════════
     11. TOPIC CARDS → filter
  ══════════════════════════════════ */
  function initTopicCards() {
    const MAP = { 'AI':'ai', 'ML':'ml', 'NLP':'nlp', 'Vision':'cv', 'BioInfo':'bio', 'Security':'all' };
   
    document.querySelectorAll('.topic-card').forEach(card => {
      card.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const name   = this.querySelector('.topic-name')?.textContent.trim();
        const filter = MAP[name] ?? 'all';
        state.activeFilter = filter;
        state.visibleCount = 6;
        document.querySelectorAll('.filter-tab').forEach(tab => {
          tab.classList.toggle('active', tab.dataset.filter === filter);
        });
        loadPapersForFilter(filter);
        document.getElementById('research-papers')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }
   
  /* ══════════════════════════════════
     12. BACK TO TOP
  ══════════════════════════════════ */
  function initBackToTop() {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    btn.style.cssText = `
      position:fixed;bottom:28px;left:28px;width:44px;height:44px;
      border-radius:50%;background:#185FA5;border:none;color:#fff;
      font-size:1rem;cursor:pointer;display:flex;align-items:center;
      justify-content:center;opacity:0;transform:translateY(14px);
      transition:all .3s ease;z-index:9998;
      box-shadow:0 4px 16px rgba(24,95,165,.4);pointer-events:none;`;
    document.body.appendChild(btn);
   
    window.addEventListener('scroll', () => {
      const show = window.scrollY > 400;
      btn.style.opacity       = show ? '1' : '0';
      btn.style.transform     = show ? 'translateY(0)' : 'translateY(14px)';
      btn.style.pointerEvents = show ? 'auto' : 'none';
    }, { passive: true });
   
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
   
  /* ══════════════════════════════════
     13. RESPONSIVE FILTER BAR
  ══════════════════════════════════ */
  function initResponsiveFilterBar() {
    const bar = document.querySelector('.filter-bar');
    if (!bar) return;
    const apply = () => {
      if (window.innerWidth < 576) {
        Object.assign(bar.style, { flexWrap:'nowrap', overflowX:'auto', paddingBottom:'8px', scrollbarWidth:'none' });
      } else {
        Object.assign(bar.style, { flexWrap:'wrap', overflowX:'visible', paddingBottom:'0' });
      }
    };
    apply();
    window.addEventListener('resize', apply);
  }
   
  /* ══════════════════════════════════
     14. KEYBOARD ACCESSIBILITY
  ══════════════════════════════════ */
  function initKeyboard() {
    document.querySelectorAll('.topic-card, .filter-tab').forEach(el => {
      el.setAttribute('tabindex', '0');
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
      });
    });
  }
   
  /* ══════════════════════════════════
     INIT
  ══════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
   
    /* These only run on research.html where the elements exist */
    if (document.getElementById('research-papers')) {
      initFilterTabs();
      initLoadMore();
      initSearch();
      initStatsCounter();
      initTopicCards();
      initResponsiveFilterBar();
      initKeyboard();
      loadPapersForFilter('all');
    }
   
    initScrollReveal();
    initBackToTop();
  });