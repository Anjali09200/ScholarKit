/* ═══════════════════════════════════════════════════════════════
   ai.js — Nova AI Assistant (v3) for ScholarKit
   Powered by GitHub Models (gpt-4o-mini via Azure AI)
   Proxied through server.js — no API key in browser!
   ═══════════════════════════════════════════════════════════════ */

// ── API CONFIG — all calls go through server.js proxy ────────────
const NOVA_API_URL = '/api/chat'; // server.js handles the token

// ── KEY HELPERS — stubs so existing code doesn't break ───────────
function getApiKey() { return 'proxy'; } // always truthy — proxy handles auth
function saveApiKey(key) {}              // nothing to save in browser

// ── TONE PRESETS ─────────────────────────────────────────────────
const TONE_PROMPTS = {
  friendly: `You are Nova, a warm, witty, and brilliant AI assistant built into ScholarKit — a student productivity platform for engineering and science students. You are powered by Claude, one of the most capable AI models available.

Personality: Encouraging and supportive like a smart friend who knows everything. Occasionally playful with light humour. You celebrate student wins ("Great question!", "You're thinking like an engineer!"). Break down complex topics step-by-step. Use emojis sparingly for warmth.

Expertise: Programming & Debugging (Python, C++, Java, JS, Rust, Go, etc.), Mathematics (Calculus, Linear Algebra, Discrete Math, Statistics, Probability), Engineering (Electronics, Circuits, Signals, Thermodynamics, Mechanics, Control Systems), Physics & Chemistry, Research paper summarisation and deep analysis, Algorithms & Data Structures, Machine Learning & Deep Learning, File and image analysis.

Capabilities you MUST use fully:
- When given code: identify ALL bugs, explain each one clearly, provide a complete fixed version
- When given a research paper or document: provide a structured deep summary with sections: Overview, Key Contributions, Methodology, Results, Limitations, Takeaways
- When given an image: describe it in full detail, identify concepts, explain relevance to the student's question
- For math: show full step-by-step derivations, never skip steps
- For engineering: give real-world context and practical applications

Formatting: Use **bold** for key terms, \`inline code\` for variables/functions, triple backticks with language name for code blocks, numbered lists for step-by-step, concise but complete. End complex answers with a "**Key takeaway:**" summary.`,

  concise: `You are Nova, a concise AI assistant in ScholarKit powered by Claude. Be direct and to the point. Give the answer first, then brief context only if needed. No filler phrases. Use bullet points. Keep responses focused. Still be accurate and fully helpful — brevity doesn't mean incomplete.`,

  detailed: `You are Nova, a thorough academic AI assistant in ScholarKit powered by Claude. Provide comprehensive, university-level explanations with: background context, step-by-step derivations, real-world applications, common misconceptions to avoid, and references to further reading. Use rich markdown formatting with headings, numbered steps, code blocks, and tables. Be rigorous but accessible.`,

  socratic: `You are Nova, a Socratic AI tutor in ScholarKit powered by Claude. Guide students to discover answers themselves. Instead of giving answers directly, ask probing questions that lead them to the solution. Praise good reasoning. When stuck, give a small hint and ask another question. Only reveal the full answer if they've genuinely tried. End with "What do you think the next step is?"`,

  eli5: `You are Nova, a friendly AI tutor in ScholarKit powered by Claude. Explain everything in the simplest possible language — as if talking to a smart 10-year-old. Use analogies from everyday life. Avoid jargon unless you immediately explain it. Use short sentences. Add fun examples. Make complex topics feel easy and exciting.`
};

// ── STATE ────────────────────────────────────────────────────────
let conversationHistory = [];
let isLoading           = false;
let messageCount        = 0;
let currentTone         = 'friendly';
let pendingFile         = null; // { base64, mediaType, name, text }
let lastUserMessage     = '';
let webSearchEnabled    = false;

// ── DOM READY ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectWelcomeCard(document.getElementById('chatMessages'));
  initTextarea();
  initKeyboardShortcuts();
  loadConversationFromStorage();
  focusInput();
  startCatBlink();
  updateWebSearchPill();
});

// ── API KEY BANNER — not needed (proxy handles auth) ──────────────
function injectApiKeyBanner() {} // no-op
window.saveBannerKey = function() {};

function updateKeyStatus() {
  const pill = document.querySelector('.model-pill');
  if (!pill) return;
  pill.innerHTML = `<span class="dot"></span> gpt-4o-mini · Azure AI`;
  pill.title = 'Powered by gpt-4o-mini via GitHub Models (Azure AI)';
}

// ── FOCUS ────────────────────────────────────────────────────────
function focusInput() {
  const input = document.getElementById('chatInput');
  if (input) setTimeout(() => input.focus(), 300);
}

// ── TEXTAREA AUTO-RESIZE ─────────────────────────────────────────
function initTextarea() {
  const textarea = document.getElementById('chatInput');
  if (!textarea) return;
  textarea.addEventListener('input', () => autoResize(textarea));
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

function handleInput(el) {
  autoResize(el);
  const words = el.value.trim().split(/\s+/).filter(Boolean).length;
  const wc = document.getElementById('wordCount');
  if (wc) wc.textContent = words > 3 ? `${words} words` : '';
}

// ── KEYBOARD SHORTCUTS ───────────────────────────────────────────
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('chatInput')?.focus();
    }
    if (e.key === 'Escape') closeSidebar();
  });
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ── CAT BLINK ────────────────────────────────────────────────────
function startCatBlink() {
  const cats = document.querySelectorAll('.cat');
  cats.forEach(cat => {
    setInterval(() => {
      cat.classList.add('cat-blink');
      setTimeout(() => cat.classList.remove('cat-blink'), 150);
    }, 3000 + Math.random() * 2000);
  });
}

// ── TONE MENU ────────────────────────────────────────────────────
function toggleToneMenu(btn) {
  const menu = document.getElementById('toneMenu');
  if (!menu) return;
  menu.classList.toggle('open');
  if (menu.classList.contains('open')) {
    setTimeout(() => {
      document.addEventListener('click', closeToneMenu, { once: true });
    }, 10);
  }
}

function closeToneMenu() {
  document.getElementById('toneMenu')?.classList.remove('open');
}

function setTone(tone, optionEl) {
  currentTone = tone;
  document.querySelectorAll('.tone-option').forEach(o => o.classList.remove('selected'));
  optionEl.classList.add('selected');
  const label = optionEl.textContent.replace('✓','').trim();
  const btn = document.getElementById('toneBtnLabel');
  if (btn) btn.textContent = 'Tone: ' + label.split(' ')[1];
  document.getElementById('toneMenu')?.classList.remove('open');
  showToast('Tone updated!');
}

// ── WEB SEARCH TOGGLE ────────────────────────────────────────────
function toggleWebSearch() {
  webSearchEnabled = !webSearchEnabled;
  updateWebSearchPill();
  showToast(webSearchEnabled ? '🌐 Web browsing ON — Nova will fetch real pages' : 'Web browsing OFF');
}

function updateWebSearchPill() {
  const pill = document.getElementById('webSearchPill');
  if (!pill) return;
  if (webSearchEnabled) {
    pill.classList.add('active');
    pill.title = 'Web browsing ON — Nova fetches real pages and cites sources';
  } else {
    pill.classList.remove('active');
    pill.title = 'Enable web browsing for real-time sourced answers';
  }
}

// ── BROWSE ENGINE ─────────────────────────────────────────────────
// Fetches a URL via /api/browse and returns clean text + source url
async function fetchBrowsedContent(targetUrl) {
  const res = await fetch('/api/browse', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ url: targetUrl })
  });
  if (!res.ok) throw new Error(`Browse HTTP ${res.status}`);
  return await res.json(); // { text, url, length }
}

// Asks Nova to pick 1-3 best URLs to browse for a given query
const BROWSE_PLAN_SYSTEM = `You are a URL planner. Given a user question, return ONLY a JSON array of 1-3 URLs that would contain the most useful, current information to answer it. Prefer:
- arxiv.org/search/?query=... for research papers
- en.wikipedia.org/wiki/... for concepts and overviews
- developer.mozilla.org for web/JS/CSS topics
- docs.python.org for Python language questions
- github.com for open-source projects
Return ONLY a valid JSON array of URL strings. No markdown, no explanation.`;

async function planBrowseUrls(query) {
  const res = await fetch(NOVA_API_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      system:     BROWSE_PLAN_SYSTEM,
      messages:   [{ role: 'user', content: query }],
      max_tokens: 300
    })
  });
  if (!res.ok) throw new Error(`URL planner HTTP ${res.status}`);
  const data = await res.json();
  const raw  = (data.content || []).map(b => b.text || '').join('').trim();
  const clean = raw.replace(/^```json?\n?/i, '').replace(/```$/, '').trim();
  const urls  = JSON.parse(clean);
  return Array.isArray(urls) ? urls.slice(0, 3) : [];
}

