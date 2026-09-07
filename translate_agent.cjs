#!/usr/bin/env node
/**
 * 🌐 TRANSLATION AGENT
 * Automates translating English HTML presentations into Arabic.
 * Preserves code blocks, HTML structure, and technical terms.
 */

const fs = require('fs');
const path = require('path');

const PRES_DIR = path.join(__dirname, 'presentations');

// ─── GEMINI CONFIG ────────────────────────────────────────────────────────────
const KEYS = [
  'AIzaSyDMk4Q1lsDwP2DnS_Kxo9jEsM1phXLQD2I',
  'AIzaSyBOuyZl1yGyTyIfv3mLSAp8fZJQNVROh8s',
  'AIzaSyAtGMwmQYmh5CwIrBe9UrML2zroXbE-QW4'
];
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash-lite'];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGemini(prompt) {
  let lastError = null;
  for (const key of KEYS) {
    for (const model of MODELS) {
      try {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              contents: [{ parts: [{ text: prompt }] }] 
          })
        });
        const data = await res.json();
        if (data.candidates && data.candidates[0]) {
          return data.candidates[0].content.parts[0].text;
        } else if (data.error) {
          lastError = data.error.message;
          console.log(`    [Key/Model failed] ${data.error.message}`);
          if (data.error.code === 429) {
             console.log(`    [Rate Limit] Sleeping for 65 seconds...`);
             await sleep(65000);
          }
        }
      } catch (e) {
         lastError = e.message;
         console.log(`    [Fetch failed] ${e.message}`);
      }
    }
  }
  throw new Error(`All Gemini keys exhausted. Last error: ${lastError}`);
}

async function translateFile(filename) {
  const filepath = path.join(PRES_DIR, filename);
  const outpath = filepath.replace(/\.html$/, '.ar.html');
  
  if (fs.existsSync(outpath)) {
      console.log(`  ⏭️  Skipping (already translated): ${filename}`);
      return true;
  }

  console.log(`  🤖 Translating: ${filename}...`);
  const html = fs.readFileSync(filepath, 'utf-8');

  const prompt = `You are an expert technical translator. Translate the following HTML presentation into Arabic.

CRITICAL RULES:
1. Preserve all HTML tags, structure, classes, IDs, inline styles, and attributes exactly. DO NOT modify the CSS.
2. DO NOT translate technical terms. Leave terms like 'Model Context Protocol', 'MCP', 'Figma API', 'JSON', 'Code Connect', 'UI', 'UX', 'React', 'Agent', etc. in English.
3. DO NOT translate the contents of code blocks (<pre>, <code>, <code-block>).
4. Add dir="rtl" to the <body> tag if it exists. Change <html lang="en"> to <html lang="ar" dir="rtl">.
5. Provide the fully translated HTML output, starting with <!DOCTYPE html>. Do not truncate the code.

SOURCE HTML:
${html}`;

  const translated = await callGemini(prompt);

  const idx = translated.toLowerCase().indexOf('<!doctype html>');
  if (idx === -1) {
    console.log('  ⚠  Gemini returned non-HTML or failed. Skipping.');
    return false;
  }

  const cleanHtml = translated.substring(idx).replace(/```html/g, '').replace(/```/g, '').trim();

  fs.writeFileSync(outpath, cleanHtml, 'utf-8');
  console.log(`  ✅ Saved: ${path.basename(outpath)}`);
  return true;
}

async function main() {
  console.log('🌐 TRANSLATION AGENT STARTED\n');

  // Discover all base presentation HTML files (excluding backups and already translated ones)
  const files = fs.readdirSync(PRES_DIR)
    .filter(f => f.endsWith('.html') && !f.includes('.backup.') && !f.includes('.ar.') && !f.includes('organize_'));

  // Some files like the claude-code-windows-install or figma-mcp-slides might be already mixed or arabic.
  // Actually, figma-mcp-slides.html is already in Arabic (as noted before). We shouldn't translate it to AR again.
  const filesToTranslate = files.filter(f => f !== 'figma-mcp-slides.html');

  console.log('📂 Found ' + filesToTranslate.length + ' presentations to translate.\n');

  let successCount = 0;
  for (const file of filesToTranslate) {
    try {
      const ok = await translateFile(file);
      if (ok) successCount++;
    } catch (e) {
      console.error(`  ❌ Error on ${file}: ${e.message}`);
    }
  }

  console.log('\n────────────────────────────────────────────────────────────');
  console.log(`✅ Translations complete. ${successCount}/${filesToTranslate.length} files processed.`);
  console.log('────────────────────────────────────────────────────────────\n');
}

main().catch(console.error);
