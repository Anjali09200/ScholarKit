// ═══════════════════════════════════════════════════
//  server.js — Nova Proxy Server for ScholarKit
//  Powered by GitHub Models (Microsoft Azure AI)
//  FREE — just needs a GitHub personal access token
//  Run: node server.js
// ═══════════════════════════════════════════════════

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

require('dotenv').config();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.json': 'application/json',
};

// ── BROWSE HELPER: fetch a URL and return clean text ──────────────
function browseUrl(targetUrl) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(targetUrl);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: parsed.hostname,
      path:     parsed.path || '/',
      method:   'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NovaBot/1.0; ScholarKit)',
        'Accept':     'text/html,application/xhtml+xml,*/*',
      },
      timeout: 10000,
    };

    const req = lib.request(options, (res) => {
      // Follow one redirect
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        return browseUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} from ${targetUrl}`));
      }

      let raw = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { raw += chunk; if (raw.length > 500_000) res.destroy(); });
      res.on('end', () => {
        // Strip HTML tags, scripts, styles — keep readable text
        let text = raw
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/[ \t]{2,}/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        // Trim to ~8000 chars so it fits in the model context
        if (text.length > 8000) text = text.slice(0, 8000) + '\n\n[... content truncated ...]';

        resolve({ text, url: targetUrl, length: text.length });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.end();
  });
}

const server = http.createServer((req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── PROXY: POST /api/chat → GitHub Models ──────────────────────
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Invalid JSON' } }));
        return;
      }

      const messages = [];
      if (parsed.system) messages.push({ role: 'system', content: parsed.system });
      if (Array.isArray(parsed.messages)) {
        parsed.messages.forEach(m => {
          if (typeof m.content === 'string') messages.push({ role: m.role, content: m.content });
        });
      }

      const payload = JSON.stringify({
        model:      'gpt-4o-mini',
        max_tokens: parsed.max_tokens || 1500,
        messages:   messages
      });

      const options = {
        hostname: 'models.inference.ai.azure.com',
        path:     '/chat/completions',
        method:   'POST',
        headers: {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Authorization':  `Bearer ${GITHUB_TOKEN}`,
        }
      };

      console.log('→ Sending request to GitHub Models (gpt-4o-mini)...');

      const proxy = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              console.error('GitHub Models error:', parsed.error);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: parsed.error }));
              return;
            }
            const text = parsed.choices?.[0]?.message?.content || '';
            console.log('✓ Nova responded (' + text.length + ' chars)');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ content: [{ type: 'text', text }] }));
          } catch(e) {
            console.error('Parse error:', e.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { message: 'Failed to parse response' } }));
          }
        });
      });

      proxy.on('error', (err) => {
        console.error('Proxy error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Proxy error: ' + err.message } }));
      });

      proxy.write(payload);
      proxy.end();
    });
    return;
  }

  // ── BROWSE: POST /api/browse → fetch URL → return clean text ───
  // Body: { url: "https://..." }
  // Returns: { text, url, length } or { error }
  if (req.method === 'POST' && req.url === '/api/browse') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      const targetUrl = parsed.url;
      if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing or invalid url — must start with http:// or https://' }));
        return;
      }

      console.log('🌐 Browsing:', targetUrl);
      try {
        const result = await browseUrl(targetUrl);
        console.log(`✓ Fetched ${result.length} chars from ${targetUrl}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch(err) {
        console.error('Browse error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ── STATIC FILE SERVER ─────────────────────────────────────────
  let filePath = '.' + req.url;
  if (filePath === './') filePath = './index.html';
  if (!path.extname(filePath)) filePath += '.html';

  const ext         = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h2>404 — File not found</h2>');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log('\n🚀 Nova is live — Powered by Microsoft GitHub Models!');
  console.log('🤖 Model: gpt-4o-mini (via Azure AI)');
  console.log(`👉 Open: http://localhost:${PORT}/ai-assistant.html`);
  console.log('🌐 Browse route: POST /api/browse { url: "https://..." }');
  console.log('📁 Serving from:', path.resolve('.'));

  if (!GITHUB_TOKEN) {
    console.warn('\n⚠️  WARNING: GITHUB_TOKEN is not set!');
    console.warn('   Create a .env file with: GITHUB_TOKEN=ghp_your_token_here\n');
  } else {
    console.log('✅ GitHub token loaded (' + GITHUB_TOKEN.slice(0,8) + '...)');
  }

  console.log('\nPress Ctrl+C to stop.\n');

  const url2 = `http://localhost:${PORT}/index.html`;
  const cmd = process.platform === 'darwin' ? 'open'
            : process.platform === 'win32'  ? 'start'
            : 'xdg-open';
  require('child_process').exec(`${cmd} ${url2}`);
});