// High-level: plan URLs -> fetch each -> return enriched prompt for Nova
// thinkingTextEl is the .thinking-text span (for live status updates)
async function runBrowseAgent(query, thinkingTextEl) {
  const setText = t => { if (thinkingTextEl) thinkingTextEl.textContent = t; };

  setText('🔍 Planning what to browse…');
  let urls = [];
  try {
    urls = await planBrowseUrls(query);
  } catch(e) {
    console.warn('URL planning failed:', e.message);
  }
  if (!urls.length) return null;

  const results = [];
  for (let i = 0; i < urls.length; i++) {
    setText(`🌐 Reading source ${i + 1} of ${urls.length}…`);
    try {
      const r = await fetchBrowsedContent(urls[i]);
      results.push(r);
    } catch(e) {
      console.warn('Browse fetch failed:', urls[i], e.message);
    }
  }
  if (!results.length) return null;

  setText('✍️ Synthesising answer…');
  const contextBlock = results.map((r, i) =>
    `--- Source ${i + 1}: ${r.url} ---\n${r.text}`
  ).join('\n\n');

  return `The user asked: "${query}"\n\nI browsed the web and found the following real, current content:\n\n${contextBlock}\n\nUsing ONLY the above sources, write a comprehensive answer. Cite sources inline as [Source 1], [Source 2] etc. List full URLs at the end under "**Sources:**".`;
}

// ── SIDEBAR ──────────────────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('aiSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar?.classList.toggle('open');
  overlay?.classList.toggle('active');
}

function closeSidebar() {
  document.getElementById('aiSidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('active');
}

// ── SCROLL BUTTON ────────────────────────────────────────────────
function checkScrollBtn() {
  const msgs = document.getElementById('chatMessages');
  const btn  = document.getElementById('scrollBtn');
  if (!msgs || !btn) return;
  const atBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 80;
  btn.classList.toggle('visible', !atBottom && msgs.scrollHeight > msgs.clientHeight + 100);
}

// ── CLEAR CHAT ───────────────────────────────────────────────────
function clearChat() {
  if (isLoading) return;
  conversationHistory = [];
  messageCount = 0;
  lastUserMessage = '';
  pendingFile = null;
  localStorage.removeItem('nova_history');
  updateStats();

  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;

  msgs.style.opacity = '0';
  msgs.style.transition = 'opacity 0.25s ease';
  setTimeout(() => {
    msgs.innerHTML = '';
    msgs.style.opacity = '1';
    injectWelcomeCard(msgs);
    closeSidebar();
    focusInput();
  }, 250);
}

// ── WELCOME CARD ─────────────────────────────────────────────────
function injectWelcomeCard(container) {
  const wc = document.createElement('div');
  wc.className = 'welcome-card';
  wc.id = 'welcomeCard';
  wc.innerHTML = `
    <div class="wc-cat-wrap">
      <div class="cat cat-md">
        <div class="cat-ear left"></div><div class="cat-ear right"></div>
        <div class="cat-head">
          <div class="cat-eye left"></div><div class="cat-eye right"></div>
          <div class="cat-nose"></div><div class="cat-mouth"></div>
          <div class="cat-whiskers"><span></span><span></span><span></span><span></span></div>
        </div>
        <div class="cat-body"><div class="cat-tail"></div><div class="cat-paw left"></div><div class="cat-paw right"></div></div>
      </div>
    </div>
    <h2>Hey, I'm Nova! <span class="wave">👋</span></h2>
    <p>Your AI-powered study companion — running in <strong>✨ Demo Mode</strong>. Ask me anything about code, maths, circuits, ML, or research — or pick a topic below.</p>
    <div class="topic-grid">
      <button class="topic-card t-code" onclick="quickPrompt('Debug this code for me and explain every bug you find:')">
        <i class="fa-solid fa-bug"></i>
        <strong>Debug Code</strong>
        <span>Paste any code — get full analysis + fix</span>
      </button>
      <button class="topic-card t-math" onclick="quickPrompt('Help me solve this step by step: ')">
        <i class="fa-solid fa-square-root-variable"></i>
        <strong>Deep Maths</strong>
        <span>Full derivations, never skipped steps</span>
      </button>
      <button class="topic-card t-science" onclick="quickPrompt('Explain this engineering concept in depth: ')">
        <i class="fa-solid fa-gears"></i>
        <strong>Engineering</strong>
        <span>Circuits, signals, thermodynamics</span>
      </button>
      <button class="topic-card t-research" onclick="quickPrompt('Give me a deep structured summary of this research paper: ')">
        <i class="fa-solid fa-book-open"></i>
        <strong>Analyse Paper</strong>
        <span>Attach a PDF — get a full breakdown</span>
      </button>
    </div>
    <div class="wc-shortcuts">
      <span><kbd>Enter</kbd> Send</span>
      <span><kbd>Shift+Enter</kbd> New line</span>
      <span><kbd>Ctrl+K</kbd> Focus input</span>
      <span><i class="fa-solid fa-paperclip" style="font-size:10px;"></i> Attach PDF/image</span>
    </div>`;
  container.appendChild(wc);
}

function quickPrompt(text) {
  const input = document.getElementById('chatInput');
  if (!input) return;
  input.value = text;
  autoResize(input);
  input.focus();
}

// ── INSERT SUGGESTION ────────────────────────────────────────────
function insertSuggestion(btn) {
  const clone = btn.cloneNode(true);
  clone.querySelectorAll('i').forEach(i => i.remove());
  const text = clone.innerText.trim();
  if (!text || text === 'Code mode' || text === 'Math mode') {
    const map = { 'Code mode': 'Write a function in Python that ', 'Math mode': 'Solve this step by step: ' };
    const input = document.getElementById('chatInput');
    if (input) { input.value = map[text] || ''; autoResize(input); input.focus(); }
    return;
  }
  const input = document.getElementById('chatInput');
  if (!input) return;
  input.value = text;
  autoResize(input);
  input.focus();
  highlightInputBox();
}

function highlightInputBox() {
  const box = document.querySelector('.input-box');
  if (!box) return;
  box.style.borderColor = 'rgba(24,95,165,0.8)';
  box.style.boxShadow = '0 0 0 3px rgba(24,95,165,0.2)';
  setTimeout(() => { box.style.borderColor = ''; box.style.boxShadow = ''; }, 600);
}

// ── FILE ATTACH ──────────────────────────────────────────────────
function handleAttach() {
  document.getElementById('fileInput')?.click();
}

function handleFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const isImage = file.type.startsWith('image/');
  const isPDF   = file.type === 'application/pdf';
  const isText  = file.type.startsWith('text/') || /\.(txt|md|csv|json|js|py|java|cpp|c|html|css)$/i.test(file.name);

  if (!isImage && !isPDF && !isText) {
    showToast('⚠ Unsupported file. Use images, PDFs, or text files.');
    return;
  }

  const reader = new FileReader();

  if (isText) {
    reader.onload = e => {
      pendingFile = { text: e.target.result, mediaType: file.type || 'text/plain', name: file.name, isText: true };
      showFilePreview(file.name, 'text');
    };
    reader.readAsText(file);
  } else {
    reader.onload = e => {
      const base64 = e.target.result.split(',')[1];
      pendingFile = { base64, mediaType: file.type, name: file.name };
      showFilePreview(file.name, isImage ? 'image' : 'pdf');
    };
    reader.readAsDataURL(file);
  }
  event.target.value = '';
}

function showFilePreview(name, type) {
  // Remove any existing preview
  document.getElementById('filePreviewBar')?.remove();

  const icons = { image: 'fa-image', pdf: 'fa-file-pdf', text: 'fa-file-code' };
  const bar = document.createElement('div');
  bar.id = 'filePreviewBar';
  bar.style.cssText = `
    display:flex;align-items:center;gap:8px;padding:6px 12px;
    background:rgba(24,95,165,0.1);border:1px solid rgba(24,95,165,0.25);
    border-radius:8px;margin:0 0 6px;font-size:12px;color:#93c5fd;
    font-family:'Poppins',sans-serif;
  `;
  bar.innerHTML = `
    <i class="fa-solid ${icons[type] || 'fa-paperclip'}"></i>
    <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(name)}</span>
    <button onclick="clearPendingFile()" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:13px;padding:0;" title="Remove file">✕</button>
  `;
  const inputArea = document.querySelector('.chat-input-area');
  if (inputArea) inputArea.insertBefore(bar, inputArea.firstChild);

  const input = document.getElementById('chatInput');
  if (input && !input.value) input.placeholder = `Ask about ${name}…`;

  showToast(`📎 ${name} attached`);
}

function clearPendingFile() {
  pendingFile = null;
  document.getElementById('filePreviewBar')?.remove();
  const input = document.getElementById('chatInput');
  if (input) input.placeholder = 'Ask Nova anything…';
}

