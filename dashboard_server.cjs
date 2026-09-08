require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;
const PRESENTATIONS_DIR = path.join(__dirname, 'presentations');

// Initialize Gemini safely only if GEMINI_API_KEY is configured
let ai = null;
if (process.env.GEMINI_API_KEY) {
    try {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log("✅ Google Gemini AI initialized with API Key.");
    } catch(e) {
        console.warn("⚠️ Could not initialize GoogleGenAI:", e.message);
    }
} else {
    console.log("ℹ️ Running without GEMINI_API_KEY. Presentations will use built-in structural parsing or Demo Mode.");
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
// Also serve presentations directory statically
app.use('/presentations', express.static(PRESENTATIONS_DIR));

// Root redirect to dashboard
app.get('/', (req, res) => {
    res.redirect('/dashboard.html');
});

// Ensure presentations dir exists
if (!fs.existsSync(PRESENTATIONS_DIR)) {
    fs.mkdirSync(PRESENTATIONS_DIR, { recursive: true });
}

// ─────────────────────────────────────────────────
// UTILITY: Make safe filename from title
// ─────────────────────────────────────────────────
const sanitizeForFilename = (str) => {
    return str
        .trim()
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

// ─────────────────────────────────────────────────
// UTILITY: Parse content text into structured sections
// ─────────────────────────────────────────────────
async function generateSectionsWithAI(rawContent, isDemo = false) {
    if (isDemo) {
        console.log("⚡ Demo Mode: Using rich pre-structured demo presentation sections...");
        return [
            {
                title: "01 — Chatbots vs Copilots vs Agents",
                badge: "COMPARISON",
                subtitle: "The Three Evolutionary Phases of AI Interactions",
                archetype: "comparison",
                points: [
                    { lead: "Chatbots (Reactive)", text: "Text in, text out interfaces for simple dynamic queries without state." },
                    { lead: "Copilots (Context-Aware)", text: "Assist users inline with full contextual awareness (e.g. GitHub Copilot)." },
                    { lead: "Agents (Autonomous)", text: "Goal-driven loops equipped with reasoning, memory, tools, and multi-step execution." }
                ],
                comparison: {
                    leftTitle: "Chatbots & Copilots",
                    leftBadge: "Human-Driven",
                    leftItems: ["Single-turn question & response", "Requires human for every single step", "No external system write actions", "Stateless / ephemeral context"],
                    rightTitle: "Autonomous AI Agents",
                    rightBadge: "Goal-Driven",
                    rightItems: ["Multi-turn autonomous planning loop", "Executes tools & writes to databases", "Self-corrects upon receiving errors", "Maintains short & long-term memory"]
                }
            },
            {
                title: "02 — The Autonomous Agentic Loop",
                badge: "ARCHITECTURE",
                subtitle: "How Agents Reason, Execute Tools, and Verify Outcomes",
                archetype: "flow",
                points: [
                    { lead: "Perception & Input", text: "Ingests user request, environmental context, and memory state." },
                    { lead: "Reasoning & Plan", text: "LLM determines the necessary sequence of actions and tool calls." },
                    { lead: "Tool Execution", text: "Calls real APIs, databases, or local scripts to perform real-world actions." },
                    { lead: "Observation & Feedback", text: "Inspects output, verifies success, and iterates until the goal is met." }
                ],
                flowSteps: [
                    { num: "01", name: "User Goal", desc: "Intent & Constraints", icon: "🎯" },
                    { num: "02", name: "Reasoning (LLM)", desc: "Decide Next Tool", icon: "🧠" },
                    { num: "03", name: "Tool Execution", desc: "API / Database Call", icon: "🔧" },
                    { num: "04", name: "Goal Verified", desc: "Observation & Output", icon: "✅" }
                ]
            },
            {
                title: "03 — SKILL.md Standard & Agent Capabilities",
                badge: "SPECIFICATION",
                subtitle: "Turning Plain Documentation into Executable Agent Skills",
                archetype: "code",
                points: [
                    { lead: "Progressive Disclosure", text: "Frontmatter metadata is indexed first; body is loaded only when required." },
                    { lead: "Executable Instructions", text: "Transforms manual runbooks into deterministic steps for AI agents." },
                    { lead: "Tool & Script Binding", text: "Binds Python/Node.js helper scripts to complex multi-step workflows." }
                ],
                codeSnippet: `---
name: generate-presentation
description: Transform raw text into interactive HTML presentation slides
---
# Workflow Instructions
1. Ingest & clean input content
2. Send to Gemini AI for structural segmentation
3. Apply slide archetypes (Hero, Flow, Steps, Comparison)
4. Compile responsive glassmorphic HTML with Presenter Script`
            }
        ];
    }

    if (!rawContent || rawContent.trim().length === 0) return [];

    if (!ai || !process.env.GEMINI_API_KEY) {
        console.log("ℹ️ No GEMINI_API_KEY set — structuring content with rich built-in parser.");
        return parseContentIntoSections(rawContent);
    }
    
    console.log("🤖 Sending content to Gemini AI for deep structural analysis...");
    const prompt = `You are an expert AI presentation architect and UX designer.
Analyze the following presentation text and transform it into a rich JSON array of slide sections.

Each section MUST be a JSON object with:
- "title": Clear, engaging section title (e.g. "01 — Concept Hook")
- "badge": 1-word tag ("CONCEPT" | "ARCHITECTURE" | "WORKFLOW" | "COMPARISON" | "TECHNICAL" | "UX")
- "subtitle": 1 short sentence summarizing the core insight
- "archetype": choose the best match from ["flow", "steps", "comparison", "code", "breakdown"]
- "points": array of 3-4 objects: [{ "lead": "Short bold keyphrase", "text": "Detailed explanation sentence" }]
- If archetype is "flow": include "flowSteps": [{ "num": "01", "name": "Step Name", "desc": "Short description", "icon": "emoji" }] (3-4 items)
- If archetype is "steps": include "stepCards": [{ "num": "01", "title": "...", "desc": "..." }] (3-4 items)
- If archetype is "comparison": include "comparison": { "leftTitle": "...", "leftBadge": "...", "leftItems": ["..."], "rightTitle": "...", "rightBadge": "...", "rightItems": ["..."] }
- If archetype is "code": include "codeSnippet": "clean code or yaml or schema example"

Respond ONLY with a valid JSON array of objects. Do not wrap in markdown or backticks.

Text to analyze:
${rawContent.substring(0, 10000)}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        let text = response.text || '';
        text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
        const sections = JSON.parse(text);
        console.log(`🤖 Gemini generated ${sections.length} rich multi-archetype sections!`);
        return sections;
    } catch (err) {
        console.error("❌ Gemini AI parsing failed, falling back to smart parser.", err.message);
        return parseContentIntoSections(rawContent);
    }
}

function parseContentIntoSections(rawContent) {
    const rawSections = [];
    const lines = rawContent.split('\n');
    let currentTitle = null;
    let currentLines = [];

    for (const line of lines) {
        const sectionMatch = line.match(/^(\d{1,2}|#+)\s*[—–\-.:]\s*(.+)/) || line.match(/^(?:Section|Part|Episode|الحلقة|مفهوم)\s*(\d*)\s*[—–\-.:]\s*(.+)/i);
        if (sectionMatch) {
            if (currentTitle) {
                rawSections.push({ title: currentTitle, lines: currentLines });
            }
            currentTitle = line.trim().replace(/^#+\s*/, '');
            currentLines = [];
        } else {
            if (line.trim()) currentLines.push(line.trim());
        }
    }
    if (currentTitle) {
        rawSections.push({ title: currentTitle, lines: currentLines });
    }

    if (rawSections.length === 0) {
        const paragraphs = rawContent.split(/\n{2,}/).filter(p => p.trim());
        paragraphs.forEach((p, i) => {
            const pLines = p.split('\n').filter(l => l.trim());
            rawSections.push({
                title: pLines[0] ? pLines[0].substring(0, 60) : `Part ${i + 1}`,
                lines: pLines.slice(1)
            });
        });
    }

    // Transform raw sections into rich archetype objects
    return rawSections.map((sec, idx) => {
        const titleLower = sec.title.toLowerCase();
        const fullText = sec.lines.join(' ');
        let archetype = 'flow';
        let badge = 'CONCEPT';

        if (titleLower.includes('vs') || titleLower.includes('فرق') || titleLower.includes('مقارنة') || titleLower.includes('differ')) {
            archetype = 'comparison';
            badge = 'COMPARISON';
        } else if (titleLower.includes('step') || titleLower.includes('خطو') || titleLower.includes('work') || titleLower.includes('process') || titleLower.includes('loop')) {
            archetype = 'steps';
            badge = 'WORKFLOW';
        } else if (titleLower.includes('code') || titleLower.includes('skill') || titleLower.includes('yaml') || titleLower.includes('json') || titleLower.includes('api') || fullText.includes('```')) {
            archetype = 'code';
            badge = 'TECHNICAL';
        } else if (idx % 2 === 1) {
            archetype = 'flow';
            badge = 'ARCHITECTURE';
        } else {
            archetype = 'breakdown';
            badge = 'DEEP DIVE';
        }

        // Extract structured points with bold leads
        const points = sec.lines.slice(0, 5).map((l, lIdx) => {
            const parts = l.split(/[:—–-]\s+/);
            if (parts.length > 1) {
                return {
                    lead: parts[0].replace(/^[\d.*•-]+\s*/, '').trim(),
                    text: parts.slice(1).join(' - ').trim()
                };
            }
            return {
                lead: `Core Insight #${lIdx + 1}`,
                text: l.replace(/^[\d.*•-]+\s*/, '').trim()
            };
        });

        // Generate archetype-specific visuals
        const result = {
            title: sec.title,
            badge: badge,
            subtitle: points[0] ? points[0].text.substring(0, 90) + '...' : 'Key conceptual breakdown for this section.',
            archetype: archetype,
            points: points.length > 0 ? points : [{ lead: "Main Takeaway", text: sec.title }]
        };

        if (archetype === 'flow') {
            result.flowSteps = [
                { num: "01", name: "Input & Context", desc: "User intent & data", icon: "📥" },
                { num: "02", name: "Reasoning Engine", desc: "Decision & Planning", icon: "🧠" },
                { num: "03", name: "Tool Execution", desc: "API / Action triggers", icon: "⚡" },
                { num: "04", name: "Observation & Goal", desc: "Verification loop", icon: "🎯" }
            ];
        } else if (archetype === 'steps') {
            result.stepCards = (points.length >= 3 ? points.slice(0, 4) : [
                { lead: "Phase 1", text: "Preparation and requirement analysis" },
                { lead: "Phase 2", text: "Core execution and parameter mapping" },
                { lead: "Phase 3", text: "Validation and result verification" },
                { lead: "Phase 4", text: "Continuous feedback loop" }
            ]).map((p, pIdx) => ({
                num: `0${pIdx + 1}`,
                title: p.lead,
                desc: p.text
            }));
        } else if (archetype === 'comparison') {
            result.comparison = {
                leftTitle: "Traditional Systems",
                leftBadge: "Static / Manual",
                leftItems: ["Fixed deterministic scripts", "No self-correcting error handling", "Human required for every branch"],
                rightTitle: "AI Agent Architecture",
                rightBadge: "Autonomous / Adaptive",
                rightItems: ["Dynamic tool invocation based on goal", "Automatic reasoning & error recovery", "Operates independently toward objectives"]
            };
        } else if (archetype === 'code') {
            result.codeSnippet = `# Specification & Configuration
name: ${sec.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}
version: "2.0"
execution_mode: "autonomous"
tools:
  - name: "system_search"
  - name: "execute_action"
instructions: |
  1. Inspect incoming context
  2. Synthesize structured plan
  3. Verify output matches requirements`;
        }

        return result;
    });
}

