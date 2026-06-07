/* ============================================================
   engg.js — Sci-Fi Interactivity for ScholarKit Engineering Page
   Futuristic | Holographic | Interactive
   ============================================================ */

   (function () {
    "use strict";
  
    /* ══════════════════════════════════════════════
       1. TYPEWRITER EFFECT — Hero subtitle
    ══════════════════════════════════════════════ */
    function initTypewriter() {
      const el = document.querySelector(".eng-hero-subtitle");
      if (!el) return;
      const original = el.textContent.trim();
      el.textContent = "";
      el.style.borderRight = "2px solid #93c5fd";
      el.style.display = "inline-block";
      let i = 0;
      const speed = 28;
      function type() {
        if (i < original.length) {
          el.textContent += original[i++];
          setTimeout(type, speed);
        } else {
          setTimeout(() => { el.style.borderRight = "none"; }, 800);
        }
      }
      setTimeout(type, 600);
    }
  
    /* ══════════════════════════════════════════════
       2. PARTICLE CANVAS — Floating sci-fi dots
    ══════════════════════════════════════════════ */
    function initParticles() {
      const hero = document.querySelector(".eng-hero");
      if (!hero) return;
      const canvas = document.createElement("canvas");
      canvas.id = "eng-particles";
      canvas.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.45;";
      hero.querySelector(".eng-hero-bg").appendChild(canvas);
  
      const ctx = canvas.getContext("2d");
      let W, H, particles = [];
  
      function resize() {
        W = canvas.width = hero.offsetWidth;
        H = canvas.height = hero.offsetHeight;
      }
  
      class Particle {
        constructor() { this.reset(); }
        reset() {
          this.x = Math.random() * W;
          this.y = Math.random() * H;
          this.r = Math.random() * 1.6 + 0.4;
          this.vx = (Math.random() - 0.5) * 0.4;
          this.vy = (Math.random() - 0.5) * 0.4;
          this.alpha = Math.random() * 0.7 + 0.2;
          this.color = Math.random() > 0.5 ? "#93c5fd" : "#4ade80";
        }
        update() {
          this.x += this.vx; this.y += this.vy;
          if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
        }
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.globalAlpha = this.alpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
  
      function init() {
        resize();
        particles = Array.from({ length: 90 }, () => new Particle());
      }
  
      function drawLines() {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = "rgba(147,197,253,0.08)";
              ctx.lineWidth = 0.5;
              ctx.globalAlpha = 1 - dist / 100;
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          }
        }
      }
  
      function loop() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        drawLines();
        requestAnimationFrame(loop);
      }
  
      window.addEventListener("resize", resize);
      init();
      loop();
    }
  
    /* ══════════════════════════════════════════════
       3. SCROLL REVEAL — Cards fade in on scroll
    ══════════════════════════════════════════════ */
    function initScrollReveal() {
      const cards = document.querySelectorAll(".tool-card-wrap");
      cards.forEach((card, i) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(30px)";
        card.style.transition = `opacity 0.5s ease ${(i % 6) * 0.07}s, transform 0.5s ease ${(i % 6) * 0.07}s`;
      });
  
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = "1";
              entry.target.style.transform = "translateY(0)";
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
  
      cards.forEach((c) => observer.observe(c));
    }
  
    /* ══════════════════════════════════════════════
       4. HOLOGRAPHIC TILT — Cards tilt on hover
    ══════════════════════════════════════════════ */
    function initTiltEffect() {
      document.querySelectorAll(".eng-card").forEach((card) => {
        card.addEventListener("mousemove", (e) => {
          const rect = card.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = (e.clientX - cx) / (rect.width / 2);
          const dy = (e.clientY - cy) / (rect.height / 2);
          card.style.transform = `translateY(-6px) rotateX(${-dy * 6}deg) rotateY(${dx * 6}deg)`;
          card.style.transition = "transform 0.1s ease";
  
          /* Holographic sheen */
          const sheen = `radial-gradient(circle at ${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%, rgba(147,197,253,0.12) 0%, transparent 65%)`;
          card.style.backgroundImage = sheen;
        });
  
        card.addEventListener("mouseleave", () => {
          card.style.transform = "";
          card.style.transition = "transform 0.4s ease, box-shadow 0.25s, border-color 0.25s, background 0.25s";
          card.style.backgroundImage = "";
        });
      });
    }
  
    /* ══════════════════════════════════════════════
       5. SCAN LINE EFFECT — Hero overlay
    ══════════════════════════════════════════════ */
    function initScanLines() {
      const bg = document.querySelector(".eng-hero-bg");
      if (!bg) return;
      const scan = document.createElement("div");
      scan.style.cssText = `
        position:absolute;inset:0;pointer-events:none;z-index:1;
        background: repeating-linear-gradient(
          0deg,
          rgba(0,0,0,0.03) 0px,
          rgba(0,0,0,0.03) 1px,
          transparent 1px,
          transparent 3px
        );
      `;
      bg.appendChild(scan);
    }
  
    /* ══════════════════════════════════════════════
       6. LIVE COUNTER — Stats bar above tools
    ══════════════════════════════════════════════ */
    function initStatsBar() {
      const section = document.querySelector(".eng-tools-section .container");
      if (!section) return;
  
      const bar = document.createElement("div");
      bar.className = "eng-stats-bar";
      bar.innerHTML = `
        <div class="eng-stat">
          <span class="eng-stat-num" data-target="15">0</span>
          <span class="eng-stat-label">Tools Available</span>
        </div>
        <div class="eng-stat">
          <span class="eng-stat-num" data-target="5">0</span>
          <span class="eng-stat-label">Categories</span>
        </div>
        <div class="eng-stat">
          <span class="eng-stat-num" data-target="100">0</span>
          <span class="eng-stat-label">% Free</span>
        </div>
        <div class="eng-stat">
          <span class="eng-stat-num" data-target="24">0</span>
          <span class="eng-stat-label">hrs / day Access</span>
        </div>
      `;
  
      /* Inject styles */
      const style = document.createElement("style");
      style.textContent = `
        .eng-stats-bar {
          display: flex; justify-content: center; flex-wrap: wrap;
          gap: 1rem; margin-bottom: 3rem;
          background: rgba(24,95,165,0.07);
          border: 1px solid rgba(24,95,165,0.2);
          border-radius: 16px; padding: 1.25rem 2rem;
        }
        .eng-stat {
          text-align: center; min-width: 100px;
          position: relative; padding: 0 1.5rem;
        }
        .eng-stat:not(:last-child)::after {
          content: ''; position: absolute; right: 0; top: 10%; height: 80%;
          width: 1px; background: rgba(147,197,253,0.15);
        }
        .eng-stat-num {
          display: block; font-size: 2rem; font-weight: 700;
          background: linear-gradient(90deg,#93c5fd,#4ade80);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; line-height: 1.2;
        }
        .eng-stat-label {
          font-size: 0.72rem; color: #94a3b8; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
      `;
      document.head.appendChild(style);
      section.insertBefore(bar, section.firstChild);
  
      /* Animate counter */
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        bar.querySelectorAll(".eng-stat-num").forEach((el) => {
          const target = +el.dataset.target;
          let current = 0;
          const step = Math.ceil(target / 40);
          const interval = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = current;
            if (current >= target) clearInterval(interval);
          }, 35);
        });
        observer.disconnect();
      }, { threshold: 0.5 });
      observer.observe(bar);
    }
  
    /* ══════════════════════════════════════════════
       7. TOOL RECOMMENDATION QUIZ
    ══════════════════════════════════════════════ */
    function initQuiz() {
      /* Inject quiz button after stats bar label */
      const label = document.querySelector(".eng-section-label");
      if (!label) return;
  
      const quizBtn = document.createElement("button");
      quizBtn.id = "quizTriggerBtn";
      quizBtn.innerHTML = `<i class="fa-solid fa-robot"></i> Find My Tool`;
      quizBtn.style.cssText = `
        margin-left: auto; display: inline-flex; align-items: center; gap: 0.5rem;
        background: linear-gradient(135deg, rgba(24,95,165,0.25), rgba(74,222,128,0.15));
        border: 1px solid rgba(147,197,253,0.35); color: #93c5fd;
        border-radius: 50px; padding: 0.45rem 1.2rem;
        font-family: 'Poppins',sans-serif; font-size: 0.82rem; font-weight: 700;
        cursor: pointer; transition: all 0.25s; letter-spacing: 0.02em;
      `;
      quizBtn.onmouseover = () => {
        quizBtn.style.background = "linear-gradient(135deg,rgba(24,95,165,0.45),rgba(74,222,128,0.25))";
        quizBtn.style.transform = "scale(1.04)";
      };
      quizBtn.onmouseleave = () => {
        quizBtn.style.background = "linear-gradient(135deg,rgba(24,95,165,0.25),rgba(74,222,128,0.15))";
        quizBtn.style.transform = "scale(1)";
      };
  
      const labelWrap = label.parentElement || label;
      label.style.display = "flex";
      label.style.justifyContent = "space-between";
      label.style.alignItems = "center";
      label.appendChild(quizBtn);
  
      /* ── Quiz modal ── */
      const overlay = document.createElement("div");
      overlay.id = "quizOverlay";
      overlay.style.cssText = `
        display:none; position:fixed; inset:0; z-index:9999;
        background: rgba(2,11,24,0.9); backdrop-filter:blur(10px);
        -webkit-backdrop-filter:blur(10px);
        align-items:center; justify-content:center;
      `;
      overlay.innerHTML = `
        <div id="quizBox" style="
          background:#0a1628; border:1px solid rgba(24,95,165,0.35);
          border-radius:20px; padding:2.5rem; max-width:560px; width:90%;
          max-height:90vh; overflow-y:auto; position:relative;
          box-shadow: 0 0 60px rgba(24,95,165,0.25), 0 30px 80px rgba(0,0,0,0.6);
          animation: quizIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        ">
          <button id="quizClose" style="
            position:absolute;top:1rem;right:1rem; background:rgba(255,255,255,0.07);
            border:1px solid rgba(255,255,255,0.1); border-radius:50%;
            width:32px;height:32px; color:#94a3b8; font-size:1rem;
            cursor:pointer; display:flex;align-items:center;justify-content:center;
            transition:all 0.2s;
          ">×</button>
          <div id="quizContent"></div>
        </div>
        <style>
          @keyframes quizIn {
            from { opacity:0; transform:scale(0.88) translateY(20px); }
            to   { opacity:1; transform:scale(1) translateY(0); }
          }
          .quiz-option {
            display:block; width:100%; text-align:left;
            background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09);
            border-radius:12px; padding:0.85rem 1.1rem; margin-bottom:0.65rem;
            color:#e2e8f0; font-family:'Poppins',sans-serif; font-size:0.9rem;
            font-weight:500; cursor:pointer; transition:all 0.2s;
          }
          .quiz-option:hover {
            background:rgba(24,95,165,0.2); border-color:rgba(147,197,253,0.4);
            color:#93c5fd; transform:translateX(4px);
          }
          .quiz-progress {
            display:flex; gap:6px; margin-bottom:1.5rem;
          }
          .quiz-step {
            height:3px; flex:1; border-radius:3px;
            background:rgba(255,255,255,0.1); transition:background 0.3s;
          }
          .quiz-step.done { background: linear-gradient(90deg,#185FA5,#4ade80); }
          .quiz-result-card {
            background:rgba(24,95,165,0.12); border:1px solid rgba(147,197,253,0.25);
            border-radius:14px; padding:1.25rem; margin-bottom:0.75rem;
            display:flex; align-items:flex-start; gap:1rem;
            text-decoration:none; color:#e2e8f0; transition:all 0.2s;
          }
          .quiz-result-card:hover {
            background:rgba(24,95,165,0.22); border-color:rgba(147,197,253,0.45);
            transform:translateX(4px); color:#e2e8f0;text-decoration:none;
          }
          .quiz-result-icon {
            width:42px;height:42px; border-radius:10px; flex-shrink:0;
            display:flex;align-items:center;justify-content:center;
            font-size:1.15rem;
          }
          .quiz-tag {
            display:inline-block; font-size:0.68rem; font-weight:700;
            letter-spacing:0.04em; text-transform:uppercase;
            padding:0.15rem 0.55rem; border-radius:50px;
            background:rgba(24,95,165,0.2); color:#93c5fd;
            border:1px solid rgba(24,95,165,0.3); margin-top:0.3rem;
          }
        </style>
      `;
      document.body.appendChild(overlay);
  
      /* Close handlers */
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeQuiz();
      });
      document.getElementById("quizClose").addEventListener("click", closeQuiz);
  
      function openQuiz() {
        overlay.style.display = "flex";
        document.body.style.overflow = "hidden";
        currentQ = 0;
        answers = {};
        renderQuestion();
      }
  
      function closeQuiz() {
        overlay.style.display = "none";
        document.body.style.overflow = "";
      }
  
      quizBtn.addEventListener("click", openQuiz);
  
      /* ── Quiz data ── */
      const questions = [
        {
          id: "goal",
          text: "What's your main engineering goal right now?",
          icon: "🎯",
          options: [
            { label: "Solve a complex equation or formula", value: "math" },
            { label: "Design or simulate a circuit", value: "electronics" },
            { label: "Build or model a 3D structure", value: "simulation" },
            { label: "Look up constants or formulas", value: "reference" },
            { label: "Convert between units", value: "converter" },
          ],
        },
        {
          id: "level",
          text: "What's your experience level?",
          icon: "📊",
          options: [
            { label: "Beginner — just getting started", value: "beginner" },
            { label: "Intermediate — know the basics", value: "mid" },
            { label: "Advanced — looking for power tools", value: "advanced" },
          ],
        },
        {
          id: "mode",
          text: "How do you prefer to work?",
          icon: "💻",
          options: [
            { label: "Fully in the browser, no install", value: "browser" },
            { label: "I don't mind downloading software", value: "desktop" },
            { label: "I like coding (Python, MATLAB, etc.)", value: "code" },
          ],
        },
      ];
  
      /* ── Tool database ── */
      const tools = [
        {
          name: "Wolfram Alpha",
          url: "https://www.wolframalpha.com",
          desc: "Solve equations, integrals, and get step-by-step answers instantly.",
          icon: "fa-calculator", color: "#f97316",
          tags: ["math"], levels: ["mid", "advanced"], modes: ["browser"],
        },
        {
          name: "Symbolab",
          url: "https://www.symbolab.com",
          desc: "Step-by-step algebra, calculus and trig solutions perfect for beginners.",
          icon: "fa-square-root-variable", color: "#6366f1",
          tags: ["math"], levels: ["beginner", "mid"], modes: ["browser"],
        },
        {
          name: "Desmos",
          url: "https://www.desmos.com/calculator",
          desc: "Interactive graphing calculator — visualise functions instantly.",
          icon: "fa-chart-line", color: "#6366f1",
          tags: ["math"], levels: ["beginner", "mid", "advanced"], modes: ["browser"],
        },
        {
          name: "MATLAB Online",
          url: "https://www.mathworks.com/products/matlab-online.html",
          desc: "Full MATLAB in the browser — matrices, DSP, plotting.",
          icon: "fa-calculator", color: "#f97316",
          tags: ["math", "simulation"], levels: ["advanced"], modes: ["browser", "code"],
        },
        {
          name: "NumPy",
          url: "https://numpy.org/",
          desc: "The backbone of scientific Python — arrays, linear algebra, Fourier.",
          icon: "fa-chart-line", color: "#06b6d4",
          tags: ["math"], levels: ["mid", "advanced"], modes: ["code"],
        },
        {
          name: "GeoGebra",
          url: "https://www.geogebra.org",
          desc: "Interactive maths for geometry, algebra, statistics and calculus.",
          icon: "fa-shapes", color: "#ec4899",
          tags: ["math"], levels: ["beginner", "mid"], modes: ["browser"],
        },
        {
          name: "Circuit Simulator",
          url: "https://falstad.com/circuit",
          desc: "Build and simulate circuits live — visualise current, voltage and waveforms.",
          icon: "fa-bolt", color: "#22c55e",
          tags: ["electronics"], levels: ["beginner", "mid", "advanced"], modes: ["browser"],
        },
        {
          name: "Tinkercad",
          url: "https://www.tinkercad.com/",
          desc: "3D design + Arduino circuit simulation for beginners. Super visual.",
          icon: "fa-microchip", color: "#22c55e",
          tags: ["electronics", "simulation"], levels: ["beginner", "mid"], modes: ["browser"],
        },
        {
          name: "PTC Creo",
          url: "https://www.ptc.com/en/products/creo",
          desc: "Industry-leading 3D CAD — parametric modelling for precision parts.",
          icon: "fa-cube", color: "#a855f7",
          tags: ["simulation"], levels: ["advanced"], modes: ["desktop"],
        },
        {
          name: "Engineering Toolbox",
          url: "https://www.engineeringtoolbox.com",
          desc: "Comprehensive database of engineering data, formulas and reference tables.",
          icon: "fa-wrench", color: "#f97316",
          tags: ["reference"], levels: ["beginner", "mid", "advanced"], modes: ["browser"],
        },
        {
          name: "NIST Physical Data",
          url: "https://www.nist.gov/pml/productsservices/physical-reference-data",
          desc: "Official physical constants, atomic spectra and material data from NIST.",
          icon: "fa-atom", color: "#a855f7",
          tags: ["reference"], levels: ["mid", "advanced"], modes: ["browser"],
        },
        {
          name: "RapidTables",
          url: "https://www.rapidtables.com",
          desc: "Quick reference tables for math, electrical, and unit conversions.",
          icon: "fa-table", color: "#06b6d4",
          tags: ["reference", "converter"], levels: ["beginner", "mid"], modes: ["browser"],
        },
        {
          name: "Unit Converter",
          url: "https://www.unitconverters.net",
          desc: "Convert between thousands of units — length, mass, pressure and more.",
          icon: "fa-ruler-combined", color: "#22c55e",
          tags: ["converter"], levels: ["beginner", "mid", "advanced"], modes: ["browser"],
        },
      ];
  
      let currentQ = 0;
      let answers = {};
  
      function renderProgress() {
        return `<div class="quiz-progress">${questions
          .map((_, i) => `<div class="quiz-step ${i < currentQ ? "done" : ""}"></div>`)
          .join("")}</div>`;
      }
  
      function renderQuestion() {
        const q = questions[currentQ];
        const content = document.getElementById("quizContent");
        content.innerHTML = `
          ${renderProgress()}
          <div style="font-size:2rem;margin-bottom:0.75rem;">${q.icon}</div>
          <h3 style="font-size:1.15rem;font-weight:700;color:#e2e8f0;margin-bottom:1.5rem;line-height:1.4;">${q.text}</h3>
          ${q.options
            .map(
              (o) =>
                `<button class="quiz-option" data-value="${o.value}">${o.label}</button>`
            )
            .join("")}
          <p style="font-size:0.75rem;color:#64748b;margin-top:1rem;text-align:center;">
            Question ${currentQ + 1} of ${questions.length}
          </p>
        `;
  
        content.querySelectorAll(".quiz-option").forEach((btn) => {
          btn.addEventListener("click", () => {
            answers[q.id] = btn.dataset.value;
            currentQ++;
            if (currentQ < questions.length) renderQuestion();
            else renderResults();
          });
        });
      }
  
      function renderResults() {
        const { goal, level, mode } = answers;
        let matched = tools.filter((t) => {
          const tagMatch = t.tags.includes(goal);
          const levelMatch = t.levels.includes(level);
          const modeMatch = t.modes.includes(mode);
          return tagMatch && (levelMatch || modeMatch);
        });
  
        /* Fallback: tag match only */
        if (matched.length === 0) {
          matched = tools.filter((t) => t.tags.includes(goal)).slice(0, 3);
        }
        matched = matched.slice(0, 4);
  
        const content = document.getElementById("quizContent");
        content.innerHTML = `
          <div style="text-align:center;margin-bottom:1.5rem;">
            <div style="font-size:2rem;margin-bottom:0.5rem;">🚀</div>
            <h3 style="font-size:1.1rem;font-weight:700;color:#e2e8f0;">Your Recommended Tools</h3>
            <p style="font-size:0.82rem;color:#94a3b8;margin-top:0.25rem;">Based on your goals and experience</p>
          </div>
          ${matched
            .map(
              (t) => `
            <a href="${t.url}" target="_blank" class="quiz-result-card">
              <div class="quiz-result-icon" style="background:${t.color}22;border:1px solid ${t.color}44;color:${t.color};">
                <i class="fa-solid ${t.icon}"></i>
              </div>
              <div>
                <div style="font-weight:700;font-size:0.95rem;">${t.name}</div>
                <div style="font-size:0.8rem;color:#94a3b8;margin-top:2px;">${t.desc}</div>
                <span class="quiz-tag">${t.tags[0]}</span>
              </div>
            </a>`
            )
            .join("")}
          <button id="quizRetake" style="
            width:100%;margin-top:1rem; background:transparent;
            border:1px solid rgba(147,197,253,0.2); border-radius:10px;
            padding:0.7rem; color:#94a3b8; font-family:'Poppins',sans-serif;
            font-size:0.85rem; font-weight:600; cursor:pointer; transition:all 0.2s;
          ">↩ Retake Quiz</button>
        `;
  
        document.getElementById("quizRetake").addEventListener("click", () => {
          currentQ = 0; answers = {}; renderQuestion();
        });
      }
    }
  
  
  
    /* ══════════════════════════════════════════════
       9. CURSOR GLOW — Custom sci-fi cursor glow
    ══════════════════════════════════════════════ */
    function initCursorGlow() {
      const glow = document.createElement("div");
      glow.style.cssText = `
        position:fixed; width:300px; height:300px; border-radius:50%;
        background: radial-gradient(circle, rgba(24,95,165,0.08) 0%, transparent 70%);
        pointer-events:none; z-index:0; transform:translate(-50%,-50%);
        transition: left 0.12s ease, top 0.12s ease;
      `;
      document.body.appendChild(glow);
  
      document.addEventListener("mousemove", (e) => {
        glow.style.left = e.clientX + "px";
        glow.style.top = e.clientY + "px";
      });
    }
  
    /* ══════════════════════════════════════════════
       10. SEARCH ENHANCEMENT — Animated highlight
    ══════════════════════════════════════════════ */
    function initSearchEnhancement() {
      const input = document.getElementById("engSearch");
      if (!input) return;
  
      input.addEventListener("input", () => {
        const q = input.value.toLowerCase().trim();
        document.querySelectorAll(".tool-card-wrap").forEach((card) => {
          const matched = !q || (card.dataset.name || "").includes(q);
          if (matched && q) {
            card.querySelector(".eng-card").style.borderColor = "rgba(74,222,128,0.4)";
            card.querySelector(".eng-card").style.boxShadow = "0 0 20px rgba(74,222,128,0.1)";
          } else {
            card.querySelector(".eng-card").style.borderColor = "";
            card.querySelector(".eng-card").style.boxShadow = "";
          }
        });
      });
    }
  
    /* ══════════════════════════════════════════════
       INIT — Run everything on DOMContentLoaded
    ══════════════════════════════════════════════ */
    function init() {
      initParticles();
      initScanLines();
      initTypewriter();
      initScrollReveal();
      initTiltEffect();
      initStatsBar();
      initQuiz();
      initCursorGlow();
      initSearchEnhancement();
      initRatingsSystem();
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  })();
  
  /* ============================================================
     RATINGS & REVIEWS SYSTEM
     Session-only · Floating panel trigger
     ============================================================ */
  (function () {
    "use strict";
  
    /* ── Session store (resets on reload) ── */
    const store = {
      reviews: {},   /* { toolName: [{stars, text, time, author}] } */
    };
  
    /* ── Inject all styles ── */
    const css = document.createElement("style");
    css.textContent = `
      /* ── Floating FAB ── */
      #rrFab {
        position: fixed; bottom: 2rem; right: 2rem; z-index: 9000;
        width: 54px; height: 54px; border-radius: 50%;
        background: linear-gradient(135deg,#185FA5,#1e7a3a);
        border: 1.5px solid rgba(147,197,253,0.4);
        color: #fff; font-size: 1.3rem;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; box-shadow: 0 0 24px rgba(24,95,165,0.45);
        transition: transform 0.25s, box-shadow 0.25s;
      }
      #rrFab:hover { transform: scale(1.1) rotate(10deg); box-shadow: 0 0 36px rgba(24,95,165,0.65); }
      #rrFab .rr-badge {
        position: absolute; top: -4px; right: -4px;
        width: 18px; height: 18px; border-radius: 50%;
        background: #f43f5e; color: #fff;
        font-size: 0.65rem; font-weight: 700;
        display: none; align-items: center; justify-content: center;
        font-family: 'Poppins', sans-serif;
      }
      #rrFab .rr-badge.show { display: flex; }
  
      /* ── Panel ── */
      #rrPanel {
        position: fixed; bottom: 6rem; right: 2rem; z-index: 9001;
        width: 360px; max-height: 80vh;
        background: #0a1628;
        border: 1px solid rgba(24,95,165,0.35);
        border-radius: 18px;
        box-shadow: 0 0 60px rgba(24,95,165,0.2), 0 24px 64px rgba(0,0,0,0.6);
        display: flex; flex-direction: column;
        transform: scale(0.88) translateY(16px); opacity: 0;
        pointer-events: none;
        transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;
        overflow: hidden;
        font-family: 'Poppins', sans-serif;
      }
      #rrPanel.open {
        transform: scale(1) translateY(0); opacity: 1; pointer-events: all;
      }
  
      /* Panel header */
      .rr-panel-head {
        padding: 1rem 1.25rem 0.75rem;
        border-bottom: 1px solid rgba(255,255,255,0.07);
        display: flex; align-items: center; justify-content: space-between;
        flex-shrink: 0;
      }
      .rr-panel-head h3 {
        font-size: 0.95rem; font-weight: 700; color: #e2e8f0;
        display: flex; align-items: center; gap: 0.5rem;
      }
      .rr-panel-head h3 i { color: #93c5fd; font-size: 0.95rem; }
      .rr-close-btn {
        background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 50%; width: 28px; height: 28px; color: #94a3b8;
        cursor: pointer; font-size: 1rem; display: flex;
        align-items: center; justify-content: center; transition: all 0.2s;
        font-family: 'Poppins', sans-serif;
      }
      .rr-close-btn:hover { background: rgba(244,63,94,0.2); color: #f43f5e; }
  
      /* Tabs */
      .rr-tabs {
        display: flex; border-bottom: 1px solid rgba(255,255,255,0.07);
        flex-shrink: 0;
      }
      .rr-tab {
        flex: 1; padding: 0.6rem; font-size: 0.78rem; font-weight: 600;
        color: #64748b; background: none; border: none; cursor: pointer;
        font-family: 'Poppins', sans-serif; transition: all 0.2s;
        border-bottom: 2px solid transparent;
      }
      .rr-tab.active { color: #93c5fd; border-bottom-color: #93c5fd; }
      .rr-tab:hover:not(.active) { color: #94a3b8; }
  
      /* Tab content */
      .rr-body { flex: 1; overflow-y: auto; padding: 1rem 1.25rem; }
      .rr-body::-webkit-scrollbar { width: 4px; }
      .rr-body::-webkit-scrollbar-track { background: transparent; }
      .rr-body::-webkit-scrollbar-thumb { background: rgba(147,197,253,0.2); border-radius: 4px; }
      .rr-tab-pane { display: none; }
      .rr-tab-pane.active { display: block; }
  
      /* ── Write review form ── */
      .rr-tool-select {
        width: 100%; background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
        color: #e2e8f0; font-family: 'Poppins', sans-serif; font-size: 0.85rem;
        padding: 0.6rem 0.8rem; margin-bottom: 0.85rem; cursor: pointer;
        appearance: none; outline: none; transition: border-color 0.2s;
      }
      .rr-tool-select:focus { border-color: rgba(147,197,253,0.45); }
      .rr-tool-select option { background: #0a1628; color: #e2e8f0; }
  
      /* Star picker */
      .rr-star-row {
        display: flex; align-items: center; gap: 0.3rem; margin-bottom: 0.85rem;
      }
      .rr-star-row label { font-size: 0.78rem; color: #64748b; margin-right: 0.4rem; }
      .rr-star {
        font-size: 1.4rem; cursor: pointer; color: rgba(255,255,255,0.15);
        transition: color 0.15s, transform 0.15s; line-height: 1; user-select: none;
      }
      .rr-star.lit { color: #fbbf24; }
      .rr-star:hover { transform: scale(1.2); }
  
      /* Author + textarea */
      .rr-input {
        width: 100%; background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.09); border-radius: 10px;
        color: #e2e8f0; font-family: 'Poppins', sans-serif; font-size: 0.84rem;
        padding: 0.65rem 0.85rem; margin-bottom: 0.7rem;
        outline: none; resize: none; transition: border-color 0.2s;
      }
      .rr-input::placeholder { color: #475569; }
      .rr-input:focus { border-color: rgba(147,197,253,0.4); }
  
      .rr-submit-btn {
        width: 100%; background: linear-gradient(135deg, #185FA5 0%, #1e7a3a 100%);
        border: none; border-radius: 10px; color: #fff;
        font-family: 'Poppins', sans-serif; font-size: 0.87rem; font-weight: 700;
        padding: 0.7rem; cursor: pointer; transition: opacity 0.2s, transform 0.15s;
      }
      .rr-submit-btn:hover { opacity: 0.88; transform: scale(1.01); }
      .rr-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  
      .rr-form-msg {
        font-size: 0.78rem; text-align: center; margin-top: 0.6rem;
        min-height: 1.2em; transition: color 0.2s;
      }
  
      /* ── Review cards ── */
      .rr-empty {
        text-align: center; padding: 2rem 1rem;
        color: #475569; font-size: 0.82rem;
      }
      .rr-empty i { font-size: 2rem; display: block; margin-bottom: 0.6rem; opacity: 0.3; }
  
      .rr-review-item {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
        border-radius: 12px; padding: 0.9rem; margin-bottom: 0.65rem;
        animation: rrSlideIn 0.3s ease both;
      }
      @keyframes rrSlideIn {
        from { opacity:0; transform:translateY(10px); }
        to   { opacity:1; transform:translateY(0); }
      }
      .rr-review-top {
        display: flex; align-items: flex-start;
        justify-content: space-between; margin-bottom: 0.4rem; gap: 0.5rem;
      }
      .rr-review-tool {
        font-size: 0.82rem; font-weight: 700; color: #93c5fd; flex: 1;
      }
      .rr-review-stars { color: #fbbf24; font-size: 0.78rem; letter-spacing: 1px; flex-shrink: 0; }
      .rr-review-author {
        font-size: 0.72rem; color: #475569; margin-bottom: 0.4rem;
      }
      .rr-review-text {
        font-size: 0.82rem; color: #94a3b8; line-height: 1.55;
      }
      .rr-review-time {
        font-size: 0.68rem; color: #334155; margin-top: 0.45rem; text-align: right;
      }
      .rr-delete-btn {
        background: none; border: none; color: #334155; cursor: pointer;
        font-size: 0.75rem; padding: 0; transition: color 0.2s; flex-shrink: 0;
      }
      .rr-delete-btn:hover { color: #f43f5e; }
  
      /* ── Browse tab — tool rating summary list ── */
      .rr-tool-summary {
        display: flex; align-items: center; gap: 0.75rem;
        padding: 0.7rem 0; border-bottom: 1px solid rgba(255,255,255,0.06);
        cursor: pointer; transition: background 0.15s; border-radius: 8px;
        padding-left: 0.3rem; padding-right: 0.3rem;
      }
      .rr-tool-summary:hover { background: rgba(24,95,165,0.1); }
      .rr-tool-summary:last-child { border-bottom: none; }
      .rr-ts-icon {
        width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.9rem;
      }
      .rr-ts-name { font-size: 0.85rem; font-weight: 600; color: #e2e8f0; flex: 1; }
      .rr-ts-meta { font-size: 0.72rem; color: #64748b; margin-top: 1px; }
      .rr-ts-avg {
        font-size: 0.82rem; font-weight: 700; color: #fbbf24;
        display: flex; align-items: center; gap: 3px;
      }
  
      /* toast */
      #rrToast {
        position: fixed; bottom: 7rem; right: 2rem; z-index: 9999;
        background: #0f2744; border: 1px solid rgba(74,222,128,0.35);
        border-radius: 10px; padding: 0.65rem 1.1rem;
        font-family: 'Poppins', sans-serif; font-size: 0.82rem;
        color: #4ade80; font-weight: 600;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        opacity: 0; transform: translateY(8px);
        transition: opacity 0.25s, transform 0.25s;
        pointer-events: none;
      }
      #rrToast.show { opacity: 1; transform: translateY(0); }
  
      /* Mobile */
      @media (max-width: 480px) {
        #rrPanel { width: calc(100vw - 2rem); right: 1rem; bottom: 5.5rem; }
        #rrFab { right: 1rem; bottom: 1.2rem; }
      }
    `;
    document.head.appendChild(css);
  
    /* ── Tool catalogue (mirrors engg.js quiz tools) ── */
    const TOOLS = [
      { name: "Wolfram Alpha",       icon: "🔢", color: "#f97316", url: "https://www.wolframalpha.com" },
      { name: "Desmos",              icon: "📈", color: "#6366f1", url: "https://www.desmos.com/calculator" },
      { name: "Circuit Simulator",   icon: "⚡", color: "#22c55e", url: "https://falstad.com/circuit" },
      { name: "Symbolab",            icon: "✏️", color: "#6366f1", url: "https://www.symbolab.com" },
      { name: "MATLAB Online",       icon: "📡", color: "#f97316", url: "https://www.mathworks.com/products/matlab-online.html" },
      { name: "GeoGebra",            icon: "📐", color: "#ec4899", url: "https://www.geogebra.org" },
      { name: "Tinkercad",           icon: "🔧", color: "#22c55e", url: "https://www.tinkercad.com" },
      { name: "PTC Creo",            icon: "🧊", color: "#a855f7", url: "https://www.ptc.com/en/products/creo" },
      { name: "Engineering Toolbox", icon: "📚", color: "#f97316", url: "https://www.engineeringtoolbox.com" },
      { name: "NIST Physical Data",  icon: "⚛️", color: "#a855f7", url: "https://www.nist.gov/pml/productsservices/physical-reference-data" },
      { name: "RapidTables",         icon: "🗂️", color: "#06b6d4", url: "https://www.rapidtables.com" },
      { name: "Unit Converter",      icon: "🔁", color: "#22c55e", url: "https://www.unitconverters.net" },
      { name: "NumPy",               icon: "🐍", color: "#06b6d4", url: "https://numpy.org" },
    ];
  
    /* ── Build DOM ── */
    const fab = document.createElement("button");
    fab.id = "rrFab";
    fab.title = "Ratings & Reviews";
    fab.innerHTML = `<i class="fa-solid fa-star"></i><span class="rr-badge" id="rrBadge">0</span>`;
  
    const panel = document.createElement("div");
    panel.id = "rrPanel";
    panel.innerHTML = `
      <div class="rr-panel-head">
        <h3><i class="fa-solid fa-star-half-stroke"></i> Ratings & Reviews</h3>
        <button class="rr-close-btn" id="rrClose">×</button>
      </div>
      <div class="rr-tabs">
        <button class="rr-tab active" data-tab="write">✍️ Write</button>
        <button class="rr-tab" data-tab="browse">🔍 Browse</button>
        <button class="rr-tab" data-tab="feed">📋 Feed</button>
      </div>
      <div class="rr-body">
        <!-- WRITE TAB -->
        <div class="rr-tab-pane active" id="rrPane-write">
          <select class="rr-tool-select" id="rrToolSel">
            <option value="">— Choose a tool —</option>
            ${TOOLS.map(t => `<option value="${t.name}">${t.icon} ${t.name}</option>`).join("")}
          </select>
          <div class="rr-star-row">
            <label>Rating</label>
            <span class="rr-star" data-v="1">★</span>
            <span class="rr-star" data-v="2">★</span>
            <span class="rr-star" data-v="3">★</span>
            <span class="rr-star" data-v="4">★</span>
            <span class="rr-star" data-v="5">★</span>
          </div>
          <input class="rr-input" id="rrAuthor" placeholder="Your name (optional)" maxlength="32" />
          <textarea class="rr-input" id="rrText" rows="3" placeholder="Share your experience with this tool…" maxlength="280"></textarea>
          <div style="text-align:right;font-size:0.7rem;color:#334155;margin-top:-0.5rem;margin-bottom:0.7rem;" id="rrCharCount">0 / 280</div>
          <button class="rr-submit-btn" id="rrSubmit">Submit Review</button>
          <div class="rr-form-msg" id="rrMsg"></div>
        </div>
  
        <!-- BROWSE TAB -->
        <div class="rr-tab-pane" id="rrPane-browse">
          <div id="rrBrowseList"></div>
        </div>
  
        <!-- FEED TAB -->
        <div class="rr-tab-pane" id="rrPane-feed">
          <div id="rrFeedList"></div>
        </div>
      </div>
    `;
  
    const toast = document.createElement("div");
    toast.id = "rrToast";
    document.body.append(fab, panel, toast);
  
    /* ── State ── */
    let selectedStars = 0;
    let panelOpen = false;
  
    /* ── Helpers ── */
    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2600);
    }
  
    function totalReviews() {
      return Object.values(store.reviews).reduce((s, arr) => s + arr.length, 0);
    }
  
    function updateBadge() {
      const n = totalReviews();
      const badge = document.getElementById("rrBadge");
      badge.textContent = n;
      badge.classList.toggle("show", n > 0);
    }
  
    function starsHTML(n, size = "0.85rem") {
      return Array.from({ length: 5 }, (_, i) =>
        `<span style="color:${i < n ? "#fbbf24" : "rgba(255,255,255,0.12)"}; font-size:${size};">★</span>`
      ).join("");
    }
  
    function avgRating(arr) {
      if (!arr || !arr.length) return 0;
      return arr.reduce((s, r) => s + r.stars, 0) / arr.length;
    }
  
    /* ── Open / close ── */
    function openPanel() {
      panelOpen = true;
      panel.classList.add("open");
      renderBrowse();
      renderFeed();
    }
  
    function closePanel() {
      panelOpen = false;
      panel.classList.remove("open");
    }
  
    fab.addEventListener("click", () => panelOpen ? closePanel() : openPanel());
    document.getElementById("rrClose").addEventListener("click", closePanel);
  
    /* ── Tabs ── */
    panel.querySelectorAll(".rr-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        panel.querySelectorAll(".rr-tab").forEach(t => t.classList.remove("active"));
        panel.querySelectorAll(".rr-tab-pane").forEach(p => p.classList.remove("active"));
        tab.classList.add("active");
        const pane = document.getElementById(`rrPane-${tab.dataset.tab}`);
        if (pane) pane.classList.add("active");
        if (tab.dataset.tab === "browse") renderBrowse();
        if (tab.dataset.tab === "feed") renderFeed();
      });
    });
  
    /* ── Star picker ── */
    const stars = panel.querySelectorAll(".rr-star");
    stars.forEach(s => {
      s.addEventListener("mouseenter", () => {
        stars.forEach(x => x.classList.toggle("lit", +x.dataset.v <= +s.dataset.v));
      });
      s.addEventListener("mouseleave", () => {
        stars.forEach(x => x.classList.toggle("lit", +x.dataset.v <= selectedStars));
      });
      s.addEventListener("click", () => {
        selectedStars = +s.dataset.v;
        stars.forEach(x => x.classList.toggle("lit", +x.dataset.v <= selectedStars));
      });
    });
  
    /* ── Char counter ── */
    document.getElementById("rrText").addEventListener("input", function () {
      document.getElementById("rrCharCount").textContent = `${this.value.length} / 280`;
    });
  
    /* ── Submit ── */
    document.getElementById("rrSubmit").addEventListener("click", () => {
      const tool   = document.getElementById("rrToolSel").value;
      const author = document.getElementById("rrAuthor").value.trim() || "Anonymous";
      const text   = document.getElementById("rrText").value.trim();
      const msg    = document.getElementById("rrMsg");
  
      if (!tool)          { msg.style.color = "#f43f5e"; msg.textContent = "⚠ Please choose a tool."; return; }
      if (!selectedStars) { msg.style.color = "#f43f5e"; msg.textContent = "⚠ Please pick a star rating."; return; }
      if (!text)          { msg.style.color = "#f43f5e"; msg.textContent = "⚠ Write a short review first."; return; }
  
      const review = {
        stars: selectedStars,
        text,
        author,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
  
      if (!store.reviews[tool]) store.reviews[tool] = [];
      store.reviews[tool].unshift(review);
  
      /* Reset form */
      document.getElementById("rrToolSel").value = "";
      document.getElementById("rrAuthor").value = "";
      document.getElementById("rrText").value = "";
      document.getElementById("rrCharCount").textContent = "0 / 280";
      selectedStars = 0;
      stars.forEach(x => x.classList.remove("lit"));
  
      msg.style.color = "#4ade80";
      msg.textContent = "✓ Review submitted!";
      setTimeout(() => (msg.textContent = ""), 3000);
  
      updateBadge();
      injectCardRatings(tool);
      showToast(`⭐ Review added for ${tool}!`);
    });
  
    /* ── Browse tab — per-tool summary ── */
    function renderBrowse() {
      const list = document.getElementById("rrBrowseList");
      const rated = TOOLS.filter(t => store.reviews[t.name]?.length);
      if (!rated.length) {
        list.innerHTML = `<div class="rr-empty"><i class="fa-solid fa-chart-bar"></i>No ratings yet. Be the first!</div>`;
        return;
      }
      /* Sort by avg desc */
      const sorted = [...rated].sort((a, b) => avgRating(store.reviews[b.name]) - avgRating(store.reviews[a.name]));
      list.innerHTML = sorted.map(t => {
        const revs = store.reviews[t.name];
        const avg  = avgRating(revs).toFixed(1);
        return `
          <div class="rr-tool-summary" data-tool="${t.name}">
            <div class="rr-ts-icon" style="background:${t.color}22;border:1px solid ${t.color}44;">${t.icon}</div>
            <div style="flex:1;min-width:0;">
              <div class="rr-ts-name">${t.name}</div>
              <div class="rr-ts-meta">${revs.length} review${revs.length > 1 ? "s" : ""}</div>
            </div>
            <div class="rr-ts-avg">★ ${avg}</div>
          </div>`;
      }).join("");
  
      /* Click → jump to feed filtered */
      list.querySelectorAll(".rr-tool-summary").forEach(row => {
        row.addEventListener("click", () => {
          panel.querySelector('[data-tab="feed"]').click();
          renderFeed(row.dataset.tool);
        });
      });
    }
  
    /* ── Feed tab — all reviews ── */
    function renderFeed(filterTool = null) {
      const list = document.getElementById("rrFeedList");
      let all = [];
      Object.entries(store.reviews).forEach(([tool, revs]) => {
        revs.forEach(r => all.push({ ...r, tool }));
      });
      if (filterTool) all = all.filter(r => r.tool === filterTool);
      if (!all.length) {
        list.innerHTML = `<div class="rr-empty"><i class="fa-solid fa-comment-slash"></i>${filterTool ? `No reviews yet for ${filterTool}.` : "No reviews yet. Go write one!"}</div>`;
        return;
      }
      list.innerHTML = all.map((r, idx) => `
        <div class="rr-review-item" data-idx="${idx}" data-tool="${r.tool}">
          <div class="rr-review-top">
            <div class="rr-review-tool">${r.tool}</div>
            <div class="rr-review-stars">${starsHTML(r.stars)}</div>
            <button class="rr-delete-btn" data-tool="${r.tool}" data-idx="${store.reviews[r.tool].indexOf(r)}" title="Delete">🗑</button>
          </div>
          <div class="rr-review-author">by ${r.author}</div>
          <div class="rr-review-text">${r.text}</div>
          <div class="rr-review-time">${r.time}</div>
        </div>`).join("");
  
      list.querySelectorAll(".rr-delete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const tool = btn.dataset.tool;
          const i    = +btn.dataset.idx;
          store.reviews[tool].splice(i, 1);
          if (!store.reviews[tool].length) delete store.reviews[tool];
          updateBadge();
          injectCardRatings(tool);
          renderFeed(filterTool);
          renderBrowse();
          showToast("Review deleted.");
        });
      });
    }
  
    /* ── Inject mini rating badges onto tool cards ── */
    function injectCardRatings(toolName) {
      document.querySelectorAll(".tool-card-wrap").forEach(wrap => {
        const name = wrap.dataset.name || "";
        const matched = TOOLS.find(t => name.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(name));
        if (!matched || matched.name !== toolName) return;
  
        const revs = store.reviews[toolName] || [];
        let badge = wrap.querySelector(".rr-card-badge");
  
        if (!revs.length) {
          if (badge) badge.remove();
          return;
        }
  
        const avg = avgRating(revs).toFixed(1);
        if (!badge) {
          badge = document.createElement("div");
          badge.className = "rr-card-badge";
          badge.style.cssText = `
            position:absolute; top:10px; right:10px;
            background:rgba(251,191,36,0.18); border:1px solid rgba(251,191,36,0.35);
            border-radius:20px; padding:3px 8px;
            font-family:'Poppins',sans-serif; font-size:0.7rem; font-weight:700;
            color:#fbbf24; display:flex; align-items:center; gap:3px;
            pointer-events:none; z-index:2;
          `;
          const card = wrap.querySelector(".eng-card");
          if (card) { card.style.position = "relative"; card.appendChild(badge); }
        }
        badge.innerHTML = `★ ${avg} <span style="color:rgba(251,191,36,0.55);font-weight:400;">(${revs.length})</span>`;
      });
    }
  
    /* ── Also inject on card click — open panel to that tool's reviews ── */
    document.querySelectorAll(".tool-card-wrap").forEach(wrap => {
      const card = wrap.querySelector(".eng-card");
      if (!card) return;
      /* Right-click context hint */
      card.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const matched = TOOLS.find(t => (wrap.dataset.name || "").includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(wrap.dataset.name || ""));
        if (!matched) return;
        openPanel();
        setTimeout(() => {
          document.getElementById("rrToolSel").value = matched.name;
          panel.querySelector('[data-tab="write"]').click();
        }, 100);
      });
    });
  
  })();