// ── SEND MESSAGE ─────────────────────────────────────────────────
async function sendMessage() {
  if (isLoading) return;

  const apiKey = getApiKey(); // always 'proxy' — no key needed in browser

  const input = document.getElementById('chatInput');
  const text  = input?.value.trim();
  if (!text && !pendingFile) { shakeInput(); return; }

  const displayText = text || `[Attached: ${pendingFile?.name}]`;
  input.value = '';
  input.style.height = 'auto';
  input.placeholder = 'Ask Nova anything…';
  document.getElementById('wordCount').textContent = '';

  document.getElementById('welcomeCard')?.remove();
  clearPendingFile();

  lastUserMessage = text;
  appendUserMessage(displayText, pendingFile?.name);
  messageCount++;
  updateStats();

  // ── Build message content ──
  let userContent;
  const fileRef = pendingFile; // capture before clearing

  if (fileRef) {
    if (fileRef.isText) {
      // Send text file as inline content
      userContent = [
        { type: 'text', text: `File: ${fileRef.name}\n\n\`\`\`\n${fileRef.text}\n\`\`\`\n\n${text || 'Please analyse this file in depth.'}` }
      ];
    } else if (fileRef.mediaType.startsWith('image/')) {
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: fileRef.mediaType, data: fileRef.base64 } },
        { type: 'text', text: text || 'Describe this image in detail and explain any relevant concepts.' }
      ];
    } else if (fileRef.mediaType === 'application/pdf') {
      userContent = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileRef.base64 } },
        { type: 'text', text: text || 'Give me a comprehensive structured summary of this document. Include: Overview, Key Points, Methodology (if applicable), Main Findings, and Key Takeaways.' }
      ];
    }
    pendingFile = null;
  } else {
    userContent = text;
  }

  conversationHistory.push({ role: 'user', content: userContent });
  saveToStorage();

  isLoading = true;
  setSendButtonState(true);
  setNovaStatus('thinking');

  // ── MULTI-STEP AGENT: intercept agentic queries ──────────────
  if (isAgentQuery(text)) {
    await runAgentFlow(text);
    isLoading = false;
    setSendButtonState(false);
    scrollToBottom();
    focusInput();
    return;
  }

  const { bubble, thinkingEl } = appendAssistantPlaceholder();

  try {
    let response;

    // ── WEB BROWSE PATH — real pages, real citations ──
    if (webSearchEnabled && text) {
      try {
        const thinkingTextEl = thinkingEl.querySelector('.thinking-text');
        const browsedPrompt = await runBrowseAgent(text, thinkingTextEl);
        if (browsedPrompt) {
          // Swap last user message with the browse-enriched prompt
          const browseMessages = [
            ...conversationHistory.slice(0, -1),
            { role: 'user', content: browsedPrompt }
          ];
          response = await callClaudeAPI(browseMessages, apiKey);
        }
      } catch(browseErr) {
        console.warn('Browse agent failed, falling back:', browseErr.message);
      }
    }

    // ── NORMAL PATH (fallback or web search off) ──
    if (!response) {
      response = await callClaudeAPI(conversationHistory, apiKey);
    }

    thinkingEl.remove();
    await streamRender(bubble, response);
    conversationHistory.push({ role: 'assistant', content: response });
    saveToStorage();
    addMessageActions(bubble.closest('.message'), response);
    setNovaStatus('ready');
    messageCount++;
    updateStats();
  } catch (err) {
    thinkingEl.remove();
    const errMsg = getFriendlyError(err);
    bubble.innerHTML = `
      <div class="error-msg">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>${escHtml(errMsg)}</span>
        <button onclick="retryLast()" class="retry-btn"><i class="fa-solid fa-rotate-right"></i> Retry</button>
      </div>`;
    setNovaStatus('error');
    console.error('Nova error:', err);
  }

  isLoading = false;
  setSendButtonState(false);
  scrollToBottom();
  focusInput();
}

// ── RETRY ────────────────────────────────────────────────────────
async function retryLast() {
  if (isLoading) return;
  if (conversationHistory[conversationHistory.length - 1]?.role === 'assistant') {
    conversationHistory.pop();
  }
  document.querySelector('.message.assistant:last-child')?.remove();

  const apiKey = getApiKey();


  isLoading = true;
  setSendButtonState(true);
  setNovaStatus('thinking');

  const { bubble, thinkingEl } = appendAssistantPlaceholder();

  try {
    const response = await callClaudeAPI(conversationHistory, apiKey);
    thinkingEl.remove();
    await streamRender(bubble, response);
    conversationHistory.push({ role: 'assistant', content: response });
    saveToStorage();
    addMessageActions(bubble.closest('.message'), response);
    setNovaStatus('ready');
  } catch (err) {
    thinkingEl.remove();
    bubble.innerHTML = `<div class="error-msg"><i class="fa-solid fa-triangle-exclamation"></i> ${escHtml(getFriendlyError(err))}</div>`;
    setNovaStatus('error');
  }

  isLoading = false;
  setSendButtonState(false);
}

// ── DEMO MODE FLAG ───────────────────────────────────────────────
// Set to true for offline judge demos. Set to false when server is live.
const DEMO_MODE = false;

