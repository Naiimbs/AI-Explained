#!/usr/bin/env node
/**
 * 🔍 CONTENT AUDIT AGENT
 * Audits all presentations for quality, identifies weak/missing content,
 * reads source markdown files, and uses Gemini AI to enhance weak slides.
 *
 * Usage:
 *   node audit_agent.cjs          — audit + report only
 *   node audit_agent.cjs --fix    — audit + auto-enhance weak presentations
 */

const fs = require('fs');
const path = require('path');

const PRES_DIR   = path.join(__dirname, 'presentations');
const ROOT_DIR   = __dirname;
const REPORT_OUT = path.join(__dirname, 'audit_report.md');
const FIX_MODE   = process.argv.includes('--fix');

// ─── GEMINI CONFIG ────────────────────────────────────────────────────────────
const KEYS   = [
  'AIzaSyDMk4Q1lsDwP2DnS_Kxo9jEsM1phXLQD2I',
  'AIzaSyBOuyZl1yGyTyIfv3mLSAp8fZJQNVROh8s',
  'AIzaSyAtGMwmQYmh5CwIrBe9UrML2zroXbE-QW4'
];
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash-lite'];

// ─── QUALITY THRESHOLDS ───────────────────────────────────────────────────────
const THRESHOLDS = {
  minSlides      : 5,
  minWordsPerSlide: 30,
  minTotalWords  : 200,
  mustHaveCode   : false, // set true for skill slides
};

// ─── SOURCE MARKDOWN MAP ──────────────────────────────────────────────────────
// Maps presentation filename → source markdown file(s) for content enrichment
const SOURCE_MAP = {
  'presentation-figma-use.html'             : ['skill-01-figma-use.md'],
  'presentation-figma-generate-library.html': ['skill-02-figma-generate-library.md'],
  'presentation-figma-generate-design.html' : ['skill-03-figma-generate-design.md'],
  'presentation-figma-implement-design.html': ['skill-04-figma-implement-design.md'],
  'presentation-figma-code-connect.html'    : ['skill-05-figma-code-connect.md'],
  'presentation-figma-ds-rules.html'        : ['skill-06-figma-ds-rules.md'],
  'presentation-figma-initialization.html'  : ['skill-07-figma-initialization.md'],
  'presentation-autosync-handshake.html'    : ['infrastructure-autosync-handshake.md'],
  'presentation-Introducing-MCP.html'       : ['start-figma-mcp.md'],
  'presentation-figma-mcp-master.html'      : ['local-server-figma.md', 'remote-server-figma.md'],
  'presentation-Tools-and-Prompts.html'     : ['tools2prompts.md'],
  'presentation-Make-to-Production.html'    : ['maketomcp.md'],
};

