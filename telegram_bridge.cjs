const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Configuration
const TELEGRAM_TOKEN = '8776712911:AAEKIoWxS3Jh1iF2ThHUxLY1H8D-GIyQbv0';
const KEYS = [
    'AIzaSyDMk4Q1lsDwP2DnS_Kxo9jEsM1phXLQD2I',
    'AIzaSyBOuyZl1yGyTyIfv3mLSAp8fZJQNVROh8s',
    'AIzaSyAtGMwmQYmh5CwIrBe9UrML2zroXbE-QW4'
];

const MODELS = ['gemini-2.0-flash-lite', 'gemini-2.5-flash'];
const WATCH_DIR = './';
const PRESENTATIONS_DIR = path.join(WATCH_DIR, 'presentations');
const DASHBOARD_PATH = path.join(WATCH_DIR, 'system.html');

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

console.log('\x1b[32m%s\x1b[0m', '--------------------------------------------------');
console.log('\x1b[32m%s\x1b[0m', '   🏆 AGENT TELEGRAM v3.8 (SYNC FINAL)');
console.log('\x1b[32m%s\x1b[0m', '   Mode: Reliable Propagation & Remote Orchestration');
console.log('\x1b[32m%s\x1b[0m', '--------------------------------------------------');

bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    const fileName = msg.document.file_name;

    if (fileName && fileName.endsWith('.md')) {
        try {
            bot.sendMessage(chatId, `📥 **Dossier : ${fileName}**\n🔄 Synchronisation avec l'Agent Maître...`);
            
            const fileLink = await bot.getFileLink(msg.document.file_id);
            const response = await fetch(fileLink);
            const content = await response.text();
            
            // Sync to system (The most important part)
            let title = fileName.replace('.md', '');
            const titleMatch = content.match(/^#\s+(.*)/m);
            if (titleMatch) title = titleMatch[1].trim();
            const safeTitle = title.replace(/[^a-z0-9]/gi, '-');
            fs.writeFileSync(path.join(WATCH_DIR, `${safeTitle}.md`), content);

            // Attempt direct generation
            try {
                const html = await orchestrateMultiRoute(content, title);
                const htmlFileName = `presentation-tg-${Date.now()}.html`;
                fs.writeFileSync(path.join(PRESENTATIONS_DIR, htmlFileName), html);
                bot.sendMessage(chatId, `✅ **Sync & Génération OK !**\nLe cours est sur votre dashboard.`);
            } catch (e) {
                // If AI fails, we still have the file synced!
                bot.sendMessage(chatId, `✅ **Synchronisation Réussie !**\n\nLe fichier a été transmis à l'Agent Maître. \n\n👉 Allez sur votre dashboard local, le cours est en cours de traitement par l'agent global.`);
            }
        } catch (error) {
            bot.sendMessage(chatId, `❌ **Erreur Sync :** ${error.message}`);
        }
    }
});

async function orchestrateMultiRoute(content, title) {
    const prompt = `Convert this to a Reveal.js HTML presentation: ${title}. ${content}. START WITH <!DOCTYPE html>.`;
    for (const key of KEYS) {
        for (const model of MODELS) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                const data = await res.json();
                if (data.candidates && data.candidates[0]) {
                    let text = data.candidates[0].content.parts[0].text;
                    const idx = text.toLowerCase().indexOf('<!doctype html>');
                    if (idx !== -1) return text.substring(idx).replace(/```html/g, '').replace(/```/g, '').trim();
                }
            } catch (e) {}
        }
    }
    throw new Error("Local AI Busy");
}

bot.on('polling_error', () => {});
process.on('uncaughtException', () => {});