// ── DEMO RESPONSES ───────────────────────────────────────────────
function getDemoResponse(messages) {
  const last = messages.slice(-1)[0]?.content || '';
  const q    = (typeof last === 'string' ? last : JSON.stringify(last)).toLowerCase();

  // Greeting
  if (/^(hi|hello|hey|sup|yo|howdy|what'?s up)/i.test(q.trim())) {
    return `Hey there! 👋 I'm **Nova**, your ScholarKit AI assistant.\n\nI can help you with:\n- 💻 **Code** — debug, write, explain in any language\n- 📐 **Maths** — step-by-step derivations\n- ⚙️ **Engineering** — circuits, signals, thermodynamics\n- 📚 **Research** — summarise papers and concepts\n\nWhat would you like to explore today?`;
  }

  // Python / code debug
  if (/python|debug|bug|error|code|function|algorithm|javascript|java|c\+\+|typescript|rust|golang/.test(q)) {
    return `Great question! Let me walk you through this. 🐍\n\n**Common Python bugs to watch for:**\n\n1. **Missing colon** after \`if\`, \`for\`, \`def\`, \`class\`\n2. **Indentation errors** — Python is whitespace-sensitive\n3. **Off-by-one** in \`range()\` — \`range(n)\` gives 0 to n-1\n4. **Type mismatch** — e.g. \`"5" + 5\` throws TypeError\n\n**Example fix:**\n\`\`\`python\n# Buggy\ndef calculate_average(numbers)\n    return sum(numbers) / len(numbers)\n\n# Fixed\ndef calculate_average(numbers):\n    if not numbers:\n        return 0\n    return sum(numbers) / len(numbers)\n\nprint(calculate_average([85, 92, 78, 90]))  # 86.25\n\`\`\`\n\n**Key takeaway:** Always check for missing colons, indentation consistency, and guard against empty inputs.\n\nPaste your specific code and I'll debug it fully! 🔍`;
  }

  // Binary search
  if (/binary search|searching|sorted array/.test(q)) {
    return `Here's a clean **Binary Search** implementation in Python! 🔍\n\n\`\`\`python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n\n    while left <= right:\n        mid = (left + right) // 2\n\n        if arr[mid] == target:\n            return mid          # Found!\n        elif arr[mid] < target:\n            left = mid + 1      # Search right half\n        else:\n            right = mid - 1     # Search left half\n\n    return -1  # Not found\n\n# Example usage\nnums = [2, 5, 8, 12, 16, 23, 38, 45]\nprint(binary_search(nums, 23))   # Output: 5\nprint(binary_search(nums, 10))   # Output: -1\n\`\`\`\n\n**How it works:**\n1. Start with the whole sorted array\n2. Check the **middle** element\n3. If too small → search right half; if too big → search left half\n4. Repeat until found or array exhausted\n\n**Time Complexity:** O(log n) — halves the search space each step\n**Space Complexity:** O(1) — iterative, no recursion stack\n\n**Key takeaway:** Binary search only works on **sorted** arrays and is dramatically faster than linear search for large datasets.`;
  }

  // Quantum / physics
  if (/quantum|entanglement|superposition|wave|particle|relativity|photon/.test(q)) {
    return `Quantum entanglement is one of the most fascinating phenomena in physics! ⚛️\n\n**What is Quantum Entanglement?**\n\nWhen two particles become **entangled**, their quantum states are linked — no matter how far apart they are. Measuring one particle *instantly* determines the state of the other.\n\n**The key steps:**\n\n1. Two particles interact and become entangled (e.g. a photon pair created together)\n2. Each particle exists in a **superposition** of states (e.g. spin up *and* spin down simultaneously)\n3. When you **measure** one particle and collapse its state, the other particle's state is instantly determined\n4. This correlation holds even if particles are **light-years apart**\n\n**Why is this strange?**\n- It seems to violate locality (no signal can travel faster than light)\n- Einstein called it *"spooky action at a distance"* and was uncomfortable with it\n- Bell's theorem (1964) and subsequent experiments proved entanglement is **real**, not just hidden variables\n\n**Real applications:**\n- **Quantum cryptography** — unbreakable encryption (any eavesdropping disturbs the entangled state)\n- **Quantum computing** — entangled qubits enable parallel computation\n- **Quantum teleportation** — transferring quantum states (not matter or FTL communication)\n\n**Key takeaway:** Entanglement is a real, experimentally verified phenomenon where two particles share a quantum state. Measuring one instantly defines the other, regardless of distance — but it cannot be used to send information faster than light.`;
  }

  // Kirchhoff / circuits / electronics
  if (/kirchhoff|kvl|kcl|circuit|voltage|current|resistor|ohm|capacitor|inductor|signal/.test(q)) {
    return `Great topic! Let's break down **Kirchhoff's Laws** ⚡\n\n---\n\n## Kirchhoff's Voltage Law (KVL)\n\n> *"The sum of all voltages around any closed loop in a circuit equals zero."*\n\n**Mathematically:** ΣV = 0\n\n**Why it works:** Energy is conserved — voltage gained from sources equals voltage dropped across components.\n\n**Example:**\n\`\`\`\nLoop: Battery (12V) → R1 (4Ω) → R2 (8Ω) → back to battery\nCurrent I = 12 / (4+8) = 1 A\nKVL check: +12V - (1×4) - (1×8) = 12 - 4 - 8 = 0 ✓\n\`\`\`\n\n---\n\n## Kirchhoff's Current Law (KCL)\n\n> *"The sum of currents entering a node equals the sum of currents leaving it."*\n\n**Mathematically:** ΣI_in = ΣI_out\n\n**Why it works:** Charge is conserved — it cannot accumulate at a node.\n\n---\n\n**How to apply KVL/KCL systematically:**\n1. Label all branch currents with assumed directions\n2. Apply KCL at each node\n3. Apply KVL around each independent loop\n4. Solve the system of simultaneous equations\n\n**Key takeaway:** KVL is energy conservation; KCL is charge conservation. Together they let you solve any linear circuit.`;
  }

  // Backpropagation / ML
  if (/backprop|neural network|machine learning|gradient|deep learning|loss function|weight/.test(q)) {
    return `Backpropagation is the engine that trains neural networks! 🧠\n\n**The Big Picture:**\nBackprop computes how much each weight in the network contributed to the error, then adjusts weights to reduce that error.\n\n**Step-by-Step:**\n\n1. **Forward Pass** — input flows through the network, each layer applies weights + activation → produces a prediction\n2. **Compute Loss** — compare prediction to actual label using a loss function (e.g. MSE, cross-entropy)\n3. **Backward Pass** — use the **chain rule** of calculus to compute ∂Loss/∂w for every weight\n4. **Update Weights** — gradient descent: w = w - η × ∂Loss/∂w\n\n**The Chain Rule in action:**\n\`\`\`\n∂Loss/∂w₁ = ∂Loss/∂ŷ × ∂ŷ/∂h × ∂h/∂w₁\n\`\`\`\nGradients flow *backwards* through each layer — hence \"backpropagation\".\n\n**Key concepts:**\n- **Learning rate (η)** — how big each update step is\n- **Vanishing gradients** — gradients shrink to ~0 in deep networks (ReLU helps fix this)\n- **Batch size** — how many samples before updating weights\n\n**Key takeaway:** Backprop is just the chain rule applied repeatedly backwards through the network, telling each weight how much it's responsible for the error.`;
  }

  // Calculus / differentiation
  if (/differentiat|integral|calculus|derivative|sin|cos|chain rule|product rule/.test(q)) {
    return `Let me work through this step-by-step! 📐\n\n**Differentiating sin(x²):**\n\nThis requires the **Chain Rule**: d/dx[f(g(x))] = f'(g(x)) · g'(x)\n\n**Step 1:** Identify the outer and inner functions\n- Outer function: f(u) = sin(u) → f'(u) = cos(u)\n- Inner function: g(x) = x² → g'(x) = 2x\n\n**Step 2:** Apply the chain rule\n\`\`\`\nd/dx[sin(x²)] = cos(x²) · d/dx[x²]\n              = cos(x²) · 2x\n              = 2x cos(x²)\n\`\`\`\n\n**Step 3:** Final answer\n\n> **d/dx[sin(x²)] = 2x cos(x²)**\n\n**Common differentiation rules:**\n\n| Function | Derivative |\n|---|---|\n| xⁿ | nxⁿ⁻¹ |\n| sin(x) | cos(x) |\n| cos(x) | -sin(x) |\n| eˣ | eˣ |\n| ln(x) | 1/x |\n\n**Key takeaway:** Always look for composite functions (function inside a function) — that's your signal to use the chain rule.`;
  }

  // OSI model / networking
  if (/osi|network|protocol|tcp|http|dns|layer|packet/.test(q)) {
    return `The **OSI Model** breaks networking into 7 clean layers 🌐\n\n| Layer | Name | Key Protocols | What it does |\n|---|---|---|---|\n| 7 | **Application** | HTTP, FTP, DNS, SMTP | User-facing apps & services |\n| 6 | **Presentation** | SSL/TLS, JPEG, ASCII | Encryption, compression, formatting |\n| 5 | **Session** | NetBIOS, RPC | Opens/manages/closes connections |\n| 4 | **Transport** | TCP, UDP | End-to-end delivery, error checking, ports |\n| 3 | **Network** | IP, ICMP, OSPF | Routing packets across networks |\n| 2 | **Data Link** | Ethernet, MAC, ARP | Node-to-node delivery on same network |\n| 1 | **Physical** | Wi-Fi, Fibre, Ethernet cable | Bits over physical medium |\n\n**Memory trick:** *"All People Seem To Need Data Processing"* (layers 7→1)\n\n**Most important layers to know:**\n- **Layer 3 (Network):** IP addresses, routing — where data goes\n- **Layer 4 (Transport):** TCP = reliable (3-way handshake); UDP = fast but no guarantees\n- **Layer 7 (Application):** What your browser and apps actually use\n\n**Key takeaway:** Each layer serves the one above it and communicates with the matching layer on the other device. Data is encapsulated as it goes down and de-encapsulated as it comes back up.`;
  }

  // Research paper / summarise
  if (/summaris|paper|research|abstract|methodology|journal|arxiv/.test(q)) {
    return `I'd love to analyse a research paper for you! 📚\n\nHere's the structure I'll use for any paper you share:\n\n---\n\n**📋 Overview**\nWhat problem does this paper solve? What is the main claim?\n\n**🔬 Methodology**\nWhat approach/technique did the authors use? What datasets or experiments?\n\n**📊 Key Results**\nWhat were the main findings? Were the results statistically significant?\n\n**✅ Strengths**\nWhat does this paper do well? Why is it cited?\n\n**⚠️ Limitations**\nWhat did the authors acknowledge as weaknesses? What's missing?\n\n**💡 Key Takeaways**\nWhat should a student remember from this paper?\n\n---\n\nTo get started, either:\n1. **Paste the abstract** or key sections into the chat\n2. **Attach the PDF** using the 📎 button below\n\nI'll give you a full structured breakdown!`;
  }

  // What can you do / capabilities
  if (/what can you|capabilities|features|help me with|what do you/.test(q)) {
    return `Here's everything I can help you with! 🚀\n\n**💻 Programming & Debugging**\n- Debug code in Python, JavaScript, Java, C++, Rust, Go, and more\n- Write functions, algorithms, data structures\n- Explain code line-by-line\n\n**📐 Mathematics**\n- Calculus: derivatives, integrals, limits (full step-by-step)\n- Linear algebra: matrices, eigenvalues, transformations\n- Statistics & probability\n- Discrete maths & proofs\n\n**⚙️ Engineering**\n- Circuits: KVL, KCL, Thevenin, Norton\n- Signals & Systems: Fourier, Laplace, Z-transform\n- Thermodynamics, fluid mechanics, control systems\n\n**🧠 AI & Machine Learning**\n- Neural networks, backpropagation, gradient descent\n- Model architectures: CNNs, Transformers, LSTMs\n- Loss functions, regularisation, hyperparameter tuning\n\n**📚 Research & Study**\n- Summarise research papers (attach PDF!)\n- Explain complex concepts in simple terms\n- Help structure essays and assignments\n\nJust ask me anything — I'm here to help you ace it! 🎓`;
  }

  // Thanks / positive feedback
  if (/thank|thanks|great|awesome|perfect|nice|good job|well done/.test(q)) {
    return `You're very welcome! 😊 That's what I'm here for.\n\nFeel free to ask me anything else — more questions, another topic, or dive deeper into what we just covered.\n\nYou're thinking like a real engineer already! 🚀`;
  }

  // Default fallback — still informative
  const userQ = (typeof last === 'string' ? last : 'your question').slice(0, 120);
  return `That's a great question! Let me help you with that. 🎓\n\n**"${userQ}"**\n\nAs your ScholarKit AI assistant, I can tackle this from several angles:\n\n1. **Conceptual explanation** — breaking down the theory clearly\n2. **Worked examples** — showing you the steps in action\n3. **Code implementation** — if it involves algorithms or data\n4. **Real-world application** — connecting it to engineering practice\n\nTry one of the **Quick Prompts** in the sidebar, or ask about any engineering/CS/maths topic!`;
}

// ── NOVA API CALL — proxied through server.js (or demo mode) ─────
async function callClaudeAPI(messages, _apiKey) {
  // ── DEMO MODE: return smart offline responses ──
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 900 + Math.random() * 700)); // realistic delay
    return getDemoResponse(messages);
  }

  const systemPrompt = TONE_PROMPTS[currentTone] || TONE_PROMPTS.friendly;

  // Keep last 20 messages; send only plain text (no file blobs to proxy)
  const apiMessages = messages.slice(-20).map(m => ({
    role: m.role,
    content: typeof m.content === 'string'
      ? m.content
      : Array.isArray(m.content)
        ? m.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
        : String(m.content)
  }));

  const res = await fetch(NOVA_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system:     systemPrompt,
      messages:   apiMessages,
      max_tokens: 1500
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.content && data.content[0]) {
    data.content[0].type = 'text';
  }

  const reply = (data.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text || '')
    .join('');

  if (!reply) throw new Error('Empty response from Claude');
  return reply;
}

// ── APPEND USER MESSAGE ──────────────────────────────────────────
function appendUserMessage(text, fileName) {
  const msgs = document.getElementById('chatMessages');
  const div  = document.createElement('div');
  div.className = 'message user';
  div.innerHTML = `
    <div class="msg-bubble">
      ${fileName ? `<div style="font-size:0.72rem;opacity:0.6;margin-bottom:4px;"><i class="fa-solid fa-paperclip"></i> ${escHtml(fileName)}</div>` : ''}
      ${escHtml(text).replace(/\n/g,'<br>')}
    </div>
    <div class="msg-avatar"><i class="fa-solid fa-circle-user"></i></div>`;
  const ts = document.createElement('div');
  ts.className = 'msg-time';
  ts.textContent = now();
  div.appendChild(ts);
  msgs.appendChild(div);
  scrollToBottom();
}

