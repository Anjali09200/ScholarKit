// SCHOLARKIT — app.js
// ── NAVBAR SCROLL ──
window.addEventListener('scroll', function() {
  const navbar = document.getElementById('scholarNav');
  if (window.scrollY > 50) {
    navbar.style.padding = '6px 0';
    navbar.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.4)';
  } else {
    navbar.style.padding = '12px 0';
    navbar.style.boxShadow = 'none';
  }
});
 
// ── ACTIVE NAV LINK ──
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');
 
window.addEventListener('scroll', function() {
  let current = '';
  sections.forEach(function(section) {
    const sectionTop = section.offsetTop - 100;
    if (window.scrollY >= sectionTop) {
      current = section.getAttribute('id');
    }
  });
  navLinks.forEach(function(link) {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) {
      link.classList.add('active');
    }
  });
});
 
// ── CLOSE NAVBAR ON MOBILE CLICK ──
const navbarCollapse = document.getElementById('navbarNavDropdown');
const allNavLinks = document.querySelectorAll('.nav-link:not(.dropdown-toggle)');
 
allNavLinks.forEach(function(link) {
  link.addEventListener('click', function() {
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
      const toggler = document.querySelector('.navbar-toggler');
      toggler.click();
    }
  });
});
 
// ── PROFILE PREVIEW IN NAVBAR & HERO TAG ──
(function loadProfilePreview() {
  const name = localStorage.getItem('sk_name') || '';
  const navName = document.getElementById('profileNavName');
  const navAvatar = document.getElementById('profileNavAvatar');
  const tagName = document.getElementById('profileTagName');
 
  if (name && name.trim()) {
    const initials = name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    if (navName)   navName.textContent = name.split(' ')[0]; // first name only
    if (tagName)   tagName.textContent = name.split(' ')[0];
    if (navAvatar) navAvatar.innerHTML = `<span>${initials}</span>`;
  }
})();
 
// ── AI BACKEND — routes through server.js proxy (token stays server-side) ──
const NOVA_API_URL = '/api/chat'; // server.js handles auth — no token in browser
 
// ── VOICE ──
let sentences = [];
let pausedAt = 0;
 
function getVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.name === 'Google UK English Female') ||
    voices.find(v => v.name === 'Google US English') ||
    voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('female')) ||
    voices.find(v => v.lang === 'en-US') ||
    null
  );
}
 
function setPauseBtn(icon, title) {
  document.getElementById('pauseResumeIcon').className = icon;
  document.getElementById('pauseResumeBtn').title = title;
}
 
function speak(text) {
  window.speechSynthesis.cancel();
  pausedAt = 0;
  sentences = [text];
 
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.4;
  utterance.volume = 1;
  utterance.lang = 'en-US';
 
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      const voice = getVoice();
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    };
  } else {
    const voice = getVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }
}
 
function speakFrom(index) {
  speak(sentences[0] || '');
}
 
function togglePause() {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    setPauseBtn('fa-solid fa-pause', 'Pause');
  } else if (window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    setPauseBtn('fa-solid fa-play', 'Resume');
  } else {
    speakFrom(0);
    setPauseBtn('fa-solid fa-pause', 'Pause');
  }
}
 
function closeAiBox() {
  window.speechSynthesis.cancel();
  pausedAt = 0;
  sentences = [];
  setPauseBtn('fa-solid fa-pause', 'Pause');
  document.getElementById('catAiWrapper').style.display = 'none';
}
 
// ── SHOW LOADING ──
function showLoading() {
  document.getElementById('catAiWrapper').style.display = 'flex';
  document.getElementById('aiResponseText').innerText = 'Meow! Let me find that for you...';
  document.getElementById('aiStatusText').innerText = 'Thinking...';
}
 
// ── SHOW RESPONSE ──
function showAiResponse(text) {
  document.getElementById('catAiWrapper').style.display = 'flex';
  document.getElementById('aiResponseText').innerText = text;
  document.getElementById('aiStatusText').innerText = 'Nova';
  speak(text);
}
 
