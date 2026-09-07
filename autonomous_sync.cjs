const fs = require('fs');
const path = require('path');

const TRIGGER_PATH = path.join('.agents', 'workflows', 'trigger.json');

function checkQueue() {
    if (!fs.existsSync(TRIGGER_PATH)) {
        console.log('No pending orchestrations found.');
        return;
    }

    try {
        const trigger = JSON.parse(fs.readFileSync(TRIGGER_PATH, 'utf8'));
        if (trigger.files.length === 0 && trigger.links.length === 0) {
            console.log('Queue is empty.');
            return;
        }

        console.log('--- PENDING ORCHESTRATION QUEUE ---');
        console.log(`Timestamp: ${trigger.timestamp}`);
        
        if (trigger.files.length > 0) {
            console.log('\nFiles to process:');
            trigger.files.forEach(f => console.log(`- ${f}`));
        }
        
        if (trigger.links.length > 0) {
            console.log('\nLinks to process:');
            trigger.links.forEach(l => console.log(`- ${l}`));
        }
        
        console.log('\n-----------------------------------');
        console.log('Action: Process these items and update the Knowledge Base.');
    } catch (e) {
        console.error('Failed to read trigger queue.');
    }
}

checkQueue();