// ── APPEND ASSISTANT PLACEHOLDER ────────────────────────────────
function appendAssistantPlaceholder() {
  const msgs = document.getElementById('chatMessages');
  const div  = document.createElement('div');
  div.className = 'message assistant streaming';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.innerHTML = `
    <div class="cat cat-xs">
      <div class="cat-ear left"></div><div class="cat-ear right"></div>
      <div class="cat-head">
        <div class="cat-eye left"></div><div class="cat-eye right"></div>
        <div class="cat-nose"></div><div class="cat-mouth"></div>
        <div class="cat-whiskers"><span></span><span></span><span></span><span></span></div>
      </div>
      <div class="cat-body"><div class="cat-tail"></div><div class="cat-paw left"></div><div class="cat-paw right"></div></div>
    </div>`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  const thinking = document.createElement('div');
  thinking.className = 'thinking-indicator';
  thinking.innerHTML = `
    <span class="typing-dots"><span></span><span></span><span></span></span>
    <span class="thinking-text">Nova is thinking…</span>`;
  bubble.appendChild(thinking);

  div.appendChild(avatar);
  div.appendChild(bubble);
  msgs.appendChild(div);
  scrollToBottom();

  return { bubble, thinkingEl: thinking };
}

// ── STREAM RENDER ────────────────────────────────────────────────
async function streamRender(bubble, rawText) {
  const msgDiv = bubble.closest('.message');
  if (msgDiv) msgDiv.classList.remove('streaming');

  if (rawText.length < 100) {
    bubble.innerHTML = formatMessage(rawText);
    addTimestamp(bubble.closest('.message'));
    return;
  }

  bubble.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'opacity:0; transition: opacity 0.3s ease;';
  wrapper.innerHTML = formatMessage(rawText);
  bubble.appendChild(wrapper);
  await sleep(30);
  wrapper.style.opacity = '1';
  scrollToBottom();
  addTimestamp(bubble.closest('.message'));
}

function addTimestamp(msgDiv) {
  if (!msgDiv) return;
  const ts = document.createElement('div');
  ts.className = 'msg-time';
  ts.textContent = now();
  msgDiv.appendChild(ts);
}

// ── FORMAT MESSAGE (markdown → HTML) ────────────────────────────
function formatMessage(text) {
  let html = text;

  // Code blocks
  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
    const id = 'code_' + Math.random().toString(36).slice(2, 8);
    const escapedCode = escHtml(code.trim());
    const langLabel = lang || 'code';
    return `
      <div class="code-block-wrap">
        <div class="code-block-header">
          <span class="code-lang">${langLabel}</span>
          <button class="copy-code-btn" onclick="copyCode('${id}')">
            <i class="fa-regular fa-copy"></i> Copy
          </button>
        </div>
        <pre><code id="${id}" class="lang-${langLabel}">${escapedCode}</code></pre>
      </div>`;
  });

  // Inline code
  html = html.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Headings
  html = html.replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>');
  html = html.replace(/^## (.+)$/gm,  '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^# (.+)$/gm,   '<h2 class="md-h2">$1</h2>');
  // Numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="md-li">$1</li>');
  // Bullet lists
  html = html.replace(/^[-•] (.+)$/gm, '<li class="md-li-bullet">$1</li>');
  // HR
  html = html.replace(/^---$/gm, '<hr class="md-hr">');
  // Key takeaway highlight
  html = html.replace(/(Key takeaway[^:]*:)/gi, '<span class="key-takeaway">$1</span>');
  // Newlines
  html = html.replace(/\n/g, '<br>');
  // Clean double breaks after block elements
  html = html.replace(/(<\/(?:pre|ol|h[2-4]|hr)>)<br>/g, '$1');

  return html;
}

// ── COPY CODE ────────────────────────────────────────────────────
function copyCode(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.innerText).then(() => {
    const btn = el.closest('.code-block-wrap')?.querySelector('.copy-code-btn');
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      btn.style.color = '#4ade80';
      setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'; btn.style.color = ''; }, 2000);
    }
    showToast('Code copied!');
  });
}

// ── MESSAGE ACTIONS ──────────────────────────────────────────────
function addMessageActions(msgDiv, rawText) {
  if (!msgDiv) return;
  const actions = document.createElement('div');
  actions.className = 'msg-actions';
  actions.innerHTML = `
    <button class="msg-action-btn" onclick="reactToMessage(this,'👍')" title="Helpful">
      <i class="fa-regular fa-thumbs-up"></i>
    </button>
    <button class="msg-action-btn" onclick="reactToMessage(this,'👎')" title="Not helpful">
      <i class="fa-regular fa-thumbs-down"></i>
    </button>
    <button class="msg-action-btn" onclick="copyFullMessage(this)" data-text="${escAttr(rawText)}" title="Copy response">
      <i class="fa-regular fa-copy"></i>
    </button>`;
  msgDiv.appendChild(actions);
}

function reactToMessage(btn, emoji) {
  btn.parentElement?.querySelectorAll('.msg-action-btn').forEach(b => b.classList.remove('active-reaction'));
  btn.classList.add('active-reaction');
  btn.innerHTML = emoji;
  btn.style.transform = 'scale(1.4)';
  setTimeout(() => btn.style.transform = '', 200);
}

function copyFullMessage(btn) {
  navigator.clipboard.writeText(btn.dataset.text).then(() => {
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    btn.style.color = '#4ade80';
    setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i>'; btn.style.color = ''; }, 2000);
    showToast('Response copied!');
  });
}

// ── NOVA STATUS ──────────────────────────────────────────────────
function setNovaStatus(state) {
  const ring = document.getElementById('novaRing');
  if (!ring) return;
  ring.className = 'nova-status-ring';
  if (state === 'thinking') ring.classList.add('mood-thinking');
  else if (state === 'error') ring.classList.add('mood-error');
  else ring.classList.add('mood-ready');
}

// ── UPDATE SIDEBAR STATS ─────────────────────────────────────────
function updateStats() {
  const el = document.getElementById('statMessages');
  if (el) el.textContent = conversationHistory.filter(m => m.role === 'user').length;

  const last = lastUserMessage.toLowerCase();
  let topic = '—';
  if (/\bcode\b|python|javascript|function|algorithm|debug/.test(last)) topic = '💻 Code';
  else if (/math|calcul|integral|derivat|equation|algebra|matrix/.test(last)) topic = '📐 Math';
  else if (/circuit|electric|mechanic|thermodynamic|signal|physics/.test(last)) topic = '⚙️ Eng';
  else if (/paper|research|study|journal|article|pdf|summaris/.test(last)) topic = '📚 Research';
  else if (/image|photo|diagram|figure|chart/.test(last)) topic = '🖼️ Image';
  else if (last.length > 5) topic = '💬 General';
  const topicEl = document.getElementById('statTopics');
  if (topicEl && last.length > 5) topicEl.textContent = topic;

  const badge = document.getElementById('msgCountBadge');
  const total = conversationHistory.length;
  if (badge) badge.textContent = total === 0 ? '0 msgs' : `${total} msg${total !== 1 ? 's' : ''}`;
}

// ── SEND BUTTON STATE ────────────────────────────────────────────
function setSendButtonState(loading) {
  const btn = document.getElementById('sendBtn');
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<i class="fa-solid fa-spinner fa-spin"></i>'
    : '<i class="fa-solid fa-paper-plane"></i>';
}

// ── INPUT SHAKE ──────────────────────────────────────────────────
function shakeInput() {
  const box = document.querySelector('.input-box');
  if (!box) return;
  box.style.animation = 'none';
  void box.offsetHeight;
  box.style.animation = 'shake 0.4s ease';
  setTimeout(() => box.style.animation = '', 500);
}

// ── LOCAL STORAGE ────────────────────────────────────────────────
function saveToStorage() {
  try {
    const safe = conversationHistory
      .filter(m => typeof m.content === 'string')
      .slice(-30);
    localStorage.setItem('nova_history', JSON.stringify(safe));
  } catch(e) {}
}

function loadConversationFromStorage() {
  try {
    const saved = localStorage.getItem('nova_history');
    if (!saved) return;
    const history = JSON.parse(saved);
    if (!Array.isArray(history) || history.length === 0) return;
    conversationHistory = history;

    const msgs = document.getElementById('chatMessages');
    const wc   = document.getElementById('welcomeCard');
    const bar  = document.createElement('div');
    bar.className = 'restore-bar';
    bar.innerHTML = `
      <i class="fa-solid fa-clock-rotate-left"></i>
      <span>You have a previous session (${history.length} messages)</span>
      <button onclick="restoreSession()" class="restore-btn">Restore</button>
      <button onclick="dismissRestore(this)" class="restore-dismiss">✕</button>`;
    msgs.insertBefore(bar, wc);
  } catch(e) {}
}

function restoreSession() {
  const msgs = document.getElementById('chatMessages');
  document.getElementById('welcomeCard')?.remove();
  document.querySelector('.restore-bar')?.remove();

  conversationHistory.forEach(msg => {
    if (msg.role === 'user') {
      appendUserMessage(typeof msg.content === 'string' ? msg.content : '[File]');
    } else if (msg.role === 'assistant') {
      const div = document.createElement('div');
      div.className = 'message assistant';
      div.innerHTML = `
        <div class="msg-avatar">
          <div class="cat cat-xs">
            <div class="cat-ear left"></div><div class="cat-ear right"></div>
            <div class="cat-head">
              <div class="cat-eye left"></div><div class="cat-eye right"></div>
              <div class="cat-nose"></div><div class="cat-mouth"></div>
              <div class="cat-whiskers"><span></span><span></span><span></span><span></span></div>
            </div>
            <div class="cat-body"><div class="cat-tail"></div><div class="cat-paw left"></div><div class="cat-paw right"></div></div>
          </div>
        </div>
        <div class="msg-bubble">${formatMessage(msg.content)}</div>`;
      msgs.appendChild(div);
      addMessageActions(div, msg.content);
    }
  });
  messageCount = conversationHistory.length;
  updateStats();
  scrollToBottom();
}