// ── TOOL URL MAP ──
const toolURLs = {
  'compiler':       'https://onecompiler.com',
  'code formatter': 'https://prettier.io/playground',
  'regex':          'https://regex101.com',
  'devdocs':        'https://devdocs.io',
  'stackoverflow':  'https://stackoverflow.com',
  'w3schools':      'https://www.w3schools.com/',
  'mdn':            'https://developer.mozilla.org/en-US/',
  'glitch':         'https://blog.glitch.com/',
  'codeforces':     'https://codeforces.com/',
  'codesandbox':    'https://codesandbox.io/',
  'github':         'https://github.com',
  'codepen':        'https://codepen.io',
  'jsfiddle':       'https://jsfiddle.net',
  'leetcode':       'https://leetcode.com',
  'hackerrank':     'https://www.hackerrank.com',
  'arxiv':          'https://arxiv.org',
  'ieee':           'https://ieeexplore.ieee.org',
  'google scholar': 'https://scholar.google.com',
  'researchgate':   'https://www.researchgate.net',
  'sci-hub':        'https://www.sci-hub.ren/',
  'openalex':       'https://openalex.org/',
  'consensus':      'https://consensus.app/',
  'springer':       'https://link.springer.com/',
  'pubmed':         'https://pubmed.ncbi.nlm.nih.gov',
  'semantic scholar': 'https://www.semanticscholar.org',
  'jstor':          'https://www.jstor.org',
  'core':           'https://core.ac.uk',
  'wolfram':        'https://www.wolframalpha.com',
  'desmos':         'https://www.desmos.com/calculator',
  'circuit':        'https://falstad.com/circuit',
  'unit converter': 'https://www.unitconverters.net',
  'matlab':         'https://www.mathworks.com/products/matlab-online.html',
  'numpy':          'https://numpy.org/',
  'tinkercad':      'https://www.tinkercad.com/',
  'geogebra':       'https://www.geogebra.org',
  'symbolab':       'https://www.symbolab.com',
  'rapidtables':    'https://www.rapidtables.com',
};
 
 
// ── NOVA AI CALL — proxied through server.js (no token in browser) ──
async function askAI(query) {
  showLoading();
 
  try {
    const response = await fetch(NOVA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: `You are Nova, a cute friendly girl cat AI for engineering students on ScholarKit.
                 Tools available: Online Compiler, Code Formatter, RegEx Tester, DevDocs,
                 Stack Overflow, W3Schools, MDN, GitHub, CodePen, LeetCode, HackerRank,
                 arXiv, IEEE, Google Scholar, ResearchGate, PubMed, Wolfram Alpha,
                 Desmos, Circuit Simulator, MATLAB, NumPy, Tinkercad, Symbolab.
                 Rules: Answer the question first with useful info or code example.
                 Then mention the tool. Max 2 sentences. Start with Meow or Purr. End with emoji.`,
        messages: [{ role: 'user', content: query }],
        max_tokens: 400
      })
    });
 
    const data = await response.json();
    // Proxy returns { content: [{ type: 'text', text: '...' }] }
    if (data.content && data.content[0]) {
      data.choices = [{ message: { content: data.content[0].text } }];
    }
 
    if (data.error) {
      if (data.error.code === 'rate_limit_exceeded' || data.error.message?.includes('rate limit')) {
        showAiResponse('Meow... I am a little tired right now, please try again in a moment 🐾');
        return;
      }
      showAiResponse('ERROR: ' + data.error.message);
      return;
    }
 
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiText = data.choices[0].message.content;
      showAiResponse(aiText);
      suggestTool(query, aiText);
    } else {
      showAiResponse('Meow... Nova could not find an answer! Please try again 🐾');
    }
 
    // ── SAFE SCROLL ──
    const q = query.toLowerCase();
    const codingSection   = document.querySelector('#coding-tools');
    const researchSection = document.querySelector('#research');
    const engineerSection = document.querySelector('#engineering');
    const aiSection       = document.querySelector('#ai-assistant');
 
    if (q.includes('code') || q.includes('compiler') || q.includes('coding') ||
        q.includes('leetcode') || q.includes('hackerrank') || q.includes('github') ||
        q.includes('codepen') || q.includes('w3schools') || q.includes('stackoverflow')) {
      if (codingSection) codingSection.scrollIntoView({ behavior: 'smooth' });
 
    } else if (q.includes('paper') || q.includes('research') || q.includes('journal') ||
               q.includes('arxiv') || q.includes('ieee') || q.includes('pubmed') ||
               q.includes('springer') || q.includes('jstor')) {
      if (researchSection) researchSection.scrollIntoView({ behavior: 'smooth' });
 
    } else if (q.includes('engineering') || q.includes('calculator') || q.includes('circuit') ||
               q.includes('matlab') || q.includes('numpy') || q.includes('wolfram') ||
               q.includes('desmos') || q.includes('tinkercad') || q.includes('symbolab')) {
      if (engineerSection) engineerSection.scrollIntoView({ behavior: 'smooth' });
 
    } else if (q.includes('ai') || q.includes('assistant') || q.includes('chatgpt') ||
               q.includes('gemini') || q.includes('nova')) {
      if (aiSection) aiSection.scrollIntoView({ behavior: 'smooth' });
    }
 
  } catch (error) {
    showAiResponse('FETCH FAILED: ' + error.message);
  }
}
 
