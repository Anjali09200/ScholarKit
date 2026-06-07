/* ============================================================
   coding.js — Full interactivity for coding.html
   - Filter tabs (no scroll jump)
   - Live search
   - Navbar shrink on scroll
   - Card entrance animations
   - Scroll reveal
   - Back-to-top button
   - Toast notifications
   - Keyboard accessibility
   ============================================================ */
 
/* ══════════════════════════════════
   1. NAVBAR SCROLL SHRINK
══════════════════════════════════ */
function initNavbar() {
  const nav = document.getElementById('scholarNav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.style.padding   = '6px 0';
      nav.style.boxShadow = '0 4px 24px rgba(0,0,0,0.45)';
    } else {
      nav.style.padding   = '12px 0';
      nav.style.boxShadow = 'none';
    }
  }, { passive: true });

  /* Close mobile menu on link click */
  document.querySelectorAll('#navbarNavDropdown .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const menu = document.getElementById('navbarNavDropdown');
      if (menu && menu.classList.contains('show')) {
        try {
          const bsCollapse = bootstrap.Collapse.getOrCreateInstance(menu);
          bsCollapse.hide();
        } catch (e) {
          menu.classList.remove('show');
        }
      }
    });
  });
}
   
  /* ══════════════════════════════════
     2. FILTER TABS (no page jump)
  ══════════════════════════════════ */
  function initFilterTabs() {
    const tabs  = document.querySelectorAll('.filter-tab');
    const cards = document.querySelectorAll('.tool-card');
   
    tabs.forEach(tab => {
      tab.addEventListener('click', function (e) {
        e.preventDefault();       /* ← stops scroll-to-top */
        e.stopPropagation();
   
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
   
        const filter = this.dataset.filter;
   
        /* Fade out → filter → fade in */
        cards.forEach(card => {
          const match = filter === 'all' || card.dataset.category === filter;
          if (match) {
            card.classList.remove('hidden');
            card.style.animation = 'cardPop 0.35s ease forwards';
          } else {
            card.classList.add('hidden');
          }
        });
   
        showToast(`Showing: ${this.textContent.trim()}`);
      });
    });
  }
   
  /* ══════════════════════════════════
     3. LIVE SEARCH
  ══════════════════════════════════ */
  function initSearch() {
    const input = document.getElementById('toolSearch');
    if (!input) return;
   
    const cards = document.querySelectorAll('.tool-card');
   
    input.addEventListener('input', function () {
      const q = this.value.toLowerCase().trim();
   
      /* Reset filter tabs to "All" when searching */
      if (q.length > 0) {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        const allTab = document.querySelector('.filter-tab[data-filter="all"]');
        if (allTab) allTab.classList.add('active');
      }
   
      let visibleCount = 0;
      cards.forEach(card => {
        const name = (card.dataset.name || '').toLowerCase();
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const desc  = card.querySelector('p')?.textContent.toLowerCase()  || '';
        const match = !q || name.includes(q) || title.includes(q) || desc.includes(q);
   
        if (match) {
          card.classList.remove('hidden');
          visibleCount++;
        } else {
          card.classList.add('hidden');
        }
      });
   
      /* Show empty state if nothing matches */
      let emptyEl = document.getElementById('tools-empty');
      if (visibleCount === 0) {
        if (!emptyEl) {
          emptyEl = document.createElement('div');
          emptyEl.id = 'tools-empty';
          emptyEl.className = 'tools-empty';
          emptyEl.innerHTML = `
            <i class="fa-solid fa-magnifying-glass"></i>
            <p>No tools found for "<strong>${q}</strong>"</p>
            <small>Try a different keyword</small>`;
          document.getElementById('toolsGrid')?.after(emptyEl);
        } else {
          emptyEl.querySelector('strong').textContent = q;
          emptyEl.style.display = 'block';
        }
      } else if (emptyEl) {
        emptyEl.style.display = 'none';
      }
    });
   
    /* Clear on Escape */
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        input.value = '';
        input.dispatchEvent(new Event('input'));
      }
    });
  }
   
  /* ══════════════════════════════════
     4. CARD ENTRANCE ANIMATIONS
  ══════════════════════════════════ */
  function initCardAnimations() {
    /* Inject keyframe */
    const style = document.createElement('style');
    style.textContent = `
      @keyframes cardPop {
        from { opacity: 0; transform: translateY(16px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0)    scale(1);    }
      }
      .tool-card { animation: cardPop 0.4s ease forwards; }
    `;
    document.head.appendChild(style);
   
    /* Stagger on load */
    document.querySelectorAll('.tool-card').forEach((card, i) => {
      card.style.animationDelay = `${i * 0.06}s`;
      card.style.opacity = '0';
      setTimeout(() => { card.style.opacity = ''; }, i * 60 + 400);
    });
  }
   
  /* ══════════════════════════════════
     5. SCROLL REVEAL
  ══════════════════════════════════ */
  function initScrollReveal() {
    const css = document.createElement('style');
    css.textContent = `
      .c-reveal {
        opacity: 0;
        transform: translateY(22px);
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      .c-reveal.visible {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(css);
   
    document.querySelectorAll('.page-hero-badge, .page-hero h1, .page-hero p').forEach(el => {
      el.classList.add('c-reveal');
    });
   
    const observer = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          observer.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
   
    document.querySelectorAll('.c-reveal').forEach(el => observer.observe(el));
  }
   
  /* ══════════════════════════════════
     6. BACK TO TOP BUTTON
  ══════════════════════════════════ */
  function initBackToTop() {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    btn.style.cssText = `
      position: fixed; bottom: 28px; left: 28px;
      width: 44px; height: 44px; border-radius: 50%;
      background: #185FA5; border: none; color: #fff;
      font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transform: translateY(14px);
      transition: all 0.3s ease; z-index: 9998;
      box-shadow: 0 4px 16px rgba(24,95,165,0.45);
      pointer-events: none;
    `;
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
     7. TOAST NOTIFICATION
  ══════════════════════════════════ */
  function showToast(msg, icon = 'fa-circle-check', color = '#4ade80') {
    let wrap = document.getElementById('c-toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'c-toast-wrap';
      wrap.style.cssText = `
        position: fixed; bottom: 24px; right: 24px;
        z-index: 9999; display: flex; flex-direction: column;
        gap: 10px; pointer-events: none;
      `;
      document.body.appendChild(wrap);
    }
   
    const t = document.createElement('div');
    t.style.cssText = `
      background: rgba(13,31,53,.96);
      border: 1px solid rgba(24,95,165,.4);
      color: #e2e8f0; padding: 11px 18px; border-radius: 12px;
      font-size: .84rem; font-family: 'Poppins', sans-serif;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 24px rgba(0,0,0,.3);
      display: flex; align-items: center; gap: 9px;
      opacity: 0; transform: translateY(10px);
      transition: all .28s ease; pointer-events: none;
    `;
    t.innerHTML = `<i class="fa-solid ${icon}" style="color:${color};"></i> ${msg}`;
    wrap.appendChild(t);
   
    requestAnimationFrame(() => requestAnimationFrame(() => {
      t.style.opacity   = '1';
      t.style.transform = 'translateY(0)';
    }));
   
    setTimeout(() => {
      t.style.opacity   = '0';
      t.style.transform = 'translateY(10px)';
      setTimeout(() => t.remove(), 300);
    }, 2400);
  }
   
  /* ══════════════════════════════════
     8. KEYBOARD ACCESSIBILITY
  ══════════════════════════════════ */
  function initKeyboard() {
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.setAttribute('tabindex', '0');
      tab.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tab.click(); }
      });
    });
  }
   
  /* ══════════════════════════════════
     9. CARD HOVER SOUND (subtle visual pulse)
  ══════════════════════════════════ */
  function initCardHover() {
    document.querySelectorAll('.tool-card').forEach(card => {
      card.addEventListener('mouseenter', function () {
        this.style.transition = 'all 0.25s ease';
      });
    });
  }
   
  /* ══════════════════════════════════
     10. GAME LINK IN NAVBAR (inject if missing)
  ══════════════════════════════════ */
  function injectGameLink() {
    const nav = document.querySelector('#navbarNavDropdown .navbar-nav');
    if (!nav) return;
    if (nav.querySelector('[href="codegame.html"]')) return;
   
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.innerHTML = `<a class="nav-link" href="codegame.html"><i class="fa-solid fa-gamepad"></i> Code Game</a>`;
    nav.appendChild(li);
  }
   
  /* ══════════════════════════════════
     INIT
  ══════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initFilterTabs();
    initSearch();
    initCardAnimations();
    initScrollReveal();
    initBackToTop();
    initKeyboard();
    initCardHover();
    injectGameLink();
  });