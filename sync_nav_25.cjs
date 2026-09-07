const fs = require('fs');
const path = require('path');

const presentationsDir = './presentations';
const files = [
    'whatsmcp.html',
    'figmaMCPserver.html',
    'what-is-the-figma-mcp-server.html',
    'compare-figma-remote-and-desktop-mcp-servers.html',
    'setup-remote-mcp.html',
    'setup-desktop-mcp.html',
    'presentation-mcp-skills.html',
    'presentation-figma-create-file.html',
    'presentation-figma-use.html',
    'presentation-figma-generate-library.html',
    'presentation-figma-generate-design.html',
    'presentation-figma-implement-design.html',
    'presentation-figma-code-connect.html',
    'presentation-code-connect-ui.html',
    'presentation-figma-ds-rules.html',
    'presentation-advanced-workflows.html',
    'test-automation-presentation.html',
    'create-plugin-mcp.html',
    'presentation-ux-masterclass.html',
    'presentation-meta-prompts.html',
    'presentation-vscode-bridge.html',
    'presentation-mcp-ecosystem.html',
    'presentation-inverse-workflow.html',
    'presentation-ultra-setup.html'
];

const newNavOverlay = '<h2>Technical Library Index</h2>' +
    '<div class="overlay-grid">' +
        '<a href="whatsmcp.html" class="overlay-link">01: Core Concept: What is MCP?</a>' +
        '<a href="figmaMCPserver.html" class="overlay-link">02: Unified Figma MCP Ecosystem</a>' +
        '<a href="what-is-the-figma-mcp-server.html" class="overlay-link">03: Figma MCP Server Overview</a>' +
        '<a href="compare-figma-remote-and-desktop-mcp-servers.html" class="overlay-link">04: Remote vs. Desktop Comparison</a>' +
        '<a href="setup-remote-mcp.html" class="overlay-link">05: Remote Server Setup Guide</a>' +
        '<a href="setup-desktop-mcp.html" class="overlay-link">06: Desktop Server Setup Guide</a>' +
        '<a href="presentation-mcp-skills.html" class="overlay-link">07: MCP Skills Overview</a>' +
        '<a href="presentation-figma-create-file.html" class="overlay-link">08: Skill 07: Project Initialization</a>' +
        '<a href="presentation-figma-use.html" class="overlay-link">09: Skill 01: API Foundation</a>' +
        '<a href="presentation-figma-generate-library.html" class="overlay-link">10: Skill 02: Design System Builder</a>' +
        '<a href="presentation-figma-generate-design.html" class="overlay-link">11: Skill 03: Screen Orchestrator</a>' +
        '<a href="presentation-figma-implement-design.html" class="overlay-link">12: Skill 04: Design-to-Code Parity</a>' +
        '<a href="presentation-figma-code-connect.html" class="overlay-link">13: Skill 05: Code Connect (CLI)</a>' +
        '<a href="presentation-code-connect-ui.html" class="overlay-link">14: Skill 05: Code Connect (UI)</a>' +
        '<a href="presentation-figma-ds-rules.html" class="overlay-link">15: Skill 06: AI Rules Encoding</a>' +
        '<a href="../KNOWLEDGE_BASE.md" class="overlay-link">16: Master Knowledge Base (Registry)</a>' +
        '<a href="presentation-advanced-workflows.html" class="overlay-link">17: Multi-Agent Workflows</a>' +
        '<a href="test-automation-presentation.html" class="overlay-link">18: Auto-Sync Handshake</a>' +
        '<a href="create-plugin-mcp.html" class="overlay-link">19: Figma Plugin Builder Guide</a>' +
        '<a href="presentation-ux-masterclass.html" class="overlay-link">20: UX/UI Masterclass: Capstone</a>' +
        '<a href="presentation-meta-prompts.html" class="overlay-link">21: Expert Meta-Prompt Registry</a>' +
        '<a href="presentation-vscode-bridge.html" class="overlay-link">22: VSCode Design Bridge</a>' +
        '<a href="presentation-mcp-ecosystem.html" class="overlay-link">23: The Broader MCP Ecosystem</a>' +
        '<a href="presentation-inverse-workflow.html" class="overlay-link">24: The Inverse Loop (Code-to-Design)</a>' +
        '<a href="presentation-ultra-setup.html" class="overlay-link">25: Ultra-Setup Guide (Figma MCP)</a>' +
    '</div>' +
    '<button id="close-nav" onclick="document.getElementById(\'nav-overlay\').style.display=\'none\'">Close Library</button>';

files.forEach(function(file) {
    const filePath = path.join(presentationsDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        const regex = /<div id="nav-overlay">([\s\S]*?)<\/div>/;
        const replacement = '<div id="nav-overlay">\n    ' + newNavOverlay + '\n</div>';
        if (content.match(regex)) {
            const updatedContent = content.replace(regex, replacement);
            fs.writeFileSync(filePath, updatedContent);
            console.log("Updated: " + file);
        } else {
            console.warn("Nav overlay not found in: " + file);
        }
    } else {
        console.warn("File not found: " + file);
    }
});