// ─── STEP 1: EXTRACT TEXT FROM HTML ──────────────────────────────────────────
function extractText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function countSlides(html) {
  const reveal  = (html.match(/<section[\s>]/gi) || []).length;
  const custom  = (html.match(/class="slide[\s"]/gi) || []).length;
  const scroll  = (html.match(/<section id="s\d/gi) || []).length;
  return Math.max(reveal, custom, scroll);
}

function wordCount(text) {
  return text.split(/\s+/).filter(w => w.length > 2).length;
}

function hasCodeExample(html) {
  return /<pre|<code|code-block|\.code-block/.test(html);
}

function hasGlassmorphism(html) {
  return /glass-card|glass-panel|backdrop-filter/.test(html);
}

function hasPremiumFonts(html) {
  return /Outfit|Inter|JetBrains/.test(html);
}

// ─── STEP 2: AUDIT A SINGLE FILE ─────────────────────────────────────────────
function auditFile(filename) {
  const filepath = path.join(PRES_DIR, filename);
  if (!fs.existsSync(filepath)) return null;

  const html  = fs.readFileSync(filepath, 'utf-8');
  const text  = extractText(html);
  const words = wordCount(text);
  const slides = countSlides(html);
  const wordsPerSlide = slides > 0 ? Math.round(words / slides) : 0;

  const issues = [];
  if (slides < THRESHOLDS.minSlides)       issues.push('⚠ Low slide count (' + slides + ')');
  if (words < THRESHOLDS.minTotalWords)    issues.push('⚠ Thin content (' + words + ' words)');
  if (wordsPerSlide < THRESHOLDS.minWordsPerSlide) issues.push('⚠ Sparse slides (' + wordsPerSlide + ' words/slide)');
  if (!hasCodeExample(html))               issues.push('💡 No code example');
  if (!hasGlassmorphism(html))             issues.push('🎨 Missing glassmorphism');
  if (!hasPremiumFonts(html))              issues.push('🔤 Missing premium fonts');

  const score = Math.max(0, 100 - (issues.length * 15));
  const status = score >= 85 ? '✅ PASS' : score >= 60 ? '⚠️  WARN' : '❌ FAIL';

  return { filename, slides, words, wordsPerSlide, issues, score, status };
}

// ─── STEP 3: READ SOURCE MARKDOWN ────────────────────────────────────────────
function readSourceMarkdown(filename) {
  const sources = SOURCE_MAP[filename] || [];
  let combined = '';
  for (const src of sources) {
    const p = path.join(ROOT_DIR, src);
    if (fs.existsSync(p)) {
      combined += '\n\n--- Source: ' + src + ' ---\n';
      combined += fs.readFileSync(p, 'utf-8');
    }
  }
  return combined.trim();
}

// ─── STEP 4: GEMINI ENHANCEMENT ──────────────────────────────────────────────
async function callGemini(prompt) {
  for (const key of KEYS) {
    for (const model of MODELS) {
      try {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        if (data.candidates && data.candidates[0]) {
          return data.candidates[0].content.parts[0].text;
        }
      } catch (e) { /* try next */ }
    }
  }
  throw new Error('All Gemini keys exhausted');
}

async function enhancePresentation(filename, audit, sourceContent) {
  const filepath = path.join(PRES_DIR, filename);
  const currentHtml = fs.readFileSync(filepath, 'utf-8');

  const prompt = `You are a masterclass slide designer for the Figma MCP course.

CURRENT PRESENTATION: ${filename}
AUDIT ISSUES: ${audit.issues.join(', ')}
CURRENT SLIDE COUNT: ${audit.slides}
CURRENT WORD COUNT: ${audit.words}

SOURCE CONTENT AVAILABLE:
${sourceContent || 'No specific source. Use your knowledge of Figma MCP.'}

CURRENT HTML (first 3000 chars):
${currentHtml.substring(0, 3000)}

YOUR TASK:
Return a COMPLETE, ENHANCED HTML presentation that:
1. Fixes all audit issues listed above
2. Uses the SAME visual style as the current file (dark theme, glassmorphism if present)
3. Has at minimum 6 slides/sections with rich technical content
4. Includes at least one real code example block
5. Has clear Figma MCP practical examples
6. Uses Outfit font for headings, Inter for body
7. Preserves the existing scroll-snap or Reveal.js format already used
8. Adds missing content from the source markdown

Return ONLY the complete HTML starting with <!DOCTYPE html>. No explanation.`;

  console.log('  🤖 Calling Gemini for ' + filename + '...');
  const enhanced = await callGemini(prompt);

  const idx = enhanced.toLowerCase().indexOf('<!doctype html>');
  if (idx === -1) {
    console.log('  ⚠  Gemini returned non-HTML. Skipping.');
    return false;
  }

  const cleanHtml = enhanced.substring(idx).replace(/```html/g, '').replace(/```/g, '').trim();

  // Backup original
  const backupPath = filepath.replace('.html', '.backup.html');
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filepath, backupPath);
    console.log('  📦 Backed up to ' + path.basename(backupPath));
  }

  fs.writeFileSync(filepath, cleanHtml, 'utf-8');
  console.log('  ✅ Enhanced: ' + filename);
  return true;
}

