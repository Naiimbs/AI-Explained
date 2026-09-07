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
    'presentation-ultra-setup.html',
    'certification-exam.html',
    'mcp-glossary.html',
    'mcp-career-path.html'
];

const newNavOverlay = '<h2>Curriculum Master Registry</h2>' +
    '<div class="overlay-grid">' +
        '<a href="course-hub.html" class="overlay-link" style="background: rgba(139, 92, 246, 0.3); border-color: #8b5cf6;">🏠 COURSE HUB (START HERE)</a>' +
        '<a href="certification-exam.html" class="overlay-link" style="background: rgba(245, 158, 11, 0.2); border-color: #f59e0b;">🎓 CERTIFICATION EXAM</a>' +
        '<a href="mcp-glossary.html" class="overlay-link">26: Technical Glossary</a>' +
        '<a href="mcp-career-path.html" class="overlay-link">27: Career Trajectories</a>' +
        '<a href="whatsmcp.html" class="overlay-link">01: What is MCP?</a>' +
        '<a href="figmaMCPserver.html" class="overlay-link">02: Unified Ecosystem</a>' +
        '<a href="setup-remote-mcp.html" class="overlay-link">05: Remote Server Setup</a>' +
        '<a href="setup-desktop-mcp.html" class="overlay-link">06: Desktop Server Setup</a>' +
        '<a href="presentation-mcp-skills.html" class="overlay-link">07: MCP Skills Overview</a>' +
        '<a href="presentation-figma-create-file.html" class="overlay-link">08: Project Initialization</a>' +
        '<a href="presentation-figma-use.html" class="overlay-link">09: API Foundation</a>' +
        '<a href="presentation-figma-generate-library.html" class="overlay-link">10: DS Builder</a>' +
        '<a href="presentation-figma-generate-design.html" class="overlay-link">11: Screen Orchestrator</a>' +
        '<a href="presentation-figma-implement-design.html" class="overlay-link">12: Design-to-Code Parity</a>' +
        '<a href="presentation-figma-code-connect.html" class="overlay-link">13: Code Connect (CLI)</a>' +
        '<a href="presentation-code-connect-ui.html" class="overlay-link">14: Code Connect (UI)</a>' +
        '<a href="presentation-figma-ds-rules.html" class="overlay-link">15: AI Rules Encoding</a>' +
        '<a href="../KNOWLEDGE_BASE.md" class="overlay-link">16: Master Registry</a>' +
        '<a href="presentation-advanced-workflows.html" class="overlay-link">17: Multi-Agent Workflows</a>' +
        '<a href="create-plugin-mcp.html" class="overlay-link">19: Plugin Builder</a>' +
        '<a href="presentation-ux-masterclass.html" class="overlay-link">20: Capstone Masterclass</a>' +
        '<a href="presentation-meta-prompts.html" class="overlay-link">21: Expert Prompt Registry</a>' +
        '<a href="presentation-vscode-bridge.html" class="overlay-link">22: VSCode Design Bridge</a>' +
        '<a href="presentation-mcp-ecosystem.html" class="overlay-link">23: Broad Ecosystem</a>' +
        '<a href="presentation-inverse-workflow.html" class="overlay-link">24: The Inverse Loop</a>' +
        '<a href="presentation-ultra-setup.html" class="overlay-link">25: Ultra-Setup Guide</a>' +
    '</div>' +
    '<button id="close-nav" onclick="document.getElementById(\'nav-overlay\').style.display=\'none\'">Close Registry</button>';

files.forEach(function(file) {
    const filePath = path.join(presentationsDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        const regex = /<div id="nav-overlay">([\s\S]*?)<\/div>/;
        const replacement = '<div id="nav-overlay">\n    ' + newNavOverlay + '\n</div>';

        // Also update the global-nav-bar buttons to include course-hub
        const navBarRegex = /<div id="global-nav-bar">([\s\S]*?)<\/div>/;
        const navBarReplacement = '<div id="global-nav-bar">\n' +
            '    <a href="course-hub.html" class="nav-btn">🏫 Course Hub</a>\n' +
            '    <button class="nav-btn" onclick="document.getElementById(\'nav-overlay\').style.display=\'flex\'">📚 Library Index</button>\n' +
            '</div>';

        if (content.match(regex)) {
            content = content.replace(regex, replacement);
        }
        if (content.match(navBarRegex)) {
            content = content.replace(navBarRegex, navBarReplacement);
        }
        
        fs.writeFileSync(filePath, content);
        console.log("Updated: " + file);
    } else {
        console.warn("File not found: " + file);
    }
});
