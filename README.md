# RepoChat

A local-first AI code assistant that lets you chat with any codebase. Built for developers who want answers about their code without sending it to the cloud.

**Demo:** Run locally with Docker and LM Studio

---

## What It Does

Point RepoChat at any GitHub repository and ask questions about it. The AI reads the code, understands the structure, and answers in plain English with relevant code snippets.

Everything runs on your machine. The code gets chunked, embedded locally, and stored in a FAISS index. When you ask a question, it retrieves the relevant context and sends it to your local LLM. No API keys, no cloud uploads, no data leaving your laptop.

---

## Features

### Privacy First
Your code stays on your machine. Uses LM Studio for local inference and sentence-transformers for local embeddings. Nothing gets sent anywhere.

### RAG Pipeline
Intelligent code chunking that respects file boundaries and semantic meaning. Retrieves the right context so the LLM actually gives useful answers.

### Modern Chat UI
Clean interface inspired by GitHub's dark theme. Streaming responses so you don't stare at a loading spinner.

### Docker Ready
One command to spin up both frontend and backend. No dependency hell.

---

## Running Locally

### With Docker (Recommended)

```bash
git clone https://github.com/iushv/repochat.git
cd repochat

# Start LM Studio on http://127.0.0.1:1234 with a model loaded

docker-compose up --build
# Open http://localhost:3000
```

### Manual Setup

```bash
# Backend
cd repochat
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000

# Frontend (new terminal)
cd repochat/frontend
npm install
npm run dev
```

---

## Tech Stack

- **Next.js 14** — Frontend with App Router
- **FastAPI** — Async Python backend
- **LM Studio** — Local LLM inference
- **sentence-transformers** — Local embeddings
- **FAISS** — Vector similarity search
- **Docker Compose** — One-command deployment

---

## API

Once running, docs are at http://localhost:8000/api/docs

Key endpoints:
- `POST /api/repos/ingest` — Ingest a repository
- `POST /api/chat` — Ask questions with streaming responses
- `GET /api/health` — Health check

---

## Configuration

| Variable | Default | What it does |
|----------|---------|--------------|
| `LLM_BASE_URL` | `http://127.0.0.1:1234/v1` | LM Studio endpoint |
| `USE_LOCAL_EMBEDDINGS` | `true` | Use local sentence-transformers |
| `CHUNK_SIZE` | `1500` | How big each code chunk is |
| `RETRIEVAL_K` | `10` | Number of chunks to retrieve |

---

## Roadmap

- [ ] Multi-repository support
- [ ] GitHub/GitLab OAuth
- [ ] VS Code extension
- [ ] Code execution sandbox

---

Built for developers who care about privacy.
