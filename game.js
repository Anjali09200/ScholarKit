/* ============================================================
   game.js — Reflex Grid game logic
   ScholarAI · standalone game script for game.html
   ============================================================ */
 
   document.addEventListener('DOMContentLoaded', () => {
    initGamePage();
  });
   
  function initGamePage() {
    /* ── Guard ── */
    const grid = document.getElementById('gridContainer');
    if (!grid) return;
   
    /* ── Audio context (Web Audio API, no files needed) ── */
    let AC = null;
    function getAC() {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      return AC;
    }
    function playTone(freq, type = 'sine', dur = 0.12, vol = 0.18) {
      try {
        const ac  = getAC();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain); gain.connect(ac.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ac.currentTime);
        gain.gain.setValueAtTime(vol, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + dur);
      } catch(e) {}
    }
    function playCorrect() { playTone(660, 'sine', .1, .15); }
    function playWrong()   { playTone(140, 'sawtooth', .25, .22); }
    function playFlash(i)  {
      const freqs = [261,294,330,349,392,440,494,523,554,587,622,659,698,740,784,830];
      playTone(freqs[i % freqs.length], 'triangle', .13, .14);
    }
    function playLevelUp() {
      [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone(f,'sine',.18,.2), i*80));
    }
    function playGameOver() {
      [330,220,165,110].forEach((f,i) => setTimeout(() => playTone(f,'sawtooth',.22,.22), i*90));
    }
   
    /* ── Constants ── */
    const TILE_COUNT   = 16;
    const START_SEQ    = 3;       // initial sequence length
    const FLASH_ON     = 420;     // ms tile stays lit
    const FLASH_OFF    = 160;     // ms gap between flashes
    const INPUT_WINDOW = 4500;    // ms player has to tap each tile
   
    /* ── State ── */
    let sequence    = [];
    let playerIdx   = 0;
    let level       = 1;
    let score       = 0;
    let streak      = 0;
    let bestScore   = 0;
    let phase       = 'idle';     // idle | watching | input | result
    let inputTimer  = null;
    let inputDeadline = 0;
    let rafId       = null;
   
    try { bestScore = parseInt(localStorage.getItem('reflexgrid_best') || '0'); } catch(e) {}
    function saveBest() { try { localStorage.setItem('reflexgrid_best', bestScore); } catch(e) {} }
   
    /* ── DOM refs ── */
    const scoreEl    = document.getElementById('scoreVal');
    const levelEl    = document.getElementById('levelVal');
    const streakEl   = document.getElementById('streakVal');
    const bestEl     = document.getElementById('bestVal');
    const statusEl   = document.getElementById('statusText');
    const progFill   = document.getElementById('progressFill');
    const mainBtn    = document.getElementById('mainBtn');
    const overlayEl  = document.getElementById('overlayGame');
    const overlayBtn = document.getElementById('overlayBtn');
    const overlayBack= document.getElementById('overlayBack');
    const overlayEmoji = document.getElementById('overlayEmoji');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlaySub   = document.getElementById('overlaySub');
    const overlayStats = document.getElementById('overlayStats');
    const oScore = document.getElementById('oScore');
    const oLevel = document.getElementById('oLevel');
    const oBest  = document.getElementById('oBest');
   
    if (bestEl) bestEl.textContent = bestScore;
   
    /* ── Build tiles ── */
    const tiles = [];
    for (let i = 0; i < TILE_COUNT; i++) {
      const t = document.createElement('div');
      t.className = 'tile disabled';
      t.dataset.idx = i;
      t.innerHTML = `<span class="tile-num">${i+1}</span>`;
      t.addEventListener('click', () => onTileClick(i));
      grid.appendChild(t);
      tiles.push(t);
    }
   
    /* ── Spawn background stars ── */
    const starsBg = document.getElementById('particles-bg');
    if (starsBg) {
      for (let i = 0; i < 60; i++) {
        const s = document.createElement('div');
        s.className = 'star';
        const sz = Math.random() * 2 + 1;
        s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${2+Math.random()*4}s;--delay:${Math.random()*4}s;`;
        starsBg.appendChild(s);
      }
    }
   
    /* ════════════
       GAME FLOW
    ════════════ */
    function startGame() {
      sequence  = [];
      playerIdx = 0;
      level     = 1;
      score     = 0;
      streak    = 0;
      hideOverlay();
      updateHUD();
      extendAndPlay();
    }
   
    function extendAndPlay() {
      /* Add `level` new steps to sequence (more tiles per level) */
      const newSteps = Math.ceil(level / 2);
      for (let i = 0; i < newSteps; i++) {
        sequence.push(Math.floor(Math.random() * TILE_COUNT));
      }
      playerIdx = 0;
      phase = 'watching';
      setStatus('WATCH THE SEQUENCE', 'watching');
      disableTiles(true);
      updateProgress(0);
      mainBtn.disabled = true;
      playSequence(0);
    }
   
    function playSequence(idx) {
      if (idx >= sequence.length) {
        /* Done showing — player's turn */
        setTimeout(beginInput, 300);
        return;
      }
      const tIdx = sequence[idx];
      /* Speed scales with level: faster from level 3 onward */
      const on  = Math.max(150, FLASH_ON  - (level - 1) * 20);
      const off = Math.max(60,  FLASH_OFF - (level - 1) * 8);
   
      setTimeout(() => {
        flashTile(tIdx, on);
        playFlash(tIdx);
        setTimeout(() => playSequence(idx + 1), on + off);
      }, idx === 0 ? 400 : 0);
    }
   
    function beginInput() {
      phase = 'input';
      playerIdx = 0;
      disableTiles(false);
      setStatus('YOUR TURN — TAP THE SEQUENCE', 'your-turn');
      updateProgress(0);
      mainBtn.disabled = true;
      startInputTimer();
    }
   
    function startInputTimer() {
      clearTimeout(inputTimer);
      inputDeadline = performance.now() + INPUT_WINDOW;
      cancelAnimationFrame(rafId);
      tickProgress();
    }
   
    function tickProgress() {
      const remaining = inputDeadline - performance.now();
      const pct = Math.max(0, remaining / INPUT_WINDOW * 100);
      updateProgress(pct);
      if (pct <= 25) progFill.classList.add('danger');
      else progFill.classList.remove('danger');
   
      if (remaining <= 0) {
        handleWrong(-1);
        return;
      }
      rafId = requestAnimationFrame(tickProgress);
    }
   
    function onTileClick(idx) {
      if (phase !== 'input') return;
      cancelAnimationFrame(rafId);
   
      const expected = sequence[playerIdx];
      const tile = tiles[idx];
   
      if (idx === expected) {
        /* Correct */
        playCorrect();
        flashTileClass(tile, 'correct-hit', 220);
        burstParticles(tile, getComputedStyle(tile).getPropertyValue('--tile-color').trim() || '#00e5ff', 8);
        playerIdx++;
        streak++;
   
        if (playerIdx >= sequence.length) {
          /* Completed full sequence */
          phase = 'result';
          disableTiles(true);
          const gained = calcScore();
          score  += gained;
          if (score > bestScore) { bestScore = score; saveBest(); }
          updateHUD();
          setStatus(`PERFECT! +${gained} PTS`, 'correct');
          updateProgress(100);
          progFill.classList.remove('danger');
   
          if (streak >= 3) showCombo(`${streak}× STREAK!`);
          playLevelUp();
   
          level++;
          setTimeout(() => extendAndPlay(), 1200);
        } else {
          /* More tiles to go — reset timer */
          startInputTimer();
          updateProgress((playerIdx / sequence.length) * 100);
          updateHUD();
        }
      } else {
        /* Wrong */
        handleWrong(idx);
      }
    }
   
    function handleWrong(idx) {
      phase = 'result';
      cancelAnimationFrame(rafId);
      disableTiles(true);
      playGameOver();
   
      if (idx >= 0) {
        flashTileClass(tiles[idx], 'wrong-hit', 400);
        /* Also show correct tile */
        flashTileClass(tiles[sequence[playerIdx]], 'flash', 600);
      }
   
      shakeScreen();
      setStatus(`WRONG! SEQUENCE WAS ${sequence.length} LONG`, 'wrong');
      updateProgress(0);
      progFill.classList.remove('danger');
   
      streak = 0;
      updateHUD();
      showGameOver();
    }
   
    function calcScore() {
      const base      = sequence.length * 100;
      const speedBonus = Math.max(0, Math.floor((inputDeadline - performance.now()) / 10));
      const streakMult = streak >= 5 ? 3 : streak >= 3 ? 2 : 1;
      return (base + speedBonus) * streakMult;
    }
   
    /* ════════════
       HUD & UI
    ════════════ */
    function updateHUD() {
      if (scoreEl)  scoreEl.textContent  = score;
      if (levelEl)  levelEl.textContent  = level;
      if (streakEl) streakEl.textContent = streak;
      if (bestEl)   bestEl.textContent   = bestScore;
    }
   
    function setStatus(msg, cls = '') {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.className = 'status-text' + (cls ? ' ' + cls : '');
    }
   
    function updateProgress(pct) {
      if (progFill) progFill.style.width = pct + '%';
    }
   
    function disableTiles(off) {
      tiles.forEach(t => {
        if (off) t.classList.add('disabled');
        else     t.classList.remove('disabled');
      });
    }
   
    /* ════════════
       TILE FX
    ════════════ */
    function flashTile(idx, dur) {
      const t = tiles[idx];
      t.classList.add('flash');
      setTimeout(() => t.classList.remove('flash'), dur);
    }
   
    function flashTileClass(tile, cls, dur) {
      tile.classList.add(cls);
      setTimeout(() => tile.classList.remove(cls), dur);
    }
   
    /* ════════════
       SCREEN FX
    ════════════ */
    function shakeScreen() {
      document.body.classList.remove('shake');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => document.body.classList.add('shake'));
      });
      setTimeout(() => document.body.classList.remove('shake'), 500);
    }
   
    function showCombo(txt) {
      const el = document.createElement('div');
      el.className = 'combo-pop';
      el.textContent = txt;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 750);
    }
   
    function burstParticles(tile, color, count) {
      const rect = tile.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'burst-particle';
        const sz    = 4 + Math.random() * 5;
        const angle = (Math.PI * 2 / count) * i + Math.random() * .5;
        const dist  = 30 + Math.random() * 50;
        const tx    = Math.cos(angle) * dist;
        const ty    = Math.sin(angle) * dist;
        const dur   = (.5 + Math.random() * .4) + 's';
        p.style.cssText = `
          width:${sz}px;height:${sz}px;background:${color};
          left:${cx - sz/2}px;top:${cy - sz/2}px;
          --tx:${tx}px;--ty:${ty}px;--dur:${dur};`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1000);
      }
    }
   
    /* ════════════
       OVERLAYS
    ════════════ */
    function hideOverlay() {
      if (overlayEl) overlayEl.classList.add('hidden');
    }
   
    function showGameOver() {
      setTimeout(() => {
        if (!overlayEl) return;
        overlayEmoji.textContent = score > bestScore - (score) ? '💀' : '💀';
        overlayTitle.textContent = 'GAME OVER';
        overlaySub.textContent   = `You reached sequence length ${sequence.length} on level ${level}.`;
        overlayStats.classList.remove('hidden');
        if (oScore) oScore.textContent = score;
        if (oLevel) oLevel.textContent = level;
        if (oBest)  oBest.textContent  = bestScore;
        overlayBtn.textContent  = 'PLAY AGAIN';
        overlayBtn.className    = 'btn-main danger';
        if (overlayBack) overlayBack.style.display = 'flex';
        overlayEl.classList.remove('hidden');
      }, 1200);
    }
   
    /* ════════════════════════════
       TUTORIAL CONTROLLER
    ════════════════════════════ */
    const overlayTut  = document.getElementById('overlayTutorial');
    const tutNext     = document.getElementById('tutNext');
    const tutPrev     = document.getElementById('tutPrev');
    const tutDots     = document.querySelectorAll('.tut-dot');
    const tutStepEls  = document.querySelectorAll('.tut-step');
    let tutPage = 0;
    const TUT_PAGES = 3;
   
    /* Demo animation for step 0 */
    let demoInterval = null;
    function runDemoAnim() {
      const seqDemo = [0, 2, 1, 3];
      const dTiles  = [0,1,2,3].map(i => document.getElementById('dTile'+i));
      let di = 0;
      function flashNext() {
        dTiles.forEach(t => t && t.classList.remove('lit'));
        if (!dTiles[seqDemo[di]]) { di = 0; return; }
        dTiles[seqDemo[di]].classList.add('lit');
        const cap = document.getElementById('demoCap0');
        if (cap) cap.textContent = `Tile ${seqDemo[di]+1} lit up — remember it!`;
        di = (di + 1) % seqDemo.length;
      }
      flashNext();
      return setInterval(flashNext, 650);
    }
   
    function goTutPage(n) {
      tutPage = Math.max(0, Math.min(TUT_PAGES - 1, n));
   
      tutStepEls.forEach((s, i) => s.classList.toggle('active', i === tutPage));
      tutDots.forEach((d, i) => d.classList.toggle('active', i === tutPage));
   
      tutPrev.style.visibility = tutPage === 0 ? 'hidden' : 'visible';
      tutNext.textContent      = tutPage === TUT_PAGES - 1 ? '🎮 PLAY NOW' : 'Next →';
   
      /* Start/stop demo animation */
      clearInterval(demoInterval);
      if (tutPage === 0) demoInterval = runDemoAnim();
    }
   
    function closeTutorial() {
      clearInterval(demoInterval);
      if (overlayTut) overlayTut.classList.add('hidden');
      try { localStorage.setItem('rg_tut_seen', '1'); } catch(e) {}
    }
   
    tutNext?.addEventListener('click', () => {
      if (tutPage < TUT_PAGES - 1) {
        goTutPage(tutPage + 1);
      } else {
        closeTutorial();
        startGame();
      }
    });
    tutPrev?.addEventListener('click', () => goTutPage(tutPage - 1));
   
    /* ════════════════════════════
       HOW-TO-PLAY (re-open)
    ════════════════════════════ */
    const overlayHow = document.getElementById('overlayHow');
    const howBtn     = document.getElementById('howBtn');
    const closeHow   = document.getElementById('closeHow');
    let gameWasPaused = false;
   
    howBtn?.addEventListener('click', () => {
      if (phase === 'input' || phase === 'watching') {
        gameWasPaused = true;
        /* pause timer */
        cancelAnimationFrame(rafId);
        clearTimeout(inputTimer);
      }
      overlayHow?.classList.remove('hidden');
    });
   
    closeHow?.addEventListener('click', () => {
      overlayHow?.classList.add('hidden');
      if (gameWasPaused && phase === 'input') {
        gameWasPaused = false;
        /* resume timer from remaining time */
        inputDeadline = performance.now() + Math.max(2000, inputDeadline - performance.now());
        tickProgress();
      }
    });
   
    /* ── Game-over overlay ── */
    overlayBtn?.addEventListener('click', startGame);
   
    /* ── Main button ── */
    mainBtn?.addEventListener('click', () => {
      if (phase === 'idle') startGame();
    });
   
    /* ════════════════════════════
       INITIAL STATE
    ════════════════════════════ */
    updateHUD();
    setStatus('— PRESS START —');
    disableTiles(true);
    if (mainBtn) mainBtn.disabled = false;
   
    /* Show tutorial on first visit, skip if already seen */
    let tutSeen = false;
    try { tutSeen = !!localStorage.getItem('rg_tut_seen'); } catch(e) {}
   
    if (!tutSeen && overlayTut) {
      goTutPage(0);
    } else {
      /* Already seen — hide tutorial, show game directly */
      if (overlayTut) overlayTut.classList.add('hidden');
    }
  }