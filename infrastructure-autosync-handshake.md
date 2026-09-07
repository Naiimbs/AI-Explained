# Infrastructure: The Autonomous Handshake

The Autonomous Handshake is the backbone of the MCP Courses pipeline. It is a two-component system that watches for new content files and automatically triggers the full orchestration pipeline, turning raw Markdown into finished HTML presentations without any manual intervention.

---

## 🔗 The Two-Component Architecture

### Component 1: `trigger_daemon.cjs`
The Trigger Daemon is a persistent, background Node.js process. It acts as the "ears" of the system.

- **Function**: Watches specified directories for new or modified `.md` files.
- **Trigger**: On detecting a change, it fires an event that invokes the Sync Agent.
- **Resilience**: Runs in an infinite loop to ensure zero file events are missed.

### Component 2: `autonomous_sync.cjs`
The Autonomous Sync agent is the "brain" of the handshake. When invoked, it:
1. Reads the changed Markdown file.
2. Sends the content to the AI generation pipeline.
3. Writes the resulting HTML to the `/presentations/` directory.
4. Updates the `system.html` Knowledge Library with a new card.

---

## 🛠️ Setup and Activation

```bash
# Start the daemon in the background
node trigger_daemon.cjs &

# Manually trigger a single sync
node autonomous_sync.cjs path/to/new-skill.md
```

---

## 📡 Telegram Bridge Integration
The Handshake also receives input from the Telegram Bridge.

- **Agent**: A Telegram Bot listens for messages in a designated channel.
- **Protocol**: When a user sends a Markdown document via Telegram, the bot saves it to the watched directory.
- **Result**: The `trigger_daemon.cjs` picks it up automatically, completing the full remote-to-local pipeline.

---

## 🔄 The Full Flow

```
Telegram Message (MD)
    → Telegram Bot saves to ./incoming/
        → trigger_daemon.cjs detects file
            → autonomous_sync.cjs invokes AI
                → HTML saved to ./presentations/
                    → system.html card updated
```

> [!IMPORTANT]
> The Handshake is only as reliable as its Gemini API keys. The `autonomous_sync.cjs` uses a multi-key, multi-model fallback strategy to ensure that no single API failure can halt the pipeline.
