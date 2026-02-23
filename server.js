import express from "express";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: "4mb" }));

// ── CORS (dev only) ──
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CLIENT_ORIGIN || "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ── IN-MEMORY STORAGE (replace with DB for production) ──
const store = new Map();

// ── /api/claude — proxies Anthropic, keeps API key server-side ──
app.post("/api/claude", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const { model, max_tokens, system, messages } = req.body;
    const response = await client.messages.create({
      model: model || "claude-sonnet-4-20250514",
      max_tokens: Math.min(max_tokens || 4096, 8192),
      system,
      messages,
    });

    res.json({ text: response.content?.[0]?.text || "" });
  } catch (err) {
    console.error("Claude API error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/storage — shared key-value store ──
app.get("/api/storage/:key", (req, res) => {
  const val = store.get(req.params.key);
  if (!val) return res.status(404).json({ error: "Not found" });
  res.json({ key: req.params.key, value: val });
});

app.post("/api/storage/:key", (req, res) => {
  store.set(req.params.key, req.body.value);
  res.json({ key: req.params.key, value: req.body.value });
});

app.delete("/api/storage/:key", (req, res) => {
  store.delete(req.params.key);
  res.json({ key: req.params.key, deleted: true });
});

app.get("/api/storage", (req, res) => {
  const prefix = req.query.prefix || "";
  const keys = [...store.keys()].filter(k => k.startsWith(prefix));
  res.json({ keys });
});

// ── Serve built React app ──
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // All non-api routes → React (handles hash routing)
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`VAYUZ AI Recruit running on port ${PORT}`));
