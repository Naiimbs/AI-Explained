# 🎓 AI Presentation Agent

> **AI-powered presentation generator for the "AI Explained by a UX Designer" course.**
> Paste your episode content → a team of AI Agents structures, designs, and generates a beautiful interactive HTML presentation.

---

## ✨ Features

- 🤖 **Real AI generation** — Uses Google Gemini (`gemini-2.5-flash`) to intelligently parse and structure content into slides
- 🎨 **Premium design** — Glassmorphism cards, Outfit/IBM Plex typography, smooth animations, RTL Arabic support
- 📜 **Presenter Script** — Built-in slide-synced script panel (press `S` to toggle)
- 📚 **Auto Course Index** — Automatically generates and updates the course cover page
- 🧩 **Multi-Agent Pipeline** — Simulates a real orchestrator → collector → structurer → designer → QA workflow
- 🌐 **Multi-language** — Supports Arabic (`Ar`), English (`En`), or bilingual (`Ar+En`)

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/ai-presentation-agent.git
cd ai-presentation-agent
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure your API key
```bash
# Copy the example file
cp .env.example .env

# Open .env and add your Gemini API key
# Get one free at: https://aistudio.google.com/app/apikey
```

Edit `.env`:
```
GEMINI_API_KEY=your_key_here
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

## 🧠 How It Works

```
Your Content (text/paste)
        │
        ▼
  ┌─────────────────┐
  │  Collector Agent │  — Reads and cleans raw input
  └─────────────────┘
        │
        ▼
  ┌──────────────────┐
  │ Structurer Agent  │  — Sends to Gemini AI → Returns structured JSON
  └──────────────────┘
        │
        ▼
  ┌──────────────────┐
  │  HTML Architect   │  — Maps JSON sections to slide templates
  └──────────────────┘
        │
        ▼
  ┌──────────────────┐
  │   UI Designer     │  — Applies design system (CSS tokens, glassmorphism)
  └──────────────────┘
        │
        ▼
  ┌──────────────────┐
  │   Visual QA       │  — Verifies and finalizes the file
  └──────────────────┘
        │
        ▼
  presentation-YourTitle.html ✅
```

---

## 📁 Project Structure

```
├── dashboard.html           # Main UI — submit content, view live progress
├── dashboard_server.cjs     # Express server + Gemini AI + route handlers
├── presentations/           # All generated presentations live here
│   ├── index.html           # Auto-generated course index
│   └── presentation-*.html  # Episode presentations
├── .agents/
│   └── rules/               # Agent behavior definitions (markdown)
├── .env                     # Your secrets (not committed to Git)
├── .env.example             # Template for new users
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

Made with ❤️ by **AI Explained by a UX Designer**
