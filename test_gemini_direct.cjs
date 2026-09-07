const fetch = require('node-fetch'); // If available, or use global fetch if node 18+

const KEY = 'AIzaSyDMk4Q1lsDwP2DnS_Kxo9jEsM1phXLQD2I';
const MODEL = 'gemini-2.5-flash';

async function test() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
    
    const payload = {
        contents: [{
            parts: [{ text: "Hello, are you there?" }]
        }]
    };

    try {
        console.log(`Testing ${MODEL} with direct fetch...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}

test();
