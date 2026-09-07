# 🚀 AI Presentation Agent

> **AI-powered presentation generator.**
> Paste your episode content — a team of AI Agents structures, designs, and generates a beautiful interactive HTML presentation.

---

## ✨ Features

- 🤖 **Real AI Generation** — Uses Google Gemini (`gemini-2.5-flash`) to parse and structure content into slides.
- ⚡ **Instant Demo Mode** — Try the complete app without needing a Gemini API key.
- 🎨 **Premium Design** — Glassmorphism cards, Outfit/IBM Plex typography, smooth animations, RTL Arabic support.
- 📝 **Presenter Script** — Built-in slide-synced script panel (press `S` to toggle).
- 📚 **Auto Cover Page** — Automatically generates and updates an index linking all presentations.
- 🔄 **Multi-Agent Pipeline** — Simulates a real orchestrator → collector → structurer → designer → QA workflow.
- 🌐 **Multi-Language** — Supports Arabic (`Ar`), English (`En`), or bilingual (`Ar+En`).

---

## 🌐 Live Demo & Free Hosting

You can deploy and test this app for **free** on **Render.com**, **Koyeb**, or **Vercel**!

### 🔗 Try the Live Demo
> 📌 **Live URL**: `https://ai-explained.onrender.com` *(Connect your repository on Render to get your own live URL)*

In the live web app, users can click **`✨ Try Demo (No API Key)`** to immediately test the full multi-agent pipeline live in the browser without configuring anything.

---

## ⚡ Try Demo Mode Locally (No API Key Required)

Want to test the app locally without configuring an API key?

1. Start the server:
   ```bash
   node dashboard_server.cjs
   ```
2. Open `http://localhost:3000` or `http://localhost:3000/dashboard.html` in your browser.
3. Click the **`✨ Try Demo (No API Key)`** button next to the submit button.
4. Watch the multi-agent workflow simulate in real-time and open your instant presentation!

---

## ☁️ How to Host for Free (Step-by-Step)

### Option 1: Render.com (Recommended for Node.js Express)
1. Push your repository to GitHub.
2. Sign up at [Render.com](https://render.com) (Free tier).
3. Click **New +** → **Web Service**.
4. Select your repository `AI-Explained`.
5. Fill in the settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node dashboard_server.cjs`
6. *(Optional)* Under **Environment Variables**, add `GEMINI_API_KEY` (if omitted, the app runs fine in Demo Mode).
7. Click **Create Web Service** — Render will give you a free HTTPS live link (e.g., `https://your-app-name.onrender.com`) to share with users!

---

## 🚀 Getting Started (Full Setup)

### 1. Clone the repository
```bash
git clone https://github.com/Naiimbs/AI-Explained.git
cd AI-Explained
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure your API Key (Optional for Demo Mode)
```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and add your free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Start the server
```bash
node dashboard_server.cjs
```

### 5. Open the Dashboard
```
http://localhost:3000/dashboard.html
```

---

## 🔄 How It Works

```
Your Content (text/paste)
        │
        ▼
┌───────────────────────┐
│   Collector Agent     │  - Reads and cleans raw input
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│   Structurer Agent    │  - Sends to Gemini AI → Returns structured JSON
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│   HTML Architect      │  - Maps JSON sections to slide templates
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│     UI Designer       │  - Applies design system (CSS tokens, glassmorphism)
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│     Visual QA         │  - Verifies and finalizes output
└───────────────────────┘
        │
        ▼
presentation-YourTitle.html 🚀
```

---

## 📂 Project Structure

```
├── dashboard.html           # Main UI - submit content, try demo, view progress
├── dashboard_server.cjs     # Express server + Gemini AI + API handlers
├── presentations/           # Generated presentation files
│   ├── index.html           # Auto-generated cover page
│   └── presentation-*.html  # Generated interactive slides
├── .agents/                 # Agent rules and behavior definitions
├── .env.example             # Environment variables template
└── package.json
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| AI | Google Gemini (`gemini-2.5-flash`) |
| Backend | Node.js + Express |
| Frontend | Vanilla HTML/CSS/JS |
| Fonts | Outfit, IBM Plex Sans Arabic, JetBrains Mono |
| Design | Glassmorphism, CSS custom properties, RTL-ready |

---

## 📄 License

MIT — free to use, modify, and sell.

---

## 👤 Author

Made with ❤️ by **Naiim BSILI**
