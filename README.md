# VAYUZ AI Recruitment Platform

AI-powered end-to-end recruitment platform built for VAYUZ Technologies.

## Features

- **JD Upload** — Upload any JD file, AI extracts skills, requirements, salary, responsibilities
- **AI Resume Parser** — Two-stage analysis: fact audit + strict calibrated scoring (Fit, Retention, Salary, Backoff Risk)
- **Candidate Shortlist** — Filter, sort, get AI strategic insights per candidate
- **AI Voice Screening** — AI conducts telephonic screening via voice, scores answers, generates client report
- **Shareable Candidate Links** — Isolated candidate portal, no platform access
- **ATS Integration** — REST API + webhooks for Greenhouse, Lever, Workday

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| AI | Anthropic Claude Sonnet |
| Voice | Web Speech API (STT) + SpeechSynthesis (TTS) |

---

## Local Development

### 1. Clone the repo

```bash
git clone https://github.com/your-org/vayuz-ai-recruit.git
cd vayuz-ai-recruit
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set environment variables

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 4. Run in development

Open two terminals:

```bash
# Terminal 1 — Backend
node server.js

# Terminal 2 — Frontend (with hot reload)
npm run dev:client
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001

---

## Deploy to Render

### Step 1 — Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2 — Create a Web Service on Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:

| Setting | Value |
|---------|-------|
| **Environment** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Node Version** | 18 or higher |

### Step 3 — Add Environment Variable

In Render dashboard → **Environment** tab:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-your-key-here` |

### Step 4 — Deploy

Click **Deploy**. Render will:
1. Install dependencies
2. Build the React app (`vite build` → `dist/`)
3. Start Express server which serves `dist/` and proxies AI calls

Your app will be live at `https://your-app-name.onrender.com`

---

## Candidate Screening Links

When you create a screening round, copy the candidate link:

```
https://your-app.onrender.com/#screen-<ROUND_ID>
```

Candidates open this URL and see only the voice screening portal — no access to the recruiter platform.

---

## API Reference

All endpoints are prefixed with `/api/`.

### `POST /api/claude`
Proxies a request to Anthropic Claude. Body: `{ model, max_tokens, system, messages }`. Returns `{ text }`.

### `GET /api/storage/:key`
Get a stored value by key.

### `POST /api/storage/:key`
Store a value. Body: `{ value, shared }`.

### `GET /api/storage?prefix=round_`
List all keys with a given prefix.

---

## Voice Screening Notes

- Voice recording uses the **Web Speech API** — works in Chrome and Edge only
- Language is set to `en-IN` (Indian English) for better accuracy
- Candidates must allow microphone access when prompted
- TTS (AI speaking) uses browser SpeechSynthesis — no external service required

---

## Project Structure

```
vayuz-ai-recruit/
├── src/
│   ├── App.jsx          # Full React application (all components)
│   └── main.jsx         # React entry point
├── index.html           # Vite HTML template
├── server.js            # Express backend (Claude proxy + storage)
├── vite.config.js       # Vite configuration
├── package.json
├── .env.example
└── .gitignore
```

---

## Notes

- **Storage**: The backend uses in-memory storage. For production scale, replace `store` in `server.js` with Redis or PostgreSQL.
- **API Key**: Never expose `ANTHROPIC_API_KEY` in frontend code. The backend proxy keeps it server-side.
- **Voice**: Only Chrome and Edge support Web Speech API reliably. Safari does not.
