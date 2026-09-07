const fs = require('fs');
const path = require('path');

// Configuration
const WATCH_DIR = './';
const TARGET_EXT = ['.txt', '.md'];
const IGNORE_FILES = ['KNOWLEDGE_BASE.md', 'design.md', 'README.md', 'task.md', 'summary.md'];
const TRIGGER_PATH = path.join('.agents', 'workflows', 'trigger.json');

// Ensure trigger directory exists
const triggerDir = path.dirname(TRIGGER_PATH);
if (!fs.existsSync(triggerDir)) {
    fs.mkdirSync(triggerDir, { recursive: true });
}

console.log('\x1b[35m%s\x1b[0m', '--------------------------------------------------');
console.log('\x1b[35m%s\x1b[0m', '   ORCHESTRATOR AUTONOMOUS DAEMON v2');
console.log('\x1b[35m%s\x1b[0m', '   Monitoring and Auto-Queuing enabled...');
console.log('\x1b[35m%s\x1b[0m', '--------------------------------------------------');

let timeout;

fs.watch(WATCH_DIR, (eventType, filename) => {
    if (!filename) return;
    
    const ext = path.extname(filename);
    
    if (TARGET_EXT.includes(ext) && !IGNORE_FILES.includes(filename)) {
        if (timeout) clearTimeout(timeout);
        
        timeout = setTimeout(() => {
            const filePath = path.join(WATCH_DIR, filename);
            if (fs.existsSync(filePath)) {
                console.log('\x1b[36m%s\x1b[0m', `\n[ACTION] Queuing for orchestration: ${filename}`);
                
                // Read existing trigger or create new
                let trigger = { files: [], links: [], timestamp: new Date().toISOString() };
                try {
                    if (fs.existsSync(TRIGGER_PATH)) {
                        trigger = JSON.parse(fs.readFileSync(TRIGGER_PATH, 'utf8'));
                    }
                } catch (e) { console.error('Failed to parse trigger.json'); }

                // Add file if not already present
                if (!trigger.files.includes(filename)) {
                    trigger.files.push(filename);
                    trigger.timestamp = new Date().toISOString();
                    fs.writeFileSync(TRIGGER_PATH, JSON.stringify(trigger, null, 2));
                    console.log('\x1b[32m%s\x1b[0m', `SUCCESS: ${filename} added to trigger.json queue.`);
                }
                
                console.log('\x1b[37m%s\x1b[0m', 'Next step: Say "Sync" in the chat to process the queue.');
                console.log('\x1b[32m%s\x1b[0m', '--------------------------------------------------');
            }
        }, 150);
    }
});
