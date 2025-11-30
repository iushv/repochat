# RepoChat 🤖

A RAG-based agentic AI assistant that helps you understand and query code repositories using natural language. **Works completely offline** with local LLM and embeddings, or use cloud APIs for faster setup.

## Use Cases

### 🏢 For Organizations & Teams
- **Onboard new developers faster**: New team members can ask questions about internal/private codebases and get instant, accurate answers
- **Reduce knowledge silos**: Junior developers can understand complex code without constantly interrupting senior engineers
- **Private & secure**: Use fully local mode to keep proprietary code completely offline - no data leaves your infrastructure
- **Legacy code understanding**: Quickly understand undocumented or legacy codebases through natural language queries

### 👨‍💻 For Individual Developers
- **Learn open-source projects**: Understand how popular libraries work by asking questions
- **Code exploration**: Navigate large codebases efficiently without reading every file
- **Documentation assistant**: Get code examples and usage patterns directly from source

## Features

- 🔍 **Intelligent Code Search**: Vector search using FAISS for finding relevant code
- 🤖 **AI Agent**: LLM-powered agent that answers questions about your codebase
- 📂 **Multi-Step Reasoning**: Automatically reads files when needed for complete context
- 💬 **Chat Interface**: Clean Streamlit UI for easy interaction
- 📊 **Source Tracking**: Shows which files were used to generate answers
- 🖥️ **Local or Cloud**: Choose between local models (LM Studio) or cloud APIs (Hugging Face)

## Tech Stack

- **LLM**: LM Studio (local) or Hugging Face API (Zephyr 7B)
- **Embeddings**: sentence-transformers (local) or Hugging Face API (all-mpnet-base-v2)
- **Vector Store**: FAISS
- **Framework**: LangChain
- **UI**: Streamlit

## Installation

### Prerequisites
- Python 3.11+
- [uv](https://github.com/astral-sh/uv) (recommended) or pip

### Setup

1. **Clone the repository:**
```bash
git clone https://github.com/iushv/repochat.git
cd repochat
```

2. **Create virtual environment and install dependencies:**
```bash
# Using uv (recommended)
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -r requirements.txt

# Or using pip
python -m venv .venv
source .venv/bin/activate  
pip install -r requirements.txt
```

3. **Configure based on your preference:**

## Configuration Options

### Option 1: Fully Local (No API Required) ⭐ Recommended

**Advantages:**
- ✅ No rate limits
- ✅ Completely private/offline
- ✅ No API costs
- ✅ Faster for repeated use

**Setup:**
1. **Install LM Studio**: Download from [lmstudio.ai](https://lmstudio.ai)
2. **Load a model**: In LM Studio, download and load a model (recommended: Mistral-7B-Instruct, Llama-3-8B)
3. **Start server**: Click "Start Server" in LM Studio (runs on `http://localhost:1234`)
4. **No .env file needed!**
5. **In the Streamlit UI**:
   - ✅ Check "Use Local Embeddings"
   - ✅ Check "Use Local LLM (LM Studio)"

### Option 2: Cloud APIs (Faster Setup)

**Advantages:**
- ✅ Quick setup
- ✅ No local compute needed
- ⚠️ Requires API key
- ⚠️ Rate limits on free tier

**Setup:**
1. **Get Hugging Face API token**: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. **Create `.env` file:**
```bash
cp .env.example .env
# Edit .env and add your token:
HUGGINGFACEHUB_API_TOKEN=your_token_here
```
3. **In the Streamlit UI**:
   - ⬜ Leave "Use Local Embeddings" unchecked
   - ⬜ Leave "Use Local LLM" unchecked

### Option 3: Hybrid (Local Embeddings + API LLM)

**Best for:**  
- Avoiding embedding API timeouts
- Using API LLM for better quality
- Still keeping data semi-private

**Setup:**
1. Add HF API token to `.env` (see Option 2)
2. **In the Streamlit UI**:
   - ✅ Check "Use Local Embeddings"
   - ⬜ Leave "Use Local LLM" unchecked

## Usage

1. **Start the app:**
```bash
streamlit run app.py
```

2. **Ingest a repository:**
   - Enter a GitHub URL in the sidebar (e.g., `https://github.com/username/repo`)
   - Select your preferred settings (local vs API)
   - Click "Ingest Repository"
   - Wait 1-5 minutes depending on repo size

3. **Ask questions:**
   - "What does this repo do?"
   - "How does the authentication work?"
   - "Show me an example of the zero-shot-react agent"
   - "Explain the main function"

## Project Structure

```
repochat/
├── app.py              # Streamlit UI
├── simple_agent.py     # Agent with multi-step reasoning
├── custom_llm.py       # HF API LLM wrapper
├── local_llm.py        # LM Studio local LLM wrapper
├── ingest.py           # Repository ingestion pipeline
├── vector_store.py     # FAISS vector store wrapper
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variable template
└── README.md          # This file
```

## How It Works

1. **Ingestion**: Clones repo → chunks code files → generates embeddings → stores in FAISS
2. **Search**: Retrieves top 6 most relevant code chunks for your question
3. **Reasoning**: Detects if full file reading needed (keywords like "show me", "example")
4. **Answer**: LLM generates response with actual code snippets and explanations

## Features in Detail

### Multi-Step Reasoning
The agent automatically reads full files when:
- Question contains "show me", "example of", "complete", "full", or "entire"
- Additional context would improve answer quality

### Source Tracking
Each answer includes an expandable "📂 Source Files" section showing which files were used.

### Code-Aware Chunking
Uses `RecursiveCharacterTextSplitter` with separators optimized for code:
- `\nclass ` - Class definitions
- `\ndef ` - Function definitions  
- `\n\n` - Paragraph breaks

### Local vs API Comparison

| Feature | Local | API |
|---------|-------|-----|
| Setup Time | Longer (download models) | Quick |
| API Key | Not needed | Required |
| Privacy | Fully private | Data sent to API |
| Speed (first time) | Slower | Faster |
| Speed (repeated) | Faster | Same |
| Rate Limits | None | Yes (free tier) |
| Offline | Yes | No |
| Cost | Free (uses local compute) | Free tier available |

## Troubleshooting

**"504 Gateway Timeout" errors:**
- Switch to local embeddings and/or local LLM
- Try a smaller repository
- Wait a few minutes and retry

**LM Studio connection failed:**
- Verify LM Studio is running
- Check server is on `http://localhost:1234`
- Ensure a model is loaded

**Slow embedding/inference:**
- Local embeddings: First run downloads model (~400MB), subsequent runs are fast
- Local LLM: Depends on your hardware (GPU recommended but not required)

## Limitations

- **Context Window**: Limited to ~6KB of context (4KB search + 2KB file content)
- **Code Languages**: Works best with well-documented code
- **Repo Size**: Very large repos (>100K files) may take time to ingest

## Future Improvements

- [ ] AST-based chunking for better code understanding
- [ ] Support for Ollama (alternative to LM Studio)
- [ ] Response caching
- [ ] Multi-repo search
- [ ] Code execution for verification

## Contributing

Contributions welcome! Feel free to open issues or PRs.

## License

MIT

## Author

Created as a portfolio project demonstrating RAG + Agentic AI capabilities with both local and cloud deployment options.