function dismissRestore(btn) {
  btn.closest('.restore-bar')?.remove();
  conversationHistory = [];
  localStorage.removeItem('nova_history');
}

// ── SCROLL ───────────────────────────────────────────────────────
function scrollToBottom() {
  const msgs = document.getElementById('chatMessages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
  document.getElementById('scrollBtn')?.classList.remove('visible');
}

// ── TOAST ────────────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('copyToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── FRIENDLY ERRORS ──────────────────────────────────────────────
function getFriendlyError(err) {
  const msg = err.message || '';
  if (msg.includes('401') || msg.includes('authentication'))
    return 'Authentication error — check server token configuration.';
  if (msg.includes('credit') || msg.includes('balance') || msg.includes('402'))
    return 'API quota reached — check your GitHub token or try again later.';
  if (msg.includes('429'))
    return 'Rate limited! Wait a moment and retry.';
  if (msg.includes('500') || msg.includes('529'))
    return 'Server is busy. Try again in a moment.';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return 'No internet connection detected. Check your network.';
  if (msg.includes('overloaded'))
    return 'Server overloaded. Try again in a few seconds.';
  return 'Something went wrong: ' + (msg || 'Unknown error');
}

// ── UTILS ────────────────────────────────────────────────────────
function escHtml(t) {
  return String(t)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(t) {
  return String(t).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function now() {
  return new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}

// ═══════════════════════════════════════════════════════════════
//  NOVA MULTI-STEP AGENT ENGINE
//  Detects agentic queries → plans sub-tasks → executes each →
//  synthesises a final structured response with visible steps.
// ═══════════════════════════════════════════════════════════════

// ── 1. INTENT DETECTION ─────────────────────────────────────────
// Returns true when the query implies chained research/comparison work
function isAgentQuery(text) {
  if (!text || text.length < 15) return false;
  const t = text.toLowerCase();
  const agentPatterns = [
    /compare.*(paper|approach|method|model|technique)/,
    /find.*(top|best|recent|latest).*(paper|research|study|article)/,
    /summarise.*(multiple|several|top|3|three|few).*(paper|study)/,
    /research.*(and|then).*(compare|summarise|analyse)/,
    /which.*(approach|method|model|paper).*(best|better|production|recommend)/,
    /survey.*(field|topic|area|literature)/,
    /give me.*(overview|landscape|state of).*(research|field)/,
    /what are the.*(latest|recent|top).*(advance|development|paper|approach)/,
    /analyse.*(multiple|several|different).*(paper|method|approach)/,
    /look up.*(and|then).*(summarise|explain|compare)/,
  ];
  return agentPatterns.some(p => p.test(t));
}

// ── 2. THINKING PANEL ────────────────────────────────────────────
// Creates the animated step-by-step panel judges see in the demo
function createAgentPanel() {
  const msgs = document.getElementById('chatMessages');
  const wrap = document.createElement('div');
  wrap.className = 'message assistant streaming';
  wrap.id = 'agentMessageWrap';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.innerHTML = `
    <div class="cat cat-xs">
      <div class="cat-ear left"></div><div class="cat-ear right"></div>
      <div class="cat-head">
        <div class="cat-eye left"></div><div class="cat-eye right"></div>
        <div class="cat-nose"></div><div class="cat-mouth"></div>
        <div class="cat-whiskers"><span></span><span></span><span></span><span></span></div>
      </div>
      <div class="cat-body"><div class="cat-tail"></div><div class="cat-paw left"></div><div class="cat-paw right"></div></div>
    </div>`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  // Agent header
  const header = document.createElement('div');
  header.className = 'agent-header';
  header.innerHTML = `
    <div class="agent-header-inner">
      <span class="agent-badge"><i class="fa-solid fa-robot"></i> Agent Mode</span>
      <span class="agent-status-text" id="agentStatusText">Initialising…</span>
    </div>`;
  bubble.appendChild(header);

  // Steps list
  const stepsList = document.createElement('div');
  stepsList.className = 'agent-steps';
  stepsList.id = 'agentSteps';
  bubble.appendChild(stepsList);

  // Final answer area (hidden until ready)
  const answer = document.createElement('div');
  answer.className = 'agent-answer hidden';
  answer.id = 'agentAnswer';
  bubble.appendChild(answer);

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  msgs.appendChild(wrap);
  scrollToBottom();

  return { bubble, stepsList, answer, header };
}

// ── 3. STEP HELPERS ──────────────────────────────────────────────
function addAgentStep(stepsList, icon, label, status = 'pending') {
  const step = document.createElement('div');
  step.className = `agent-step agent-step-${status}`;
  const stepId = 'step_' + Math.random().toString(36).slice(2, 8);
  step.id = stepId;
  step.innerHTML = `
    <div class="agent-step-icon">${stepIconHtml(status, icon)}</div>
    <div class="agent-step-body">
      <div class="agent-step-label">${escHtml(label)}</div>
      <div class="agent-step-detail" id="${stepId}_detail"></div>
    </div>`;
  stepsList.appendChild(step);
  scrollToBottom();
  return stepId;
}

function updateAgentStep(stepId, status, detail = '') {
  const step = document.getElementById(stepId);
  if (!step) return;
  step.className = `agent-step agent-step-${status}`;
  const iconEl = step.querySelector('.agent-step-icon');
  const label = step.querySelector('.agent-step-label').textContent;
  if (iconEl) iconEl.innerHTML = stepIconHtml(status, stepEmoji(label));
  if (detail) {
    const detailEl = document.getElementById(stepId + '_detail');
    if (detailEl) detailEl.textContent = detail;
  }
  scrollToBottom();
}

function stepIconHtml(status, fallback = '•') {
  if (status === 'running')  return '<span class="step-spinner"></span>';
  if (status === 'done')     return '<span class="step-done">✓</span>';
  if (status === 'error')    return '<span class="step-err">✕</span>';
  return `<span class="step-pending">${fallback}</span>`;
}

function stepEmoji(label) {
  if (/plan/i.test(label))     return '🧠';
  if (/search|query/i.test(label)) return '🔍';
  if (/fetch|read|load/i.test(label)) return '📄';
  if (/analys|extract/i.test(label)) return '🔬';
  if (/synth|compar|final/i.test(label)) return '✍️';
  return '⚙️';
}

// ── 4. PLAN GENERATOR ────────────────────────────────────────────
// Asks gpt-4o-mini to decompose the query into 2-4 research sub-tasks
async function planAgentTasks(query) {
  const planPrompt = `You are a research planning agent. The user asked:
"${query}"

Decompose this into 2 to 4 specific research sub-tasks. Each sub-task should be a focused search query or analytical step that, together, fully answers the user's question.

Respond ONLY with a JSON array of objects. Each object must have:
- "task": short label (max 8 words)  
- "query": the specific question or search to resolve this sub-task
- "type": one of "research", "compare", "analyse", "summarise"

Example format:
[
  {"task": "Find top RAG papers from 2024", "query": "What are the most cited RAG (Retrieval Augmented Generation) approaches published in 2024?", "type": "research"},
  {"task": "Compare production readiness", "query": "Compare the production-readiness of naive RAG vs advanced RAG vs modular RAG approaches", "type": "compare"}
]

Return ONLY valid JSON. No markdown. No explanation.`;

  const res = await fetch(NOVA_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: 'You are a JSON-only planning agent. Output only valid JSON arrays, nothing else.',
      messages: [{ role: 'user', content: planPrompt }],
      max_tokens: 600
    })
  });

  if (!res.ok) throw new Error(`Planner HTTP ${res.status}`);
  const data = await res.json();
  const raw = (data.content || []).map(b => b.text || '').join('').trim();

  // Strip markdown fences if model adds them
  const clean = raw.replace(/^```json?\n?/i, '').replace(/```$/,'').trim();
  return JSON.parse(clean);
}

// ── 5. TASK EXECUTOR ─────────────────────────────────────────────
// Executes one sub-task. When webSearchEnabled, fetches a real page first.
async function executeTask(task, systemContext) {
  let contextPrefix = '';

  if (webSearchEnabled) {
    try {
      // Plan one best URL for this specific sub-task
      const urls = await planBrowseUrls(task.query);
      if (urls.length) {
        const r = await fetchBrowsedContent(urls[0]);
        contextPrefix = `REAL WEB CONTENT from ${r.url}:\n${r.text}\n\nUsing the above as your primary source, `;
      }
    } catch(e) {
      console.warn('Sub-task browse failed:', e.message);
    }
  }

  const res = await fetch(NOVA_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: `You are Nova, a research AI assistant. Be thorough but concise. 
Focus only on the specific question asked. Use **bold** for key terms. 
Keep your answer to 150-250 words. End with one key insight.
${systemContext}`,
      messages: [{ role: 'user', content: contextPrefix + task.query }],
      max_tokens: 500
    })
  });

  if (!res.ok) throw new Error(`Task HTTP ${res.status}`);
  const data = await res.json();
  return (data.content || []).map(b => b.text || '').join('').trim();
}

