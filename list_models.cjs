const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = 'AIzaSyAtGMwmQYmh5CwIrBe9UrML2zroXbE-QW4';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function list() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

list();
