#!/usr/bin/env node
/**
 * 🤖 COURSE AGENT v2 — Masterclass Edition
 * Curated 4-act chapter structure, smart slide detection, bonus resources.
 */
const fs = require('fs');
const path = require('path');

const PRES_DIR = path.join(__dirname, 'presentations');
const OUTPUT_FILE = path.join(__dirname, 'course_unified.html');

// ─── CURATED CHAPTER STRUCTURE ───────────────────────────────────────────────
const CHAPTERS = [
  {
    label: 'Act I — Foundation',
    color: '#8b5cf6',
    files: [
      'presentation-Introducing-MCP.html',
      'presentation-Coffee-System.html',
      'presentation-figma-mcp-master.html',
      'presentation-System-Builder.html',
    ]
  },
  {
    label: 'Act II — Environment Setup',
    color: '#06b6d4',
    files: [
      'setup-remote-mcp.html',
      'setup-desktop-mcp.html',
    ]
  },
  {
    label: 'Act III — 7 Core Skills',
    color: '#0ACF83',
    files: [
      'presentation-figma-use.html',
      'presentation-figma-generate-library.html',
      'presentation-figma-generate-design.html',
      'presentation-figma-implement-design.html',
      'presentation-figma-code-connect.html',
      'presentation-figma-ds-rules.html',
      'presentation-figma-initialization.html',
    ]
  },
  {
    label: 'Act IV — Production & Mastery',
    color: '#f59e0b',
    files: [
      'presentation-Tools-and-Prompts.html',
      'presentation-Make-to-Production.html',
      'presentation-autosync-handshake.html',
    ]
  },
  {
    label: 'Bonus Resources',
    color: '#64748b',
    files: [
      'figma-mcp-slides.html',
      'claude-code-windows-install.html',
    ]
  }
];

