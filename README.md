# RepoChat v2 - Modern AI Code Assistant

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/Privacy-First-00C853?style=for-the-badge&logo=shield" alt="Privacy" />
</p>

**RepoChat** is a privacy-first AI assistant that helps developers understand codebases through natural language conversation. Ask questions about any repository and get instant, accurate answers with code snippets.

## ✨ Features

- 🔒 **Privacy-First**: Runs 100% locally with LM Studio - your code never leaves your machine
- 💬 **Modern Chat UI**: ChatGPT-like interface with streaming responses
- 🎨 **GitHub Dark Theme**: Beautiful, modern design inspired by GitHub's aesthetic
- ⚡ **FastAPI Backend**: High-performance async API with OpenAPI documentation
- 🐳 **Docker Ready**: One-command deployment with Docker Compose
- 📊 **RAG Pipeline**: Intelligent code chunking and semantic search

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose**
- **LM Studio** running on `http://127.0.0.1:1234` with a loaded model

### Run with Docker

```bash
# Clone the repository
git clone https://github.com/iushv/repochat.git
cd repochat

# Start the services
docker-compose up --build

# Open http://localhost:3000
```

### Run Locally (Development)

```bash
# Backend
cd repo_chat
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000

# Frontend (new terminal)
cd repo_chat/frontend
npm install
npm run dev
```

## 📁 Project Structure

```
repo_chat/
├── backend/                 # FastAPI backend
│   ├── api/                # API routes
│   ├── services/           # Business logic
│   │   ├── llm_service.py  # LLM integration
│   │   └── rag_service.py  # RAG pipeline
│   ├── core/               # Configuration
│   └── main.py             # FastAPI app
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   └── lib/           # API client
│   └── tailwind.config.js
├── docker-compose.yml      # Docker orchestration
├── Dockerfile.backend
└── Dockerfile.frontend
```

## 🔧 Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_BASE_URL` | `http://127.0.0.1:1234/v1` | LM Studio endpoint |
| `USE_LOCAL_EMBEDDINGS` | `true` | Use local sentence-transformers |
| `CHUNK_SIZE` | `1500` | Document chunk size |
| `RETRIEVAL_K` | `10` | Number of chunks to retrieve |

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

### Key Endpoints

```bash
# Health check
GET /api/health

# Ingest repository
POST /api/repos/ingest
{"url": "https://github.com/user/repo"}

# Chat (streaming)
POST /api/chat
{"question": "What does this repo do?", "stream": true}
```

## 🎨 Screenshots

*Coming soon*

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS |
| **Backend** | FastAPI, Python 3.11 |
| **LLM** | LM Studio (local) / Hugging Face API |
| **Embeddings** | sentence-transformers |
| **Vector Store** | FAISS |
| **Containerization** | Docker, Docker Compose |

## 📈 Roadmap

- [ ] Multi-repository support
- [ ] Code execution sandbox
- [ ] GitHub/GitLab OAuth integration
- [ ] VS Code extension
- [ ] Kubernetes deployment

## 🤝 Contributing

Contributions are welcome! Please open an issue or PR.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ for developers who value privacy
</p>
