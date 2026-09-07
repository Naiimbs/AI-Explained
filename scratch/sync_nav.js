import fs from 'fs';
import path from 'path';

const presentationsDir = 'c:/Users/aii/Desktop/MCPtoFigma/presentations';
const files = fs.readdirSync(presentationsDir).filter(f => f.endsWith('.html'));

const TARGET_INDEX_HTML = `        <a href="whatsmcp.html" class="overlay-link">01: Core Concept: What is MCP?</a>
        <a href="figmaMCPserver.html" class="overlay-link">02: Unified Figma MCP Ecosystem</a>
        <a href="what-is-the-figma-mcp-server.html" class="overlay-link">03: Figma MCP Server Overview</a>
        <a href="compare-figma-remote-and-desktop-mcp-servers.html" class="overlay-link">04: Remote vs. Desktop Comparison</a>
        <a href="setup-remote-mcp.html" class="overlay-link">05: Remote Server Setup Guide</a>
        <a href="setup-desktop-mcp.html" class="overlay-link">06: Desktop Server Setup Guide</a>
        <a href="presentation-mcp-skills.html" class="overlay-link">07: MCP Skills Overview: Tool Orchestration</a>
        <a href="presentation-figma-create-file.html" class="overlay-link">08: Skill 07: Project Initialization (Create)</a>
        <a href="presentation-figma-use.html" class="overlay-link">09: Skill 01: API Foundation (Use)</a>
        <a href="presentation-figma-generate-library.html" class="overlay-link">10: Skill 02: Design System Builder</a>
        <a href="presentation-figma-generate-design.html" class="overlay-link">11: Skill 03: Screen Orchestrator</a>
        <a href="presentation-figma-implement-design.html" class="overlay-link">12: Skill 04: Design-to-Code Parity</a>
        <a href="presentation-figma-code-connect.html" class="overlay-link">13: Skill 05: Code Connect (CLI/Templates)</a>
        <a href="presentation-code-connect-ui.html" class="overlay-link">14: Skill 05: Code Connect (UI Workflow)</a>
        <a href="presentation-figma-ds-rules.html" class="overlay-link">15: Skill 06: AI Rules Encoding</a>
        <a href="../KNOWLEDGE_BASE.md" class="overlay-link">16: Master Knowledge Base (Registry)</a>
        <a href="presentation-advanced-workflows.html" class="overlay-link">17: Multi-Agent Workflows</a>
        <a href="test-automation-presentation.html" class="overlay-link">18: Auto-Sync Handshake</a>
        <a href="create-plugin-mcp.html" class="overlay-link">19: Figma Plugin Builder Guide</a>`;

files.forEach(file => {
    const filePath = path.join(presentationsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Find the overlay-grid and replace its contents
    const startTag = '<div class="overlay-grid">';
    const endTag = '</div>';
    
    const startIndex = content.indexOf(startTag);
    const endIndex = content.indexOf(endTag, startIndex);
    
    if (startIndex !== -1 && endIndex !== -1) {
        const newContent = content.substring(0, startIndex + startTag.length) + 
                          '\n' + TARGET_INDEX_HTML + '\n    ' + 
                          content.substring(endIndex);
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`Skipped ${file} - Grid not found`);
    }
});