function parseScriptSections(rawScript, slideCount) {
    if (!rawScript || rawScript.trim() === '-' || rawScript.trim().length < 10) {
        return [];
    }
    const parts = rawScript.split(/^##\s+/m).filter(p => p.trim());
    return parts.map((part, i) => {
        const firstLine = part.split('\n')[0].trim();
        const body = part.split('\n').slice(1).join('\n').trim();
        return {
            title: firstLine || `Part ${i + 1}`,
            body: body,
            slideRef: i
        };
    });
}

function getEpisodeOrderNum(episodeNumber) {
    if (!episodeNumber) return '01';
    const num = parseInt(episodeNumber, 10);
    return isNaN(num) ? episodeNumber : String(num).padStart(2, '0');
}

async function generatePresentationHtml(payload) {
    const { episodeNumber, title, content, script, language, isDemo } = payload;

    const epNum = getEpisodeOrderNum(episodeNumber);
    const lang = language || 'Ar+En';
    const isRTL = lang !== 'En';
    const htmlLang = isRTL ? 'ar' : 'en';
    const htmlDir = isRTL ? 'rtl' : 'ltr';

    // Parse content into rich sections
    const sections = await generateSectionsWithAI(content || '', isDemo);
    const scriptParts = parseScriptSections(script || '', sections.length);

    let slidesHtml = '';

    // ── SLIDE 0: HERO SLIDE ──
    const agendaChips = sections.slice(0, 4).map((s, idx) => 
        `<span style="display:inline-flex;align-items:center;gap:.4rem;padding:.35rem .85rem;background:var(--bg-1);border:1px solid var(--border-med);border-radius:var(--r-pill);font-size:.78rem;font-weight:700;color:var(--ts);">
          <span style="color:var(--tool);">${String(idx + 1).padStart(2, '0')}</span> ${s.title.replace(/^\d+\s*[—–-]\s*/, '').substring(0, 24)}
        </span>`
    ).join('');

    slidesHtml += `
  <!-- SLIDE 0: Hero -->
  <section class="slide active" id="slide-0">
    <div class="con" style="display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:80vh;text-align:center;gap:var(--s5);">
      <div class="reveal">
        <div class="hero-badge">
          <span style="font-size:1.1rem;">🎓</span>
          <span style="font-weight:800;letter-spacing:.04em;text-transform:uppercase;">AI Explained by a UX Designer</span>
          <span style="padding:.15rem .65rem;background:var(--tool-muted);color:var(--tool);border-radius:var(--r-pill);font-size:.75rem;font-weight:800;border:1px solid rgba(2,132,199,0.2);">EP ${epNum}</span>
        </div>
      </div>
      
      <h1 class="t-display reveal" style="color:var(--tp);max-width:920px;">
        ${title}
      </h1>
      
      <p class="t-body reveal" style="color:var(--ts);max-width:680px;font-size:1.1rem;">
        ${lang === 'Ar+En' ? 'دليل عملي تفاعلي مدعوم بنماذج بصرية وتصميم أنظمة الذكاء الاصطناعي الحديثة.' : lang === 'Ar' ? 'شرح مفصل بالعربية وتطبيق عملي لهندسة النظم الذكية.' : 'A deep, visual dive into modern autonomous AI systems and UX principles.'}
      </p>

      <div class="reveal" style="display:flex;gap:var(--s2);flex-wrap:wrap;justify-content:center;margin-top:var(--s3);max-width:800px;">
        ${agendaChips}
      </div>

      <div class="reveal" style="display:flex;gap:var(--s3);align-items:center;margin-top:var(--s4);">
        <button onclick="showSlide(1)" class="btn-primary-action">
          <span>Start Presentation ➔</span>
        </button>
        <span class="t-xs" style="color:var(--tm);font-weight:600;">Use <strong>← / →</strong> or <strong>Space</strong> to navigate • Press <strong>S</strong> for Script</span>
      </div>
    </div>
  </section>`;

    // ── DYNAMIC CONTENT SLIDES ──
    sections.slice(0, 18).forEach((sec, i) => {
        const slideIdx = i + 1;
        const archetype = sec.archetype || 'flow';
        const badgeColor = sec.badge === 'COMPARISON' ? 'st-app' : sec.badge === 'WORKFLOW' ? 'st-tool' : sec.badge === 'TECHNICAL' ? 'st-warn' : 'st-brain';

        // Left Points Column
        const pointsListHtml = (sec.points || []).map((p, pIdx) => `
          <div class="point-item reveal">
            <div class="point-bullet">
              <span>${pIdx + 1}</span>
            </div>
            <div class="point-body">
              <div class="point-lead">${p.lead || `Key Point ${pIdx + 1}`}</div>
              <div class="point-desc">${p.text || ''}</div>
            </div>
          </div>
        `).join('');

        let visualBlockHtml = '';

        if (archetype === 'flow' && sec.flowSteps) {
            // Interactive Architectural Flow
            const flowNodes = sec.flowSteps.map((st, sIdx) => `
              <div class="flow-node">
                <div class="flow-node-icon">${st.icon || '⚡'}</div>
                <div class="flow-node-num">STEP ${st.num}</div>
                <div class="flow-node-name">${st.name}</div>
                <div class="flow-node-desc">${st.desc}</div>
              </div>
              ${sIdx < sec.flowSteps.length - 1 ? `<div class="flow-connector">➔</div>` : ''}
            `).join('');

            visualBlockHtml = `
              <div class="mock-window reveal">
                <div class="mock-header">
                  <div class="mock-dots">
                    <span class="mock-dot r"></span>
                    <span class="mock-dot y"></span>
                    <span class="mock-dot g"></span>
                  </div>
                  <div class="mock-title">SYSTEM ARCHITECTURE PIPELINE</div>
                  <span class="live-pill">● LIVE PIPELINE</span>
                </div>
                <div class="mock-body">
                  <div class="flow-track">
                    ${flowNodes}
                  </div>
                </div>
              </div>`;
        } else if (archetype === 'steps' && sec.stepCards) {
            // Numbered 4-card sequence
            const cards = sec.stepCards.map(c => `
              <div class="step-card reveal">
                <div class="step-card-num">${c.num}</div>
                <div class="step-card-title">${c.title}</div>
                <div class="step-card-desc">${c.desc}</div>
              </div>
            `).join('');

            visualBlockHtml = `
              <div class="step-grid">
                ${cards}
              </div>`;
        } else if (archetype === 'comparison' && sec.comparison) {
            // Side-by-Side Comparison Matrix
            const cmp = sec.comparison;
            visualBlockHtml = `
              <div class="cmp-grid reveal">
                <div class="cmp-card cmp-left">
                  <div class="cmp-header">
                    <div class="cmp-badge-left">${cmp.leftBadge || 'Traditional'}</div>
                    <div class="cmp-title">${cmp.leftTitle}</div>
                  </div>
                  <ul class="cmp-list">
                    ${(cmp.leftItems || []).map(it => `<li><span style="color:var(--danger);font-weight:700;">✕</span> ${it}</li>`).join('')}
                  </ul>
                </div>
                <div class="cmp-card cmp-right">
                  <div class="cmp-header">
                    <div class="cmp-badge-right">${cmp.rightBadge || 'Next-Gen Agent'}</div>
                    <div class="cmp-title">${cmp.rightTitle}</div>
                  </div>
                  <ul class="cmp-list">
                    ${(cmp.rightItems || []).map(it => `<li><span style="color:var(--app);font-weight:700;">✓</span> ${it}</li>`).join('')}
                  </ul>
                </div>
              </div>`;
        } else if (archetype === 'code' && sec.codeSnippet) {
            // Technical Code Window Mockup
            visualBlockHtml = `
              <div class="mock-window reveal">
                <div class="mock-header">
                  <div class="mock-dots">
                    <span class="mock-dot r"></span>
                    <span class="mock-dot y"></span>
                    <span class="mock-dot g"></span>
                  </div>
                  <div class="mock-title">SPECIFICATION SCHEMA</div>
                  <span class="code-lang-tag">YAML / MARKDOWN</span>
                </div>
                <div class="mock-code-body">
                  <pre><code>${sec.codeSnippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                </div>
              </div>`;
        } else {
            // Breakdown Feature Highlight Cards
            visualBlockHtml = `
              <div class="breakdown-grid reveal">
                <div class="feature-box feat-blue">
                  <div class="feat-icon">⚡</div>
                  <div class="feat-title">Reasoning & Perception</div>
                  <div class="feat-desc">Autonomous multi-step planning and runtime validation.</div>
                </div>
                <div class="feature-box feat-purple">
                  <div class="feat-icon">🧠</div>
                  <div class="feat-title">State & Memory Loop</div>
                  <div class="feat-desc">Maintains persistent operational context and error recovery.</div>
                </div>
                <div class="feature-box feat-green">
                  <div class="feat-icon">🎯</div>
                  <div class="feat-title">Action Execution</div>
                  <div class="feat-desc">Direct interface with tools, APIs, and real-world infrastructure.</div>
                </div>
              </div>`;
        }

        slidesHtml += `
  <!-- SLIDE ${slideIdx}: ${sec.title} -->
  <section class="slide" id="slide-${slideIdx}">
    <div class="con">
      <div class="sh">
        <div class="stag ${badgeColor} reveal">📍 ${sec.badge || 'CONCEPT'} • ${String(slideIdx).padStart(2, '0')}</div>
        <h2 class="t-h1 reveal" style="color:var(--tp);margin-bottom:.4rem;">${sec.title}</h2>
        <p class="t-sm reveal" style="color:var(--ts);max-width:700px;margin:0 auto;">${sec.subtitle || ''}</p>
      </div>

      <div class="g2-rich">
        <!-- Structured Concepts Column -->
        <div class="gc reveal points-container">
          <div class="points-header">
            <span class="points-header-icon">💡</span>
            <span class="points-header-title">Core Principles & Logic</span>
          </div>
          <div class="points-list">
            ${pointsListHtml}
          </div>
        </div>

        <!-- Dynamic Visual Archetype Column -->
        <div class="visual-container">
          ${visualBlockHtml}
        </div>
      </div>
    </div>
  </section>`;
    });

    // ── KEY TAKEAWAYS SLIDE ──
    const lastIdx = Math.min(sections.length, 18) + 1;
    slidesHtml += `
  <!-- SLIDE ${lastIdx}: Key Takeaways -->
  <section class="slide" id="slide-${lastIdx}">
    <div class="con">
      <div class="sh">
        <div class="stag st-app reveal">🎯 Summary • Key Takeaways</div>
        <h2 class="t-h1 reveal" style="color:var(--tp);">النقاط الجوهرية التي يجب تذكرها</h2>
        <p class="t-sm reveal" style="color:var(--ts);">Core conceptual takeaways for Episode ${epNum}</p>
      </div>
      <div class="g3">
        <div class="gc reveal" style="border-top:4px solid var(--tool);display:flex;flex-direction:column;gap:var(--s3);">
          <div style="font-size:2.2rem;">🔍</div>
          <div class="t-h3" style="color:var(--tool);">${title}</div>
          <p class="t-sm" style="color:var(--ts);line-height:1.7;">الـAgent لا يتبع مساراً ثابتاً، بل يتكيف ذاتياً مع المعطيات والنتائج.</p>
          <div style="margin-top:auto;"><span class="tag-pill" style="background:var(--tool-muted);color:var(--tool);">CORE PRINCIPLE</span></div>
        </div>
        <div class="gc reveal" style="border-top:4px solid var(--brain);display:flex;flex-direction:column;gap:var(--s3);">
          <div style="font-size:2.2rem;">🧠</div>
          <div class="t-h3" style="color:var(--brain);">Context vs Memory vs Tools</div>
          <p class="t-sm" style="color:var(--ts);line-height:1.7;">فصل طبقات الإدراك والتنفيذ يمنح الوكلاء الذكاء والاستقرار التشغيلي.</p>
          <div style="margin-top:auto;"><span class="tag-pill" style="background:var(--brain-muted);color:var(--brain);">ARCHITECTURE</span></div>
        </div>
        <div class="gc reveal" style="border-top:4px solid var(--app);display:flex;flex-direction:column;gap:var(--s3);">
          <div style="font-size:2.2rem;">🎨</div>
          <div class="t-h3" style="color:var(--app);">UX Transparency</div>
          <p class="t-sm" style="color:var(--ts);line-height:1.7;">جعل خطوات الوكيل الذكي مرئية للمستخدم يرفع مستوى الثقة والتحكم.</p>
          <div style="margin-top:auto;"><span class="tag-pill" style="background:var(--app-muted);color:var(--app);">UX VALUE</span></div>
        </div>
      </div>
    </div>
  </section>`;

    // ── FINAL SLIDE: NEXT EPISODE ──
    const finalIdx = lastIdx + 1;
    slidesHtml += `
  <!-- SLIDE ${finalIdx}: Next Episode Hook -->
  <section class="slide" id="slide-${finalIdx}">
    <div class="con" style="display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:75vh;text-align:center;gap:var(--s5);">
      <div class="reveal">
        <div style="font-size:3.5rem;margin-bottom:var(--s3);">🚀</div>
        <div class="stag st-tool">Next Episode Preview</div>
      </div>
      <h2 class="t-display reveal" style="color:var(--tp);font-size:clamp(2rem,5vw,3.2rem);">What's Coming Next?</h2>
      <p class="t-body reveal" style="color:var(--ts);max-width:600px;font-size:1.1rem;">
        Episode ${String(parseInt(epNum, 10) + 1).padStart(2, '0')} — سنستكشف المفاهيم المتقدمة لبناء الأنظمة الذكية وتكامل الذاكرة.
      </p>
      <div class="reveal" style="display:flex;gap:var(--s3);align-items:center;margin-top:var(--s3);">
        <a href="index.html" class="btn-primary-action" style="text-decoration:none;">
          <span>📚 Back to Course Index</span>
        </a>
      </div>
    </div>
  </section>`;

    const totalSlides = finalIdx + 1;

    // Navigation pills
    const navSections = ['Intro', ...sections.slice(0, 10).map((s, idx) => `S${idx + 1}`), 'Summary', 'End'];
    const navPills = Array.from({ length: totalSlides }, (_, i) => 
        `<button class="np${i === 0 ? ' current' : ''}" data-index="${i}" title="Slide ${i + 1}">${String(i + 1).padStart(2, '0')}</button>`
    ).join('');

    // Script panel content
    let scriptPanelContent = '';
    if (scriptParts.length > 0) {
        scriptPanelContent = scriptParts.map((part, i) => `
          <div class="script-section" data-slides="${i},${Math.min(i + 1, totalSlides - 1)}">
            <div class="script-sec-badge">§ SLIDE ${String(i + 1).padStart(2, '0')}</div>
            <div style="font-weight:800;font-size:1rem;color:var(--tp);margin-bottom:.4rem;">${part.title}</div>
            <div style="color:var(--ts);white-space:pre-line;line-height:1.8;">${part.body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
          </div>`).join('');
    } else {
        scriptPanelContent = `
          <div style="color:var(--ts);padding:1.5rem;text-align:center;">
            <div style="font-size:2rem;margin-bottom:.5rem;">📜</div>
            <div style="font-weight:700;">No Script Provided</div>
            <div class="t-xs" style="color:var(--tm);margin-top:.3rem;">You can add presenter notes when creating the presentation.</div>
          </div>`;
    }

    return `<!DOCTYPE html>
<html lang="${htmlLang}" dir="${htmlDir}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title} — الحلقة ${epNum}</title>
  <meta name="description" content="${title} — AI Presentation Agent, Episode ${epNum}"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@300;400;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>
    :root{
      --font-sans:"IBM Plex Sans Arabic","IBM Plex Sans","Segoe UI",sans-serif;
      --font-mono:"JetBrains Mono",monospace;
      --bg:#ffffff;--bg-1:#f8fafc;--bg-2:#f1f5f9;--bg-3:#e2e8f0;
      --border-light:rgba(0,0,0,0.06);--border-med:rgba(0,0,0,0.12);--border-dark:rgba(0,0,0,0.22);
      --card-bg:#ffffff;
      --tool:#0284c7;--tool-muted:rgba(2,132,199,0.08);--tool-light:#38bdf8;
      --brain:#7c3aed;--brain-muted:rgba(124,58,237,0.08);--brain-light:#a78bfa;
      --app:#059669;--app-muted:rgba(5,150,105,0.08);
      --danger:#dc2626;--danger-m:rgba(220,38,38,0.08);
      --warning:#d97706;--warning-m:rgba(217,119,6,0.08);
      --tp:#0f172a;--ts:#475569;--tm:#64748b;
      --s2:.5rem;--s3:.75rem;--s4:1rem;--s5:1.25rem;--s6:1.5rem;
      --s8:2rem;--s10:2.5rem;--s12:3rem;
      --r-sm:6px;--r-md:10px;--r-lg:16px;--r-xl:24px;--r-pill:999px;
      --sh-sm:0 1px 3px rgba(0,0,0,0.05);
      --sh-md:0 4px 6px -1px rgba(0,0,0,0.06),0 2px 4px -1px rgba(0,0,0,0.04);
      --sh-lg:0 10px 15px -3px rgba(0,0,0,0.08),0 4px 6px -2px rgba(0,0,0,0.04);
      --ease:cubic-bezier(.4,0,.2,1);--tr:.25s var(--ease);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{font-size:16px}
    body{font-family:var(--font-sans);background:var(--bg);color:var(--tp);line-height:1.75;overflow:hidden;width:100vw;height:100vh;user-select:none;}
    .t-display{font-family:'Outfit',sans-serif;font-size:clamp(2.3rem,6.5vw,4.2rem);font-weight:900;line-height:1.08;letter-spacing:-.02em;}
    .t-h1{font-family:'Outfit',sans-serif;font-size:clamp(1.7rem,4.5vw,2.4rem);font-weight:800;line-height:1.2;letter-spacing:-.01em;}
    .t-h2{font-family:'Outfit',sans-serif;font-size:clamp(1.2rem,2.8vw,1.6rem);font-weight:700;line-height:1.3;}
    .t-h3{font-family:'Outfit',sans-serif;font-size:1.05rem;font-weight:700;line-height:1.35;}
    .t-body{font-size:.95rem;line-height:1.75;}
    .t-sm{font-size:.84rem;line-height:1.6;}
    .t-xs{font-size:.72rem;line-height:1.5;}
    .t-mono{font-family:var(--font-mono);font-size:.82rem;}
    .slide{position:absolute;top:0;left:0;width:100vw;height:100vh;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;padding:calc(var(--s10) + 20px) var(--s6) var(--s12);opacity:0;visibility:hidden;pointer-events:none;transition:opacity 0.5s var(--ease),visibility 0.5s;z-index:1;}
    .slide.active{opacity:1;visibility:visible;pointer-events:auto;z-index:10;}
    .con{max-width:1120px;width:100%;margin:auto;}
    .gc{background:var(--card-bg);border:1px solid var(--border-light);border-radius:var(--r-lg);padding:var(--s8);box-shadow:var(--sh-sm);transition:transform var(--tr),border-color var(--tr),box-shadow var(--tr);}
    .gc:hover{transform:translateY(-2px);border-color:var(--border-med);box-shadow:var(--sh-md);}
    nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:var(--s3) var(--s6);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--s2);background:rgba(255,255,255,0.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--border-light);}
    .nlogo{font-family:'Outfit',sans-serif;font-size:.78rem;font-weight:900;color:var(--tool);letter-spacing:.08em;text-transform:uppercase;display:flex;align-items:center;gap:.4rem;text-decoration:none;}
    .npills{display:flex;gap:var(--s2);flex-wrap:wrap;}
    .np{padding:.22rem .65rem;border-radius:var(--r-pill);font-size:.67rem;font-weight:600;border:1px solid transparent;background:var(--bg-1);color:var(--ts);transition:all var(--tr);cursor:pointer;border:1px solid var(--border-light);}
    .np:hover{background:var(--bg-2);color:var(--tp);border-color:var(--border-med);}
    .np.current{background:var(--tool-muted);color:var(--tool);border-color:var(--tool-light);font-weight:700;}
    .nep{font-size:.7rem;color:var(--tm);font-weight:600;}
    .sh{text-align:center;margin-bottom:var(--s6);}
    .stag{display:inline-flex;align-items:center;gap:.35rem;padding:.25rem .75rem;border-radius:var(--r-pill);font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:var(--s3);}
    .st-tool{background:var(--tool-muted);color:var(--tool);border:1px solid rgba(2,132,199,0.2);}
    .st-brain{background:var(--brain-muted);color:var(--brain);border:1px solid rgba(124,58,237,0.2);}
    .st-app{background:var(--app-muted);color:var(--app);border:1px solid rgba(5,150,105,0.2);}
    .st-warn{background:var(--warning-m);color:var(--warning);border:1px solid rgba(217,119,6,0.2);}
    .reveal{opacity:0;transform:translateY(16px);transition:opacity 0.5s var(--ease),transform 0.5s var(--ease);}
    .reveal.visible{opacity:1;transform:translateY(0);}
    .g2{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:var(--s6);}
    .g3{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--s6);}
    .hero-badge{display:inline-flex;align-items:center;gap:.5rem;background:var(--bg-1);border:1px solid var(--border-med);padding:.35rem 1rem;border-radius:var(--r-pill);font-size:.8rem;color:var(--ts);font-weight:600;margin-bottom:var(--s4);}
    .deck-controls{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:90;display:flex;gap:var(--s2);align-items:center;background:rgba(255,255,255,0.92);border:1px solid var(--border-med);border-radius:var(--r-pill);padding:.35rem .6rem;box-shadow:var(--sh-md);backdrop-filter:blur(8px);}
    .dc-btn{background:transparent;border:none;padding:.3rem .8rem;border-radius:var(--r-pill);color:var(--ts);cursor:pointer;font-weight:700;font-size:.82rem;transition:all var(--tr);}
    .dc-btn:hover:not(:disabled){background:var(--bg-2);color:var(--tp);}
    .dc-btn:disabled{opacity:.35;cursor:not-allowed;}
    .dc-counter{font-size:.78rem;font-weight:700;color:var(--tm);padding:0 var(--s2);min-width:52px;text-align:center;}

    /* Rich Archetype Styles */
    .g2-rich { display: grid; grid-template-columns: 1.1fr 1fr; gap: var(--s6); align-items: stretch; min-height: 440px; }
    @media(max-width: 860px) { .g2-rich { grid-template-columns: 1fr; } }
    
    .points-container { display: flex; flex-direction: column; gap: var(--s4); justify-content: center; }
    .points-header { display: flex; align-items: center; gap: .5rem; font-weight: 800; font-size: .95rem; color: var(--tool); margin-bottom: .25rem; }
    .points-header-icon { font-size: 1.2rem; }
    .points-list { display: flex; flex-direction: column; gap: var(--s3); }
    .point-item { display: flex; gap: var(--s3); align-items: flex-start; padding: .65rem .85rem; background: var(--bg-1); border-radius: var(--r-md); border-left: 3px solid var(--tool); transition: all var(--tr); }
    .point-item:hover { transform: translateX(4px); background: #ffffff; box-shadow: var(--sh-sm); border-color: var(--brain); }
    .point-bullet { width: 24px; height: 24px; border-radius: var(--r-pill); background: var(--tool-muted); color: var(--tool); font-weight: 800; font-size: .75rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: .15rem; }
    .point-lead { font-weight: 800; color: var(--tp); font-size: .92rem; margin-bottom: .15rem; }
    .point-desc { color: var(--ts); font-size: .84rem; line-height: 1.6; }

    .visual-container { display: flex; flex-direction: column; justify-content: center; }
    
    .mock-window { background: #0f172a; border: 1px solid rgba(255,255,255,0.12); border-radius: var(--r-lg); overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.25); color: #f8fafc; }
    .mock-header { background: #1e293b; padding: .65rem 1rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .mock-dots { display: flex; gap: .35rem; }
    .mock-dot { width: 10px; height: 10px; border-radius: var(--r-pill); }
    .mock-dot.r { background: #ef4444; } .mock-dot.y { background: #f59e0b; } .mock-dot.g { background: #10b981; }
    .mock-title { font-family: var(--font-mono); font-size: .7rem; font-weight: 700; color: #94a3b8; letter-spacing: .08em; }
    .live-pill { font-size: .65rem; font-weight: 800; color: #38bdf8; background: rgba(56,189,248,0.15); padding: .15rem .5rem; border-radius: var(--r-pill); }
    .mock-body { padding: var(--s5); display: flex; flex-direction: column; justify-content: center; min-height: 280px; }
    .mock-code-body { padding: var(--s4) var(--s5); font-family: var(--font-mono); font-size: .8rem; line-height: 1.7; color: #cbd5e1; overflow-x: auto; max-height: 360px; }
    .code-lang-tag { font-family: var(--font-mono); font-size: .65rem; font-weight: 800; color: #a78bfa; background: rgba(167,139,250,0.15); padding: .15rem .5rem; border-radius: var(--r-pill); }

    .flow-track { display: flex; flex-direction: column; gap: var(--s3); }
    .flow-node { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--r-md); padding: .65rem 1rem; display: grid; grid-template-columns: auto auto 1fr; gap: .75rem; align-items: center; transition: all var(--tr); }
    .flow-node:hover { background: rgba(255,255,255,0.12); border-color: #38bdf8; transform: translateY(-2px); }
    .flow-node-icon { font-size: 1.3rem; }
    .flow-node-num { font-family: var(--font-mono); font-size: .68rem; font-weight: 800; color: #38bdf8; }
    .flow-node-name { font-weight: 800; font-size: .88rem; color: #ffffff; }
    .flow-node-desc { font-size: .78rem; color: #94a3b8; text-align: right; }
    .flow-connector { text-align: center; color: #38bdf8; font-weight: 800; font-size: 1rem; opacity: .7; line-height: .8; }

    .step-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--s3); }
    .step-card { background: var(--card-bg); border: 1px solid var(--border-light); border-radius: var(--r-md); padding: var(--s4); box-shadow: var(--sh-sm); transition: all var(--tr); display: flex; flex-direction: column; gap: .3rem; }
    .step-card:hover { transform: translateY(-3px); border-color: var(--tool); box-shadow: var(--sh-md); }
    .step-card-num { font-family: var(--font-mono); font-size: .72rem; font-weight: 800; color: var(--tool); background: var(--tool-muted); display: inline-block; width: fit-content; padding: .1rem .45rem; border-radius: var(--r-pill); }
    .step-card-title { font-weight: 800; font-size: .9rem; color: var(--tp); }
    .step-card-desc { font-size: .8rem; color: var(--ts); line-height: 1.55; }

    .cmp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s3); }
    .cmp-card { background: var(--card-bg); border-radius: var(--r-md); padding: var(--s4); box-shadow: var(--sh-sm); display: flex; flex-direction: column; gap: var(--s3); }
    .cmp-left { border: 1px solid rgba(220,38,38,0.25); background: linear-gradient(180deg, rgba(220,38,38,0.02) 0%, var(--card-bg) 100%); }
    .cmp-right { border: 2px solid var(--app); background: linear-gradient(180deg, rgba(5,150,105,0.04) 0%, var(--card-bg) 100%); }
    .cmp-badge-left { font-size: .65rem; font-weight: 800; color: var(--danger); background: var(--danger-m); padding: .15rem .5rem; border-radius: var(--r-pill); display: inline-block; width: fit-content; }
    .cmp-badge-right { font-size: .65rem; font-weight: 800; color: var(--app); background: var(--app-muted); padding: .15rem .5rem; border-radius: var(--r-pill); display: inline-block; width: fit-content; }
    .cmp-title { font-weight: 800; font-size: .92rem; color: var(--tp); margin-top: .2rem; }
    .cmp-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .4rem; font-size: .8rem; color: var(--ts); }

    .breakdown-grid { display: flex; flex-direction: column; gap: var(--s3); }
    .feature-box { padding: var(--s4); border-radius: var(--r-md); background: var(--card-bg); border: 1px solid var(--border-light); box-shadow: var(--sh-sm); transition: all var(--tr); }
    .feature-box:hover { transform: translateY(-2px); box-shadow: var(--sh-md); }
    .feat-blue { border-right: 4px solid var(--tool); }
    .feat-purple { border-right: 4px solid var(--brain); }
    .feat-green { border-right: 4px solid var(--app); }
    .feat-icon { font-size: 1.4rem; margin-bottom: .2rem; }
    .feat-title { font-weight: 800; font-size: .92rem; color: var(--tp); }
    .feat-desc { font-size: .82rem; color: var(--ts); line-height: 1.6; }

    .btn-primary-action { background: linear-gradient(135deg, var(--tool) 0%, #0284c7 100%); color: #ffffff; border: none; padding: .65rem 1.6rem; border-radius: var(--r-pill); font-family: 'Outfit', sans-serif; font-size: .95rem; font-weight: 800; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(2,132,199,0.3); transition: all var(--tr); }
    .btn-primary-action:hover { transform: translateY(-2px); box-shadow: 0 15px 20px -3px rgba(2,132,199,0.4); }
    .tag-pill { font-size: .68rem; font-weight: 800; padding: .2rem .6rem; border-radius: var(--r-pill); display: inline-block; }

    .script-panel{position:fixed;top:0;right:0;width:380px;max-width:90vw;height:100vh;background:var(--bg);border-left:1px solid var(--border-med);z-index:200;transform:translateX(105%);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);display:flex;flex-direction:column;user-select:text;}
    .script-panel.open{transform:translateX(0);}
    .script-header{padding:.9rem 1.25rem;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between;background:var(--bg-1);}
    .script-title{display:flex;align-items:center;gap:.5rem;font-weight:800;font-size:.95rem;color:var(--tp);}
    .script-shortcut-hint{background:var(--bg-2);border:1px solid var(--border-med);padding:.15rem .45rem;border-radius:var(--r-sm);font-size:.68rem;color:var(--tm);font-family:var(--font-mono);font-weight:700;}
    .script-actions{display:flex;align-items:center;gap:.4rem;}
    .script-btn{background:transparent;border:1px solid var(--border-light);border-radius:var(--r-sm);width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;color:var(--ts);cursor:pointer;transition:all var(--tr);}
    .script-btn:hover{background:var(--bg-2);color:var(--tp);border-color:var(--border-med);}
    .script-btn.close-btn{font-size:1.1rem;color:var(--tm);}
    .script-btn.close-btn:hover{color:var(--danger);background:var(--danger-m);border-color:rgba(220,38,38,0.2);}
    .script-content{flex:1;overflow-y:auto;padding:1.25rem;font-size:0.95rem;line-height:1.85;color:var(--tp);scroll-behavior:smooth;}
    .script-section{padding:.85rem 1rem;border-radius:var(--r-md);margin-bottom:1.25rem;border-right:3px solid transparent;background:transparent;transition:all 0.25s ease;cursor:pointer;}
    .script-section:hover{background:var(--bg-1);}
    .script-section.active-section{background:var(--tool-muted);border-right-color:var(--tool);box-shadow:var(--sh-sm);}
    .script-sec-badge{display:inline-block;font-family:var(--font-mono);font-size:.72rem;font-weight:700;color:var(--tool);margin-bottom:.3rem;}
    .script-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.15);z-index:150;opacity:0;pointer-events:none;transition:opacity .3s;}
    .script-backdrop.visible{opacity:1;pointer-events:auto;}
    .script-toggle-btn{background:var(--bg-1);border:1px solid var(--border-med);border-radius:var(--r-pill);padding:.28rem .85rem;font-family:var(--font-sans);font-size:.72rem;font-weight:700;color:var(--ts);cursor:pointer;transition:all var(--tr);display:flex;align-items:center;gap:.35rem;}
    .script-toggle-btn:hover{background:var(--bg-2);color:var(--tp);border-color:var(--border-dark);}
  </style>
</head>
<body>
  <!-- NAV -->
  <nav>
    <a class="nlogo" href="index.html">🎓 <span>AI Explained</span> <span class="nep">EP ${epNum}</span></a>
    <div class="npills">
      ${navPills}
    </div>
    <div style="display:flex;gap:.5rem;align-items:center;">
      <button class="script-toggle-btn" id="scriptToggleBtn">📜 Script <span class="script-shortcut-hint">S</span></button>
    </div>
  </nav>

  <!-- SLIDES -->
  ${slidesHtml}

  <!-- DECK CONTROLS -->
  <div class="deck-controls">
    <button class="dc-btn" id="prevBtn" disabled>← Prev</button>
    <span class="dc-counter" id="slideCounter">1 / ${totalSlides}</span>
    <button class="dc-btn" id="nextBtn">Next →</button>
  </div>

  <!-- SCRIPT BACKDROP -->
  <div class="script-backdrop" id="scriptBackdrop"></div>

  <!-- SCRIPT PANEL -->
  <div class="script-panel" id="scriptPanel">
    <div class="script-header">
      <div class="script-title">
        📜 <span>Presenter Script</span> <span class="script-shortcut-hint">S</span>
      </div>
      <div class="script-actions">
        <button class="script-btn" id="scriptZoomOut" title="Decrease font">A-</button>
        <button class="script-btn" id="scriptZoomIn" title="Increase font">A+</button>
        <button class="script-btn close-btn" id="scriptCloseBtn" title="Close">✕</button>
      </div>
    </div>
    <div class="script-content" id="scriptContent">
      ${scriptPanelContent}
    </div>
  </div>

  <script>
  // ── Slide Engine ──
  const slides = document.querySelectorAll('.slide');
  const navLinks = document.querySelectorAll('.np');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const slideCounter = document.getElementById('slideCounter');
  const scriptPanel = document.getElementById('scriptPanel');
  const scriptBackdrop = document.getElementById('scriptBackdrop');
  const scriptToggleBtn = document.getElementById('scriptToggleBtn');
  const scriptCloseBtn = document.getElementById('scriptCloseBtn');
  const scriptZoomIn = document.getElementById('scriptZoomIn');
  const scriptZoomOut = document.getElementById('scriptZoomOut');
  const scriptContent = document.getElementById('scriptContent');
  const scriptSections = document.querySelectorAll('.script-section');

  let currentSlideIndex = 0;
  let scriptFontSize = 0.95;

  function showSlide(idx) {
    if (idx < 0 || idx >= slides.length) return;
    slides[currentSlideIndex]?.classList.remove('active');
    navLinks[currentSlideIndex]?.classList.remove('current');
    currentSlideIndex = idx;
    const slide = slides[currentSlideIndex];
    slide.classList.add('active');
    navLinks[currentSlideIndex]?.classList.add('current');
    slideCounter.textContent = (currentSlideIndex + 1) + ' / ' + slides.length;
    prevBtn.disabled = currentSlideIndex === 0;
    nextBtn.disabled = currentSlideIndex === slides.length - 1;
    // Trigger animations
    const reveals = slide.querySelectorAll('.reveal');
    reveals.forEach((el, i) => {
      el.classList.remove('visible');
      setTimeout(() => el.classList.add('visible'), 80 + i * 100);
    });
    updateScriptHighlight(currentSlideIndex);
  }

  function toggleScriptPanel() {
    const isOpen = scriptPanel.classList.toggle('open');
    scriptBackdrop.classList.toggle('visible', isOpen);
  }

  function closeScriptPanel() {
    scriptPanel.classList.remove('open');
    scriptBackdrop.classList.remove('visible');
  }

  function updateScriptHighlight(slideIdx) {
    scriptSections.forEach(sec => {
      const refs = sec.getAttribute('data-slides').split(',').map(s => parseInt(s.trim()));
      sec.classList.toggle('active-section', refs.includes(slideIdx));
    });
    const active = document.querySelector('.script-section.active-section');
    if (active && scriptPanel.classList.contains('open')) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  scriptSections.forEach(sec => {
    sec.addEventListener('click', () => {
      const refs = sec.getAttribute('data-slides').split(',').map(s => parseInt(s.trim()));
      showSlide(refs[0]);
    });
  });

  scriptToggleBtn?.addEventListener('click', e => { e.stopPropagation(); toggleScriptPanel(); });
  scriptCloseBtn?.addEventListener('click', closeScriptPanel);
  scriptBackdrop?.addEventListener('click', closeScriptPanel);
  scriptZoomIn?.addEventListener('click', e => { e.stopPropagation(); if (scriptFontSize < 1.4) { scriptFontSize += 0.1; scriptContent.style.fontSize = scriptFontSize + 'rem'; }});
  scriptZoomOut?.addEventListener('click', e => { e.stopPropagation(); if (scriptFontSize > 0.75) { scriptFontSize -= 0.1; scriptContent.style.fontSize = scriptFontSize + 'rem'; }});

  document.body.addEventListener('click', e => {
    if (e.target.closest('button,nav,.np,.deck-controls,.script-panel,a')) return;
    if (currentSlideIndex < slides.length - 1) showSlide(currentSlideIndex + 1);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 's' || e.key === 'S') { e.preventDefault(); toggleScriptPanel(); return; }
    if (e.key === 'Escape') { if (scriptPanel.classList.contains('open')) { closeScriptPanel(); return; } }
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
      if (currentSlideIndex < slides.length - 1) { e.preventDefault(); showSlide(currentSlideIndex + 1); }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      if (currentSlideIndex > 0) { e.preventDefault(); showSlide(currentSlideIndex - 1); }
    }
  });

  prevBtn?.addEventListener('click', () => showSlide(currentSlideIndex - 1));
  nextBtn?.addEventListener('click', () => showSlide(currentSlideIndex + 1));
  navLinks.forEach(btn => {
    btn.addEventListener('click', () => showSlide(parseInt(btn.getAttribute('data-index'))));
  });

  showSlide(0);
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────
// UTILITY: Generate and write index.html
// ─────────────────────────────────────────────────
function generateAndWriteIndex(opts = {}) {
    const { instructorName = '', instructorRole = '', instructorSummary = '' } = opts;

    // Try to read saved instructor data if not provided
    const metaFile = path.join(PRESENTATIONS_DIR, '_meta.json');
    let savedMeta = {};
    if (fs.existsSync(metaFile)) {
        try { savedMeta = JSON.parse(fs.readFileSync(metaFile, 'utf8')); } catch(e) {}
    }
    const iName = instructorName || savedMeta.instructorName || '';
    const iRole = instructorRole || savedMeta.instructorRole || '';
    const iSummary = instructorSummary || savedMeta.instructorSummary || '';

    // Save meta for future auto-regeneration
    if (instructorName) {
        fs.writeFileSync(metaFile, JSON.stringify({ instructorName, instructorRole, instructorSummary }), 'utf8');
    }

    const files = fs.readdirSync(PRESENTATIONS_DIR)
        .filter(f => f.endsWith('.html') && f !== 'index.html')
        .sort();

    const cardItems = files.map((file, index) => {
        const prettyName = file
            .replace(/^presentation-/, '')
            .replace(/\.html$/, '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());

        return `
        <a href="${file}" class="card">
          <div class="card-ep">Episode ${String(index + 1).padStart(2, '0')}</div>
          <h2 class="card-title">${prettyName}</h2>
          <div class="card-icon">→</div>
        </a>`;
    }).join('');

    const indexHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Presentation Agent — Course Index</title>
    <meta name="description" content="Complete course index for AI Presentation Agent — interactive presentations">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root{--bg:#f8fafc;--tp:#0f172a;--ts:#475569;--tool:#0284c7;--tool-light:#38bdf8;--brain:#7c3aed;--sh-lg:0 20px 25px -5px rgba(0,0,0,0.05),0 10px 10px -5px rgba(0,0,0,0.02);--sh-md:0 10px 15px -3px rgba(0,0,0,0.05),0 4px 6px -2px rgba(0,0,0,0.025);}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Outfit',sans-serif;background:linear-gradient(135deg,#e0e7ff 0%,#f1f5f9 100%);color:var(--tp);padding:40px 20px;min-height:100vh;}
        .container{max-width:1000px;margin:auto;}
        .hero{text-align:center;margin-bottom:60px;padding:50px 40px;background:rgba(255,255,255,0.7);backdrop-filter:blur(20px);border-radius:24px;border:1px solid rgba(255,255,255,0.8);box-shadow:var(--sh-lg);}
        .hero h1{color:var(--tool);font-size:clamp(2rem,5vw,3rem);font-weight:900;margin-bottom:15px;letter-spacing:-0.02em;}
        .instructor-badge{display:inline-flex;flex-direction:column;align-items:center;margin-top:20px;}
        .instructor-name{font-size:1.25rem;font-weight:800;color:var(--tp);}
        .instructor-role{font-size:.9rem;color:var(--tool);font-weight:700;background:rgba(2,132,199,0.1);padding:4px 12px;border-radius:99px;margin-top:5px;}
        .instructor-summary{margin-top:15px;color:var(--ts);font-size:.95rem;line-height:1.6;max-width:600px;margin-left:auto;margin-right:auto;}
        .section-title{font-size:1.5rem;font-weight:800;margin-bottom:25px;display:flex;align-items:center;gap:10px;}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:25px;}
        .card{background:rgba(255,255,255,0.7);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.6);border-radius:16px;padding:25px;text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:12px;transition:all .3s cubic-bezier(.4,0,.2,1);box-shadow:var(--sh-md);position:relative;overflow:hidden;}
        .card::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;background:var(--tool);transform:scaleY(0.3);transition:transform .3s;transform-origin:center;border-radius:4px 0 0 4px;}
        .card:hover{transform:translateY(-5px);box-shadow:var(--sh-lg);background:#fff;border-color:var(--tool-light);}
        .card:hover::before{transform:scaleY(1);}
        .card-ep{font-size:.75rem;font-weight:800;color:var(--tool);text-transform:uppercase;letter-spacing:.1em;}
        .card-title{font-size:1.2rem;font-weight:700;line-height:1.4;margin:0;}
        .card-icon{align-self:flex-end;margin-top:auto;color:var(--brain);font-size:1.5rem;opacity:.2;transition:opacity .3s;}
        .card:hover .card-icon{opacity:1;}
        .updated-badge{display:inline-block;font-size:.7rem;background:rgba(5,150,105,.1);color:#059669;padding:3px 10px;border-radius:99px;font-weight:700;margin-top:5px;}
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>🎓 AI Presentation Agent</h1>
            <p style="color:var(--ts);font-size:1.1rem;max-width:600px;margin:0 auto;">Complete course index — ${files.length} episode${files.length !== 1 ? 's' : ''} available</p>
            ${iName ? `
            <div class="instructor-badge">
                <div class="instructor-name">${iName}</div>
                ${iRole ? `<div class="instructor-role">${iRole}</div>` : ''}
            </div>
            ${iSummary ? `<div class="instructor-summary">${iSummary}</div>` : ''}
            ` : ''}
            <div class="updated-badge">Last updated: ${new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</div>
        </div>
        <div class="section-title"><span>📚</span> Course Episodes</div>
        <div class="grid">
            ${cardItems || '<p style="color:var(--ts);">No presentations yet.</p>'}
        </div>
    </div>
</body>
</html>`;

    const indexPath = path.join(PRESENTATIONS_DIR, 'index.html');
    fs.writeFileSync(indexPath, indexHtml, 'utf8');
    console.log(`[index] Auto-regenerated index.html — ${files.length} presentations`);
}

// ─────────────────────────────────────────────────
// ROUTE 1: Create real presentation HTML (async simulation-friendly)
// The generation happens in stages with slight delays so the
// frontend polling gets realistic status updates.
// ─────────────────────────────────────────────────
const generationJobs = {}; // jobId → { status, stage, htmlFilename, presentationUrl }

app.post('/api/create-presentation', (req, res) => {
    const { episodeNumber, title, content, script, language, isDemo } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    // Create a unique job ID
    const jobId = `job_${Date.now()}`;
    const safeTitle = sanitizeForFilename(title);
    const presentationFilename = `presentation-${safeTitle}.html`;
    const presentationPath = path.join(PRESENTATIONS_DIR, presentationFilename);
    const presentationUrl = `/presentations/${presentationFilename}`;

    // Register job as "processing"
    generationJobs[jobId] = {
        status: 'processing',
        stage: 'collecting',
        percent: 0,
        htmlFilename: presentationFilename,
        presentationUrl: null
    };

    // Respond immediately with jobId
    res.json({ jobId, message: 'Generation started', filename: presentationFilename });

    // ── Simulate staged generation with real output at end ──
    const stages = [
        { name: 'collecting',    label: 'Collector Agent',  delay: 900,  percent: 12 },
        { name: 'structuring',   label: 'Structurer Agent', delay: 1100, percent: 26 },
        { name: 'planning',      label: 'Slide Planner',    delay: 1100, percent: 42 },
        { name: 'html_arch',     label: 'HTML Architect',   delay: 1200, percent: 58 },
        { name: 'ui_design',     label: 'UI Designer',      delay: 1100, percent: 74 },
        { name: 'visual_design', label: 'Visual Designer',  delay: 1000, percent: 86 },
        { name: 'qa',            label: 'Visual QA',        delay: 900,  percent: 94 },
    ];

    let cumulativeDelay = 300;

    stages.forEach(stage => {
        cumulativeDelay += stage.delay;
        setTimeout(() => {
            if (generationJobs[jobId]) {
                generationJobs[jobId].stage = stage.name;
                generationJobs[jobId].percent = stage.percent;
                console.log(`[${jobId}] Stage: ${stage.label} (${stage.percent}%)`);
            }
        }, cumulativeDelay);
    });

    // Final step: actually write the HTML file, then update index
    cumulativeDelay += 800;
    setTimeout(async () => {
        try {
            const html = await generatePresentationHtml({ episodeNumber, title, content, script, language, isDemo });
            fs.writeFileSync(presentationPath, html, 'utf8');
            console.log(`[${jobId}] ✅ Written: ${presentationFilename}`);

            // Auto-sync index
            generateAndWriteIndex();

            generationJobs[jobId].status = 'done';
            generationJobs[jobId].stage = 'complete';
            generationJobs[jobId].percent = 100;
            generationJobs[jobId].presentationUrl = presentationUrl;
            generationJobs[jobId].indexUrl = '/presentations/index.html';

        } catch (err) {
            console.error(`[${jobId}] ❌ Error generating presentation:`, err);
            generationJobs[jobId].status = 'error';
            generationJobs[jobId].error = err.message;
        }
    }, cumulativeDelay);
});

// ─────────────────────────────────────────────────
// ROUTE 2: Poll job status
// ─────────────────────────────────────────────────
app.get('/api/status/:jobId', (req, res) => {
    const job = generationJobs[req.params.jobId];
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
});

// ─────────────────────────────────────────────────
// ROUTE 3: Generate Course Cover Page (Index)
// ─────────────────────────────────────────────────
app.post('/api/generate-index', (req, res) => {
    const { instructorName, instructorRole, instructorSummary } = req.body;
    try {
        generateAndWriteIndex({ instructorName, instructorRole, instructorSummary });
        res.json({ message: 'Index page generated successfully', url: '/presentations/index.html' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate index: ' + err.message });
    }
});

// ─────────────────────────────────────────────────
// ROUTE 4: Request Summary
// ─────────────────────────────────────────────────
app.post('/api/request-summary', (req, res) => {
    const filePath = path.join(__dirname, 'request_summary.txt');
    const content = 'Generate a comprehensive summary (resume) of all course episodes in the presentations folder. Extract key learnings and structure them logically.';
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        res.json({ message: 'Summary request queued successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to request summary' });
    }
});

// ─────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n✅ Dashboard server running at http://localhost:${PORT}`);
    console.log(`   Dashboard UI  → http://localhost:${PORT}/dashboard.html`);
    console.log(`   Presentations → http://localhost:${PORT}/presentations/index.html\n`);
});