// ── 6. FINAL SYNTHESISER ─────────────────────────────────────────
// Takes all sub-task results and writes a structured final answer
async function synthesiseResults(originalQuery, tasks, results) {
  const context = tasks.map((t, i) =>
    `## Sub-task ${i + 1}: ${t.task}\n${results[i]}`
  ).join('\n\n');

  const synthPrompt = `The user originally asked: "${originalQuery}"

I have gathered the following research across ${tasks.length} sub-tasks:

${context}

Now write a comprehensive, well-structured final answer that:
1. Directly answers the user's original question
2. Synthesises insights across all sub-tasks
3. Uses clear headings (##) and bullet points
4. Gives a concrete recommendation or conclusion at the end
5. Cites which sub-task each key point came from

Format the answer in clean markdown. Be definitive and actionable.`;

  const res = await fetch(NOVA_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: TONE_PROMPTS[currentTone] || TONE_PROMPTS.friendly,
      messages: [{ role: 'user', content: synthPrompt }],
      max_tokens: 1500
    })
  });

  if (!res.ok) throw new Error(`Synthesiser HTTP ${res.status}`);
  const data = await res.json();
  return (data.content || []).map(b => b.text || '').join('').trim();
}

// ── 7. MAIN AGENT ORCHESTRATOR ───────────────────────────────────
async function runAgentFlow(query) {
  setNovaStatus('thinking');
  const { bubble, stepsList, answer } = createAgentPanel();

  const setStatus = (text) => {
    const el = document.getElementById('agentStatusText');
    if (el) el.textContent = text;
  };

  try {
    // ── STEP 0: Planning ──────────────────────────────────────
    const planStepId = addAgentStep(stepsList, '🧠', 'Planning research approach', 'running');
    setStatus('Analysing your query…');
    await sleep(300);

    let tasks;
    try {
      tasks = await planAgentTasks(query);
      if (!Array.isArray(tasks) || tasks.length === 0) throw new Error('Empty plan');
    } catch(e) {
      // Fallback: create sensible default tasks from query
      tasks = [
        { task: 'Research the topic',   query: query, type: 'research' },
        { task: 'Analyse key findings', query: `What are the most important insights and conclusions about: ${query}`, type: 'analyse' },
        { task: 'Compare approaches',   query: `Compare different approaches or perspectives on: ${query}`, type: 'compare' }
      ];
    }

    updateAgentStep(planStepId, 'done', `${tasks.length} sub-tasks identified`);
    setStatus(`Executing ${tasks.length} research tasks…`);

    // ── STEPS 1..N: Execute each sub-task ────────────────────
    const results = [];
    const systemContext = `Original user question: "${query}"`;

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const icon = ['🔍','📄','🔬','✍️'][i] || '⚙️';
      const stepId = addAgentStep(stepsList, icon, t.task, 'running');
      setStatus(`${icon} ${t.task}…`);
      scrollToBottom();

      try {
        const result = await executeTask(t, systemContext);
        results.push(result);
        // Show a short preview in the step detail
        const preview = result.replace(/\*\*/g,'').slice(0, 80) + '…';
        updateAgentStep(stepId, 'done', preview);
      } catch(e) {
        results.push(`Could not complete: ${e.message}`);
        updateAgentStep(stepId, 'error', 'Task failed — using available data');
      }

      await sleep(200);
    }

    // ── FINAL STEP: Synthesis ─────────────────────────────────
    const synthStepId = addAgentStep(stepsList, '✍️', 'Synthesising final answer', 'running');
    setStatus('Writing comprehensive answer…');
    scrollToBottom();

    const finalAnswer = await synthesiseResults(query, tasks, results);
    updateAgentStep(synthStepId, 'done', 'Answer ready');
    setStatus('Done ✓');

    // ── REVEAL FINAL ANSWER ───────────────────────────────────
    await sleep(300);
    answer.classList.remove('hidden');
    answer.innerHTML = `
      <div class="agent-answer-divider">
        <span><i class="fa-solid fa-stars"></i> Final Answer</span>
      </div>
      <div class="agent-answer-body">${formatMessage(finalAnswer)}</div>`;

    // Add to conversation history & actions
    conversationHistory.push({ role: 'assistant', content: finalAnswer });
    saveToStorage();
    addMessageActions(bubble.closest('.message'), finalAnswer);
    bubble.closest('.message')?.classList.remove('streaming');
    setNovaStatus('ready');
    messageCount++;
    updateStats();
    scrollToBottom();

  } catch (err) {
    setStatus('Agent encountered an error');
    const errDiv = document.createElement('div');
    errDiv.className = 'error-msg';
    errDiv.innerHTML = `
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span>${escHtml(getFriendlyError(err))}</span>
      <button onclick="retryLast()" class="retry-btn"><i class="fa-solid fa-rotate-right"></i> Retry</button>`;
    bubble.appendChild(errDiv);
    setNovaStatus('error');
    console.error('Agent error:', err);
  }
}

