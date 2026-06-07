/* ═══════════════════════════════════════════════════════
   Code Combat — codegame.js
   Responsive canvas · Enhanced animations · Clean state
═══════════════════════════════════════════════════════ */
 
/* ─── QUESTION BANK ─── */
const QUESTIONS = [
    /* ── EASY ── */
    { diff:'easy', text:'What is the output of: console.log(typeof null)?', code:null,
      options:['object','null','undefined','string'], answer:0,
      explain:'"typeof null" returns "object" — a known JavaScript quirk.' },
   
    { diff:'easy', text:'Which keyword declares a block-scoped variable in JS?', code:null,
      options:['var','let','const','function'], answer:1,
      explain:'"let" is block-scoped. "var" is function-scoped.' },
   
    { diff:'easy', text:'What does this return?', code:'[1,2,3].length',
      options:['2','3','4','undefined'], answer:1,
      explain:'Arrays are 0-indexed; .length returns the count of elements.' },
   
    { diff:'easy', text:'Which HTML tag is used for the largest heading?', code:null,
      options:['<h6>','<h1>','<head>','<header>'], answer:1,
      explain:'<h1> is the highest-level heading tag in HTML.' },
   
    { diff:'easy', text:'What does CSS stand for?', code:null,
      options:['Creative Style Sheets','Cascading Style Sheets','Computer Style Sheets','Colorful Style Sheets'], answer:1,
      explain:'CSS = Cascading Style Sheets.' },
   
    { diff:'easy', text:'What is the correct way to write a Python comment?', code:null,
      options:['// comment','/* comment */','# comment','-- comment'], answer:2,
      explain:'Python uses # for single-line comments.' },
   
    { diff:'easy', text:'What value does this produce?', code:'Boolean("")',
      options:['true','false','null','undefined'], answer:1,
      explain:'Empty string is falsy in JavaScript.' },
   
    { diff:'easy', text:'Which is NOT a primitive type in JavaScript?', code:null,
      options:['string','number','object','boolean'], answer:2,
      explain:'Object is a reference type, not a primitive.' },
   
    { diff:'easy', text:'What does HTML stand for?', code:null,
      options:['Hyperlink Text Markup Language','HyperText Markup Language','Home Tool Markup Language','Hyper Transfer Markup Language'], answer:1,
      explain:'HTML = HyperText Markup Language.' },
   
    { diff:'easy', text:'Which method adds an element to the END of an array?', code:null,
      options:['unshift()','shift()','push()','pop()'], answer:2,
      explain:'push() appends to the end; unshift() prepends to the start.' },
   
    /* ── MEDIUM ── */
    { diff:'medium', text:'What does this output?', code:`let x = 5;\nconsole.log(x++ + ++x);`,
      options:['11','12','10','13'], answer:1,
      explain:'x++ returns 5 then x=6; ++x makes x=7; 5+7=12.' },
   
    { diff:'medium', text:'What is the time complexity of binary search?', code:null,
      options:['O(n)','O(n²)','O(log n)','O(1)'], answer:2,
      explain:'Binary search halves the search space each step → O(log n).' },
   
    { diff:'medium', text:'What will this print?', code:`def f(a, b=[]):\n    b.append(a)\n    return b\nprint(f(1))\nprint(f(2))`,
      options:['[1] then [2]','[1] then [1,2]','[1,2] then [2]','Error'], answer:1,
      explain:'Default mutable args in Python are shared across calls — a classic gotcha!' },
   
    { diff:'medium', text:'Which array method does NOT mutate the original array?', code:null,
      options:['push()','splice()','map()','sort()'], answer:2,
      explain:'.map() returns a new array and leaves the original unchanged.' },
   
    { diff:'medium', text:'What does this evaluate to?', code:'console.log(0.1 + 0.2 === 0.3)',
      options:['true','false','NaN','TypeError'], answer:1,
      explain:'Floating point precision makes 0.1+0.2 = 0.30000000000000004, not 0.3.' },
   
    { diff:'medium', text:'What is a closure in JavaScript?', code:null,
      options:['A loop that closes itself','A function with access to its outer scope','An arrow function','A try-catch block'], answer:1,
      explain:'A closure is a function that retains access to variables from its enclosing lexical scope.' },
   
    { diff:'medium', text:'What does this return?', code:'"hello".split("").reverse().join("")',
      options:['hello','olleh','Error','undefined'], answer:1,
      explain:'split → chars array, reverse → reversed, join → "olleh".' },
   
    { diff:'medium', text:'What is the output?', code:`console.log(1 + "2" + 3)`,
      options:['6','123','15','NaN'], answer:1,
      explain:'JS coerces left-to-right: 1+"2"="12", then "12"+3="123".' },
   
    /* ── HARD ── */
    { diff:'hard', text:'What is the output?', code:`const obj = {a:1};\nconst copy = Object.assign({}, obj);\ncopy.a = 99;\nconsole.log(obj.a);`,
      options:['99','1','undefined','Error'], answer:1,
      explain:'Object.assign does a shallow copy — primitives are copied by value, so obj.a stays 1.' },
   
    { diff:'hard', text:'Which sorting algorithm has the best average-case time complexity?', code:null,
      options:['Bubble Sort','Insertion Sort','Merge Sort','Quick Sort'], answer:3,
      explain:'Quick Sort averages O(n log n) with excellent cache performance in practice.' },
   
    { diff:'hard', text:'What does this print?', code:`async function go() {\n  return 1;\n}\nconsole.log(go());`,
      options:['1','Promise {<fulfilled>: 1}','undefined','Error'], answer:1,
      explain:'Async functions always return a Promise, even when returning a plain value.' },
   
    { diff:'hard', text:'What is the space complexity of DFS on a graph with V vertices?', code:null,
      options:['O(1)','O(V)','O(V²)','O(log V)'], answer:1,
      explain:'DFS uses a stack that can hold at most V frames → O(V).' },
   
    { diff:'hard', text:'What does this output?', code:"console.log([...'hello'].length)",
      options:['1','5','undefined','Error'], answer:1,
      explain:'Spread on a string gives individual chars → array of 5, length 5.' },
   
    { diff:'hard', text:'What pattern does this implement?', code:`class DB {\n  static #inst = null;\n  static get() {\n    if (!DB.#inst) DB.#inst = new DB();\n    return DB.#inst;\n  }\n}`,
      options:['Factory','Observer','Singleton','Prototype'], answer:2,
      explain:'One private static instance, lazy-initialised — that is the Singleton pattern.' },
   
    { diff:'hard', text:'What does the "??" operator do in JavaScript?', code:null,
      options:['Logical OR fallback','Nullish coalescing — returns right side if left is null/undefined','Optional chaining','Strict equality'], answer:1,
      explain:'"??" returns the right operand only when the left is null or undefined (not just falsy).' },
  ];
   
  /* ─── DIFFICULTY CONFIG ─── */
  const DIFF_CONFIG = {
    easy:   { totalRounds:3, qPerRound:3, timerSec:18, monHp:40,  heroHp:100, monDmg:22, heroDmg:35, scoreBonus:80  },
    medium: { totalRounds:4, qPerRound:4, timerSec:15, monHp:60,  heroHp:100, monDmg:28, heroDmg:28, scoreBonus:120 },
    hard:   { totalRounds:5, qPerRound:5, timerSec:12, monHp:80,  heroHp:100, monDmg:34, heroDmg:22, scoreBonus:180 },
  };
   
  /* ─── STATE ─── */
  let cfg, state, timerInterval, animFrame;
   
  /* ─── CANVAS SETUP (RESPONSIVE) ─── */
  const canvas = document.getElementById('arenaCanvas');
  const ctx    = canvas.getContext('2d');
  let W = 860, H = 260;
   
  function resizeCanvas() {
    const container = canvas.parentElement;
    const ratio     = window.devicePixelRatio || 1;
    const cssW      = container.clientWidth;
    const cssH      = Math.round(cssW * (260 / 860)); // keep aspect ratio
   
    canvas.width  = cssW * ratio;
    canvas.height = cssH * ratio;
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';
   
    W = canvas.width;
    H = canvas.height;
   
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transforms
  }
   
  window.addEventListener('resize', () => {
    resizeCanvas();
  });
   
  resizeCanvas();
   
  /* ─── SPRITE DATA ─── */
  const hero = { x:0, y:0, w:60, h:70, action:'idle', actionTimer:0, frame:0 };
  const mon  = { x:0, y:0, w:70, h:80, action:'idle', actionTimer:0, frame:0 };
  const particles = [];
  const dmgTexts  = [];
   
  function repositionSprites() {
    hero.x = W * 0.09;
    mon.x  = W * 0.82;
  }
   
  /* ─── INIT ─── */
  function initGame(difficulty) {
    cfg   = DIFF_CONFIG[difficulty];
    state = {
      difficulty,
      round     : 1,
      score     : 0,
      heroHp    : cfg.heroHp,
      monHp     : cfg.monHp,
      maxMonHp  : cfg.monHp,
      maxHeroHp : cfg.heroHp,
      qIndex    : 0,
      qSet      : [],
      answered  : false,
      running   : true,
      best      : parseInt(localStorage.getItem('codecombat_best') || '0'),
    };
   
    buildQuestionSet();
    updateHUD();
    buildRoundDots();
    hideAllOverlays();
   
    document.getElementById('questionPanel').style.display = '';
    document.getElementById('cgFeedback').className = 'cg-feedback hidden';
   
    repositionSprites();
    hero.action = 'idle';
    mon.action  = 'idle';
    particles.length = 0;
    dmgTexts.length  = 0;
   
    cancelAnimationFrame(animFrame);
    drawLoop();
    renderCurrentQuestion();
  }
   
  /* ─── QUESTION SET ─── */
  function buildQuestionSet() {
    const pool = QUESTIONS.filter(q =>
      state.difficulty === 'easy'   ? q.diff === 'easy' :
      state.difficulty === 'medium' ? q.diff !== 'hard' : true
    );
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    state.qSet  = shuffled.slice(0, cfg.qPerRound);
    state.qIndex = 0;
  }
   
  /* ─── RENDER QUESTION ─── */
  function renderCurrentQuestion() {
    clearInterval(timerInterval);
   
    if (state.qIndex >= state.qSet.length) {
      roundClear();
      return;
    }
   
    const q = state.qSet[state.qIndex];
    state.answered = false;
   
    const badge = document.getElementById('qDiff');
    badge.textContent = q.diff.charAt(0).toUpperCase() + q.diff.slice(1);
    badge.className   = `q-badge ${q.diff}`;
   
    document.getElementById('qText').textContent = q.text;
   
    const codeEl = document.getElementById('qCode');
    if (q.code) { codeEl.textContent = q.code; codeEl.style.display = ''; }
    else        { codeEl.style.display = 'none'; }
   
    /* Options */
    const optsEl = document.getElementById('qOptions');
    optsEl.innerHTML = '';
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className   = 'q-opt';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleAnswer(i));
      optsEl.appendChild(btn);
    });
   
    updateRoundDots();
   
    /* Timer */
    let timeLeft = cfg.timerSec;
    const timerEl   = document.getElementById('qTimerVal');
    const timerWrap = document.getElementById('qTimer');
    timerEl.textContent = timeLeft;
    timerWrap.className = 'q-timer';
   
    timerInterval = setInterval(() => {
      timeLeft--;
      timerEl.textContent = timeLeft;
      if (timeLeft <= 5) timerWrap.className = 'q-timer danger';
      if (timeLeft <= 0) { clearInterval(timerInterval); handleAnswer(-1); }
    }, 1000);
   
    document.getElementById('cgFeedback').className = 'cg-feedback hidden';
   
    /* Re-animate question panel */
    const qp = document.getElementById('questionPanel');
    qp.style.animation = 'none';
    void qp.offsetWidth;
    qp.style.animation = '';
  }
   
  /* ─── HANDLE ANSWER ─── */
  function handleAnswer(chosen) {
    if (state.answered) return;
    state.answered = true;
    clearInterval(timerInterval);
   
    const q    = state.qSet[state.qIndex];
    const opts = document.querySelectorAll('.q-opt');
    opts.forEach(b => b.disabled = true);
   
    const correct = chosen === q.answer;
   
    if (chosen >= 0) opts[chosen].classList.add(correct ? 'correct' : 'wrong');
    opts[q.answer].classList.add('correct');
   
    const fb = document.getElementById('cgFeedback');
    if (correct) {
      fb.className = 'cg-feedback correct';
      fb.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Correct! ${q.explain}</span>`;
      attackMonster();
    } else {
      fb.className = 'cg-feedback wrong';
      const got = chosen >= 0
        ? `You chose <strong>${q.options[chosen]}</strong>. `
        : 'Time ran out! ';
      fb.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <span>${got}${q.explain}</span>`;
      monsterAttacks();
    }
   
    setTimeout(() => {
      state.qIndex++;
      renderCurrentQuestion();
    }, 2400);
  }
   
  /* ─── ATTACK MONSTER ─── */
  function attackMonster() {
    hero.action = 'attack'; hero.actionTimer = 45;
   
    const dmg    = cfg.heroDmg + Math.floor(Math.random() * 12);
    state.monHp  = Math.max(0, state.monHp - dmg);
    state.score += cfg.scoreBonus;
   
    mon.action = 'hurt'; mon.actionTimer = 28;
   
    spawnDmgText(mon.x - 10, H * 0.72 - mon.h - 20, `-${dmg}`, '#f87171');
    spawnDmgText(hero.x + 10, H * 0.72 - hero.h - 20, `+${cfg.scoreBonus}`, '#4ade80');
    spawnParticles(mon.x + mon.w * 0.5, H * 0.72 - mon.h * 0.5, '#f87171', 12);
   
    if (state.monHp <= 0) {
      spawnParticles(mon.x + mon.w * 0.5, H * 0.72 - mon.h * 0.5, '#fbbf24', 18);
    }
   
    updateHUD();
  }
   
  /* ─── MONSTER ATTACKS ─── */
  function monsterAttacks() {
    mon.action = 'attack'; mon.actionTimer = 45;
   
    const dmg    = cfg.monDmg + Math.floor(Math.random() * 10);
    state.heroHp = Math.max(0, state.heroHp - dmg);
   
    hero.action = 'hurt'; hero.actionTimer = 28;
   
    spawnDmgText(hero.x - 10, H * 0.72 - hero.h - 20, `-${dmg}`, '#f87171');
    spawnParticles(hero.x + hero.w * 0.5, H * 0.72 - hero.h * 0.5, '#a78bfa', 10);
   
    updateHUD();
   
    if (state.heroHp <= 0) setTimeout(gameOver, 1400);
  }
   
  /* ─── ROUND CLEAR ─── */
  function roundClear() {
    clearInterval(timerInterval);
   
    if (state.monHp > 0) state.score = Math.max(0, state.score - 20);
   
    if (state.round >= cfg.totalRounds) {
      setTimeout(victory, 900);
      return;
    }
   
    document.getElementById('ovRoundEmoji').textContent  = state.monHp <= 0 ? '💀' : '⚔️';
    document.getElementById('ovRoundTitle').textContent  = state.monHp <= 0 ? 'Monster Defeated!' : 'Round Complete!';
    document.getElementById('ovRoundSub').textContent    = `Round ${state.round} done. Prepare for round ${state.round + 1}!`;
   
    spawnParticles(W / 2, H / 2, '#fbbf24', 22);
    document.getElementById('ovRound').classList.remove('hidden');
    document.getElementById('questionPanel').style.display = 'none';
    document.getElementById('cgFeedback').className = 'cg-feedback hidden';
  }
   
  /* ─── NEXT ROUND ─── */
  function nextRound() {
    state.round++;
    state.monHp    = Math.round(cfg.monHp * (1 + (state.round - 1) * 0.25));
    state.maxMonHp = state.monHp;
   
    buildQuestionSet();
    updateHUD();
    buildRoundDots();
    hideAllOverlays();
   
    document.getElementById('questionPanel').style.display = '';
    document.getElementById('cgFeedback').className = 'cg-feedback hidden';
   
    hero.action = 'walk'; hero.actionTimer = 35;
    mon.action  = 'idle';
   
    renderCurrentQuestion();
  }
   
  /* ─── GAME OVER ─── */
  function gameOver() {
    clearInterval(timerInterval);
    document.getElementById('questionPanel').style.display = 'none';
    document.getElementById('cgFeedback').className = 'cg-feedback hidden';
    document.getElementById('ovScore').textContent = state.score;
    document.getElementById('ovRound').textContent = state.round;
    document.getElementById('ovOver').classList.remove('hidden');
  }
   
  /* ─── VICTORY ─── */
  function victory() {
    clearInterval(timerInterval);
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem('codecombat_best', state.best);
    }
    document.getElementById('questionPanel').style.display = 'none';
    document.getElementById('cgFeedback').className = 'cg-feedback hidden';
    document.getElementById('ovWinScore').textContent = state.score;
    document.getElementById('ovWinBest').textContent  = state.best;
    document.getElementById('ovWin').classList.remove('hidden');
    spawnParticles(W / 2, H / 2, '#fbbf24', 35);
    spawnParticles(W / 3, H / 2, '#93c5fd', 20);
    spawnParticles(W * 2/3, H / 2, '#a78bfa', 20);
  }
   
  /* ─── HUD ─── */
  function updateHUD() {
    document.getElementById('heroHpVal').textContent = state.heroHp;
    document.getElementById('monHpVal').textContent  = state.monHp;
    document.getElementById('roundVal').textContent  = state.round;
    document.getElementById('scoreVal').textContent  = state.score;
   
    const hPct = state.heroHp / state.maxHeroHp * 100;
    const mPct = state.monHp  / state.maxMonHp  * 100;
   
    const hBar = document.getElementById('heroHpBar');
    hBar.style.width = hPct + '%';
    hBar.className   = 'hp-bar ' + (hPct > 50 ? 'green' : hPct > 25 ? 'yellow' : '');
   
    document.getElementById('monHpBar').style.width = mPct + '%';
  }
   
  /* ─── ROUND DOTS ─── */
  function buildRoundDots() {
    const el = document.getElementById('roundDots');
    el.innerHTML = '';
    for (let i = 0; i < cfg.qPerRound; i++) {
      const d = document.createElement('div');
      d.className = 'rp-dot' + (i === 0 ? ' current' : '');
      d.id = `rpdot-${i}`;
      el.appendChild(d);
    }
  }
   
  function updateRoundDots() {
    for (let i = 0; i < cfg.qPerRound; i++) {
      const d = document.getElementById(`rpdot-${i}`);
      if (!d) continue;
      if      (i < state.qIndex)       d.className = 'rp-dot done';
      else if (i === state.qIndex)     d.className = 'rp-dot current';
      else                             d.className = 'rp-dot';
    }
  }
   
  /* ─── OVERLAYS ─── */
  function hideAllOverlays() {
    ['ovStart','ovRound','ovOver','ovWin'].forEach(id => {
      document.getElementById(id).classList.add('hidden');
    });
  }
   
  /* ═══════════════════════════════════
     CANVAS RENDERING — DRAW LOOP
  ═══════════════════════════════════ */
   
  function drawLoop() {
    repositionSprites();
    ctx.clearRect(0, 0, W, H);
    drawArenaBackground();
    drawGround();
    updateAndDrawParticles();
    drawHero();
    drawMonster();
    drawDmgTexts();
   
    if (hero.actionTimer > 0) { hero.actionTimer--; if (hero.actionTimer === 0) hero.action = 'idle'; }
    if (mon.actionTimer  > 0) { mon.actionTimer--;  if (mon.actionTimer  === 0) mon.action  = 'idle'; }
   
    animFrame = requestAnimationFrame(drawLoop);
  }
   
  /* ─── ARENA BACKGROUND ─── */
  function drawArenaBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#020b18');
    sky.addColorStop(1, '#0d1f35');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
   
    /* Grid lines */
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += W / 22) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
   
    /* Stars */
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const starPositions = [
      [.09,.12],[.23,.19],[.41,.08],[.58,.17],[.76,.10],
      [.87,.21],[.95,.06],[.14,.27],[.49,.31],[.70,.23],[.82,.14],
    ];
    starPositions.forEach(([rx, ry]) => {
      ctx.beginPath();
      ctx.arc(rx * W, ry * H, 1.2 * (W / 860), 0, Math.PI * 2);
      ctx.fill();
    });
   
    /* Floating sparkles using time */
    const t  = Date.now() / 1800;
    const sp = [[.25,.45],[.55,.38],[.75,.42],[.90,.35]];
    sp.forEach(([rx, ry], i) => {
      const alpha = 0.3 + 0.3 * Math.sin(t + i * 1.2);
      ctx.fillStyle = `rgba(147,197,253,${alpha})`;
      ctx.beginPath();
      ctx.arc(rx * W, ry * H, 1.5 * (W / 860), 0, Math.PI * 2);
      ctx.fill();
    });
  }
   
  /* ─── GROUND ─── */
  function drawGround() {
    const groundY = H * 0.72;
    const grd = ctx.createLinearGradient(0, groundY, 0, H);
    grd.addColorStop(0, 'rgba(24,95,165,0.25)');
    grd.addColorStop(1, 'rgba(2,11,24,0.8)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, groundY, W, H - groundY);
   
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.strokeStyle = 'rgba(147,197,253,0.3)';
    ctx.lineWidth   = 2 * (W / 860);
    ctx.shadowColor = '#93c5fd';
    ctx.shadowBlur  = 8 * (W / 860);
    ctx.stroke();
    ctx.shadowBlur  = 0;
  }
   
  /* ─── SCALE HELPER ─── */
  // Everything is drawn relative to a virtual 860×260 canvas, then scaled
  function sc(v) { return v * (W / 860); }
   
  /* ─── HERO ─── */
  function drawHero() {
    const gY = H * 0.72;
    const hw = sc(60), hh = sc(70);
    const bx = hero.x, by = gY - hh;
   
    let offX = 0, offY = 0;
    const t = Date.now() / 300;
   
    if (hero.action === 'idle')   { offY = Math.sin(t) * sc(2); }
    if (hero.action === 'attack') { offX = sc(12) * Math.sin(hero.actionTimer / 45 * Math.PI); }
    if (hero.action === 'hurt')   {
      offX = sc(-6) * Math.sin(hero.actionTimer / 28 * Math.PI * 3);
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(hero.actionTimer * 0.6);
    }
    if (hero.action === 'walk')   { offX = Math.sin(t * 4) * sc(3); }
   
    const bxo = bx + offX, byo = by + offY;
    const cx  = bxo + hw / 2;
   
    /* Shadow */
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, gY + sc(4), sc(22), sc(6), 0, 0, Math.PI * 2);
    ctx.fill();
   
    /* Body */
    ctx.fillStyle = '#2563eb';
    rrect(bxo + sc(12), byo + sc(28), sc(36), sc(36), sc(8));
    ctx.fill();
   
    /* Cape */
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.moveTo(bxo + sc(12), byo + sc(28));
    ctx.lineTo(bxo - sc(4),  byo + sc(55));
    ctx.lineTo(bxo + sc(14), byo + sc(42));
    ctx.closePath(); ctx.fill();
   
    /* Head */
    const headGrd = ctx.createRadialGradient(cx, byo + sc(14), sc(2), cx, byo + sc(16), sc(14));
    headGrd.addColorStop(0, '#fde68a'); headGrd.addColorStop(1, '#f59e0b');
    ctx.fillStyle = headGrd;
    ctx.beginPath(); ctx.arc(cx, byo + sc(16), sc(14), 0, Math.PI * 2); ctx.fill();
   
    /* Helmet */
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath(); ctx.arc(cx, byo + sc(16), sc(14), Math.PI, 0);
    ctx.rect(bxo + sc(16), byo + sc(10), sc(28), sc(8));
    ctx.fill();
   
    /* Visor glow */
    ctx.fillStyle = '#93c5fd';
    ctx.shadowColor = '#93c5fd'; ctx.shadowBlur = sc(6);
    ctx.fillRect(bxo + sc(22), byo + sc(14), sc(16), sc(5));
    ctx.shadowBlur = 0;
   
    /* Sword */
    ctx.save();
    ctx.translate(bxo + sc(48), byo + sc(38));
    if (hero.action === 'attack') {
      ctx.rotate(-Math.PI / 4 + (1 - hero.actionTimer / 45) * Math.PI / 2);
    } else {
      ctx.rotate(Math.PI / 8);
    }
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(sc(-3), sc(-22), sc(6), sc(26));
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(sc(-8), sc(4), sc(16), sc(5));
    ctx.restore();
   
    /* Legs */
    ctx.fillStyle = '#1e3a8a';
    const legOff = hero.action === 'walk' ? Math.sin(t * 5) * sc(6) : 0;
    ctx.fillRect(bxo + sc(14), byo + sc(58), sc(12), sc(16));
    ctx.fillRect(bxo + sc(30), byo + sc(58) + legOff, sc(12), sc(16) - Math.abs(legOff));
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(bxo + sc(13), byo + sc(72), sc(14), sc(6));
    ctx.fillRect(bxo + sc(29), byo + sc(72), sc(14), sc(6));
   
    ctx.globalAlpha = 1;
  }
   
  /* ─── MONSTER ROUTER ─── */
  function drawMonster() {
    const round    = state ? state.round : 1;
    const monsters = [drawSlime, drawGolem, drawDragon, drawSpectre, drawBoss];
    monsters[Math.min(round - 1, monsters.length - 1)]();
  }
   
  /* ─── SLIME ─── */
  function drawSlime() {
    const gY = H * 0.72;
    const cx = mon.x + sc(35);
    const t  = Date.now() / 400;
    let offY = 0, offX = 0;
   
    if (mon.action === 'idle')   offY = Math.abs(Math.sin(t)) * -sc(4);
    if (mon.action === 'attack') offX = -sc(10) * Math.sin(mon.actionTimer / 45 * Math.PI);
    if (mon.action === 'hurt')   { offX = sc(6) * Math.sin(mon.actionTimer / 28 * Math.PI * 3); ctx.globalAlpha = 0.55; }
   
    const baseY = gY - sc(50) + offY;
   
    ctx.shadowColor = '#4ade80'; ctx.shadowBlur = sc(20);
    const grad = ctx.createRadialGradient(cx + offX, baseY - sc(5), sc(5), cx + offX, baseY, sc(36));
    grad.addColorStop(0, '#86efac'); grad.addColorStop(1, '#16a34a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx + offX, baseY, sc(36), sc(44), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
   
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx + offX - sc(12), baseY - sc(12), sc(8), 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + offX + sc(12), baseY - sc(12), sc(8), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(cx + offX - sc(11), baseY - sc(12), sc(4), 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + offX + sc(13), baseY - sc(12), sc(4), 0, Math.PI * 2); ctx.fill();
   
    ctx.strokeStyle = '#15803d'; ctx.lineWidth = sc(3);
    ctx.beginPath(); ctx.arc(cx + offX, baseY + sc(8), sc(14), 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
   
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx + offX, gY - sc(4), sc(30), sc(7), 0, 0, Math.PI * 2); ctx.fill();
   
    ctx.globalAlpha = 1;
  }
   
  /* ─── GOLEM ─── */
  function drawGolem() {
    const gY = H * 0.72;
    const bx = mon.x, by = gY - sc(80);
    let offX = 0;
    const t = Date.now() / 500;
   
    if (mon.action === 'attack') offX = -sc(14) * Math.sin(mon.actionTimer / 45 * Math.PI);
    if (mon.action === 'hurt')   { offX = sc(8) * Math.sin(mon.actionTimer / 28 * Math.PI * 3); ctx.globalAlpha = 0.6; }
    if (mon.action === 'idle')   offX = Math.sin(t) * sc(1.5);
   
    ctx.shadowColor = '#f87171'; ctx.shadowBlur = sc(16);
   
    ctx.fillStyle = '#7f1d1d';
    rrect(bx + sc(8) + offX, by + sc(24), sc(54), sc(56), sc(10)); ctx.fill();
   
    const hg = ctx.createRadialGradient(bx+sc(35)+offX, by+sc(14), sc(4), bx+sc(35)+offX, by+sc(18), sc(20));
    hg.addColorStop(0,'#ef4444'); hg.addColorStop(1,'#7f1d1d');
    ctx.fillStyle = hg;
    rrect(bx+sc(15)+offX, by+sc(2), sc(40), sc(36), sc(8)); ctx.fill();
   
    ctx.fillStyle = '#fef08a'; ctx.shadowColor='#fef08a'; ctx.shadowBlur=sc(10);
    ctx.beginPath(); ctx.arc(bx+sc(26)+offX, by+sc(18), sc(7), 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx+sc(44)+offX, by+sc(18), sc(7), 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#422006';
    ctx.beginPath(); ctx.arc(bx+sc(27)+offX, by+sc(18), sc(3), 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx+sc(45)+offX, by+sc(18), sc(3), 0, Math.PI*2); ctx.fill();
   
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(bx-sc(4)+offX, by+sc(28), sc(14), sc(38));
    ctx.fillRect(bx+sc(60)+offX, by+sc(28), sc(14), sc(38));
    ctx.fillRect(bx+sc(14)+offX, by+sc(76), sc(16), sc(24));
    ctx.fillRect(bx+sc(40)+offX, by+sc(76), sc(16), sc(24));
   
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(bx+sc(35)+offX, gY-sc(4), sc(34), sc(7), 0, 0, Math.PI*2); ctx.fill();
   
    ctx.shadowBlur=0; ctx.globalAlpha=1;
  }
   
  /* ─── DRAGON ─── */
  function drawDragon() {
    const gY = H * 0.72;
    const cx = mon.x + sc(35), cy = gY - sc(70);
    let offX = 0, offY = 0;
    const t = Date.now() / 350;
   
    if (mon.action === 'attack') offX = -sc(18) * Math.sin(mon.actionTimer / 45 * Math.PI);
    if (mon.action === 'hurt')   { offX = sc(10) * Math.sin(mon.actionTimer / 28 * Math.PI * 3); ctx.globalAlpha = 0.6; }
    if (mon.action === 'idle')   { offY = Math.sin(t) * sc(3); offX += Math.cos(t * 0.5) * sc(2); }
   
    ctx.shadowColor = '#c084fc'; ctx.shadowBlur = sc(22);
   
    ctx.fillStyle = 'rgba(168,85,247,0.4)';
    ctx.beginPath(); ctx.moveTo(cx+offX, cy+offY);
    ctx.lineTo(cx-sc(60)+offX, cy-sc(30)+offY); ctx.lineTo(cx-sc(40)+offX, cy+sc(20)+offY);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+offX, cy+offY);
    ctx.lineTo(cx+sc(60)+offX, cy-sc(30)+offY); ctx.lineTo(cx+sc(40)+offX, cy+sc(20)+offY);
    ctx.closePath(); ctx.fill();
   
    const bg = ctx.createRadialGradient(cx+offX, cy+offY, sc(6), cx+offX, cy+offY, sc(38));
    bg.addColorStop(0,'#c084fc'); bg.addColorStop(1,'#6b21a8');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(cx+offX, cy+sc(30)+offY, sc(28), sc(38), 0, 0, Math.PI*2); ctx.fill();
   
    ctx.fillStyle='#7e22ce';
    ctx.beginPath(); ctx.ellipse(cx+offX+sc(14), cy-sc(10)+offY, sc(22), sc(18), 0.3, 0, Math.PI*2); ctx.fill();
   
    ctx.fillStyle='#fbbf24';
    ctx.beginPath(); ctx.moveTo(cx+offX+sc(10), cy-sc(24)+offY); ctx.lineTo(cx+offX+sc(6), cy-sc(44)+offY); ctx.lineTo(cx+offX+sc(18), cy-sc(22)+offY); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+offX+sc(24), cy-sc(20)+offY); ctx.lineTo(cx+offX+sc(32), cy-sc(38)+offY); ctx.lineTo(cx+offX+sc(30), cy-sc(18)+offY); ctx.closePath(); ctx.fill();
   
    ctx.fillStyle='#fde68a'; ctx.shadowColor='#fde68a'; ctx.shadowBlur=sc(12);
    ctx.beginPath(); ctx.arc(cx+offX+sc(8),  cy-sc(10)+offY, sc(6), 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+offX+sc(22), cy-sc(10)+offY, sc(6), 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#1c1917';
    ctx.beginPath(); ctx.arc(cx+offX+sc(9),  cy-sc(10)+offY, sc(3), 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+offX+sc(23), cy-sc(10)+offY, sc(3), 0, Math.PI*2); ctx.fill();
   
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx+offX, gY-sc(4), sc(32), sc(8), 0, 0, Math.PI*2); ctx.fill();
   
    ctx.shadowBlur=0; ctx.globalAlpha=1;
  }
   
  /* ─── SPECTRE ─── */
  function drawSpectre() {
    const gY = H * 0.72;
    const cx = mon.x + sc(35);
    const t  = Date.now() / 400;
    let offX = 0, offY = Math.sin(t) * sc(6);
   
    if (mon.action === 'attack') offX = -sc(16) * Math.sin(mon.actionTimer / 45 * Math.PI);
    if (mon.action === 'hurt')   { ctx.globalAlpha = 0.5; offX = sc(8) * Math.sin(mon.actionTimer / 28 * Math.PI * 3); }
   
    const cy = gY - sc(70) + offY;
   
    ctx.shadowColor = '#818cf8'; ctx.shadowBlur = sc(28);
    const gg = ctx.createRadialGradient(cx+offX, cy, sc(10), cx+offX, cy+sc(30), sc(55));
    gg.addColorStop(0, 'rgba(199,210,254,0.85)');
    gg.addColorStop(0.5, 'rgba(129,140,248,0.6)');
    gg.addColorStop(1, 'rgba(67,56,202,0)');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.moveTo(cx+offX - sc(36), cy+sc(70));
    for (let i = -36; i <= 36; i += 6) {
      ctx.lineTo(cx+offX+sc(i), cy+sc(70) + Math.sin((i + t * 10) * 0.3) * sc(8));
    }
    ctx.lineTo(cx+offX+sc(36), cy);
    ctx.arc(cx+offX, cy, sc(36), 0, Math.PI, true);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
   
    ctx.fillStyle='#fff'; ctx.shadowColor='#fff'; ctx.shadowBlur=sc(10);
    ctx.beginPath(); ctx.ellipse(cx+offX-sc(12), cy-sc(4), sc(9), sc(12), 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+offX+sc(12), cy-sc(4), sc(9), sc(12), 0, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#312e81';
    ctx.beginPath(); ctx.ellipse(cx+offX-sc(12), cy-sc(2), sc(5), sc(7), 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+offX+sc(12), cy-sc(2), sc(5), sc(7), 0, 0, Math.PI*2); ctx.fill();
   
    ctx.globalAlpha = 1;
  }
   
  /* ─── BOSS ─── */
  function drawBoss() {
    const gY = H * 0.72;
    const bx = mon.x - sc(10), by = gY - sc(100);
    let offX = 0;
    const t = Date.now() / 300;
   
    if (mon.action === 'attack') offX = -sc(20) * Math.sin(mon.actionTimer / 45 * Math.PI);
    if (mon.action === 'hurt')   { ctx.globalAlpha=0.55; offX = sc(10) * Math.sin(mon.actionTimer / 28 * Math.PI * 3); }
    if (mon.action === 'idle')   offX = Math.sin(t) * sc(2);
   
    ctx.shadowColor='#dc2626'; ctx.shadowBlur=sc(28);
   
    const bg = ctx.createLinearGradient(bx+offX, by, bx+offX+sc(80), by+sc(100));
    bg.addColorStop(0,'#7f1d1d'); bg.addColorStop(1,'#dc2626');
    ctx.fillStyle=bg; rrect(bx+sc(4)+offX, by+sc(30), sc(72), sc(70), sc(14)); ctx.fill();
   
    const hg = ctx.createRadialGradient(bx+sc(40)+offX, by+sc(14), sc(4), bx+sc(40)+offX, by+sc(18), sc(28));
    hg.addColorStop(0,'#f87171'); hg.addColorStop(1,'#991b1b');
    ctx.fillStyle=hg; rrect(bx+sc(10)+offX, by, sc(60), sc(48), sc(12)); ctx.fill();
   
    ctx.fillStyle='#fbbf24';
    [0,15,30,45,60].forEach((xi, i) => {
      const h2 = [18,10,20,10,18][i];
      ctx.fillRect(bx+sc(10+xi)+offX, by-sc(h2), sc(10), sc(h2+4));
    });
    ['#f87171','#4ade80','#93c5fd','#f87171','#a78bfa'].forEach((col, i) => {
      ctx.fillStyle=col; ctx.beginPath(); ctx.arc(bx+sc(15+i*15)+offX, by-sc(6), sc(4), 0, Math.PI*2); ctx.fill();
    });
   
    ctx.fillStyle='#fff'; ctx.shadowColor='#fde68a'; ctx.shadowBlur=sc(14);
    ctx.beginPath(); ctx.arc(bx+sc(26)+offX, by+sc(22), sc(10), 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx+sc(54)+offX, by+sc(22), sc(10), 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#1c1917';
    ctx.beginPath(); ctx.arc(bx+sc(27)+offX, by+sc(22), sc(5), 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx+sc(55)+offX, by+sc(22), sc(5), 0, Math.PI*2); ctx.fill();
   
    ctx.fillStyle='#991b1b';
    ctx.fillRect(bx-sc(10)+offX, by+sc(38), sc(16), sc(48));
    ctx.fillRect(bx+sc(74)+offX, by+sc(38), sc(16), sc(48));
    ctx.beginPath(); ctx.arc(bx-sc(2)+offX, by+sc(88), sc(10), 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx+sc(82)+offX, by+sc(88), sc(10), 0, Math.PI*2); ctx.fill();
    ctx.fillRect(bx+sc(14)+offX, by+sc(96), sc(20), sc(28));
    ctx.fillRect(bx+sc(46)+offX, by+sc(96), sc(20), sc(28));
    ctx.fillStyle='#7f1d1d';
    ctx.fillRect(bx+sc(10)+offX, by+sc(120), sc(26), sc(8));
    ctx.fillRect(bx+sc(44)+offX, by+sc(120), sc(26), sc(8));
   
    ctx.fillStyle='rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(bx+sc(40)+offX, gY-sc(4), sc(42), sc(9), 0, 0, Math.PI*2); ctx.fill();
   
    ctx.shadowBlur=0; ctx.globalAlpha=1;
  }
   
  /* ─── PARTICLES ─── */
  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = sc(1.5) + Math.random() * sc(3);
      particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed - sc(2),
        alpha:1, r: sc(3) + Math.random() * sc(4), color });
    }
  }
   
  function spawnDmgText(x, y, text, color) {
    dmgTexts.push({ x, y, text, color, alpha:1, vy:-sc(1.4) });
  }
   
  function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += sc(0.12);
      p.alpha -= 0.03;
      if (p.alpha <= 0) { particles.splice(i,1); continue; }
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
   
  function drawDmgTexts() {
    for (let i = dmgTexts.length - 1; i >= 0; i--) {
      const d = dmgTexts[i];
      d.y += d.vy; d.alpha -= 0.025;
      if (d.alpha <= 0) { dmgTexts.splice(i,1); continue; }
      ctx.globalAlpha = d.alpha;
      ctx.font        = `bold ${sc(18)}px 'Orbitron', monospace`;
      ctx.fillStyle   = d.color;
      ctx.textAlign   = 'center';
      ctx.shadowColor = d.color; ctx.shadowBlur = sc(8);
      ctx.fillText(d.text, d.x, d.y);
      ctx.shadowBlur  = 0;
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  }
   
  /* ─── HELPER: ROUNDED RECT ─── */
  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y,   x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x,   y+h, x,   y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  }
   
  /* ─── EVENT BINDINGS ─── */
  let selectedDifficulty = 'easy';
   
  document.querySelectorAll('#diffRow .diff-btn').forEach(btn => {
    const diffMap = { '3':'easy', '4':'medium', '5':'hard' };
    btn.addEventListener('click', function () {
      document.querySelectorAll('#diffRow .diff-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedDifficulty = diffMap[this.dataset.rounds] || 'easy';
    });
  });
   
  document.getElementById('startBtn').addEventListener('click', () => initGame(selectedDifficulty));
  document.getElementById('nextRoundBtn').addEventListener('click', nextRound);
   
  document.getElementById('retryBtn').addEventListener('click', () => {
    hideAllOverlays();
    document.getElementById('ovStart').classList.remove('hidden');
    cancelAnimationFrame(animFrame);
    document.getElementById('questionPanel').style.display = 'none';
    idleDraw();
  });
   
  document.getElementById('winRetryBtn').addEventListener('click', () => {
    hideAllOverlays();
    document.getElementById('ovStart').classList.remove('hidden');
    cancelAnimationFrame(animFrame);
    document.getElementById('questionPanel').style.display = 'none';
    idleDraw();
  });
   
  /* ─── INITIAL IDLE DRAW ─── */
  function idleDraw() {
    resizeCanvas();
    repositionSprites();
    ctx.clearRect(0, 0, W, H);
    drawArenaBackground();
    drawGround();
  }
   
  idleDraw();