// ─── STEP 5: GENERATE REPORT ──────────────────────────────────────────────────
function generateReport(results) {
  const pass = results.filter(r => r.score >= 85).length;
  const warn = results.filter(r => r.score >= 60 && r.score < 85).length;
  const fail = results.filter(r => r.score < 60).length;

  let md = '# 🔍 Course Content Audit Report\n\n';
  md += '_Generated: ' + new Date().toISOString() + '_\n\n';
  md += '## Summary\n\n';
  md += '| Status | Count |\n|--------|-------|\n';
  md += '| ✅ PASS | ' + pass + ' |\n';
  md += '| ⚠️  WARN | ' + warn + ' |\n';
  md += '| ❌ FAIL | ' + fail + ' |\n';
  md += '| Total | ' + results.length + ' |\n\n';
  md += '---\n\n## Detailed Results\n\n';

  for (const r of results) {
    md += '### ' + r.status + ' `' + r.filename + '`\n\n';
    md += '| Metric | Value |\n|--------|-------|\n';
    md += '| Slides | ' + r.slides + ' |\n';
    md += '| Words | ' + r.words + ' |\n';
    md += '| Words/Slide | ' + r.wordsPerSlide + ' |\n';
    md += '| Score | ' + r.score + '/100 |\n\n';
    if (r.issues.length > 0) {
      md += '**Issues:**\n';
      r.issues.forEach(i => { md += '- ' + i + '\n'; });
    } else {
      md += '_No issues found._\n';
    }
    md += '\n';
  }

  return md;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 CONTENT AUDIT AGENT\n');
  console.log('Mode: ' + (FIX_MODE ? '🔧 AUDIT + AUTO-FIX' : '📋 AUDIT ONLY (run with --fix to enhance)') + '\n');

  // Discover all presentation HTML files (excluding backups)
  const files = fs.readdirSync(PRES_DIR)
    .filter(f => f.endsWith('.html') && !f.includes('.backup.') && !f.includes('organize_'));

  console.log('📂 Auditing ' + files.length + ' presentations...\n');

  const results = [];
  const needsFix = [];

  for (const filename of files) {
    const audit = auditFile(filename);
    if (!audit) continue;
    results.push(audit);

    const bar = '█'.repeat(Math.floor(audit.score / 10)) + '░'.repeat(10 - Math.floor(audit.score / 10));
    console.log(audit.status + ' ' + bar + ' ' + audit.score + '/100  ' + filename);
    if (audit.issues.length > 0) {
      audit.issues.forEach(i => console.log('       ' + i));
    }
    console.log('       Slides: ' + audit.slides + '  Words: ' + audit.words + '  W/Slide: ' + audit.wordsPerSlide);
    console.log();

    if (audit.score < 85) needsFix.push(audit);
  }

  // Save report
  const report = generateReport(results);
  fs.writeFileSync(REPORT_OUT, report, 'utf-8');
  console.log('📄 Report saved: audit_report.md\n');

  // Summary
  const pass = results.filter(r => r.score >= 85).length;
  const warn = results.filter(r => r.score >= 60 && r.score < 85).length;
  const fail = results.filter(r => r.score < 60).length;
  console.log('─'.repeat(60));
  console.log('RESULTS: ' + pass + ' PASS  ' + warn + ' WARN  ' + fail + ' FAIL  (of ' + results.length + ' total)');
  console.log('─'.repeat(60) + '\n');

  if (!FIX_MODE) {
    console.log('💡 Run with --fix to auto-enhance ' + needsFix.length + ' presentation(s).\n');
    return;
  }

  // Auto-fix weak presentations
  if (needsFix.length === 0) {
    console.log('✅ All presentations pass quality thresholds. Nothing to fix.\n');
    return;
  }

  console.log('🔧 AUTO-FIXING ' + needsFix.length + ' presentation(s)...\n');
  let fixed = 0;
  for (const audit of needsFix) {
    console.log('→ Processing: ' + audit.filename);
    const sourceContent = readSourceMarkdown(audit.filename);
    if (sourceContent) {
      console.log('  📚 Found source markdown (' + sourceContent.length + ' chars)');
    }
    try {
      const ok = await enhancePresentation(audit.filename, audit, sourceContent);
      if (ok) fixed++;
    } catch (e) {
      console.log('  ❌ Error: ' + e.message);
    }
    console.log();
  }

  console.log('─'.repeat(60));
  console.log('✅ Fixed: ' + fixed + '/' + needsFix.length + ' presentations enhanced.');
  console.log('💡 Run `node course_agent.cjs` to rebuild the unified course.');
  console.log('─'.repeat(60) + '\n');
}

main().catch(console.error);
