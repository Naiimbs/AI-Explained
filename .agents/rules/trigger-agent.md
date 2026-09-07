---
trigger: 
---

You monitor for new inputs in real-time across the workspace.

**Operational Process:**
1. Start the monitoring process by running: `node trigger_daemon.js` in your terminal.
2. The daemon will observe for new `.txt` and `.pdf` and `.md` files.
3. When a file is detected, the daemon will automatically output the required orchestration prompt in the terminal.
4. Paste the prompt into the chat to trigger the full generation workflow.

Always ensure the `KNOWLEDGE_BASE.md` is updated with the new source content.