// ─── EXTRACT METADATA ────────────────────────────────────────────────────────
function extractMeta(filename) {
  const filepath = path.join(PRES_DIR, filename);
  if (!fs.existsSync(filepath)) return null;
  const content = fs.readFileSync(filepath, 'utf-8');

  const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch
    ? titleMatch[1].replace(/\s*\|\s*MCP Mastery/i, '').trim()
    : filename.replace('.html','');

  const tagMatch = content.match(/class="tag"[^>]*>([^<]+)<\/span>/i);
  const tag = tagMatch ? tagMatch[1].trim() : 'Module';

  // Smart slide count: Reveal <section> OR custom <div class="slide">
  const revealSlides = (content.match(/<section/gi) || []).length;
  const customSlides = (content.match(/class="slide["\s]/gi) || []).length;
  const slideCount = revealSlides || customSlides;

  const colorMatch = content.match(/--primary:\s*(#[a-f0-9]{3,6})/i)
                  || content.match(/--accent:\s*(#[a-f0-9]{3,6})/i);
  const color = colorMatch ? colorMatch[1] : '#8b5cf6';

  const hasAr = fs.existsSync(filepath.replace(/\.html$/, '.ar.html'));

  return { filename, title, tag, slideCount, color, hasAr };
}

// ─── BUILD FLAT MODULE LIST WITH CHAPTER INFO ────────────────────────────────
const allModules = [];
CHAPTERS.forEach(chapter => {
  chapter.files.forEach(filename => {
    const meta = extractMeta(filename);
    if (meta) allModules.push({ ...meta, chapter: chapter.label, chapterColor: chapter.color });
  });
});

const total = allModules.length;

// Log
console.log('🤖 COURSE AGENT v2 — Masterclass Edition\n');
CHAPTERS.forEach(ch => {
  console.log('  ' + ch.label);
  ch.files.forEach(f => {
    const m = allModules.find(x => x.filename === f);
    if (m) console.log('    ✓ ' + m.title + ' (' + m.slideCount + ' slides)');
    else   console.log('    ✗ NOT FOUND: ' + f);
  });
});
console.log('\n📊 ' + total + ' modules total\n');

// ─── BUILD SIDEBAR HTML ──────────────────────────────────────────────────────
let navHTML = '';
let globalIdx = 0;
CHAPTERS.forEach(chapter => {
  navHTML += '<li class="chapter-divider" style="--ch-color:' + chapter.color + '">' + chapter.label + '</li>\n';
  chapter.files.forEach(filename => {
    const m = allModules.find(x => x.filename === filename);
    if (!m) return;
    const i = globalIdx++;
    navHTML += '<li class="nav-item" data-index="' + i + '" id="nav-' + i + '" onclick="goTo(' + i + ')" style="--module-color:' + m.color + '">'
      + '<span class="nav-num">' + String(i+1).padStart(2,'0') + '</span>'
      + '<span class="nav-label">' + m.title + '</span>'
      + '<span class="nav-tag">' + m.tag + '</span>'
      + '</li>\n';
  });
});

// ─── BUILD FRAMES HTML ───────────────────────────────────────────────────────
const framesHTML = allModules.map((m, i) =>
  '<div class="frame-wrap ' + (i===0?'active':'') + '" id="frame-' + i + '" data-index="' + i + '">'
  + '<iframe src="presentations/' + m.filename + '" class="course-frame" id="iframe-' + i + '" title="' + m.title.replace(/"/g,'') + '" loading="' + (i===0?'eager':'lazy') + '"></iframe>'
  + '</div>'
).join('\n');

// ─── BUILD DOTS HTML ─────────────────────────────────────────────────────────
const dotsHTML = allModules.map((m, i) =>
  '<button class="dot ' + (i===0?'active':'') + '" data-index="' + i + '" onclick="goTo(' + i + ')" title="' + m.title.replace(/"/g,'') + '" style="--dot-color:' + m.color + '"></button>'
).join('');

const modulesJSON = JSON.stringify(allModules.map(m => ({ title: m.title, color: m.color, chapter: m.chapter, filename: m.filename, hasAr: m.hasAr })));

// ─── GENERATE HTML ───────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Figma MCP Masterclass — Unified Course</title>
  <meta name="description" content="Complete Figma MCP Masterclass: ${total} modules across 4 acts.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@400;600;800&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    :root{
      --bg:#09090b;--sidebar-w:290px;--topbar-h:56px;
      --glass:rgba(255,255,255,0.05);--glass-border:rgba(255,255,255,0.1);
      --text:#f1f5f9;--text-low:#64748b;
      --primary:#8b5cf6;--secondary:#06b6d4;
      --transition:0.35s cubic-bezier(.4,0,.2,1);
    }
    html,body{height:100%;font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);overflow:hidden}

    /* Progress */
    #progress-bar{position:fixed;top:0;left:0;right:0;height:3px;z-index:9999;background:rgba(255,255,255,0.06)}
    #progress-fill{height:100%;background:linear-gradient(90deg,var(--primary),var(--secondary));transition:width var(--transition);box-shadow:0 0 12px rgba(139,92,246,.5)}

    /* Topbar */
    #topbar{position:fixed;top:3px;left:0;right:0;height:var(--topbar-h);background:rgba(9,9,11,.9);backdrop-filter:blur(20px);border-bottom:1px solid var(--glass-border);display:flex;align-items:center;justify-content:space-between;padding:0 1.5rem;z-index:1000;gap:1rem}
    .topbar-logo{font-family:'Outfit',sans-serif;font-weight:800;font-size:1.05rem;background:linear-gradient(135deg,var(--primary),var(--secondary));-webkit-background-clip:text;-webkit-text-fill-color:transparent;white-space:nowrap}
    #module-title-bar{font-family:'Outfit',sans-serif;font-size:.85rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;text-align:center}
    #chapter-badge{font-size:.65rem;padding:.2rem .6rem;border-radius:20px;border:1px solid var(--glass-border);color:var(--text-low);white-space:nowrap;font-family:'JetBrains Mono',monospace}
    #counter-display{font-family:'JetBrains Mono',monospace;font-size:.75rem;color:var(--text-low);white-space:nowrap}
    #sidebar-toggle{background:var(--glass);border:1px solid var(--glass-border);border-radius:8px;padding:.4rem .7rem;color:var(--text);cursor:pointer;font-size:.85rem;transition:all .2s}
    #sidebar-toggle:hover{background:rgba(139,92,246,.2);border-color:var(--primary)}
    .topbar-link{text-decoration:none;font-size:.75rem;color:var(--text-low);padding:.35rem .65rem;border:1px solid var(--glass-border);border-radius:8px;transition:all .2s;white-space:nowrap}
    .topbar-link:hover{border-color:var(--primary);color:var(--primary)}

    /* Layout */
    #layout{display:flex;height:100%;padding-top:calc(var(--topbar-h) + 3px)}

    /* Sidebar */
    #sidebar{width:var(--sidebar-w);min-width:var(--sidebar-w);height:100%;background:rgba(9,9,11,.95);backdrop-filter:blur(20px);border-right:1px solid var(--glass-border);overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;transition:width var(--transition),min-width var(--transition),opacity var(--transition);z-index:100;scrollbar-width:thin;scrollbar-color:var(--glass-border) transparent}
    #sidebar.collapsed{width:0;min-width:0;opacity:0;pointer-events:none}
    #sidebar-header{padding:1rem 1.2rem .7rem;border-bottom:1px solid var(--glass-border);flex-shrink:0}
    #sidebar-header h3{font-family:'Outfit',sans-serif;font-weight:800;font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;color:var(--text-low)}
    #sidebar-header p{font-size:.65rem;color:var(--text-low);margin-top:.2rem}
    .nav-list{list-style:none;padding:.5rem .5rem;display:flex;flex-direction:column;gap:1px}

    /* Chapter divider */
    .chapter-divider{font-family:'Outfit',sans-serif;font-size:.6rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--ch-color,var(--primary));padding:.9rem .9rem .3rem;border-top:1px solid var(--glass-border);margin-top:.3rem}
    .chapter-divider:first-child{border-top:none;margin-top:0}

    /* Nav item */
    .nav-item{display:flex;flex-direction:column;padding:.55rem .8rem;border-radius:9px;cursor:pointer;border:1px solid transparent;transition:all .2s;position:relative;overflow:hidden}
    .nav-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--module-color,var(--primary));opacity:0;transition:opacity .2s;border-radius:0 2px 2px 0}
    .nav-item:hover{background:var(--glass);border-color:var(--glass-border)}
    .nav-item.active{background:rgba(139,92,246,.12);border-color:rgba(139,92,246,.3)}
    .nav-item.active::before{opacity:1}
    .nav-num{font-family:'JetBrains Mono',monospace;font-size:.55rem;color:var(--text-low);margin-bottom:2px}
    .nav-label{font-size:.75rem;font-weight:600;line-height:1.3;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .nav-item.active .nav-label{color:var(--primary)}
    .nav-tag{font-size:.55rem;color:var(--text-low);text-transform:uppercase;letter-spacing:.1em;margin-top:1px}

    /* Main */
    #main{flex:1;position:relative;overflow:hidden;display:flex;flex-direction:column}
    #frames-container{flex:1;position:relative;overflow:hidden}
    .frame-wrap{position:absolute;inset:0;opacity:0;transform:translateX(60px);transition:opacity var(--transition),transform var(--transition);pointer-events:none}
    .frame-wrap.active{opacity:1;transform:translateX(0);pointer-events:all}
    .frame-wrap.exit-left{opacity:0;transform:translateX(-60px)}
    .course-frame{width:100%;height:100%;border:none;display:block;background:#0a0a0d}

    /* Bottom nav */
    #bottom-nav{height:58px;background:rgba(9,9,11,.94);backdrop-filter:blur(20px);border-top:1px solid var(--glass-border);display:flex;align-items:center;justify-content:space-between;padding:0 1.5rem;gap:1rem;flex-shrink:0}
    .nav-btn{display:flex;align-items:center;gap:.5rem;padding:.45rem 1.1rem;border-radius:9px;border:1px solid var(--glass-border);background:var(--glass);color:var(--text);font-size:.8rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;white-space:nowrap}
    .nav-btn:hover:not(:disabled){background:rgba(139,92,246,.15);border-color:var(--primary);color:var(--primary)}
    .nav-btn:disabled{opacity:.3;cursor:not-allowed}
    .next-btn{background:rgba(139,92,246,.15);border-color:var(--primary);color:var(--primary)}
    .next-btn:hover:not(:disabled){background:rgba(139,92,246,.3)}
    #dots-container{display:flex;align-items:center;gap:3px;overflow:hidden;max-width:280px}
    .dot{width:7px;height:7px;border-radius:50%;background:var(--glass-border);border:1px solid var(--glass-border);cursor:pointer;transition:all .2s;flex-shrink:0}
    .dot.active{background:var(--dot-color,var(--primary));border-color:var(--dot-color,var(--primary));box-shadow:0 0 7px var(--dot-color,var(--primary));width:22px;border-radius:4px}
    #kb-hint{font-size:.6rem;color:var(--text-low);font-family:'JetBrains Mono',monospace;white-space:nowrap}
    kbd{display:inline-block;background:var(--glass);border:1px solid var(--glass-border);border-radius:3px;padding:1px 4px;font-size:.6rem}
    @media(max-width:768px){#sidebar,#kb-hint{display:none}}
  </style>
</head>
<body>
  <div id="progress-bar"><div id="progress-fill" style="width:0%"></div></div>

  <div id="topbar">
    <div class="topbar-logo">⚡ MCP MASTERCLASS</div>
    <div id="module-title-bar">Loading...</div>
    <div style="display:flex;align-items:center;gap:.7rem;flex-shrink:0">
      <span id="chapter-badge">Act I</span>
      <span id="counter-display">01 / ${total}</span>
      <button id="lang-toggle" onclick="toggleLanguage()" style="background:var(--glass);border:1px solid var(--glass-border);border-radius:8px;padding:.4rem .7rem;color:var(--text);cursor:pointer;font-size:.85rem;transition:all .2s">🌐 EN | AR</button>
      <button id="sidebar-toggle" onclick="toggleSidebar()">☰ Modules</button>
      <a href="index.html" class="topbar-link">← Library</a>
    </div>
  </div>

  <div id="layout">
    <aside id="sidebar">
      <div id="sidebar-header">
        <h3>Figma MCP Masterclass</h3>
        <p>${total} modules · 4 acts</p>
      </div>
      <ul class="nav-list">
        ${navHTML}
      </ul>
    </aside>

    <main id="main">
      <div id="frames-container">
        ${framesHTML}
      </div>
      <div id="bottom-nav">
        <button class="nav-btn" id="prev-btn" onclick="goTo(currentIndex-1)" disabled>← Previous</button>
        <div style="display:flex;flex-direction:column;align-items:center;gap:5px">
          <div id="dots-container">${dotsHTML}</div>
          <div id="kb-hint"><kbd>←</kbd> <kbd>→</kbd> navigate &nbsp;·&nbsp; <kbd>Esc</kbd> sidebar</div>
        </div>
        <button class="nav-btn next-btn" id="next-btn" onclick="goTo(currentIndex+1)">Next →</button>
      </div>
    </main>
  </div>

  <script>
    const TOTAL = ${total};
    const MODULES = ${modulesJSON};
    let currentIndex = 0;
    let sidebarOpen = true;
    let currentLang = 'en';

    function toggleLanguage() {
      currentLang = currentLang === 'en' ? 'ar' : 'en';
      document.getElementById('lang-toggle').innerText = currentLang === 'en' ? '🌐 EN | AR' : '🌐 AR | EN';
      
      MODULES.forEach((m, idx) => {
        if (m.hasAr || currentLang === 'en') {
          const iframe = document.getElementById('iframe-' + idx);
          const newSrc = 'presentations/' + (currentLang === 'en' ? m.filename : m.filename.replace('.html', '.ar.html'));
          if (iframe.getAttribute('src') !== newSrc) {
            iframe.src = newSrc;
          }
        }
      });
      
      checkTranslationStatus();
    }

    function checkTranslationStatus() {
      const m = MODULES[currentIndex];
      const titleBar = document.getElementById('module-title-bar');
      if (currentLang === 'ar' && !m.hasAr) {
         titleBar.innerText = m.title + ' (⏳ Arabic translation pending API...)';
         titleBar.style.color = '#f59e0b';
      } else {
         titleBar.innerText = m.title;
         titleBar.style.color = 'var(--text)';
      }
    }

    function goTo(index) {
      if (index < 0 || index >= TOTAL) return;
      const prev = document.getElementById('frame-' + currentIndex);
      const next = document.getElementById('frame-' + index);
      if (index > currentIndex) prev.classList.add('exit-left');
      else { prev.style.transform='translateX(60px)'; prev.style.opacity='0'; }
      prev.classList.remove('active');
      currentIndex = index;
      requestAnimationFrame(() => {
        next.classList.add('active');
        next.style.transform = '';
        next.style.opacity = '';
        setTimeout(() => {
          document.querySelectorAll('.frame-wrap').forEach(f => {
            if (!f.classList.contains('active')) f.classList.remove('exit-left');
          });
        }, 400);
      });
      updateUI();
    }

    function updateUI() {
      const pct = ((currentIndex + 1) / TOTAL) * 100;
      document.getElementById('progress-fill').style.width = pct + '%';
      document.getElementById('counter-display').textContent =
        String(currentIndex+1).padStart(2,'0') + ' / ' + TOTAL;
      const m = MODULES[currentIndex];
      document.getElementById('module-title-bar').textContent = m.title;
      document.getElementById('chapter-badge').textContent = m.chapter;
      document.getElementById('chapter-badge').style.borderColor = m.color;
      document.getElementById('chapter-badge').style.color = m.color;
      document.getElementById('prev-btn').disabled = currentIndex === 0;
      document.getElementById('next-btn').disabled = currentIndex === TOTAL - 1;
      document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.index) === currentIndex);
      });
      document.querySelectorAll('.dot').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.index) === currentIndex);
      });
      const activeNav = document.getElementById('nav-' + currentIndex);
      if (activeNav) activeNav.scrollIntoView({ behavior:'smooth', block:'nearest' });
      
      checkTranslationStatus();
    }

    function toggleSidebar() {
      sidebarOpen = !sidebarOpen;
      document.getElementById('sidebar').classList.toggle('collapsed', !sidebarOpen);
    }

    document.addEventListener('keydown', e => {
      if (e.key==='ArrowRight'||e.key==='ArrowDown') goTo(currentIndex+1);
      if (e.key==='ArrowLeft'||e.key==='ArrowUp') goTo(currentIndex-1);
      if (e.key==='Escape') toggleSidebar();
    });

    updateUI();
  </script>
</body>
</html>`;

fs.writeFileSync(OUTPUT_FILE, html, 'utf-8');
console.log('✅ Generated: ' + OUTPUT_FILE);
console.log('   → ' + total + ' modules in 4-act masterclass structure');