// ── HANDLE SEARCH ──
let lastSearchTime = 0;
 
function handleSearch() {
  const now = Date.now();
  if (now - lastSearchTime < 5000) {
    showAiResponse('Meow! Please wait a moment before searching again 🐾');
    return;
  }
  lastSearchTime = now;
 
  const query = document.getElementById('heroSearch').value.trim();
  if (!query) {
    showAiResponse('Meow! Please type something so Nova can help you! 🐾');
    return;
  }
  askAI(query);
}
 
// ── ENTER KEY ──
document.getElementById('heroSearch').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') handleSearch();
});
 
// ── SUGGEST TOOL AS BUTTON ──
function suggestTool(query, aiText) {
  const combined = (query + ' ' + aiText).toLowerCase();
 
  for (const [keyword, url] of Object.entries(toolURLs)) {
    if (combined.includes(keyword)) {
 
      const old = document.getElementById('novaToolSuggestion');
      if (old) old.remove();
 
      const btn = document.createElement('a');
      btn.id = 'novaToolSuggestion';
      btn.href = url;
      btn.innerText = '🐾 Open ' + keyword.charAt(0).toUpperCase() + keyword.slice(1) + ' →';
      btn.style.cssText = `
        display: inline-block;
        margin-top: 10px;
        padding: 8px 18px;
        background: rgba(167,139,250,0.2);
        border: 1px solid #a78bfa;
        border-radius: 999px;
        color: #a78bfa;
        font-size: 0.85rem;
        text-decoration: none;
        font-family: Poppins, sans-serif;
        transition: background 0.2s;
      `;
      btn.onmouseover = () => btn.style.background = 'rgba(167,139,250,0.4)';
      btn.onmouseout  = () => btn.style.background = 'rgba(167,139,250,0.2)';
 
      document.getElementById('aiResponseText').after(btn);
      break;
    }
  }
}


