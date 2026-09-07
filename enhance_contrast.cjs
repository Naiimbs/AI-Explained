#!/usr/bin/env node
/**
 * 🎨 CONTRAST ENHANCER
 * Patches all skill + handshake presentations for better readability.
 * Also adds the two bonus files to the unified course.
 */

const fs = require('fs');
const path = require('path');

const PRES_DIR = path.join(__dirname, 'presentations');

// Files to enhance
const SKILL_FILES = [
  'presentation-figma-use.html',
  'presentation-figma-generate-library.html',
  'presentation-figma-generate-design.html',
  'presentation-figma-implement-design.html',
  'presentation-figma-code-connect.html',
  'presentation-figma-ds-rules.html',
  'presentation-figma-initialization.html',
  'presentation-autosync-handshake.html',
];

// CSS injection — appended before </style>
const CONTRAST_CSS = `
        /* ─── CONTRAST ENHANCEMENT PATCH ────────────────────── */
        .reveal .slides section {
            color: rgba(255, 255, 255, 0.95);
        }
        .glass-panel {
            background: rgba(255, 255, 255, 0.09) !important;
            backdrop-filter: blur(24px) !important;
            border: 1.5px solid rgba(255, 255, 255, 0.22) !important;
            box-shadow: 0 4px 36px rgba(0, 0, 0, 0.55) !important;
        }
        .glass-panel p,
        .glass-panel li,
        .glass-panel td {
            color: rgba(255, 255, 255, 0.9) !important;
            line-height: 1.78 !important;
        }
        .glass-panel strong {
            color: #ffffff !important;
        }
        .glass-panel h2,
        .glass-panel h3,
        .glass-panel h4 {
            color: #ffffff !important;
        }
        .code-block {
            background: #050508 !important;
            color: #e8e6e3 !important;
            border-left-width: 4px !important;
        }
        .tag {
            opacity: 1 !important;
            font-weight: 900 !important;
        }
        table th {
            color: rgba(255,255,255,0.7) !important;
        }
        table td {
            color: rgba(255,255,255,0.88) !important;
        }
        /* Active/green glass (autosync) */
        .glass-panel.active {
            background: rgba(34,197,94,0.14) !important;
            border-color: rgba(34,197,94,0.45) !important;
        }
        /* Pipe nodes (autosync) */
        .pipe-node {
            background: rgba(34,197,94,0.16) !important;
            border-color: rgba(34,197,94,0.5) !important;
            color: #ffffff !important;
            font-weight: 600 !important;
        }
`;

let patched = 0;
let skipped = 0;

for (const filename of SKILL_FILES) {
  const filepath = path.join(PRES_DIR, filename);

  if (!fs.existsSync(filepath)) {
    console.log('  ⚠  NOT FOUND: ' + filename);
    skipped++;
    continue;
  }

  let html = fs.readFileSync(filepath, 'utf-8');

  // Check if already patched
  if (html.includes('CONTRAST ENHANCEMENT PATCH')) {
    console.log('  ✓  Already patched: ' + filename);
    skipped++;
    continue;
  }

  // Inject CSS just before </style>
  html = html.replace('</style>', CONTRAST_CSS + '\n    </style>');

  fs.writeFileSync(filepath, html, 'utf-8');
  console.log('  ✅ Patched: ' + filename);
  patched++;
}

console.log('\n📊 Summary: ' + patched + ' patched, ' + skipped + ' skipped.');