// ── 8. AGENT STYLES ──────────────────────────────────────────────
(function injectAgentStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* ── Agent header ── */
    .agent-header { margin-bottom: 12px; }
    .agent-header-inner {
      display: flex; align-items: center; gap: 10px;
      flex-wrap: wrap;
    }
    .agent-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(24,95,165,0.18);
      border: 1px solid rgba(24,95,165,0.35);
      color: #93c5fd;
      font-size: 0.72rem; font-weight: 600;
      padding: 3px 10px; border-radius: 999px;
      text-transform: uppercase; letter-spacing: 0.4px;
    }
    .agent-status-text {
      font-size: 0.78rem; color: #94a3b8;
      font-style: italic;
    }

    /* ── Steps list ── */
    .agent-steps {
      display: flex; flex-direction: column; gap: 8px;
      margin-bottom: 4px;
    }
    .agent-step {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 9px 12px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.03);
      transition: all 0.3s ease;
      animation: stepIn 0.25s ease both;
    }
    @keyframes stepIn {
      from { opacity: 0; transform: translateX(-8px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .agent-step-running {
      border-color: rgba(147,197,253,0.25);
      background: rgba(24,95,165,0.08);
    }
    .agent-step-done {
      border-color: rgba(74,222,128,0.2);
      background: rgba(34,197,94,0.05);
    }
    .agent-step-error {
      border-color: rgba(239,68,68,0.2);
      background: rgba(239,68,68,0.05);
    }
    .agent-step-icon {
      flex-shrink: 0;
      width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem;
      margin-top: 1px;
    }
    .step-spinner {
      display: inline-block;
      width: 14px; height: 14px;
      border: 2px solid rgba(147,197,253,0.3);
      border-top-color: #93c5fd;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .step-done  { color: #4ade80; font-weight: 700; }
    .step-err   { color: #f87171; font-weight: 700; }
    .step-pending { color: #475569; }

    .agent-step-label {
      font-size: 0.85rem; color: #e2e8f0; font-weight: 500;
      line-height: 1.4;
    }
    .agent-step-detail {
      font-size: 0.75rem; color: #64748b;
      margin-top: 2px; line-height: 1.4;
    }

    /* ── Final answer ── */
    .agent-answer { margin-top: 16px; }
    .agent-answer.hidden { display: none; }
    .agent-answer-divider {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 12px;
    }
    .agent-answer-divider span {
      font-size: 0.78rem; font-weight: 600;
      color: #93c5fd; text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex; align-items: center; gap: 6px;
    }
    .agent-answer-divider::after {
      content: ''; flex: 1; height: 1px;
      background: rgba(147,197,253,0.15);
    }
    .agent-answer-body {
      animation: fadeIn 0.4s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
})();
// ═══════════════════════════════════════════════════════════════
//  NOVA SHARE SESSION — Share & read-only link feature
//  Encodes conversation into URL hash (no server storage needed)
//  Supports: copy shareable link + export PDF summary
// ═══════════════════════════════════════════════════════════════

// ── OPEN / CLOSE MODAL ──────────────────────────────────────────
function openShareModal() {
  if (conversationHistory.length === 0) {
    showToast('💬 Start a conversation first — then share it!');
    return;
  }
  buildSharePreview();
  // Pre-fill title from first user message
  const firstUser = conversationHistory.find(m => m.role === 'user');
  const titleInput = document.getElementById('shareTitle');
  if (titleInput && firstUser && !titleInput.value) {
    const raw = typeof firstUser.content === 'string'
      ? firstUser.content
      : (firstUser.content[0]?.text || '');
    titleInput.value = raw.slice(0, 60) + (raw.length > 60 ? '…' : '');
  }
  document.getElementById('shareModalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('shareTitle')?.focus(), 250);
}

function closeShareModal(e) {
  if (e && e.target !== document.getElementById('shareModalOverlay')) return;
  document.getElementById('shareModalOverlay').classList.remove('open');
  // Reset copy button
  const btn = document.getElementById('smCopyLinkBtn');
  if (btn) {
    btn.classList.remove('copied');
    btn.innerHTML = '<i class="fa-solid fa-link"></i><span>Copy shareable link</span>';
  }
}

// ── BUILD PREVIEW ────────────────────────────────────────────────
function buildSharePreview() {
  const preview = document.getElementById('smPreview');
  if (!preview) return;

  const textHistory = conversationHistory.filter(m => typeof m.content === 'string');
  if (textHistory.length === 0) {
    preview.innerHTML = '<div class="sm-preview-empty"><i class="fa-solid fa-comment-slash"></i> No text messages to share.</div>';
    return;
  }

  preview.innerHTML = textHistory.slice(0, 6).map(m => {
    const roleLabel = m.role === 'user' ? 'You' : 'Nova';
    const roleClass = m.role === 'user' ? 'user' : 'nova';
    const text = m.content.replace(/\*\*/g, '').replace(/```[\s\S]*?```/g, '[code block]').slice(0, 120);
    return `<div class="sm-preview-msg">
      <span class="sm-preview-role ${roleClass}">${roleLabel}</span>
      <span class="sm-preview-text">${escHtml(text)}${m.content.length > 120 ? '…' : ''}</span>
    </div>`;
  }).join('') + (textHistory.length > 6
    ? `<div style="font-size:0.72rem;color:rgba(255,255,255,.25);text-align:center;margin-top:6px;font-family:'Poppins',sans-serif;">+${textHistory.length - 6} more messages</div>`
    : '');
}

// ── ENCODE / DECODE SESSION ──────────────────────────────────────
function encodeSession(title) {
  const payload = {
    v: 1,
    title: title || 'Nova Chat',
    ts: Date.now(),
    msgs: conversationHistory
      .filter(m => typeof m.content === 'string')
      .slice(-40)
      .map(m => ({ r: m.role === 'user' ? 'u' : 'a', t: m.content }))
  };
  try {
    const json = JSON.stringify(payload);
    const compressed = btoa(encodeURIComponent(json));
    return compressed;
  } catch(e) {
    return null;
  }
}

function decodeSession(hash) {
  try {
    const json = decodeURIComponent(atob(hash));
    const payload = JSON.parse(json);
    if (!payload.v || !Array.isArray(payload.msgs)) return null;
    return {
      title: payload.title || 'Nova Chat',
      ts: payload.ts,
      msgs: payload.msgs.map(m => ({
        role: m.r === 'u' ? 'user' : 'assistant',
        content: m.t
      }))
    };
  } catch(e) {
    return null;
  }
}

// ── SHARE VIA LINK ───────────────────────────────────────────────
function shareViaLink() {
  const title = document.getElementById('shareTitle')?.value.trim() || 'Nova Chat';
  const encoded = encodeSession(title);
  if (!encoded) {
    showToast('⚠ Could not encode session — try a shorter conversation.');
    return;
  }

  const url = `${location.origin}${location.pathname}?share=${encoded}#${encodeURIComponent(title)}`;

  if (url.length > 16000) {
    showToast('⚠ Conversation too long to encode in a URL. Try exporting as PDF instead.');
    return;
  }

  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('smCopyLinkBtn');
    if (btn) {
      btn.classList.add('copied');
      btn.innerHTML = '<i class="fa-solid fa-check"></i><span>Link copied!</span>';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = '<i class="fa-solid fa-link"></i><span>Copy shareable link</span>';
      }, 3000);
    }
    showToast('🔗 Shareable link copied to clipboard!');
  }).catch(() => {
    // Fallback: prompt
    window.prompt('Copy this link:', url);
  });
}

// ── EXPORT PDF ───────────────────────────────────────────────────
function exportSessionPDF() {
  const title = document.getElementById('shareTitle')?.value.trim() || 'Nova Chat Session';
  const textHistory = conversationHistory.filter(m => typeof m.content === 'string');
  if (textHistory.length === 0) {
    showToast('💬 No messages to export yet!');
    return;
  }

  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  // Build a clean printable HTML document
  const printHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
    .pdf-header { border-bottom: 2px solid #2dd4bf; padding-bottom: 20px; margin-bottom: 28px; }
    .pdf-title { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    .pdf-meta { font-size: 12px; color: #64748b; }
    .pdf-meta span { margin-right: 16px; }
    .message { margin-bottom: 20px; page-break-inside: avoid; }
    .msg-role { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .msg-role.user { color: #3b82f6; }
    .msg-role.nova { color: #0d9488; }
    .msg-role.user::before { content: '👤 '; }
    .msg-role.nova::before { content: '🐱 '; }
    .msg-content { font-size: 14px; line-height: 1.7; color: #374151; background: #f8fafc; border-radius: 8px; padding: 14px 16px; border-left: 3px solid #e2e8f0; white-space: pre-wrap; word-break: break-word; }
    .msg-content.nova-msg { border-left-color: #2dd4bf; }
    .pdf-footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="pdf-header">
    <div class="pdf-title">${escHtml(title)}</div>
    <div class="pdf-meta">
      <span>📅 ${dateStr}</span>
      <span>💬 ${textHistory.length} messages</span>
      <span>⚡ Powered by Nova — ScholarKit AI</span>
    </div>
  </div>
  ${textHistory.map(m => `
  <div class="message">
    <div class="msg-role ${m.role === 'user' ? 'user' : 'nova'}">${m.role === 'user' ? 'You' : 'Nova AI'}</div>
    <div class="msg-content ${m.role === 'assistant' ? 'nova-msg' : ''}">${escHtml(m.content)}</div>
  </div>`).join('')}
  <div class="pdf-footer">Exported from ScholarKit · Nova AI Assistant · scholarkit.app</div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    showToast('⚠ Pop-up blocked — please allow pop-ups and try again.');
    return;
  }
  win.document.write(printHTML);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 600);
  showToast('📄 PDF export opened — use Print → Save as PDF');
  closeShareModal();
}

// ── READ-ONLY VIEW: load from URL on page open ───────────────────
(function checkSharedView() {
  const params = new URLSearchParams(location.search);
  const shareData = params.get('share');
  if (!shareData) return;

  // Decode and render as read-only
  document.addEventListener('DOMContentLoaded', () => {
    const session = decodeSession(shareData);
    if (!session) return;

    // Mark body as shared view (hides input, toolbar, etc.)
    document.body.classList.add('shared-view');

    // Show read-only banner
    const banner = document.getElementById('sharedViewBanner');
    const titleEl = document.getElementById('svbTitle');
    if (banner) banner.style.display = 'block';
    if (titleEl) titleEl.textContent = session.title;

    // Update page title
    document.title = `${session.title} — Nova Session`;

    // Update model pill
    setTimeout(() => {
      const pill = document.querySelector('.model-pill');
      if (pill) pill.innerHTML = '<span class="dot" style="background:#f59e0b"></span> shared session · read-only';
    }, 100);

    // Render messages into chat
    setTimeout(() => {
      const msgs = document.getElementById('chatMessages');
      if (!msgs) return;
      msgs.innerHTML = '';

      // Shared session header card
      const header = document.createElement('div');
      header.style.cssText = `
        text-align:center; padding: 28px 20px 20px;
        border-bottom: 1px solid rgba(255,255,255,.06);
        margin-bottom: 12px;
      `;
      const sharedDate = session.ts
        ? new Date(session.ts).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })
        : '';
      header.innerHTML = `
        <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(45,212,191,.08);border:1px solid rgba(45,212,191,.2);border-radius:20px;padding:6px 16px;margin-bottom:14px;">
          <i class="fa-solid fa-share-nodes" style="color:#2dd4bf;font-size:.75rem"></i>
          <span style="font-size:.75rem;color:#2dd4bf;font-family:'Poppins',sans-serif;font-weight:600;">Shared Nova Session</span>
        </div>
        <h3 style="font-family:'Space Grotesk',sans-serif;color:#fff;font-size:1.1rem;margin-bottom:6px;">${escHtml(session.title)}</h3>
        ${sharedDate ? `<p style="font-size:.75rem;color:rgba(255,255,255,.35);font-family:'Poppins',sans-serif;margin:0;">${sharedDate} · ${session.msgs.length} messages</p>` : ''}`;
      msgs.appendChild(header);

      // Render each message
      session.msgs.forEach(m => {
        if (m.role === 'user') {
          const div = document.createElement('div');
          div.className = 'message user';
          div.innerHTML = `
            <div class="msg-bubble">${escHtml(m.content).replace(/\n/g,'<br>')}</div>
            <div class="msg-avatar"><i class="fa-solid fa-circle-user"></i></div>`;
          msgs.appendChild(div);
        } else {
          const div = document.createElement('div');
          div.className = 'message assistant';
          div.innerHTML = `
            <div class="msg-avatar">
              <div class="cat cat-xs">
                <div class="cat-ear left"></div><div class="cat-ear right"></div>
                <div class="cat-head">
                  <div class="cat-eye left"></div><div class="cat-eye right"></div>
                  <div class="cat-nose"></div><div class="cat-mouth"></div>
                  <div class="cat-whiskers"><span></span><span></span><span></span><span></span></div>
                </div>
                <div class="cat-body"><div class="cat-tail"></div><div class="cat-paw left"></div><div class="cat-paw right"></div></div>
              </div>
            </div>
            <div class="msg-bubble">${formatMessage(m.content)}</div>`;
          msgs.appendChild(div);
        }
      });

      // Bottom CTA
      const cta = document.createElement('div');
      cta.style.cssText = 'text-align:center;padding:24px 20px 8px;';
      cta.innerHTML = `
        <a href="ai-assistant.html" style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#2dd4bf,#0ea5e9);color:#fff;font-family:'Poppins',sans-serif;font-size:.85rem;font-weight:600;padding:10px 22px;border-radius:12px;text-decoration:none;transition:opacity .2s;" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
          <i class="fa-solid fa-robot"></i> Chat with Nova yourself
        </a>`;
      msgs.appendChild(cta);
      msgs.scrollTop = 0;
    }, 200);
  });
})();