// ═══════════════════════════════════════════════════════════════
// NOVA FLOATING WIDGET — paste at the bottom of app.js
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── CONFIG — uses GitHub Models API ─────────────────────────
  const WIDGET_SYSTEM = `You are Nova, a friendly and brilliant AI assistant built into ScholarKit — a student productivity platform for engineering and science students. Keep responses concise and clear (this is a compact widget). Use markdown sparingly: **bold** for key terms, backticks for inline code. For code use triple backticks with a language name. Be warm, encouraging, and helpful. Max 4 sentences for simple questions.`;

  // ── STATE ────────────────────────────────────────────────────
  let wHistory = [];
  let wLoading = false;
  let wOpen    = false;

  // ── INJECT HTML ──────────────────────────────────────────────
  function inject() {
    // launcher
    const launcher = document.createElement('button');
    launcher.id = 'nova-launcher';
    launcher.setAttribute('aria-label', 'Open Nova AI');
    launcher.innerHTML = `
      <span class="launcher-icon">🐱</span>
      <span class="launcher-close"><i class="fa-solid fa-xmark"></i></span>
      <span class="nova-badge-dot" id="nw-badge"></span>`;
    launcher.addEventListener('click', togglePanel);

    // panel
    const panel = document.createElement('div');
    panel.id = 'nova-panel';
    panel.innerHTML = `
      <div class="nw-header">
        <div class="nw-avatar">🐱<div class="nw-avatar-status" id="nw-status-dot"></div></div>
        <div class="nw-info">
          <p class="nw-name">Nova <span class="nw-ai-badge">AI</span></p>
          <span class="nw-status-text" id="nw-status-text">Online · ScholarKit Assistant</span>
        </div>
        <div class="nw-header-actions">
          <button class="nw-header-btn" id="nw-clear-btn" title="Clear chat"><i class="fa-solid fa-rotate-right"></i></button>
          <button class="nw-header-btn" id="nw-close-btn" title="Close"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>

      <div class="nw-messages" id="nw-messages">
        <div class="nw-welcome" id="nw-welcome">
          <div class="nw-welcome-emoji">🐱</div>
          <h4>Hey! I'm Nova</h4>
          <p>Your AI study companion. Ask me anything about coding, math, circuits, or research!</p>
          <div class="nw-quick-chips">
            <button class="nw-quick-chip" data-text="Explain a concept">⚡ Explain a concept</button>
            <button class="nw-quick-chip" data-text="Help me code">💻 Help me code</button>
            <button class="nw-quick-chip" data-text="Solve a problem">🧮 Solve a problem</button>
            <button class="nw-quick-chip" data-text="Summarise a paper">📄 Summarise a paper</button>
          </div>
        </div>
      </div>

      <a class="nw-expand-link" href="ai-assistant.html">
        <i class="fa-solid fa-up-right-from-square"></i> Open full Nova experience
      </a>

      <div class="nw-input-area">
        <div class="nw-input-row">
          <textarea id="nw-input" rows="1" placeholder="Ask Nova anything…" maxlength="1000"></textarea>
          <button class="nw-send-btn" id="nw-send"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
        <p class="nw-disclaimer">Nova can make mistakes · <a href="ai-assistant.html">Full chat →</a></p>
      </div>`;

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    // Wire buttons
    document.getElementById('nw-close-btn').addEventListener('click', closePanel);
    document.getElementById('nw-clear-btn').addEventListener('click', clearChat);
    document.getElementById('nw-send').addEventListener('click', sendMsg);
    document.getElementById('nw-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });
    document.getElementById('nw-input').addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 90) + 'px';
    });

    // Quick chips
    panel.querySelectorAll('.nw-quick-chip').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var input = document.getElementById('nw-input');
        input.value = btn.getAttribute('data-text');
        input.focus();
      });
    });

    // Intercept the "AI Assistant" nav link on index page
    document.querySelectorAll('a[href="#ai-assistant"], a[href="ai-assistant.html"]').forEach(function(link) {
      // Only intercept hash links (index page nav), not the full-page link
      if (link.getAttribute('href') === '#ai-assistant') {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          togglePanel();
        });
      }
    });
  }

  // ── TOGGLE / OPEN / CLOSE ────────────────────────────────────
  function togglePanel() { wOpen ? closePanel() : openPanel(); }

  function openPanel() {
    wOpen = true;
    document.getElementById('nova-panel').classList.add('is-open');
    document.getElementById('nova-launcher').classList.add('is-open');
    document.getElementById('nw-badge').classList.remove('visible');
    setTimeout(function() { document.getElementById('nw-input').focus(); }, 300);
  }

  function closePanel() {
    wOpen = false;
    document.getElementById('nova-panel').classList.remove('is-open');
    document.getElementById('nova-launcher').classList.remove('is-open');
  }

  // ── CLEAR ────────────────────────────────────────────────────
  function clearChat() {
    wHistory = [];
    document.getElementById('nw-messages').innerHTML = `
      <div class="nw-welcome" id="nw-welcome">
        <div class="nw-welcome-emoji">🐱</div>
        <h4>Hey! I'm Nova</h4>
        <p>Ask me anything about coding, math, circuits, or research!</p>
        <div class="nw-quick-chips">
          <button class="nw-quick-chip" data-text="Explain a concept">⚡ Explain a concept</button>
          <button class="nw-quick-chip" data-text="Help me code">💻 Help me code</button>
          <button class="nw-quick-chip" data-text="Solve a problem">🧮 Solve a problem</button>
          <button class="nw-quick-chip" data-text="Summarise a paper">📄 Summarise a paper</button>
        </div>
      </div>`;
    // re-wire chips after innerHTML reset
    document.querySelectorAll('#nw-messages .nw-quick-chip').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.getElementById('nw-input').value = btn.getAttribute('data-text');
        document.getElementById('nw-input').focus();
      });
    });
  }

  // ── SEND ─────────────────────────────────────────────────────
  async function sendMsg() {
    if (wLoading) return;
    var input = document.getElementById('nw-input');
    var text  = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    document.getElementById('nw-welcome') && document.getElementById('nw-welcome').remove();

    appendUserBubble(text);
    wHistory.push({ role: 'user', content: text });

    wLoading = true;
    setLoading(true);
    setStatus('thinking');

    var { bubble, dots } = appendThinking();

    try {
      var reply = await callNova(wHistory);
      dots.remove();
      bubble.innerHTML = formatText(reply);
      wHistory.push({ role: 'assistant', content: reply });
      setStatus('ready');
    } catch(err) {
      dots.remove();
      bubble.innerHTML = `<span style="color:#f87171;font-size:0.75rem;">
        <i class="fa-solid fa-triangle-exclamation"></i> ${getFriendlyError(err)}
        <br><a href="ai-assistant.html" style="color:#93c5fd;">Try full Nova →</a>
      </span>`;
      setStatus('error');
    }

    wLoading = false;
    setLoading(false);
    scrollBottom();
    input.focus();
  }

  // ── CALL NOVA via proxy (server.js keeps token server-side) ────
  async function callNova(history) {
    var messages = [];
    history.slice(-8).forEach(function(msg) {
      messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
    });

    var res = await fetch(NOVA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: WIDGET_SYSTEM,
        messages: messages,
        max_tokens: 600
      })
    });

    var data = await res.json();

    if (data.error) {
      if (data.error.code === 'rate_limit_exceeded' || (data.error.message && data.error.message.includes('rate limit'))) {
        throw new Error('quota exceeded');
      }
      throw new Error(data.error.message);
    }

    // Proxy returns { content: [{ type: 'text', text: '...' }] }
    var reply = data.content && data.content[0] && data.content[0].text;
    if (!reply) throw new Error('Empty response');
    return reply;
  }

  // ── APPEND USER BUBBLE ───────────────────────────────────────
  function appendUserBubble(text) {
    var msgs = document.getElementById('nw-messages');
    var div  = document.createElement('div');
    div.className = 'nw-msg user';
    div.innerHTML = `
      <div class="nw-msg-avatar"><i class="fa-solid fa-circle-user"></i></div>
      <div class="nw-msg-bubble">${escHtml(text).replace(/\n/g,'<br>')}</div>`;
    msgs.appendChild(div);
    scrollBottom();
  }

  // ── THINKING DOTS ────────────────────────────────────────────
  function appendThinking() {
    var msgs = document.getElementById('nw-messages');
    var div  = document.createElement('div');
    div.className = 'nw-msg assistant';

    var dots = document.createElement('div');
    dots.className = 'nw-typing';
    dots.innerHTML = '<span></span><span></span><span></span>';

    var bubble = document.createElement('div');
    bubble.className = 'nw-msg-bubble';
    bubble.appendChild(dots);

    div.innerHTML = '<div class="nw-msg-avatar">🐱</div>';
    div.appendChild(bubble);
    msgs.appendChild(div);
    scrollBottom();

    return { bubble: bubble, dots: dots };
  }

  // ── FORMAT TEXT ──────────────────────────────────────────────
  function formatText(text) {
    var html = text;
    // Code blocks
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, function(_, lang, code) {
      var id = 'nwc_' + Math.random().toString(36).slice(2,7);
      var label = lang || 'code';
      return '<div class="nw-code-block">' +
        '<div class="nw-code-header"><span>' + label + '</span>' +
        '<button class="nw-copy-btn" onclick="(function(){' +
          'var el=document.getElementById(\'' + id + '\');' +
          'if(!el)return;' +
          'navigator.clipboard.writeText(el.innerText).then(function(){' +
            'var b=el.closest(\'.nw-code-block\').querySelector(\'.nw-copy-btn\');' +
            'b.innerHTML=\'<i class=\\\"fa-solid fa-check\\\"></i> Copied!\';' +
            'b.style.color=\'#4ade80\';' +
            'setTimeout(function(){b.innerHTML=\'<i class=\\\"fa-regular fa-copy\\\"></i> Copy\';b.style.color=\'\';},2000);' +
          '});' +
        '})()"><i class="fa-regular fa-copy"></i> Copy</button></div>' +
        '<pre><code id="' + id + '">' + escHtml(code.trim()) + '</code></pre></div>';
    });
    // Inline code
    html = html.replace(/`([^`\n]+)`/g, '<code style="font-family:monospace;background:rgba(0,0,0,0.3);padding:1px 5px;border-radius:4px;color:#7dd3fc;font-size:0.9em;">$1</code>');
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Headings
    html = html.replace(/^#{1,3} (.+)$/gm, '<strong style="display:block;margin:6px 0 2px;">$1</strong>');
    // Numbered list
    html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin-left:1.2rem;margin-bottom:3px;">$1</li>');
    // Bullets
    html = html.replace(/^[-•] (.+)$/gm, '<li style="margin-left:1.2rem;list-style:disc;margin-bottom:3px;">$1</li>');
    // Newlines
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/(<\/(?:pre|li)>)<br>/g, '$1');
    return html;
  }

  // ── STATUS ───────────────────────────────────────────────────
  function setStatus(state) {
    var dot = document.getElementById('nw-status-dot');
    var txt = document.getElementById('nw-status-text');
    if (!dot || !txt) return;
    dot.className = 'nw-avatar-status';
    if (state === 'thinking') {
      dot.classList.add('thinking');
      txt.textContent = 'Thinking…';
    } else if (state === 'error') {
      dot.style.background = '#f87171';
      txt.textContent = 'Error — check connection';
    } else {
      dot.style.background = '#4ade80';
      txt.textContent = 'Online · ScholarKit Assistant';
    }
  }

  // ── LOADING ──────────────────────────────────────────────────
  function setLoading(on) {
    var btn = document.getElementById('nw-send');
    if (!btn) return;
    btn.disabled = on;
    btn.innerHTML = on
      ? '<i class="fa-solid fa-spinner fa-spin"></i>'
      : '<i class="fa-solid fa-paper-plane"></i>';
  }

  // ── UTILS ────────────────────────────────────────────────────
  function scrollBottom() {
    var msgs = document.getElementById('nw-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  function escHtml(t) {
    return String(t)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function getFriendlyError(err) {
    var msg = err.message || '';
    if (msg.includes('quota') || msg.includes('exhausted')) return 'API limit reached — try again shortly.';
    if (msg.includes('fetch') || msg.includes('Network'))   return 'Cannot reach Nova. Check your connection.';
    return 'Something went wrong. Please try again.';
  }

  // ── INIT ─────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

})();